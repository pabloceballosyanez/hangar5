/**
 * Crea tres productos comprados hechos para el Despegue.
 *
 * Pablo: "muffin de blueberry, precio 40 costo 20. Muffin de zanahoria
 * precio 40, costo 20. Strudel de manzana precio 60, costo 30".
 *
 * Son productos que se compran ya hechos, sin receta de preparación. La
 * app no tiene un campo de costo en el platillo, así que se sigue el
 * mismo patrón que los refrescos y las cervezas: un insumo con el nombre
 * del producto, su costo, y una receta de 1 pieza. Así el margen se puede
 * calcular y el inventario descuenta al vender.
 *
 * Los precios y costos se guardan en CENTAVOS, como todo el dinero de la
 * app: $40 → 4000.
 */
import { prisma } from "../src/lib/prisma";
import { CLAVE_CAFE } from "../src/lib/almacenes";

const PRODUCTOS = [
  { nombre: "Muffin de Blueberry", precio: 40, costo: 20 },
  { nombre: "Muffin de Zanahoria", precio: 40, costo: 20 },
  { nombre: "Strudel de Manzana", precio: 60, costo: 30 },
];

const CATEGORIA = "Postres";
const ESTACION = "BAR"; // el Despegue es barra

async function main() {
  const categoria = await prisma.category.findFirst({ where: { name: CATEGORIA } });
  if (!categoria) throw new Error(`No encontré la categoría "${CATEGORIA}"`);

  const ubicacionCafe = await prisma.ubicacion.findFirst({ where: { clave: "cafe" } });
  if (!ubicacionCafe) throw new Error("No encontré la ubicación del café");

  const almacenBarra = await prisma.almacen.findFirst({ where: { clave: CLAVE_CAFE } });

  for (const p of PRODUCTOS) {
    const precioCent = Math.round(p.precio * 100);
    const costoCent = Math.round(p.costo * 100);

    // ¿Ya existe? No se duplica.
    const yaExiste = await prisma.menuItem.findFirst({ where: { name: p.nombre } });
    if (yaExiste) {
      console.log(`  · ${p.nombre}: ya existe, no se toca`);
      continue;
    }

    const item = await prisma.$transaction(async (tx) => {
      // 1. El platillo.
      const mi = await tx.menuItem.create({
        data: {
          categoryId: categoria.id,
          name: p.nombre,
          description: "Comprado hecho. No requiere preparación.",
          basePrice: precioCent,
          isActive: true,
          prepStation: ESTACION,
          estimatedPrepMinutes: 1,
        },
      });

      // 2. Se vende en el Despegue.
      await tx.menuItemUbicacion.create({
        data: { menuItemId: mi.id, ubicacionId: ubicacionCafe.id },
      });

      // 3. Su insumo, con el costo real. Es un producto comprado: 1 pieza
      //    por unidad vendida, igual que los refrescos y las cervezas.
      const ing = await tx.ingredient.create({
        data: {
          name: p.nombre,
          unit: "pieza",
          cost: costoCent,
          currentStock: 0,
          minStock: 0,
        },
      });

      // 4. La receta de 1 pieza: al vender uno, se descuenta uno.
      const receta = await tx.recipe.create({
        data: { menuItemId: mi.id, yieldQuantity: 1 },
      });
      await tx.recipeItem.create({
        data: { recipeId: receta.id, ingredientId: ing.id, quantity: 1 },
      });

      // 5. Fila de stock en la barra, en cero (el inventario real se carga
      //    después; aquí solo se deja lista la fila).
      if (almacenBarra) {
        await tx.stockAlmacen.create({
          data: { almacenId: almacenBarra.id, ingredientId: ing.id, cantidad: 0 },
        });
      }

      return mi;
    });

    const margen = precioCent - costoCent;
    console.log(
      `  ✓ ${item.name.padEnd(22)} precio $${p.precio.toFixed(2)}` +
      `  costo $${p.costo.toFixed(2)}` +
      `  margen $${(margen / 100).toFixed(2)}` +
      `  (${Math.round((margen / precioCent) * 100)}%)`
    );
  }
}

main()
  .catch((e) => { console.error("  error:", e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
