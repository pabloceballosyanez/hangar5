import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/auth";
import { createOrderFromCart } from "@/lib/create-order";
import { calcularCarrito, aItemsMercadoPago, type CartItemInput } from "@/lib/calcular-carrito";

export const dynamic = "force-dynamic";

/**
 * POST /api/restaurant/checkout
 *
 * Checkout por QR. Dos caminos:
 *
 *   paymentMethod = "account" → se cobra a la cuenta del cliente. La orden
 *                               se crea al momento y queda confirmada.
 *
 *   paymentMethod = "card"    → se crea la orden en estado PENDING_PAYMENT
 *                               ANTES de mandar al cliente a MercadoPago.
 *                               Así, si el pago falla o el webhook no llega,
 *                               el pedido ya existe y se puede rastrear.
 *
 * ── Lo que se arregló aquí ────────────────────────────────────────────
 * 1. Los links de regreso de MercadoPago no llevaban el número de orden:
 *    el cliente pagaba y volvía a una pantalla sin folio ni forma de
 *    seguir su pedido. Ahora los tres links lo llevan.
 *
 * 2. El cobro usaba solo el precio base, ignorando variantes y extras.
 *    Se cobraba de menos en cada pedido con modificadores. Ahora el
 *    precio sale de calcularCarrito(), la misma función que arma la
 *    orden: lo que se cobra y lo que se guarda no pueden diferir.
 *
 * 3. La orden solo nacía en el webhook. Si el webhook fallaba, el
 *    cliente había pagado y no existía pedido. Ahora nace antes.
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
      ubicacion: claveUbicacion = "restaurante",
    } = body as {
      tableId?: string;
      items?: CartItemInput[];
      customerName?: string | null;
      customerEmail?: string | null;
      customerPhone?: string | null;
      notes?: string | null;
      paymentMethod?: string;
      ubicacion?: string;
    };

    if (!tableId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "tableId y items[] requeridos" }, { status: 400 });
    }

    // A qué punto de venta va el pedido. Si la clave no existe, se
    // asume restaurante: es donde estaban todos los pedidos antes.
    const ubicacion = await prisma.ubicacion.findUnique({
      where: { clave: claveUbicacion },
      select: { id: true },
    });

    const table = await prisma.table.findUnique({ where: { id: tableId } });
    if (!table || !table.isActive) {
      return NextResponse.json({ error: "Mesa no encontrada" }, { status: 404 });
    }

    // Valida platillos, variantes, extras y calcula el total real.
    // Si algo ya no está disponible, responde con un mensaje claro
    // en lugar de reventar con un 500.
    let carrito;
    try {
      carrito = await calcularCarrito(items);
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : "No pudimos calcular tu pedido";
      return NextResponse.json({ error: mensaje }, { status: 400 });
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
        ubicacionId: ubicacion?.id ?? null,
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

    // Test mode (no MP token): no hay pasarela real, se aprueba al momento.
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
        ubicacionId: ubicacion?.id ?? null,
      });

      return NextResponse.json({
        preferenceId: "test_pref",
        initPoint: `${baseUrl}/menu/${table.qrToken}/confirmation?orderId=${order!.id}&status=approved`,
        testMode: true,
        orderId: order!.id,
      });
    }

    // ── MercadoPago real ──────────────────────────────────────────────────
    //
    // La orden se crea ANTES de mandar al cliente a pagar, en estado
    // PENDING_PAYMENT. Así tenemos un id desde el primer momento:
    //   · los links de regreso pueden llevarlo y el cliente ve su folio
    //   · si abandona el pago, el pedido queda registrado como pendiente
    //   · si el webhook falla, el pedido existe igual
    // El webhook se encarga después de pasarlo a IN_KITCHEN.
    const ordenPendiente = await crearOrdenPendiente({
      tableId,
      items,
      customerName,
      customerEmail,
      customerPhone,
      notes,
      customerId,
      carrito,
      ubicacionId: ubicacion?.id ?? null,
    });

    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
    const preferenceApi = new Preference(client);

    const mpItems = aItemsMercadoPago(carrito);

    const result = await preferenceApi.create({
      body: {
        items: mpItems,
        payer: customerEmail ? { name: customerName || "", email: customerEmail } : undefined,
        back_urls: {
          success: `${baseUrl}/menu/${table.qrToken}/confirmation?orderId=${ordenPendiente.id}&status=approved`,
          failure: `${baseUrl}/menu/${table.qrToken}/confirmation?orderId=${ordenPendiente.id}&status=rejected`,
          pending: `${baseUrl}/menu/${table.qrToken}/confirmation?orderId=${ordenPendiente.id}&status=pending`,
        },
        auto_return: "approved",
        notification_url: `${baseUrl}/api/restaurant/webhook`,
        // El id de la orden viaja en external_reference. El webhook lo usa
        // para encontrar SU pedido — antes adivinaba por mesa y hora, y con
        // dos clientes en la misma mesa en 10 minutos perdía el segundo.
        external_reference: ordenPendiente.id,
        metadata: { orderId: ordenPendiente.id, cartData: cartMetadata.substring(0, 5000) },
      },
    });

    // Guardamos la referencia de la preferencia en el pago para poder
    // reconciliar después si el webhook no llega.
    await prisma.payment.updateMany({
      where: { orderId: ordenPendiente.id, status: "PENDING" },
      data: { mpPreferenceId: result.id ?? null },
    });

    return NextResponse.json({
      preferenceId: result.id!,
      initPoint: result.init_point!,
      orderId: ordenPendiente.id,
    });
  } catch (err) {
    console.error("[POST /api/restaurant/checkout]", err);
    return NextResponse.json({ error: "Error al crear preferencia de pago" }, { status: 500 });
  }
}

/**
 * Crea la orden con sus líneas y su pago pendiente, sin descontar
 * inventario todavía: el inventario se descuenta cuando el pago se
 * confirma, en el webhook.
 */
async function crearOrdenPendiente(args: {
  tableId: string;
  items: CartItemInput[];
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  notes?: string | null;
  customerId: string | null;
  carrito: Awaited<ReturnType<typeof calcularCarrito>>;
  ubicacionId: string | null;
}) {
  const { tableId, customerName, customerEmail, customerPhone, notes, customerId, carrito, ubicacionId } = args;

  const tableInfo = await prisma.table.findUnique({ where: { id: tableId } });
  const deliveryNote = tableInfo
    ? `📍 ${tableInfo.name || "Mesa " + tableInfo.number}${tableInfo.location ? " · " + tableInfo.location : ""}`
    : null;

  return prisma.$transaction(async (tx) => {
    const orden = await tx.order.create({
      data: {
        tableId,
        source: "QR",
        customerName: customerName || null,
        customerEmail: customerEmail || null,
        customerPhone: customerPhone || null,
        notes: deliveryNote ? (notes ? `${notes} | ${deliveryNote}` : deliveryNote) : notes || null,
        status: "PENDING_PAYMENT",
        ubicacionId,
        subtotal: carrito.subtotal,
        tax: carrito.tax,
        total: carrito.total,
      },
    });

    for (const linea of carrito.lineas) {
      const orderItem = await tx.orderItem.create({
        data: {
          orderId: orden.id,
          menuItemId: linea.menuItem.id,
          variantId: linea.variant?.id ?? null,
          quantity: linea.item.quantity,
          unitPrice: linea.precioUnitario,
          specialInstructions: linea.item.specialInstructions ?? null,
        },
      });

      if (linea.modificadores.length) {
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

    await tx.payment.create({
      data: {
        orderId: orden.id,
        amount: carrito.total,
        method: "MP",
        status: "PENDING",
        ...(customerId ? { customerId } : {}),
      },
    });

    await tx.orderStatusEvent.create({
      data: { orderId: orden.id, fromStatus: "DRAFT", toStatus: "PENDING_PAYMENT" },
    });

    return orden;
  });
}
