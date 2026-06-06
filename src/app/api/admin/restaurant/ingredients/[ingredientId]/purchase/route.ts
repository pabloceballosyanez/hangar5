import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ ingredientId: string }> };

// ─── POST: registrar compra con promedio ponderado ──────────────────────────
const purchaseSchema = z.object({
  quantity: z.number().positive("Cantidad debe ser positiva"),
  unitCost: z.number().int().positive("Costo unitario debe ser positivo (centavos)"),
  supplier: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { ingredientId } = await params;
    const body = await req.json();
    const parsed = purchaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { quantity, unitCost, supplier } = parsed.data;

    // Get current ingredient state
    const ingredient = await prisma.ingredient.findUnique({
      where: { id: ingredientId },
    });
    if (!ingredient) {
      return NextResponse.json({ error: "Ingrediente no encontrado" }, { status: 404 });
    }

    // Weighted average: (currentStock × currentCost + purchasedQty × purchaseCost) / (currentStock + purchasedQty)
    // Be careful with negative stock (can happen with consumption before purchase)
    let newCost = ingredient.cost;
    if (ingredient.currentStock > 0 && ingredient.cost > 0) {
      const totalCurrentValue = ingredient.currentStock * ingredient.cost;
      const totalPurchasedValue = quantity * unitCost;
      const totalQuantity = ingredient.currentStock + quantity;
      newCost = Math.round((totalCurrentValue + totalPurchasedValue) / totalQuantity);
    } else {
      // If no current stock or no cost set, use purchase cost directly
      newCost = unitCost;
    }

    // Build notes
    const notes = supplier ? `Compra a ${supplier}` : "Compra registrada";

    // Update everything in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create stock movement
      await tx.stockMovement.create({
        data: {
          ingredientId,
          delta: quantity,
          reason: "PURCHASE",
          unitCost,
          notes,
        },
      });

      // Update ingredient stock and cost
      const updated = await tx.ingredient.update({
        where: { id: ingredientId },
        data: {
          currentStock: ingredient.currentStock + quantity,
          cost: newCost,
        },
      });

      return updated;
    });

    return NextResponse.json({
      id: result.id,
      name: result.name,
      unit: result.unit,
      stockBefore: ingredient.currentStock,
      stockAfter: result.currentStock,
      costBefore: ingredient.cost,
      costAfter: result.cost,
      costBeforeDisplay: Math.round(ingredient.cost / 100),
      costAfterDisplay: Math.round(result.cost / 100),
      purchasedQty: quantity,
      purchasedCost: unitCost,
      purchasedCostDisplay: Math.round(unitCost / 100),
    });
  } catch (err) {
    console.error("[POST purchase]", err);
    return NextResponse.json({ error: "Error al registrar compra" }, { status: 500 });
  }
}
