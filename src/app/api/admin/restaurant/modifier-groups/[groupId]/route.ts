import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ groupId: string }> };

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

// ─── PUT: update group + modifiers (delete/recreate) ─────────────────────────
const modifierSchema = z.object({
  name: z.string().min(1),
  priceDelta: z.number().int().default(0),
});

const updateGroupSchema = z.object({
  name: z.string().min(1).optional(),
  minSelections: z.number().int().nonnegative().optional(),
  maxSelections: z.number().int().positive().optional(),
  isRequired: z.boolean().optional(),
  modifiers: z.array(modifierSchema).optional(),
});

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { groupId } = await params;
    const body = await req.json();
    const parsed = updateGroupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.modifierGroup.findUnique({ where: { id: groupId } });
    if (!existing) {
      return NextResponse.json({ error: "Grupo no encontrado" }, { status: 404 });
    }

    const { modifiers, ...groupData } = parsed.data;

    const group = await prisma.$transaction(async (tx) => {
      const updated = await tx.modifierGroup.update({
        where: { id: groupId },
        data: groupData,
      });

      if (modifiers !== undefined) {
        await tx.modifier.deleteMany({ where: { modifierGroupId: groupId } });
        if (modifiers.length > 0) {
          await tx.modifier.createMany({
            data: modifiers.map((m) => ({ ...m, modifierGroupId: groupId })),
          });
        }
      }

      return tx.modifierGroup.findUnique({
        where: { id: updated.id },
        include: { modifiers: true },
      });
    });

    return NextResponse.json(serializeGroup(group as unknown as Record<string, unknown>));
  } catch (err) {
    console.error("[PUT /api/admin/restaurant/modifier-groups/[groupId]]", err);
    return NextResponse.json({ error: "Error al actualizar grupo" }, { status: 500 });
  }
}

// ─── POST: add a single modifier to an existing group ─────────────────────────
const addModifierSchema = z.object({
  name: z.string().min(1),
  priceDelta: z.number().default(0),
});

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { groupId } = await params;

    const existing = await prisma.modifierGroup.findUnique({ where: { id: groupId } });
    if (!existing) {
      return NextResponse.json({ error: "Grupo no encontrado" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = addModifierSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // priceDelta arrives in pesos; convert to cents
    const priceDeltaCents = Math.round(parsed.data.priceDelta * 100);

    const group = await prisma.$transaction(async (tx) => {
      await tx.modifier.create({
        data: {
          name: parsed.data.name,
          priceDelta: priceDeltaCents,
          modifierGroupId: groupId,
        },
      });

      return tx.modifierGroup.findUnique({
        where: { id: groupId },
        include: { modifiers: true },
      });
    });

    return NextResponse.json(
      serializeGroup(group as unknown as Record<string, unknown>),
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/admin/restaurant/modifier-groups/[groupId]]", err);
    return NextResponse.json({ error: "Error al agregar modificador" }, { status: 500 });
  }
}

// ─── DELETE: eliminate group OR a single modifier ─────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { groupId } = await params;

    const existing = await prisma.modifierGroup.findUnique({ where: { id: groupId } });
    if (!existing) {
      return NextResponse.json({ error: "Grupo no encontrado" }, { status: 404 });
    }

    // Check for modifierId in body — if present, delete just that modifier
    let modifierId: string | undefined;
    try {
      const body = await req.json();
      modifierId = body?.modifierId;
    } catch {
      // No body — delete the entire group
    }

    if (modifierId) {
      // Delete a single modifier
      const modifier = await prisma.modifier.findUnique({ where: { id: modifierId } });
      if (!modifier || modifier.modifierGroupId !== groupId) {
        return NextResponse.json({ error: "Modificador no encontrado en este grupo" }, { status: 404 });
      }

      await prisma.modifier.delete({ where: { id: modifierId } });

      const group = await prisma.modifierGroup.findUnique({
        where: { id: groupId },
        include: { modifiers: true },
      });

      return NextResponse.json(serializeGroup(group as unknown as Record<string, unknown>));
    }

    // Delete entire group
    await prisma.$transaction(async (tx) => {
      await tx.menuItemModifierGroup.deleteMany({ where: { modifierGroupId: groupId } });
      await tx.modifier.deleteMany({ where: { modifierGroupId: groupId } });
      await tx.modifierGroup.delete({ where: { id: groupId } });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/restaurant/modifier-groups/[groupId]]", err);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}
