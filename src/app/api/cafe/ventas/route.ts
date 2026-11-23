import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/cafe/ventas?fecha=YYYY-MM-DD
 *
 * Reporte de lo vendido en el Despegue. Devuelve dos cosas:
 *   · resumen  — total del día, cuántos pedidos, ticket promedio y el
 *                ranking de productos por unidades e ingreso
 *   · pedidos  — la lista, con hora, cliente, productos y total
 *
 * Por qué existe: la pantalla del Despegue sirve para vender, pero no
 * había dónde ver lo que ya se vendió. El barista cerraba el turno sin
 * poder decir cuánto entró ni qué se movió.
 *
 * Solo cuenta lo cobrado: un pedido a cuenta también es una venta (la
 * deuda vive en el libro del cliente), así que entra igual.
 */
export async function GET(req: NextRequest) {
  /* Solo lectura, y solo del café. Se sigue el mismo criterio que
     /api/cafe/barra, que tampoco pide sesión para leer la barra. */
  const url = new URL(req.url);
  const clave = url.searchParams.get("ubicacion") ?? "cafe";
  const fecha = url.searchParams.get("fecha"); // YYYY-MM-DD

  const ubicacion = await prisma.ubicacion.findUnique({
    where: { clave },
    select: { id: true, nombre: true },
  });
  if (!ubicacion) {
    return NextResponse.json({ error: "Ubicación no encontrada" }, { status: 404 });
  }

  /* El día se calcula en la hora del HANGAR, no la del servidor.
     Render corre en UTC, así que a las 6 de la tarde en El Peñón el
     servidor ya cree que es mañana: el reporte buscaba un día que allá
     todavía no ocurría y devolvía cero aunque la barra llevara horas
     vendiendo. Se ancla a México centro (UTC-6, sin horario de verano
     desde 2022). */
  const OFFSET_MX = -6 * 60; // minutos respecto a UTC

  function rangoDelDia(fechaLocal?: string | null) {
    // Si viene una fecha del cliente (YYYY-MM-DD), ese es el día.
    if (fechaLocal) {
      const inicio = new Date(`${fechaLocal}T00:00:00-06:00`);
      const fin = new Date(inicio);
      fin.setUTCDate(fin.getUTCDate() + 1);
      return { inicio, fin, ymd: fechaLocal };
    }
    // Si no, el "hoy" del Hangar.
    const ahora = new Date();
    const local = new Date(ahora.getTime() + OFFSET_MX * 60_000);
    const ymd = local.toISOString().slice(0, 10);
    const inicio = new Date(`${ymd}T00:00:00-06:00`);
    const fin = new Date(inicio);
    fin.setUTCDate(fin.getUTCDate() + 1);
    return { inicio, fin, ymd };
  }

  const { inicio, fin, ymd } = rangoDelDia(fecha);

  const pedidos = await prisma.order.findMany({
    where: {
      ubicacionId: ubicacion.id,
      createdAt: { gte: inicio, lt: fin },
      status: { notIn: ["CANCELLED", "DRAFT"] },
    },
    orderBy: { createdAt: "desc" },
    include: {
      orderItems: {
        include: { menuItem: { select: { name: true } } },
      },
      payments: { select: { method: true, status: true } },
    },
  });

  // ── Resumen ────────────────────────────────────────────────────────
  let total = 0;
  const porProducto = new Map<string, { unidades: number; importe: number }>();

  /* Lo que hay en la caja, separado por cómo entró el dinero.
     "A su cuenta" no es efectivo ni tarjeta: es deuda del cliente, así
     que se muestra aparte. Si se mezclara, la caja del Despegue no
     cuadraría con lo que hay físicamente en el cajón. */
  const porMetodo = {
    CASH: { total: 0, pedidos: 0 },
    CARD: { total: 0, pedidos: 0 },
    TRANSFER: { total: 0, pedidos: 0 },
    ON_ACCOUNT: { total: 0, pedidos: 0 },
    SIN_PAGO: { total: 0, pedidos: 0 },
  };

  const lista = pedidos.map((o) => {
    total += o.total;

    for (const it of o.orderItems) {
      if (it.status === "CANCELLED") continue;
      const nombre = it.menuItem?.name ?? "—";
      const acc = porProducto.get(nombre) ?? { unidades: 0, importe: 0 };
      acc.unidades += it.quantity;
      acc.importe += it.unitPrice * it.quantity;
      porProducto.set(nombre, acc);
    }

    const pago = o.payments?.find((p) => p.status === "COMPLETED");

    const claveMetodo =
      pago?.method === "CASH" ? "CASH"
      : pago?.method === "CARD" ? "CARD"
      : pago?.method === "TRANSFER" ? "TRANSFER"
      : pago?.method === "ON_ACCOUNT" ? "ON_ACCOUNT"
      : "SIN_PAGO";
    porMetodo[claveMetodo].total += o.total;
    porMetodo[claveMetodo].pedidos += 1;

    return {
      id: o.id,
      hora: o.createdAt.toISOString(),
      codigo: o.codigoRecogida,
      cliente: o.customerName ?? "—",
      estado: o.status,
      total: o.total,
      metodo: pago?.method ?? null,
      entregado: o.entregadoAt !== null,
      items: o.orderItems
        .filter((it) => it.status !== "CANCELLED")
        .map((it) => ({
          nombre: it.menuItem?.name ?? "—",
          cantidad: it.quantity,
          importe: it.unitPrice * it.quantity,
        })),
    };
  });

  const ranking = [...porProducto.entries()]
    .map(([nombre, v]) => ({ nombre, ...v }))
    .sort((a, b) => b.importe - a.importe);

  return NextResponse.json({
    ubicacion: ubicacion.nombre,
    fecha: ymd,
    resumen: {
      total,
      pedidos: lista.length,
      ticketPromedio: lista.length ? Math.round(total / lista.length) : 0,
      unidades: ranking.reduce((s, r) => s + r.unidades, 0),
      porMetodo,
    },
    ranking,
    pedidos: lista,
  });
}
