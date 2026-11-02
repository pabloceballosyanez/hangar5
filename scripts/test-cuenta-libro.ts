/**
 * Prueba: "a su cuenta" pagó la orden, la deuda vive en el libro.
 *
 * La distinción que Pablo aclaró:
 *
 *   Orden   = el consumo. Si se cobró a cuenta, la orden YA ESTÁ PAGADA.
 *   Libro   = lo que el cliente debe. Ahí vive la deuda hasta que la salde.
 *
 * Antes se marcaba el pago de la orden como PENDING y por eso el panel
 * mostraba "pendiente de pago" algo ya pagado, y la deuda aparecía en
 * dos lugares a la vez.
 *
 * Ejecutar:
 *   DATABASE_URL="file:$PWD/prisma/hangar5-prod.db" npx tsx scripts/test-cuenta-libro.ts
 */
import { prisma } from "../src/lib/prisma";
import { crearVentaMostrador } from "../src/lib/venta-mostrador";

let fallos = 0;
const ok = (cond: boolean, etiqueta: string, detalle = "") => {
  console.log(`  ${cond ? "✓" : "✗"} ${etiqueta}${detalle ? `: ${detalle}` : ""}`);
  if (!cond) fallos++;
};

async function saldo(customerId: string): Promise<number> {
  const r = await prisma.customerLedgerEntry.aggregate({
    where: { customerId },
    _sum: { amount: true },
  });
  return r._sum.amount ?? 0;
}

async function main() {
  console.log("=== PRUEBA: a cuenta = orden pagada, deuda en el libro ===\n");

  const cafe = await prisma.ubicacion.findUnique({ where: { clave: "cafe" } });
  if (!cafe) { console.log("  Café no configurado."); return; }

  const marcas = await prisma.menuItemUbicacion.findMany({
    where: { ubicacionId: cafe.id, disponible: true },
    select: { menuItemId: true },
  });
  const prod = await prisma.menuItem.findUnique({ where: { id: marcas[0].menuItemId } });
  if (!prod) { console.log("  Sin productos."); return; }

  const email = `libro-${Date.now()}@test.local`;

  // ── Venta a cuenta ───────────────────────────────────────────
  console.log("── A su cuenta ──");
  const v = await crearVentaMostrador({
    items: [{ menuItemId: prod.id, cantidad: 2 }],
    metodoPago: "CUENTA",
    clienteNombre: "Huésped Libro",
    clienteEmail: email,
  });
  if (!v.ok) { ok(false, "venta a cuenta", v.error); return; }

  const orden = await prisma.order.findUnique({
    where: { id: v.venta.orderId },
    include: { payments: true },
  });
  const cli = await prisma.customer.findUnique({ where: { email } });
  if (!cli) { ok(false, "cliente creado"); return; }

  const pago = orden!.payments[0];
  const totalEsperado = prod.basePrice * 2;

  ok(pago.status === "COMPLETED", "la ORDEN queda pagada", pago.status);
  ok(pago.method === "ON_ACCOUNT", "el método dice que fue a cuenta", pago.method);
  ok(pago.paidAt !== null, "tiene fecha de pago");

  const debe = await saldo(cli.id);
  ok(debe === totalEsperado, "la DEUDA vive en el libro del cliente",
     `$${debe / 100} (esperado $${totalEsperado / 100})`);

  // ── La orden no se ve como pendiente ─────────────────────────
  console.log("\n── La orden no aparece pendiente ──");
  const pendientes = await prisma.order.findMany({
    where: {
      ubicacionId: cafe.id,
      payments: { some: { status: "PENDING" } },
    },
  });
  ok(pendientes.length === 0, "ninguna orden del Despegue queda PENDING",
     `${pendientes.length} pendientes`);

  // ── Se salda desde el libro del cliente ──────────────────────
  console.log("\n── Saldar la deuda del huésped ──");
  await prisma.customerLedgerEntry.create({
    data: {
      customerId: cli.id,
      amount: -totalEsperado,
      type: "PAYMENT",
      note: "Pago de su cuenta",
    },
  });

  const tras = await saldo(cli.id);
  ok(tras === 0, "el saldo del cliente queda en cero", `$${tras / 100}`);

  // La orden sigue pagada: saldar el libro no la toca
  const ordenFinal = await prisma.order.findUnique({
    where: { id: orden!.id },
    include: { payments: true },
  });
  ok(ordenFinal?.payments[0]?.status === "COMPLETED",
     "la orden sigue pagada después de saldar el libro");

  // ── Efectivo: nada va al libro ───────────────────────────────
  console.log("\n── Contado no ensucia el libro ──");
  const antes = await saldo(cli.id);
  const v2 = await crearVentaMostrador({
    items: [{ menuItemId: prod.id, cantidad: 1 }],
    metodoPago: "CASH",
    clienteNombre: "Huésped Libro",
    clienteEmail: email,
  });
  if (v2.ok) {
    const despues = await saldo(cli.id);
    ok(despues === antes, "pagar en efectivo no genera deuda",
       `saldo $${despues / 100}`);
  }

  // ── Limpieza ─────────────────────────────────────────────────
  const ids = [v.venta.orderId, ...(v2.ok ? [v2.venta.orderId] : [])];
  for (const id of ids) {
    await prisma.orderItemModifier.deleteMany({ where: { orderItem: { orderId: id } } });
    await prisma.orderItem.deleteMany({ where: { orderId: id } });
    await prisma.orderStatusEvent.deleteMany({ where: { orderId: id } });
    await prisma.payment.deleteMany({ where: { orderId: id } });
    await prisma.order.delete({ where: { id } }).catch(() => {});
  }
  await prisma.customerLedgerEntry.deleteMany({ where: { customerId: cli.id } });
  await prisma.customer.delete({ where: { id: cli.id } }).catch(() => {});
  console.log("\n  (datos de prueba borrados)");

  console.log(`\n${fallos === 0 ? "✓ TODAS LAS PRUEBAS PASARON" : `✗ ${fallos} prueba(s) fallaron`}`);
  if (fallos > 0) process.exitCode = 1;
}

main()
  .catch((e) => { console.error("ERROR:", e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
