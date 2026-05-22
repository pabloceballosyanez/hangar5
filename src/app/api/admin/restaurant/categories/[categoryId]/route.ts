import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ categoryId: string }> };

// ─── GET: one category with its menuItems ────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { categoryId } = await params;
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        menuItems: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (err) {
    console.error("[GET /api/admin/restaurant/categories/[categoryId]]", err);
    return NextResponse.json({ error: "Error al obtener categoría" }, { status: 500 });
  }
}

// ─── PUT: update category ────────────────────────────────────────────────────
const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  kind: z.enum(["FOOD", "DRINK"]).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  imageUrl: z.string().url().optional().nullable(),
});

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { categoryId } = await params;
    const body = await req.json();
    const parsed = updateCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!existing) {
      return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
    }

    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: parsed.data,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PUT /api/admin/restaurant/categories/[categoryId]]", err);
    return NextResponse.json({ error: "Error al actualizar categoría" }, { status: 500 });
  }
}

// ─── DELETE: delete only if no menuItems ─────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { categoryId } = await params;

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { _count: { select: { menuItems: true } } },
    });

    if (!category) {
      return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
    }

    if (category._count.menuItems > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar una categoría con items. Mueve o elimina los items primero." },
        { status: 409 }
      );
    }

    await prisma.category.delete({ where: { id: categoryId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/restaurant/categories/[categoryId]]", err);
    return NextResponse.json({ error: "Error al eliminar categoría" }, { status: 500 });
  }
}
