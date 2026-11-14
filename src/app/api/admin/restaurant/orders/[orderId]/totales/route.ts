import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffSession, getAdminSession } from "@/lib/auth";
import { puede } from "@/lib/permisos";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/restaurant/orders/[orderId]/totales
 *
 * Recalcula subtotal, IVA y total de una orden a partir de sus ítems
 * vivos, SIN tocar los ítems ni su estado.
 *
 * Existe por un bug: la cancelación parcial marcaba ítems como CANCELLED
 * pero dejaba los totales congelados. La orden cmwfpnt5y0001dsqqor8v0usc
 * quedó en $470 teniendo solo $190 de consumo real. Las órdenes nuevas ya
 * se calculan bien; esto repara las que quedaron mal.
 *
 * El IVA se reajusta con la proporción que ya tenía la orden, para no
 * inventar una tasa.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const sesion = getStaffSession(req);
  const esAdmin = getAdminSession(req);
  if (!esAdmin && (!sesion || !puede(sesion.role, "operacion"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { orderId } = await params;

  const orden = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      subtotal: true,
      tax: true,
      total: true,
      orderItems: { select: { status: true, quantity: true, unitPrice: true } },
    },
  });

  if (!orden) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  const vivos = orden.orderItems.filter((i) => i.status !== "CANCELLED");
  const subtotal = vivos.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  const tasa = orden.subtotal > 0 ? orden.tax / orden.subtotal : 0;
  const tax = Math.round(subtotal * tasa);
  const total = subtotal + tax;

  const actualizada = await prisma.order.update({
    where: { id: orderId },
    data: { subtotal, tax, total },
    select: { id: true, subtotal: true, tax: true, total: true },
  });

  return NextResponse.json({
    order: actualizada,
    antes: { subtotal: orden.subtotal, tax: orden.tax, total: orden.total },
    itemsVivos: vivos.length,
    itemsCancelados: orden.orderItems.length - vivos.length,
  });
}
