import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── GET: list all ingredients ───────────────────────────────────────────────
export async function GET() {
  try {
    const ingredients = await prisma.ingredient.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { recipeItems: true } },
      },
    });

    const result = ingredients.map((ing) => ({
      id: ing.id,
      name: ing.name,
      unit: ing.unit,
      currentStock: ing.currentStock,
      minStock: ing.minStock,
      cost: ing.cost,
      costDisplay: Math.round(ing.cost / 100),
      isActive: ing.isActive,
      recipeUsageCount: ing._count.recipeItems,
      createdAt: ing.createdAt,
      updatedAt: ing.updatedAt,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/admin/restaurant/ingredients]", err);
    return NextResponse.json(
      { error: "Error al obtener ingredientes" },
      { status: 500 }
    );
  }
}

// ─── POST: create ingredient ─────────────────────────────────────────────────
const createIngredientSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  unit: z.string().min(1, "Unidad requerida"),
  currentStock: z.number().min(0).default(0),
  minStock: z.number().min(0).default(0),
  cost: z.number().int().min(0, "Costo debe ser positivo (en centavos)"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Convert cost from pesos (float) to cents (int) if sent as pesos
    const parsed = createIngredientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const ingredient = await prisma.ingredient.create({
      data: {
        name: parsed.data.name,
        unit: parsed.data.unit,
        currentStock: parsed.data.currentStock,
        minStock: parsed.data.minStock,
        cost: parsed.data.cost,
        isActive: true,
      },
    });

    return NextResponse.json(ingredient, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/restaurant/ingredients]", err);
    return NextResponse.json(
      { error: "Error al crear ingrediente" },
      { status: 500 }
    );
  }
}
