import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/restaurant/menu
 * Public endpoint: returns active categories with active menu items,
 * their variants and modifier groups (with modifiers).
 * Optimized for mobile — minimal fields, prices in pesos.
 */
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        kind: true,
        sortOrder: true,
        imageUrl: true,
        menuItems: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            name: true,
            description: true,
            basePrice: true,
            imageUrl: true,
            prepStation: true,
            estimatedPrepMinutes: true,
            sortOrder: true,
            variants: {
              orderBy: { isDefault: "desc" },
              select: {
                id: true,
                name: true,
                priceDelta: true,
                isDefault: true,
              },
            },
            menuItemModifierGroups: {
              select: {
                id: true,
                modifierGroup: {
                  select: {
                    id: true,
                    name: true,
                    minSelections: true,
                    maxSelections: true,
                    isRequired: true,
                    modifiers: {
                      select: {
                        id: true,
                        name: true,
                        priceDelta: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Convert prices from centavos → pesos
    const menu = categories.map((cat) => ({
      ...cat,
      menuItems: cat.menuItems.map((item) => ({
        ...item,
        basePrice: item.basePrice / 100,
        variants: item.variants.map((v) => ({
          ...v,
          priceDelta: v.priceDelta / 100,
        })),
        modifierGroups: item.menuItemModifierGroups.map((rel) => ({
          ...rel.modifierGroup,
          pivotId: rel.id,
          modifiers: rel.modifierGroup.modifiers.map((m) => ({
            ...m,
            priceDelta: m.priceDelta / 100,
          })),
        })),
        menuItemModifierGroups: undefined, // strip raw pivot
      })),
    }));

    return NextResponse.json(menu);
  } catch (err) {
    console.error("[GET /api/restaurant/menu]", err);
    return NextResponse.json({ error: "Error al obtener el menú" }, { status: 500 });
  }
}
