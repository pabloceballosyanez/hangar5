/**
 * Prueba: regla de negocio del Despegue.
 *
 *   Nada entra a preparación sin responsable del dinero.
 *   Contado → pagado. A cuenta → se fía al huésped.
 *
 * Ejecutar:
 *   DATABASE_URL="file:$PWD/prisma/hangar5-prod.db" npx tsx scripts/test-regla-pago.ts
 */
import { prisma } from "../src/lib/prisma";
import { crearVentaMostrador } from "../src/lib/venta-mostrador";

let fallos = 0;
const ok = (cond: boolean, etiqueta: string, detalle = "") => {
  console.log(`  ${cond ? "✓" : "✗"} ${etiqueta}${detalle ? `: ${detalle}` : ""}`);
  if (!cond) fallos++;
};

async function main() {
  console.log("=== PRUEBA: regla de negocio del Despegue ===\n");

  const cafe = await prisma.ubicacion.findUnique({ where: { clave: "cafe" } });
  if (!cafe) { console.log("  El café no está configurado."); return; }

  const marcas = await prisma.menuItemUbicacion.findMany({
    where: { ubicacionId: cafe.id, disponible: true },
    select: { menuItemId: true },
  });
  const prod = await prisma.menuItem.findUnique({ where: { id: marcas[0].menuItemId } });
  if (!prod) { console.log("  Sin productos marcados."); return; }

  const creadas: string[] = [];

  // ── Regla 1: contado → entra a preparación y pagado ──────────
  console.log("── Contado (efectivo) ──");
  const v1 = await crearVentaMostrador({
    items: [{ menuItemId: prod.id, cantidad: 1 }],
    metodoPago: "CASH",
    clienteNombre: "Regla Efectivo",
  });
  ok(v1.ok, "venta creada", v1.ok ? "" : v1.error);

  if (v1.ok) {
    creadas.push(v1.venta.orderId);
    const o = await prisma.order.findUnique({
      where: { id: v1.venta.orderId },
      include: { payments: true },
    });
    ok(o?.status === "IN_KITCHEN", "entra a preparación", o?.status ?? "");
    ok(o?.payments[0]?.status === "COMPLETED", "queda pagado");
    ok(v1.venta.preparando === true, "la API confirma que se prepara");
  }

  // ── Regla 2: a cuenta con correo → se fía, entra a preparación ─
  console.log("\n── A cuenta (huésped con correo) ──");
  const email = `regla-${Date.now()}@test.local`;
  const v2 = await crearVentaMostrador({
    items: [{ menuItemId: prod.id, cantidad: 1 }],
    metodoPago: "CUENTA",
    clienteNombre: "Huésped Regla",
    clienteEmail: email,
  });
  ok(v2.ok, "venta a cuenta creada", v2.ok ? "" : v2.error);

  if (v2.ok) {
    creadas.push(v2.venta.orderId);
    const o = await prisma.order.findUnique({
      where: { id: v2.venta.orderId },
      include: { payments: true },
    });
    ok(o?.status === "IN_KITCHEN", "entra a preparación (se le fía)", o?.status ?? "");
    ok(o?.payments[0]?.method === "ON_ACCOUNT", "marcado como cuenta");
    /* La orden queda PAGADA; la deuda vive en el libro del cliente.
       Antes esta prueba esperaba PENDING en la orden, que era justo el
       error: mostraba pendiente algo ya cobrado. */
    ok(o?.payments[0]?.status === "COMPLETED", "la orden queda pagada");

    const cli = await prisma.customer.findUnique({ where: { email } });
    const cargos = cli
      ? await prisma.customerLedgerEntry.findMany({ where: { customerId: cli.id } })
      : [];
    ok(cargos.length === 1, "se registra el cargo en su cuenta");
  }

  // ── Regla 3: a cuenta SIN datos → se rechaza ─────────────────
  console.log("\n── A cuenta sin identificar al cliente ──");
  const v3 = await crearVentaMostrador({
    items: [{ menuItemId: prod.id, cantidad: 1 }],
    metodoPago: "CUENTA",
    clienteNombre: "Desconocido Total",
  });
  ok(!v3.ok, "se rechaza (no se puede fiar a quien no está registrado)",
     v3.ok ? "DEBIÓ FALLAR" : v3.error);

  // ── Regla 4: sin nombre → se rechaza ─────────────────────────
  console.log("\n── Sin nombre ──");
  const v4 = await crearVentaMostrador({
    items: [{ menuItemId: prod.id, cantidad: 1 }],
    metodoPago: "CASH",
  });
  ok(!v4.ok, "se rechaza aunque sea en efectivo", v4.ok ? "DEBIÓ FALLAR" : v4.error);

  // ── Regla 5: ningún pedido del Despegue sin pago o cuenta ────
  console.log("\n── Auditoría: pedidos del Despegue sin responsable ──");
  const todos = await prisma.order.findMany({
    where: { ubicacionId: cafe.id },
    include: { payments: true },
    take: 200,
  });
  const huerfanos = todos.filter(
    (o) => o.payments.length === 0 || !o.payments.some((p) => p.status === "COMPLETED" || p.method === "ON_ACCOUNT")
  );
  ok(huerfanos.length === 0, "todos tienen pago o cuenta",
     huerfanos.length === 0 ? `${todos.length} pedidos revisados` : `${huerfanos.length} huérfanos`);

  // ── Limpieza ─────────────────────────────────────────────────
  for (const id of creadas) {
    await prisma.orderItemModifier.deleteMany({
      where: { orderItem: { orderId: id } },
    });
    await prisma.orderItem.deleteMany({ where: { orderId: id } });
    await prisma.orderStatusEvent.deleteMany({ where: { orderId: id } });
    await prisma.payment.deleteMany({ where: { orderId: id } });
    await prisma.order.delete({ where: { id } }).catch(() => {});
  }
  await prisma.customerLedgerEntry.deleteMany({
    where: { customer: { email: { contains: "regla-" } } },
  });
  await prisma.customer.deleteMany({ where: { email: { contains: "regla-" } } });
  console.log("\n  (datos de prueba borrados)");

  console.log(`\n${fallos === 0 ? "✓ TODAS LAS PRUEBAS PASARON" : `✗ ${fallos} prueba(s) fallaron`}`);
  if (fallos > 0) process.exitCode = 1;
}

main()
  .catch((e) => { console.error("ERROR:", e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
