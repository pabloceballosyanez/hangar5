import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { asegurarUbicaciones } from "@/lib/ubicaciones";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/ubicaciones
 *
 * Lista las ubicaciones y, con ?items=1, qué platillos se venden en
 * cada una. Es lo que necesita la pantalla para pintar los checkboxes.
 */
export async function GET(req: NextRequest) {
  const ubicaciones = await asegurarUbicaciones();

  const url = new URL(req.url);
  if (url.searchParams.get("items") !== "1") {
    return NextResponse.json({ ubicaciones });
  }

  const [platillos, marcas] = await Promise.all([
    prisma.menuItem.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        basePrice: true,
        category: { select: { name: true } },
      },
      orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.menuItemUbicacion.findMany({
      select: { menuItemId: true, ubicacionId: true, disponible: true },
    }),
  ]);

  // Índice rápido: platillo -> ubicación -> disponible
  const indice = new Map<string, Map<string, boolean>>();
  for (const m of marcas) {
    if (!indice.has(m.menuItemId)) indice.set(m.menuItemId, new Map());
    indice.get(m.menuItemId)!.set(m.ubicacionId, m.disponible);
  }

  const restaurante = ubicaciones.find((u) => u.clave === "restaurante");

  const items = platillos.map((p) => {
    const porUbicacion: Record<string, boolean> = {};
    for (const u of ubicaciones) {
      /* Antes, si un platillo no tenía fila, se daba por marcado en el
         restaurante ("comportamiento histórico"). Eso hacía que la
         pantalla dijera 56 marcados cuando en la base no había ni una
         fila, y la carta —que sí exige fila— salía vacía.
         Ahora se dice la verdad: sin fila, no está marcado. Las filas
         del restaurante las crea scripts/materializar-marcas.ts al
         arrancar, así que lo que se ve es lo que hay. */
      porUbicacion[u.id] = indice.get(p.id)?.get(u.id) === true;
    }
    return {
      id: p.id,
      nombre: p.name,
      precio: p.basePrice,
      categoria: p.category?.name ?? "",
      ubicaciones: porUbicacion,
    };
  });

  return NextResponse.json({ ubicaciones, items, restauranteId: restaurante?.id ?? null });
}

const marcarSchema = z.object({
  menuItemId: z.string().min(1),
  ubicacionId: z.string().min(1),
  disponible: z.boolean(),
});

/**
 * PUT /api/admin/ubicaciones
 *
 * Marca o desmarca un platillo en una ubicación.
 *
 * Body: { menuItemId, ubicacionId, disponible }
 */
export async function PUT(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const parseo = marcarSchema.safeParse(body);
  if (!parseo.success) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const { menuItemId, ubicacionId, disponible } = parseo.data;

  await prisma.menuItemUbicacion.upsert({
    where: { menuItemId_ubicacionId: { menuItemId, ubicacionId } },
    update: { disponible },
    create: { menuItemId, ubicacionId, disponible },
  });

  return NextResponse.json({ ok: true });
}
