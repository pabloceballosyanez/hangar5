import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { vincularReserva, desvincularReserva, leerCuentaUnificada } from "@/lib/cuenta-unificada";

export const dynamic = "force-dynamic";

const esquema = z.object({
  bookingId: z.string().nullable().optional(),
});

/**
 * PUT /api/admin/restaurant/sessions/[sessionId]/cuenta
 *
 * Vincula o desvincula una reserva de alojamiento a una cuenta del
 * restaurante.
 *
 *   { bookingId: "abc" }  → vincular
 *   { bookingId: null }   → desvincular
 *
 * Sirve para los dos flujos del Hangar:
 *   · llegó a comer y luego decide quedarse
 *   · ya tenía reserva y hay que cargarle la comida
 *
 * Se usa PUT y no PATCH porque hay que reemplazar el valor completo
 * del vínculo, no modificarlo en parte.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const parseo = esquema.safeParse(body);
  if (!parseo.success) {
    return NextResponse.json({ error: "bookingId requerido" }, { status: 400 });
  }

  const { bookingId } = parseo.data;

  // Desvincular
  if (bookingId === null) {
    const sesion = await prisma.serviceSession.findUnique({ where: { id: sessionId } });
    if (!sesion) return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });

    await desvincularReserva(sessionId);
    return NextResponse.json({
      ok: true,
      cuenta: await leerCuentaUnificada(sessionId),
    });
  }

  if (!bookingId) {
    return NextResponse.json({ error: "bookingId requerido" }, { status: 400 });
  }

  const resultado = await vincularReserva(sessionId, bookingId);
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    cuenta: await leerCuentaUnificada(sessionId),
  });
}
