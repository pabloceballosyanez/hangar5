import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── POST: create stock movement (also updates ingredient stock) ─────────────
const createMovementSchema = z.object({
  ingredientId: z.string().min(1),
  delta: z.number(),
  reason: z.string().min(1, "Motivo requerido"),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createMovementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify ingredient exists
    const ingredient = await prisma.ingredient.findUnique({
      where: { id: parsed.data.ingredientId },
    });
    if (!ingredient) {
      return NextResponse.json(
        { error: "Ingrediente no encontrado" },
        { status: 404 }
      );
    }

    // Create movement and update stock in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.create({
        data: {
          ingredientId: parsed.data.ingredientId,
          delta: parsed.data.delta,
          reason: parsed.data.reason,
          notes: parsed.data.notes || null,
        },
      });

      const newStock = ingredient.currentStock + parsed.data.delta;
      if (newStock < 0) {
        throw new Error("Stock insuficiente: el movimiento resultaría en stock negativo");
      }

      const updated = await tx.ingredient.update({
        where: { id: parsed.data.ingredientId },
        data: { currentStock: newStock },
      });

      return { movement, ingredient: updated };
    });

    return NextResponse.json(
      {
        movement: result.movement,
        currentStock: result.ingredient.currentStock,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/admin/restaurant/stock-movements]", err);
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json(
      { error: message },
      { status: message.includes("Stock insuficiente") ? 400 : 500 }
    );
  }
}

// ─── GET: recent movements ───────────────────────────────────────────────────
export async function GET() {
  try {
    const movements = await prisma.stockMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        ingredient: { select: { id: true, name: true, unit: true } },
      },
    });

    return NextResponse.json(movements);
  } catch (err) {
    console.error("[GET /api/admin/restaurant/stock-movements]", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
