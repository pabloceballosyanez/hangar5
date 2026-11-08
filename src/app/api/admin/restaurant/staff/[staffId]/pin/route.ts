import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffSession, getAdminSession } from "@/lib/auth";
import { puede } from "@/lib/permisos";
import { generarPin, hashearPin } from "@/lib/pines";

export const dynamic = "force-dynamic";

/** Quién puede tocar los PIN ajenos: super admin y gerente. */
async function autorizado(req: NextRequest): Promise<boolean> {
  if (getAdminSession(req)) return true;
  const sesion = getStaffSession(req);
  return !!sesion && puede(sesion.role, "configuracion");
}

/**
 * POST /api/admin/restaurant/staff/[staffId]/pin
 *
 * Restablece el PIN de alguien. El sistema genera uno nuevo, lo devuelve
 * UNA vez en claro para que se lo digas, y deja marcado que esa persona
 * tiene que elegir el suyo al entrar.
 *
 * No se permite que alguien se resteablezca su propio PIN por aquí: si
 * ya está dentro, que lo cambie en /mi-pin conociendo el actual.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ staffId: string }> }
) {
  if (!(await autorizado(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { staffId } = await params;

  const sesion = getStaffSession(req);
  if (sesion && sesion.staffId === staffId) {
    return NextResponse.json(
      { error: "Tu propio PIN se cambia en /mi-pin" },
      { status: 400 }
    );
  }

  const staff = await prisma.staff.findUnique({ where: { id: staffId } });
  if (!staff) {
    return NextResponse.json({ error: "Esa persona no existe" }, { status: 404 });
  }

  // Los PINs de todos para no repetir ninguno
  const otros = await prisma.staff.findMany({
    where: { id: { not: staffId }, pin: { not: null } },
    select: { pin: true },
  });
  const hashes = otros.map((o) => o.pin!).filter(Boolean);

  const pin = generarPin(hashes);

  await prisma.staff.update({
    where: { id: staffId },
    data: {
      pin: hashearPin(pin),
      debeCambiarPin: true,
      pinActualizadoAt: new Date(),
    },
  });

  return NextResponse.json({
    ok: true,
    nombre: staff.name,
    /* En claro solo aquí. No se puede volver a consultar: si se pierde,
       hay que generar otro. */
    pin,
  });
}
