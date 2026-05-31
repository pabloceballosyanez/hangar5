import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/restaurant/session?qrToken=xxx
 *
 * Public endpoint: resolves a QR token to the corresponding table.
 * NO LONGER creates a ServiceSession — QR orders link directly to the table.
 *
 * Response:
 *   { tableId, tableNumber, tableName, tableLocation }
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const qrToken = searchParams.get("qrToken");

    if (!qrToken) {
      return NextResponse.json({ error: "qrToken requerido" }, { status: 400 });
    }

    const table = await prisma.table.findUnique({ where: { qrToken } });

    if (!table) {
      return NextResponse.json({ error: "Mesa no encontrada" }, { status: 404 });
    }

    if (!table.isActive) {
      return NextResponse.json({ error: "Mesa fuera de servicio" }, { status: 409 });
    }

    // Return table info only — no session creation for QR orders
    return NextResponse.json({
      tableId: table.id,
      tableNumber: table.number,
      tableName: table.name ?? null,
      tableLocation: table.location ?? null,
    });
  } catch (err) {
    console.error("[GET /api/restaurant/session]", err);
    return NextResponse.json(
      { error: "Error al obtener información de mesa" },
      { status: 500 }
    );
  }
}
