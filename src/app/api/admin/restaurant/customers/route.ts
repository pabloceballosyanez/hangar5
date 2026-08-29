import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── GET: list all customers ─────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const includeInactive = searchParams.get("includeInactive") === "true";

    const where: Record<string, unknown> = {};
    if (!includeInactive) where.isActive = true;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        hasCredit: true,
        creditLimit: true,
        isActive: true,
        _count: { select: { sessions: true } },
      },
    });

    const customerIds = customers.map(c => c.id);

    // Batch aggregate balances in a single query to avoid N+1
    const balances = await prisma.customerLedgerEntry.groupBy({
      by: ["customerId"],
      _sum: { amount: true },
      where: { customerId: { in: customerIds } },
    });
    const balanceMap = new Map(balances.map(b => [b.customerId, b._sum.amount || 0]));

    // Consumiendo ahora: sesión de restaurante abierta
    const openSessions = await prisma.serviceSession.findMany({
      where: { status: "OPEN", customerId: { in: customerIds } },
      select: { customerId: true },
    });
    const openSet = new Set(openSessions.map(s => s.customerId));

    // Consumiendo ahora: estadía en curso (reserva activa hoy)
    const now = new Date();
    const activeBookings = await prisma.booking.findMany({
      where: {
        customerId: { in: customerIds },
        status: { notIn: ["cancelled", "maintenance"] },
        startDate: { lte: now },
        endDate: { gte: now },
      },
      select: { customerId: true },
    });
    const activeBookingSet = new Set(activeBookings.map(b => b.customerId));

    // Última actividad: max(sesión openedAt, reserva createdAt, movimiento ledger createdAt)
    const [lastSessions, lastBookings, lastLedger] = await Promise.all([
      prisma.serviceSession.groupBy({
        by: ["customerId"],
        _max: { openedAt: true },
        where: { customerId: { in: customerIds } },
      }),
      prisma.booking.groupBy({
        by: ["customerId"],
        _max: { createdAt: true },
        where: { customerId: { in: customerIds } },
      }),
      prisma.customerLedgerEntry.groupBy({
        by: ["customerId"],
        _max: { createdAt: true },
        where: { customerId: { in: customerIds } },
      }),
    ]);

    const lastActivityMap = new Map<string, number>();
    const bump = (cid: string, d: Date | null | undefined) => {
      if (!d) return;
      const t = new Date(d).getTime();
      const cur = lastActivityMap.get(cid) || 0;
      if (t > cur) lastActivityMap.set(cid, t);
    };
    for (const g of lastSessions) bump(g.customerId, g._max.openedAt);
    for (const g of lastBookings) bump(g.customerId, g._max.createdAt);
    for (const g of lastLedger) bump(g.customerId, g._max.createdAt);

    const result = customers.map(c => {
      const isActiveNow = openSet.has(c.id) || activeBookingSet.has(c.id);
      return {
        ...c,
        balance: (balanceMap.get(c.id) || 0) / 100,
        isActiveNow,
        lastActivity: lastActivityMap.get(c.id) || 0,
      };
    });

    // Ordenar: quienes están consumiendo ahora primero, luego por actividad más reciente
    result.sort((a, b) => {
      if (a.isActiveNow !== b.isActiveNow) return a.isActiveNow ? -1 : 1;
      return b.lastActivity - a.lastActivity;
    });

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
  hasCredit: z.boolean().optional(),
  creditLimit: z.number().min(0).nullable().optional(), // en pesos; null = sin límite
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createCustomerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { name, phone, email, notes, hasCredit, creditLimit } = parsed.data;

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
        hasCredit: hasCredit ?? true,
        creditLimit: creditLimit != null ? Math.round(creditLimit * 100) : null,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/restaurant/customers]", err);
    return NextResponse.json({ error: "Error al crear cliente" }, { status: 500 });
  }
}
