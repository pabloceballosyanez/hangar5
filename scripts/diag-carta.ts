import { prisma } from "../src/lib/prisma";

/**
 * Diagnóstico: por qué la carta del restaurante sale vacía en producción.
 * Corre contra la base que le pases en DATABASE_URL.
 */
async function main() {
  const ubicaciones = await prisma.ubicacion.findMany({
    select: { id: true, clave: true, nombre: true, activa: true },
  });
  console.log("=== UBICACIONES ===");
  for (const u of ubicaciones) {
    const marcas = await prisma.menuItemUbicacion.count({
      where: { ubicacionId: u.id, disponible: true },
    });
    console.log(`  ${u.clave.padEnd(12)} id=${u.id}  activa=${u.activa}  marcas=${marcas}`);
  }

  const total = await prisma.menuItem.count({ where: { isActive: true } });
  console.log(`\n=== PLATILLOS ACTIVOS: ${total} ===`);

  for (const u of ubicaciones) {
    const filtrados = await prisma.menuItem.count({
      where: {
        isActive: true,
        ubicaciones: { some: { ubicacionId: u.id, disponible: true } },
      },
    });
    console.log(`  ${u.clave.padEnd(12)} productos que devuelve el filtro: ${filtrados}`);
  }

  const cats = await prisma.category.count({ where: { isActive: true } });
  console.log(`\n=== CATEGORIAS ACTIVAS: ${cats} ===`);

  for (const u of ubicaciones) {
    const c = await prisma.category.count({
      where: {
        isActive: true,
        menuItems: {
          some: { isActive: true, ubicaciones: { some: { ubicacionId: u.id, disponible: true } } },
        },
      },
    });
    console.log(`  ${u.clave.padEnd(12)} categorias que devuelve el filtro: ${c}`);
  }

  // Muestra de marcas crudas
  const muestra = await prisma.menuItemUbicacion.findMany({
    take: 5,
    select: { menuItemId: true, ubicacionId: true, disponible: true },
  });
  console.log("\n=== MUESTRA DE MARCAS CRUDAS ===");
  for (const m of muestra) {
    console.log(`  item=${m.menuItemId}  ubic=${m.ubicacionId}  disp=${m.disponible}`);
  }
}

main()
  .catch((e) => console.error("ERROR:", e.message))
  .finally(() => prisma.$disconnect());
