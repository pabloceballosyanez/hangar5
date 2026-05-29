import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/restaurant/checkout
 *
 * Body: { orderId: string }
 *
 * Creates a MercadoPago Checkout Pro preference for a restaurant order.
 * Saves the preference ID to the Payment record.
 *
 * Response: { preferenceId, initPoint, testMode? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId } = body as { orderId?: string };

    if (!orderId) {
      return NextResponse.json({ error: "orderId requerido" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: { menuItem: true, variant: true, modifiers: true },
        },
        serviceSession: {
          include: { table: true },
        },
        payments: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    const qrToken = order.serviceSession.table?.qrToken;
    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

    if (!qrToken) {
      console.error("[MP] No qrToken for order:", orderId);
      return NextResponse.json({ error: "Mesa no encontrada para esta orden" }, { status: 400 });
    }

    // ── Test mode (no MP token configured) ──────────────────────────────────
    if (!process.env.MP_ACCESS_TOKEN) {
      // Upsert a PENDING payment record so the order has a payment entry
      if (!order.payments || order.payments.length === 0) {
        await prisma.payment.create({
          data: {
            orderId: order.id,
            amount: order.total,
            method: "MP",
            status: "PENDING",
          },
        });
      }

      return NextResponse.json({
        preferenceId: "test_pref",
        initPoint: `${baseUrl}/menu/${qrToken}/confirmation?orderId=${orderId}&status=approved`,
        testMode: true,
      });
    }

    // ── Real MercadoPago preference ──────────────────────────────────────────
    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
    });
    const preferenceApi = new Preference(client);

    // Build items list: one MP item per OrderItem
    const mpItems = order.orderItems.map((oi) => {
      // unitPrice is stored in centavos; modifiers priceDelta also in centavos
      const unitPesos = oi.unitPrice / 100;
      const modsExtra =
        oi.modifiers.reduce((sum, m) => sum + m.priceDelta, 0) / 100;
      const variantSuffix = oi.variant ? ` (${oi.variant.name})` : "";

      return {
        id: oi.menuItemId,
        title: `${oi.menuItem.name}${variantSuffix}`,
        quantity: oi.quantity,
        unit_price: unitPesos + modsExtra,
        currency_id: "MXN",
      };
    });

    console.log("[MP] Creating preference for order:", orderId, "items:", JSON.stringify(mpItems));
    const result = await preferenceApi.create({
      body: {
        items: mpItems,
        payer:
          order.customerEmail
            ? {
                name: order.customerName ?? undefined,
                email: order.customerEmail,
                phone: order.customerPhone
                  ? { number: order.customerPhone }
                  : undefined,
              }
            : undefined,
        back_urls: {
          success: `${baseUrl}/menu/${qrToken}/confirmation?orderId=${orderId}&status=approved`,
          failure: `${baseUrl}/menu/${qrToken}/confirmation?orderId=${orderId}&status=rejected`,
          pending: `${baseUrl}/menu/${qrToken}/confirmation?orderId=${orderId}&status=pending`,
        },
        auto_return: "approved",
        notification_url: `${baseUrl}/api/restaurant/webhook`,
        external_reference: orderId,
      },
    });
    console.log("[MP] Preference created:", result.id, "initPoint:", result.init_point);

    const preferenceId = result.id!;
    const initPoint = result.init_point!;

    // Upsert Payment record with preference ID
    if (order.payments[0]) {
      await prisma.payment.update({
        where: { id: order.payments[0].id },
        data: { mpPreferenceId: preferenceId },
      });
    } else {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: order.total,
          method: "MP",
          status: "PENDING",
          mpPreferenceId: preferenceId,
        },
      });
    }

    return NextResponse.json({ preferenceId, initPoint });
  } catch (err) {
    console.error("[POST /api/restaurant/checkout] MP error:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
    return NextResponse.json(
      { error: "Error al crear preferencia de pago" },
      { status: 500 }
    );
  }
}
