import { prisma } from "@/lib/prisma";
import { calcularCarrito, type CartItemInput } from "@/lib/calcular-carrito";
import { descontarInventarioDeOrden } from "@/lib/descontar-inventario";

/**
 * Crea una orden a partir del carrito y la manda a cocina.
 *
 * Se usa en los caminos donde el pago ya está resuelto: a cuenta,
 * efectivo, mesero y el webhook de MercadoPago (flujo viejo).
 *
 * Los precios salen de calcularCarrito(), la misma función que usa el
 * checkout para cobrar. Antes cada lado sumaba por su cuenta y podían
 * dar cifras distintas.
 */

interface CartOrderInput {
  tableId: string;
  items: CartItemInput[];
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

  // Valida y calcula. Lanza error con mensaje legible si un platillo
  // ya no existe o está inactivo.
  const carrito = await calcularCarrito(items);

  const tableInfo = await prisma.table.findUnique({ where: { id: tableId } });
  const deliveryNote = tableInfo
    ? `📍 ${tableInfo.name || "Mesa " + tableInfo.number}${tableInfo.location ? " · " + tableInfo.location : ""}`
    : null;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        tableId,
        source,
        customerName: customerName || null,
        customerEmail: customerEmail || null,
        customerPhone: customerPhone || null,
        notes: deliveryNote ? (notes ? `${notes} | ${deliveryNote}` : deliveryNote) : notes || null,
        status: "IN_KITCHEN",
        subtotal: carrito.subtotal,
        tax: carrito.tax,
        total: carrito.total,
      },
    });

    for (const linea of carrito.lineas) {
      const orderItem = await tx.orderItem.create({
        data: {
          orderId: created.id,
          menuItemId: linea.menuItem.id,
          variantId: linea.variant?.id ?? null,
          quantity: linea.item.quantity,
          unitPrice: linea.precioUnitario,
          specialInstructions: linea.item.specialInstructions ?? null,
        },
      });

      if (linea.modificadores.length > 0) {
        await tx.orderItemModifier.createMany({
          data: linea.modificadores.map((m) => ({
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

    await tx.payment.create({
      data: {
        orderId: created.id,
        amount: carrito.total,
        method: paymentMethod || "MP",
        status: paymentMethod === "ON_ACCOUNT" ? "COMPLETED" : "PENDING",
        paidAt: paymentMethod === "ON_ACCOUNT" ? new Date() : null,
        ...(customerId ? { customerId } : {}),
      },
    });

    // Cargo a la cuenta del cliente
    if (paymentMethod === "ON_ACCOUNT" && customerId) {
      await tx.customerLedgerEntry.create({
        data: {
          customerId,
          amount: carrito.total,
          type: "CHARGE",
          note: `Orden QR #${created.id.slice(-6)}`,
        },
      });
    }

    await descontarInventarioDeOrden(tx, created.id);

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
