import { prisma } from "@/lib/prisma";

/**
 * Shared order creation from cart data.
 * Used by both the checkout API (account payments) and the webhook (MP payments).
 */

interface CartOrderInput {
  tableId: string;
  items: Array<{
    menuItemId: string;
    variantId?: string | null;
    quantity: number;
    specialInstructions?: string | null;
    modifierIds?: string[];
  }>;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  notes?: string | null;
  source?: string;
  customerId?: string | null;
  paymentMethod?: string;
}

export async function createOrderFromCart(input: CartOrderInput) {
  const {
    tableId,
    items,
    customerName,
    customerEmail,
    customerPhone,
    notes,
    source = "QR",
    customerId,
    paymentMethod,
  } = input;

  // Fetch all menu items, variants, modifiers
  const menuItemIds = [...new Set(items.map((i) => i.menuItemId))];
  const variantIds = [...new Set(items.map((i) => i.variantId).filter(Boolean))] as string[];
  const modifierIds = [...new Set(items.flatMap((i) => i.modifierIds || []))];

  const menuItems = await prisma.menuItem.findMany({ where: { id: { in: menuItemIds } } });
  const variants = variantIds.length ? await prisma.menuItemVariant.findMany({ where: { id: { in: variantIds } } }) : [];
  const modifiers = modifierIds.length ? await prisma.modifier.findMany({ where: { id: { in: modifierIds } } }) : [];

  const menuItemMap = new Map(menuItems.map((m) => [m.id, m]));
  const variantMap = new Map(variants.map((v) => [v.id, v]));
  const modifierMap = new Map(modifiers.map((m) => [m.id, m]));

  // Calculate totals
  let subtotal = 0;
  const itemsWithPrices = items.map((item) => {
    const menuItem = menuItemMap.get(item.menuItemId)!;
    const variant = item.variantId ? variantMap.get(item.variantId) : null;
    const unitPrice = menuItem.basePrice + (variant?.priceDelta ?? 0);
    const itemModifiers = (item.modifierIds || [])
      .map((mid) => modifierMap.get(mid)!)
      .filter(Boolean);
    const modifiersTotal = itemModifiers.reduce((sum, m) => sum + m.priceDelta, 0);
    const lineTotal = (unitPrice + modifiersTotal) * item.quantity;
    subtotal += lineTotal;
    return { ...item, unitPrice, itemModifiers };
  });

  const tax = Math.round(subtotal - subtotal / 1.16);
  const total = subtotal;

  const tableInfo = await prisma.table.findUnique({ where: { id: tableId } });
  const deliveryNote = tableInfo
    ? `📍 ${tableInfo.name || ("Mesa " + tableInfo.number)}${tableInfo.location ? " · " + tableInfo.location : ""}`
    : null;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        tableId,
        source,
        customerName: customerName || null,
        customerEmail: customerEmail || null,
        customerPhone: customerPhone || null,
        notes: deliveryNote ? (notes ? `${notes} | ${deliveryNote}` : deliveryNote) : (notes || null),
        status: "IN_KITCHEN",
        subtotal,
        tax,
        total,
      },
    });

    for (const item of itemsWithPrices) {
      const orderItem = await tx.orderItem.create({
        data: {
          orderId: created.id,
          menuItemId: item.menuItemId,
          variantId: item.variantId ?? null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          specialInstructions: item.specialInstructions ?? null,
        },
      });

      if (item.itemModifiers.length > 0) {
        await tx.orderItemModifier.createMany({
          data: item.itemModifiers.map((m: any) => ({
            orderItemId: orderItem.id,
            modifierId: m.id,
            modifierName: m.name,
            priceDelta: m.priceDelta,
          })),
        });
      }
    }

    await tx.orderStatusEvent.create({
      data: { orderId: created.id, fromStatus: "DRAFT", toStatus: "IN_KITCHEN" },
    });

    // Payment record
    await tx.payment.create({
      data: {
        orderId: created.id,
        amount: total,
        method: paymentMethod || "MP",
        status: paymentMethod === "ON_ACCOUNT" ? "COMPLETED" : "PENDING",
        paidAt: paymentMethod === "ON_ACCOUNT" ? new Date() : null,
        ...(customerId ? { customerId } : {}),
      },
    });

    // Customer ledger for account payments
    if (paymentMethod === "ON_ACCOUNT" && customerId) {
      await tx.customerLedgerEntry.create({
        data: {
          customerId,
          amount: total,
          type: "CHARGE",
          note: `Orden QR #${created.id.slice(-6)}`,
        },
      });
    }

    // Deduct inventory
    for (const item of itemsWithPrices) {
      const recipe = await tx.recipe.findUnique({
        where: { menuItemId: item.menuItemId },
        include: { recipeItems: { include: { ingredient: true } } },
      });
      if (recipe && recipe.recipeItems.length > 0) {
        for (const ri of recipe.recipeItems) {
          await tx.ingredient.update({
            where: { id: ri.ingredientId },
            data: { currentStock: { decrement: ri.quantity * item.quantity } },
          });
          await tx.stockMovement.create({
            data: {
              ingredientId: ri.ingredientId,
              delta: -(ri.quantity * item.quantity),
              reason: `Venta QR: ${item.quantity}x ${menuItemMap.get(item.menuItemId)?.name || "?"}`,
            },
          });
        }
      }

      // Deduct modifier inventory (direct fields, no recipe needed)
      if (item.modifierIds && item.modifierIds.length > 0) {
        const mods = await tx.modifier.findMany({
          where: { id: { in: item.modifierIds }, deductsInventory: true },
          select: { id: true, name: true, inventoryIngredientId: true, inventoryQuantity: true },
        });
        for (const mod of mods) {
          if (!mod.inventoryIngredientId || !mod.inventoryQuantity) continue;
          const decrement = mod.inventoryQuantity * item.quantity;
          await tx.ingredient.update({
            where: { id: mod.inventoryIngredientId },
            data: { currentStock: { decrement } },
          });
          await tx.stockMovement.create({
            data: {
              ingredientId: mod.inventoryIngredientId,
              delta: -decrement,
              reason: `Venta QR: ${item.quantity}x +"${mod.name}"`,
            },
          });
        }
      }
    }

    return tx.order.findUnique({
      where: { id: created.id },
      include: {
        orderItems: { include: { menuItem: true, variant: true, modifiers: true } },
        table: true,
      },
    });
  });

  return order;
}
