import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ORDER_ITEM_STATUSES, type OrderItemStatus } from "@/lib/restaurant-types";

export const dynamic = "force-dynamic";

const updateItemStatusSchema = z.object({
  status: z.enum(ORDER_ITEM_STATUSES),
});

// ─── PUT: update individual order item status ─────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string; itemId: string }> }
) {
  try {
    const { orderId, itemId } = await params;
    const body = await req.json();
    const parsed = updateItemStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { status: newStatus } = parsed.data;

    const orderItem = await prisma.orderItem.findUnique({
      where: { id: itemId },
    });
    if (!orderItem || orderItem.orderId !== orderId) {
      return NextResponse.json({ error: "Item no encontrado" }, { status: 404 });
    }

    const previousStatus = orderItem.status as OrderItemStatus;

    const result = await prisma.$transaction(async (tx) => {
      const updatedItem = await tx.orderItem.update({
        where: { id: itemId },
        data: { status: newStatus },
      });

      await tx.orderStatusEvent.create({
        data: {
          orderId,
          orderItemId: itemId,
          fromStatus: previousStatus,
          toStatus: newStatus,
        },
      });

      // Check if all items are READY or CANCELLED → update order to READY
      const allItems = await tx.orderItem.findMany({
        where: { orderId },
        select: { id: true, status: true },
      });

      const allDoneOrCancelled = allItems.every(
        (i) => i.status === "READY" || i.status === "CANCELLED"
      );
      const anyReady = allItems.some((i) => i.status === "READY");

      if (allDoneOrCancelled && anyReady) {
        const order = await tx.order.findUnique({
          where: { id: orderId },
          select: { status: true },
        });
        // Only auto-advance if order is in IN_KITCHEN state
        if (order?.status === "IN_KITCHEN") {
          await tx.orderStatusEvent.create({
            data: {
              orderId,
              fromStatus: "IN_KITCHEN",
              toStatus: "READY",
            },
          });
          await tx.order.update({
            where: { id: orderId },
            data: { status: "READY" },
          });
        }
      }

      return updatedItem;
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error(
      "[PUT /api/admin/restaurant/orders/[orderId]/items/[itemId]/status]",
      err
    );
    return NextResponse.json({ error: "Error al actualizar estado del item" }, { status: 500 });
  }
}
