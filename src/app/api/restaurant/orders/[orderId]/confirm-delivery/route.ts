import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/restaurant/orders/[orderId]/confirm-delivery
 * Public endpoint — marks all READY items in an order as SERVED.
 * Guest confirms they received their order.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: { where: { status: "READY" }, select: { id: true, status: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    if (order.orderItems.length === 0) {
      return NextResponse.json({ message: "No hay ítems listos para confirmar" });
    }

    await prisma.$transaction(async (tx) => {
      for (const item of order.orderItems) {
        await tx.orderItem.update({
          where: { id: item.id },
          data: { status: "SERVED" },
        });
        await tx.orderStatusEvent.create({
          data: {
            orderId,
            orderItemId: item.id,
            fromStatus: "READY",
            toStatus: "SERVED",
          },
        });
      }

      // Check if all items are now SERVED → advance order to SERVED
      const allItems = await tx.orderItem.findMany({
        where: { orderId },
        select: { status: true },
      });
      const allServed = allItems.every(
        (i) => i.status === "SERVED" || i.status === "CANCELLED"
      );
      if (allServed && allItems.some((i) => i.status === "SERVED")) {
        await tx.order.update({
          where: { id: orderId },
          data: { status: "SERVED" },
        });
        await tx.orderStatusEvent.create({
          data: { orderId, fromStatus: order.status, toStatus: "SERVED" },
        });
      }
    });

    return NextResponse.json({ success: true, itemsMarked: order.orderItems.length });
  } catch (err) {
    console.error("[POST /api/restaurant/orders/[orderId]/confirm-delivery]", err);
    return NextResponse.json({ error: "Error al confirmar entrega" }, { status: 500 });
  }
}
