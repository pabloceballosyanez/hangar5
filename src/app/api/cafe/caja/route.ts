import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { crearVentaMostrador } from "@/lib/venta-mostrador";

export const dynamic = "force-dynamic";

/**
 * GET /api/cafe/caja
 *
 * Lo que necesita la caja del café para vender: el menú del café y la
 * mesa de mostrador donde se apoyan las ventas.
 *
 * El menú sale filtrado por ubicación: si un platillo no está marcado
 * para el café, no aparece. Es la misma regla que usa el menú público,
 * así el barista y el cliente ven exactamente lo mismo.
 */
export async function GET() {
  const ubicacion = await prisma.ubicacion.findUnique({ where: { clave: "cafe" } });
  if (!ubicacion) {
    return NextResponse.json({ error: "El café no está configurado" }, { status: 404 });
  }

  /* El café no tiene mesas: todos son walk-ins. No se busca ninguna. */

  // Productos marcados para el café
  const marcas = await prisma.menuItemUbicacion.findMany({
    where: { ubicacionId: ubicacion.id, disponible: true },
    select: { menuItemId: true },
  });

  const items = marcas.length
    ? await prisma.menuItem.findMany({
        where: {
          id: { in: marcas.map((m) => m.menuItemId) },
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          basePrice: true,
          category: { select: { name: true, sortOrder: true } },
        },
        orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
      })
    : [];

  return NextResponse.json({
    ubicacionId: ubicacion.id,
    items: items.map((i) => ({
      id: i.id,
      nombre: i.name,
      precio: i.basePrice,
      categoria: i.category?.name ?? "",
    })),
  });
}

const ventaSchema = z.object({
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        cantidad: z.number().int().min(1),
      })
    )
    .min(1, "Agrega al menos un producto"),
  metodoPago: z.enum(["CASH", "CARD", "TRANSFER", "CUENTA"]),
  clienteNombre: z.string().optional().nullable(),
  clienteEmail: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
});

/**
 * POST /api/cafe/caja
 *
 * Venta directa en el mostrador. Tres cosas pueden pasar:
 *
 *   CASH/CARD/TRANSFER → se cobra en el momento, el pedido nace PAID
 *                        y listo para entregar.
 *   CUENTA             → se carga a la cuenta del cliente. Necesita
 *                        nombre o correo para encontrar/crear la cuenta.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const parseo = ventaSchema.safeParse(body);
  if (!parseo.success) {
    const primerError = parseo.error.issues[0]?.message ?? "Datos incompletos";
    return NextResponse.json({ error: primerError }, { status: 400 });
  }

  const resultado = await crearVentaMostrador(parseo.data);
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: 400 });
  }

  return NextResponse.json(resultado.venta);
}
