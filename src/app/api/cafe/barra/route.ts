import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { crearVentaMostrador } from "@/lib/venta-mostrador";

export const dynamic = "force-dynamic";

/**
 * GET /api/cafe/barra
 *
 * Todo lo que necesita la pantalla única del café, en una sola llamada:
 * los productos que se venden, y los pedidos que están en curso.
 *
 * ── Por qué una sola llamada ────────────────────────────────────────
 * Antes la caja y el KDS eran dos pantallas con dos endpoints y el
 * barista tenía que recargar entre una y otra. Ahora la pantalla se
 * refresca sola y vender/preparar/entregar viven en el mismo lugar.
 */
export async function GET() {
  const ubicacion = await prisma.ubicacion.findUnique({ where: { clave: "cafe" } });
  if (!ubicacion) {
    return NextResponse.json({ error: "El café no está configurado" }, { status: 404 });
  }

  const marcas = await prisma.menuItemUbicacion.findMany({
    where: { ubicacionId: ubicacion.id, disponible: true },
    select: { menuItemId: true },
  });

  const items = marcas.length
    ? await prisma.menuItem.findMany({
        where: { id: { in: marcas.map((m) => m.menuItemId) }, isActive: true },
        select: {
          id: true,
          name: true,
          basePrice: true,
          category: { select: { name: true, sortOrder: true } },
        },
        orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
      })
    : [];

  const pedidos = await prisma.order.findMany({
    where: {
      ubicacionId: ubicacion.id,
      status: { in: ["IN_KITCHEN", "PLACED", "READY"] },
      entregadoAt: null,
    },
    include: {
      orderItems: {
        include: { menuItem: true, variant: true, modifiers: true },
      },
      table: true,
    },
    orderBy: { createdAt: "asc" },
    take: 60,
  });

  const serializarPedido = (p: (typeof pedidos)[number]) => ({
    id: p.id,
    nombre: p.customerName || "Sin nombre",
    codigo: p.codigoRecogida,
    estado: p.status === "READY" ? "LISTO" : "PREPARANDO",
    minutos: Math.floor((Date.now() - new Date(p.createdAt).getTime()) / 60000),
    total: p.total / 100,
    origen: p.source === "MOSTRADOR" ? "Mostrador" : p.table ? "QR" : "En línea",
    notaLibre: p.notes,
    items: p.orderItems.map((i) => ({
      id: i.id,
      cantidad: i.quantity,
      nombre: i.menuItem.name,
      variante: i.variant?.name ?? null,
      extras: i.modifiers.map((m) => m.modifierName),
      notas: i.specialInstructions,
    })),
  });

  return NextResponse.json({
    ubicacionId: ubicacion.id,
    productos: items.map((i) => ({
      id: i.id,
      nombre: i.name,
      precio: i.basePrice,
      categoria: i.category?.name ?? "",
    })),
    preparando: pedidos.filter((p) => p.status !== "READY").map(serializarPedido),
    listos: pedidos.filter((p) => p.status === "READY").map(serializarPedido),
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
  clienteNombre: z.string().min(1, "Escribe el nombre de quien pide"),
  clienteEmail: z.string().optional().nullable(),
  clienteId: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
});

/** POST /api/cafe/barra — venta en mostrador desde la pantalla única. */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const parseo = ventaSchema.safeParse(body);
  if (!parseo.success) {
    const msg = parseo.error.issues[0]?.message ?? "Datos incompletos";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const d = parseo.data;

  /* Si el barista eligió un cliente del Hangar, se usa su nombre y su
     correo aunque no los haya tecleado: es la misma persona y así la
     venta queda en su cuenta sin duplicar clientes. */
  let nombre = d.clienteNombre.trim();
  let email = d.clienteEmail?.trim() || null;

  if (d.clienteId) {
    const cliente = await prisma.customer.findUnique({ where: { id: d.clienteId } });
    if (cliente) {
      nombre = cliente.name;
      email = cliente.email ?? email;
    }
  }

  const resultado = await crearVentaMostrador({
    items: d.items,
    metodoPago: d.metodoPago,
    clienteNombre: nombre,
    clienteEmail: email,
    notas: d.notas ?? null,
  });

  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: 400 });
  }

  return NextResponse.json(resultado.venta);
}
