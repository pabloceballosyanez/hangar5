import type { Prisma } from "@prisma/client";

/**
 * Descuenta el inventario de una orden ya guardada.
 *
 * Vive aparte porque hay varios momentos en que se descuenta:
 *   · al crear la orden (Despegue, mesero, QR, caja)
 *   · al confirmarse el pago con tarjeta, en el webhook
 *
 * ── DE QUÉ ALMACÉN SALE ─────────────────────────────────────────────
 * Cada ubicación tiene su almacén: el restaurante descuenta de la cocina
 * y el Despegue de la barra. Antes esto bajaba el total del insumo
 * (Ingredient.currentStock) sin tocar el almacén, así que la barra del
 * café nunca reflejaba lo que vendía y los dos almacenes se veían
 * idénticos para siempre.
 *
 * Ahora se descuenta del almacén de la ubicación del pedido, y el total
 * se recalcula como la suma de todos los almacenes. Así el total siempre
 * cuadra con sus partes y el traspaso mueve mercancía sin alterarlo.
 */
export async function descontarInventarioDeOrden(
  tx: Prisma.TransactionClient,
  orderId: string
) {
  const orden = await tx.order.findUnique({
    where: { id: orderId },
    select: { ubicacionId: true },
  });

  /* El almacén del que sale. Si la orden no tiene ubicación (una orden
     vieja, o una que se creó sin ese dato), se usa cocina: es el almacén
     que tiene todo, y es preferible descontar de ahí que no descontar. */
  const almacen = await resolverAlmacen(tx, orden?.ubicacionId ?? null);

  const items = await tx.orderItem.findMany({
    where: { orderId },
    include: { menuItem: true, modifiers: true },
  });

  for (const item of items) {
    // 1. Ingredientes de la receta del platillo
    const receta = await tx.recipe.findUnique({
      where: { menuItemId: item.menuItemId },
      include: { recipeItems: { include: { ingredient: true } } },
    });

    if (receta && receta.recipeItems.length > 0) {
      for (const ri of receta.recipeItems) {
        const cantidad = ri.quantity * item.quantity;
        await descontarDeAlmacen(tx, {
          almacenId: almacen.id,
          ingredientId: ri.ingredientId,
          cantidad,
          reason: `Venta: ${item.quantity}x ${item.menuItem.name}`,
          notas: `Salida de ${almacen.nombre}`,
        });
      }
    }

    // 2. Modificadores que descuentan inventario (ej. extra de queso)
    if (item.modifiers.length > 0) {
      const mods = await tx.modifier.findMany({
        where: { id: { in: item.modifiers.map((m) => m.modifierId) }, deductsInventory: true },
        select: { id: true, name: true, inventoryIngredientId: true, inventoryQuantity: true },
      });

      for (const mod of mods) {
        if (!mod.inventoryIngredientId || !mod.inventoryQuantity) continue;
        const cantidad = mod.inventoryQuantity * item.quantity;
        await descontarDeAlmacen(tx, {
          almacenId: almacen.id,
          ingredientId: mod.inventoryIngredientId,
          cantidad,
          reason: `Venta: ${item.quantity}x +"${mod.name}"`,
          notas: `Salida de ${almacen.nombre}`,
        });
      }
    }
  }
}

/** El almacén que corresponde a una ubicación. */
async function resolverAlmacen(
  tx: Prisma.TransactionClient,
  ubicacionId: string | null
) {
  if (ubicacionId) {
    const propio = await tx.almacen.findFirst({
      where: { ubicacionId, activo: true },
      select: { id: true, clave: true, nombre: true },
    });
    if (propio) return propio;
  }

  // Sin ubicación o sin almacén propio: cocina, que es el que tiene todo.
  const cocina = await tx.almacen.findFirst({
    where: { clave: "cocina" },
    select: { id: true, clave: true, nombre: true },
  });
  if (cocina) return cocina;

  // Último recurso: cualquier almacén activo.
  const cualquiera = await tx.almacen.findFirst({
    where: { activo: true },
    select: { id: true, clave: true, nombre: true },
  });
  if (!cualquiera) throw new Error("No hay ningún almacén configurado");

  return cualquiera;
}

/**
 * Saca la cantidad del almacén y deja el total del insumo cuadrado con la
 * suma de sus almacenes.
 *
 * Si el almacén no tiene la fila del insumo se crea en cero y queda en
 * negativo: es la verdad —se vendió algo que no estaba registrado como
 * existente— y es justo lo que hay que ver para corregirlo.
 */
async function descontarDeAlmacen(
  tx: Prisma.TransactionClient,
  params: {
    almacenId: string;
    ingredientId: string;
    cantidad: number;
    reason: string;
    notas?: string;
  }
) {
  const { almacenId, ingredientId, cantidad, reason, notas } = params;

  await tx.stockAlmacen.upsert({
    where: { almacenId_ingredientId: { almacenId, ingredientId } },
    create: { almacenId, ingredientId, cantidad: -cantidad },
    update: { cantidad: { decrement: cantidad } },
  });

  // El total del insumo = suma de sus almacenes.
  const partes = await tx.stockAlmacen.aggregate({
    where: { ingredientId },
    _sum: { cantidad: true },
  });
  const total = partes._sum.cantidad ?? 0;
  await tx.ingredient.update({
    where: { id: ingredientId },
    data: { currentStock: total },
  });

  await tx.stockMovement.create({
    data: { ingredientId, delta: -cantidad, reason, notes: notas ?? null },
  });
}
