import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { buscarPorCodigo, marcarEntregado, normalizarCodigo } from "@/lib/codigo-recogida";

export const dynamic = "force-dynamic";

/**
 * GET /api/cafe/pedidos?ubicacion=cafe
 *
 * Pedidos para la barra del café.
 *
 * A diferencia del KDS del restaurante, aquí no hay inventario de
 * recetas ni estaciones: una sola persona atiende, cobra y entrega. Lo
 * que necesita ver es simple: qué falta, qué se está haciendo y qué
 * está listo para entregar.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const clave = url.searchParams.get("ubicacion") ?? "cafe";

  const ubicacion = await prisma.ubicacion.findUnique({
    where: { clave },
    select: { id: true, nombre: true },
  });

  if (!ubicacion) {
    return NextResponse.json({ error: "Ubicación no encontrada" }, { status: 404 });
  }

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

  /* Tres columnas y nada más:
       por hacer  -> acaba de entrar
       haciendo   -> se está preparando
       listo      -> espera a que lo recojan */
  const porHacer = pedidos.filter((p) => p.status === "PLACED" || p.status === "IN_KITCHEN");
  const listos = pedidos.filter((p) => p.status === "READY");

  const serializar = (p: (typeof pedidos)[number]) => ({
    id: p.id,
    codigo: p.codigoRecogida,
    cliente: p.customerName || "Sin nombre",
    creado: p.createdAt,
    minutos: Math.floor((Date.now() - new Date(p.createdAt).getTime()) / 60000),
    total: p.total / 100,
    nota: p.notes,
    origen: p.table ? `${p.table.name || "Mesa"} (QR)` : "Mostrador",
    items: p.orderItems.map((i) => ({
      id: i.id,
      cantidad: i.quantity,
      nombre: i.menuItem.name,
      variante: i.variant?.name ?? null,
      notas: i.specialInstructions,
      extras: i.modifiers.map((m) => m.modifierName),
    })),
  });

  return NextResponse.json({
    ubicacion: ubicacion.nombre,
    porHacer: porHacer.map(serializar),
    listos: listos.map(serializar),
  });
}

const cuerpoSchema = z.object({
  orderId: z.string().min(1),
  accion: z.enum(["empezar", "listo", "entregar"]),
});

/**
 * PUT /api/cafe/pedidos
 *
 * Avanza un pedido. Tres acciones y ya:
 *   empezar  → pasa a preparación
 *   listo    → está sobre el mostrador
 *   entregar → se lo llevaron
 */
export async function PUT(req: NextRequest) {
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

  const { orderId, accion } = parseo.data;

  const orden = await prisma.order.findUnique({ where: { id: orderId } });
  if (!orden) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  if (accion === "entregar") {
    try {
      await marcarEntregado(orderId);
      return NextResponse.json({ ok: true });
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === "YA_ENTREGADO") {
        return NextResponse.json({ error: "Ese pedido ya fue entregado" }, { status: 409 });
      }
      return NextResponse.json({ error: "No se pudo entregar" }, { status: 400 });
    }
  }

  const nuevoEstado = accion === "empezar" ? "IN_KITCHEN" : "READY";

  await prisma.$transaction(async (tx) => {
    await tx.orderStatusEvent.create({
      data: { orderId, fromStatus: orden.status, toStatus: nuevoEstado },
    });
    await tx.order.update({ where: { id: orderId }, data: { status: nuevoEstado } });
  });

  return NextResponse.json({ ok: true });
}

/**
 * POST /api/cafe/pedidos
 *
 * Busca un pedido por su código de recogida — lo que hace el barista
 * cuando el cliente le muestra la pantalla del celular.
 *
 * Body: { codigo: "A3F2" }
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const codigo = (body as { codigo?: string })?.codigo;
  if (!codigo) {
    return NextResponse.json({ error: "Falta el código" }, { status: 400 });
  }

  const orden = await buscarPorCodigo(codigo);

  if (!orden) {
    return NextResponse.json(
      { error: `No existe ningún pedido con el código ${normalizarCodigo(codigo)}` },
      { status: 404 }
    );
  }

  if (orden.entregadoAt) {
    return NextResponse.json(
      {
        error: "Ese pedido ya fue entregado",
        entregado: orden.entregadoAt,
        pedido: null,
      },
      { status: 409 }
    );
  }

  return NextResponse.json({
    pedido: {
      id: orden.id,
      codigo: orden.codigoRecogida,
      cliente: orden.customerName || "Sin nombre",
      total: orden.total / 100,
      estado: orden.status,
      items: orden.orderItems.map((i) => ({
        id: i.id,
        cantidad: i.quantity,
        nombre: i.menuItem.name,
        variante: i.variant?.name ?? null,
        notas: i.specialInstructions,
        extras: i.modifiers.map((m) => m.modifierName),
      })),
    },
  });
}
