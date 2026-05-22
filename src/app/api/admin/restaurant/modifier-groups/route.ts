import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function serializeGroup(group: Record<string, unknown>) {
  return {
    ...group,
    modifiers: Array.isArray(group.modifiers)
      ? (group.modifiers as Record<string, unknown>[]).map((m) => ({
          ...m,
          priceDelta: typeof m.priceDelta === "number" ? m.priceDelta / 100 : m.priceDelta,
        }))
      : undefined,
  };
}

// ─── GET: all modifier groups with their modifiers ───────────────────────────
export async function GET() {
  try {
    const groups = await prisma.modifierGroup.findMany({
      include: { modifiers: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(groups.map((g) => serializeGroup(g as unknown as Record<string, unknown>)));
  } catch (err) {
    console.error("[GET /api/admin/restaurant/modifier-groups]", err);
    return NextResponse.json({ error: "Error al obtener grupos de modificadores" }, { status: 500 });
  }
}

// ─── POST: create modifier group with its modifiers ──────────────────────────
const modifierSchema = z.object({
  name: z.string().min(1),
  priceDelta: z.number().int().default(0),
});

const createGroupSchema = z.object({
  name: z.string().min(1),
  minSelections: z.number().int().nonnegative().default(0),
  maxSelections: z.number().int().positive().default(1),
  isRequired: z.boolean().default(false),
  modifiers: z.array(modifierSchema).default([]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createGroupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { modifiers, ...groupData } = parsed.data;

    const group = await prisma.$transaction(async (tx) => {
      const created = await tx.modifierGroup.create({ data: groupData });

      if (modifiers.length > 0) {
        await tx.modifier.createMany({
          data: modifiers.map((m) => ({ ...m, modifierGroupId: created.id })),
        });
      }

      return tx.modifierGroup.findUnique({
        where: { id: created.id },
        include: { modifiers: true },
      });
    });

    return NextResponse.json(
      serializeGroup(group as unknown as Record<string, unknown>),
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/admin/restaurant/modifier-groups]", err);
    return NextResponse.json({ error: "Error al crear grupo de modificadores" }, { status: 500 });
  }
}
