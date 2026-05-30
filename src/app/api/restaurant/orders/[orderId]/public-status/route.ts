import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/restaurant/orders/[orderId]/public-status
 * Public read-only endpoint — returns order status + item details.
 * No auth required (guests checking their order status).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        subtotal: true,
        tax: true,
        total: true,
        createdAt: true,
        orderItems: {
          select: {
            id: true,
            status: true,
            quantity: true,
            menuItem: { select: { name: true } },
            variant: { select: { name: true } },
            specialInstructions: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      ...order,
      subtotal: order.subtotal / 100,
      tax: order.tax / 100,
      total: order.total / 100,
    });
  } catch (err) {
    console.error("[GET /api/restaurant/orders/[orderId]/public-status]", err);
    return NextResponse.json({ error: "Error al obtener orden" }, { status: 500 });
  }
}
