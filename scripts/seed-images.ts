import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

const UNSPLASH_ACCESS_KEY = "lyrpZlb-19TwOvl_IFgy1JnW2dgTgQwQWmOzZJ9YG5o";

const QUERIES: Record<string, string> = {
  "Café americano": "artisan coffee pour over cinematic",
  "Jugo de naranja": "fresh orange juice morning light",
  "Leche": "fresh milk glass farm rustic",
  "Chocolate": "hot chocolate artisan cozy",
  "Té": "tea ceremony elegant warm",
  "Refresco": "craft soda glass bubbles summer",
  "Agua mineral": "sparkling mineral water ice",
  "Cerveza": "craft beer amber golden hour",
  "Mojito": "mojito cocktail mint fresh",
  "Paloma": "paloma cocktail grapefruit pink",
  "Whisky": "whiskey glass moody lighting cinematic",
  "Fruta con granola": "granola bowl fruit colorful top view",
  "Chilaquiles verdes": "chilaquiles mexican authentic green salsa",
  "Huevos al gusto": "eggs breakfast rustic farm",
  "Smoothie Choco-Banana": "chocolate banana smoothie dark",
  "Smoothie Berry Antiox": "berry smoothie purple vibrant",
  "Smoothie Verde Detox": "green smoothie fresh detox healthy",
  "Guacamole": "guacamole mexican avocado stone table",
  "Aceitunas": "olives mediterranean wood bowl",
  "Quesadillas": "quesadilla mexican cheese pull",
  "Empanadas": "empanadas argentinian golden baked",
  "Verduritas": "vegetable platter colorful organic rustic",
  "Tropical": "tropical salad mango colorful fresh",
  "Capresse": "caprese salad italian basil mozzarella",
  "Mixta": "mixed salad fresh garden greens",
  "Eccle": "chocolate eclair pastry french gourmet",
  "Panqué": "pancakes stack syrup golden breakfast",
  "Pizza de Nutella": "nutella dessert pizza sweet chocolate",
  "Margarita": "margherita pizza italian basil authentic",
  "Champiñones": "mushroom pizza rustic wood fired",
  "Pepperoni": "pepperoni pizza dramatic lighting cheese",
  "Vegetariana": "vegetarian pizza colorful vegetables artisan",
  "Tomate deshidratado": "sun dried tomato pizza gourmet italian",
  "Prosciutto": "prosciutto pizza arugula premium italian",
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface UnsplashResult {
  urls: { regular: string; small: string; raw: string };
  alt_description: string | null;
  user: { name: string; links: { html: string } };
}

async function searchUnsplash(query: string, itemName: string): Promise<{
  imageUrl: string | null;
  credit: string | null;
}> {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
    query
  )}&client_id=${UNSPLASH_ACCESS_KEY}&per_page=1&orientation=landscape`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          "Accept-Version": "v1",
        },
      });

      if (res.status === 403) {
        const body = await res.text();
        console.warn(`  ⚠️  403 Forbidden for "${itemName}": ${body.substring(0, 200)}`);
        return { imageUrl: null, credit: null };
      }

      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get("Retry-After") || "60", 10);
        console.warn(`  ⚠️  Rate limited! Waiting ${retryAfter}s...`);
        await sleep(retryAfter * 1000);
        continue;
      }

      if (!res.ok) {
        console.warn(
          `  ⚠️  HTTP ${res.status} for "${itemName}", attempt ${attempt + 1}`
        );
        if (attempt < 2) {
          await sleep(2000);
          continue;
        }
        return { imageUrl: null, credit: null };
      }

      const data = await res.json();
      const results: UnsplashResult[] = data.results;

      if (!results || results.length === 0) {
        console.warn(`  ⚠️  No results for "${itemName}"`);
        return { imageUrl: null, credit: null };
      }

      const photo = results[0];
      // Use the regular URL and append attribution params
      let imageUrl = photo.urls.regular;
      // Ensure utm params for proper Unsplash attribution
      const utmParams = `utm_source=Hangar5&utm_medium=referral`;
      if (imageUrl.includes("?")) {
        imageUrl += `&${utmParams}`;
      } else {
        imageUrl += `?${utmParams}`;
      }

      const credit = `Photo by ${photo.user.name} on Unsplash (${photo.user.links.html})`;

      return { imageUrl, credit };
    } catch (err) {
      console.warn(`  ⚠️  Fetch error for "${itemName}": ${err}, attempt ${attempt + 1}`);
      if (attempt < 2) {
        await sleep(2000);
      }
    }
  }

  return { imageUrl: null, credit: null };
}

async function main() {
  // Idempotent check — skip if images already seeded
  const alreadyDone = await prisma.menuItem.count({
    where: { imageUrl: { not: null, contains: "images.unsplash.com" } }
  });
  if (alreadyDone >= 30) {
    console.log(`⚠️ ${alreadyDone} items ya tienen fotos de Unsplash, saltando`);
    return;
  }
  console.log("📸 Seeding real Unsplash food photos for Hangar 5 menu...\n");
  const items = await prisma.menuItem.findMany({
    select: { id: true, name: true },
    orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
  });

  console.log(`  Found ${items.length} menu items\n`);

  let ok = 0;
  let fail = 0;
  let cached = 0;

  for (const item of items) {
    const query = QUERIES[item.name];
    if (!query) {
      console.log(`  ❓ ${item.name} → no query defined, skipping`);
      fail++;
      continue;
    }

    process.stdout.write(`  📷 ${item.name.padEnd(28)} `);
    const { imageUrl, credit } = await searchUnsplash(query, item.name);

    if (imageUrl) {
      await prisma.menuItem.update({
        where: { id: item.id },
        data: { imageUrl },
      });
      const shortUrl =
        imageUrl.length > 60
          ? imageUrl.substring(0, 57) + "..."
          : imageUrl;
      console.log(`✅`);
      console.log(`     ${shortUrl}`);
      console.log(`     📸 ${credit}`);
      ok++;
    } else {
      console.log(`❌`);
      fail++;
    }

    // Wait 1.5s between requests to respect rate limit
    if (ok + fail < items.length) {
      await sleep(1500);
    }
  }

  console.log(`\n📊 Done: ${ok} images saved, ${fail} failed${cached > 0 ? `, ${cached} cached` : ""}`);
  console.log(`\n🔗 Photographer credits are embedded in the URLs (utm_source=Hangar5&utm_medium=referral)`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("💥 Fatal:", e);
    process.exit(1);
  });
