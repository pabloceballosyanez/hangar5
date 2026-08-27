import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isActivity } from "@/lib/types";
import { sendConfirmationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { itemId, startDate, endDate, reason, type, customerName, customerEmail, customerPhone, guests } = body;

  if (!itemId || !startDate || !endDate) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) {
    return NextResponse.json({ error: "Item no encontrado" }, { status: 404 });
  }

  const isAct = isActivity(item.type);

  // Allow same-day for activities
  if (!isAct && end <= start) {
    return NextResponse.json({ error: "La fecha de fin debe ser posterior a la de inicio" }, { status: 400 });
  }

  // For activities, use the same date for both
  const effectiveEnd = isAct ? new Date(start) : end;

  // Check for conflicts (don't block if already booked)
  const conflicts = await prisma.booking.findMany({
    where: {
      itemId,
      status: { notIn: ["cancelled"] },
      startDate: { lt: effectiveEnd },
      endDate: { gt: start },
    },
  });

  if (conflicts.length > 0) {
    return NextResponse.json({ error: "Ya hay una reserva o bloqueo en esas fechas" }, { status: 409 });
  }

  if (type === "reservation") {
    // Manual admin reservation
    const act = isActivity(item.type);
    const totalPrice = act ? item.price * (guests || 1) : item.price * Math.max(Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)), 1);

    // Vincular (o crear) el cliente por email — integración hotel ↔ restaurante
    // Solo si hay email real (no el fallback "admin@hangar5.mx").
    let customerId: string | null = null;
    const realEmail = customerEmail && customerEmail.trim() && customerEmail !== "admin@hangar5.mx"
      ? customerEmail.trim()
      : null;

    if (realEmail) {
      let customer = await prisma.customer.findUnique({ where: { email: realEmail } });
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            name: customerName || "Reserva Admin",
            email: realEmail,
            phone: customerPhone || null,
          },
        });
      }
      customerId = customer.id;
    }

    const booking = await prisma.booking.create({
      data: {
        itemId,
        customerId,
        customerName: customerName || "Reserva Admin",
        customerEmail: customerEmail || "admin@hangar5.mx",
        customerPhone: customerPhone || "",
        startDate: start,
        endDate: effectiveEnd,
        guests: guests || 1,
        totalPrice,
        notes: reason || "Reserva creada desde el panel admin",
        status: "confirmed",
      },
      include: { item: true },
    });

    // Registrar el cargo en la cuenta del cliente (saldo unificado)
    if (customerId) {
      await prisma.customerLedgerEntry.create({
        data: {
          customerId,
          amount: totalPrice,
          type: "CHARGE",
          note: `Reserva: ${item.name} (${start.toLocaleDateString("es-MX")} → ${effectiveEnd.toLocaleDateString("es-MX")})`,
        },
      });
    }

    // Send email in background
    sendConfirmationEmail({
      id: booking.id,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      itemName: item.name,
      itemType: item.type,
      startDate: booking.startDate,
      endDate: booking.endDate,
      guests: booking.guests,
      totalPrice: booking.totalPrice,
      status: "confirmed",
      paymentMethod: null,
      notes: booking.notes,
    });

    return NextResponse.json(booking);
  } else {
    // Maintenance block
    const booking = await prisma.booking.create({
      data: {
        itemId,
        customerName: "🔧 Mantenimiento",
        customerEmail: "admin@hangar5.mx",
        startDate: start,
        endDate: effectiveEnd,
        guests: 0,
        totalPrice: 0,
        notes: reason || "Bloqueado por mantenimiento",
        status: "maintenance",
      },
      include: { item: true },
    });
    return NextResponse.json(booking);
  }
}
