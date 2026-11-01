import { prisma } from "@/lib/prisma";

/**
 * Cuenta unificada: restaurante + alojamiento.
 *
 * ── El problema que resuelve ─────────────────────────────────────────
 * En el Hangar pasan dos cosas, y las dos tienen que terminar en un
 * solo cobro:
 *
 *   A) Alguien llega a comer sin reserva y, de pronto, decide
 *      quedarse a dormir.
 *   B) Alguien ya tenía su cabaña reservada y baja a comer.
 *
 * Hasta ahora eran dos mundos: la comida se cobraba en el restaurante
 * y el alojamiento en la reserva. Nadie los sumaba.
 *
 * ── La idea ─────────────────────────────────────────────────────────
 * La cuenta del restaurante (ServiceSession) puede apuntar a una
 * reserva (bookingId). Cuando apunta, las dos se leen juntas y se
 * cobran juntas. Da igual cuál se creó primero.
 *
 * ── El detalle que importa ──────────────────────────────────────────
 * Una reserva puede estar confirmada SIN estar pagada: mucha gente
 * paga en efectivo al llegar. Por eso el estado de la reserva
 * (pending/confirmed) no dice nada sobre el dinero; para eso está
 * paymentStatus (unpaid/paid). Si no se distinguieran, al juntar la
 * cuenta se le cobraría otra vez la cabaña a alguien que ya la pagó.
 */

export interface CuentaUnificada {
  sessionId: string;
  folio: string;
  etiqueta: string;

  // Restaurante
  consumoRestaurante: number;
  pedidos: Array<{ id: string; total: number; status: string; createdAt: Date }>;

  // Servicios: motos, bicis, vuelos (no alojamiento)
  servicios: Array<{
    id: string;
    descripcion: string;
    cantidad: number;
    total: number;
    fechaServicio: Date | null;
  }>;
  totalServicios: number;

  // Alojamiento (null si la cuenta no tiene reserva vinculada)
  reserva: {
    id: string;
    nombre: string;
    tipo: string;
    inicio: Date;
    fin: Date;
    huespedes: number;
    total: number;
    estado: string;
    estadoPago: string;
    montoPagado: number;
    /** Lo que falta cobrar del alojamiento. 0 si ya está pagado. */
    saldoAlojamiento: number;
  } | null;

  // Totales
  totalAlojamiento: number;
  totalGeneral: number;
}

/** Genera un folio corto y legible. Se dice en voz alta sin deletrear. */
export function generarFolio(sesion: {
  type: string;
  table?: { number: string } | null;
  label: string;
}, consecutivo: number): string {
  const n = String(consecutivo).padStart(3, "0");

  if (sesion.type === "TABLE" && sesion.table?.number) {
    // "Interior 1" → T1 → MSA-T1-001
    return `MSA-${sesion.table.number.toUpperCase()}-${n}`;
  }
  if (sesion.type === "TAB") return `CUE-${n}`;
  return `CNA-${n}`;
}

/**
 * Se asegura de que la cuenta tenga folio.
 *
 * La cuenta se puede crear desde tres sitios distintos (abrir mesa,
 * cuenta nueva, pedido QR), así que en vez de acordarse de ponerlo en
 * cada uno, se rellena aquí la primera vez que se muestra. Así ninguna
 * cuenta queda sin folio aunque se haya creado por un camino nuevo.
 */
export async function asegurarFolio(sessionId: string): Promise<string | null> {
  const sesion = await prisma.serviceSession.findUnique({
    where: { id: sessionId },
    include: { table: true },
  });
  if (!sesion) return null;
  if (sesion.folio) return sesion.folio;

  // Consecutivo: cuántas cuentas hay abiertas hoy
  const inicioDia = new Date();
  inicioDia.setHours(0, 0, 0, 0);
  const delDia = await prisma.serviceSession.count({
    where: { createdAt: { gte: inicioDia } },
  });

  const folio = generarFolio(
    { type: sesion.type, table: sesion.table, label: sesion.label },
    delDia
  );

  try {
    await prisma.serviceSession.update({ where: { id: sessionId }, data: { folio } });
    return folio;
  } catch {
    // Si otro proceso lo asignó al mismo tiempo (el folio es único),
    // se relee y se usa el que quedó.
    const otra = await prisma.serviceSession.findUnique({
      where: { id: sessionId },
      select: { folio: true },
    });
    return otra?.folio ?? null;
  }
}

/**
 * Lee la cuenta completa: consumo, alojamiento y totales.
 * Si la sesión no tiene reserva vinculada, el bloque de alojamiento
 * viene en null y el total es solo la comida.
 */
export async function leerCuentaUnificada(sessionId: string): Promise<CuentaUnificada | null> {
  const sesion = await prisma.serviceSession.findUnique({
    where: { id: sessionId },
    include: {
      table: true,
      orders: { orderBy: { createdAt: "asc" } },
      booking: { include: { item: true } },
      servicios: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!sesion) return null;

  const pedidos = sesion.orders
    .filter((o) => o.status !== "CANCELLED")
    .map((o) => ({ id: o.id, total: o.total, status: o.status, createdAt: o.createdAt }));

  const consumoRestaurante = pedidos.reduce((suma, p) => suma + p.total, 0);

  const reserva = sesion.booking
    ? (() => {
        const b = sesion.booking!;
        // Solo se cobra el alojamiento si aún no está pagado.
        const saldoAlojamiento = b.paymentStatus === "paid"
          ? 0
          : Math.max(0, b.totalPrice - b.amountPaid);

        return {
          id: b.id,
          nombre: b.item?.name ?? "Alojamiento",
          tipo: b.item?.type ?? "",
          inicio: b.startDate,
          fin: b.endDate,
          huespedes: b.guests,
          total: b.totalPrice,
          estado: b.status,
          estadoPago: b.paymentStatus,
          montoPagado: b.amountPaid,
          saldoAlojamiento,
        };
      })()
    : null;

  const servicios = sesion.servicios.map((s) => ({
    id: s.id,
    descripcion: s.descripcion,
    cantidad: s.cantidad,
    total: s.total,
    fechaServicio: s.fechaServicio,
  }));
  const totalServicios = servicios.reduce((suma, s) => suma + s.total, 0);

  const totalAlojamiento = reserva?.saldoAlojamiento ?? 0;

  return {
    sessionId: sesion.id,
    folio: sesion.folio ?? sesion.label,
    etiqueta: sesion.label,
    consumoRestaurante,
    pedidos,
    reserva,
    servicios,
    totalServicios,
    totalAlojamiento,
    totalGeneral: consumoRestaurante + totalServicios + totalAlojamiento,
  };
}

/**
 * Vincula una cuenta que ya está abierta con una reserva.
 *
 * Es el caso A: el cliente comió y después decidió quedarse, o el
 * caso B al revés, cuando al abrir la cuenta no se sabía que había
 * reserva.
 *
 * Reglas:
 *  · la cuenta debe existir (no importa que esté cerrada: se puede
 *    reabrir para consolidar)
 *  · si la cuenta ya tiene otra reserva, se rechaza — para cambiar
 *    hay que desvincular primero
 *  · si la reserva ya está vinculada a otra cuenta abierta, se
 *    rechaza: dos cuentas abiertas a la misma reserva sería un lío
 *    de cobro
 */
export async function vincularReserva(
  sessionId: string,
  bookingId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const [sesion, reserva, otraCuenta] = await Promise.all([
    prisma.serviceSession.findUnique({ where: { id: sessionId } }),
    prisma.booking.findUnique({ where: { id: bookingId }, include: { item: true } }),
    prisma.serviceSession.findFirst({
      where: { bookingId, status: "OPEN", NOT: { id: sessionId } },
    }),
  ]);

  if (!sesion) return { ok: false, error: "La cuenta no existe" };
  if (!reserva) return { ok: false, error: "La reserva no existe" };

  if (sesion.bookingId && sesion.bookingId !== bookingId) {
    return {
      ok: false,
      error: "Esta cuenta ya tiene otra reserva vinculada. Desvincúlala primero.",
    };
  }

  if (otraCuenta) {
    return {
      ok: false,
      error: `La reserva ya está vinculada a la cuenta "${otraCuenta.label}".`,
    };
  }

  if (reserva.status === "cancelled") {
    return { ok: false, error: "No se puede vincular una reserva cancelada" };
  }

  // Si la reserva no tenía cliente y la cuenta sí, se aprovecha para
  // dejar el mismo cliente en las dos puntas.
  const datos: { bookingId: string; customerId?: string } = { bookingId };
  if (!reserva.customerId && sesion.customerId) {
    datos.customerId = sesion.customerId;
  }

  await prisma.$transaction(async (tx) => {
    await tx.serviceSession.update({ where: { id: sessionId }, data: datos });
    if (datos.customerId) {
      await tx.booking.update({
        where: { id: bookingId },
        data: { customerId: datos.customerId },
      });
    }
  });

  return { ok: true };
}

/** Deshace el vínculo, sin borrar ni la cuenta ni la reserva. */
export async function desvincularReserva(sessionId: string) {
  await prisma.serviceSession.update({
    where: { id: sessionId },
    data: { bookingId: null },
  });
}

/**
 * Reservas candidatas para vincular a una cuenta.
 *
 * Se ordenan por lo que le sirve al mesero: primero las del cliente
 * de la cuenta, luego las que caen hoy, y al final el resto.
 */
export async function reservasCandidatas(opciones: {
  sessionId: string;
  busqueda?: string;
}) {
  const sesion = await prisma.serviceSession.findUnique({
    where: { id: opciones.sessionId },
    select: { customerId: true },
  });

  const hoy = new Date();
  const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const finDia = new Date(inicioDia.getTime() + 24 * 60 * 60 * 1000);

  const reservas = await prisma.booking.findMany({
    where: {
      status: { not: "cancelled" },
      ...(opciones.busqueda
        ? {
            OR: [
              { customerName: { contains: opciones.busqueda } },
              { customerEmail: { contains: opciones.busqueda } },
            ],
          }
        : {}),
    },
    include: { item: true },
    orderBy: { startDate: "desc" },
    take: 30,
  });

  // Ya vinculadas a otra cuenta abierta: no se ofrecen.
  const ocupadas = await prisma.serviceSession.findMany({
    where: { bookingId: { in: reservas.map((r) => r.id) }, status: "OPEN" },
    select: { bookingId: true },
  });
  const idsOcupados = new Set(ocupadas.map((o) => o.bookingId));

  const puntaje = (r: (typeof reservas)[number]) => {
    let p = 0;
    if (sesion?.customerId && r.customerId === sesion.customerId) p += 100;
    if (r.startDate >= inicioDia && r.startDate < finDia) p += 50;
    if (r.paymentStatus !== "paid") p += 10; // pendiente de cobro: más útil
    return p;
  };

  return reservas
    .filter((r) => !idsOcupados.has(r.id))
    .sort((a, b) => puntaje(b) - puntaje(a))
    .map((r) => ({
      id: r.id,
      nombre: r.item?.name ?? "Alojamiento",
      tipo: r.item?.type ?? "",
      cliente: r.customerName,
      inicio: r.startDate,
      fin: r.endDate,
      total: r.totalPrice,
      estado: r.status,
      estadoPago: r.paymentStatus,
      pagado: r.amountPaid,
    }));
}
