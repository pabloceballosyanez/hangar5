import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { notifyOrderReady } from "@/lib/whatsapp";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/restaurant-types";

export const dynamic = "force-dynamic";

// Valid status transitions
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ["PLACED", "CANCELLED"],
  AWAITING_PAYMENT: ["IN_KITCHEN", "CANCELLED"],
  PLACED: ["IN_KITCHEN", "CANCELLED"],
  IN_KITCHEN: ["READY", "CANCELLED"],
  READY: ["SERVED", "CANCELLED"],
  SERVED: ["PAID"],
  PAID: [],
  CANCELLED: [],
};

const updateStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  paymentMethod: z.enum(["CASH", "CARD", "TRANSFER", "ON_ACCOUNT"]).optional(),
  supervisorPin: z.string().optional(),
  reason: z.string().optional(),
});

// ─── PUT: update order status ─────────────────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await req.json();
    const parsed = updateStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { status: newStatus, paymentMethod, supervisorPin, reason } = parsed.data;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    const currentStatus = order.status as OrderStatus;
    const allowed = TRANSITIONS[currentStatus];

    if (!allowed.includes(newStatus)) {
      return NextResponse.json(
        {
          error: `Transición inválida: ${currentStatus} → ${newStatus}`,
          allowedTransitions: allowed,
        },
        { status: 409 }
      );
    }

    // 🔒 Cancelación requiere autorización de supervisor + motivo obligatorio
    if (newStatus === "CANCELLED") {
      const supervisorPw = process.env.ADMIN_PASSWORD;
      if (!supervisorPin || supervisorPin !== supervisorPw) {
        return NextResponse.json({ error: "PIN de supervisor incorrecto" }, { status: 403 });
      }
      if (!reason || !reason.trim()) {
        return NextResponse.json({ error: "Se requiere un motivo para cancelar la orden" }, { status: 400 });
      }
    }

    // 🔒 Validate IN_KITCHEN → READY: all items must be READY/SERVED/CANCELLED
    if (currentStatus === "IN_KITCHEN" && newStatus === "READY") {
      const items = await prisma.orderItem.findMany({
        where: { orderId },
        select: { id: true, status: true },
      });
      const pendingItems = items.filter(
        (i) => i.status !== "READY" && i.status !== "SERVED" && i.status !== "CANCELLED"
      );
      if (pendingItems.length > 0) {
        return NextResponse.json(
          {
            error: `No se puede forzar a READY: ${pendingItems.length} ítem(s) aún no están listos`,
            pendingItems: pendingItems.map((i) => i.id),
          },
          { status: 409 }
        );
      }
    }

    // Pre-validate ON_ACCOUNT: must have a customer with credit (before transaction)
    if (newStatus === "PAID" && paymentMethod === "ON_ACCOUNT") {
      const sessionWithCustomer = await prisma.serviceSession.findUnique({
        where: { id: order.serviceSessionId ?? "" },
        select: { customerId: true, customer: { select: { id: true, name: true, hasCredit: true } } },
      });
      if (!sessionWithCustomer?.customerId) {
        return NextResponse.json(
          { error: "No hay cliente asociado para cargo a cuenta" },
          { status: 400 }
        );
      }
      if (!sessionWithCustomer.customer?.hasCredit) {
        return NextResponse.json(
          { error: "El cliente no tiene crédito habilitado" },
          { status: 400 }
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const statusEvent = await tx.orderStatusEvent.create({
        data: {
          orderId,
          fromStatus: currentStatus,
          toStatus: newStatus,
          actorName: newStatus === "CANCELLED" ? "Supervisor" : null,
          reason: newStatus === "CANCELLED" ? (reason?.trim() || null) : null,
        },
      });

      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: newStatus },
        include: {
          orderItems: true,
          payments: true,
          serviceSession: { include: { table: true, customer: true } },
          table: true,
        },
      });

      // When PAID: create payment only if paymentMethod is specified
      if (newStatus === "PAID" && paymentMethod) {
        // ON_ACCOUNT: create ledger entry for the customer (already validated before transaction)
        if (paymentMethod === "ON_ACCOUNT") {
          const customerId = updated.serviceSession?.customerId!;
          await tx.customerLedgerEntry.create({
            data: {
              customerId,
              amount: order.total,
              type: "CHARGE",
              serviceSessionId: updated.serviceSessionId,
              note: `Orden #${order.id.slice(-6)}`,
            },
          });
        }

        // Complete any pending payment first
        const pendingPayment = updated.payments.find((p) => p.status === "PENDING");
        if (pendingPayment) {
          await tx.payment.update({
            where: { id: pendingPayment.id },
            data: {
              status: "COMPLETED",
              paidAt: new Date(),
              method: pendingPayment.method === "MP" ? paymentMethod : pendingPayment.method,
            },
          });
        } else {
          await tx.payment.create({
            data: {
              orderId,
              amount: order.total,
              method: paymentMethod,
              status: "COMPLETED",
              paidAt: new Date(),
              ...(paymentMethod === "ON_ACCOUNT" && updated.serviceSession?.customerId
                ? { customerId: updated.serviceSession.customerId }
                : {}),
            },
          });
        }

        // Auto-close session if all orders are now PAID (only if order has a session)
        if (updated.serviceSessionId) {
          const sessionOrders = await tx.order.findMany({
            where: { serviceSessionId: updated.serviceSessionId },
            select: { status: true },
          });
          const allDone = sessionOrders.every(o => o.status === "PAID" || o.status === "CANCELLED");
          if (allDone) {
            const s = await tx.serviceSession.findUnique({
              where: { id: updated.serviceSessionId },
              select: { type: true, status: true },
            });
            if (s?.status === "OPEN") {
              await tx.serviceSession.update({
                where: { id: updated.serviceSessionId },
                data: { status: "CLOSED", closedAt: new Date() },
              });
            }
          }
        }
      }

      // Auto-advance to PAID if payment is already completed
      if (newStatus === "SERVED") {
        const hasCompletedPayment = updated.payments?.some(
          (p) => p.status === "COMPLETED"
        );
        if (hasCompletedPayment) {
          await tx.orderStatusEvent.create({
            data: { orderId, fromStatus: "SERVED", toStatus: "PAID" },
          });
          await tx.order.update({
            where: { id: orderId },
            data: { status: "PAID" },
          });
          // Close session if all orders PAID/CANCELLED
          if (updated.serviceSessionId) {
            const sessionOrders = await tx.order.findMany({
              where: { serviceSessionId: updated.serviceSessionId },
              select: { status: true },
            });
            const allDone = sessionOrders.every(
              (o) => o.status === "PAID" || o.status === "CANCELLED"
            );
            if (allDone) {
              const s = await tx.serviceSession.findUnique({
                where: { id: updated.serviceSessionId },
                select: { status: true },
              });
              if (s?.status === "OPEN") {
                await tx.serviceSession.update({
                  where: { id: updated.serviceSessionId },
                  data: { status: "CLOSED", closedAt: new Date() },
                });
              }
            }
          }
        }
      }

      return { order: updated, statusEvent };
    });

    // ── WhatsApp: aviso al cliente cuando su pedido está listo ──────────────
    // Fire-and-forget: nunca bloquea ni rompe el flujo de cocina.
    if (newStatus === "READY") {
      void notifyOrderReady(orderId);
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[PUT /api/admin/restaurant/orders/[orderId]/status]", err);
    return NextResponse.json({ error: "Error al actualizar estado de la orden" }, { status: 500 });
  }
}
