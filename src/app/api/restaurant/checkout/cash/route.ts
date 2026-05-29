import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/restaurant/checkout/cash
 * Body: { orderId: string }
 * Marks the order for cash payment, moves directly to IN_KITCHEN.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId } = body as { orderId?: string };

    if (!orderId) {
      return NextResponse.json({ error: "orderId requerido" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true, serviceSession: { include: { table: true } } },
    });

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    if (order.status !== "PLACED" && order.status !== "DRAFT") {
      return NextResponse.json({ error: "La orden ya fue procesada" }, { status: 409 });
    }

    await prisma.$transaction(async (tx) => {
      // Move order to IN_KITCHEN
      await tx.orderStatusEvent.create({
        data: { orderId, fromStatus: order.status, toStatus: "IN_KITCHEN" },
      });
      await tx.order.update({
        where: { id: orderId },
        data: { status: "IN_KITCHEN" },
      });

      // Create pending cash payment (staff confirms later)
      await tx.payment.create({
        data: {
          orderId,
          amount: order.total,
          method: "CASH",
          status: "PENDING",
        },
      });
    });

    const qrToken = order.serviceSession.table?.qrToken || "t1";

    return NextResponse.json({
      success: true,
      redirectUrl: `/menu/${qrToken}/confirmation?orderId=${orderId}&status=cash`,
    });
  } catch (err) {
    console.error("[POST /api/restaurant/checkout/cash]", err);
    return NextResponse.json({ error: "Error al procesar pago en efectivo" }, { status: 500 });
  }
}
