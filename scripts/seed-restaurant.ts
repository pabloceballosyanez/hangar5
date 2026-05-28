import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding restaurant data...");

  await prisma.$transaction(async (tx) => {
    // ──────────────────────────────────────────────
    // 1. CATEGORIES
    // ──────────────────────────────────────────────
    const catNoAlcohol = await tx.category.create({
      data: { name: "BEBIDAS NO ALCOHÓLICAS", kind: "DRINK", sortOrder: 1 },
    });
    const catAlcohol = await tx.category.create({
      data: { name: "BEBIDAS ALCOHÓLICAS", kind: "DRINK", sortOrder: 2 },
    });
    const catDesayunos = await tx.category.create({
      data: { name: "DESAYUNOS", kind: "FOOD", sortOrder: 3 },
    });
    console.log(`  ✅ Categories created`);

    // ──────────────────────────────────────────────
    // 2. MENU ITEMS + VARIANTS
    // ──────────────────────────────────────────────
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

    // DESAYUNOS (KITCHEN, estPrepMinutes: 15)
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
    console.log(`  ✅ MenuItems + Variants created`);

    // ──────────────────────────────────────────────
    // 3. MODIFIER GROUPS + MODIFIERS + PIVOT
    // ──────────────────────────────────────────────
    // Extras Chilaquiles → Chilaquiles verdes
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

    // Cocción huevos → Huevos al gusto
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

    // Extras Fruta → Fruta con granola
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
    console.log(`  ✅ ModifierGroups + Modifiers + relations created`);

    // ──────────────────────────────────────────────
    // 4. TABLES
    // ──────────────────────────────────────────────
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

    // ──────────────────────────────────────────────
    // 5. STAFF
    // ──────────────────────────────────────────────
    await tx.staff.createMany({
      data: [
        { name: "Carlos", role: "MESERO", hourlyRate: 5000 },
        { name: "María", role: "COCINERO", hourlyRate: 7000 },
        { name: "Luis", role: "BAR", hourlyRate: 5500 },
      ],
    });
    console.log(`  ✅ Staff created`);
  });

  console.log("✅ Seed complete");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
