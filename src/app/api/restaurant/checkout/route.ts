import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/auth";

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
 *   customerName?: string,
 *   customerEmail?: string,
 *   customerPhone?: string,
 *   notes?: string,
 *   paymentMethod?: "card" | "account"   // "account" = pagar a cuenta (cliente con crédito)
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
      customerName?: string;
      customerEmail?: string;
      customerPhone?: string;
      notes?: string;
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

      // Create order directly in IN_KITCHEN for account payments
      const order = await createOrderFromCart({
        tableId,
        items,
        customerName: customerName || customer.name,
        customerEmail: customerEmail || customer.email || "",
        customerPhone,
        notes,
        source: "QR",
        customerId,
        paymentMethod: "ON_ACCOUNT",
      });

      return NextResponse.json({
        mode: "account",
        confirmed: true,
        orderId: order.id,
        redirectUrl: `/menu/${table.qrToken}/confirmation?orderId=${order.id}&status=approved`,
      });
    }

    // ── MercadoPago card payment ──────────────────────────────────────────
    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

    // Store cart metadata for the webhook to create the order
    const metadata = JSON.stringify({
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

    // Test mode
    if (!process.env.MP_ACCESS_TOKEN) {
      // In test mode, create the order directly
      const order = await createOrderFromCart({
        tableId,
        items,
        customerName,
        customerEmail,
        customerPhone,
        notes,
        source: "QR",
        customerId,
        paymentMethod: "MP",
      });

      return NextResponse.json({
        preferenceId: "test_pref",
        initPoint: `${baseUrl}/menu/${table.qrToken}/confirmation?orderId=${order.id}&status=approved`,
        testMode: true,
        orderId: order.id,
      });
    }

    // Real MercadoPago
    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
    const preferenceApi = new Preference(client);

    // Fetch menu items for preference display
    const menuItemIds = [...new Set(items.map((i) => i.menuItemId))];
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      select: { id: true, name: true, basePrice: true },
    });
    const menuMap = new Map(menuItems.map((m) => [m.id, m]));

    // Build MP items
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
        metadata: { cartData: metadata.substring(0, 5000) }, // MP metadata limit
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

// ─── Shared order creation (used by webhook too) ──────────────────────────────

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

    // Create payment record
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
