import { prisma } from "../src/lib/prisma";

/**
 * Materializa las marcas del restaurante.
 *
 * La pantalla de Ubicaciones marca el restaurante por defecto cuando un
 * platillo no tiene fila ("comportamiento histórico"), pero la fila no
 * existe en la base: la API la inventa al vuelo. Eso deja dos verdades
 * distintas — la pantalla dice 56 marcados y la carta ve 0.
 *
 * Aquí se crean las filas reales, para que la configuración sea la única
 * fuente de verdad. Después de esto, lo que está marcado en pantalla es
 * exactamente lo que existe en la base.
 *
 * Idempotente: si la fila ya existe, no se toca.
 */
async function main() {
  const ubicaciones = await prisma.ubicacion.findMany({
    select: { id: true, clave: true },
  });
  const restaurante = ubicaciones.find((u: { clave: string }) => u.clave === "restaurante");
  if (!restaurante) throw new Error("No existe la ubicación restaurante");

  const platillos = await prisma.menuItem.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  const existentes = await prisma.menuItemUbicacion.findMany({
    where: { ubicacionId: restaurante.id },
    select: { menuItemId: true },
  });
  const yaTiene = new Set(existentes.map((m: { menuItemId: string }) => m.menuItemId));

  let creadas = 0;
  let saltadas = 0;

  for (const p of platillos) {
    if (yaTiene.has(p.id)) {
      saltadas++;
      continue;
    }
    await prisma.menuItemUbicacion.create({
      data: {
        menuItemId: p.id,
        ubicacionId: restaurante.id,
        disponible: true,
      },
    });
    creadas++;
  }

  console.log(`  platillos activos: ${platillos.length}`);
  console.log(`  filas creadas:     ${creadas}`);
  console.log(`  ya existían:       ${saltadas}`);

  const total = await prisma.menuItemUbicacion.count({
    where: { ubicacionId: restaurante.id, disponible: true },
  });
  console.log(`  restaurante ahora: ${total} marcas reales`);
}

main()
  .catch((e) => {
    console.error("ERROR:", e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
