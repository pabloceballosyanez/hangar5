import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_STYLES = [
  {
    name: "topografico",
    prompt: `Professional restaurant menu design for "HANGAR 5 - Cocina de Montaña" in Mexico. 
STYLE: Adventure topographic. Background shows subtle mountain contour lines like a hiking map. Dark forest green (#1b4235) header, terracotta (#b88364) accents, cream paper texture. 
Sections with elegant titles: CAFETERIA, SIN ALCOHOL, CON ALCOHOL, DESAYUNOS, ENTRADAS Y ENSALADAS, PARRILLA, HORNO DE LEÑA, POSTRES. 
Each section has 4-8 items with prices aligned right. Clean modern typography. 
Decor: thin geometric elevation lines, a subtle paraglider silhouette in the corner. 
Look: boutique adventure lodge menu, ready to print on letter paper, high-end design. No emojis, no clip art.`,
  },
  {
    name: "vuelo",
    prompt: `Professional restaurant menu design for "HANGAR 5 - Cocina de Montaña" in Mexico.
STYLE: Flight lines. Dynamic diagonal composition inspired by paragliding flight paths. Clean white background with sweeping curved lines in burnt orange (#e07a5f) and forest green (#1b4235). 
Sections float across the page like wind currents: CAFETERIA, BEBIDAS, DESAYUNOS, ENTRADAS, HORNO DE LEÑA, PARRILLA, POSTRES.
Each item has name and price, minimalist sans-serif font. 
Decor: thin sweeping arcs suggesting thermal currents, a tiny paraglider wing silhouette near the title. 
Look: modern, airy, dynamic. Not traditional restaurant. Feels like flight. No emojis.`,
  },
  {
    name: "fogata",
    prompt: `Professional restaurant menu design for "HANGAR 5 - Cocina de Montaña" in Mexico.
STYLE: Campfire evening. Dark warm background with subtle wood grain texture and glowing amber accents. Title in bold white letters. 
Colors: deep charcoal, warm amber (#e07a5f), cream (#faf7f5) for text.
Sections with rustic uppercase titles: CAFETERIA, SIN ALCOHOL, CON ALCOHOL, DESAYUNOS, ENTRADAS, HORNO DE LEÑA, PARRILLA, POSTRES.
Each item listed with clean spacing, prices in amber. 
Decor: subtle flame-like gradient edges, tiny campfire icon near footer, mountain silhouette at bottom.
Look: cozy but sophisticated. Like a menu you'd read by firelight at a mountain lodge. No emojis.`,
  },
];

export async function POST(req: NextRequest) {
  const adminSession = req.cookies.get("hangar5_admin_session")?.value;
  const adminHeader = req.headers.get("x-admin-password");
  const ADMIN_PW = "***";
  if ((!adminSession || adminSession !== "true") && adminHeader !== ADMIN_PW) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const openAIKey = process.env.OPENAI_API_KEY;
  if (!openAIKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY no configurada" }, { status: 502 });
  }

  let styles = DEFAULT_STYLES;
  try {
    const body = await req.json();
    if (body.styles && Array.isArray(body.styles)) {
      styles = body.styles;
    }
  } catch {
    // no body or invalid JSON → use defaults
  }

  const size = "1024x1024"; // faster generation

  const results: { name: string; url: string | null; error?: string }[] = [];

  for (const style of styles) {
    try {
      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${openAIKey}` },
        body: JSON.stringify({ model: "gpt-image-2", prompt: style.prompt, n: 1, size: "1024x1024", quality: "standard" }),
      });
      const data = await res.json();
      if (data.data?.[0]?.url) {
        results.push({ name: style.name, url: data.data[0].url });
      } else {
        results.push({ name: style.name, url: null, error: data.error?.message || "unknown" });
      }
    } catch (e) {
      results.push({ name: style.name, url: null, error: String(e).slice(0, 100) });
    }
  }

  return NextResponse.json({ success: true, results });
}
