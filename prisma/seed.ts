import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

// ═══════════════════════════════════════════════════════════════════════════════
// HOTEL ITEMS
// ═══════════════════════════════════════════════════════════════════════════════

const items = [
  { name: "Casa del Árbol", slug: "casa-del-arbol", type: "cabana", description: "Fundida en la naturaleza, un espacio para descansar y conectar profundamente con la tierra. Rodeada de árboles y con vista al valle, es nuestra cabaña más emblemática.", price: 250000, capacity: "2 huéspedes · Cama Queen", image: "/img/items/casa-del-arbol/01.jpg", featured: true },
  { name: "Medialuna", slug: "medialuna", type: "cabana", description: "Acogedora y tranquila con una vista privilegiada de la montaña. Perfecta para parejas que buscan una escapada romántica.", price: 200000, capacity: "3 huéspedes · Cama Queen + Futón", image: "/img/items/medialuna/01.jpg", featured: true },
  { name: "Cóndor y Zopilote", slug: "condor-zopilote", type: "cabana", description: "Chalet con vista panorámica a la montaña. Disfruta de la tranquilidad y comodidad en un espacio diseñado para el descanso absoluto.", price: 280000, capacity: "3 huéspedes · Cama King + Sofá", image: "/img/items/condor-zopilote/01.jpg", featured: true },
  { name: "Zopilote", slug: "zopilote", type: "cabana", description: "Cabaña Zopilote — un espacio único para conectar con la naturaleza rodeado de los paisajes del Peñón.", price: 220000, capacity: "2 huéspedes · Cama Queen", image: "/img/items/zopilote/01.jpg", featured: true },
  { name: "Glamping Familiar", slug: "glamping-familiar", type: "glamping", description: "Espacio ideal para familias. Conexión total con la naturaleza sin renunciar a la comodidad. Dos camas matrimoniales bajo un cielo estrellado.", price: 130000, capacity: "4 huéspedes · 2 camas matrimoniales", image: "/img/items/glamping-familiar/01.jpg", featured: false },
  { name: "Glamping Individual", slug: "glamping-individual", type: "glamping", description: "Perfecto para una escapada en solitario o en pareja. Un refugio minimalista entre los árboles.", price: 90000, capacity: "2 huéspedes · 1 cama Queen", image: "/img/items/glamping-individual/01.jpg", featured: false },
  { name: "Moto Enduro 300cc #1", slug: "moto-1", type: "moto", description: "Motocicleta de enduro 300cc. Ideal para explorar los senderos del Peñón a toda velocidad. Equipo de protección incluido.", price: 180000, capacity: "1 persona", image: "/img/items/moto-1/01.jpg", featured: false },
  { name: "Moto Enduro 300cc #2", slug: "moto-2", type: "moto", description: "Segunda unidad de nuestra flotilla de enduro. Perfecta para salir en grupo.", price: 180000, capacity: "1 persona", image: "/img/items/moto-2/01.jpg", featured: false },
  { name: "Moto Enduro 300cc #3", slug: "moto-3", type: "moto", description: "Tercera unidad de nuestra flotilla de enduro. Lista para dominar los senderos más técnicos del Peñón.", price: 180000, capacity: "1 persona", image: "/img/items/moto-3/01.jpg", featured: false },
  { name: "Bici Enduro 160mm #1", slug: "bici-1", type: "bici", description: "Bicicleta de doble suspensión con 160mm de recorrido. Geometría agresiva para dominar los senderos más técnicos.", price: 95000, capacity: "1 persona", image: "/img/items/bici-1/01.jpg", featured: false },
  { name: "Bici Enduro 160mm #2", slug: "bici-2", type: "bici", description: "Segunda bici de nuestra flotilla. Doble suspensión lista para cualquier terreno.", price: 95000, capacity: "1 persona", image: "/img/items/bici-2/01.jpg", featured: false },
  { name: "Bici Enduro 160mm #3", slug: "bici-3", type: "bici", description: "Tercera unidad disponible. Recorrido de 160mm, geometría de enduro.", price: 95000, capacity: "1 persona", image: "/img/items/bici-3/01.jpg", featured: false },
  { name: "Parapente — Aventura", slug: "parapente-aventura", type: "parapente", description: "Vuelo en tándem de aproximadamente 20 minutos de duración aterrizando en Hangar 5. Una experiencia única para sentir la libertad del vuelo. Incluye instructor certificado y equipo completo.", price: 250000, capacity: "20 min · 1 persona", image: "/img/items/parapente-aventura/01.jpg", featured: true },
  { name: "Parapente — Exploración", slug: "parapente-exploracion", type: "parapente", description: "Vuelo en tándem extendido de aproximadamente 45 minutos sobre los paisajes del Peñón. Más altura, más distancia, más adrenalina. Incluye instructor certificado y equipo completo.", price: 350000, capacity: "45 min · 1 persona", image: "/img/items/parapente-exploracion/01.jpg", featured: true },
  { name: "Ala Delta", slug: "ala-delta", type: "aladelta", description: "Vuelo en tándem con instructor de aproximadamente 20 minutos de duración aterrizando en Hangar 5. Una perspectiva única del valle desde las alas.", price: 300000, capacity: "20 min · 1 persona", image: "/img/items/ala-delta/01.jpg", featured: true },
  { name: "Hike Guiado", slug: "hike-guiado", type: "hike", description: "Caminata guiada de aproximadamente una hora por los bosques aledaños al Peñón. Grupos de 1 a 4 personas como máximo. Conecta con la naturaleza a través de senderos espectaculares.", price: 50000, capacity: "~1 hora · grupos de 1-4 pers.", image: "/img/items/hike-guiado/01.jpg", featured: true },
];

// ═══════════════════════════════════════════════════════════════════════════════
// RESTAURANT CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════

const categories = [
  { name: "BEBIDAS NO ALCOHÓLICAS", sortOrder: 1, kind: "DRINK" },
  { name: "BEBIDAS ALCOHÓLICAS",     sortOrder: 2, kind: "DRINK" },
  { name: "DESAYUNOS",               sortOrder: 3, kind: "FOOD"  },
  { name: "ENTRADAS",                sortOrder: 4, kind: "FOOD"  },
  { name: "ENSALADAS",               sortOrder: 5, kind: "FOOD"  },
  { name: "POSTRES",                 sortOrder: 6, kind: "FOOD"  },
  { name: "PIZZAS",                  sortOrder: 7, kind: "FOOD"  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MENU ITEMS (with variants, modifier groups, category, etc.)
// ═══════════════════════════════════════════════════════════════════════════════

interface MenuItemDef {
  name: string;
  basePrice: number;
  prepStation: string;
  sortOrder: number;
  description?: string;
  variants?: { name: string; priceDelta: number }[];
  modifierGroups?: string[]; // names of modifier groups
}

const menuItemsByCategory: Record<string, MenuItemDef[]> = {
  "BEBIDAS NO ALCOHÓLICAS": [
    { name: "Café americano",  basePrice: 3000,  prepStation: "BAR",    sortOrder: 1 },
    { name: "Jugo de naranja", basePrice: 3500,  prepStation: "BAR",    sortOrder: 2 },
    { name: "Leche",           basePrice: 2500,  prepStation: "BAR",    sortOrder: 3 },
    { name: "Chocolate",       basePrice: 3500,  prepStation: "BAR",    sortOrder: 4 },
    { name: "Té",              basePrice: 2500,  prepStation: "BAR",    sortOrder: 5, variants: [
      { name: "Té negro", priceDelta: 0 }, { name: "Té verde", priceDelta: 0 }, { name: "Té de hierbas", priceDelta: 0 }
    ]},
    { name: "Refresco",        basePrice: 3000,  prepStation: "BAR",    sortOrder: 6 },
    { name: "Agua mineral",    basePrice: 2500,  prepStation: "BAR",    sortOrder: 7 },
  ],
  "BEBIDAS ALCOHÓLICAS": [
    { name: "Cerveza",         basePrice: 3500,  prepStation: "BAR",    sortOrder: 1 },
    { name: "Mojito",          basePrice: 10000, prepStation: "BAR",    sortOrder: 2 },
    { name: "Paloma",          basePrice: 11000, prepStation: "BAR",    sortOrder: 3 },
    { name: "Whisky",          basePrice: 11000, prepStation: "BAR",    sortOrder: 4 },
  ],
  "DESAYUNOS": [
    { name: "Fruta con granola",     basePrice: 6500, prepStation: "KITCHEN", sortOrder: 1, modifierGroups: ["Extras Fruta"] },
    { name: "Chilaquiles verdes",    basePrice: 7000, prepStation: "KITCHEN", sortOrder: 2, modifierGroups: ["Extras Chilaquiles"], variants: [
      { name: "Sencillos", priceDelta: 0 }, { name: "Con pollo", priceDelta: 2000 }
    ]},
    { name: "Huevos al gusto",       basePrice: 7000, prepStation: "KITCHEN", sortOrder: 3, modifierGroups: ["Cocción huevos"] },
    { name: "Smoothie Choco-Banana", basePrice: 6000, prepStation: "KITCHEN", sortOrder: 4 },
    { name: "Smoothie Berry Antiox", basePrice: 6500, prepStation: "KITCHEN", sortOrder: 5 },
    { name: "Smoothie Verde Detox",  basePrice: 6500, prepStation: "KITCHEN", sortOrder: 6 },
  ],
  "ENTRADAS": [
    { name: "Guacamole",   basePrice: 6500, prepStation: "COLD_STATION", sortOrder: 1 },
    { name: "Aceitunas",   basePrice: 2500, prepStation: "COLD_STATION", sortOrder: 2 },
    { name: "Quesadillas", basePrice: 7000, prepStation: "KITCHEN",      sortOrder: 3 },
    { name: "Empanadas",   basePrice: 7000, prepStation: "KITCHEN",      sortOrder: 4 },
    { name: "Verduritas",  basePrice: 6000, prepStation: "COLD_STATION", sortOrder: 5 },
  ],
  "ENSALADAS": [
    { name: "Tropical", basePrice: 8000, prepStation: "COLD_STATION", sortOrder: 1, modifierGroups: ["Aderezo"] },
    { name: "Capresse", basePrice: 7500, prepStation: "COLD_STATION", sortOrder: 2, modifierGroups: ["Aderezo"] },
    { name: "Mixta",    basePrice: 7000, prepStation: "COLD_STATION", sortOrder: 3, modifierGroups: ["Aderezo"] },
  ],
  "POSTRES": [
    { name: "Eccle",             basePrice: 7000, prepStation: "COLD_STATION", sortOrder: 1 },
    { name: "Panqué",            basePrice: 6500, prepStation: "COLD_STATION", sortOrder: 2 },
    { name: "Pizza de Nutella",  basePrice: 8500, prepStation: "KITCHEN",      sortOrder: 3 },
  ],
  "PIZZAS": [
    { name: "Margarita",            basePrice: 12000, prepStation: "KITCHEN", sortOrder: 1, modifierGroups: ["Extras Pizza"], variants: [
      { name: "Personal", priceDelta: 0 }, { name: "Familiar", priceDelta: 10000 }
    ]},
    { name: "Champiñones",          basePrice: 14000, prepStation: "KITCHEN", sortOrder: 2, modifierGroups: ["Extras Pizza"], variants: [
      { name: "Personal", priceDelta: 0 }, { name: "Familiar", priceDelta: 10000 }
    ]},
    { name: "Pepperoni",            basePrice: 15000, prepStation: "KITCHEN", sortOrder: 3, modifierGroups: ["Extras Pizza"], variants: [
      { name: "Personal", priceDelta: 0 }, { name: "Familiar", priceDelta: 10000 }
    ]},
    { name: "Vegetariana",          basePrice: 14000, prepStation: "KITCHEN", sortOrder: 4, modifierGroups: ["Extras Pizza"], variants: [
      { name: "Personal", priceDelta: 0 }, { name: "Familiar", priceDelta: 10000 }
    ]},
    { name: "Tomate deshidratado",  basePrice: 16000, prepStation: "KITCHEN", sortOrder: 5, modifierGroups: ["Extras Pizza"], variants: [
      { name: "Personal", priceDelta: 0 }, { name: "Familiar", priceDelta: 10000 }
    ]},
    { name: "Prosciutto",           basePrice: 24000, prepStation: "KITCHEN", sortOrder: 6, modifierGroups: ["Extras Pizza"], variants: [
      { name: "Personal", priceDelta: 0 }, { name: "Familiar", priceDelta: 10000 }
    ]},
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODIFIER GROUPS + MODIFIERS
// ═══════════════════════════════════════════════════════════════════════════════

const modifierGroups: { name: string; isRequired: boolean; minSelections: number; maxSelections: number; modifiers: { name: string; priceDelta: number }[] }[] = [
  {
    name: "Extras Chilaquiles", isRequired: false, minSelections: 0, maxSelections: 3,
    modifiers: [
      { name: "Extra queso", priceDelta: 1500 },
      { name: "Extra crema", priceDelta: 1000 },
      { name: "Extra huevo", priceDelta: 2000 },
    ],
  },
  {
    name: "Cocción huevos", isRequired: true, minSelections: 1, maxSelections: 1,
    modifiers: [
      { name: "Estrellados", priceDelta: 0 },
      { name: "Revueltos",   priceDelta: 0 },
      { name: "Torrejas",    priceDelta: 0 },
    ],
  },
  {
    name: "Extras Fruta", isRequired: false, minSelections: 0, maxSelections: 2,
    modifiers: [
      { name: "Extra yogurt", priceDelta: 1000 },
      { name: "Miel extra",   priceDelta: 500  },
    ],
  },
  {
    name: "Extras Pizza", isRequired: false, minSelections: 0, maxSelections: 5,
    modifiers: [
      { name: "Extra queso",               priceDelta: 2000 },
      { name: "Extra pepperoni",           priceDelta: 2500 },
      { name: "Extra champiñones",         priceDelta: 1500 },
      { name: "Orilla rellena de queso",   priceDelta: 3500 },
    ],
  },
  {
    name: "Aderezo", isRequired: true, minSelections: 1, maxSelections: 1,
    modifiers: [
      { name: "Vinagreta",    priceDelta: 0 },
      { name: "César",        priceDelta: 0 },
      { name: "Miel-mostaza", priceDelta: 0 },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// TABLES
// ═══════════════════════════════════════════════════════════════════════════════

const tables = [
  { number: "T1", name: "Interior 1", capacity: 4, location: "Interior", qrToken: "t1" },
  { number: "T2", name: "Interior 2", capacity: 4, location: "Interior", qrToken: "t2" },
  { number: "T3", name: "Interior 3", capacity: 4, location: "Interior", qrToken: "t3" },
  { number: "T4", name: "Interior 4", capacity: 4, location: "Interior", qrToken: "t4" },
  { number: "T5", name: "Terraza 1",  capacity: 4, location: "Terraza",  qrToken: "t5" },
  { number: "T6", name: "Terraza 2",  capacity: 4, location: "Terraza",  qrToken: "t6" },
  { number: "T7", name: "Barra 1",    capacity: 2, location: "Barra",    qrToken: "t7" },
  { number: "T8", name: "Barra 2",    capacity: 2, location: "Barra",    qrToken: "t8" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SEED
// ═══════════════════════════════════════════════════════════════════════════════

async function clearOperationalData() {
  console.log("🧹 Limpiando datos operativos...");
  await prisma.orderStatusEvent.deleteMany();
  await prisma.orderItemModifier.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.serviceSession.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.staffShift.deleteMany();
  await prisma.staffClock.deleteMany();
  await prisma.customerLedgerEntry.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.fixedExpense.deleteMany();
  console.log("  ✅ Datos operativos limpios");
}

async function seedReferenceData() {
  console.log("\n📦 Sembrando datos de referencia...");

  // Items (hotel)
  let itemCount = 0;
  for (const item of items) {
    await prisma.item.upsert({ where: { slug: item.slug }, update: item, create: item });
    itemCount++;
  }
  console.log(`  🏨 Items: ${itemCount}`);

  // Categories
  let catCount = 0;
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: `cat-${cat.sortOrder}` },
      update: cat,
      create: { id: `cat-${cat.sortOrder}`, ...cat, isActive: true },
    });
    catCount++;
  }
  console.log(`  📋 Categorías: ${catCount}`);

  // Modifier groups + modifiers
  const groupCache: Record<string, string> = {};
  for (const group of modifierGroups) {
    const g = await prisma.modifierGroup.upsert({
      where: { id: `mg-${group.name.toLowerCase().replace(/\s+/g, "-")}` },
      update: { name: group.name, isRequired: group.isRequired, minSelections: group.minSelections, maxSelections: group.maxSelections },
      create: { id: `mg-${group.name.toLowerCase().replace(/\s+/g, "-")}`, name: group.name, isRequired: group.isRequired, minSelections: group.minSelections, maxSelections: group.maxSelections },
    });
    groupCache[group.name] = g.id;
    for (const mod of group.modifiers) {
      const modId = `mod-${group.name.toLowerCase().replace(/\s+/g, "-")}-${mod.name.toLowerCase().replace(/\s+/g, "-")}`;
      await prisma.modifier.upsert({
        where: { id: modId },
        update: { modifierGroupId: g.id, name: mod.name, priceDelta: mod.priceDelta },
        create: { id: modId, modifierGroupId: g.id, name: mod.name, priceDelta: mod.priceDelta },
      });
    }
  }
  console.log(`  🔧 Modifier Groups: ${modifierGroups.length}`);

  // Menu items + variants + modifier links
  let menuCount = 0;
  for (const cat of categories) {
    const items = menuItemsByCategory[cat.name] || [];
    for (const itemDef of items) {
      const menuItemId = `mi-${cat.sortOrder}-${itemDef.sortOrder}`;
      await prisma.menuItem.upsert({
        where: { id: menuItemId },
        update: {
          categoryId: `cat-${cat.sortOrder}`,
          name: itemDef.name,
          description: itemDef.description || null,
          basePrice: itemDef.basePrice,
          prepStation: itemDef.prepStation,
          sortOrder: itemDef.sortOrder,
          isActive: true,
        },
        create: {
          id: menuItemId,
          categoryId: `cat-${cat.sortOrder}`,
          name: itemDef.name,
          description: itemDef.description || null,
          basePrice: itemDef.basePrice,
          prepStation: itemDef.prepStation,
          sortOrder: itemDef.sortOrder,
          isActive: true,
        },
      });

      // Variants
      if (itemDef.variants) {
        for (let v = 0; v < itemDef.variants.length; v++) {
          const variant = itemDef.variants[v];
          await prisma.menuItemVariant.upsert({
            where: { id: `${menuItemId}-v${v}` },
            update: { menuItemId, name: variant.name, priceDelta: variant.priceDelta },
            create: { id: `${menuItemId}-v${v}`, menuItemId, name: variant.name, priceDelta: variant.priceDelta },
          });
        }
      }

      // Modifier group links
      if (itemDef.modifierGroups) {
        for (const mgName of itemDef.modifierGroups) {
          const groupId = groupCache[mgName];
          if (groupId) {
            const linkId = `${menuItemId}-${groupId}`;
            await prisma.menuItemModifierGroup.upsert({
              where: { id: linkId },
              update: { menuItemId, modifierGroupId: groupId },
              create: { id: linkId, menuItemId, modifierGroupId: groupId },
            });
          }
        }
      }

      menuCount++;
    }
  }
  console.log(`  🍽️ Menu Items: ${menuCount}`);

  // Tables
  for (const table of tables) {
    await prisma.table.upsert({
      where: { number: table.number },
      update: table,
      create: { ...table, isActive: true },
    });
  }
  console.log(`  🪑 Mesas: ${tables.length}`);

  // Staff (reference only — waiter login is in frontend)
  const staff = [
    { name: "Carlos", role: "WAITER",   hourlyRate: 5000, isActive: true },
    { name: "María",  role: "COOK",     hourlyRate: 7000, isActive: true },
    { name: "Luis",   role: "BARTENDER", hourlyRate: 5500, isActive: true },
  ];
  for (const s of staff) {
    await prisma.staff.upsert({
      where: { id: `staff-${s.name.toLowerCase()}` },
      update: s,
      create: { id: `staff-${s.name.toLowerCase()}`, ...s },
    });
  }
  console.log(`  👥 Staff: ${staff.length}`);
}

async function main() {
  console.log("🌱 Hangar 5 Seed\n" + "═".repeat(40));
  await clearOperationalData();
  await seedReferenceData();
  console.log("\n" + "═".repeat(40));
  console.log("✅ Seed completo. Listo para dry run.");
}

main()
  .catch((e) => { console.error("❌", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
