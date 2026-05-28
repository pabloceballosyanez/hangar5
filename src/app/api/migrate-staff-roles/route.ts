import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Mapeo de roles viejos a nuevos
const ROLE_MAP: Record<string, string> = {
  ADMIN: "SUPER_ADMIN",
  WAITER: "MESERO",
  COOK: "COCINERO",
  BARTENDER: "BAR",
  MANAGER: "GERENTE",
};

// POST — migrar roles viejos a nuevo enum
export async function POST(req: NextRequest) {
  try {
    const staff = await prisma.staff.findMany();
    let updated = 0;

    for (const s of staff) {
      const newRole = ROLE_MAP[s.role as string] || s.role;
      if (newRole !== s.role) {
        // Usar raw SQL porque el enum de Prisma no acepta los valores viejos
        await prisma.$executeRawUnsafe(
          `UPDATE Staff SET role = ? WHERE id = ?`,
          newRole,
          s.id
        );
        updated++;
      }
    }

    // También asegurar que todos tengan PIN
    await prisma.$executeRawUnsafe(
      `UPDATE Staff SET pin = '0000' WHERE pin IS NULL OR pin = ''`
    );

    return NextResponse.json({
      success: true,
      message: `${updated} roles migrados, PINs por defecto asignados`,
      updated,
    });
  } catch (err) {
    console.error("[POST /api/migrate-staff-roles]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
