import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { prisma } from "@/lib/prisma";
import { createOrderFromCart } from "../checkout/route";

export const dynamic = "force-dynamic";

/**
 * POST /api/restaurant/webhook
 *
 * Receives MercadoPago payment notifications.
 *
 * Two flows:
 * 1. QR orders (new): cart is in MP metadata → create Order → IN_KITCHEN
 * 2. Existing orders (old/waiter): transition existing Order → IN_KITCHEN
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      topic?: string;
      type?: string;
      resource?: string;
      data?: { id?: string };
    };

    const topic = body.topic ?? body.type;
    const resourceId = body.resource ?? body.data?.id;

    if (!resourceId || topic !== "payment") {
      return NextResponse.json({ received: true });
    }

    if (!process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json({ received: true });
    }

    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
    });
    const paymentApi = new Payment(client);

    // MP sometimes returns the payment ID as a string. Get the full payment.
    const mpPayment = await paymentApi.get({ id: resourceId as string });

    if (mpPayment.status !== "approved") {
      return NextResponse.json({ received: true });
    }

    const externalRef = mpPayment.external_reference;
    if (!externalRef) {
      return NextResponse.json({ received: true });
    }

    // ── NEW FLOW: QR order with cart in metadata ──────────────────────────
    const metadata = mpPayment.metadata as Record<string, unknown> | undefined;
    const cartDataRaw = metadata?.cart_data as string | undefined;
    // Also check for the old key name
    const cartDataStr = cartDataRaw || (metadata?.cartData as string | undefined);

    if (cartDataStr) {
      try {
        const cartData = JSON.parse(cartDataStr);

        if (cartData.type === "qr_order" && cartData.tableId && cartData.items) {
          // Check if order already created (webhook retry)
          const existingOrder = await prisma.order.findFirst({
            where: {
              tableId: cartData.tableId,
              status: "IN_KITCHEN",
              createdAt: { gte: new Date(Date.now() - 600000) }, // last 10 min
            },
            orderBy: { createdAt: "desc" },
          });

          if (existingOrder) {
            // Already created — just update payment
            await prisma.payment.updateMany({
              where: { orderId: existingOrder.id, status: "PENDING" },
              data: { status: "COMPLETED", mpPaymentId: String(mpPayment.id), paidAt: new Date() },
            });
            return NextResponse.json({ received: true, orderId: existingOrder.id });
          }

          // Create the order from cart data
          const order = await createOrderFromCart({
            tableId: cartData.tableId,
            items: cartData.items,
            customerName: cartData.customerName,
            customerEmail: cartData.customerEmail,
            customerPhone: cartData.customerPhone,
            notes: cartData.notes,
            source: "QR",
            paymentMethod: "MP",
          });

          // Update payment with MP data
          await prisma.payment.updateMany({
            where: { orderId: order!.id },
            data: {
              status: "COMPLETED",
              mpPaymentId: String(mpPayment.id),
              mpPreferenceId: mpPayment.order?.id ? String(mpPayment.order.id) : null,
              paidAt: new Date(),
            },
          });

          return NextResponse.json({ received: true, orderId: order!.id });
        }
      } catch (e) {
        console.error("[webhook] Error creating order from cart metadata:", e);
        return NextResponse.json({ received: true, error: "cart parse error" });
      }
    }

    // ── OLD FLOW: existing order ──────────────────────────────────────────
    const orderId = externalRef;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true, orderItems: { include: { menuItem: true } } },
    });

    if (!order) {
      return NextResponse.json({ received: true });
    }

    await prisma.$transaction(async (tx) => {
      if (order.status === "AWAITING_PAYMENT" || order.status === "PLACED" || order.status === "DRAFT") {
        // Deduct inventory for old DRAFT orders
        if (order.status === "DRAFT" && order.orderItems.length > 0) {
          for (const item of order.orderItems) {
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
                    reason: `Venta QR: ${item.quantity}x ${item.menuItem.name}`,
                  },
                });
              }
            }
          }
        }

        await tx.orderStatusEvent.create({
          data: { orderId, fromStatus: order.status, toStatus: "IN_KITCHEN" },
        });
        await tx.order.update({ where: { id: orderId }, data: { status: "IN_KITCHEN" } });
      }

      if (order.payments[0]) {
        await tx.payment.update({
          where: { id: order.payments[0].id },
          data: { status: "COMPLETED", mpPaymentId: String(mpPayment.id), paidAt: new Date() },
        });
      } else {
        await tx.payment.create({
          data: {
            orderId,
            amount: order.total,
            method: "MP",
            status: "COMPLETED",
            mpPaymentId: String(mpPayment.id),
            paidAt: new Date(),
          },
        });
      }
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[POST /api/restaurant/webhook]", err);
    return NextResponse.json({ received: true });
  }
}
