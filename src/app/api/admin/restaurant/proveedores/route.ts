import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

/**
 * /api/admin/restaurant/proveedores
 *
 * A quién se le compra. Frutas Pérez, Carnicería El Torito, La Europea, y
 * también el señor que llega sin ticket. Sirve después para ver a quién le
 * compras más, a qué precio, y cada cuánto.
 */
const schema = z.object({
  nombre: z.string().min(1),
  telefono: z.string().nullable().optional(),
  notas: z.string().nullable().optional(),
});

export async function GET(req: NextRequest) {
  const proveedores = await prisma.proveedor.findMany({
    where: { isActive: true },
    orderBy: { nombre: "asc" },
    include: {
      _count: { select: { compras: true } },
    },
  });

  return NextResponse.json(
    proveedores.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      telefono: p.telefono,
      notas: p.notas,
      compras: p._count.compras,
    }))
  );
}

export async function POST(req: NextRequest) {
  const parseo = schema.safeParse(await req.json().catch(() => null));
  if (!parseo.success) {
    return NextResponse.json({ error: "Falta el nombre" }, { status: 400 });
  }

  const existente = await prisma.proveedor.findFirst({
    where: { nombre: { equals: parseo.data.nombre.trim() }, isActive: true },
  });
  if (existente) {
    return NextResponse.json(
      { error: `Ya existe el proveedor "${existente.nombre}"`, id: existente.id },
      { status: 409 }
    );
  }

  const creado = await prisma.proveedor.create({
    data: {
      nombre: parseo.data.nombre.trim(),
      telefono: parseo.data.telefono || null,
      notas: parseo.data.notas || null,
    },
  });

  return NextResponse.json(creado, { status: 201 });
}
