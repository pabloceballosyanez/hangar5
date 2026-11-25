import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/restaurant/servicios
 *
 * Catálogo de TODO lo que se puede cargar a la cuenta de un cliente:
 * alojamiento, rentas y actividades.
 *
 * No sirve /api/admin/bookings/items porque ese solo devuelve lo que se
 * aparta por día (cabaña, glamping, moto, bici). Los vuelos de parapente y
 * ala delta quedan fuera a propósito: se agendan a una hora, no bloquean el
 * equipo. Pero SÍ se venden, y sí se cobran en la cuenta del cliente.
 */
export async function GET(_req: NextRequest) {
  const items = await prisma.item.findMany({
    where: { active: true },
    select: { id: true, name: true, price: true, type: true, capacity: true },
    orderBy: [{ type: "asc" }, { price: "asc" }],
  });

  return NextResponse.json(items);
}
