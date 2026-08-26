import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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

// ─── POST: create customer ───────────────────────────────────────────────────
const createCustomerSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createCustomerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { name, phone, email, notes } = parsed.data;

    // Email es único: validar antes de crear
    if (email) {
      const existing = await prisma.customer.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json(
          { error: "Ya existe un cliente con ese email" },
          { status: 409 }
        );
      }
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        phone: phone || null,
        email: email || null,
        notes: notes || null,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/restaurant/customers]", err);
    return NextResponse.json({ error: "Error al crear cliente" }, { status: 500 });
  }
}
