import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

const items = [
  { name: "Casa del Árbol", slug: "casa-del-arbol", type: "cabana", description: "Fundida en la naturaleza, un espacio para descansar y conectar profundamente con la tierra.", price: 250000, capacity: "2 huéspedes / Cama Queen", featured: true },
  { name: "Medialuna", slug: "medialuna", type: "cabana", description: "Acogedora y tranquila con una vista privilegiada de la montaña.", price: 200000, capacity: "3 huéspedes / Cama Queen + Futón", featured: true },
  { name: "Cóndor y Zopilote", slug: "condor-zopilote", type: "cabana", description: "Chalet con vista a la montaña. Descanso y tranquilidad.", price: 280000, capacity: "3 huéspedes / Cama King + Sofá", featured: true },
  { name: "Glamping Familiar", slug: "glamping-familiar", type: "glamping", description: "Espacio ideal para familias. Conexión total con la naturaleza.", price: 130000, capacity: "4 huéspedes / 2 camas matrimoniales", featured: false },
  { name: "Glamping Individual", slug: "glamping-individual", type: "glamping", description: "Perfecto para una escapada en solitario o en pareja.", price: 90000, capacity: "2 huéspedes / 1 cama Queen", featured: false },
  { name: "Moto 300cc #1", slug: "moto-1", type: "moto", description: "Motocicleta enduro 300cc. Ideal para explorar senderos.", price: 180000, capacity: "1 persona", featured: false },
  { name: "Moto 300cc #2", slug: "moto-2", type: "moto", description: "Motocicleta enduro 300cc. Segunda unidad.", price: 180000, capacity: "1 persona", featured: false },
  { name: "Bici Enduro #1", slug: "bici-1", type: "bici", description: "Doble suspensión 160mm recorrido. Geometría enduro.", price: 95000, capacity: "1 persona", featured: false },
  { name: "Bici Enduro #2", slug: "bici-2", type: "bici", description: "Doble suspensión 160mm. Segunda unidad.", price: 95000, capacity: "1 persona", featured: false },
  { name: "Bici Enduro #3", slug: "bici-3", type: "bici", description: "Doble suspensión 160mm. Tercera unidad.", price: 95000, capacity: "1 persona", featured: false },
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
  console.log(`Seeded ${items.length} items.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
