import { NextRequest, NextResponse } from "next/server";
import { getStaffSession, getAdminSession } from "@/lib/auth";
import { puede } from "@/lib/permisos";
import { inventarioPorAlmacen, traspasar } from "@/lib/almacenes";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/restaurant/almacenes — inventario por almacén + traspasos.
 * POST — mueve mercancía de un almacén a otro.
 */
export async function GET() {
  const [inventario, traspasos] = await Promise.all([
    inventarioPorAlmacen(),
    prisma.traspaso.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        ingredient: { select: { name: true, unit: true } },
        origen: { select: { nombre: true } },
        destino: { select: { nombre: true } },
      },
    }),
  ]);

  return NextResponse.json({
    ...inventario,
    traspasos: traspasos.map((t) => ({
      id: t.id,
      folio: t.folio,
      insumo: t.ingredient.name,
      unidad: t.ingredient.unit,
      cantidad: t.cantidad,
      origen: t.origen.nombre,
      destino: t.destino.nombre,
      actor: t.actorName,
      notas: t.notas,
      fecha: t.createdAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  /* La llave maestra también puede traspasar: es el dueño resolviendo
     algo desde la oficina. El personal, solo si su rol toca inventario u
     operación. */
  const conLlaveMaestra = !!getAdminSession(req);
  const sesion = getStaffSession(req);

  if (!conLlaveMaestra) {
    if (!sesion || !(puede(sesion.role, "inventario") || puede(sesion.role, "operacion"))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
  }

  let body: {
    ingredientId?: string;
    origenClave?: string;
    destinoClave?: string;
    cantidad?: number;
    notas?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const { ingredientId, origenClave, destinoClave, cantidad, notas } = body;
  if (!ingredientId || !origenClave || !destinoClave || typeof cantidad !== "number") {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const r = await traspasar({
    ingredientId,
    origenClave,
    destinoClave,
    cantidad,
    actorName: sesion?.name ?? "Administrador",
    notas,
  });

  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  return NextResponse.json({ ok: true, folio: r.folio });
}
