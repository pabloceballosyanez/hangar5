import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isActivity } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  const where = itemId ? { itemId, status: { notIn: ["cancelled"] as string[] } } : {};
  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { startDate: "asc" },
  });
  return NextResponse.json(bookings);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { itemId, customerName, customerEmail, customerPhone, startDate, endDate, guests, notes, paymentMethod } = body;

  if (!itemId || !customerName || !customerEmail || !startDate || !endDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Get item to determine type
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const isAct = isActivity(item.type);

  // Allow same-day bookings for activities
  if (!isAct && end <= start) {
    return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
  }

  // Check availability
  let conflicts;
  if (isAct) {
    // Same-day: check if that date is taken
    conflicts = await prisma.booking.findMany({
      where: {
        itemId,
        status: { notIn: ["cancelled"] },
        startDate: { gte: start },
        endDate: { lte: end },
      },
    });
  } else {
    conflicts = await prisma.booking.findMany({
      where: {
        itemId,
        status: { notIn: ["cancelled"] },
        startDate: { lt: end },
        endDate: { gt: start },
      },
    });
  }

  if (conflicts.length > 0) {
    return NextResponse.json({ error: "Item not available for these dates" }, { status: 409 });
  }

  // Calculate price
  let totalPrice;
  if (isAct) {
    // Activities: price × participants
    totalPrice = item.price * (guests || 1);
  } else {
    // Rentals/accommodations: price × nights/days
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    totalPrice = item.price * Math.max(days, 1);
  }

  const booking = await prisma.booking.create({
    data: {
      itemId,
      customerName,
      customerEmail,
      customerPhone,
      startDate: start,
      endDate: end,
      guests: guests || 1,
      totalPrice,
      paymentMethod: paymentMethod || null,
      notes,
      status: "pending",
    },
  });

  return NextResponse.json(booking);
}
