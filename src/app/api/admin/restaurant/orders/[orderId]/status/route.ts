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

    const { status: newStatus } = parsed.data;

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

      // When PAID, create payment if not exists
      if (newStatus === "PAID" && !updated.payments[0]) {
        await tx.payment.create({
          data: {
            orderId,
            amount: order.total,
            method: "CASH",
            status: "COMPLETED",
            paidAt: new Date(),
          },
        });
      }

      return { order: updated, statusEvent };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[PUT /api/admin/restaurant/orders/[orderId]/status]", err);
    return NextResponse.json({ error: "Error al actualizar estado de la orden" }, { status: 500 });
  }
}
