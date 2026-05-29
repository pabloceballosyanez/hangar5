import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/admin/backup — exporta toda la data como JSON
export async function GET() {
  try {
    const [categories, menuItems, ingredients, recipes, staff, tables] = await Promise.all([
      prisma.category.findMany({ include: { menuItems: { include: { variants: true } } } }),
      prisma.menuItem.findMany(),
      prisma.ingredient.findMany(),
      prisma.recipe.findMany({ include: { recipeItems: true } }),
      prisma.staff.findMany({ select: { id: true, name: true, role: true, pin: true, isActive: true } }),
      prisma.table.findMany(),
    ]);

    return NextResponse.json({
      version: "v1.0-beta",
      exportedAt: new Date().toISOString(),
      categories,
      menuItems,
      ingredients,
      recipes,
      staff,
      tables,
    });
  } catch (err) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
