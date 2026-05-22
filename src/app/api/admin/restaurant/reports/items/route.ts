import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function centsDisplay(cents: number): number {
  return Math.round(cents / 100);
}

// ─── GET: items report ───────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    if (!fromParam || !toParam) {
      return NextResponse.json(
        { error: "Parámetros 'from' y 'to' requeridos (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const from = new Date(fromParam + "T00:00:00.000-06:00");
    const to = new Date(toParam + "T23:59:59.999-06:00");

    // Fetch all order items in the period, excluding cancelled
    const items = await prisma.orderItem.findMany({
      where: {
        order: { createdAt: { gte: from, lte: to } },
        status: { not: "CANCELLED" },
      },
      include: {
        menuItem: {
          include: {
            category: { select: { name: true } },
          },
        },
      },
    });

    // Aggregate
    const map = new Map<
      string,
      {
        menuItemId: string;
        name: string;
        category: string;
        quantitySold: number;
        revenue: number;
      }
    >();
    for (const item of items) {
      const key = item.menuItemId;
      const existing = map.get(key);
      const lineRev = item.quantity * item.unitPrice;
      if (existing) {
        existing.quantitySold += item.quantity;
        existing.revenue += lineRev;
      } else {
        map.set(key, {
          menuItemId: key,
          name: item.menuItem.name,
          category: item.menuItem.category?.name ?? "Sin categoría",
          quantitySold: item.quantity,
          revenue: lineRev,
        });
      }
    }

    const sorted = [...map.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .map((item, idx) => ({
        ...item,
        revenue: centsDisplay(item.revenue),
        avgPrice:
          item.quantitySold > 0
            ? centsDisplay(Math.round(item.revenue / item.quantitySold))
            : 0,
        rank: idx + 1,
      }));

    return NextResponse.json({
      period: { from: fromParam, to: toParam },
      items: sorted,
    });
  } catch (err) {
    console.error("[GET /api/admin/restaurant/reports/items]", err);
    return NextResponse.json(
      { error: "Error al generar reporte de items" },
      { status: 500 }
    );
  }
}
