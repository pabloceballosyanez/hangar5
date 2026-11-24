import { prisma } from '@/lib/prisma';
import { NextResponse, type NextRequest } from 'next/server';
import { slugify, tieneHistoria } from '@/lib/carta-historias';

export const dynamic = 'force-dynamic';

/**
 * GET /api/menu?lugar=restaurante|cafe
 *
 * El menú que ve el cliente en la web.
 *
 * Antes traía TODO lo activo. Eso mostraba en el restaurante los productos
 * del Despegue y al revés: la gente veía cosas que en ese lugar no se
 * venden. Pablo: "no está separando las ubicaciones y eso es crucial".
 *
 * Ahora se filtra por ubicación igual que la carta impresa: un producto
 * aparece solo si está marcado como disponible en ese lugar
 * (Admin → Ubicaciones). Sin parámetro se asume el restaurante, que es lo
 * que era antes y lo que espera el enlace viejo.
 */
export async function GET(req: NextRequest) {
  try {
    const lugar = (req.nextUrl.searchParams.get('lugar') || 'restaurante').toLowerCase();

    const ubicacion = await prisma.ubicacion.findFirst({
      where: { clave: lugar },
      select: { id: true, nombre: true },
    });

    if (!ubicacion) {
      return NextResponse.json({ error: `No existe la ubicación "${lugar}"` }, { status: 404 });
    }

    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
        /* Solo categorías que tengan al menos un platillo vendible aquí. */
        menuItems: {
          some: {
            isActive: true,
            ubicaciones: { some: { ubicacionId: ubicacion.id, disponible: true } },
          },
        },
      },
      include: {
        menuItems: {
          where: {
            isActive: true,
            ubicaciones: { some: { ubicacionId: ubicacion.id, disponible: true } },
          },
          include: {
            variants: true,
            /* Los modificadores que SUBEN el precio se muestran en la web.
               Pablo: "la queja es que no lo saben hasta que les llega la
               cuenta porque en la carta no está explícito". Solo se
               mandan los que agregan costo: los de preferencia (cocción
               del huevo, aderezo, endulzante) no cambian el precio y
               solo ensuciarían la tarjeta. */
            menuItemModifierGroups: {
              include: {
                modifierGroup: {
                  include: {
                    modifiers: {
                  where: { isActive: true, priceDelta: { gt: 0 } },
                      select: { id: true, name: true, priceDelta: true },
                      orderBy: { priceDelta: "asc" },
                    },
                  },
                },
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Anota cada platillo con su slug de ficha y si tiene reseña propia
    const annotated = categories.map((cat) => ({
      ...cat,
      menuItems: cat.menuItems.map((item) => {
        /* Los extras se aplanan a una sola lista: el cliente no tiene por
           qué saber que en la base están agrupados. Solo llegan los que
           suben el precio, y los grupos que quedan vacíos se descartan. */
        const extras = (item.menuItemModifierGroups ?? [])
          .flatMap((mg) => mg.modifierGroup?.modifiers ?? []);

        const { menuItemModifierGroups: _omit, ...resto } = item;
        return {
          ...resto,
          slug: slugify(item.name),
          hasStory: tieneHistoria(item.name),
          extras: extras
            .filter((m) => m.priceDelta > 0)
            .sort((a, b) => a.priceDelta - b.priceDelta),
        };
      }),
    }));

    return NextResponse.json(annotated);
  } catch (error) {
    console.error('Error fetching menu:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu' },
      { status: 500 }
    );
  }
}
