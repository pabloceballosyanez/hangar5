import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { prisma } from "@/lib/prisma";
import { sendConfirmationEmail } from "@/lib/email";

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
        const updated = await prisma.booking.update({
          where: { id: bookingId },
          data: { status: "paid" },
          include: { item: true },
        });
        // Send payment confirmation email
        sendConfirmationEmail({
          id: updated.id,
          customerName: updated.customerName,
          customerEmail: updated.customerEmail,
          customerPhone: updated.customerPhone,
          itemName: updated.item.name,
          itemType: updated.item.type,
          startDate: updated.startDate,
          endDate: updated.endDate,
          guests: updated.guests,
          totalPrice: updated.totalPrice,
          status: "paid",
          paymentMethod: "card",
          notes: updated.notes,
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
