import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── GET: single table with recent sessions ───────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId } = await params;

    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: {
        sessions: {
          orderBy: { openedAt: "desc" },
          take: 10,
          include: {
            orders: {
              select: { id: true, status: true, total: true, createdAt: true },
            },
          },
        },
      },
    });

    if (!table) {
      return NextResponse.json({ error: "Mesa no encontrada" }, { status: 404 });
    }

    return NextResponse.json(table);
  } catch (err) {
    console.error("[GET /api/admin/restaurant/tables/[tableId]]", err);
    return NextResponse.json({ error: "Error al obtener mesa" }, { status: 500 });
  }
}

// ─── PUT: update table ────────────────────────────────────────────────────────
const updateTableSchema = z.object({
  number: z.string().min(1).optional(),
  name: z.string().optional().nullable(),
  capacity: z.number().int().positive().optional(),
  location: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId } = await params;
    const body = await req.json();
    const parsed = updateTableSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const table = await prisma.table.findUnique({ where: { id: tableId } });
    if (!table) {
      return NextResponse.json({ error: "Mesa no encontrada" }, { status: 404 });
    }

    // If changing number, ensure uniqueness
    if (parsed.data.number && parsed.data.number !== table.number) {
      const conflict = await prisma.table.findUnique({
        where: { number: parsed.data.number },
      });
      if (conflict) {
        return NextResponse.json(
          { error: "Ya existe una mesa con ese número" },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.table.update({
      where: { id: tableId },
      data: parsed.data,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PUT /api/admin/restaurant/tables/[tableId]]", err);
    return NextResponse.json({ error: "Error al actualizar mesa" }, { status: 500 });
  }
}

// ─── DELETE: soft-delete (isActive=false) if no open sessions ────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId } = await params;

    const table = await prisma.table.findUnique({ where: { id: tableId } });
    if (!table) {
      return NextResponse.json({ error: "Mesa no encontrada" }, { status: 404 });
    }

    const openSession = await prisma.serviceSession.findFirst({
      where: { tableId, status: "OPEN" },
    });
    if (openSession) {
      return NextResponse.json(
        { error: "No se puede eliminar una mesa con sesión activa" },
        { status: 409 }
      );
    }

    await prisma.table.update({ where: { id: tableId }, data: { isActive: false } });

    return NextResponse.json({ message: "Mesa desactivada" });
  } catch (err) {
    console.error("[DELETE /api/admin/restaurant/tables/[tableId]]", err);
    return NextResponse.json({ error: "Error al eliminar mesa" }, { status: 500 });
  }
}
