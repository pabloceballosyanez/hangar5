/**
 * Prueba de la cuenta unificada: restaurante + alojamiento.
 *
 * Cubre los dos flujos del Hangar:
 *   A) llega a comer y luego agrega la cabaña
 *   B) ya tenía reserva y se le carga la comida
 *
 * Y el caso que más caro sale si falla: que una reserva YA PAGADA
 * no se vuelva a cobrar.
 *
 * Ejecutar:
 *   DATABASE_URL="file:$PWD/prisma/hangar5-prod.db" npx tsx scripts/test-cuenta-unificada.ts
 */
import {
  leerCuentaUnificada,
  vincularReserva,
  desvincularReserva,
  generarFolio,
  reservasCandidatas,
} from "../src/lib/cuenta-unificada";
import { prisma } from "../src/lib/prisma";

let fallos = 0;
const ok = (cond: boolean, etiqueta: string, detalle = "") => {
  console.log(`  ${cond ? "✓" : "✗"} ${etiqueta}${detalle ? `: ${detalle}` : ""}`);
  if (!cond) fallos++;
};

async function main() {
  console.log("=== PRUEBA: cuenta unificada ===\n");

  const alojamiento = await prisma.item.findFirst({ where: { active: true } });
  const mesa = await prisma.table.findFirst({ where: { isActive: true } });
  const platillo = await prisma.menuItem.findFirst({ where: { isActive: true, basePrice: { gt: 0 } } });

  if (!alojamiento || !mesa || !platillo) {
    console.log("Falta datos base (alojamiento, mesa o platillo) en la DB.");
    return;
  }

  console.log(`Alojamiento: ${alojamiento.name} ($${alojamiento.price / 100}/noche)`);
  console.log(`Mesa: ${mesa.name}\n`);

  const creadas: { sessionId: string; bookingId: string }[] = [];

  // ─────────────────────────────────────────────────────────────
  // FLUJO A: llega a comer, luego agrega la cabaña
  // ─────────────────────────────────────────────────────────────
  console.log("── FLUJO A: come primero, agrega alojamiento después ──");

  const sesionA = await prisma.serviceSession.create({
    data: { type: "TABLE", label: `Prueba-A-${Date.now()}`, tableId: mesa.id, status: "OPEN" },
  });

  const ordenA = await prisma.order.create({
    data: {
      tableId: mesa.id,
      serviceSessionId: sesionA.id,
      source: "TEST",
      status: "SERVED",
      subtotal: 45000, tax: 6207, total: 45000,
    },
  });

  const antesA = await leerCuentaUnificada(sesionA.id);
  ok(antesA?.consumoRestaurante === 45000, "consumo registrado", `$${(antesA?.consumoRestaurante ?? 0) / 100}`);
  ok(antesA?.reserva === null, "sin alojamiento al inicio");
  ok(antesA?.totalGeneral === 45000, "total = solo comida");

  // Agrega la cabaña
  const reservaA = await prisma.booking.create({
    data: {
      itemId: alojamiento.id,
      customerName: "Cliente Flujo A",
      customerEmail: "a@prueba.test",
      startDate: new Date(Date.now() + 86400000),
      endDate: new Date(Date.now() + 3 * 86400000),
      guests: 2,
      totalPrice: alojamiento.price * 2,
      status: "pending",
      paymentStatus: "unpaid",
    },
  });
  creadas.push({ sessionId: sesionA.id, bookingId: reservaA.id });

  const vincA = await vincularReserva(sesionA.id, reservaA.id);
  ok(vincA.ok, "vincular reserva", vincA.ok ? "ok" : vincA.error);

  const despuesA = await leerCuentaUnificada(sesionA.id);
  const esperadoA = 45000 + alojamiento.price * 2;
  ok(despuesA?.reserva !== null, "alojamiento vinculado", despuesA?.reserva?.nombre);
  ok(
    despuesA?.totalGeneral === esperadoA,
    "total sumado",
    `$${(despuesA?.totalGeneral ?? 0) / 100} (esperado $${esperadoA / 100})`
  );

  // ─────────────────────────────────────────────────────────────
  // FLUJO B: ya tenía reserva, se le carga la comida
  // ─────────────────────────────────────────────────────────────
  console.log("\n── FLUJO B: reserva primero, comida después ──");

  const reservaB = await prisma.booking.create({
    data: {
      itemId: alojamiento.id,
      customerName: "Cliente Flujo B",
      customerEmail: "b@prueba.test",
      startDate: new Date(Date.now() + 5 * 86400000),
      endDate: new Date(Date.now() + 7 * 86400000),
      guests: 3,
      totalPrice: alojamiento.price * 2,
      status: "confirmed",
      paymentStatus: "paid",   // ← YA PAGÓ el alojamiento
      amountPaid: alojamiento.price * 2,
    },
  });

  const sesionB = await prisma.serviceSession.create({
    data: {
      type: "TABLE",
      label: `Prueba-B-${Date.now()}`,
      tableId: mesa.id,
      status: "OPEN",
      bookingId: reservaB.id,
    },
  });
  creadas.push({ sessionId: sesionB.id, bookingId: reservaB.id });

  await prisma.order.create({
    data: {
      tableId: mesa.id,
      serviceSessionId: sesionB.id,
      source: "TEST",
      status: "SERVED",
      subtotal: 30000, tax: 4138, total: 30000,
    },
  });

  const cuentaB = await leerCuentaUnificada(sesionB.id);
  ok(cuentaB?.reserva?.estadoPago === "paid", "reserva ya pagada");
  ok(cuentaB?.reserva?.saldoAlojamiento === 0, "saldo alojamiento = 0 (no se re-cobra)");
  ok(
    cuentaB?.totalGeneral === 30000,
    "total = solo comida",
    `$${(cuentaB?.totalGeneral ?? 0) / 100} (no se suma la cabaña pagada)`
  );

  // ─────────────────────────────────────────────────────────────
  // REGLAS DE VÍNCULO
  // ─────────────────────────────────────────────────────────────
  console.log("\n── Reglas de vínculo ──");

  const yaVinculada = await vincularReserva(sesionB.id, reservaA.id);
  ok(!yaVinculada.ok, "no se puede cambiar a otra reserva sin desvincular",
     yaVinculada.ok ? "" : yaVinculada.error);

  const ocupada = await vincularReserva(sesionA.id, reservaB.id);
  ok(!ocupada.ok, "no se puede vincular una reserva ya tomada",
     ocupada.ok ? "" : ocupada.error);

  const inexistente = await vincularReserva(sesionA.id, "no-existe");
  ok(!inexistente.ok, "reserva inexistente rechazada");

  // Desvincular
  await desvincularReserva(sesionA.id);
  const suelta = await leerCuentaUnificada(sesionA.id);
  ok(suelta?.reserva === null, "desvincular funciona");
  ok(suelta?.totalGeneral === 45000, "al desvincular, vuelve a ser solo comida");

  // ─────────────────────────────────────────────────────────────
  // FOLIOS
  // ─────────────────────────────────────────────────────────────
  console.log("\n── Folios ──");
  const f1 = generarFolio({ type: "TABLE", table: { number: "T4" }, label: "Interior 4" }, 1);
  ok(f1 === "MSA-T4-001", "folio de mesa", f1);

  const f2 = generarFolio({ type: "TAB", table: null, label: "Cuenta Juan" }, 7);
  ok(f2 === "CUE-007", "folio de cuenta", f2);

  // ─────────────────────────────────────────────────────────────
  // CANDIDATAS
  // ─────────────────────────────────────────────────────────────
  console.log("\n── Reservas candidatas ──");
  const candidatas = await reservasCandidatas({ sessionId: sesionA.id });
  ok(Array.isArray(candidatas), "devuelve lista", `${candidatas.length} reservas`);
  const incluyePagada = candidatas.some((c) => c.id === reservaB.id);
  ok(!incluyePagada, "no ofrece reservas ya vinculadas a cuentas abiertas");

  // ─────────────────────────────────────────────────────────────
  // Limpieza
  // ─────────────────────────────────────────────────────────────
  for (const c of creadas) {
    await prisma.order.deleteMany({ where: { serviceSessionId: c.sessionId } });
    await prisma.serviceSession.delete({ where: { id: c.sessionId } }).catch(() => {});
    await prisma.booking.delete({ where: { id: c.bookingId } }).catch(() => {});
  }
  console.log("\n  (datos de prueba borrados)");

  console.log(
    `\n${fallos === 0 ? "✓ TODAS LAS PRUEBAS PASARON" : `✗ ${fallos} prueba(s) fallaron`}`
  );
  if (fallos > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error("ERROR:", e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
