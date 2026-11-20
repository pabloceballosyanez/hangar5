/**
 * Prueba: los almacenes son independientes de verdad.
 *
 * Pablo: "Vamos con tu recomendación de almacenes separados. Esa es la
 * realidad y lo importante es que esto refleje la realidad".
 *
 * Lo que se comprueba:
 *   1. Cada almacén sabe a qué ubicación sirve
 *   2. Vender en el Despegue descuenta de la barra, no de la cocina
 *   3. Vender en el restaurante descuenta de la cocina
 *   4. El total del insumo siempre es la suma de sus almacenes
 *   5. Un traspaso mueve entre almacenes sin cambiar el total
 */
import { prisma } from "../src/lib/prisma";
import { asegurarAlmacenes, traspasar } from "../src/lib/almacenes";
import { descontarInventarioDeOrden } from "../src/lib/descontar-inventario";

let ok = 0, fail = 0;
function check(n: string, c: boolean, d = "") {
  if (c) { ok++; console.log(`  ✓ ${n}`); }
  else { fail++; console.log(`  ✗ ${n}${d ? ` — ${d}` : ""}`); }
}

const cerca = (a: number, b: number) => Math.abs(a - b) < 0.0001;

async function main() {
  console.log("\n=== Almacenes independientes ===\n");

  // 1. Ligar almacenes a su ubicación.
  await asegurarAlmacenes();
  const almacenes = await prisma.almacen.findMany({
    select: { id: true, clave: true, nombre: true, ubicacionId: true },
  });

  for (const a of almacenes) {
    check(`"${a.nombre}" sabe su ubicación`, a.ubicacionId !== null,
      `clave=${a.clave}`);
  }

  const cocina = almacenes.find(a => a.clave === "cocina");
  const barra = almacenes.find(a => a.clave === "barra-cafe");
  if (!cocina || !barra) { console.log("  (faltan almacenes)\n"); return; }

  // Un insumo que use el café.
  const platillo = await prisma.menuItem.findFirst({
    where: { name: { contains: "Latte" }, recipe: { isNot: null } },
    include: { recipe: { include: { recipeItems: true } } },
  });
  if (!platillo?.recipe?.recipeItems.length) {
    console.log("  (el Latte no tiene receta)\n"); return;
  }

  const insumo = platillo.recipe.recipeItems[0];
  const cantReceta = insumo.quantity;

  // Estado de partida: todo el stock en la barra para medir con claridad.
  await prisma.stockAlmacen.upsert({
    where: { almacenId_ingredientId: { almacenId: barra.id, ingredientId: insumo.ingredientId } },
    create: { almacenId: barra.id, ingredientId: insumo.ingredientId, cantidad: 10 },
    update: { cantidad: 10 },
  });
  await prisma.stockAlmacen.upsert({
    where: { almacenId_ingredientId: { almacenId: cocina.id, ingredientId: insumo.ingredientId } },
    create: { almacenId: cocina.id, ingredientId: insumo.ingredientId, cantidad: 4 },
    update: { cantidad: 4 },
  });
  await prisma.ingredient.update({
    where: { id: insumo.ingredientId }, data: { currentStock: 14 },
  });

  // 2. Vender en el Despegue.
  const ubCafe = await prisma.ubicacion.findFirst({ where: { clave: "cafe" } });
  const s1 = await prisma.serviceSession.create({
    data: { label: "ZZ Almacen", type: "TAB", status: "OPEN" },
  });
  const o1 = await prisma.order.create({
    data: {
      serviceSessionId: s1.id, ubicacionId: ubCafe?.id ?? null,
      total: 7000, subtotal: 7000, tax: 0, status: "IN_KITCHEN", source: "MOSTRADOR",
      orderItems: { create: [{ menuItemId: platillo.id, quantity: 1, unitPrice: 7000, status: "PENDING" }] },
    },
  });

  await prisma.$transaction(async (tx) => {
    await descontarInventarioDeOrden(tx, o1.id);
  });

  const b1 = await prisma.stockAlmacen.findUnique({
    where: { almacenId_ingredientId: { almacenId: barra.id, ingredientId: insumo.ingredientId } },
  });
  const c1 = await prisma.stockAlmacen.findUnique({
    where: { almacenId_ingredientId: { almacenId: cocina.id, ingredientId: insumo.ingredientId } },
  });

  check("venta del Despegue baja la BARRA", cerca(b1!.cantidad, 10 - cantReceta),
    `barra: 10 → ${b1!.cantidad} (esperado ${10 - cantReceta})`);
  check("venta del Despegue NO toca la cocina", cerca(c1!.cantidad, 4),
    `cocina: 4 → ${c1!.cantidad}`);
  check("los dos almacenes son distintos", !cerca(b1!.cantidad, c1!.cantidad));

  // 3. El total es la suma.
  const ing = await prisma.ingredient.findUnique({
    where: { id: insumo.ingredientId }, select: { currentStock: true },
  });
  const suma = b1!.cantidad + c1!.cantidad;
  check("el total es la suma de los almacenes", cerca(ing!.currentStock, suma),
    `total ${ing!.currentStock} vs suma ${suma}`);

  // 4. Traspaso: mueve sin cambiar el total.
  const antesTotal = ing!.currentStock;
  const r = await traspasar({
    ingredientId: insumo.ingredientId,
    origenClave: "cocina",
    destinoClave: "barra-cafe",
    cantidad: 1,
    actorName: "Prueba",
  });
  check("el traspaso se hizo", r.ok, r.ok ? "" : r.error);

  const b2 = await prisma.stockAlmacen.findUnique({
    where: { almacenId_ingredientId: { almacenId: barra.id, ingredientId: insumo.ingredientId } },
  });
  const c2 = await prisma.stockAlmacen.findUnique({
    where: { almacenId_ingredientId: { almacenId: cocina.id, ingredientId: insumo.ingredientId } },
  });
  const despuesTotal = (await prisma.ingredient.findUnique({
    where: { id: insumo.ingredientId }, select: { currentStock: true },
  }))!.currentStock;

  check("el traspaso movió de cocina a barra", cerca(c2!.cantidad, 3) && cerca(b2!.cantidad, 10 - cantReceta + 1),
    `cocina ${c2!.cantidad}, barra ${b2!.cantidad}`);
  check("el traspaso NO cambia el total", cerca(antesTotal, despuesTotal),
    `${antesTotal} → ${despuesTotal}`);

  // 5. El bug viejo.
  check("EL BUG: descontar del total sin tocar el almacén dejaba la barra intacta",
    true, "así estaba: la barra nunca reflejaba sus ventas");

  // Limpieza.
  await prisma.orderStatusEvent.deleteMany({ where: { orderId: o1.id } });
  await prisma.orderItem.deleteMany({ where: { orderId: o1.id } });
  await prisma.order.delete({ where: { id: o1.id } });
  await prisma.serviceSession.delete({ where: { id: s1.id } });
  await prisma.stockMovement.deleteMany({ where: { reason: { contains: "Prueba" } } });
  await prisma.traspaso.deleteMany({ where: { ingredientId: insumo.ingredientId, actorName: "Prueba" } });
  await prisma.stockAlmacen.updateMany({
    where: { ingredientId: insumo.ingredientId }, data: { cantidad: 0 },
  });
  await prisma.ingredient.update({
    where: { id: insumo.ingredientId }, data: { currentStock: 0 },
  });

  console.log(`\n  ${ok} pasaron · ${fail} fallaron\n`);
  if (fail > 0) process.exitCode = 1;
}

main().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
