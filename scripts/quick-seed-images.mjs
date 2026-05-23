const ACCESS_KEY = "lyrpZlb-19TwOvl_IFgy1JnW2dgTgQwQWmOzZJ9YG5o";

const QUERIES = {
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

async function searchUnsplash(query) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=${ACCESS_KEY}&per_page=1&orientation=landscape`;
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${ACCESS_KEY}` } });
  const data = await res.json();
  if (data.results?.length > 0) {
    return data.results[0].urls.small;
  }
  return null;
}

async function main() {
  // 1. Get all menu items from Render
  const BASE = "https://hangar5.onrender.com";
  const itemsRes = await fetch(`${BASE}/api/admin/restaurant/menu-items`);
  const items = await itemsRes.json();
  console.log(`Found ${items.length} items`);

  let ok = 0;
  for (const item of items) {
    const query = QUERIES[item.name];
    if (!query) { console.log(`  ❓ ${item.name} - no query`); continue; }
    
    // Skip if already has unsplash image
    if (item.imageUrl?.includes('images.unsplash.com')) {
      console.log(`  ✅ ${item.name} - already has photo`);
      ok++;
      continue;
    }

    process.stdout.write(`  📷 ${item.name}... `);
    const imageUrl = await searchUnsplash(query);
    if (imageUrl) {
      console.log(`OK (${imageUrl.substring(0,50)}...)`);
      // Update via Render API
      const updateRes = await fetch(`${BASE}/api/admin/restaurant/menu-items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: item.name, imageUrl }),
      });
      if (updateRes.ok) ok++;
      else console.log(`    Update failed: ${updateRes.status}`);
    } else {
      console.log('no result');
    }
    // Rate limit
    await new Promise(r => setTimeout(r, 1500));
  }
  console.log(`\nDone. ${ok}/${items.length} items with photos.`);
}

main().catch(console.error);
