import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/restaurant/webhook
 *
 * Receives MercadoPago payment notifications for restaurant orders.
 * On approved payment:
 *   - Updates Payment.status → "COMPLETED"
 *   - Updates Order.status → "IN_KITCHEN"
 *   - Creates an OrderStatusEvent
 *
 * Always responds 200 so MP doesn't retry indefinitely.
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
      // Not a payment notification – ack and ignore
      return NextResponse.json({ received: true });
    }

    if (!process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json({ received: true });
    }

    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
    });
    const paymentApi = new Payment(client);
    const mpPayment = await paymentApi.get({ id: resourceId as string });

    if (mpPayment.status !== "approved") {
      return NextResponse.json({ received: true });
    }

    const orderId = mpPayment.external_reference;
    if (!orderId) {
      return NextResponse.json({ received: true });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payments: true,
        orderItems: {
          include: { menuItem: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ received: true });
    }

    await prisma.$transaction(async (tx) => {
      // Only transition if order hasn't been moved past PLACED yet
      const shouldTransition = order.status === "AWAITING_PAYMENT" || order.status === "PLACED" || order.status === "DRAFT";

      if (shouldTransition) {
        // Descontar inventario al confirmar pago (si la orden venía de DRAFT/QR)
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
          data: {
            orderId: order.id,
            fromStatus: order.status,
            toStatus: "IN_KITCHEN",
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: { status: "IN_KITCHEN" },
        });
      }

      // Update or create Payment record
      const payment =
        order.payments[0]
          ? await tx.payment.update({
              where: { id: order.payments[0].id },
              data: {
                status: "COMPLETED",
                mpPaymentId: String(mpPayment.id),
                paidAt: new Date(),
              },
            })
          : await tx.payment.create({
              data: {
                orderId: order.id,
                amount: order.total,
                method: "MP",
                status: "COMPLETED",
                mpPaymentId: String(mpPayment.id),
                paidAt: new Date(),
              },
            });

      // Record payment in customer ledger
      if (order.serviceSessionId) {
        const svcSession = await tx.serviceSession.findUnique({
          where: { id: order.serviceSessionId },
          select: { customerId: true },
        });
        if (svcSession?.customerId) {
          await tx.customerLedgerEntry.create({
            data: {
              customerId: svcSession.customerId,
              amount: -order.total,
              type: "PAYMENT",
              serviceSessionId: order.serviceSessionId,
              note: `Pago MP #${String(mpPayment.id).slice(-8)}`,
            },
          });
        }
      }
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[POST /api/restaurant/webhook]", err);
    // Always 200 to prevent MP retry storms
    return NextResponse.json({ received: true });
  }
}
