// This file will be used when Stripe keys are configured
// For now, we create bookings as "pending" and show a placeholder
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { bookingId } = body;

  if (!bookingId) {
    return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
  }

  // If Stripe is not configured, return manual payment info
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({
      mode: "manual",
      message: "Stripe no está configurado. Usa la opción de pago manual.",
      bookingId,
    });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  // Get booking from database
  const { prisma } = await import("@/lib/prisma");
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { item: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "mxn",
          product_data: {
            name: booking.item.name,
            description: `${booking.customerName} - ${new Date(booking.startDate).toLocaleDateString("es-MX")} al ${new Date(booking.endDate).toLocaleDateString("es-MX")}`,
          },
          unit_amount: booking.totalPrice,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/reservar/${booking.id}?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/item/${booking.item.slug}`,
    metadata: { bookingId: booking.id },
  });

  // Update booking with Stripe session ID
  await prisma.booking.update({
    where: { id: booking.id },
    data: { stripeSessionId: session.id, status: "pending" },
  });

  return NextResponse.json({ url: session.url });
}
