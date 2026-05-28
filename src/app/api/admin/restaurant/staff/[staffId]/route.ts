import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ staffId: string }> };

function serialize(s: Record<string, unknown>) {
  return { ...s, hourlyRate: typeof s.hourlyRate === "number" ? s.hourlyRate / 100 : s.hourlyRate };
}

// ─── GET: one staff member ───────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { staffId } = await params;
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: {
        shifts: { orderBy: { startTime: "desc" }, take: 30 },
        clocks: { orderBy: { timestamp: "desc" }, take: 30 },
      },
    });
    if (!staff) {
      return NextResponse.json({ error: "Staff no encontrado" }, { status: 404 });
    }
    return NextResponse.json(serialize(staff as unknown as Record<string, unknown>));
  } catch (err) {
    console.error("[GET /api/admin/restaurant/staff/[staffId]]", err);
    return NextResponse.json({ error: "Error al obtener staff" }, { status: 500 });
  }
}

// ─── PUT: update staff ───────────────────────────────────────────────────────
const updateStaffSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.string().optional(),
  pin: z.string().optional(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  hourlyRate: z.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { staffId } = await params;
    const body = await req.json();
    const parsed = updateStaffSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.staff.findUnique({ where: { id: staffId } });
    if (!existing) {
      return NextResponse.json({ error: "Staff no encontrado" }, { status: 404 });
    }

    const data: Record<string, unknown> = { ...parsed.data };
    if (data.email !== undefined) data.email = data.email || null;
    if (data.phone !== undefined) data.phone = data.phone || null;
    if (typeof data.hourlyRate === "number") data.hourlyRate = Math.round(data.hourlyRate * 100);

    const updated = await prisma.staff.update({
      where: { id: staffId },
      data,
    });

    return NextResponse.json(serialize(updated as unknown as Record<string, unknown>));
  } catch (err) {
    console.error("[PUT /api/admin/restaurant/staff/[staffId]]", err);
    return NextResponse.json({ error: "Error al actualizar staff" }, { status: 500 });
  }
}

// ─── DELETE: remove staff ────────────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { staffId } = await params;

    const existing = await prisma.staff.findUnique({ where: { id: staffId } });
    if (!existing) {
      return NextResponse.json({ error: "Staff no encontrado" }, { status: 404 });
    }

    await prisma.staff.delete({ where: { id: staffId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/restaurant/staff/[staffId]]", err);
    return NextResponse.json({ error: "Error al eliminar staff" }, { status: 500 });
  }
}
