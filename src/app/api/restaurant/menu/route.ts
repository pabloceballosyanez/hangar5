import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listarUbicaciones, CLAVE_CAFE } from "@/lib/ubicaciones";

export const dynamic = "force-dynamic";

/**
 * GET /api/restaurant/menu
 *
 * Menú público. Devuelve las categorías con sus platillos activos.
 *
 * Con ?ubicacion=cafe devuelve SOLO lo que se vende en el Café del
 * Despegue. Sin parámetro (o con ubicacion=restaurante) devuelve el
 * menú completo, igual que siempre — así nada deja de funcionar
 * mientras se va poblando el catálogo del café.
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const claveUbicacion = url.searchParams.get("ubicacion") ?? "restaurante";

    /* Filtro por ubicación.
       Para el café: solo lo marcado explícitamente.
       Para el restaurante: todo menos lo desmarcado — así los platillos
       que ya existen siguen apareciendo sin tocar uno por uno. */
    let filtroIds: { in: string[] } | undefined;

    if (claveUbicacion === CLAVE_CAFE) {
      const ubicaciones = await listarUbicaciones();
      const cafe = ubicaciones.find((u) => u.clave === CLAVE_CAFE);
      if (!cafe) {
        return NextResponse.json([]);
      }
      const marcados = await prisma.menuItemUbicacion.findMany({
        where: { ubicacionId: cafe.id, disponible: true },
        select: { menuItemId: true },
      });
      filtroIds = { in: marcados.map((m) => m.menuItemId) };
      if (filtroIds.in.length === 0) {
        return NextResponse.json([]);
      }
    } else {
      const ubicaciones = await listarUbicaciones();
      const rest = ubicaciones.find((u) => u.clave === "restaurante");
      if (rest) {
        const desmarcados = await prisma.menuItemUbicacion.findMany({
          where: { ubicacionId: rest.id, disponible: false },
          select: { menuItemId: true },
        });
        if (desmarcados.length > 0) {
          const todos = await prisma.menuItem.findMany({
            where: { isActive: true },
            select: { id: true },
          });
          const excluidos = new Set(desmarcados.map((d) => d.menuItemId));
          filtroIds = { in: todos.map((t) => t.id).filter((id) => !excluidos.has(id)) };
        }
      }
    }

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        kind: true,
        sortOrder: true,
        imageUrl: true,
        menuItems: {
          where: {
            isActive: true,
            ...(filtroIds ? { id: filtroIds } : {}),
          },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            name: true,
            description: true,
            basePrice: true,
            imageUrl: true,
            prepStation: true,
            estimatedPrepMinutes: true,
            sortOrder: true,
            variants: {
              orderBy: { isDefault: "desc" },
              select: {
                id: true,
                name: true,
                priceDelta: true,
                isDefault: true,
              },
            },
            menuItemModifierGroups: {
              select: {
                id: true,
                modifierGroup: {
                  select: {
                    id: true,
                    name: true,
                    minSelections: true,
                    maxSelections: true,
                    isRequired: true,
                    modifiers: {
                      select: {
                        id: true,
                        name: true,
                        priceDelta: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Convert prices from centavos → pesos
    const menu = categories.map((cat) => ({
      ...cat,
      menuItems: cat.menuItems.map((item) => ({
        ...item,
        basePrice: item.basePrice / 100,
        variants: item.variants.map((v) => ({
          ...v,
          priceDelta: v.priceDelta / 100,
        })),
        modifierGroups: item.menuItemModifierGroups.map((rel) => ({
          ...rel.modifierGroup,
          pivotId: rel.id,
          modifiers: rel.modifierGroup.modifiers.map((m) => ({
            ...m,
            priceDelta: m.priceDelta / 100,
          })),
        })),
        menuItemModifierGroups: undefined, // strip raw pivot
      })),
    }));

    return NextResponse.json(menu);
  } catch (err) {
    console.error("[GET /api/restaurant/menu]", err);
    return NextResponse.json({ error: "Error al obtener el menú" }, { status: 500 });
  }
}
