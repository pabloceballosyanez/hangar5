import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const topic = body.topic || body.type;
  const resourceId = body.resource || body.data?.id;

  if (!resourceId) {
    return NextResponse.json({ error: "No resource" }, { status: 400 });
  }

  // Mercado Pago envía topic: "merchant_order" o "payment"
  if (topic === "payment" && process.env.MP_ACCESS_TOKEN) {
    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
    const paymentApi = new Payment(client);
    const payment = await paymentApi.get({ id: resourceId as string });

    if (payment.status === "approved") {
      const bookingId = payment.metadata?.booking_id || payment.external_reference;
      if (bookingId) {
        await prisma.booking.update({
          where: { id: bookingId },
          data: { status: "paid" },
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
