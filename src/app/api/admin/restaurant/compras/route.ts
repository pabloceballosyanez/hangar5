import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

/**
 * /api/admin/restaurant/compras
 *
 * El registro de lo que se compra: una Compra agrupa varios renglones con su
 * proveedor y su fecha. Antes cada insumo se movía suelto y no había forma de
 * ver "esta compra a La Europea costó $1,162.77".
 *
 * Al crear una compra:
 *   1. Se suma cada renglón al almacén indicado (StockAlmacen)
 *   2. Se recalcula el total del insumo como suma de almacenes
 *   3. Se actualiza el costo del insumo con lo que se pagó
 *   4. Se deja un StockMovement por renglón, con el motivo de la compra
 *   5. Se congela descripción y costo en el renglón
 *
 * Todo en una transacción: si un renglón falla, no queda medio inventario
 * movido.
 */

const renglonSchema = z.object({
  ingredientId: z.string().min(1),
  cantidad: z.number().positive(),
  /* Centavos por unidad (kg, pieza, L). */
  costoUnitario: z.number().int().min(0),
});

const compraSchema = z.object({
  proveedorId: z.string().nullable().optional(),
  /* Para el proveedor que llega sin estar dado de alta. */
  proveedorNombre: z.string().nullable().optional(),
  fecha: z.string().nullable().optional(),
  origen: z.enum(["TICKET", "MANUAL", "RAPIDA"]).default("MANUAL"),
  almacenId: z.string().min(1),
  notas: z.string().nullable().optional(),
  renglones: z.array(renglonSchema).min(1),
});

/** Folio consecutivo: C-0001, C-0002… */
async function siguienteFolio(tx: PrismaTx): Promise<string> {
  const ultima = await tx.compra.findFirst({
    orderBy: { folio: "desc" },
    select: { folio: true },
  });
  const n = ultima ? parseInt(ultima.folio.replace(/\D/g, ""), 10) + 1 : 1;
  return `C-${String(n).padStart(4, "0")}`;
}

type PrismaTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export async function POST(req: NextRequest) {
  const parseo = compraSchema.safeParse(await req.json().catch(() => null));
  if (!parseo.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalle: parseo.error.flatten() },
      { status: 400 }
    );
  }

  const d = parseo.data;

  const almacen = await prisma.almacen.findUnique({ where: { id: d.almacenId } });
  if (!almacen) {
    return NextResponse.json({ error: "Ese almacén no existe" }, { status: 404 });
  }

  const insumos = await prisma.ingredient.findMany({
    where: { id: { in: d.renglones.map((r) => r.ingredientId) } },
    select: { id: true, name: true, unit: true },
  });
  const porId = new Map(insumos.map((i) => [i.id, i]));

  const faltantes = d.renglones.filter((r) => !porId.has(r.ingredientId));
  if (faltantes.length > 0) {
    return NextResponse.json(
      { error: "Algún insumo no existe", insumos: faltantes.map((f) => f.ingredientId) },
      { status: 404 }
    );
  }

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const folio = await siguienteFolio(tx);

      /* Total en centavos. Se redondea por renglón, no al final: así la suma
         de los renglones siempre da el total de la compra. */
      const preparados = d.renglones.map((r) => {
        const ins = porId.get(r.ingredientId)!;
        return {
          ...r,
          descripcion: ins.name,
          unidad: ins.unit,
          total: Math.round(r.cantidad * r.costoUnitario),
        };
      });
      const total = preparados.reduce((s, r) => s + r.total, 0);

      const compra = await tx.compra.create({
        data: {
          folio,
          proveedorId: d.proveedorId ?? null,
          proveedorNombre: d.proveedorNombre ?? null,
          fecha: d.fecha ? new Date(d.fecha) : new Date(),
          origen: d.origen,
          total,
          notas: d.notas ?? null,
          actorName: "Admin",
          renglones: {
            create: preparados.map((r) => ({
              ingredientId: r.ingredientId,
              descripcion: r.descripcion,
              cantidad: r.cantidad,
              unidad: r.unidad,
              costoUnitario: r.costoUnitario,
              total: r.total,
            })),
          },
        },
        include: { renglones: true },
      });

      /* Inventario: sumar al almacén y recalcular el total. */
      for (const r of preparados) {
        const clave = {
          almacenId_ingredientId: { almacenId: almacen.id, ingredientId: r.ingredientId },
        };
        const actual = await tx.stockAlmacen.findUnique({
          where: clave,
          select: { cantidad: true },
        });

        await tx.stockAlmacen.upsert({
          where: clave,
          create: {
            almacenId: almacen.id,
            ingredientId: r.ingredientId,
            cantidad: r.cantidad,
          },
          update: { cantidad: (actual?.cantidad ?? 0) + r.cantidad },
        });

        const partes = await tx.stockAlmacen.aggregate({
          where: { ingredientId: r.ingredientId },
          _sum: { cantidad: true },
        });

        /* El costo del insumo queda en lo que se pagó en esta compra: es el
           precio más reciente y el que conviene para costear recetas. */
        await tx.ingredient.update({
          where: { id: r.ingredientId },
          data: {
            currentStock: partes._sum.cantidad ?? 0,
            cost: r.costoUnitario,
          },
        });

        await tx.stockMovement.create({
          data: {
            ingredientId: r.ingredientId,
            delta: r.cantidad,
            reason: `Compra ${folio}`,
            unitCost: r.costoUnitario,
            actorName: "Admin",
            notes: d.proveedorNombre ?? undefined,
          },
        });
      }

      return { compra, folio, total, almacen: almacen.nombre };
    });

    return NextResponse.json(
      {
        ok: true,
        folio: resultado.folio,
        compraId: resultado.compra.id,
        total: resultado.total / 100,
        almacen: resultado.almacen,
        renglones: resultado.compra.renglones.map((r) => ({
          ...r,
          costoUnitario: r.costoUnitario / 100,
          total: r.total / 100,
        })),
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /compras]", err);
    return NextResponse.json({ error: "No se pudo registrar la compra" }, { status: 500 });
  }
}

/** GET: historial de compras, más recientes primero. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const desde = q.get("desde");
  const hasta = q.get("hasta");
  const limite = Math.min(Number(q.get("limit") ?? 50), 200);

  const compras = await prisma.compra.findMany({
    where: {
      ...(desde || hasta
        ? {
            fecha: {
              ...(desde ? { gte: new Date(desde) } : {}),
              ...(hasta ? { lte: new Date(hasta) } : {}),
            },
          }
        : {}),
    },
    include: {
      proveedor: { select: { nombre: true } },
      renglones: { select: { cantidad: true, descripcion: true, unidad: true } },
    },
    orderBy: { fecha: "desc" },
    take: limite,
  });

  return NextResponse.json(
    compras.map((c) => ({
      id: c.id,
      folio: c.folio,
      fecha: c.fecha,
      proveedor: c.proveedor?.nombre ?? c.proveedorNombre ?? "Sin proveedor",
      origen: c.origen,
      total: c.total / 100,
      notas: c.notas,
      renglones: c.renglones.map((r) => ({
        descripcion: r.descripcion,
        cantidad: r.cantidad,
        unidad: r.unidad,
      })),
    }))
  );
}
