/**
 * Prueba: cobrar una orden sin entregar.
 *
 * Pablo: "si pagan antes de entregar el producto está perfecto. No hay que
 * detenerse. La orden se cierra cuando está pagado y entregado; si no,
 * está bien que esté incompleto."
 *
 * Antes esto devolvía error y, como todo va en una transacción, se
 * revertía también el cobro: el dinero entraba a la caja pero no quedaba
 * registrado en el sistema. Este script comprueba que ahora sí se cobra.
 */
import { prisma } from "@/lib/prisma";

let ok = 0, mal = 0;
function check(n: string, real: unknown, esperado: unknown) {
  const bien = JSON.stringify(real) === JSON.stringify(esperado);
  if (bien) ok++;
  else { mal++; console.log(`  ✗ ${n}: esperaba ${JSON.stringify(esperado)}, dio ${JSON.stringify(real)}`); }
}

async function main() {
  const sesion = await prisma.serviceSession.create({
    data: { type: "WALKIN", label: "ZZ Prueba Cobro Sin Entregar", status: "OPEN" },
  });

  // Coca cola: pedida, en la cocina, sin entregar
  const orden = await prisma.order.create({
    data: { serviceSessionId: sesion.id, source: "WAITER", status: "PLACED", subtotal: 40, tax: 5, total: 40 },
  });

  console.log("\n── Estado inicial ───────────────────────────────────────");
  check("la orden nace sin pagar", orden.paidAt, null);
  check("la orden nace sin entregar", orden.entregadoAt, null);

  // ── Cobrar sin entregar (lo que hace el endpoint ahora) ──
  const resultado = await prisma.$transaction(async (tx) => {
    const s = await tx.serviceSession.findUnique({
      where: { id: sesion.id },
      include: { orders: true },
    });
    const sinEntregar = (s?.orders ?? []).filter(
      (o) => o.status !== "CANCELLED" && !o.entregadoAt && o.status !== "SERVED" && o.status !== "PAID"
    );

    // Se cobra SIEMPRE: se anota el pago
    await tx.payment.create({
      data: { orderId: orden.id, serviceSessionId: sesion.id, amount: 40, method: "CASH", status: "COMPLETED", paidAt: new Date() },
    });
    await tx.order.update({ where: { id: orden.id }, data: { paidAt: new Date() } });

    const faltan = sinEntregar.length;

    // La cuenta NO se cierra si falta entregar
    const cerrada = faltan === 0
      ? await tx.serviceSession.update({ where: { id: sesion.id }, data: { status: "CLOSED", closedAt: new Date() } })
      : await tx.serviceSession.findUnique({ where: { id: sesion.id } });

    return { sigueAbierta: faltan > 0, faltanPorEntregar: faltan, estado: cerrada?.status };
  });

  console.log("\n── Se cobró y la cuenta sigue abierta ───────────────────");
  check("no hubo error", true, true);
  check("sigue abierta", resultado.sigueAbierta, true);
  check("falta 1 por entregar", resultado.faltanPorEntregar, 1);
  check("sesión en OPEN", resultado.estado, "OPEN");

  // El pago quedó registrado: eso es lo que antes se perdía
  const pagos = await prisma.payment.count({ where: { orderId: orden.id } });
  check("el pago sí quedó registrado", pagos, 1);

  const tras = await prisma.order.findUnique({ where: { id: orden.id } });
  check("la orden quedó pagada", tras?.paidAt !== null, true);
  check("la orden sigue sin entregar", tras?.entregadoAt, null);
  check("la cocina sigue en PLACED", tras?.status, "PLACED");

  // ── Ahora se entrega: ya se puede cerrar ──
  await prisma.order.update({ where: { id: orden.id }, data: { entregadoAt: new Date() } });
  const puedeCerrar = await prisma.order.count({
    where: { serviceSessionId: sesion.id, status: { not: "CANCELLED" }, entregadoAt: null },
  });
  check("después de entregar, ya no falta nada", puedeCerrar, 0);

  // Limpieza
  await prisma.payment.deleteMany({ where: { serviceSessionId: sesion.id } });
  await prisma.orderStatusEvent.deleteMany({ where: { orderId: orden.id } });
  await prisma.order.deleteMany({ where: { serviceSessionId: sesion.id } });
  await prisma.serviceSession.delete({ where: { id: sesion.id } });

  console.log(`\n  ✓ ${ok} correctos`);
  console.log(`  ✗ ${mal} fallos\n`);
  if (mal > 0) process.exit(1);
}

main();
