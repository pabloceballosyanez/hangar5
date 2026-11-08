import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffSession, hashPassword, verifyPassword } from "@/lib/auth";
import { pinEsValido } from "@/lib/pines";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/pin — la persona cambia su propio PIN.
 *
 * Pide el PIN actual aunque haya entrado recién: así, si alguien deja la
 * tablet abierta, otro no puede apropiarse de la cuenta cambiándole la
 * clave.
 */
export async function POST(req: NextRequest) {
  const sesion = getStaffSession(req);
  if (!sesion) {
    return NextResponse.json({ error: "No hay sesión" }, { status: 401 });
  }

  let body: { pinActual?: string; pinNuevo?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const { pinActual, pinNuevo } = body;
  if (!pinActual || !pinNuevo) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const staff = await prisma.staff.findUnique({ where: { id: sesion.staffId } });
  if (!staff || !staff.pin) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  // El PIN actual se guarda hasheado; las cuentas viejas pueden tenerlo plano
  const actualOk = staff.pin.includes(":")
    ? verifyPassword(pinActual, staff.pin)
    : staff.pin === pinActual;

  if (!actualOk) {
    return NextResponse.json({ error: "Tu PIN actual no coincide" }, { status: 401 });
  }

  const validez = pinEsValido(pinNuevo);
  if (!validez.ok) {
    return NextResponse.json({ error: validez.motivo }, { status: 400 });
  }

  if (pinNuevo === pinActual) {
    return NextResponse.json(
      { error: "El PIN nuevo tiene que ser distinto al actual" },
      { status: 400 }
    );
  }

  /* Nadie más puede tener ese PIN: si dos personas comparten clave, el
     registro de quién hizo qué deja de servir. Se compara contra todos
     los demás hashes. */
  const otros = await prisma.staff.findMany({
    where: { id: { not: staff.id }, pin: { not: null } },
    select: { name: true, pin: true },
  });

  const repetido = otros.find((o) =>
    o.pin!.includes(":") ? verifyPassword(pinNuevo, o.pin!) : o.pin === pinNuevo
  );

  if (repetido) {
    // No se dice de quién es: eso filtraría información de otra persona
    return NextResponse.json(
      { error: "Ese PIN ya lo usa alguien más. Elige otro." },
      { status: 409 }
    );
  }

  await prisma.staff.update({
    where: { id: staff.id },
    data: {
      pin: hashPassword(pinNuevo),
      debeCambiarPin: false,
      pinActualizadoAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
