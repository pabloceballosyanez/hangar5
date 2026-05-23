import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ customerId: string }> };

// ─── GET: customer detail with ledger entries ────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { customerId } = await params;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        ledgerEntries: { orderBy: { createdAt: "desc" }, take: 50 },
        sessions: {
          orderBy: { openedAt: "desc" },
          take: 20,
          include: {
            orders: { select: { total: true, status: true } },
            payments: { select: { amount: true, method: true, status: true } },
          },
        },
      },
    });

    if (!customer) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

    // Calculate balance
    const balanceAgg = await prisma.customerLedgerEntry.aggregate({
      _sum: { amount: true },
      where: { customerId },
    });

    const serialized = {
      ...customer,
      balance: (balanceAgg._sum.amount || 0) / 100,
      ledgerEntries: customer.ledgerEntries.map(e => ({ ...e, amount: e.amount / 100 })),
      sessions: customer.sessions.map(s => ({
        ...s,
        orders: s.orders.map(o => ({ ...o, total: o.total / 100 })),
        payments: s.payments.map(p => ({ ...p, amount: p.amount / 100 })),
      })),
    };

    return NextResponse.json(serialized);
  } catch (err) {
    console.error("[GET /api/admin/restaurant/customers/[customerId]]", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

// ─── PUT: update customer ────────────────────────────────────────────────────
const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { customerId } = await params;
    const body = await req.json();
    const parsed = updateCustomerSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const existing = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!existing) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

    const data: Record<string, unknown> = { ...parsed.data };
    if (data.email !== undefined) data.email = data.email || null;
    if (data.phone !== undefined) data.phone = data.phone || null;

    const updated = await prisma.customer.update({ where: { id: customerId }, data });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PUT /api/admin/restaurant/customers/[customerId]]", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
