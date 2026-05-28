import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function generateImage(prompt: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: "dall-e-3", prompt, n: 1, size: "1024x1024", response_format: "b64_json" }),
  });
  if (!res.ok) { const err = await res.text(); console.error("[openai]", res.status, err.slice(0, 200)); return null; }
  const data = await res.json();
  return data.data?.[0]?.b64_json || null;
}

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
    const prompt = `Professional food photography, close-up overhead shot of "${item.name}", ${catName}, authentic Mexican restaurant style, warm natural lighting, shallow depth of field, appetizing, rustic ceramic plate, wooden table background`;

    try {
      const b64 = await generateImage(prompt);
      if (!b64) { results.push(`⚠️ ${item.name}`); continue; }

      const dataUrl = `data:image/png;base64,${b64}`;
      await prisma.menuItem.update({ where: { id: item.id }, data: { imageUrl: dataUrl } });
      updated++;
      results.push(`✅ ${item.name}`);
    } catch (e) {
      results.push(`❌ ${item.name}: ${String(e).slice(0, 50)}`);
    }
  }

  return NextResponse.json({
    success: true, updated, total: menuItems.length,
    message: `${updated}/${menuItems.length} imágenes generadas con GPT Image`,
    details: results.slice(-10),
  });
}
