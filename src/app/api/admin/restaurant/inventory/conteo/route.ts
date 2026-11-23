import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/restaurant/inventory/conteo
 *
 * Fija el conteo físico de un almacén. No suma ni resta: pone el número
 * que se contó, que es lo que devuelve una hoja de conteo.
 *
 * ── POR QUÉ NO SIRVE EL AJUSTE NORMAL ───────────────────────────────
 * El ajuste de ingrediente mueve Ingredient.currentStock, que es el total
 * de todos los almacenes. Si el café y la cocina comparten un insumo, ese
 * ajuste reparte mal. Aquí se fija StockAlmacen del almacén concreto y
 * después se recalcula el total como la suma de sus partes.
 *
 * Body: { almacen: "cocina" | "barra-cafe", items: [{ ingredientId, cantidad }], reason? }
 */
const esquema = z.object({
  almacen: z.string().min(1),
  items: z.array(
    z.object({
      ingredientId: z.string().min(1),
      cantidad: z.number().min(0),
    })
  ).min(1),
  reason: z.string().default("Conteo físico"),
});

export async function POST(req: NextRequest) {
  if (!getAdminSession(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const cuerpo = await req.json().catch(() => null);
  const parsed = esquema.safeParse(cuerpo);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { almacen, items, reason } = parsed.data;

  const alm = await prisma.almacen.findUnique({
    where: { clave: almacen },
    select: { id: true, nombre: true },
  });
  if (!alm) {
    return NextResponse.json({ error: `El almacén "${almacen}" no existe` }, { status: 404 });
  }

  const resultado = await prisma.$transaction(async (tx) => {
    let fijados = 0;
    const insumosTocados = new Set<string>();

    for (const it of items) {
      // La fila del insumo en este almacén. Si no existe, se crea.
      const anterior = await tx.stockAlmacen.findUnique({
        where: {
          almacenId_ingredientId: { almacenId: alm.id, ingredientId: it.ingredientId },
        },
        select: { cantidad: true },
      });

      const antes = anterior?.cantidad ?? 0;
      const delta = it.cantidad - antes;

      await tx.stockAlmacen.upsert({
        where: {
          almacenId_ingredientId: { almacenId: alm.id, ingredientId: it.ingredientId },
        },
        create: { almacenId: alm.id, ingredientId: it.ingredientId, cantidad: it.cantidad },
        update: { cantidad: it.cantidad },
      });

      /* El movimiento se registra con la diferencia, no con el valor
         absoluto: así la bitácora dice cuánto se corrigió. */
      if (Math.abs(delta) > 0.0001) {
        await tx.stockMovement.create({
          data: {
            ingredientId: it.ingredientId,
            delta,
            reason,
            notes: `Conteo en ${alm.nombre}: ${antes} → ${it.cantidad}`,
            actorName: "Admin",
          },
        });
      }

      insumosTocados.add(it.ingredientId);
      fijados++;
    }

    // El total de cada insumo = suma de sus almacenes.
    for (const ingredientId of insumosTocados) {
      const partes = await tx.stockAlmacen.aggregate({
        where: { ingredientId },
        _sum: { cantidad: true },
      });
      await tx.ingredient.update({
        where: { id: ingredientId },
        data: { currentStock: partes._sum.cantidad ?? 0 },
      });
    }

    return { fijados, insumos: insumosTocados.size };
  });

  return NextResponse.json({ ok: true, almacen: alm.nombre, ...resultado });
}
