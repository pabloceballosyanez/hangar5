import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { notifyOrderReady } from "@/lib/whatsapp";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/restaurant-types";
import { verifyPassword } from "@/lib/auth";
import { puede } from "@/lib/permisos";
import { repartirCancelacion, type RepartoCancelacion } from "@/lib/cancelacion";

export const dynamic = "force-dynamic";

/**
 * ¿La clave que escribieron autoriza una cancelación?
 *
 * Vale la contraseña maestra del dueño, o el PIN de alguien con acceso al
 * panel (gerente). Se compara contra el hash, nunca en claro.
 */
async function autorizarCancelacion(clave: string | undefined): Promise<boolean> {
  if (!clave) return false;

  // La llave del dueño
  const maestra = process.env.ADMIN_PASSWORD;
  if (maestra && clave === maestra) return true;

  // Solo un PIN de 4 dígitos puede ser el de alguien del equipo
  if (!/^\d{4}$/.test(clave)) return false;

  const candidatos = await prisma.staff.findMany({
    where: { isActive: true, pin: { not: null } },
    select: { role: true, pin: true },
  });

  return candidatos.some(
    (c) =>
      puede(c.role, "admin") &&
      (c.pin!.includes(":") ? verifyPassword(clave, c.pin!) : c.pin === clave)
  );
}

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

    /* 🔒 Cancelar una orden pide la autorización de alguien que manda.
       Antes se comparaba contra ADMIN_PASSWORD, la contraseña maestra
       completa: el campo decía "PIN de supervisor", así que el gerente
       tecleaba sus 4 dígitos y no pasaba nada.

       Ahora vale cualquiera de las dos:
         · la contraseña maestra (el dueño)
         · el PIN de un SUPER_ADMIN o GERENTE (Cheny)
       Y se revisa contra el hash, no en claro. */
    /* Qué se cancela de verdad.
       Cancelar la orden entera cuando ya se entregaron platillos hace que
       el sistema diga "no se cobra" sobre comida que el cliente ya se
       comió. Aquí se reparte: lo pendiente se cancela, lo servido se
       queda y se cobra. */
    let reparto: RepartoCancelacion | null = null;

    if (newStatus === "CANCELLED") {
      const autorizado = await autorizarCancelacion(supervisorPin);
      if (!autorizado) {
        return NextResponse.json(
          { error: "Se necesita la clave de un gerente o del dueño" },
          { status: 403 }
        );
      }

      const items = await prisma.orderItem.findMany({
        where: { orderId },
        select: { id: true, status: true, quantity: true, unitPrice: true },
      });
      reparto = repartirCancelacion(items);

      /* Si no hay nada entregado, se cancela todo como siempre. Si hay
         algo servido, abajo se decide el estado final. */
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
        select: { customerId: true, customer: { select: { id: true, name: true, hasCredit: true, creditLimit: true } } },
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
      // Validar límite de crédito (si está definido)
      const creditLimit = sessionWithCustomer.customer.creditLimit;
      if (creditLimit != null) {
        const ledgerSum = await prisma.customerLedgerEntry.aggregate({
          where: { customerId: sessionWithCustomer.customerId },
          _sum: { amount: true },
        });
        const currentBalance = ledgerSum._sum.amount || 0;
        if (currentBalance + order.total > creditLimit) {
          return NextResponse.json(
            {
              error: `Límite de crédito excedido (saldo actual: $${(currentBalance / 100).toFixed(2)}, límite: $${(creditLimit / 100).toFixed(2)})`,
            },
            { status: 400 }
          );
        }
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      /* Cancelación parcial.
         Se cancelan los ítems pendientes y los servidos se quedan. El
         estado de la orden depende de qué sobreviva:
           · nada cobrable  → CANCELLED (como siempre)
           · algo cobrable  → SERVED, porque ya se entregó y falta cobrar */
      const estadoFinal =
        newStatus === "CANCELLED" && reparto && !reparto.todoCancelado
          ? "SERVED"
          : newStatus;

      if (newStatus === "CANCELLED" && reparto && reparto.seCancelan.length > 0) {
        await tx.orderItem.updateMany({
          where: { id: { in: reparto.seCancelan.map((i) => i.id) } },
          data: { status: "CANCELLED" },
        });
      }

      /* Recalcular el total cuando se cancela algo.
         Antes el total se quedaba congelado: cancelar una pizza de $280
         dejaba ese dinero en la cuenta aunque la pizza ya no se sirviera.
         El cliente pagaba lo que no consumió.
         Ahora el total es la suma de lo que sobrevive. */
      let nuevoTotal: number | undefined;
      let nuevoSubtotal: number | undefined;

      if (newStatus === "CANCELLED" && reparto) {
        const vivos = await tx.orderItem.findMany({
          where: { orderId, status: { not: "CANCELLED" } },
          select: { quantity: true, unitPrice: true },
        });
        nuevoSubtotal = vivos.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
        /* El IVA se recalcula con la misma proporción que tenía la orden,
           para no inventar tasas: si el total era subtotal + impuesto, se
           mantiene esa relación sobre el nuevo subtotal. */
        const ivaPrevio = (await tx.order.findUnique({
          where: { id: orderId },
          select: { tax: true, subtotal: true },
        }));
        const tasa = ivaPrevio && ivaPrevio.subtotal > 0
          ? ivaPrevio.tax / ivaPrevio.subtotal
          : 0;
        const nuevoTax = Math.round(nuevoSubtotal * tasa);
        nuevoTotal = nuevoSubtotal + nuevoTax;
      }

      const statusEvent = await tx.orderStatusEvent.create({
        data: {
          orderId,
          fromStatus: currentStatus,
          toStatus: estadoFinal,
          actorName: newStatus === "CANCELLED" ? "Supervisor" : null,
          reason:
            newStatus === "CANCELLED"
              ? [
                  reason?.trim() || null,
                  reparto && !reparto.todoCancelado
                    ? `Cancelación parcial: ${reparto.seCancelan.length} ítem(s) cancelados, ` +
                      `${reparto.seCobran.length} entregados se cobran`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || null
              : null,
        },
      });

      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: estadoFinal,
          ...(nuevoTotal !== undefined ? { total: nuevoTotal } : {}),
          ...(nuevoSubtotal !== undefined ? { subtotal: nuevoSubtotal } : {}),
        },
        include: {
          orderItems: true,
          payments: true,
          serviceSession: { include: { table: true, customer: true } },
          table: true,
        },
      });

      // When PAID: create payment only if paymentMethod is specified
      if (newStatus === "PAID" && paymentMethod) {
        /* Saldar una deuda de crédito.
           Cuando el pedido se cargó a la cuenta del huésped quedó un
           pago PENDING con método ON_ACCOUNT, y un cargo en su ledger.
           Al venir a pagarlo hay que hacer DOS cosas, no una:
             · cerrar ese pago pendiente con el método real (efectivo,
               tarjeta…), para que el reporte sepa cómo entró el dinero
             · registrar un ABONO en el ledger, para que su saldo baje
           Antes solo se creaba un pago nuevo y la deuda seguía viva:
           el huésped aparecía debiendo algo que ya había pagado. */
        const pending = updated.payments.find((p) => p.status === "PENDING");
        const saldandoCredito = pending?.method === "ON_ACCOUNT";

        if (saldandoCredito && updated.serviceSession?.customerId) {
          await tx.customerLedgerEntry.create({
            data: {
              customerId: updated.serviceSession.customerId,
              amount: -order.total, // negativo = pago, baja el saldo
              type: "PAYMENT",
              serviceSessionId: updated.serviceSessionId,
              note: `Pago de orden #${order.id.slice(-6)}`,
            },
          });
        } else if (paymentMethod === "ON_ACCOUNT") {
          const customerId = updated.serviceSession?.customerId;
          if (customerId) {
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
        }

        // Complete any pending payment first
        if (pending) {
          await tx.payment.update({
            where: { id: pending.id },
            data: {
              status: "COMPLETED",
              paidAt: new Date(),
              // Si se está saldando un crédito, se guarda cómo entró
              // el dinero de verdad; si no, se respeta el método.
              method: saldandoCredito ? paymentMethod : pending.method === "MP" ? paymentMethod : pending.method,
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
