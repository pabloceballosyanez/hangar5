import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding restaurant page 2 data...");

  await prisma.$transaction(async (tx) => {
    // ──────────────────────────────────────────────
    // 1. CATEGORIES (page 2)
    // ──────────────────────────────────────────────
    const catEntradas = await tx.category.create({
      data: { name: "ENTRADAS", kind: "FOOD", sortOrder: 4 },
    });
    const catEnsaladas = await tx.category.create({
      data: { name: "ENSALADAS", kind: "FOOD", sortOrder: 5 },
    });
    const catPostres = await tx.category.create({
      data: { name: "POSTRES", kind: "FOOD", sortOrder: 6 },
    });
    const catPizzas = await tx.category.create({
      data: { name: "PIZZAS", kind: "FOOD", sortOrder: 7 },
    });
    console.log(`  ✅ Categories (page 2) created`);

    // ──────────────────────────────────────────────
    // 2. MENU ITEMS
    // ──────────────────────────────────────────────
    // ENTRADAS (mostly COLD_STATION, 5 min)
    const guacamole = await tx.menuItem.create({
      data: {
        categoryId: catEntradas.id, name: "Guacamole", basePrice: 6500,
        prepStation: "COLD_STATION", estimatedPrepMinutes: 5, sortOrder: 1,
      },
    });
    const aceitunas = await tx.menuItem.create({
      data: {
        categoryId: catEntradas.id, name: "Aceitunas", basePrice: 2500,
        prepStation: "COLD_STATION", estimatedPrepMinutes: 5, sortOrder: 2,
      },
    });
    const quesadillas = await tx.menuItem.create({
      data: {
        categoryId: catEntradas.id, name: "Quesadillas", basePrice: 7000,
        prepStation: "KITCHEN", estimatedPrepMinutes: 10, sortOrder: 3,
      },
    });
    const empanadas = await tx.menuItem.create({
      data: {
        categoryId: catEntradas.id, name: "Empanadas", basePrice: 7000,
        prepStation: "KITCHEN", estimatedPrepMinutes: 15, sortOrder: 4,
      },
    });
    const verduritas = await tx.menuItem.create({
      data: {
        categoryId: catEntradas.id, name: "Verduritas", basePrice: 6000,
        prepStation: "COLD_STATION", estimatedPrepMinutes: 5, sortOrder: 5,
      },
    });

    // ENSALADAS (COLD_STATION, 8 min)
    const tropical = await tx.menuItem.create({
      data: {
        categoryId: catEnsaladas.id, name: "Tropical", basePrice: 8000,
        prepStation: "COLD_STATION", estimatedPrepMinutes: 8, sortOrder: 1,
      },
    });
    const capresse = await tx.menuItem.create({
      data: {
        categoryId: catEnsaladas.id, name: "Capresse", basePrice: 7500,
        prepStation: "COLD_STATION", estimatedPrepMinutes: 8, sortOrder: 2,
      },
    });
    const mixta = await tx.menuItem.create({
      data: {
        categoryId: catEnsaladas.id, name: "Mixta", basePrice: 7000,
        prepStation: "COLD_STATION", estimatedPrepMinutes: 8, sortOrder: 3,
      },
    });

    // POSTRES (mostly COLD_STATION, 5 min)
    const eccle = await tx.menuItem.create({
      data: {
        categoryId: catPostres.id, name: "Eccle", basePrice: 7000,
        prepStation: "COLD_STATION", estimatedPrepMinutes: 5, sortOrder: 1,
      },
    });
    const panque = await tx.menuItem.create({
      data: {
        categoryId: catPostres.id, name: "Panqué", basePrice: 6500,
        prepStation: "COLD_STATION", estimatedPrepMinutes: 5, sortOrder: 2,
      },
    });
    const pizzaNutella = await tx.menuItem.create({
      data: {
        categoryId: catPostres.id, name: "Pizza de Nutella", basePrice: 8500,
        prepStation: "KITCHEN", estimatedPrepMinutes: 12, sortOrder: 3,
      },
    });

    // PIZZAS (KITCHEN, 20 min)
    const margarita = await tx.menuItem.create({
      data: {
        categoryId: catPizzas.id, name: "Margarita", basePrice: 12000,
        prepStation: "KITCHEN", estimatedPrepMinutes: 20, sortOrder: 1,
      },
    });
    const champinones = await tx.menuItem.create({
      data: {
        categoryId: catPizzas.id, name: "Champiñones", basePrice: 14000,
        prepStation: "KITCHEN", estimatedPrepMinutes: 20, sortOrder: 2,
      },
    });
    const pepperoni = await tx.menuItem.create({
      data: {
        categoryId: catPizzas.id, name: "Pepperoni", basePrice: 15000,
        prepStation: "KITCHEN", estimatedPrepMinutes: 20, sortOrder: 3,
      },
    });
    const vegetariana = await tx.menuItem.create({
      data: {
        categoryId: catPizzas.id, name: "Vegetariana", basePrice: 14000,
        prepStation: "KITCHEN", estimatedPrepMinutes: 20, sortOrder: 4,
      },
    });
    const tomateDeshidratado = await tx.menuItem.create({
      data: {
        categoryId: catPizzas.id, name: "Tomate deshidratado", basePrice: 16000,
        prepStation: "KITCHEN", estimatedPrepMinutes: 20, sortOrder: 5,
      },
    });
    const prosciutto = await tx.menuItem.create({
      data: {
        categoryId: catPizzas.id, name: "Prosciutto", basePrice: 24000,
        prepStation: "KITCHEN", estimatedPrepMinutes: 20, sortOrder: 6,
      },
    });
    console.log(`  ✅ MenuItems created`);

    // ──────────────────────────────────────────────
    // 3. VARIANTS (Pizza sizes)
    // ──────────────────────────────────────────────
    const pizzaItems = [margarita, champinones, pepperoni, vegetariana, tomateDeshidratado, prosciutto];
    for (const pizza of pizzaItems) {
      await tx.menuItemVariant.createMany({
        data: [
          { menuItemId: pizza.id, name: "Personal", priceDelta: 0, isDefault: true },
          { menuItemId: pizza.id, name: "Familiar", priceDelta: 10000, isDefault: false },
        ],
      });
    }
    console.log(`  ✅ Pizza variants created (6 pizzas × 2 sizes)`);

    // ──────────────────────────────────────────────
    // 4. MODIFIER GROUPS + MODIFIERS + PIVOT
    // ──────────────────────────────────────────────

    // 4a. Extras Pizza → ALL pizzas
    const extrasPizza = await tx.modifierGroup.create({
      data: { name: "Extras Pizza", minSelections: 0, maxSelections: 5, isRequired: false },
    });
    await tx.modifier.createMany({
      data: [
        { modifierGroupId: extrasPizza.id, name: "Extra queso", priceDelta: 2000 },
        { modifierGroupId: extrasPizza.id, name: "Extra pepperoni", priceDelta: 2500 },
        { modifierGroupId: extrasPizza.id, name: "Extra champiñones", priceDelta: 1500 },
        { modifierGroupId: extrasPizza.id, name: "Orilla rellena de queso", priceDelta: 3500 },
      ],
    });
    // Associate with all pizzas
    for (const pizza of pizzaItems) {
      await tx.menuItemModifierGroup.create({
        data: { menuItemId: pizza.id, modifierGroupId: extrasPizza.id },
      });
    }
    console.log(`  ✅ Extras Pizza modifier group + pivot created`);

    // 4b. Aderezo → Tropical, Capresse, Mixta
    const aderezo = await tx.modifierGroup.create({
      data: { name: "Aderezo", minSelections: 1, maxSelections: 1, isRequired: true },
    });
    await tx.modifier.createMany({
      data: [
        { modifierGroupId: aderezo.id, name: "Vinagreta", priceDelta: 0 },
        { modifierGroupId: aderezo.id, name: "César", priceDelta: 0 },
        { modifierGroupId: aderezo.id, name: "Miel-mostaza", priceDelta: 0 },
      ],
    });
    // Associate with Tropical, Capresse, Mixta
    const ensaladaItems = [tropical, capresse, mixta];
    for (const ensalada of ensaladaItems) {
      await tx.menuItemModifierGroup.create({
        data: { menuItemId: ensalada.id, modifierGroupId: aderezo.id },
      });
    }
    console.log(`  ✅ Aderezo modifier group + pivot created`);
  });

  console.log("✅ Seed page 2 complete");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
