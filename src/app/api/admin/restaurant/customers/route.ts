import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── GET: list all customers ─────────────────────────────────────────────────
export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        hasCredit: true,
        _count: { select: { sessions: true } },
      },
    });

    // Batch aggregate balances in a single query to avoid N+1
    const balances = await prisma.customerLedgerEntry.groupBy({
      by: ["customerId"],
      _sum: { amount: true },
      where: { customerId: { in: customers.map(c => c.id) } },
    });
    const balanceMap = new Map(balances.map(b => [b.customerId, b._sum.amount || 0]));

    const result = customers.map(c => ({
      ...c,
      balance: (balanceMap.get(c.id) || 0) / 100,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/admin/restaurant/customers]", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
