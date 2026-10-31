/**
 * Prueba del cálculo de precios del carrito.
 * Verifica el bug #3: que el cobro use la misma cifra que la orden.
 *
 * Ejecutar:
 *   DATABASE_URL="file:$PWD/prisma/hangar5-prod.db" npx tsx scripts/test-carrito.ts
 */
import { calcularCarrito, aItemsMercadoPago } from "../src/lib/calcular-carrito";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("=== PRUEBA: cálculo de precios del carrito ===\n");

  const item = await prisma.menuItem.findFirst({
    where: { isActive: true, basePrice: { gt: 0 } },
    orderBy: { basePrice: "desc" },
  });

  if (!item) {
    console.log("No hay platillos activos en la base.");
    return;
  }

  console.log(`Platillo de prueba: ${item.name} (base ${item.basePrice} centavos)\n`);

  let fallos = 0;
  const ok = (cond: boolean, etiqueta: string, detalle: string) => {
    console.log(`  ${cond ? "✓" : "✗"} ${etiqueta}: ${detalle}`);
    if (!cond) fallos++;
  };

  // ── 1. Un solo platillo ──────────────────────────────────────────
  const c1 = await calcularCarrito([{ menuItemId: item.id, quantity: 1 }]);
  ok(c1.total === item.basePrice, "1 unidad", `esperado ${item.basePrice} | calculado ${c1.total}`);

  // ── 2. Varias unidades ───────────────────────────────────────────
  const c2 = await calcularCarrito([{ menuItemId: item.id, quantity: 3 }]);
  ok(c2.total === item.basePrice * 3, "3 unidades", `esperado ${item.basePrice * 3} | calculado ${c2.total}`);

  // ── 3. MercadoPago cobra lo mismo que la orden ───────────────────
  const mp = aItemsMercadoPago(c2);
  const mpTotal = Math.round(mp.reduce((s, i) => s + i.unit_price * i.quantity, 0) * 100);
  ok(mpTotal === c2.total, "MP = orden", `MP cobraría ${mpTotal} | orden guarda ${c2.total}`);

  // ── 4. El IVA está incluido, no sumado aparte ────────────────────
  const ivaIncluido = c2.tax > 0 && c2.tax < c2.total && c2.total === c2.subtotal;
  ok(ivaIncluido, "IVA incluido", `subtotal ${c2.subtotal} · iva ${c2.tax} · total ${c2.total}`);

  // ── 5. Platillo inexistente → mensaje claro, no 500 ──────────────
  try {
    await calcularCarrito([{ menuItemId: "no-existe", quantity: 1 }]);
    ok(false, "platillo inexistente", "debió fallar y no falló");
  } catch (e) {
    ok(true, "platillo inexistente", `"${(e as Error).message}"`);
  }

  // ── 6. Cantidad inválida ─────────────────────────────────────────
  try {
    await calcularCarrito([{ menuItemId: item.id, quantity: 0 }]);
    ok(false, "cantidad 0", "debió fallar");
  } catch (e) {
    ok(true, "cantidad 0", `"${(e as Error).message}"`);
  }

  // ── 7. Variante inexistente ──────────────────────────────────────
  try {
    await calcularCarrito([{ menuItemId: item.id, variantId: "no-existe", quantity: 1 }]);
    ok(false, "variante inexistente", "debió fallar");
  } catch (e) {
    ok(true, "variante inexistente", `"${(e as Error).message}"`);
  }

  // ── 8. Carrito vacío ─────────────────────────────────────────────
  try {
    await calcularCarrito([]);
    ok(false, "carrito vacío", "debió fallar");
  } catch (e) {
    ok(true, "carrito vacío", `"${(e as Error).message}"`);
  }

  console.log(`\n${fallos === 0 ? "✓ TODAS LAS PRUEBAS PASARON" : `✗ ${fallos} prueba(s) fallaron`}`);
  if (fallos > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error("ERROR:", e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
