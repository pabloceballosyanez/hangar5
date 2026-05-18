import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { prisma } from "@/lib/prisma";
import { sendConfirmationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  let bookingId: string | null = null;
  let paymentMethod: string | null = null;

  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = await req.json();
    bookingId = body.bookingId;
    paymentMethod = body.paymentMethod || null;
  } else {
    const form = await req.formData();
    bookingId = form.get("bookingId") as string;
    paymentMethod = form.get("paymentMethod") as string || null;
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

  // Use the payment method from booking if not passed in
  const method = paymentMethod || booking.paymentMethod || "card";

  // Helper: send confirmation email in background
  const sendEmail = (status: string, method: string) => {
    sendConfirmationEmail({
      id: booking.id,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      itemName: booking.item.name,
      itemType: booking.item.type,
      startDate: booking.startDate,
      endDate: booking.endDate,
      guests: booking.guests,
      totalPrice: booking.totalPrice,
      status,
      paymentMethod: method,
      notes: booking.notes,
    });
  };

  // Transferencia bancaria
  if (method === "transfer") {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "confirmed", paymentMethod: "transfer" },
    });
    sendEmail("confirmed", "transfer");
    return NextResponse.json({
      mode: "transfer",
      confirmed: true,
      redirectUrl: `/reservar/${booking.id}?confirmed=true&payment=transfer`,
    });
  }

  // Efectivo al llegar
  if (method === "cash") {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "confirmed", paymentMethod: "cash" },
    });
    sendEmail("confirmed", "cash");
    return NextResponse.json({
      mode: "cash",
      confirmed: true,
      redirectUrl: `/reservar/${booking.id}?confirmed=true&payment=cash`,
    });
  }

  // Tarjeta vía Mercado Pago
  if (!process.env.MP_ACCESS_TOKEN) {
    // Sin token: modo prueba — se confirma igual
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "confirmed", paymentMethod: "card" },
    });
    sendEmail("confirmed", "card");
    return NextResponse.json({
      mode: "test",
      confirmed: true,
      redirectUrl: `/reservar/${booking.id}?confirmed=true&payment=card`,
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
    data: { stripeSessionId: result.id!, paymentMethod: "card" },
  });

  return NextResponse.json({ url: result.init_point! });
}
