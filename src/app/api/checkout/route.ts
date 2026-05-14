import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  let bookingId: string | null = null;

  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = await req.json();
    bookingId = body.bookingId;
  } else {
    const form = await req.formData();
    bookingId = form.get("bookingId") as string;
  }

  if (!bookingId) {
    return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { item: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  // Sin Mercado Pago: confirmación manual
  if (!process.env.MP_ACCESS_TOKEN) {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "confirmed" },
    });
    return NextResponse.json({
      mode: "manual",
      confirmed: true,
      redirectUrl: `/reservar/${booking.id}?confirmed=true`,
    });
  }

  // Con Mercado Pago: crear preferencia de Checkout Pro
  const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
  });
  const preference = new Preference(client);

  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

  const result = await preference.create({
    body: {
      items: [{
        id: booking.item.slug,
        title: booking.item.name,
        description: booking.item.description || undefined,
        quantity: 1,
        unit_price: booking.totalPrice / 100, // MP usa pesos, no centavos
        currency_id: "MXN",
      }],
      payer: {
        name: booking.customerName,
        email: booking.customerEmail,
        phone: booking.customerPhone ? { number: booking.customerPhone } : undefined,
      },
      back_urls: {
        success: `${baseUrl}/reservar/${booking.id}?success=true`,
        failure: `${baseUrl}/reservar/${booking.id}`,
        pending: `${baseUrl}/reservar/${booking.id}`,
      },
      auto_return: "approved",
      notification_url: `${baseUrl}/api/webhook`,
      external_reference: booking.id,
      metadata: { bookingId: booking.id },
    },
  });

  // Guardar ID de preferencia
  await prisma.booking.update({
    where: { id: booking.id },
    data: { stripeSessionId: result.id! }, // reusamos el campo como "paymentRef"
  });

  return NextResponse.json({ url: result.init_point! });
}
