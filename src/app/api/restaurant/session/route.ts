import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/restaurant/session?qrToken=xxx
 *
 * Public endpoint: resolves a QR token to the corresponding table
 * and returns (or creates) an open ServiceSession for it.
 *
 * Response:
 *   { tableId, tableNumber, tableName, tableLocation, serviceSessionId }
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

    // Find existing open session or create a new one
    let session = await prisma.serviceSession.findFirst({
      where: { tableId: table.id, status: "OPEN" },
      orderBy: { openedAt: "desc" },
    });

    if (!session) {
      session = await prisma.serviceSession.create({
        data: { tableId: table.id, status: "OPEN", type: "TABLE", label: table.name || ('Mesa ' + table.number) },
      });
    }

    return NextResponse.json({
      tableId: table.id,
      tableNumber: table.number,
      tableName: table.name ?? null,
      tableLocation: table.location ?? null,
      serviceSessionId: session.id,
    });
  } catch (err) {
    console.error("[GET /api/restaurant/session]", err);
    return NextResponse.json(
      { error: "Error al obtener sesión de mesa" },
      { status: 500 }
    );
  }
}
