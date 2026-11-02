/**
 * Prueba: la herencia de modificadores va por TIPO, no por categoría.
 *
 * El motivo: las categorías agrupan el menú para el cliente y mezclan
 * cosas (Horno = pizzas + empanadas). Heredar por categoría le pondría
 * pepperoni a las empanadas y proteína a la Coca Cola.
 *
 * Ejecutar:
 *   DATABASE_URL="file:$PWD/prisma/hangar5-prod.db" npx tsx scripts/test-tipos-herencia.ts
 */
import { prisma } from "../src/lib/prisma";
import { tipoPorNombre } from "../src/lib/tipos-producto";

let fallos = 0;
const ok = (cond: boolean, etiqueta: string, detalle = "") => {
  console.log(`  ${cond ? "✓" : "✗"} ${etiqueta}${detalle ? `: ${detalle}` : ""}`);
  if (!cond) fallos++;
};

/** Lo que el endpoint del menú devolvería para un platillo. */
async function modsDe(nombre: string): Promise<string[]> {
  const it = await prisma.menuItem.findFirst({
    where: { name: nombre },
    include: {
      tipo: { include: { modifierGroups: { include: { modifierGroup: true } } } },
      menuItemModifierGroups: { include: { modifierGroup: true } },
    },
  });
  if (!it) return [];
  const hereda = it.tipo?.modifierGroups.map((g) => g.modifierGroup.name) ?? [];
  const propios = it.menuItemModifierGroups.map((g) => g.modifierGroup.name);
  return [...new Set([...hereda, ...propios])];
}

async function main() {
  console.log("=== PRUEBA: herencia por tipo de producto ===\n");

  // ── Clasificación por nombre ─────────────────────────────────
  console.log("── Clasificación ──");
  ok(tipoPorNombre("Empanadas") === "Empanada", "Empanadas → Empanada");
  ok(tipoPorNombre("Pizza Margarita") === "Pizza", "Pizza Margarita → Pizza");
  ok(tipoPorNombre("Pizza Nutela & Plátano") === "Pizza Dulce",
     "Pizza Nutela → Pizza Dulce (postre, no pizza)");
  ok(tipoPorNombre("Coca Cola 335ml") === "Refresco", "Coca Cola → Refresco");
  ok(tipoPorNombre("Agua Mineral") === "Agua", "Agua Mineral → Agua");
  ok(tipoPorNombre("Café Americano") === "Café", "Café Americano → Café");
  ok(tipoPorNombre("Huevos Rancheros") === "Huevo", "Huevos Rancheros → Huevo");
  ok(tipoPorNombre("Ensalada Caprese") === "Ensalada", "Ensalada Caprese → Ensalada");

  // ── Los que SÍ heredan ───────────────────────────────────────
  console.log("\n── Heredan lo que deben ──");
  const cafe = await modsDe("Café");
  ok(cafe.includes("Extras cafe"), "Café hereda Extras cafe", cafe.join(", "));

  const latte = await modsDe("Latte");
  ok(latte.includes("Extras cafe"), "Latte hereda Extras cafe (antes no lo tenía)", latte.join(", "));

  const pizza = await modsDe("Pizza Margarita");
  ok(pizza.includes("Extras Pizza"), "Pizza hereda Extras Pizza", pizza.join(", "));

  const huevo = await modsDe("Huevos Rancheros");
  ok(huevo.includes("Cocción huevos"), "Huevos heredan Cocción", huevo.join(", "));

  const ensalada = await modsDe("Ensalada Caprese");
  ok(ensalada.includes("Aderezo"), "Ensalada hereda Aderezo", ensalada.join(", "));

  const chela = await modsDe("Cerveza Victoria");
  ok(chela.includes("Extras Cerveza"), "Cerveza hereda Extras Cerveza", chela.join(", "));

  // ── Los que NO deben heredar ─────────────────────────────────
  console.log("\n── NO heredan lo que no les toca ──");
  const empanada = await modsDe("Empanadas");
  ok(!empanada.includes("Extras Pizza"),
     "Empanadas NO reciben extras de pizza", empanada.join(", ") || "(ninguno)");

  const nutela = await modsDe("Pizza Nutela & Plátano");
  ok(!nutela.includes("Extras Pizza"),
     "Pizza Nutela NO recibe extras de pizza", nutela.join(", ") || "(ninguno)");

  const coca = await modsDe("Coca Cola 335ml");
  ok(coca.length === 0, "Coca Cola no recibe nada", coca.join(", ") || "(ninguno)");
  ok(!coca.includes("Extras Smothies"), "Coca Cola NO recibe proteína de smoothie");

  const agua = await modsDe("Agua Mineral");
  ok(agua.length === 0, "Agua Mineral no recibe nada", agua.join(", ") || "(ninguno)");

  const whisky = await modsDe("Whisky");
  ok(!whisky.includes("Extras Cerveza"),
     "Whisky NO recibe michelada", whisky.join(", ") || "(ninguno)");

  // ── Herencia real: categoría ≠ tipo ──────────────────────────
  console.log("\n── La empanada está en Horno pero no es pizza ──");
  const emp = await prisma.menuItem.findFirst({
    where: { name: "Empanadas" },
    include: { category: true, tipo: true },
  });
  ok(emp?.category?.name === "Horno", "la categoría es Horno", emp?.category?.name ?? "");
  ok(emp?.tipo?.nombre === "Empanada", "pero su tipo es Empanada", emp?.tipo?.nombre ?? "");

  console.log(`\n${fallos === 0 ? "✓ TODAS LAS PRUEBAS PASARON" : `✗ ${fallos} prueba(s) fallaron`}`);
  if (fallos > 0) process.exitCode = 1;
}

main()
  .catch((e) => { console.error("ERROR:", e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
