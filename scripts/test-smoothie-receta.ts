/**
 * Prueba: vender un Smoothie en el Despegue descuenta LOS 5 insumos de su
 * receta, del almacén de la barra.
 *
 * Pablo: "lo que importa es que las recetas tengan los elementos no? si el
 * smoothie tiene mas cosas en la receta, eso deberia descontar mas items
 * del almacen del despegue".
 *
 * Se comprueba:
 *   1. La receta trae sus 5 insumos
 *   2. La venta baja los 5, uno por uno, con la cantidad de la receta
 *   3. Todos salen de la barra, ninguno de la cocina
 *   4. Cada uno deja su movimiento de stock
 */
import { prisma } from "../src/lib/prisma";
import { descontarInventarioDeOrden } from "../src/lib/descontar-inventario";

let ok = 0, fail = 0;
function check(n: string, c: boolean, d = "") {
  if (c) { ok++; console.log(`  ✓ ${n}`); }
  else { fail++; console.log(`  ✗ ${n}${d ? ` — ${d}` : ""}`); }
}
const cerca = (a: number, b: number) => Math.abs(a - b) < 0.0001;

async function main() {
  console.log("\n=== Un smoothie descuenta los 5 insumos de su receta ===\n");

  const platillo = await prisma.menuItem.findFirst({
    where: { name: { contains: "Smoothie Berry" }, recipe: { isNot: null } },
    include: { recipe: { include: { recipeItems: { include: { ingredient: true } } } } },
  });

  if (!platillo?.recipe) { console.log("  (no encontré el Smoothie Berry)\n"); return; }

  const receta = platillo.recipe.recipeItems;
  console.log(`  ${platillo.name}: ${receta.length} insumos en la receta`);
  for (const r of receta) console.log(`    ${r.ingredient.name}: ${r.quantity} ${r.ingredient.unit}`);
  console.log();

  check("la receta trae más de un insumo", receta.length > 1, `${receta.length}`);

  const [cocina, barra] = await Promise.all([
    prisma.almacen.findFirst({ where: { clave: "cocina" } }),
    prisma.almacen.findFirst({ where: { clave: "barra-cafe" } }),
  ]);
  if (!cocina || !barra) { console.log("  (faltan almacenes)\n"); return; }

  // Sembrar 10 de cada insumo en la barra y 100 en cocina.
  for (const r of receta) {
    for (const [alm, q] of [[barra, 10], [cocina, 100]] as const) {
      await prisma.stockAlmacen.upsert({
        where: { almacenId_ingredientId: { almacenId: alm.id, ingredientId: r.ingredientId } },
        create: { almacenId: alm.id, ingredientId: r.ingredientId, cantidad: q },
        update: { cantidad: q },
      });
    }
    await prisma.ingredient.update({
      where: { id: r.ingredientId }, data: { currentStock: 110 },
    });
  }

  // Vender en el Despegue.
  const ubCafe = await prisma.ubicacion.findFirst({ where: { clave: "cafe" } });
  const ses = await prisma.serviceSession.create({
    data: { label: "ZZ Smoothie", type: "TAB", status: "OPEN" },
  });
  const orden = await prisma.order.create({
    data: {
      serviceSessionId: ses.id,
      ubicacionId: ubCafe?.id ?? null,
      total: 8000, subtotal: 8000, tax: 0, status: "IN_KITCHEN", source: "MOSTRADOR",
      orderItems: { create: [{ menuItemId: platillo.id, quantity: 1, unitPrice: 8000, status: "PENDING" }] },
    },
  });

  const movAntes = await prisma.stockMovement.count();

  await prisma.$transaction(async (tx) => {
    await descontarInventarioDeOrden(tx, orden.id);
  });

  // Medir.
  let bajaron = 0;
  for (const r of receta) {
    const b = await prisma.stockAlmacen.findUnique({
      where: { almacenId_ingredientId: { almacenId: barra.id, ingredientId: r.ingredientId } },
    });
    const c = await prisma.stockAlmacen.findUnique({
      where: { almacenId_ingredientId: { almacenId: cocina.id, ingredientId: r.ingredientId } },
    });
    const esperado = 10 - r.quantity;
    const bienBarra = cerca(b!.cantidad, esperado);
    const bienCocina = cerca(c!.cantidad, 100);
    if (bienBarra && bienCocina) bajaron++;
    console.log(`    ${bienBarra && bienCocina ? "✓" : "✗"} ${r.ingredient.name.padEnd(14)} barra 10 → ${b!.cantidad} (esperado ${esperado.toFixed(3)})   cocina ${c!.cantidad}`);
  }

  check(`los ${receta.length} insumos bajaron de la barra`, bajaron === receta.length,
    `${bajaron} de ${receta.length}`);

  const movDespues = await prisma.stockMovement.count();
  check("se registró un movimiento por cada insumo",
    movDespues - movAntes === receta.length, `${movDespues - movAntes} vs ${receta.length}`);

  // El total de cada insumo = suma de almacenes.
  let cuadran = 0;
  for (const r of receta) {
    const ing = await prisma.ingredient.findUnique({
      where: { id: r.ingredientId }, select: { currentStock: true },
    });
    const partes = await prisma.stockAlmacen.aggregate({
      where: { ingredientId: r.ingredientId }, _sum: { cantidad: true },
    });
    if (cerca(ing!.currentStock, partes._sum.cantidad ?? 0)) cuadran++;
  }
  check("el total de cada insumo sigue siendo la suma de sus almacenes",
    cuadran === receta.length, `${cuadran} de ${receta.length}`);

  // Limpieza.
  await prisma.orderStatusEvent.deleteMany({ where: { orderId: orden.id } });
  await prisma.orderItem.deleteMany({ where: { orderId: orden.id } });
  await prisma.order.delete({ where: { id: orden.id } });
  await prisma.serviceSession.delete({ where: { id: ses.id } });
  await prisma.stockMovement.deleteMany({ where: { reason: { contains: "Smoothie Berry" } } });
  for (const r of receta) {
    await prisma.stockAlmacen.updateMany({
      where: { ingredientId: r.ingredientId }, data: { cantidad: 0 },
    });
    await prisma.ingredient.update({
      where: { id: r.ingredientId }, data: { currentStock: 0 },
    });
  }

  console.log(`\n  ${ok} pasaron · ${fail} fallaron\n`);
  if (fail > 0) process.exitCode = 1;
}

main().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
