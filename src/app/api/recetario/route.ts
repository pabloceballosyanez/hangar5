import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/recetario — recetas públicas con ingredientes heredados resueltos
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoria = searchParams.get("categoria");
    const search = searchParams.get("search")?.toLowerCase();

    const where: any = {};
    if (categoria && categoria !== "todas") {
      where.menuItem = { category: { name: categoria } };
    }

    const recipes = await prisma.recipe.findMany({
      where,
      include: {
        menuItem: {
          select: { id: true, name: true, imageUrl: true, basePrice: true, category: { select: { name: true } } },
        },
        parentRecipe: {
          include: {
            menuItem: { select: { name: true } },
            recipeItems: { include: { ingredient: { select: { name: true, unit: true, cost: true } } } },
          },
        },
        recipeItems: {
          include: { ingredient: { select: { name: true, unit: true, cost: true } } },
        },
        childRecipes: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Resolver herencia: merge de ingredientes del padre + propios
    const enriched = recipes.map((r) => {
      const allIngredients: { name: string; quantity: number; unit: string; cost: number; inherited: boolean }[] = [];

      // Ingredientes heredados del padre
      if (r.parentRecipe) {
        for (const ri of r.parentRecipe.recipeItems) {
          allIngredients.push({
            name: ri.ingredient.name,
            quantity: ri.quantity,
            unit: ri.ingredient.unit,
            cost: ri.ingredient.cost,
            inherited: true,
          });
        }
      }

      // Ingredientes propios
      for (const ri of r.recipeItems) {
        allIngredients.push({
          name: ri.ingredient.name,
          quantity: ri.quantity,
          unit: ri.ingredient.unit,
          cost: ri.ingredient.cost,
          inherited: false,
        });
      }

      const totalCost = allIngredients.reduce((sum, ing) => sum + ing.cost * ing.quantity, 0);

      return {
        id: r.id,
        name: r.menuItem?.name ?? "Plantilla sin menú",
        imageUrl: r.menuItem?.imageUrl ?? null,
        price: r.menuItem?.basePrice ?? 0,
        category: r.menuItem?.category?.name ?? null,
        isTemplate: r.isTemplate,
        parentRecipeId: r.parentRecipeId,
        parentName: r.parentRecipe?.menuItem?.name ?? null,
        yieldQuantity: r.yieldQuantity,
        notes: r.notes,
        ingredients: allIngredients,
        totalCost: Math.round(totalCost * 100) / 100,
        ownIngredientCount: r.recipeItems.length,
        inheritedIngredientCount: r.parentRecipe ? r.parentRecipe.recipeItems.length : 0,
        variationCount: r.childRecipes.length,
      };
    });

    // Filtrar por búsqueda si hay
    const filtered = search
      ? enriched.filter(
          (r) =>
            r.name.toLowerCase().includes(search) ||
            r.ingredients.some((i) => i.name.toLowerCase().includes(search))
        )
      : enriched;

    return NextResponse.json({ recipes: filtered });
  } catch (err) {
    console.error("[GET /api/recetario]", err);
    return NextResponse.json({ error: "Error al cargar recetario" }, { status: 500 });
  }
}
