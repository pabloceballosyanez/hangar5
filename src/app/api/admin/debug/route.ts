import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  if (cookieStore.get("hangar5_admin_session")?.value !== "true") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allBookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    include: { item: { select: { name: true, type: true } } },
  });

  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const bookingsWithFilter = await prisma.booking.findMany({
    where: { startDate: { gte: sixMonthsAgo } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const monthBookings = allBookings.filter(b => {
    const d = new Date(b.startDate);
    return b.status !== "cancelled" && b.status !== "maintenance" &&
      d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const byDate: Record<string, number> = {};
  for (const b of allBookings) {
    const d = b.startDate.toISOString().slice(0, 10);
    byDate[d] = (byDate[d] || 0) + 1;
  }

  return Response.json({
    serverTime: now.toString(),
    serverMonth: thisMonth,
    serverYear: thisYear,
    sixMonthsAgo: sixMonthsAgo.toISOString(),
    totalBookingsAllTime: allBookings.length,
    totalWithDateFilter: bookingsWithFilter.length,
    monthBookingsCount: monthBookings.length,
    monthRevenue: monthBookings.reduce((s, b) => s + b.totalPrice, 0),
    bookingsByDate: byDate,
    last20: allBookings.slice(0, 20).map(b => ({
      id: b.id.slice(-6),
      status: b.status,
      startDate: b.startDate.toISOString(),
      totalPrice: b.totalPrice,
      itemName: b.item.name,
      itemType: b.item.type,
      createdAt: b.createdAt.toISOString(),
    })),
  });
}
