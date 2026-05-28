import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN || "";
const MODEL = "black-forest-labs/flux-schnell";

async function generateImage(prompt: string): Promise<string | null> {
  // Create prediction
  const res = await fetch("https://api.replicate.com/v1/models/" + MODEL + "/predictions", {
    method: "POST",
    headers: {
      "Authorization": `Token ${REPLICATE_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: {
        prompt,
        num_outputs: 1,
        aspect_ratio: "1:1",
        output_format: "jpg",
        output_quality: 80,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[replicate] create error:", res.status, err.slice(0, 200));
    return null;
  }

  const prediction = await res.json();
  const id = prediction.id;

  // Poll for result (max 30 seconds)
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { Authorization: `Token ${REPLICATE_TOKEN}` },
    });
    if (!pollRes.ok) continue;
    const data = await pollRes.json();
    if (data.status === "succeeded") {
      return data.output?.[0] || data.output;
    }
    if (data.status === "failed") {
      console.error("[replicate] failed:", data.error);
      return null;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  const adminSession = req.cookies.get("hangar5_admin_session")?.value;
  if (!adminSession || adminSession !== "true") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!REPLICATE_TOKEN) {
    return NextResponse.json({ error: "REPLICATE_API_TOKEN no configurada. Agregala en Render env vars." }, { status: 502 });
  }

  const menuItems = await prisma.menuItem.findMany({
    include: { category: true },
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });

  const results: string[] = [];
  let updated = 0;

  for (const item of menuItems) {
    const catName = item.category?.name || "";
    const prompt = `Professional food photography, close-up overhead shot of "${item.name}", ${catName}, authentic Mexican restaurant style, warm natural lighting, shallow depth of field, appetizing, rustic ceramic plate, wooden table background, high resolution, commercial photography`;

    try {
      const imageUrl = await generateImage(prompt);
      if (!imageUrl) {
        results.push(`⚠️ ${item.name}: no se pudo generar`);
        continue;
      }

      // Download and convert to base64 for permanent storage
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) {
        results.push(`⚠️ ${item.name}: error descargando`);
        continue;
      }
      const buffer = Buffer.from(await imgRes.arrayBuffer());
      const base64 = buffer.toString("base64");
      const dataUrl = `data:image/jpeg;base64,${base64}`;

      await prisma.menuItem.update({
        where: { id: item.id },
        data: { imageUrl: dataUrl },
      });

      updated++;
      results.push(`✅ ${item.name}`);
    } catch (e) {
      results.push(`❌ ${item.name}: ${String(e).slice(0, 50)}`);
    }
  }

  return NextResponse.json({
    success: true,
    updated,
    total: menuItems.length,
    message: `${updated}/${menuItems.length} imágenes generadas con Flux (Replicate)`,
    details: results.slice(-10),
  });
}
