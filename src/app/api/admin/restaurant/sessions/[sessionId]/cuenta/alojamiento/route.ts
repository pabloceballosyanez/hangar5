import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { leerCuentaUnificada } from "@/lib/cuenta-unificada";

export const dynamic = "force-dynamic";

const esquema = z.object({
  itemId: z.string().min(1, "Falta la cabaña o glamping"),
  startDate: z.string().min(1, "Falta la fecha de entrada"),
  endDate: z.string().min(1, "Falta la fecha de salida"),
  guests: z.number().int().min(1).default(1),
  customerName: z.string().optional(),
  customerEmail: z.string().optional(),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * POST /api/admin/restaurant/sessions/[sessionId]/cuenta/alojamiento
 *
 * El caso más común en el Hangar: alguien está comiendo y de pronto
 * decide quedarse a dormir. Aquí se crea la reserva desde la propia
 * cuenta del restaurante y queda vinculada de inmediato.
 *
 * Evita el camino largo de irse a la pantalla de reservas, crearla,
 * volver a la cuenta y vincularla a mano.
 *
 * La reserva nace en "pending" y sin pagar: se cobra junto con la
 * comida en el momento de cerrar la cuenta.
 */
export async function POST(
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
    const primerError = parseo.error.issues[0]?.message ?? "Datos incompletos";
    return NextResponse.json({ error: primerError }, { status: 400 });
  }

  const datos = parseo.data;

  const sesion = await prisma.serviceSession.findUnique({
    where: { id: sessionId },
    include: { customer: true, booking: true },
  });

  if (!sesion) {
    return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
  }

  if (sesion.bookingId) {
    return NextResponse.json(
      { error: "Esta cuenta ya tiene un alojamiento vinculado" },
      { status: 400 }
    );
  }

  const item = await prisma.item.findUnique({ where: { id: datos.itemId } });
  if (!item || !item.active) {
    return NextResponse.json({ error: "Ese alojamiento no está disponible" }, { status: 404 });
  }

  const inicio = new Date(datos.startDate);
  const fin = new Date(datos.endDate);

  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
    return NextResponse.json({ error: "Fechas inválidas" }, { status: 400 });
  }
  if (fin <= inicio) {
    return NextResponse.json(
      { error: "La salida debe ser posterior a la entrada" },
      { status: 400 }
    );
  }

  // Chocar con otra reserva del mismo alojamiento es el error clásico
  // al crear reservas a mano. Se revisa antes de guardar.
  const choque = await prisma.booking.findFirst({
    where: {
      itemId: datos.itemId,
      status: { not: "cancelled" },
      startDate: { lt: fin },
      endDate: { gt: inicio },
    },
  });

  if (choque) {
    return NextResponse.json(
      {
        error: `${item.name} ya está ocupado en esas fechas (reserva de ${choque.customerName}).`,
      },
      { status: 409 }
    );
  }

  const noches = Math.max(
    1,
    Math.round((fin.getTime() - inicio.getTime()) / (24 * 60 * 60 * 1000))
  );
  const totalPrice = item.price * noches;

  // Los datos del cliente se heredan de la cuenta si no se escribieron.
  const customerName = datos.customerName?.trim() || sesion.customer?.name || sesion.label;
  const customerEmail = datos.customerEmail?.trim() || sesion.customer?.email || "";

  const reserva = await prisma.$transaction(async (tx) => {
    const nueva = await tx.booking.create({
      data: {
        itemId: datos.itemId,
        customerId: sesion.customerId ?? null,
        customerName,
        customerEmail,
        customerPhone: datos.customerPhone ?? sesion.customer?.phone ?? null,
        startDate: inicio,
        endDate: fin,
        guests: datos.guests,
        totalPrice,
        status: "pending",
        paymentStatus: "unpaid",
        amountPaid: 0,
        notes: datos.notes ?? null,
      },
    });

    await tx.serviceSession.update({
      where: { id: sessionId },
      data: {
        bookingId: nueva.id,
        ...(sesion.customerId ? {} : {}),
      },
    });

    return nueva;
  });

  return NextResponse.json({
    ok: true,
    bookingId: reserva.id,
    totalPrice,
    noches,
    cuenta: await leerCuentaUnificada(sessionId),
  });
}
