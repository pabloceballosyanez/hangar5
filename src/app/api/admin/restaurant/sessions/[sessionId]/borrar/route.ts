import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/admin/restaurant/sessions/[sessionId]
 *
 * Borra una cuenta de prueba con todo lo que cuelga de ella: órdenes,
 * ítems, modificadores, pagos, eventos y la cuenta misma.
 *
 * Sirve para quitar cuentas que nunca debieron existir. No se usa en la
 * operación normal: una cuenta real se cobra y se cierra, no se borra.
 * Por eso exige confirmación y solo administradores.
 */
const esquema = z.object({
  confirmar: z.literal("BORRAR"),
  motivo: z.string().default("Cuenta de prueba"),
});

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  if (!getAdminSession(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { sessionId } = await params;
  const cuerpo = await req.json().catch(() => null);
  const parsed = esquema.safeParse(cuerpo);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Falta la confirmación. Manda { "confirmar": "BORRAR" }.' },
      { status: 400 }
    );
  }

  const sesion = await prisma.serviceSession.findUnique({
    where: { id: sessionId },
    include: { orders: { select: { id: true } }, payments: { select: { id: true } } },
  });
  if (!sesion) {
    return NextResponse.json({ error: "La cuenta no existe" }, { status: 404 });
  }

  const resumen = {
    etiqueta: sesion.label,
    ordenes: sesion.orders.length,
    pagos: sesion.payments.length,
    estado: sesion.status,
  };

  await prisma.$transaction(async (tx) => {
    const orderIds = sesion.orders.map((o) => o.id);

    if (orderIds.length > 0) {
      const items = await tx.orderItem.findMany({
        where: { orderId: { in: orderIds } },
        select: { id: true },
      });
      const itemIds = items.map((i) => i.id);
      if (itemIds.length > 0) {
        await tx.orderItemModifier.deleteMany({ where: { orderItemId: { in: itemIds } } });
      }
      await tx.orderStatusEvent.deleteMany({ where: { orderId: { in: orderIds } } });
      await tx.payment.deleteMany({ where: { orderId: { in: orderIds } } });
      await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
      await tx.order.deleteMany({ where: { id: { in: orderIds } } });
    }

    /* Pagos que cuelgan de la cuenta y no de una orden (los que se crean
       a nivel sesión cuando se cobra el total). */
    await tx.payment.deleteMany({ where: { serviceSessionId: sessionId } });
    await tx.customerLedgerEntry.deleteMany({ where: { serviceSessionId: sessionId } });
    await tx.servicioCuenta.deleteMany({ where: { serviceSessionId: sessionId } });
    await tx.serviceSession.delete({ where: { id: sessionId } });
  });

  return NextResponse.json({ ok: true, borrada: sessionId, ...resumen, motivo: parsed.data.motivo });
}
