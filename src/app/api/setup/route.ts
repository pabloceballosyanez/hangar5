import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/setup — crear SUPER_ADMIN inicial (solo si no existe)
export async function POST(req: NextRequest) {
  try {
    const existing = await prisma.staff.findFirst({ where: { role: "SUPER_ADMIN" } });
    if (existing) {
      return NextResponse.json({ message: "Ya existe un SUPER_ADMIN", existing: { id: existing.id, name: existing.name } });
    }

    const admin = await prisma.staff.create({
      data: {
        name: "Pablo Ceballos",
        role: "SUPER_ADMIN",
        pin: "0000",
        email: "pabloceballosy@gmail.com",
        hourlyRate: 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: "SUPER_ADMIN creado. PIN: 0000. ¡Cámbialo ya!",
      staff: { id: admin.id, name: admin.name, role: admin.role },
    });
  } catch (err) {
    console.error("[POST /api/setup]", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
