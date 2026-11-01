/**
 * Prueba de la caja del café: venta en mostrador.
 *
 * El café no tiene mesas: todos son walk-ins. La venta se apoya solo en
 * la ubicación.
 *
 * Ejecutar:
 *   DATABASE_URL="file:$PWD/prisma/hangar5-prod.db" npx tsx scripts/test-caja-cafe.ts
 */
import { prisma } from "../src/lib/prisma";
import { crearVentaMostrador } from "../src/lib/venta-mostrador";

let fallos = 0;
const ok = (cond: boolean, etiqueta: string, detalle = "") => {
  console.log(`  ${cond ? "✓" : "✗"} ${etiqueta}${detalle ? `: ${detalle}` : ""}`);
  if (!cond) fallos++;
};

async function main() {
  console.log("=== PRUEBA: caja del café ===\n");

  const cafe = await prisma.ubicacion.findUnique({ where: { clave: "cafe" } });
  if (!cafe) {
    console.log("  El café no está configurado.");
    return;
  }

  // Productos marcados para el café
  const marcas = await prisma.menuItemUbicacion.findMany({
    where: { ubicacionId: cafe.id, disponible: true },
    select: { menuItemId: true },
  });

  if (marcas.length < 2) {
    console.log("  Marca al menos 2 productos para el café antes de correr esto.");
    return;
  }

  const items = await prisma.menuItem.findMany({
    where: { id: { in: marcas.slice(0, 2).map((m) => m.menuItemId) }, isActive: true },
  });

  if (items.length < 2) {
    console.log("  Los productos marcados no están activos.");
    return;
  }

  const [prod1, prod2] = items;
  const creadas: string[] = [];

  // ── Venta en efectivo ────────────────────────────────────────
  console.log("── Venta en efectivo ──");
  const v1 = await crearVentaMostrador({
    items: [
      { menuItemId: prod1.id, cantidad: 2 },
      { menuItemId: prod2.id, cantidad: 1 },
    ],
    metodoPago: "CASH",
    clienteNombre: "Cliente Caja Prueba",
  });

  if (!v1.ok) {
    ok(false, "venta en efectivo", v1.error);
    return;
  }

  creadas.push(v1.venta.orderId);
  ok(true, "venta creada", `total $${v1.venta.total}`);
  ok(!!v1.venta.codigo, "genera código de recogida", v1.venta.codigo ?? "");

  const orden1 = await prisma.order.findUnique({
    where: { id: v1.venta.orderId },
    include: { payments: true },
  });
  ok(orden1?.status === "READY", "nace listo para preparar", orden1?.status ?? "");
  ok(orden1?.tableId === null, "sin mesa (es walk-in)");
  ok(orden1?.ubicacionId === cafe.id, "asignado al café");
  ok(orden1?.payments[0]?.status === "COMPLETED", "pago completado");

  // Precio correcto
  const esperado = prod1.basePrice * 2 + prod2.basePrice;
  ok(orden1?.total === esperado, "total correcto",
     `$${(orden1?.total ?? 0) / 100} (esperado $${esperado / 100})`);

  // ── Venta a cuenta ───────────────────────────────────────────
  console.log("\n── Cargar a cuenta ──");
  const sinDatos = await crearVentaMostrador({
    items: [{ menuItemId: prod1.id, cantidad: 1 }],
    metodoPago: "CUENTA",
  });
  ok(!sinDatos.ok, "sin nombre ni correo se rechaza",
     sinDatos.ok ? "" : sinDatos.error);

  const emailPrueba = `caja-prueba-${Date.now()}@test.local`;
  const v2 = await crearVentaMostrador({
    items: [{ menuItemId: prod1.id, cantidad: 1 }],
    metodoPago: "CUENTA",
    clienteNombre: "Cliente Crédito Prueba",
    clienteEmail: emailPrueba,
  });

  if (v2.ok) {
    creadas.push(v2.venta.orderId);
    ok(true, "venta a cuenta creada");

    const orden2 = await prisma.order.findUnique({
      where: { id: v2.venta.orderId },
      include: { payments: true },
    });
    ok(orden2?.status === "IN_KITCHEN", "a cuenta queda en cocina hasta cerrar", orden2?.status ?? "");
    ok(orden2?.payments[0]?.status === "PENDING", "pago pendiente");

    const cliente = await prisma.customer.findUnique({ where: { email: emailPrueba } });
    ok(!!cliente, "creó el cliente");

    if (cliente) {
      const cargos = await prisma.customerLedgerEntry.findMany({
        where: { customerId: cliente.id },
      });
      ok(cargos.length === 1, "un cargo en su cuenta");
      ok(cargos[0]?.amount === orden2?.total, "el cargo coincide con la venta");
    }
  } else {
    ok(false, "venta a cuenta", v2.error);
  }

  // ── Producto que no se vende en el café ──────────────────────
  console.log("\n── Producto fuera del café ──");
  const todos = await prisma.menuItem.findMany({
    where: { isActive: true },
    select: { id: true },
  });
  const marcados = new Set(marcas.map((m) => m.menuItemId));
  const fuera = todos.find((t) => !marcados.has(t.id));

  if (fuera) {
    const v3 = await crearVentaMostrador({
      items: [{ menuItemId: fuera.id, cantidad: 1 }],
      metodoPago: "CASH",
    });
    ok(!v3.ok, "rechaza producto no marcado para el café",
       v3.ok ? "" : v3.error);
  } else {
    console.log("  (todos los productos están marcados, no se puede probar)");
  }

  // ── Producto inexistente ─────────────────────────────────────
  const v4 = await crearVentaMostrador({
    items: [{ menuItemId: "no-existe", cantidad: 1 }],
    metodoPago: "CASH",
  });
  ok(!v4.ok, "producto inexistente se rechaza");

  // ── Limpieza ─────────────────────────────────────────────────
  for (const id of creadas) {
    await prisma.orderItem.deleteMany({ where: { orderId: id } });
    await prisma.orderStatusEvent.deleteMany({ where: { orderId: id } });
    await prisma.payment.deleteMany({ where: { orderId: id } });
    await prisma.order.delete({ where: { id } }).catch(() => {});
  }
  await prisma.customerLedgerEntry.deleteMany({
    where: { customer: { email: { contains: "caja-prueba-" } } },
  });
  await prisma.customer.deleteMany({ where: { email: { contains: "caja-prueba-" } } });
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
