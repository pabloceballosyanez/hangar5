import { prisma } from "../src/lib/prisma";

/**
 * Prepara el Café del Despegue para vender en mostrador.
 *
 * Crea la mesa de mostrador del café. No es una mesa física con
 * comensales: es el punto donde el barista cuelga la venta cuando
 * alguien pide de pie. Se necesita porque Order siempre cuelga de una
 * mesa, y sin ella no habría dónde apoyar la venta.
 *
 * También marca todas las mesas actuales como del restaurante, que es
 * donde están.
 */
async function main() {
  const restaurante = await prisma.ubicacion.findUnique({ where: { clave: "restaurante" } });
  const cafe = await prisma.ubicacion.findUnique({ where: { clave: "cafe" } });

  if (!restaurante || !cafe) {
    throw new Error("Faltan las ubicaciones. Corre inicializar-ubicaciones.ts primero.");
  }

  // Las mesas que ya existen son del restaurante
  const sinUbicacion = await prisma.table.updateMany({
    where: { ubicacionId: null },
    data: { ubicacionId: restaurante.id },
  });
  console.log(`Mesas asignadas al restaurante: ${sinUbicacion.count}`);

  // Mesa de mostrador del café
  const existente = await prisma.table.findUnique({ where: { number: "CAFE-MOSTRADOR" } });

  if (existente) {
    await prisma.table.update({
      where: { number: "CAFE-MOSTRADOR" },
      data: { ubicacionId: cafe.id, isActive: true },
    });
    console.log("Mesa de mostrador del café: ya existía, actualizada.");
  } else {
    await prisma.table.create({
      data: {
        number: "CAFE-MOSTRADOR",
        name: "Mostrador del café",
        qrToken: "cafe-mostrador",
        capacity: 1,
        location: "Café del Despegue",
        isActive: true,
        ubicacionId: cafe.id,
      },
    });
    console.log("Mesa de mostrador del café: creada.");
  }

  const mesas = await prisma.table.findMany({
    select: { number: true, name: true, ubicacion: { select: { clave: true } } },
    orderBy: { number: "asc" },
  });
  console.log("\nMesas por ubicación:");
  for (const m of mesas) {
    console.log(`  ${m.ubicacion?.clave ?? "sin ubicación"}  ${m.number}  ${m.name ?? ""}`);
  }
}

main()
  .catch((e) => {
    console.error("ERROR:", e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
