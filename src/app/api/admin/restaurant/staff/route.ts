import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET — listar staff activo (público, para pantalla de login)
export async function GET(req: NextRequest) {
  try {
    const staff = await prisma.staff.findMany({
      where: { isActive: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(staff);
  } catch (err) {
    console.error("[GET /api/admin/restaurant/staff]", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

// POST — crear/actualizar staff (admin)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, role, pin, phone, email, hourlyRate, isActive } = body;

    if (id) {
      const updated = await prisma.staff.update({
        where: { id },
        data: { name, role, pin, phone, email, hourlyRate, isActive },
      });
      return NextResponse.json(updated);
    }

    const created = await prisma.staff.create({
      data: { name, role: role || 'MESERO', pin: pin || '0000', phone, email, hourlyRate: hourlyRate || 0 },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/restaurant/staff]", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
