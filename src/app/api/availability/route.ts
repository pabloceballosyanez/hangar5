import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

  if (endDate <= startDate) {
    return NextResponse.json({ available: false, reason: "End date must be after start date" });
  }

  // Check Hangar5 bookings
  const bookingConflicts = await prisma.booking.findMany({
    where: {
      itemId,
      status: { notIn: ["cancelled"] },
      startDate: { lt: endDate },
      endDate: { gt: startDate },
    },
  });

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
