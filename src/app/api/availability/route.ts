import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isActivity } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!itemId || !start || !end) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  // Fetch item to determine if it's an activity (same-day booking)
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  const isAct = item ? isActivity(item.type) : false;

  // Activities are single-day: start == end is valid.
  // Rentals/accommodations require end strictly after start.
  if (isAct) {
    if (endDate < startDate) {
      return NextResponse.json({ available: false, reason: "End date must be after start date" });
    }
  } else {
    if (endDate <= startDate) {
      return NextResponse.json({ available: false, reason: "End date must be after start date" });
    }
  }

  // Check Hangar5 bookings
  let bookingConflicts;
  if (isAct) {
    // Same-day activity: check if that specific date is already booked
    bookingConflicts = await prisma.booking.findMany({
      where: {
        itemId,
        status: { notIn: ["cancelled"] },
        startDate: { gte: startDate },
        endDate: { lte: endDate },
      },
    });
  } else {
    bookingConflicts = await prisma.booking.findMany({
      where: {
        itemId,
        status: { notIn: ["cancelled"] },
        startDate: { lt: endDate },
        endDate: { gt: startDate },
      },
    });
  }

  // Check external blocks (Airbnb/Booking.com)
  const externalConflicts = await prisma.externalBlock.findMany({
    where: {
      calendar: { itemId },
      startDate: { lt: endDate },
      endDate: { gt: startDate },
    },
  });

  const totalConflicts = bookingConflicts.length + externalConflicts.length;
  return NextResponse.json({
    available: totalConflicts === 0,
    conflicts: totalConflicts,
    bookingConflicts: bookingConflicts.length,
    externalConflicts: externalConflicts.length,
  });
}
