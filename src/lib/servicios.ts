import { prisma } from "@/lib/prisma";

/**
 * Servicios vendidos en una cuenta: renta y vuelos.
 *
 * ── Qué entra aquí ───────────────────────────────────────────────────
 * Motos, bicis, parapente, ala delta, hike. Todo lo que se cobra y no
 * es comida ni alojamiento.
 *
 * El alojamiento NO entra: una cabaña va por Booking porque implica
 * fechas, noches y ocupación. Los servicios son más simples —una moto
 * por un día, dos parapentes el sábado— y no bloquean inventario de
 * cocina.
 *
 * ── Por qué el precio se congela ─────────────────────────────────────
 * El precio y la descripción se copian al momento de vender. Si mañana
 * sube la moto a $2,000, la cuenta de ayer debe seguir diciendo
 * $1,800. Guardar solo el id del item haría que todas las cuentas
 * viejas cambiaran de precio solas.
 */

export interface ServicioInput {
  itemId: string;
  cantidad?: number;
  fechaServicio?: string | null;
  notas?: string | null;
}

export interface ServicioVendido {
  id: string;
  itemId: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
  fechaServicio: Date | null;
  notas: string | null;
}

/** Agrega un servicio a una cuenta abierta. */
export async function agregarServicio(
  sessionId: string,
  input: ServicioInput
): Promise<{ ok: true; servicio: ServicioVendido } | { ok: false; error: string }> {
  const sesion = await prisma.serviceSession.findUnique({
    where: { id: sessionId },
    select: { id: true, status: true },
  });

  if (!sesion) return { ok: false, error: "La cuenta no existe" };
  if (sesion.status === "CLOSED") {
    return { ok: false, error: "La cuenta ya está cerrada" };
  }

  const item = await prisma.item.findUnique({ where: { id: input.itemId } });
  if (!item) return { ok: false, error: "Ese servicio no existe" };
  if (!item.active) return { ok: false, error: `"${item.name}" no está disponible` };

  const cantidad = input.cantidad ?? 1;
  if (!Number.isInteger(cantidad) || cantidad < 1) {
    return { ok: false, error: "La cantidad debe ser al menos 1" };
  }

  const fecha = input.fechaServicio ? new Date(input.fechaServicio) : null;
  if (input.fechaServicio && Number.isNaN(fecha?.getTime())) {
    return { ok: false, error: "Fecha inválida" };
  }

  const servicio = await prisma.servicioCuenta.create({
    data: {
      serviceSessionId: sessionId,
      itemId: item.id,
      // Se congela el nombre y el precio del momento de la venta
      descripcion: item.name,
      cantidad,
      precioUnitario: item.price,
      total: item.price * cantidad,
      fechaServicio: fecha,
      notas: input.notas ?? null,
    },
  });

  return {
    ok: true,
    servicio: {
      id: servicio.id,
      itemId: servicio.itemId,
      descripcion: servicio.descripcion,
      cantidad: servicio.cantidad,
      precioUnitario: servicio.precioUnitario,
      total: servicio.total,
      fechaServicio: servicio.fechaServicio,
      notas: servicio.notas,
    },
  };
}

/** Quita un servicio de la cuenta. */
export async function quitarServicio(
  sessionId: string,
  servicioId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const servicio = await prisma.servicioCuenta.findUnique({
    where: { id: servicioId },
    select: { id: true, serviceSessionId: true },
  });

  if (!servicio || servicio.serviceSessionId !== sessionId) {
    return { ok: false, error: "Ese servicio no pertenece a esta cuenta" };
  }

  await prisma.servicioCuenta.delete({ where: { id: servicioId } });
  return { ok: true };
}

/** Servicios de una cuenta, listos para mostrar. */
export async function serviciosDeCuenta(sessionId: string) {
  const servicios = await prisma.servicioCuenta.findMany({
    where: { serviceSessionId: sessionId },
    orderBy: { createdAt: "asc" },
  });

  const total = servicios.reduce((suma, s) => suma + s.total, 0);

  return {
    servicios: servicios.map((s) => ({
      id: s.id,
      itemId: s.itemId,
      descripcion: s.descripcion,
      cantidad: s.cantidad,
      precioUnitario: s.precioUnitario,
      total: s.total,
      fechaServicio: s.fechaServicio,
      notas: s.notas,
    })),
    total,
  };
}

/**
 * Servicios que se pueden vender, agrupados por tipo.
 *
 * Se excluyen los alojamientos a propósito: esos van por el panel de
 * reserva, donde se piden fechas y se revisa ocupación. Ofrecerlos aquí
 * duplicaría el camino y permitiría vender una cabaña dos veces.
 */
export async function catalogoServicios() {
  const items = await prisma.item.findMany({
    where: {
      active: true,
      type: { in: ["moto", "bici", "parapente", "aladelta", "hike"] },
    },
    select: { id: true, name: true, price: true, type: true, capacity: true },
    orderBy: [{ type: "asc" }, { price: "asc" }],
  });

  const etiquetas: Record<string, string> = {
    moto: "Motos",
    bici: "Bicicletas",
    parapente: "Parapente",
    aladelta: "Ala delta",
    hike: "Caminatas",
  };

  const grupos = new Map<string, { tipo: string; etiqueta: string; items: typeof items }>();
  for (const item of items) {
    if (!grupos.has(item.type)) {
      grupos.set(item.type, {
        tipo: item.type,
        etiqueta: etiquetas[item.type] ?? item.type,
        items: [],
      });
    }
    grupos.get(item.type)!.items.push(item);
  }

  return Array.from(grupos.values());
}
