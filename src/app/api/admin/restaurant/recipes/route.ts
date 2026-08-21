import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── GET: list all recipes ───────────────────────────────────────────────────
export async function GET() {
  try {
    const recipes = await prisma.recipe.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        menuItem: { select: { id: true, name: true, isActive: true, imageUrl: true } },
        parentRecipe: { select: { id: true, notes: true, menuItem: { select: { name: true } } } },
        _count: { select: { recipeItems: true, childRecipes: true } },
      },
    });

    const result = recipes.map((r) => ({
      id: r.id,
      menuItemId: r.menuItemId,
      menuItemName: r.menuItem?.name ?? (r.notes ? r.notes.split('. ')[0].split(' — ')[0].trim() : "(plantilla)"),
      menuItemImage: r.menuItem?.imageUrl ?? null,
      menuItemActive: r.menuItem?.isActive ?? false,
      isTemplate: r.isTemplate,
      parentRecipeId: r.parentRecipeId,
      parentRecipeName: r.parentRecipe?.menuItem?.name ?? (r.parentRecipe?.notes ? r.parentRecipe.notes.split('. ')[0].split(' — ')[0].trim() : null),
      yieldQuantity: r.yieldQuantity,
      notes: r.notes,
      ingredientCount: r._count.recipeItems,
      childRecipeCount: r._count.childRecipes,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/admin/restaurant/recipes]", err);
    return NextResponse.json({ error: "Error al obtener recetas" }, { status: 500 });
  }
}

// ─── POST: create recipe ─────────────────────────────────────────────────────
const createRecipeSchema = z.object({
  menuItemId: z.string().optional(),
  parentRecipeId: z.string().optional(),
  isTemplate: z.boolean().default(false),
  yieldQuantity: z.number().min(0).default(1),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createRecipeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { menuItemId, parentRecipeId, isTemplate, yieldQuantity, notes } = parsed.data;

    // Exclusividad: o es receta base (template) o se vincula a un platillo, nunca ambos.
    if (isTemplate) {
      if (menuItemId) {
        return NextResponse.json({ error: "Una receta base no puede vincularse a un platillo" }, { status: 400 });
      }
      if (!notes || !notes.trim()) {
        return NextResponse.json({ error: "La receta base necesita un nombre" }, { status: 400 });
      }
    } else {
      if (!menuItemId) {
        return NextResponse.json({ error: "Seleccioná un ítem del menú (o marcá receta base)" }, { status: 400 });
      }
    }

    const data: any = {
      isTemplate,
      parentRecipeId: isTemplate ? null : (parentRecipeId || null),
      yieldQuantity,
      notes: notes || null,
    };

    if (menuItemId) {
      const menuItem = await prisma.menuItem.findUnique({ where: { id: menuItemId } });
      if (!menuItem) return NextResponse.json({ error: "Ítem de menú no encontrado" }, { status: 404 });
      const existing = await prisma.recipe.findUnique({ where: { menuItemId } });
      if (existing) return NextResponse.json({ error: "Ya existe una receta para este ítem" }, { status: 409 });
      data.menuItemId = menuItemId;
    }

    if (parentRecipeId) {
      const parent = await prisma.recipe.findUnique({ where: { id: parentRecipeId } });
      if (!parent) return NextResponse.json({ error: "Receta base no encontrada" }, { status: 404 });
      if (!parent.isTemplate) return NextResponse.json({ error: "La receta seleccionada no es una receta base" }, { status: 400 });
    }

    const recipe = await prisma.recipe.create({
      data,
      include: {
        menuItem: { select: { id: true, name: true } },
        parentRecipe: { select: { id: true } },
        _count: { select: { recipeItems: true } },
      },
    });

    return NextResponse.json(recipe, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/restaurant/recipes]", err);
    return NextResponse.json({ error: "Error al crear receta" }, { status: 500 });
  }
}
