import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/restaurant/tipos
 *
 * Tipos de producto con sus platillos y los modificadores que heredan.
 *
 * ── Por qué existe esta pantalla ────────────────────────────────────
 * Los tipos se crearon con reglas de nombre (ver tipos-producto.ts),
 * que funciona pero es invisible: nadie sabe por qué el "Capuchino"
 * cayó en Café. Aquí se ve y se corrige a mano.
 */
export async function GET() {
  const tipos = await prisma.tipoProducto.findMany({
    orderBy: [{ orden: "asc" }, { nombre: "asc" }],
    include: {
      menuItems: {
        select: { id: true, name: true, isActive: true, category: { select: { name: true } } },
        orderBy: { name: "asc" },
      },
      modifierGroups: {
        include: { modifierGroup: { select: { id: true, name: true } } },
      },
    },
  });

  const grupos = await prisma.modifierGroup.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      _count: { select: { modifiers: true } },
    },
  });

  return NextResponse.json({
    tipos: tipos.map((t) => ({
      id: t.id,
      nombre: t.nombre,
      platillos: t.menuItems.map((m) => ({
        id: m.id,
        nombre: m.name,
        activo: m.isActive,
        categoria: m.category?.name ?? "",
      })),
      hereda: t.modifierGroups.map((g) => ({
        id: g.modifierGroup.id,
        nombre: g.modifierGroup.name,
      })),
    })),
    gruposDisponibles: grupos.map((g) => ({
      id: g.id,
      nombre: g.name,
      opciones: g._count.modifiers,
    })),
  });
}

const cuerpoSchema = z.object({
  tipoId: z.string().min(1),
  modifierGroupId: z.string().min(1),
});

/** POST — un tipo empieza a heredar un grupo. */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const parseo = cuerpoSchema.safeParse(body);
  if (!parseo.success) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const { tipoId, modifierGroupId } = parseo.data;

  const tipo = await prisma.tipoProducto.findUnique({ where: { id: tipoId } });
  const grupo = await prisma.modifierGroup.findUnique({ where: { id: modifierGroupId } });
  if (!tipo) return NextResponse.json({ error: "Ese tipo no existe" }, { status: 404 });
  if (!grupo) return NextResponse.json({ error: "Ese grupo no existe" }, { status: 404 });

  const ya = await prisma.tipoProductoModifierGroup.findFirst({
    where: { tipoId, modifierGroupId },
  });
  if (ya) return NextResponse.json({ ok: true, repetido: true });

  await prisma.tipoProductoModifierGroup.create({ data: { tipoId, modifierGroupId } });
  return NextResponse.json({ ok: true });
}

/** DELETE — un tipo deja de heredar un grupo. */
export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const tipoId = url.searchParams.get("tipoId");
  const modifierGroupId = url.searchParams.get("modifierGroupId");

  if (!tipoId || !modifierGroupId) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const rel = await prisma.tipoProductoModifierGroup.findFirst({
    where: { tipoId, modifierGroupId },
  });
  if (!rel) return NextResponse.json({ ok: true, noExistia: true });

  await prisma.tipoProductoModifierGroup.delete({ where: { id: rel.id } });
  return NextResponse.json({ ok: true });
}
