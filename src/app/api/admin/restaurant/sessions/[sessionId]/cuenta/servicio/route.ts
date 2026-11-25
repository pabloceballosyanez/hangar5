import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/restaurant/sessions/[sessionId]/cuenta/servicio
 *
 * Agrega un servicio (vuelo, renta de moto o bici) a una cuenta ABIERTA.
 * Es el caso que describió Pablo: alguien está comiendo, ve volar a otros y
 * pide un vuelo ahí mismo. Lo cómodo es cargarlo a la cuenta que ya tiene
 * abierta, no abrirle un cobro aparte.
 *
 * Decisiones:
 *  · El precio se CONGELA al momento de vender. Si mañana sube la tarifa,
 *    esta cuenta no cambia.
 *  · Solo cuentas abiertas: una cerrada ya se cobró y no se le puede
 *    agregar nada.
 *  · Queda en ServicioCuenta, que el cierre de sesión ya suma al total.
 */
const schema = z.object({
  itemId: z.string().min(1),
  cantidad: z.number().int().positive().default(1),
  /* Cuándo se usa: la fecha del vuelo o del día de renta. Opcional. */
  fechaServicio: z.string().nullable().optional(),
  notas: z.string().nullable().optional(),
});

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ sessionId: string }> }
) {
  if (!getAdminSession(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { sessionId } = await ctx.params;

  const cuerpo = await req.json().catch(() => null);
  const parseo = schema.safeParse(cuerpo);
  if (!parseo.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalle: parseo.error.flatten() },
      { status: 400 }
    );
  }

  const { itemId, cantidad, fechaServicio, notas } = parseo.data;

  const sesion = await prisma.serviceSession.findUnique({
    where: { id: sessionId },
    select: { id: true, status: true, customerId: true, label: true },
  });

  if (!sesion) {
    return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
  }

  if (sesion.status !== "OPEN") {
    return NextResponse.json(
      { error: "La cuenta ya está cerrada. Abre una nueva para agregar servicios." },
      { status: 409 }
    );
  }

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item || !item.active) {
    return NextResponse.json({ error: "Ese servicio no existe o está inactivo" }, { status: 404 });
  }

  /* El precio del catálogo manda. Se copia aquí y ya no se toca: la cuenta
     conserva lo que se cotizó al cliente ese día. */
  const precioUnitario = item.price;
  const total = precioUnitario * cantidad;

  const servicio = await prisma.servicioCuenta.create({
    data: {
      serviceSessionId: sessionId,
      itemId: item.id,
      /* La descripción se congela junto con el precio: si el catálogo
         cambia de nombre, esta cuenta sigue diciendo lo que se vendió. */
      descripcion: item.name,
      cantidad,
      precioUnitario,
      total,
      fechaServicio: fechaServicio ? new Date(fechaServicio) : null,
      notas: notas || null,
    },
  });

  return NextResponse.json(
    {
      ok: true,
      servicio: {
        ...servicio,
        precioUnitario: precioUnitario / 100,
        total: total / 100,
      },
      cuenta: sesion.label,
    },
    { status: 201 }
  );
}

/** GET: los servicios ya cargados en esta cuenta. */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ sessionId: string }> }
) {
  if (!getAdminSession(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { sessionId } = await ctx.params;

  const servicios = await prisma.servicioCuenta.findMany({
    where: { serviceSessionId: sessionId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(
    servicios.map((s) => ({
      ...s,
      precioUnitario: s.precioUnitario / 100,
      total: s.total / 100,
    }))
  );
}
