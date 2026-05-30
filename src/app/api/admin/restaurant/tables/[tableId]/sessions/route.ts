import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── GET: sessions for a table ordered by openedAt desc ──────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId } = await params;

    const table = await prisma.table.findUnique({ where: { id: tableId } });
    if (!table) {
      return NextResponse.json({ error: "Mesa no encontrada" }, { status: 404 });
    }

    const sessions = await prisma.serviceSession.findMany({
      where: { tableId },
      orderBy: { openedAt: "desc" },
      include: {
        orders: {
          select: { id: true, status: true, total: true, createdAt: true,
            orderItems: { select: { id: true, status: true } },
          },
        },
      },
    });

    return NextResponse.json(sessions);
  } catch (err) {
    console.error("[GET /api/admin/restaurant/tables/[tableId]/sessions]", err);
    return NextResponse.json({ error: "Error al obtener sesiones" }, { status: 500 });
  }
}

// ─── POST: open a new session for the table ───────────────────────────────────
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId } = await params;

    const table = await prisma.table.findUnique({ where: { id: tableId } });
    if (!table) {
      return NextResponse.json({ error: "Mesa no encontrada" }, { status: 404 });
    }

    if (!table.isActive) {
      return NextResponse.json({ error: "Mesa inactiva" }, { status: 409 });
    }

    // Check for existing open session
    const existing = await prisma.serviceSession.findFirst({
      where: { tableId, status: "OPEN" },
    });
    if (existing) {
      return NextResponse.json(
        { error: "La mesa ya tiene una sesión abierta", sessionId: existing.id },
        { status: 409 }
      );
    }

    const session = await prisma.serviceSession.create({
      data: { tableId, status: "OPEN", type: "TABLE", label: table.name || ('Mesa ' + table.number) },
      include: { table: true },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/restaurant/tables/[tableId]/sessions]", err);
    return NextResponse.json({ error: "Error al abrir sesión" }, { status: 500 });
  }
}
