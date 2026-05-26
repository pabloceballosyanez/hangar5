import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── Schema ─────────────────────────────────────────────────────────────────

const bulkStockItemSchema = z.object({
  ingredientId: z.string().optional(),
  newIngredient: z
    .object({
      name: z.string().min(1),
      unit: z.string().min(1),
      cost: z.number().int().min(0), // in cents
    })
    .optional(),
  quantity: z.number().positive(),
  notes: z.string().optional(),
});

const bulkStockSchema = z.object({
  items: z.array(bulkStockItemSchema),
  reason: z.string().default("Compra (recibo escaneado)"),
});

// ─── POST: bulk add stock from scanned receipt ─────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = bulkStockSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const results: { name: string; stockAdded: number; newStock: number }[] = [];

    await prisma.$transaction(async (tx) => {
      for (const item of parsed.data.items) {
        let ingredientId = item.ingredientId;

        // Create new ingredient if needed
        if (!ingredientId && item.newIngredient) {
          const created = await tx.ingredient.create({
            data: {
              name: item.newIngredient.name,
              unit: item.newIngredient.unit,
              cost: item.newIngredient.cost,
              currentStock: 0,
            },
          });
          ingredientId = created.id;
        }

        if (!ingredientId) continue;

        // Create stock movement
        await tx.stockMovement.create({
          data: {
            ingredientId,
            delta: item.quantity,
            reason: `${parsed.data.reason}${item.notes ? ` — ${item.notes}` : ""}`,
          },
        });

        // Update current stock
        const updated = await tx.ingredient.update({
          where: { id: ingredientId },
          data: { currentStock: { increment: item.quantity } },
          select: { name: true, currentStock: true },
        });

        results.push({
          name: updated.name,
          stockAdded: item.quantity,
          newStock: updated.currentStock,
        });
      }
    });

    return NextResponse.json({ success: true, results }, { status: 201 });
  } catch (err) {
    console.error("[bulk-stock]", err);
    return NextResponse.json(
      { error: "Error al agregar inventario" },
      { status: 500 }
    );
  }
}
