import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST — restore images for hotel/activity items (don't touch restaurant data)
export async function POST(req: NextRequest) {
  const adminSession = req.cookies.get("hangar5_admin_session")?.value;
  if (!adminSession || adminSession !== "true") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Original items with images
  const items = [
    { name: "Media Luna", slug: "media-luna", type: "cabana", description: "Acogedora y tranquila con una vista privilegiada de la montaña. Perfecta para parejas que buscan una escapada romántica.", price: 180000, capacity: "3 huéspedes", image: "/img/items/medialuna/01.jpg", featured: true },
    { name: "Casa del Árbol", slug: "casa-del-arbol", type: "cabana", description: "Fundida en la naturaleza, un espacio para descansar y conectar profundamente con la tierra. Rodeada de árboles y con vista al valle, es nuestra cabaña más emblemática.", price: 250000, capacity: "2 huéspedes · Cama Queen", image: "/img/items/casa-del-arbol/01.jpg", featured: true },
    { name: "Cabaña 1", slug: "cabana-1", type: "cabana", description: "Cabaña con vista panorámica a la montaña.", price: 280000, capacity: "3 huéspedes", image: "/img/items/casa-del-arbol/01.jpg", featured: false },
    { name: "Cabaña 2", slug: "cabana-2", type: "cabana", description: "Cabaña con vista panorámica a la montaña.", price: 280000, capacity: "3 huéspedes", image: "/img/items/casa-del-arbol/01.jpg", featured: false },
    { name: "Glamping 1", slug: "glamping-1", type: "glamping", description: "Espacio ideal para familias. Conexión total con la naturaleza sin renunciar a la comodidad.", price: 130000, capacity: "2 huéspedes", image: "/img/items/glamping-familiar/01.jpg", featured: false },
    { name: "Glamping 2", slug: "glamping-2", type: "glamping", description: "Espacio ideal para familias.", price: 130000, capacity: "2 huéspedes", image: "/img/items/glamping-familiar/01.jpg", featured: false },
    { name: "Glamping 3", slug: "glamping-3", type: "glamping", description: "Espacio ideal para familias.", price: 130000, capacity: "4 huéspedes", image: "/img/items/glamping-familiar/01.jpg", featured: false },
    { name: "Glamping 4", slug: "glamping-4", type: "glamping", description: "Perfecto para una escapada en solitario o en pareja. Un refugio minimalista entre los árboles.", price: 90000, capacity: "2 huéspedes", image: "/img/items/glamping-individual/01.jpg", featured: false },
    { name: "Camping", slug: "camping", type: "camping", description: "Acampa bajo las estrellas en el Peñón.", price: 20000, capacity: "1-4 personas", image: "/img/items/casa-del-arbol/01.jpg", featured: false },
    { name: "Vuelo en Parapente", slug: "vuelo-parapente", type: "parapente", description: "Vuelo en tándem de aproximadamente 20 minutos aterrizando en Hangar 5. Incluye instructor certificado y equipo completo.", price: 220000, capacity: "1 persona", image: "/img/items/parapente-aventura/01.jpg", featured: true },
    { name: "Vuelo Ala Delta", slug: "vuelo-ala-delta", type: "aladelta", description: "Vuelo en tándem con instructor de aproximadamente 20 minutos aterrizando en Hangar 5.", price: 270000, capacity: "1 persona", image: "/img/items/ala-delta/01.jpg", featured: true },
    { name: "Hike Corto", slug: "hike-corto", type: "hike", description: "Caminata guiada de aproximadamente una hora por los bosques aledaños al Peñón.", price: 30000, capacity: "1-4 personas", image: "/img/items/hike-guiado/01.jpg", featured: true },
    { name: "Hike Largo", slug: "hike-largo", type: "hike", description: "Caminata guiada extendida.", price: 50000, capacity: "1-4 personas", image: "/img/items/hike-guiado/01.jpg", featured: true },
    { name: "Fogata", slug: "fogata", type: "fogata", description: "Fogata al aire libre bajo las estrellas.", price: 25000, capacity: "Grupo", image: "/img/items/casa-del-arbol/01.jpg", featured: false },
    { name: "Renta de Bicicleta", slug: "renta-bicicleta", type: "bici", description: "Bicicleta de doble suspensión con 160mm de recorrido.", price: 80000, capacity: "1 persona", image: "/img/items/bici-1/01.jpg", featured: false },
    { name: "Pensión de Moto", slug: "pension-moto", type: "moto", description: "Motocicleta de enduro 300cc.", price: 150000, capacity: "1 persona", image: "/img/items/moto-1/01.jpg", featured: false },
  ];

  let updated = 0;
  for (const item of items) {
    const existing = await prisma.item.findUnique({ where: { slug: item.slug } });
    if (existing) {
      await prisma.item.update({
        where: { slug: item.slug },
        data: {
          description: item.description,
          capacity: item.capacity,
          image: item.image,
          featured: item.featured,
        },
      });
      updated++;
    }
  }

  return NextResponse.json({ success: true, message: `Restauradas imágenes de ${updated}/${items.length} items` });
}
