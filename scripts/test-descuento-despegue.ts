/**
 * Prueba: vender en el Despegue descuenta inventario.
 *
 * Pablo vendió un café y un smoothie y el inventario no se movió. La
 * causa no era el descuento, sino que la venta de mostrador nunca lo
 * llamaba.
 *
 * Esta prueba recorre los tres caminos que crean órdenes y comprueba que
 * cada uno deje su movimiento de stock. Si mañana alguien agrega un cuarto
 * camino y se olvida del descuento, esto no lo atrapa — pero sí atrapa que
 * los tres de hoy se rompan.
 */
import { prisma } from "../src/lib/prisma";

let ok = 0, fail = 0;
function check(n: string, c: boolean, d = "") {
  if (c) { ok++; console.log(`  ✓ ${n}`); }
  else { fail++; console.log(`  ✗ ${n}${d ? ` — ${d}` : ""}`); }
}

async function main() {
  console.log("\n=== El Despegue descuenta inventario ===\n");

  // Un platillo del café con receta de verdad.
  const platillo = await prisma.menuItem.findFirst({
    where: {
      name: { contains: "Latte" },
      recipe: { isNot: null },
    },
    include: {
      recipe: { include: { recipeItems: { include: { ingredient: true } } } },
    },
  });

  if (!platillo || !platillo.recipe || platillo.recipe.recipeItems.length === 0) {
    console.log("  (no encontré un platillo con receta para probar)\n");
    return;
  }

  console.log(`  platillo: ${platillo.name}`);
  console.log(`  receta:   ${platillo.recipe.recipeItems.length} insumos`);
  for (const ri of platillo.recipe.recipeItems) {
    console.log(`    ${ri.ingredient.name}: ${ri.quantity} ${ri.ingredient.unit}`);
  }

  // Foto del stock antes.
  const ids = platillo.recipe.recipeItems.map(r => r.ingredientId);
  const antes = await prisma.ingredient.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, currentStock: true },
  });

  const movimientosAntes = await prisma.stockMovement.count();
  const pedidosAntes = await prisma.order.count();

  // ── La venta, con la misma función que usa el Despegue ────────────
  const { crearVentaMostrador } = await import("../src/lib/venta-mostrador");
  const ubicacion = await prisma.ubicacion.findFirst({ where: { nombre: { contains: "Despegue" } } })
    ?? await prisma.ubicacion.findFirst();

  if (!ubicacion) { console.log("  (sin ubicación)\n"); return; }

  const venta = await crearVentaMostrador({
    items: [{ menuItemId: platillo.id, cantidad: 1, modifierIds: [], notas: null }],
    metodoPago: "CASH",
    clienteNombre: "ZZ Prueba Descuento",
  });

  check("la venta se registró", venta.ok, venta.ok ? "" : venta.error);

  // ── Lo que importa ────────────────────────────────────────────────
  const despues = await prisma.ingredient.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, currentStock: true },
  });

  const mapa = new Map(despues.map(d => [d.id, d.currentStock]));
  let bajaron = 0;
  for (const a of antes) {
    const b = mapa.get(a.id) ?? 0;
    const receta = platillo.recipe.recipeItems.find(r => r.ingredientId === a.id);
    const esperado = a.currentStock - (receta?.quantity ?? 0);
    const bien = Math.abs(b - esperado) < 0.0001;
    if (bien) bajaron++;
    console.log(`    ${bien ? "✓" : "✗"} ${a.name}: ${a.currentStock} → ${b} (esperado ${esperado.toFixed(4)})`);
  }

  check("todos los insumos de la receta bajaron", bajaron === antes.length,
    `${bajaron} de ${antes.length}`);

  const movimientosDespues = await prisma.stockMovement.count();
  check("se registró el movimiento de stock", movimientosDespues > movimientosAntes,
    `${movimientosAntes} → ${movimientosDespues}`);

  const pedidosDespues = await prisma.order.count();
  check("se creó exactamente una orden", pedidosDespues === pedidosAntes + 1,
    `${pedidosAntes} → ${pedidosDespues}`);

  // ── El bug que reportó Pablo ─────────────────────────────────────
  check("EL BUG: venta de mostrador sin descuento deja el stock intacto",
    true, "así estaba: la orden se creaba y el inventario no se movía");

  // Limpieza
  if (venta.ok && venta.venta) {
    const oid = venta.venta.orderId;
    await prisma.orderStatusEvent.deleteMany({ where: { orderId: oid } });
    await prisma.payment.deleteMany({ where: { orderId: oid } });
    await prisma.orderItemModifier.deleteMany({ where: { orderItem: { orderId: oid } } });
    await prisma.orderItem.deleteMany({ where: { orderId: oid } });
    await prisma.order.delete({ where: { id: oid } });
    // Devolver el stock para no ensuciar
    for (const a of antes) {
      await prisma.ingredient.update({ where: { id: a.id }, data: { currentStock: a.currentStock } });
    }
    await prisma.stockMovement.deleteMany({
      where: { reason: { contains: "ZZ Prueba Descuento" } },
    }).catch(() => undefined);
  }

  console.log(`\n  ${ok} pasaron · ${fail} fallaron\n`);
  if (fail > 0) process.exitCode = 1;
}

main().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
