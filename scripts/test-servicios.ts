/**
 * Prueba de servicios en la cuenta: renta y vuelos.
 *
 * El bug que corrige: la cuenta solo aceptaba platillos del menú, así
 * que una moto, una bici o un vuelo de parapente no tenían dónde
 * cobrarse.
 *
 * Ejecutar:
 *   DATABASE_URL="file:$PWD/prisma/hangar5-prod.db" npx tsx scripts/test-servicios.ts
 */
import { prisma } from "../src/lib/prisma";
import {
  agregarServicio,
  quitarServicio,
  serviciosDeCuenta,
  catalogoServicios,
} from "../src/lib/servicios";
import { leerCuentaUnificada } from "../src/lib/cuenta-unificada";

let fallos = 0;
const ok = (cond: boolean, etiqueta: string, detalle = "") => {
  console.log(`  ${cond ? "✓" : "✗"} ${etiqueta}${detalle ? `: ${detalle}` : ""}`);
  if (!cond) fallos++;
};

async function main() {
  console.log("=== PRUEBA: servicios en la cuenta ===\n");

  const mesa = await prisma.table.findFirst({ where: { isActive: true } });
  const platillo = await prisma.menuItem.findFirst({ where: { isActive: true, basePrice: { gt: 0 } } });
  const moto = await prisma.item.findFirst({ where: { type: "moto", active: true } });
  const bici = await prisma.item.findFirst({ where: { type: "bici", active: true } });
  const vuelo = await prisma.item.findFirst({ where: { type: "parapente", active: true } });

  if (!mesa || !platillo || !moto) {
    console.log("  Faltan datos base (mesa, platillo o moto).");
    return;
  }

  // ── Catálogo ─────────────────────────────────────────────────
  console.log("── Catálogo ──");
  const catalogo = await catalogoServicios();
  ok(catalogo.length > 0, "devuelve grupos", catalogo.map((g) => g.etiqueta).join(", "));

  const tipos = catalogo.map((g) => g.tipo);
  ok(!tipos.includes("cabana"), "NO ofrece cabañas", "esas van por el panel de reserva");
  ok(!tipos.includes("glamping"), "NO ofrece glampings");
  ok(tipos.includes("moto"), "sí ofrece motos");
  ok(tipos.includes("parapente"), "sí ofrece vuelos");

  // ── Cuenta con comida y servicios ────────────────────────────
  console.log("\n── Cuenta con comida + servicios ──");
  const sesion = await prisma.serviceSession.create({
    data: { type: "TABLE", label: `Prueba-Serv-${Date.now()}`, tableId: mesa.id, status: "OPEN" },
  });
  await prisma.order.create({
    data: {
      tableId: mesa.id,
      serviceSessionId: sesion.id,
      source: "TEST",
      status: "SERVED",
      subtotal: 40000,
      tax: 5517,
      total: 40000,
    },
  });

  const r1 = await agregarServicio(sesion.id, { itemId: moto.id, cantidad: 1 });
  ok(r1.ok, "agrega una moto", r1.ok ? moto.name : r1.error);

  if (bici) {
    const r2 = await agregarServicio(sesion.id, { itemId: bici.id, cantidad: 2 });
    ok(r2.ok, "agrega 2 bicis", r2.ok ? bici.name : r2.error);
  }

  if (vuelo) {
    const r3 = await agregarServicio(sesion.id, {
      itemId: vuelo.id,
      cantidad: 2,
      fechaServicio: new Date(Date.now() + 86400000).toISOString(),
    });
    ok(r3.ok, "agrega 2 vuelos con fecha");
  }

  // ── Precio congelado ─────────────────────────────────────────
  console.log("\n── Precio congelado ──");
  const { servicios } = await serviciosDeCuenta(sesion.id);
  const laMoto = servicios.find((s) => s.descripcion === moto.name);
  ok(laMoto?.precioUnitario === moto.price, "guarda el precio del momento",
     `$${(laMoto?.precioUnitario ?? 0) / 100}`);

  // Sube el precio del item: la cuenta vieja NO debe cambiar
  await prisma.item.update({ where: { id: moto.id }, data: { price: moto.price + 50000 } });
  const trasSubida = await serviciosDeCuenta(sesion.id);
  const motoSigue = trasSubida.servicios.find((s) => s.descripcion === moto.name);
  ok(motoSigue?.precioUnitario === moto.price, "subir el precio NO altera cuentas abiertas",
     `sigue en $${(motoSigue?.precioUnitario ?? 0) / 100}`);
  // restaurar
  await prisma.item.update({ where: { id: moto.id }, data: { price: moto.price } });

  // ── La cuenta unificada suma todo ────────────────────────────
  console.log("\n── Total de la cuenta ──");
  const cuenta = await leerCuentaUnificada(sesion.id);
  const esperadoServicios = servicios.reduce((s, x) => s + x.total, 0);
  ok(cuenta?.totalServicios === esperadoServicios, "suma los servicios",
     `$${(cuenta?.totalServicios ?? 0) / 100}`);
  ok(
    cuenta?.totalGeneral === 40000 + esperadoServicios,
    "el total incluye comida + servicios",
    `$${(cuenta?.totalGeneral ?? 0) / 100}`
  );

  // ── Reglas ───────────────────────────────────────────────────
  console.log("\n── Reglas ──");
  const noExiste = await agregarServicio(sesion.id, { itemId: "no-existe" });
  ok(!noExiste.ok, "servicio inexistente se rechaza");

  const cantCero = await agregarServicio(sesion.id, { itemId: moto.id, cantidad: 0 });
  ok(!cantCero.ok, "cantidad 0 se rechaza");

  const cuentaCerrada = await prisma.serviceSession.create({
    data: { type: "TABLE", label: `Prueba-Cerrada-${Date.now()}`, tableId: mesa.id, status: "CLOSED" },
  });
  const enCerrada = await agregarServicio(cuentaCerrada.id, { itemId: moto.id });
  ok(!enCerrada.ok, "no se agrega a una cuenta cerrada");

  // Quitar
  if (laMoto) {
    const q = await quitarServicio(sesion.id, laMoto.id);
    ok(q.ok, "quitar servicio funciona");
    const trasQuitar = await serviciosDeCuenta(sesion.id);
    ok(trasQuitar.servicios.length === servicios.length - 1, "queda uno menos");
  }

  // Servicio de otra cuenta
  const ajeno = await quitarServicio(cuentaCerrada.id, servicios[0]?.id ?? "x");
  ok(!ajeno.ok, "no se puede quitar un servicio de otra cuenta");

  // ── Limpieza ─────────────────────────────────────────────────
  await prisma.order.deleteMany({ where: { serviceSessionId: sesion.id } });
  await prisma.servicioCuenta.deleteMany({
    where: { serviceSessionId: { in: [sesion.id, cuentaCerrada.id] } },
  });
  await prisma.serviceSession.deleteMany({ where: { id: { in: [sesion.id, cuentaCerrada.id] } } });
  console.log("\n  (datos de prueba borrados)");

  console.log(`\n${fallos === 0 ? "✓ TODAS LAS PRUEBAS PASARON" : `✗ ${fallos} prueba(s) fallaron`}`);
  if (fallos > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error("ERROR:", e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
