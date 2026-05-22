import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function serializeTable(table: Record<string, unknown>) {
  return table;
}

// ─── GET: all tables ordered by number, include active session ───────────────
export async function GET() {
  try {
    const tables = await prisma.table.findMany({
      where: { isActive: true },
      orderBy: { number: "asc" },
      include: {
        sessions: {
          where: { status: "OPEN" },
          take: 1,
          include: {
            orders: {
              select: { id: true, status: true, total: true },
            },
          },
        },
      },
    });

    return NextResponse.json(tables.map(serializeTable));
  } catch (err) {
    console.error("[GET /api/admin/restaurant/tables]", err);
    return NextResponse.json({ error: "Error al obtener mesas" }, { status: 500 });
  }
}

// ─── POST: create table ───────────────────────────────────────────────────────
const createTableSchema = z.object({
  number: z.string().min(1),
  name: z.string().optional().nullable(),
  capacity: z.number().int().positive().default(2),
  location: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createTableSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { number, name, capacity, location } = parsed.data;

    // Check unique number
    const existing = await prisma.table.findUnique({ where: { number } });
    if (existing) {
      return NextResponse.json({ error: "Ya existe una mesa con ese número" }, { status: 409 });
    }

    const table = await prisma.table.create({
      data: {
        number,
        name,
        capacity,
        location,
        qrToken: crypto.randomUUID(),
      },
    });

    return NextResponse.json(table, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/restaurant/tables]", err);
    return NextResponse.json({ error: "Error al crear mesa" }, { status: 500 });
  }
}
