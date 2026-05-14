import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

const items = [
  { name: "Casa del Árbol", slug: "casa-del-arbol", type: "cabana", description: "Fundida en la naturaleza, un espacio para descansar y conectar profundamente con la tierra. Rodeada de árboles y con vista al valle, es nuestra cabaña más emblemática.", price: 250000, capacity: "2 huéspedes · Cama Queen", image: "/img/cabana-1.jpg", featured: true },
  { name: "Medialuna", slug: "medialuna", type: "cabana", description: "Acogedora y tranquila con una vista privilegiada de la montaña. Perfecta para parejas que buscan una escapada romántica.", price: 200000, capacity: "3 huéspedes · Cama Queen + Futón", image: "/img/cabana-2.jpg", featured: true },
  { name: "Cóndor y Zopilote", slug: "condor-zopilote", type: "cabana", description: "Chalet con vista panorámica a la montaña. Disfruta de la tranquilidad y comodidad en un espacio diseñado para el descanso absoluto.", price: 280000, capacity: "3 huéspedes · Cama King + Sofá", image: "/img/cabana-3.jpg", featured: true },
  { name: "Glamping Familiar", slug: "glamping-familiar", type: "glamping", description: "Espacio ideal para familias. Conexión total con la naturaleza sin renunciar a la comodidad. Dos camas matrimoniales bajo un cielo estrellado.", price: 130000, capacity: "4 huéspedes · 2 camas matrimoniales", image: "/img/glamping-1.png", featured: false },
  { name: "Glamping Individual", slug: "glamping-individual", type: "glamping", description: "Perfecto para una escapada en solitario o en pareja. Un refugio minimalista entre los árboles.", price: 90000, capacity: "2 huéspedes · 1 cama Queen", image: "/img/glamping-2.png", featured: false },
  { name: "Moto Enduro 300cc #1", slug: "moto-1", type: "moto", description: "Motocicleta de enduro 300cc. Ideal para explorar los senderos del Peñón a toda velocidad. Equipo de protección incluido.", price: 180000, capacity: "1 persona", image: "/img/moto-bg.jpg", featured: false },
  { name: "Moto Enduro 300cc #2", slug: "moto-2", type: "moto", description: "Segunda unidad de nuestra flotilla de enduro. Perfecta para salir en grupo.", price: 180000, capacity: "1 persona", image: "/img/moto-bg.jpg", featured: false },
  { name: "Bici Enduro 160mm #1", slug: "bici-1", type: "bici", description: "Bicicleta de doble suspensión con 160mm de recorrido. Geometría agresiva para dominar los senderos más técnicos.", price: 95000, capacity: "1 persona", image: "/img/bici-bg.jpg", featured: false },
  { name: "Bici Enduro 160mm #2", slug: "bici-2", type: "bici", description: "Segunda bici de nuestra flotilla. Doble suspensión lista para cualquier terreno.", price: 95000, capacity: "1 persona", image: "/img/bici-bg.jpg", featured: false },
  { name: "Bici Enduro 160mm #3", slug: "bici-3", type: "bici", description: "Tercera unidad disponible. Recorrido de 160mm, geometría de enduro.", price: 95000, capacity: "1 persona", image: "/img/bici-bg.jpg", featured: false },
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
  console.log(`Seeded ${items.length} items with images.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
