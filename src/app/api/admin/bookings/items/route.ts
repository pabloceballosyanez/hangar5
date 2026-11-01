import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/bookings/items
 *
 * Cosas que se pueden sumar a una cuenta del restaurante.
 *
 * ── El criterio no es "dónde duermes" ────────────────────────────────
 * Es el COMPORTAMIENTO de la reserva. Si se aparta por día, mientras
 * está apartada nadie más la puede usar, y se paga por día de uso,
 * entonces funciona igual que una cabaña y va aquí:
 *
 *   cabaña, glamping, moto, bici
 *
 * Los vuelos y el hike no entran: el parapente son 20 o 45 minutos
 * con instructor, el ala delta igual, y el hike es una caminata
 * guiada. No se "apartan por día" — se agendan a una hora, y si algo
 * se ocupa no bloquea el equipo, bloquea al guía.
 *
 * (Antes esto filtraba solo cabaña y glamping. Fue un error: el
 * comportamiento de apartar una moto por día es idéntico al de una
 * cabaña, y Pablo lo señaló.)
 */
const TIPOS_QUE_SE_APARTAN_POR_DIA = ["cabana", "glamping", "moto", "bici"];

export async function GET() {
  const items = await prisma.item.findMany({
    where: {
      active: true,
      type: { in: TIPOS_QUE_SE_APARTAN_POR_DIA },
    },
    select: { id: true, name: true, price: true, type: true, capacity: true },
    orderBy: [{ type: "asc" }, { price: "asc" }],
  });

  return NextResponse.json(items);
}
