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

  // For activities / single-day bookings (same start and end), check if that date is taken
  if (startDate.getTime() === endDate.getTime()) {
    const conflicts = await prisma.booking.findMany({
      where: {
        itemId,
        status: { notIn: ["cancelled"] },
        startDate: { gte: startDate },
        endDate: { lte: endDate },
      },
    });
    return NextResponse.json({ available: conflicts.length === 0, conflicts: conflicts.length });
  }

  if (endDate <= startDate) {
    return NextResponse.json({ available: false, reason: "End date must be after start date" });
  }

  const conflicts = await prisma.booking.findMany({
    where: {
      itemId,
      status: { notIn: ["cancelled"] },
      startDate: { lt: endDate },
      endDate: { gt: startDate },
    },
  });

  return NextResponse.json({ available: conflicts.length === 0, conflicts: conflicts.length });
}
