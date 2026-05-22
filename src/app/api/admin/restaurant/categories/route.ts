import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── GET: all categories ordered by sortOrder with menuItem count ───────────
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { menuItems: true } },
      },
    });

    return NextResponse.json(categories);
  } catch (err) {
    console.error("[GET /api/admin/restaurant/categories]", err);
    return NextResponse.json({ error: "Error al obtener categorías" }, { status: 500 });
  }
}

// ─── POST: create category ───────────────────────────────────────────────────
const createCategorySchema = z.object({
  name: z.string().min(1),
  kind: z.enum(["FOOD", "DRINK"]),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  imageUrl: z.string().url().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const category = await prisma.category.create({ data: parsed.data });
    return NextResponse.json(category, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/restaurant/categories]", err);
    return NextResponse.json({ error: "Error al crear categoría" }, { status: 500 });
  }
}
