import { prisma } from "../src/lib/prisma";
import { aplicarHerencia, resumenTipos } from "../src/lib/tipos-producto";

async function main() {
  console.log("=== APLICANDO HERENCIA POR TIPO ===\n");

  const aplicados = await aplicarHerencia();
  console.log(`Grupos heredados: ${aplicados}\n`);

  const resumen = await resumenTipos();

  console.log("=".repeat(70));
  console.log("  RESULTADO: qué hereda cada tipo");
  console.log("=".repeat(70));

  for (const t of resumen) {
    if (t.hereda.length === 0 && t.platillos.length < 2) continue;
    const marca = t.hereda.length ? "✓" : "·";
    console.log(`\n${marca} ${t.tipo}  (${t.platillos.length} platillo${t.platillos.length === 1 ? "" : "s"})`);
    console.log(`   ${t.platillos.join(", ")}`);
    console.log(`   hereda: ${t.hereda.length ? t.hereda.join(", ") : "(nada)"}`);
  }

  console.log("\n=== VERIFICACIÓN: los casos que debían quedar limpios ===");
  for (const nombre of ["Empanadas", "Pizza Nutela & Plátano", "Coca Cola 335ml", "Agua Mineral", "Café", "Latte"]) {
    const it = await prisma.menuItem.findFirst({
      where: { name: nombre },
      include: {
        tipo: {
          include: { modifierGroups: { include: { modifierGroup: true } } },
        },
        menuItemModifierGroups: { include: { modifierGroup: true } },
      },
    });
    if (!it) continue;
    const hereda = it.tipo?.modifierGroups.map((g) => g.modifierGroup.name) ?? [];
    const propios = it.menuItemModifierGroups.map((g) => g.modifierGroup.name);
    const todo = [...new Set([...hereda, ...propios])];
    console.log(`  ${nombre.padEnd(26)} tipo=${(it.tipo?.nombre ?? "—").padEnd(12)} mods: ${todo.length ? todo.join(", ") : "(ninguno)"}`);
  }
}

main()
  .catch((e) => console.error("ERROR:", e.message))
  .finally(() => prisma.$disconnect());
