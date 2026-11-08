/**
 * Prueba: inventario por almacén y traspasos.
 *
 * La regla que no se puede romper: un traspaso mueve mercancía, no la
 * crea. Si se pudiera sacar más de lo que hay, el inventario mentiría y
 * la caja también.
 *
 * Ejecutar:
 *   DATABASE_URL="file:$PWD/prisma/hangar5-prod.db" npx tsx scripts/test-almacenes.ts
 */
import { prisma } from "../src/lib/prisma";
import { traspasar, stockEn, CLAVE_COCINA, CLAVE_CAFE } from "../src/lib/almacenes";

let fallos = 0;
const ok = (cond: boolean, etiqueta: string, detalle = "") => {
  console.log(`  ${cond ? "✓" : "✗"} ${etiqueta}${detalle ? `: ${detalle}` : ""}`);
  if (!cond) fallos++;
};

async function main() {
  console.log("=== PRUEBA: almacenes y traspasos ===\n");

  const [cocina, cafe] = await Promise.all([
    prisma.almacen.findUnique({ where: { clave: CLAVE_COCINA } }),
    prisma.almacen.findUnique({ where: { clave: CLAVE_CAFE } }),
  ]);

  console.log("── Los dos almacenes existen ──");
  ok(!!cocina, "cocina del restaurante");
  ok(!!cafe, "barra del Despegue");
  ok(cocina?.ubicacionId !== cafe?.ubicacionId, "apuntan a ubicaciones distintas");
  if (!cocina || !cafe) return;

  // Un insumo que sí tenga stock en cocina. Se mira el stock del almacén,
  // no Ingredient.currentStock: ese campo quedó como histórico de la
  // migración y el número real vive por almacén.
  const conStock = await prisma.stockAlmacen.findFirst({
    where: { almacenId: cocina.id, cantidad: { gt: 1 }, ingredient: { isActive: true } },
    include: { ingredient: { select: { id: true, name: true, unit: true } } },
  });
  const ing = conStock?.ingredient;
  if (!ing) {
    console.log("  (no hay insumos con stock para probar)");
    return;
  }

  console.log(`\n── Traspaso de ${ing.name} ──`);

  const antesCocina = await stockEn(cocina.id, ing.id);
  const antesCafe = await stockEn(cafe.id, ing.id);
  const mover = Math.min(2, Math.floor(antesCocina / 2));
  console.log(`  antes: cocina ${antesCocina} ${ing.unit} · café ${antesCafe} ${ing.unit}`);

  // ── Un traspaso válido ─────────────────────────────────────
  const r = await traspasar({
    ingredientId: ing.id,
    origenClave: CLAVE_COCINA,
    destinoClave: CLAVE_CAFE,
    cantidad: mover,
    actorName: "Prueba",
    notas: "traspaso de prueba",
  });
  ok(r.ok === true, "el traspaso se acepta", r.ok ? r.folio : r.error);

  const despCocina = await stockEn(cocina.id, ing.id);
  const despCafe = await stockEn(cafe.id, ing.id);

  ok(despCocina === antesCocina - mover, "sale de cocina", `${antesCocina} → ${despCocina}`);
  ok(despCafe === antesCafe + mover, "entra en el café", `${antesCafe} → ${despCafe}`);
  ok(despCocina + despCafe === antesCocina + antesCafe, "el total no cambia (no se crea mercancía)");

  // ── Los rechazos ───────────────────────────────────────────
  console.log("\n── Se rechaza lo que no debe pasar ──");

  const exceso = await traspasar({
    ingredientId: ing.id,
    origenClave: CLAVE_CAFE,
    destinoClave: CLAVE_COCINA,
    cantidad: despCafe + 1000,
    actorName: "Prueba",
  });
  ok(!exceso.ok, "no se puede sacar más de lo que hay", exceso.ok ? "" : exceso.error);

  const cero = await traspasar({
    ingredientId: ing.id,
    origenClave: CLAVE_COCINA,
    destinoClave: CLAVE_CAFE,
    cantidad: 0,
  });
  ok(!cero.ok, "no se puede traspasar cero");

  const negativo = await traspasar({
    ingredientId: ing.id,
    origenClave: CLAVE_COCINA,
    destinoClave: CLAVE_CAFE,
    cantidad: -3,
  });
  ok(!negativo.ok, "no se puede traspasar en negativo");

  const mismo = await traspasar({
    ingredientId: ing.id,
    origenClave: CLAVE_CAFE,
    destinoClave: CLAVE_CAFE,
    cantidad: 1,
  });
  ok(!mismo.ok, "no se puede traspasar al mismo almacén");

  const fantasma = await traspasar({
    ingredientId: ing.id,
    origenClave: "no-existe",
    destinoClave: CLAVE_CAFE,
    cantidad: 1,
  });
  ok(!fantasma.ok, "se rechaza un almacén inexistente");

  // ── Queda el rastro ────────────────────────────────────────
  console.log("\n── Queda registro ──");
  const traspaso = await prisma.traspaso.findFirst({
    where: { ingredientId: ing.id },
    orderBy: { createdAt: "desc" },
    include: { origen: true, destino: true },
  });
  ok(!!traspaso, "el traspaso quedó guardado", traspaso?.folio ?? "");
  ok(traspaso?.origen.nombre === cocina.nombre, "con su origen correcto");
  ok(traspaso?.destino.nombre === cafe.nombre, "con su destino correcto");

  const movs = await prisma.stockMovement.count({
    where: { ingredientId: ing.id, reason: { startsWith: "traspaso_" } },
  });
  ok(movs >= 2, "quedan los dos movimientos en la bitácora", `${movs}`);

  // ── Regresar todo como estaba ──────────────────────────────
  console.log("\n── Limpieza ──");
  const volver = await traspasar({
    ingredientId: ing.id,
    origenClave: CLAVE_CAFE,
    destinoClave: CLAVE_COCINA,
    cantidad: mover,
    actorName: "Prueba",
    notas: "devolución",
  });
  ok(volver.ok, "se devuelve lo movido");

  const finalCocina = await stockEn(cocina.id, ing.id);
  ok(finalCocina === antesCocina, "cocina queda como al principio", `${finalCocina} ${ing.unit}`);

  console.log(`\n${fallos === 0 ? "✓ TODAS LAS PRUEBAS PASARON" : `✗ ${fallos} prueba(s) fallaron`}`);
  if (fallos > 0) process.exitCode = 1;
}

main()
  .catch((e) => { console.error("ERROR:", e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
