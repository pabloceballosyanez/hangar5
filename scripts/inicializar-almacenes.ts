import { prisma } from "../src/lib/prisma";
import { asegurarAlmacenes, migrarStockACocina, inventarioPorAlmacen } from "../src/lib/almacenes";

/**
 * Prepara el inventario por almacén.
 *
 * Idempotente: se puede correr en cada arranque. Crea los almacenes que
 * falten y, la primera vez, pasa el stock que hoy vive en
 * Ingredient.currentStock al almacén de cocina. El café arranca en cero
 * y se surte por traspaso, que es justo el punto: que no se pisen.
 */
async function main() {
  await asegurarAlmacenes();
  const migrados = await migrarStockACocina();

  const almacenes = await prisma.almacen.findMany({
    select: { clave: true, nombre: true, _count: { select: { stocks: true } } },
    orderBy: { nombre: "asc" },
  });

  console.log("=== ALMACENES ===");
  for (const a of almacenes) {
    console.log(`  ${a.nombre.padEnd(28)} ${a._count.stocks} insumos`);
  }

  if (migrados > 0) {
    console.log(`\n  ${migrados} insumos pasaron al almacén de cocina`);
  } else {
    console.log("\n  El stock ya estaba migrado");
  }

  const { filas } = await inventarioPorAlmacen();
  const conStockCafe = filas.filter((f) => f.porAlmacen["barra-cafe"]?.cantidad > 0);

  console.log("\n=== RESUMEN ===");
  console.log(`  insumos activos:       ${filas.length}`);
  console.log(`  con existencia en café: ${conStockCafe.length}`);
  console.log(
    `  bajo mínimo en café:    ${filas.filter((f) => f.porAlmacen["barra-cafe"]?.bajo).length}`
  );
  console.log(
    `  bajo mínimo en cocina:  ${filas.filter((f) => f.porAlmacen["cocina"]?.bajo).length}`
  );
}

main()
  .catch((e) => { console.error("ERROR:", e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
