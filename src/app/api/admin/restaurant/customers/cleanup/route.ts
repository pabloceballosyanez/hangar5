import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/restaurant/customers/cleanup
 * Elimina clientes sin sesiones ni pagos (clientes fantasma).
 */
export async function POST(_req: NextRequest) {
  try {
    // Find customers with no sessions, no payments, and no ledger entries
    const allCustomers = await prisma.customer.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        _count: { select: { sessions: true, payments: true, ledgerEntries: true } },
      },
    });

    const toDelete = allCustomers.filter(
      (c) =>
        c._count.sessions === 0 &&
        c._count.payments === 0 &&
        c._count.ledgerEntries === 0
    );

    if (toDelete.length === 0) {
      return NextResponse.json({ deleted: 0, message: "No hay clientes fantasma" });
    }

    // Hard delete — no activity, no references
    const ids = toDelete.map((c) => c.id);
    await prisma.customer.deleteMany({ where: { id: { in: ids } } });

    return NextResponse.json({
      deleted: toDelete.length,
      customers: toDelete.map((c) => ({ id: c.id, name: c.name, email: c.email })),
    });
  } catch (err) {
    console.error("[POST /api/admin/restaurant/customers/cleanup]", err);
    return NextResponse.json({ error: "Error al limpiar clientes" }, { status: 500 });
  }
}
