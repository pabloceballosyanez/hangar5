import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/bookings/items
 *
 * Alojamientos que se pueden sumar a una cuenta del restaurante:
 * solo cabañas y glampings.
 *
 * La tabla Item también guarda motos, bicis, parapente, ala delta y
 * hike — son cosas que se reservan pero NO se duermen en ellas. Si se
 * ofrecieran todas, el mesero vería "Moto Enduro $1,800/noche" al
 * agregar alojamiento, que no tiene ningún sentido.
 */
const TIPOS_ALOJAMIENTO = ["cabana", "glamping"];

export async function GET() {
  const items = await prisma.item.findMany({
    where: {
      active: true,
      type: { in: TIPOS_ALOJAMIENTO },
    },
    select: { id: true, name: true, price: true, type: true, capacity: true },
    orderBy: [{ type: "asc" }, { price: "asc" }],
  });

  return NextResponse.json(items);
}
