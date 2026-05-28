import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST — generate and assign AI food photos for each menu item
export async function POST(req: NextRequest) {
  const adminSession = req.cookies.get("hangar5_admin_session")?.value;
  if (!adminSession || adminSession !== "true") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const openAIKey = process.env.OPENAI_API_KEY;
  if (!openAIKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY no configurada" }, { status: 502 });
  }

  const menuItems = await prisma.menuItem.findMany({
    include: { category: true },
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });

  const results: string[] = [];
  let updated = 0;

  for (const item of menuItems) {
    const catName = item.category?.name || "";
    const prompt = `Professional food photography, close-up overhead shot of "${item.name}", ${catName}, authentic Mexican restaurant style, warm natural lighting, shallow depth of field, high resolution, appetizing, rustic ceramic plate, wooden table background`;

    try {
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAIKey}`,
        },
        body: JSON.stringify({
          model: "dall-e-2",
          prompt,
          n: 1,
          size: "512x512",
          quality: "standard",
          response_format: "b64_json",
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        results.push(`⚠️ ${item.name}: API error ${response.status}`);
        continue;
      }

      const data = await response.json();
      const base64 = data.data?.[0]?.b64_json;
      if (!base64) {
        results.push(`⚠️ ${item.name}: sin imagen`);
        continue;
      }

      // Store base64 as data URL in imageUrl
      const dataUrl = `data:image/png;base64,${base64}`;
      await prisma.menuItem.update({
        where: { id: item.id },
        data: { imageUrl: dataUrl },
      });

      updated++;
      results.push(`✅ ${item.name}`);
    } catch (e) {
      results.push(`❌ ${item.name}: ${String(e).slice(0, 50)}`);
    }

    // Rate limit: DALL-E 2 allows ~5 images per minute on free tier
    if (updated > 0 && updated % 5 === 0) {
      await new Promise((r) => setTimeout(r, 15000)); // 15s pause every 5 images
    }
  }

  return NextResponse.json({
    success: true,
    updated,
    total: menuItems.length,
    message: `${updated}/${menuItems.length} imágenes generadas con IA`,
    details: results.slice(-10), // last 10 results
  });
}
