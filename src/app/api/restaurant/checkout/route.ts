import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/auth";
import { createOrderFromCart } from "@/lib/create-order";

export const dynamic = "force-dynamic";

/**
 * POST /api/restaurant/checkout
 *
 * QR checkout: creates MercadoPago preference with cart items in metadata.
 * The actual Order is created by the webhook AFTER payment is confirmed.
 *
 * Body: {
 *   tableId: string,
 *   items: [{ menuItemId, variantId?, quantity, specialInstructions?, modifierIds[] }],
 *   customerName?, customerEmail?, customerPhone?, notes?,
 *   paymentMethod?: "card" | "account"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tableId,
      items,
      customerName,
      customerEmail,
      customerPhone,
      notes,
      paymentMethod = "card",
    } = body as {
      tableId?: string;
      items?: Array<{
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
      paymentMethod?: string;
    };

    if (!tableId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "tableId y items[] requeridos" },
        { status: 400 }
      );
    }

    const table = await prisma.table.findUnique({ where: { id: tableId } });
    if (!table || !table.isActive) {
      return NextResponse.json({ error: "Mesa no encontrada" }, { status: 404 });
    }

    // Resolve customer
    let customerId: string | null = null;
    const custSession = getCustomerSession(req);
    if (custSession) {
      customerId = custSession.customerId;
    } else if (customerEmail) {
      const existing = await prisma.customer.findUnique({ where: { email: customerEmail } });
      if (existing) customerId = existing.id;
    }

    // ── Pay on account (customer credit) ──────────────────────────────────
    if (paymentMethod === "account" && customerId) {
      const customer = await prisma.customer.findUnique({ where: { id: customerId } });
      if (!customer?.hasCredit) {
        return NextResponse.json(
          { error: "No tienes crédito habilitado para pagar a cuenta" },
          { status: 403 }
        );
      }

      const order = await createOrderFromCart({
        tableId,
        items,
        customerName: (customerName || customer.name) ?? null,
        customerEmail: (customerEmail || customer.email) ?? null,
        customerPhone: customerPhone ?? null,
        notes: notes ?? null,
        source: "QR",
        customerId,
        paymentMethod: "ON_ACCOUNT",
      });

      return NextResponse.json({
        mode: "account",
        confirmed: true,
        orderId: order!.id,
        redirectUrl: `/menu/${table.qrToken}/confirmation?orderId=${order!.id}&status=approved`,
      });
    }

    // ── MercadoPago card payment ──────────────────────────────────────────
    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

    const cartMetadata = JSON.stringify({
      type: "qr_order",
      tableId,
      qrToken: table.qrToken,
      items,
      customerName,
      customerEmail,
      customerPhone,
      notes,
      source: "QR",
    });

    // Test mode (no MP token)
    if (!process.env.MP_ACCESS_TOKEN) {
      const order = await createOrderFromCart({
        tableId,
        items,
        customerName: customerName ?? null,
        customerEmail: customerEmail ?? null,
        customerPhone: customerPhone ?? null,
        notes: notes ?? null,
        source: "QR",
        customerId,
        paymentMethod: "MP",
      });

      return NextResponse.json({
        preferenceId: "test_pref",
        initPoint: `${baseUrl}/menu/${table.qrToken}/confirmation?orderId=${order!.id}&status=approved`,
        testMode: true,
        orderId: order!.id,
      });
    }

    // Real MercadoPago
    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
    const preferenceApi = new Preference(client);

    const menuItemIds = [...new Set(items.map((i) => i.menuItemId))];
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      select: { id: true, name: true, basePrice: true },
    });
    const menuMap = new Map(menuItems.map((m) => [m.id, m]));

    const mpItems = items.map((item) => {
      const mi = menuMap.get(item.menuItemId);
      return {
        id: item.menuItemId,
        title: mi?.name || "Producto",
        quantity: item.quantity,
        unit_price: (mi?.basePrice || 0) / 100,
        currency_id: "MXN",
      };
    });

    const result = await preferenceApi.create({
      body: {
        items: mpItems,
        payer: customerEmail
          ? { name: customerName || "", email: customerEmail }
          : undefined,
        back_urls: {
          success: `${baseUrl}/menu/${table.qrToken}/confirmation?status=approved`,
          failure: `${baseUrl}/menu/${table.qrToken}/confirmation?status=rejected`,
          pending: `${baseUrl}/menu/${table.qrToken}/confirmation?status=pending`,
        },
        auto_return: "approved",
        notification_url: `${baseUrl}/api/restaurant/webhook`,
        external_reference: `qr_${tableId}_${Date.now()}`,
        metadata: { cartData: cartMetadata.substring(0, 5000) },
      },
    });

    return NextResponse.json({
      preferenceId: result.id!,
      initPoint: result.init_point!,
    });
  } catch (err) {
    console.error("[POST /api/restaurant/checkout]", err);
    return NextResponse.json(
      { error: "Error al crear preferencia de pago" },
      { status: 500 }
    );
  }
}
