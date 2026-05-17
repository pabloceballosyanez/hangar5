import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isActivity } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { itemId, startDate, endDate, reason, type, customerName, customerEmail, customerPhone, guests } = body;

  if (!itemId || !startDate || !endDate) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  const isAct = isActivity(item.type);

  // Allow same-day for activities
  if (!isAct && end <= start) {
    return NextResponse.json({ error: "La fecha de fin debe ser posterior a la de inicio" }, { status: 400 });
  }

  // For activities, use the same date for both
  const effectiveEnd = isAct ? new Date(start) : end;

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) {
    return NextResponse.json({ error: "Item no encontrado" }, { status: 404 });
  }

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

    const booking = await prisma.booking.create({
      data: {
        itemId,
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
    });
    return NextResponse.json(booking);
  }
}
