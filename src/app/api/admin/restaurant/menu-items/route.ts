import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function serializeItem(item: Record<string, unknown>) {
  return {
    ...item,
    basePrice: typeof item.basePrice === "number" ? item.basePrice / 100 : item.basePrice,
    variants: Array.isArray(item.variants)
      ? (item.variants as Record<string, unknown>[]).map((v) => ({
          ...v,
          priceDelta: typeof v.priceDelta === "number" ? v.priceDelta / 100 : v.priceDelta,
        }))
      : undefined,
  };
}

// ─── GET: all menu items, filterable by ?categoryId= and ?isActive= ──────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId") ?? undefined;
    const isActiveParam = searchParams.get("isActive");
    const isActive = isActiveParam === null ? undefined : isActiveParam === "true";

    const items = await prisma.menuItem.findMany({
      where: {
        ...(categoryId ? { categoryId } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      include: {
        category: true,
        variants: { orderBy: { isDefault: "desc" } },
        recipe: { select: { id: true } },
      },
      orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
    });

    return NextResponse.json(items.map(serializeItem));
  } catch (err) {
    console.error("[GET /api/admin/restaurant/menu-items]", err);
    return NextResponse.json({ error: "Error al obtener menu items" }, { status: 500 });
  }
}

// ─── POST: create menu item with variants + modifierGroups in a transaction ──
const variantSchema = z.object({
  name: z.string().min(1),
  priceDelta: z.number().int().default(0),
  isDefault: z.boolean().default(false),
});

const createMenuItemSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  basePrice: z.number().int().nonnegative(),
  prepStation: z.enum(["KITCHEN", "BAR", "COLD_STATION"]),
  imageUrl: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  estimatedPrepMinutes: z.number().int().default(10),
  sortOrder: z.number().int().default(0),
  sku: z.string().optional().nullable(),
  variants: z.array(variantSchema).default([]),
  modifierGroupIds: z.array(z.string()).default([]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createMenuItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { variants, modifierGroupIds, ...itemData } = parsed.data;

    // Verify category exists
    const category = await prisma.category.findUnique({ where: { id: itemData.categoryId } });
    if (!category) {
      return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
    }

    const item = await prisma.$transaction(async (tx) => {
      const created = await tx.menuItem.create({ data: itemData });

      if (variants.length > 0) {
        await tx.menuItemVariant.createMany({
          data: variants.map((v) => ({ ...v, menuItemId: created.id })),
        });
      }

      if (modifierGroupIds.length > 0) {
        await tx.menuItemModifierGroup.createMany({
          data: modifierGroupIds.map((mgId) => ({
            menuItemId: created.id,
            modifierGroupId: mgId,
          })),
        });
      }

      return tx.menuItem.findUnique({
        where: { id: created.id },
        include: {
          category: true,
          variants: true,
          menuItemModifierGroups: {
            include: { modifierGroup: { include: { modifiers: true } } },
          },
        },
      });
    });

    return NextResponse.json(serializeItem(item as unknown as Record<string, unknown>), { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/restaurant/menu-items]", err);
    return NextResponse.json({ error: "Error al crear menu item" }, { status: 500 });
  }
}
