import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ ingredientId: string }> };

// ─── GET: single ingredient with stock movements ─────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { ingredientId } = await params;

    const ingredient = await prisma.ingredient.findUnique({
      where: { id: ingredientId },
      include: {
        stockMovements: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        _count: { select: { recipeItems: true } },
      },
    });

    if (!ingredient) {
      return NextResponse.json(
        { error: "Ingrediente no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...ingredient,
      costDisplay: Math.round(ingredient.cost / 100),
      recipeUsageCount: ingredient._count.recipeItems,
    });
  } catch (err) {
    console.error("[GET /api/admin/restaurant/ingredients/[ingredientId]]", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

// ─── PUT: update ingredient ──────────────────────────────────────────────────
const updateIngredientSchema = z.object({
  name: z.string().min(1).optional(),
  unit: z.string().min(1).optional(),
  currentStock: z.number().min(0).optional(),
  minStock: z.number().min(0).optional(),
  cost: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { ingredientId } = await params;
    const body = await req.json();
    const parsed = updateIngredientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.ingredient.findUnique({
      where: { id: ingredientId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Ingrediente no encontrado" },
        { status: 404 }
      );
    }

    const updated = await prisma.ingredient.update({
      where: { id: ingredientId },
      data: parsed.data,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(
      "[PUT /api/admin/restaurant/ingredients/[ingredientId]]",
      err
    );
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

// ─── DELETE: delete ingredient (only if not used in any recipe) ──────────────
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { ingredientId } = await params;

    const existing = await prisma.ingredient.findUnique({
      where: { id: ingredientId },
      include: { _count: { select: { recipeItems: true } } },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Ingrediente no encontrado" },
        { status: 404 }
      );
    }

    if (existing._count.recipeItems > 0) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar: el ingrediente está siendo usado en recetas",
        },
        { status: 409 }
      );
    }

    await prisma.ingredient.delete({ where: { id: ingredientId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(
      "[DELETE /api/admin/restaurant/ingredients/[ingredientId]]",
      err
    );
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
