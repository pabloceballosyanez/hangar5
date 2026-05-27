import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ScannedItem {
  rawText: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  matchedIngredientId: string | null;
  matchedIngredientName: string | null;
  confidence: "HIGH" | "MEDIUM" | "LOW";
}

// ─── POST: scan a receipt image and extract items ───────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: "Imagen requerida" }, { status: 400 });
    }

    const ingredients = await prisma.ingredient.findMany({
      where: { isActive: true },
      select: { id: true, name: true, unit: true, cost: true },
    });

    const ingredientsList = ingredients.map((i) => `  - ${i.name} (${i.unit})`).join("\n");

    const prompt = `Analiza esta foto de un recibo de compras para un restaurante en México.

Extrae SOLO los productos comestibles/bebidas (no impuestos, no propinas, no totales).
Para cada producto, devuelve:
- nombre: el nombre del producto
- cantidad: número (si no está claro, usa 1)
- unidad: kg, pieza, litro, paquete, etc.
- precio: el precio unitario en pesos MXN (si solo hay precio total, ese)

Luego, para CADA producto, busca el mejor match en esta lista de ingredientes existentes:

${ingredientsList}

Para el match, usa sentido común:
- "Jitomate" → "Tomate"
- "Queso Oaxaca 500g" → "Queso Oaxaca"
- "Cebolla blanca" → "Cebolla"
- Si no hay un match razonable, déjalo como null

Responde SOLO con un JSON válido, sin markdown, sin explicaciones:

{
  "items": [
    {
      "nombre": "Tomate",
      "cantidad": 2,
      "unidad": "kg",
      "precio": 45,
      "matchedIngredientName": "Tomate"
    }
  ]
}`;

    const openAIKey = process.env.OPENAI_API_KEY;

    if (!openAIKey) {
      return NextResponse.json(
        {
          error:
            "Configura OPENAI_API_KEY en las variables de entorno de Render. DeepSeek no soporta análisis de imágenes.",
        },
        { status: 502 }
      );
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAIKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
              { type: "text", text: prompt },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[scan-receipt] OpenAI error:", response.status, errText.slice(0, 300));
      return NextResponse.json(
        { error: `Error al procesar la imagen. Verifica que OPENAI_API_KEY sea válida.` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";
    const parsed = parseAIResponse(rawContent);

    const enriched = parsed.items.map(
      (item: { nombre: string; cantidad: number; unidad: string; precio: number; matchedIngredientName?: string }) => {
        const matched = item.matchedIngredientName
          ? ingredients.find((i) => i.name.toLowerCase() === item.matchedIngredientName!.toLowerCase()) ||
            ingredients.find(
              (i) =>
                i.name.toLowerCase().includes(item.matchedIngredientName!.toLowerCase()) ||
                item.matchedIngredientName!.toLowerCase().includes(i.name.toLowerCase())
            )
          : null;

        return {
          rawText: item.nombre,
          name: matched ? matched.name : item.nombre,
          quantity: item.cantidad,
          unit: matched ? matched.unit : item.unidad,
          price: item.precio,
          matchedIngredientId: matched?.id || null,
          matchedIngredientName: matched?.name || null,
          confidence: (matched ? "HIGH" : "LOW") as ScannedItem["confidence"],
        };
      }
    );

    return NextResponse.json({ items: enriched });
  } catch (err) {
    console.error("[scan-receipt]", err);
    return NextResponse.json({ error: "Error al escanear recibo" }, { status: 500 });
  }
}

// ─── Parse AI response ─────────────────────────────────────────────────────

function parseAIResponse(content: string): {
  items: { nombre: string; cantidad: number; unidad: string; precio: number; matchedIngredientName?: string }[];
} {
  try {
    const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    const match = content.match(/\{[\s\S]*"items"[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        // fall through
      }
    }
    return { items: [] };
  }
}
