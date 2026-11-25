import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/admin/restaurant/payments/[paymentId]
 *
 * Borra un pago suelto. Sirve para limpiar cobros que nunca debieron
 * existir: duplicados por error, pruebas, o el doble cobro que dejó el bug
 * del cierre de cuentas (cada sesión guardaba un Payment de sesión y otro
 * por orden con el mismo dinero).
 *
 * Pide confirmación explícita y deja rastro en el log con el motivo: borrar
 * dinero sin saber por qué no se debe poder hacer en silencio.
 */
const schema = z.object({
  confirmar: z.literal("BORRAR"),
  motivo: z.string().min(3),
});

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ paymentId: string }> }
) {
  if (!getAdminSession(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { paymentId } = await ctx.params;

  const cuerpo = await req.json().catch(() => null);
  const parseo = schema.safeParse(cuerpo);
  if (!parseo.success) {
    return NextResponse.json(
      { error: 'Falta confirmar. Manda {confirmar:"BORRAR", motivo:"…"}' },
      { status: 400 }
    );
  }

  const pago = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: {
      id: true,
      amount: true,
      method: true,
      status: true,
      orderId: true,
      serviceSessionId: true,
      customerId: true,
    },
  });

  if (!pago) {
    return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
  }

  await prisma.payment.delete({ where: { id: paymentId } });

  console.log(
    `[payments] borrado ${paymentId} · $${pago.amount / 100} · ${pago.method} · ` +
      `sesión ${pago.serviceSessionId ?? "—"} · orden ${pago.orderId ?? "—"} · ` +
      `motivo: ${parseo.data.motivo}`
  );

  return NextResponse.json({ ok: true, borrado: pago });
}
