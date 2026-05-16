import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

const items = [
  { name: "Casa del Árbol", slug: "casa-del-arbol", type: "cabana", description: "Fundida en la naturaleza, un espacio para descansar y conectar profundamente con la tierra. Rodeada de árboles y con vista al valle, es nuestra cabaña más emblemática.", price: 250000, capacity: "2 huéspedes · Cama Queen", image: "/img/items/casa-del-arbol/01.jpg", featured: true },
  { name: "Medialuna", slug: "medialuna", type: "cabana", description: "Acogedora y tranquila con una vista privilegiada de la montaña. Perfecta para parejas que buscan una escapada romántica.", price: 200000, capacity: "3 huéspedes · Cama Queen + Futón", image: "/img/items/medialuna/01.jpg", featured: true },
  { name: "Cóndor y Zopilote", slug: "condor-zopilote", type: "cabana", description: "Chalet con vista panorámica a la montaña. Disfruta de la tranquilidad y comodidad en un espacio diseñado para el descanso absoluto.", price: 280000, capacity: "3 huéspedes · Cama King + Sofá", image: "/img/items/condor-zopilote/01.jpg", featured: true },
  { name: "Glamping Familiar", slug: "glamping-familiar", type: "glamping", description: "Espacio ideal para familias. Conexión total con la naturaleza sin renunciar a la comodidad. Dos camas matrimoniales bajo un cielo estrellado.", price: 130000, capacity: "4 huéspedes · 2 camas matrimoniales", image: "/img/items/glamping-familiar/01.jpg", featured: false },
  { name: "Glamping Individual", slug: "glamping-individual", type: "glamping", description: "Perfecto para una escapada en solitario o en pareja. Un refugio minimalista entre los árboles.", price: 90000, capacity: "2 huéspedes · 1 cama Queen", image: "/img/items/glamping-individual/01.jpg", featured: false },
  { name: "Moto Enduro 300cc #1", slug: "moto-1", type: "moto", description: "Motocicleta de enduro 300cc. Ideal para explorar los senderos del Peñón a toda velocidad. Equipo de protección incluido.", price: 180000, capacity: "1 persona", image: "/img/items/moto-1/01.jpg", featured: false },
  { name: "Moto Enduro 300cc #2", slug: "moto-2", type: "moto", description: "Segunda unidad de nuestra flotilla de enduro. Perfecta para salir en grupo.", price: 180000, capacity: "1 persona", image: "/img/items/moto-2/01.jpg", featured: false },
  { name: "Bici Enduro 160mm #1", slug: "bici-1", type: "bici", description: "Bicicleta de doble suspensión con 160mm de recorrido. Geometría agresiva para dominar los senderos más técnicos.", price: 95000, capacity: "1 persona", image: "/img/items/bici-1/01.jpg", featured: false },
  { name: "Bici Enduro 160mm #2", slug: "bici-2", type: "bici", description: "Segunda bici de nuestra flotilla. Doble suspensión lista para cualquier terreno.", price: 95000, capacity: "1 persona", image: "/img/items/bici-2/01.jpg", featured: false },
  { name: "Bici Enduro 160mm #3", slug: "bici-3", type: "bici", description: "Tercera unidad disponible. Recorrido de 160mm, geometría de enduro.", price: 95000, capacity: "1 persona", image: "/img/items/bici-3/01.jpg", featured: false },
  // Actividades
  { name: "Parapente — Aventura", slug: "parapente-aventura", type: "parapente", description: "Vuelo en tándem de aproximadamente 20 minutos de duración aterrizando en Hangar 5. Una experiencia única para sentir la libertad del vuelo. Incluye instructor certificado y equipo completo.", price: 250000, capacity: "20 min · 1 persona", image: "/img/parapente-aventura.jpg", featured: true },
  { name: "Parapente — Exploración", slug: "parapente-exploracion", type: "parapente", description: "Vuelo en tándem extendido de aproximadamente 45 minutos sobre los paisajes del Peñón. Más altura, más distancia, más adrenalina. Incluye instructor certificado y equipo completo.", price: 350000, capacity: "45 min · 1 persona", image: "/img/parapente-exploracion.jpg", featured: true },
  { name: "Ala Delta", slug: "ala-delta", type: "aladelta", description: "Vuelo en tándem con instructor de aproximadamente 20 minutos de duración aterrizando en Hangar 5. Una perspectiva única del valle desde las alas.", price: 300000, capacity: "20 min · 1 persona", image: "/img/ala-delta.jpg", featured: true },
  { name: "Hike Guiado", slug: "hike-guiado", type: "hike", description: "Caminata guiada de aproximadamente una hora por los bosques aledaños al Peñón. Grupos de 1 a 4 personas como máximo. Conecta con la naturaleza a través de senderos espectaculares.", price: 50000, capacity: "~1 hora · grupos de 1-4 pers.", image: "/img/hike-guiado.jpg", featured: true },
];

async function main() {
  console.log("Seeding database...");
  for (const item of items) {
    await prisma.item.upsert({
      where: { slug: item.slug },
      update: item,
      create: item,
    });
  }
  console.log(`Seeded ${items.length} items correctly.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
