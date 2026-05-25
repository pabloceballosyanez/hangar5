import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function serialize(c: Record<string, unknown>) {
  const r = { ...c };
  if (r.ledgerEntries && Array.isArray(r.ledgerEntries)) {
    r.ledgerEntries = (r.ledgerEntries as Record<string, unknown>[]).map(e => ({
      ...e, amount: (e.amount as number) / 100,
    }));
  }
  return r;
}

// ─── GET: list customers with balances ───────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const where: Record<string, unknown> = { isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }
    const customers = await prisma.customer.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        ledgerEntries: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: { select: { sessions: true } },
      },
    });

    // Calculate balance from ledger
    const result = await Promise.all(
      customers.map(async (c) => {
        const balanceResult = await prisma.customerLedgerEntry.aggregate({
          _sum: { amount: true },
          where: { customerId: c.id },
        });
        const balance = (balanceResult._sum.amount || 0) / 100;
        return { ...c, balance, _count: c._count };
      })
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/admin/restaurant/customers]", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

// ─── POST: create customer ───────────────────────────────────────────────────
const createCustomerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  notes: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createCustomerSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const customer = await prisma.customer.create({
      data: {
        name: parsed.data.name.trim(),
        phone: parsed.data.phone?.trim() || null,
        email: parsed.data.email?.trim() || null,
        notes: parsed.data.notes?.trim() || null,
      },
    });
    return NextResponse.json(customer, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/restaurant/customers]", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
