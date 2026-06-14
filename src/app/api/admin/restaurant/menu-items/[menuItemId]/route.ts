import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ menuItemId: string }> };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function serializeItem(item: Record<string, unknown>) {
  const recipe = item.recipe as Record<string, unknown> | null | undefined;
  const parentRecipe = recipe?.parentRecipe as Record<string, unknown> | null | undefined;
  return {
    ...item,
    basePrice: typeof item.basePrice === "number" ? item.basePrice / 100 : item.basePrice,
    variants: Array.isArray(item.variants)
      ? (item.variants as Record<string, unknown>[]).map((v) => ({
          ...v,
          priceDelta: typeof v.priceDelta === "number" ? v.priceDelta / 100 : v.priceDelta,
        }))
      : undefined,
    recipe: recipe
      ? {
          ...recipe,
          recipeItems: Array.isArray(recipe.recipeItems)
            ? (recipe.recipeItems as Record<string, unknown>[]).map((ri) => ({
                ...ri,
                inherited: false,
                ingredient: ri.ingredient
                  ? {
                      ...(ri.ingredient as Record<string, unknown>),
                      cost: typeof (ri.ingredient as Record<string, unknown>).cost === "number"
                        ? (ri.ingredient as Record<string, unknown>).cost as number / 100
                        : (ri.ingredient as Record<string, unknown>).cost,
                    }
                  : undefined,
              }))
            : [],
          inheritedItems: parentRecipe && Array.isArray(parentRecipe.recipeItems)
            ? (parentRecipe.recipeItems as Record<string, unknown>[]).map((ri) => {
                const ing = ri.ingredient as Record<string, unknown> | undefined;
                const parentYield = (parentRecipe.yieldQuantity as number) || 1;
                const thisYield = (recipe.yieldQuantity as number) || 1;
                const scale = thisYield / parentYield;
                return {
                  ...ri,
                  inherited: true,
                  quantity: (ri.quantity as number) * scale,
                  ingredient: ing
                    ? {
                        ...ing,
                        cost: typeof ing.cost === "number" ? ing.cost / 100 : ing.cost,
                      }
                    : undefined,
                };
              })
            : [],
          parentRecipe: parentRecipe ? {
            id: parentRecipe.id,
            notes: parentRecipe.notes,
            yieldQuantity: parentRecipe.yieldQuantity,
          } : null,
        }
      : null,
  };
}

// ─── GET: one item with variants, modifierGroups (include modifiers) ──────────
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { menuItemId } = await params;
    const item = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: {
        category: true,
        variants: { orderBy: { isDefault: "desc" } },
        menuItemModifierGroups: {
          include: {
            modifierGroup: {
              include: { modifiers: true },
            },
          },
        },
        recipe: {
          include: {
            recipeItems: {
              include: { ingredient: true },
            },
            parentRecipe: {
              include: {
                recipeItems: {
                  include: { ingredient: true },
                },
              },
            },
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item no encontrado" }, { status: 404 });
    }

    return NextResponse.json(serializeItem(item as unknown as Record<string, unknown>));
  } catch (err) {
    console.error("[GET /api/admin/restaurant/menu-items/[menuItemId]]", err);
    return NextResponse.json({ error: "Error al obtener item" }, { status: 500 });
  }
}

// ─── PUT: update item + variants (delete/recreate) + modifierGroups (sync) ───
const variantSchema = z.object({
  name: z.string().min(1),
  priceDelta: z.number().int().default(0),
  isDefault: z.boolean().default(false),
});

const recipeItemSchema = z.object({
  ingredientId: z.string().min(1),
  quantity: z.number().positive(),
});

const recipeSchema = z.object({
  yieldQuantity: z.number().positive().default(1),
  notes: z.string().optional().nullable(),
  recipeItems: z.array(recipeItemSchema).default([]),
});

const updateMenuItemSchema = z.object({
  categoryId: z.string().optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  basePrice: z.number().int().nonnegative().optional(),
  prepStation: z.enum(["KITCHEN", "BAR", "COLD_STATION"]).optional(),
  imageUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  estimatedPrepMinutes: z.number().int().optional(),
  sortOrder: z.number().int().optional(),
  sku: z.string().optional().nullable(),
  variants: z.array(variantSchema).optional(),
  modifierGroupIds: z.array(z.string()).optional(),
  recipe: recipeSchema.optional().nullable(),
});

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { menuItemId } = await params;
    const body = await req.json();
    const parsed = updateMenuItemSchema.safeParse(body);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const fields = Object.entries(flat.fieldErrors)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`)
        .join('; ');
      const msg = [flat.formErrors?.join(', '), fields].filter(Boolean).join(' | ') || 'Datos inválidos';
      console.error('[PUT validation]', JSON.stringify(flat, null, 2));
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const existing = await prisma.menuItem.findUnique({ where: { id: menuItemId } });
    if (!existing) {
      return NextResponse.json({ error: "Item no encontrado" }, { status: 404 });
    }

    const { variants, modifierGroupIds, recipe, ...itemData } = parsed.data;

    const item = await prisma.$transaction(async (tx) => {
      const updated = await tx.menuItem.update({
        where: { id: menuItemId },
        data: itemData,
      });

      // Sync variants: delete all + recreate if provided
      if (variants !== undefined) {
        await tx.menuItemVariant.deleteMany({ where: { menuItemId } });
        if (variants.length > 0) {
          await tx.menuItemVariant.createMany({
            data: variants.map((v) => ({ ...v, menuItemId })),
          });
        }
      }

      // Sync modifierGroups N:N if provided
      if (modifierGroupIds !== undefined) {
        await tx.menuItemModifierGroup.deleteMany({ where: { menuItemId } });
        if (modifierGroupIds.length > 0) {
          await tx.menuItemModifierGroup.createMany({
            data: modifierGroupIds.map((mgId) => ({
              menuItemId,
              modifierGroupId: mgId,
            })),
          });
        }
      }

      // Handle recipe: null = delete, object = upsert
      if (recipe === null) {
        await tx.recipeItem.deleteMany({ where: { recipe: { menuItemId } } });
        await tx.recipe.deleteMany({ where: { menuItemId } });
      } else if (recipe) {
        const { recipeItems, ...recipeData } = recipe;
        const upsertedRecipe = await tx.recipe.upsert({
          where: { menuItemId },
          create: { ...recipeData, menuItemId },
          update: recipeData,
        });
        // Replace recipeItems
        await tx.recipeItem.deleteMany({ where: { recipeId: upsertedRecipe.id } });
        if (recipeItems.length > 0) {
          await tx.recipeItem.createMany({
            data: recipeItems.map((ri) => ({
              recipeId: upsertedRecipe.id,
              ingredientId: ri.ingredientId,
              quantity: ri.quantity,
            })),
          });
        }
      }

      return tx.menuItem.findUnique({
        where: { id: updated.id },
        include: {
          category: true,
          variants: { orderBy: { isDefault: "desc" } },
          menuItemModifierGroups: {
            include: {
              modifierGroup: { include: { modifiers: true } },
            },
          },
          recipe: {
            include: {
              recipeItems: {
                include: { ingredient: true },
              },
              parentRecipe: {
                include: {
                  recipeItems: {
                    include: { ingredient: true },
                  },
                },
              },
            },
          },
        },
      });
    });

    return NextResponse.json(serializeItem(item as unknown as Record<string, unknown>));
  } catch (err) {
    console.error("[PUT /api/admin/restaurant/menu-items/[menuItemId]]", err);
    return NextResponse.json({ error: "Error al actualizar item" }, { status: 500 });
  }
}

// ─── DELETE: soft-delete (isActive = false) ───────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { menuItemId } = await params;

    const existing = await prisma.menuItem.findUnique({ where: { id: menuItemId } });
    if (!existing) {
      return NextResponse.json({ error: "Item no encontrado" }, { status: 404 });
    }

    const updated = await prisma.menuItem.update({
      where: { id: menuItemId },
      data: { isActive: false },
    });

    return NextResponse.json(serializeItem(updated as unknown as Record<string, unknown>));
  } catch (err) {
    console.error("[DELETE /api/admin/restaurant/menu-items/[menuItemId]]", err);
    return NextResponse.json({ error: "Error al desactivar item" }, { status: 500 });
  }
}
