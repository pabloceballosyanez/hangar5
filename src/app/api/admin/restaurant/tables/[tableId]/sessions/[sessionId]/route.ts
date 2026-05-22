import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── PUT: close a session (only if all orders are PAID or CANCELLED) ──────────
export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ tableId: string; sessionId: string }> }
) {
  try {
    const { tableId, sessionId } = await params;

    const session = await prisma.tableSession.findUnique({
      where: { id: sessionId },
      include: {
        orders: { select: { id: true, status: true } },
      },
    });

    if (!session || session.tableId !== tableId) {
      return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
    }

    if (session.status === "CLOSED") {
      return NextResponse.json({ error: "La sesión ya está cerrada" }, { status: 409 });
    }

    // Verify all orders are PAID or CANCELLED
    const blockers = session.orders.filter(
      (o) => o.status !== "PAID" && o.status !== "CANCELLED"
    );
    if (blockers.length > 0) {
      return NextResponse.json(
        {
          error: "No se puede cerrar la sesión: hay órdenes pendientes",
          pendingOrders: blockers.map((o) => o.id),
        },
        { status: 409 }
      );
    }

    const updated = await prisma.tableSession.update({
      where: { id: sessionId },
      data: { status: "CLOSED", closedAt: new Date() },
      include: { table: true, orders: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(
      "[PUT /api/admin/restaurant/tables/[tableId]/sessions/[sessionId]]",
      err
    );
    return NextResponse.json({ error: "Error al cerrar sesión" }, { status: 500 });
  }
}
