import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { prisma } from "@/lib/prisma";
import { createOrderFromCart } from "@/lib/create-order";
import { descontarInventarioDeOrden } from "@/lib/descontar-inventario";

export const dynamic = "force-dynamic";

/**
 * POST /api/restaurant/webhook
 *
 * Recibe las notificaciones de pago de MercadoPago.
 *
 * ── Lo que se arregló aquí ────────────────────────────────────────────
 * Antes, para saber si el pedido ya existía, el webhook buscaba
 * "cualquier orden en cocina de la misma mesa en los últimos 10 minutos"
 * y la daba por buena. Eso rompía en el caso más normal de un
 * restaurante: dos personas en la misma mesa pidiendo con 5 minutos de
 * diferencia. El segundo cobro se marcaba como pagado pero SU pedido
 * nunca se creaba — la cocina no lo veía, y el cliente había pagado.
 *
 * Ahora el identificador es el que manda MercadoPago en
 * external_reference: el id exacto de la orden. Cada pago apunta a su
 * pedido y a ningún otro. Los reintentos del webhook (MercadoPago
 * avisa varias veces) se reconocen porque esa orden ya está pagada,
 * no porque "se parezca" a otra.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
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

    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
    const paymentApi = new Payment(client);

    const mpPayment = await paymentApi.get({ id: resourceId as string });

    if (mpPayment.status !== "approved") {
      // Rechazado o pendiente: no se toca la orden. Si estaba en
      // PENDING_PAYMENT se queda ahí, visible como pendiente.
      return NextResponse.json({ received: true });
    }

    const externalRef = mpPayment.external_reference;
    if (!externalRef) {
      return NextResponse.json({ received: true });
    }

    // ── 1. ¿El pago apunta a una orden concreta? ──────────────────────────
    const ordenExistente = await prisma.order.findUnique({
      where: { id: externalRef },
      include: {
        payments: true,
        orderItems: { include: { menuItem: true } },
      },
    });

    if (ordenExistente) {
      // Reintento del webhook: si ya está pagada, no hacemos nada.
      const yaPagada = ordenExistente.payments.some((p) => p.status === "COMPLETED");
      if (yaPagada) {
        return NextResponse.json({ received: true, orderId: ordenExistente.id, duplicado: true });
      }

      await confirmarOrden(ordenExistente.id, mpPayment);
      return NextResponse.json({ received: true, orderId: ordenExistente.id });
    }

    // ── 2. Orden vieja sin crear (flujo anterior a este cambio) ───────────
    // El carrito venía dentro de metadata. Se usa solo como respaldo.
    const metadata = mpPayment.metadata as Record<string, unknown> | undefined;
    const cartDataStr =
      (metadata?.cartData as string | undefined) ?? (metadata?.cart_data as string | undefined);

    if (cartDataStr) {
      try {
        const cartData = JSON.parse(cartDataStr);
        if (cartData.type === "qr_order" && cartData.tableId && cartData.items) {
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

          await prisma.payment.updateMany({
            where: { orderId: order!.id },
            data: {
              status: "COMPLETED",
              mpPaymentId: String(mpPayment.id),
              paidAt: new Date(),
            },
          });

          return NextResponse.json({ received: true, orderId: order!.id, flujoViejo: true });
        }
      } catch (e) {
        console.error("[webhook] Error creando orden desde metadata:", e);
        return NextResponse.json({ received: true, error: "cart parse error" });
      }
    }

    // ── 3. Órdenes del mesero (pago previo a la app), sin metadata ────────
    const ordenMesero = await prisma.order.findUnique({
      where: { id: externalRef },
      include: { payments: true, orderItems: { include: { menuItem: true } } },
    });

    if (!ordenMesero) {
      console.warn("[webhook] Pago aprobado sin orden asociada:", externalRef, mpPayment.id);
      return NextResponse.json({ received: true });
    }

    await confirmarOrden(ordenMesero.id, mpPayment);
    return NextResponse.json({ received: true, orderId: ordenMesero.id });
  } catch (err) {
    console.error("[POST /api/restaurant/webhook]", err);
    // Siempre 200: si MercadoPago recibe un error, reintenta en bucle.
    // El pago ya quedó registrado de su lado y lo podemos reconciliar.
    return NextResponse.json({ received: true });
  }
}

/**
 * Marca la orden como pagada y la manda a cocina, descontando inventario
 * una sola vez.
 */
async function confirmarOrden(
  orderId: string,
  mpPayment: { id?: string | number | null; order?: { id?: string | number | null } | null }
) {
  const orden = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payments: true, orderItems: true },
  });
  if (!orden) return;

  // El inventario se descuenta solo si la orden venía sin descontar
  // (las creadas en PENDING_PAYMENT). Las que ya estaban en cocina
  // ya lo descontaron al crearse.
  const hayQueDescontar = orden.status === "PENDING_PAYMENT";

  await prisma.$transaction(async (tx) => {
    if (hayQueDescontar) {
      await descontarInventarioDeOrden(tx, orderId);
    }

    if (orden.status === "PENDING_PAYMENT" || orden.status === "AWAITING_PAYMENT" ||
        orden.status === "PLACED" || orden.status === "DRAFT") {
      await tx.orderStatusEvent.create({
        data: { orderId, fromStatus: orden.status, toStatus: "IN_KITCHEN" },
      });
      await tx.order.update({ where: { id: orderId }, data: { status: "IN_KITCHEN" } });
    }

    const pago = orden.payments[0];
    if (pago) {
      await tx.payment.update({
        where: { id: pago.id },
        data: {
          status: "COMPLETED",
          mpPaymentId: mpPayment.id ? String(mpPayment.id) : null,
          paidAt: new Date(),
        },
      });
    } else {
      await tx.payment.create({
        data: {
          orderId,
          amount: orden.total,
          method: "MP",
          status: "COMPLETED",
          mpPaymentId: mpPayment.id ? String(mpPayment.id) : null,
          paidAt: new Date(),
        },
      });
    }
  });
}
