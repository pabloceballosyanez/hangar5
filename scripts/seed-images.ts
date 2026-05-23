import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

/**
 * Seeding strategy:
 * source.unsplash.com (deprecated, 503) and the official Unsplash API
 * both require an API key or are unavailable. We use picsum.photos which
 * serves the SAME Unsplash photos (cached) via seed-based deterministic URLs.
 * Each item gets a unique beautiful photo for their menu card.
 */

// Seed strings that capture the item's spirit
const ITEM_SEEDS: Record<string, string> = {
  // BEBIDAS NO ALCOHÓLICAS
  "Café americano": "coffee-cinematic",
  "Jugo de naranja": "orange-juice-fresh",
  "Leche": "milk-glass-vintage",
  "Chocolate": "hot-chocolate-cozy",
  "Té": "tea-ceremony-elegant",
  "Refresco": "craft-soda-bubbles",
  "Agua mineral": "mineral-water-sparkling",

  // BEBIDAS ALCOHÓLICAS
  "Cerveza": "craft-beer-amber",
  "Mojito": "mojito-cocktail-fresh",
  "Paloma": "paloma-grapefruit-sunset",
  "Whisky": "whiskey-moody-lighting",

  // DESAYUNOS
  "Fruta con granola": "granola-bowl-fruit",
  "Chilaquiles verdes": "chilaquiles-mexican",
  "Huevos al gusto": "eggs-breakfast-rustic",
  "Smoothie Choco-Banana": "chocolate-smoothie",
  "Smoothie Berry Antiox": "berry-smoothie-vibrant",
  "Smoothie Verde Detox": "green-smoothie-fresh",

  // ENTRADAS
  "Guacamole": "guacamole-mexican",
  "Aceitunas": "olives-mediterranean",
  "Quesadillas": "quesadilla-mexican",
  "Empanadas": "empanadas-golden",
  "Verduritas": "vegetable-platter-colorful",

  // ENSALADAS
  "Tropical": "tropical-salad-mango",
  "Capresse": "caprese-salad-italian",
  "Mixta": "mixed-salad-garden",

  // POSTRES
  "Eccle": "eclair-chocolate-pastry",
  "Panqué": "pancake-stack-syrup",
  "Pizza de Nutella": "nutella-pizza-dessert",

  // PIZZAS
  "Margarita": "margherita-pizza-basil",
  "Champiñones": "mushroom-pizza-rustic",
  "Pepperoni": "pepperoni-pizza-classic",
  "Vegetariana": "vegetarian-pizza-artisan",
  "Tomate deshidratado": "sun-dried-tomato-pizza",
  "Prosciutto": "prosciutto-pizza-arugula",
};

function getSeed(name: string): string {
  return ITEM_SEEDS[name] ?? name.toLowerCase().replace(/\s+/g, "-");
}

async function resolveImageUrl(name: string): Promise<string | null> {
  const seed = getSeed(name);
  const url = `https://picsum.photos/seed/${encodeURIComponent(seed)}/800/600`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { redirect: "follow" });
      if (response.ok) {
        return response.url; // final URL from picsum CDN
      }
      console.warn(`  ⚠️  HTTP ${response.status} for "${name}", attempt ${attempt + 1}`);
    } catch (err) {
      console.warn(`  ⚠️  Fetch error for "${name}": ${err}, attempt ${attempt + 1}`);
    }
    if (attempt < 2) await new Promise((r) => setTimeout(r, 1000));
  }
  return null;
}

async function main() {
  console.log("📸 Seeding menu item images from Unsplash (via Picsum)...\n");
  console.log("  ℹ️  Picsum caches real Unsplash photos by seed\n");

  const items = await prisma.menuItem.findMany({
    where: { imageUrl: null },
    select: { id: true, name: true },
    orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
  });

  console.log(`  Found ${items.length} items without images\n`);

  let ok = 0;
  let fail = 0;

  for (const item of items) {
    process.stdout.write(`  📷 ${item.name}... `);
    const imageUrl = await resolveImageUrl(item.name);

    if (imageUrl) {
      await prisma.menuItem.update({
        where: { id: item.id },
        data: { imageUrl },
      });
      console.log(`✅ saved`);
      ok++;
    } else {
      console.log("❌ failed");
      fail++;
    }

    // Be kind to the server
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n📊 Done: ${ok} images saved, ${fail} failed`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("💥 Fatal:", e);
    process.exit(1);
  });
