import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/restaurant-types";

export const dynamic = "force-dynamic";

// Valid status transitions
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ["PLACED", "CANCELLED"],
  PLACED: ["IN_KITCHEN", "CANCELLED"],
  IN_KITCHEN: ["READY"],
  READY: ["SERVED"],
  SERVED: ["PAID"],
  PAID: [],
  CANCELLED: [],
};

const updateStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  paymentMethod: z.enum(["CASH", "CARD", "TRANSFER", "ON_ACCOUNT"]).optional(),
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

    const { status: newStatus, paymentMethod } = parsed.data;

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

    const result = await prisma.$transaction(async (tx) => {
      const statusEvent = await tx.orderStatusEvent.create({
        data: {
          orderId,
          fromStatus: currentStatus,
          toStatus: newStatus,
        },
      });

      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: newStatus },
        include: {
          orderItems: true,
          payments: true,
          serviceSession: { include: { table: true } },
        },
      });

      // When PAID: create payment only if paymentMethod is specified
      if (newStatus === "PAID" && paymentMethod) {
        // Complete any pending payment first
        const pendingPayment = updated.payments.find((p) => p.status === "PENDING");
        if (pendingPayment) {
          await tx.payment.update({
            where: { id: pendingPayment.id },
            data: { status: "COMPLETED", paidAt: new Date() },
          });
        } else {
          await tx.payment.create({
            data: {
              orderId,
              amount: order.total,
              method: paymentMethod,
              status: "COMPLETED",
              paidAt: new Date(),
            },
          });
        }

        // Auto-close session if all orders are now PAID (QR/TAB sessions without mesero)
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
          // Auto-close session when all orders are complete
          if (s?.status === "OPEN") {
            await tx.serviceSession.update({
              where: { id: updated.serviceSessionId },
              data: { status: "CLOSED", closedAt: new Date() },
            });
          }
        }
      }

      return { order: updated, statusEvent };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[PUT /api/admin/restaurant/orders/[orderId]/status]", err);
    return NextResponse.json({ error: "Error al actualizar estado de la orden" }, { status: 500 });
  }
}
