import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ recipeId: string }> };

// ─── GET: recipe with its items, ingredient names, and menuItem info ─────────
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { recipeId } = await params;

    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        menuItem: {
          select: { id: true, name: true, basePrice: true, isActive: true },
        },
        recipeItems: {
          include: {
            ingredient: {
              select: { id: true, name: true, unit: true, cost: true, currentStock: true },
            },
          },
        },
      },
    });

    if (!recipe) {
      return NextResponse.json(
        { error: "Receta no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...recipe,
      recipeItems: recipe.recipeItems.map((ri) => ({
        id: ri.id,
        recipeId: ri.recipeId,
        ingredientId: ri.ingredientId,
        ingredientName: ri.ingredient.name,
        ingredientUnit: ri.ingredient.unit,
        ingredientCost: ri.ingredient.cost,
        ingredientCostDisplay: Math.round(ri.ingredient.cost / 100),
        quantity: ri.quantity,
      })),
    });
  } catch (err) {
    console.error("[GET /api/admin/restaurant/recipes/[recipeId]]", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

// ─── PUT: update recipe ──────────────────────────────────────────────────────
const updateRecipeSchema = z.object({
  yieldQuantity: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { recipeId } = await params;
    const body = await req.json();
    const parsed = updateRecipeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.recipe.findUnique({
      where: { id: recipeId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Receta no encontrada" },
        { status: 404 }
      );
    }

    const updated = await prisma.recipe.update({
      where: { id: recipeId },
      data: parsed.data,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PUT /api/admin/restaurant/recipes/[recipeId]]", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

// ─── DELETE: delete recipe ───────────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { recipeId } = await params;

    // If body has recipeItemId, remove a recipe item instead
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        const body = await req.clone().json();
        if (body.recipeItemId) {
          // Remove specific recipe item
          const recipeItem = await prisma.recipeItem.findUnique({
            where: { id: body.recipeItemId },
          });
          if (!recipeItem || recipeItem.recipeId !== recipeId) {
            return NextResponse.json(
              { error: "Item de receta no encontrado" },
              { status: 404 }
            );
          }
          await prisma.recipeItem.delete({
            where: { id: body.recipeItemId },
          });
          return NextResponse.json({ ok: true });
        }
      } catch {
        // Not JSON body, continue with full recipe delete
      }
    }

    const existing = await prisma.recipe.findUnique({
      where: { id: recipeId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Receta no encontrada" },
        { status: 404 }
      );
    }

    // Delete recipe items first, then recipe
    await prisma.recipeItem.deleteMany({ where: { recipeId } });
    await prisma.recipe.delete({ where: { id: recipeId } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/admin/restaurant/recipes/[recipeId]]", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

// ─── POST: add recipe item ───────────────────────────────────────────────────
const addRecipeItemSchema = z.object({
  ingredientId: z.string().min(1),
  quantity: z.number().positive("Cantidad debe ser positiva"),
});

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { recipeId } = await params;

    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
    });
    if (!recipe) {
      return NextResponse.json(
        { error: "Receta no encontrada" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const parsed = addRecipeItemSchema.safeParse(body);
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

    // Check if already added
    const existing = await prisma.recipeItem.findUnique({
      where: {
        recipeId_ingredientId: {
          recipeId,
          ingredientId: parsed.data.ingredientId,
        },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Este ingrediente ya está en la receta" },
        { status: 409 }
      );
    }

    const recipeItem = await prisma.recipeItem.create({
      data: {
        recipeId,
        ingredientId: parsed.data.ingredientId,
        quantity: parsed.data.quantity,
      },
      include: {
        ingredient: { select: { id: true, name: true, unit: true } },
      },
    });

    return NextResponse.json(recipeItem, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/restaurant/recipes/[recipeId]]", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
