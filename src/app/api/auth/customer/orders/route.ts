import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/customer/orders
 * Returns orders linked to the logged-in customer (via ServiceSession.customerId).
 */
export async function GET(req: NextRequest) {
  try {
    const session = getCustomerSession(req);
    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Find all service sessions linked to this customer
    const sessions = await prisma.serviceSession.findMany({
      where: { customerId: session.customerId },
      select: { id: true },
    });

    const sessionIds = sessions.map((s) => s.id);

    const orders = await prisma.order.findMany({
      where: { serviceSessionId: { in: sessionIds } },
      orderBy: { createdAt: "desc" },
      include: {
        orderItems: {
          select: {
            quantity: true,
            menuItem: { select: { name: true } },
            variant: { select: { name: true } },
          },
        },
      },
    });

    // Serialize: convert centavos to pesos
    const serialized = orders.map((o) => ({
      ...o,
      subtotal: o.subtotal / 100,
      tax: o.tax / 100,
      total: o.total / 100,
    }));

    return NextResponse.json(serialized);
  } catch (err) {
    console.error("[GET /api/auth/customer/orders]", err);
    return NextResponse.json({ error: "Error al obtener órdenes" }, { status: 500 });
  }
}
