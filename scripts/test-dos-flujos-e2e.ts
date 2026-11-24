/**
 * Prueba E2E de los dos carriles contra la base local.
 *
 * Reproduce el caso de Pedro: orden cobrada pero sin entregar. Con la
 * regla nueva, cobrar NO debe dejar la orden trabada y el cierre de la
 * cuenta debe negarse si falta entregar.
 */
import { prisma } from "@/lib/prisma";

let ok = 0, mal = 0;

function check(n: string, real: unknown, esperado: unknown) {
  const bien = JSON.stringify(real) === JSON.stringify(esperado);
  if (bien) ok++;
  else { mal++; console.log(`  ✗ ${n}: esperaba ${JSON.stringify(esperado)}, dio ${JSON.stringify(real)}`); }
}

async function main() {
  // Cuenta de prueba walk-in
  const sesion = await prisma.serviceSession.create({
    data: { type: "WALKIN", label: "ZZ Prueba Flujos", status: "OPEN" },
  });

  const orden = await prisma.order.create({
    data: {
      serviceSessionId: sesion.id,
      source: "WAITER",
      status: "READY",
      subtotal: 205, tax: 28, total: 205,
    },
  });

  console.log("\n── Escenario: orden lista, se cobra ANTES de entregar ──");
  check("nace sin pagar", orden.paidAt, null);
  check("nace sin entregar", orden.entregadoAt, null);

  // Cobrar: escribe SOLO paidAt
  const cobrada = await prisma.order.update({
    where: { id: orden.id },
    data: { paidAt: new Date() },
  });
  check("ya está pagada", cobrada.paidAt !== null, true);
  check("status NO se movió (sigue READY)", cobrada.status, "READY");
  check("todavía sin entregar", cobrada.entregadoAt, null);

  // La regla de cierre: falta entregar → no se puede cerrar
  const sinEntregar = await prisma.order.count({
    where: { serviceSessionId: sesion.id, status: { not: "CANCELLED" }, entregadoAt: null },
  });
  check("el cierre debe negarse (1 sin entregar)", sinEntregar, 1);

  // Entregar después: escribe SOLO entregadoAt
  const entregada = await prisma.order.update({
    where: { id: orden.id },
    data: { entregadoAt: new Date() },
  });
  check("ahora sí entregada", entregada.entregadoAt !== null, true);
  check("sigue pagada", entregada.paidAt !== null, true);
  check("status sigue READY (el pago no lo pisó)", entregada.status, "READY");

  // Ya se puede cerrar
  const aunFalta = await prisma.order.count({
    where: { serviceSessionId: sesion.id, status: { not: "CANCELLED" }, entregadoAt: null },
  });
  check("ya no falta ninguna", aunFalta, 0);

  console.log("\n── El caso contrario: entregar ANTES de cobrar ──");
  const orden2 = await prisma.order.create({
    data: {
      serviceSessionId: sesion.id, source: "WAITER",
      status: "READY", subtotal: 100, tax: 14, total: 100,
    },
  });
  const e2 = await prisma.order.update({
    where: { id: orden2.id }, data: { entregadoAt: new Date() },
  });
  check("entregada sin pagar", [e2.entregadoAt !== null, e2.paidAt], [true, null]);

  // Limpieza
  await prisma.orderStatusEvent.deleteMany({ where: { orderId: { in: [orden.id, orden2.id] } } });
  await prisma.payment.deleteMany({ where: { serviceSessionId: sesion.id } });
  await prisma.order.deleteMany({ where: { serviceSessionId: sesion.id } });
  await prisma.serviceSession.delete({ where: { id: sesion.id } });

  console.log(`\n  ✓ ${ok} correctos`);
  console.log(`  ✗ ${mal} fallos\n`);
  if (mal > 0) process.exit(1);
}

main();
