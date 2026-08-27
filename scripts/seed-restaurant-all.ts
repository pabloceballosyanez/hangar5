import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const dbUrl = process.env.DATABASE_URL || "file:/data/hangar5.db";
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 [seed-restaurant-all] Starting...");

  // ── Web items (reservas) — SOLO en previews, idempotente por slug ──────────
  // Render establece IS_PREVIEW=true (o nombre de servicio con "pr-") en PR
  // previews. En producción nunca crea items demo.
  const isPreview =
    process.env.IS_PREVIEW === "true" ||
    (process.env.RENDER_SERVICE_NAME || "").includes("pr-");

  if (isPreview) {
    const webItems = [
      { name: "Cabaña El Peñón", slug: "cabana-el-penon", type: "cabana", price: 150000, capacity: "4 personas", description: "Cabaña con vista al valle", featured: true },
      { name: "Cabaña Vista al Valle", slug: "cabana-vista-valle", type: "cabana", price: 180000, capacity: "2 personas", description: "Cabaña íntima con terraza", featured: true },
      { name: "Glamping Deluxe", slug: "glamping-deluxe", type: "glamping", price: 220000, capacity: "2 personas", description: "Glamping con cama king y baño privado", featured: true },
      { name: "Glamping Familiar", slug: "glamping-familiar", type: "glamping", price: 260000, capacity: "4 personas", description: "Glamping amplio para familia", featured: false },
      { name: "Parapente Tándem", slug: "parapente-tandem", type: "parapente", price: 120000, capacity: "1 persona", description: "Vuelo tándem con piloto certificado", featured: true },
      { name: "Ala Delta", slug: "ala-delta", type: "aladelta", price: 150000, capacity: "1 persona", description: "Vuelo en ala delta", featured: false },
      { name: "Hike Guiado", slug: "hike-guiado", type: "hike", price: 50000, capacity: "8 personas", description: "Caminata guiada por El Peñón", featured: false },
      { name: "Moto Enduro", slug: "moto-enduro", type: "moto", price: 90000, capacity: "1 moto", description: "Renta de moto enduro por día", featured: false },
      { name: "Bicicleta MTB", slug: "bici-mtb", type: "bici", price: 35000, capacity: "1 bici", description: "Renta de bici de montaña por día", featured: false },
    ];
    let created = 0;
    for (const it of webItems) {
      const exists = await prisma.item.findUnique({ where: { slug: it.slug } });
      if (!exists) {
        await prisma.item.create({ data: { ...it, image: null } });
        created++;
      }
    }
    console.log(`  ✅ Web items (reservas) — ${created} creados en preview`);
  } else {
    console.log("  ⏭️  No es preview, salto web items demo");
  }

  // ──────────────────────────────────────────────
  // Idempotency check: do restaurant categories exist?
  // ──────────────────────────────────────────────
  const existingCategories = await prisma.category.count({
    where: { name: { in: ["BEBIDAS NO ALCOHÓLICAS", "BEBIDAS ALCOHÓLICAS", "DESAYUNOS"] } },
  });

  if (existingCategories >= 3) {
    console.log("⚠️  Restaurant data already exists, skipping seed");
    await prisma.$disconnect();
    return;
  }

  console.log("📦 No restaurant data found. Seeding all data...");

  await prisma.$transaction(async (tx) => {
    // ══════════════════════════════════════════════
    // A) PAGE 1 — Bebidas & Desayunos
    // ══════════════════════════════════════════════

    // ─── A1. CATEGORIES (page 1) ────────────────
    const catNoAlcohol = await tx.category.create({
      data: { name: "BEBIDAS NO ALCOHÓLICAS", kind: "DRINK", sortOrder: 1 },
    });
    const catAlcohol = await tx.category.create({
      data: { name: "BEBIDAS ALCOHÓLICAS", kind: "DRINK", sortOrder: 2 },
    });
    const catDesayunos = await tx.category.create({
      data: { name: "DESAYUNOS", kind: "FOOD", sortOrder: 3 },
    });
    console.log(`  ✅ Page 1 Categories created`);

    // ─── A2. MENU ITEMS + VARIANTS (page 1) ─────
    // BEBIDAS NO ALCOHÓLICAS (BAR)
    const cafeAmericano = await tx.menuItem.create({
      data: {
        categoryId: catNoAlcohol.id, name: "Café americano", basePrice: 3000,
        prepStation: "BAR", estimatedPrepMinutes: 10, sortOrder: 1,
      },
    });
    const jugoNaranja = await tx.menuItem.create({
      data: {
        categoryId: catNoAlcohol.id, name: "Jugo de naranja", basePrice: 3500,
        prepStation: "BAR", estimatedPrepMinutes: 10, sortOrder: 2,
      },
    });
    const leche = await tx.menuItem.create({
      data: {
        categoryId: catNoAlcohol.id, name: "Leche", basePrice: 2500,
        prepStation: "BAR", estimatedPrepMinutes: 10, sortOrder: 3,
      },
    });
    const chocolate = await tx.menuItem.create({
      data: {
        categoryId: catNoAlcohol.id, name: "Chocolate", basePrice: 3500,
        prepStation: "BAR", estimatedPrepMinutes: 10, sortOrder: 4,
      },
    });
    const te = await tx.menuItem.create({
      data: {
        categoryId: catNoAlcohol.id, name: "Té", basePrice: 2500,
        prepStation: "BAR", estimatedPrepMinutes: 10, sortOrder: 5,
      },
    });
    await tx.menuItemVariant.createMany({
      data: [
        { menuItemId: te.id, name: "Té negro", priceDelta: 0, isDefault: true },
        { menuItemId: te.id, name: "Té verde", priceDelta: 0, isDefault: false },
        { menuItemId: te.id, name: "Té de hierbas", priceDelta: 0, isDefault: false },
      ],
    });
    const refresco = await tx.menuItem.create({
      data: {
        categoryId: catNoAlcohol.id, name: "Refresco", basePrice: 3000,
        prepStation: "BAR", estimatedPrepMinutes: 10, sortOrder: 6,
      },
    });
    const aguaMineral = await tx.menuItem.create({
      data: {
        categoryId: catNoAlcohol.id, name: "Agua mineral", basePrice: 2500,
        prepStation: "BAR", estimatedPrepMinutes: 10, sortOrder: 7,
      },
    });
    // BEBIDAS ALCOHÓLICAS (BAR)
    const cerveza = await tx.menuItem.create({
      data: {
        categoryId: catAlcohol.id, name: "Cerveza", basePrice: 3500,
        prepStation: "BAR", estimatedPrepMinutes: 10, sortOrder: 1,
      },
    });
    const mojito = await tx.menuItem.create({
      data: {
        categoryId: catAlcohol.id, name: "Mojito", basePrice: 10000,
        prepStation: "BAR", estimatedPrepMinutes: 10, sortOrder: 2,
      },
    });
    const paloma = await tx.menuItem.create({
      data: {
        categoryId: catAlcohol.id, name: "Paloma", basePrice: 11000,
        prepStation: "BAR", estimatedPrepMinutes: 10, sortOrder: 3,
      },
    });
    const whisky = await tx.menuItem.create({
      data: {
        categoryId: catAlcohol.id, name: "Whisky", basePrice: 11000,
        prepStation: "BAR", estimatedPrepMinutes: 10, sortOrder: 4,
      },
    });
    // DESAYUNOS (KITCHEN)
    const frutaGranola = await tx.menuItem.create({
      data: {
        categoryId: catDesayunos.id, name: "Fruta con granola", basePrice: 6500,
        prepStation: "KITCHEN", estimatedPrepMinutes: 15, sortOrder: 1,
      },
    });
    const chilaquiles = await tx.menuItem.create({
      data: {
        categoryId: catDesayunos.id, name: "Chilaquiles verdes", basePrice: 7000,
        prepStation: "KITCHEN", estimatedPrepMinutes: 15, sortOrder: 2,
      },
    });
    await tx.menuItemVariant.createMany({
      data: [
        { menuItemId: chilaquiles.id, name: "Sencillos", priceDelta: 0, isDefault: true },
        { menuItemId: chilaquiles.id, name: "Con pollo", priceDelta: 2000, isDefault: false },
      ],
    });
    const huevos = await tx.menuItem.create({
      data: {
        categoryId: catDesayunos.id, name: "Huevos al gusto", basePrice: 7000,
        prepStation: "KITCHEN", estimatedPrepMinutes: 15, sortOrder: 3,
      },
    });
    const smoothieChoco = await tx.menuItem.create({
      data: {
        categoryId: catDesayunos.id, name: "Smoothie Choco-Banana", basePrice: 6000,
        prepStation: "KITCHEN", estimatedPrepMinutes: 15, sortOrder: 4,
      },
    });
    const smoothieBerry = await tx.menuItem.create({
      data: {
        categoryId: catDesayunos.id, name: "Smoothie Berry Antiox", basePrice: 6500,
        prepStation: "KITCHEN", estimatedPrepMinutes: 15, sortOrder: 5,
      },
    });
    const smoothieVerde = await tx.menuItem.create({
      data: {
        categoryId: catDesayunos.id, name: "Smoothie Verde Detox", basePrice: 6500,
        prepStation: "KITCHEN", estimatedPrepMinutes: 15, sortOrder: 6,
      },
    });
    console.log(`  ✅ Page 1 MenuItems + Variants created`);

    // ─── A3. MODIFIER GROUPS + MODIFIERS (page 1) ─
    const extrasChilaquiles = await tx.modifierGroup.create({
      data: { name: "Extras Chilaquiles", minSelections: 0, maxSelections: 3, isRequired: false },
    });
    await tx.modifier.createMany({
      data: [
        { modifierGroupId: extrasChilaquiles.id, name: "Extra queso", priceDelta: 1500 },
        { modifierGroupId: extrasChilaquiles.id, name: "Extra crema", priceDelta: 1000 },
        { modifierGroupId: extrasChilaquiles.id, name: "Extra huevo", priceDelta: 2000 },
      ],
    });
    await tx.menuItemModifierGroup.create({
      data: { menuItemId: chilaquiles.id, modifierGroupId: extrasChilaquiles.id },
    });

    const coccionHuevos = await tx.modifierGroup.create({
      data: { name: "Cocción huevos", minSelections: 1, maxSelections: 1, isRequired: true },
    });
    await tx.modifier.createMany({
      data: [
        { modifierGroupId: coccionHuevos.id, name: "Estrellados", priceDelta: 0 },
        { modifierGroupId: coccionHuevos.id, name: "Revueltos", priceDelta: 0 },
        { modifierGroupId: coccionHuevos.id, name: "Torrejas", priceDelta: 0 },
      ],
    });
    await tx.menuItemModifierGroup.create({
      data: { menuItemId: huevos.id, modifierGroupId: coccionHuevos.id },
    });

    const extrasFruta = await tx.modifierGroup.create({
      data: { name: "Extras Fruta", minSelections: 0, maxSelections: 2, isRequired: false },
    });
    await tx.modifier.createMany({
      data: [
        { modifierGroupId: extrasFruta.id, name: "Extra yogurt", priceDelta: 1000 },
        { modifierGroupId: extrasFruta.id, name: "Miel extra", priceDelta: 500 },
      ],
    });
    await tx.menuItemModifierGroup.create({
      data: { menuItemId: frutaGranola.id, modifierGroupId: extrasFruta.id },
    });
    console.log(`  ✅ Page 1 ModifierGroups + Modifiers + relations created`);

    // ─── A4. TABLES ─────────────────────────────
    await tx.table.createMany({
      data: [
        { number: "T1", name: "Interior 1", qrToken: crypto.randomUUID(), capacity: 4, location: "Interior" },
        { number: "T2", name: "Interior 2", qrToken: crypto.randomUUID(), capacity: 4, location: "Interior" },
        { number: "T3", name: "Interior 3", qrToken: crypto.randomUUID(), capacity: 4, location: "Interior" },
        { number: "T4", name: "Interior 4", qrToken: crypto.randomUUID(), capacity: 4, location: "Interior" },
        { number: "T5", name: "Terraza 1", qrToken: crypto.randomUUID(), capacity: 4, location: "Terraza" },
        { number: "T6", name: "Terraza 2", qrToken: crypto.randomUUID(), capacity: 4, location: "Terraza" },
        { number: "T7", name: "Barra 1", qrToken: crypto.randomUUID(), capacity: 2, location: "Barra" },
        { number: "T8", name: "Barra 2", qrToken: crypto.randomUUID(), capacity: 2, location: "Barra" },
      ],
    });
    console.log(`  ✅ Tables created`);

    // ─── A5. STAFF ──────────────────────────────
    await tx.staff.createMany({
      data: [
        { name: "Carlos", role: "MESERO", hourlyRate: 5000 },
        { name: "María", role: "COCINERO", hourlyRate: 7000 },
        { name: "Luis", role: "BAR", hourlyRate: 5500 },
      ],
    });
    console.log(`  ✅ Staff created`);

    // ══════════════════════════════════════════════
    // B) PAGE 2 — Entradas, Ensaladas, Postres, Pizzas
    // ══════════════════════════════════════════════

    // ─── B1. CATEGORIES (page 2) ────────────────
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
    console.log(`  ✅ Page 2 Categories created`);

    // ─── B2. MENU ITEMS (page 2) ────────────────
    // ENTRADAS
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
    // ENSALADAS
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
    // POSTRES
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
    // PIZZAS
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
    console.log(`  ✅ Page 2 MenuItems created`);

    // ─── B3. VARIANTS (Pizza sizes) ─────────────
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

    // ─── B4. MODIFIER GROUPS (page 2) ───────────
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
    for (const pizza of pizzaItems) {
      await tx.menuItemModifierGroup.create({
        data: { menuItemId: pizza.id, modifierGroupId: extrasPizza.id },
      });
    }
    console.log(`  ✅ Extras Pizza modifier group + pivot created`);

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
    const ensaladaItems = [tropical, capresse, mixta];
    for (const ensalada of ensaladaItems) {
      await tx.menuItemModifierGroup.create({
        data: { menuItemId: ensalada.id, modifierGroupId: aderezo.id },
      });
    }
    console.log(`  ✅ Aderezo modifier group + pivot created`);
  });

  console.log("✅ [seed-restaurant-all] Seed complete — all restaurant data inserted");

  await prisma.$disconnect();
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ [seed-restaurant-all] Seed failed:", e);
    process.exit(1);
  });
