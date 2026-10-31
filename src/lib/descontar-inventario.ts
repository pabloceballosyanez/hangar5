import type { Prisma } from "@prisma/client";

/**
 * Descuenta el inventario de una orden ya guardada.
 *
 * Vive aparte porque hay dos momentos en que se descuenta:
 *   · al crear la orden (pago a cuenta, efectivo, mesero)
 *   · al confirmarse el pago con tarjeta, en el webhook
 *
 * Antes esa lógica estaba copiada en los dos sitios y podía
 * desincronizarse. Teniéndola en una función, se descuenta igual
 * siempre y desde un solo lugar.
 */
export async function descontarInventarioDeOrden(
  tx: Prisma.TransactionClient,
  orderId: string
) {
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
        await tx.ingredient.update({
          where: { id: ri.ingredientId },
          data: { currentStock: { decrement: cantidad } },
        });
        await tx.stockMovement.create({
          data: {
            ingredientId: ri.ingredientId,
            delta: -cantidad,
            reason: `Venta: ${item.quantity}x ${item.menuItem.name}`,
          },
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
        await tx.ingredient.update({
          where: { id: mod.inventoryIngredientId },
          data: { currentStock: { decrement: cantidad } },
        });
        await tx.stockMovement.create({
          data: {
            ingredientId: mod.inventoryIngredientId,
            delta: -cantidad,
            reason: `Venta: ${item.quantity}x +"${mod.name}"`,
          },
        });
      }
    }
  }
}
