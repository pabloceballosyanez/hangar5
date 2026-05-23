import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDateRange(dateStr: string): { start: Date; end: Date } {
  const start = new Date(dateStr + "T00:00:00.000-06:00");
  const end = new Date(dateStr + "T23:59:59.999-06:00");
  return { start, end };
}

function centsDisplay(cents: number): number {
  return Math.round(cents / 100);
}

// ─── GET: daily report ───────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const today = new Date().toISOString().slice(0, 10);
    const date = dateParam || today;
    const { start, end } = toDateRange(date);

    // 1. Total orders created today
    const totalOrders = await prisma.order.count({
      where: { createdAt: { gte: start, lte: end } },
    });

    // 2. Orders by source
    const ordersRaw = await prisma.order.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { source: true },
    });
    const ordersBySource: Record<string, number> = {};
    for (const o of ordersRaw) {
      ordersBySource[o.source] = (ordersBySource[o.source] || 0) + 1;
    }

    // 3. Completed payments today
    const payments = await prisma.payment.findMany({
      where: {
        status: "COMPLETED",
        paidAt: { gte: start, lte: end },
      },
      select: { amount: true, method: true },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const revenueByMethod: Record<string, number> = {};
    for (const p of payments) {
      revenueByMethod[p.method] = (revenueByMethod[p.method] || 0) + p.amount;
    }

    // 4. Average ticket
    const avgTicket =
      payments.length > 0 ? Math.round(totalRevenue / payments.length) : 0;

    // 5. Top 10 items (sum up OrderItems created today by quantity × unitPrice)
    const orderItemsToday = await prisma.orderItem.findMany({
      where: {
        order: { createdAt: { gte: start, lte: end } },
        status: { not: "CANCELLED" },
      },
      include: {
        menuItem: { select: { id: true, name: true } },
      },
    });

    // Aggregate by menuItemId
    const itemMap = new Map<string, { menuItemId: string; name: string; quantity: number; revenue: number }>();
    for (const oi of orderItemsToday) {
      const key = oi.menuItemId;
      const existing = itemMap.get(key);
      const lineRevenue = oi.quantity * oi.unitPrice;
      if (existing) {
        existing.quantity += oi.quantity;
        existing.revenue += lineRevenue;
      } else {
        itemMap.set(key, {
          menuItemId: key,
          name: oi.menuItem.name,
          quantity: oi.quantity,
          revenue: lineRevenue,
        });
      }
    }

    const topItems = [...itemMap.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map((i) => ({
        ...i,
        revenue: centsDisplay(i.revenue),
      }));

    // 6. Cancelled orders
    const cancelledOrders = await prisma.order.count({
      where: {
        status: "CANCELLED",
        createdAt: { gte: start, lte: end },
      },
    });

    // 7. Tax collected — sum of Order.tax for orders with completed payments
    const taxCollected = await prisma.order.aggregate({
      where: {
        createdAt: { gte: start, lte: end },
        payments: { some: { status: "COMPLETED" } },
      },
      _sum: { tax: true },
    });

    // 8. Labor: StaffShift hours for the date
    const shifts = await prisma.staffShift.findMany({
      where: {
        date: { gte: start, lte: end },
      },
      include: {
        staff: { select: { hourlyRate: true } },
      },
    });

    let laborCost = 0;
    let laborHours = 0;
    for (const s of shifts) {
      const hours =
        (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) /
        (1000 * 60 * 60);
      laborHours += hours;
      laborCost += hours * s.staff.hourlyRate;
    }

    return NextResponse.json({
      date,
      totalOrders,
      ordersBySource,
      totalRevenue: centsDisplay(totalRevenue),
      revenueByMethod: Object.fromEntries(
        Object.entries(revenueByMethod).map(([k, v]) => [k, centsDisplay(v)])
      ),
      avgTicket: centsDisplay(avgTicket),
      topItems,
      cancelledOrders,
      taxCollected: centsDisplay(taxCollected._sum.tax ?? 0),
      laborCost: centsDisplay(Math.round(laborCost)),
      laborHours: Math.round(laborHours * 10) / 10,
    });
  } catch (err) {
    console.error("[GET /api/admin/restaurant/reports/daily]", err);
    return NextResponse.json(
      { error: "Error al generar reporte diario" },
      { status: 500 }
    );
  }
}
