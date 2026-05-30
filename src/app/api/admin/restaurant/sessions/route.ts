import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Urgency = 'empty' | 'active' | 'partial_ready' | 'all_ready' | 'served';

function computeUrgency(orders: Array<{ status: string; orderItems?: Array<{ status: string }> }>): Urgency {
  const active = orders.filter(o => !['PAID', 'CANCELLED'].includes(o.status));
  if (active.length === 0) return 'empty';
  
  let hasReady = false;
  let hasPending = false;
  
  for (const order of active) {
    const items = order.orderItems || [];
    if (items.length === 0) {
      // No item-level data → fall back to order status
      if (order.status === 'READY') hasReady = true;
      else hasPending = true;
    } else {
      for (const item of items) {
        if (item.status === 'READY') hasReady = true;
        else if (item.status === 'SERVED' || item.status === 'CANCELLED') continue;
        else hasPending = true;
      }
    }
  }

  if (hasReady && hasPending) return 'partial_ready';
  if (hasReady && !hasPending) return 'all_ready';
  if (!hasReady && !hasPending) return 'served';
  return 'active';
}

function itemSummary(orders: Array<{ orderItems?: Array<{ status: string; prepStation?: string }> }>) {
  let ready = 0;
  let pending = 0;
  for (const order of orders) {
    for (const item of (order.orderItems || [])) {
      if (item.status === 'READY') ready++;
      else if (item.status !== 'SERVED' && item.status !== 'CANCELLED') pending++;
    }
  }
  return { ready, pending };
}

function serializeSession(s: Record<string, unknown>) {
  const result = { ...s };
  if (s.orders && Array.isArray(s.orders)) {
    const orders = s.orders as Record<string, unknown>[];
    result.orders = orders.map(o => ({
      ...o,
      total: typeof o.total === "number" ? o.total / 100 : o.total,
      subtotal: typeof o.subtotal === "number" ? o.subtotal / 100 : o.subtotal,
      tax: typeof o.tax === "number" ? o.tax / 100 : o.tax,
      // Keep orderItems as-is (just pass through)
      orderItems: o.orderItems || [],
    }));
    // Compute urgency and item summary server-side
    (result as any).urgency = computeUrgency(orders as any);
    (result as any).itemSummary = itemSummary(orders as any);
  }
  if (s.payments && Array.isArray(s.payments)) {
    result.payments = (s.payments as Record<string, unknown>[]).map(p => ({
      ...p,
      amount: typeof p.amount === "number" ? p.amount / 100 : p.amount,
    }));
  }
  return result;
}

// ─── GET: list sessions ──────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "OPEN";
    const type = searchParams.get("type");

    const where: Record<string, unknown> = {};
    if (status !== "ALL") where.status = status;
    if (type) where.type = type;

    const sessions = await prisma.serviceSession.findMany({
      where,
      orderBy: { openedAt: "desc" },
      include: {
        table: { select: { number: true, name: true, location: true } },
        customer: { select: { id: true, name: true, phone: true } },
        orders: {
          select: {
            id: true, status: true, total: true, subtotal: true, tax: true,
            orderItems: { select: { id: true, status: true } },
          },
        },
        payments: {
          where: { status: "COMPLETED" },
          select: { id: true, amount: true, method: true, status: true },
        },
      },
      take: 50,
    });

    return NextResponse.json(sessions.map(s => serializeSession(s as unknown as Record<string, unknown>)));
  } catch (err) {
    console.error("[GET /api/admin/restaurant/sessions]", err);
    return NextResponse.json({ error: "Error al obtener sesiones" }, { status: 500 });
  }
}

// ─── POST: create session (tab/walkin) ───────────────────────────────────────
const createSessionSchema = z.object({
  type: z.enum(["TABLE", "TAB", "WALKIN"]),
  label: z.string().min(1, "La etiqueta es requerida"),
  tableId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { type, label, tableId, customerId } = parsed.data;

    // If tableId provided, check it exists and open a table session
    if (type === "TABLE" && tableId) {
      const existing = await prisma.serviceSession.findFirst({
        where: { tableId, status: "OPEN" },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Esta mesa ya tiene una sesión abierta", sessionId: existing.id },
          { status: 409 }
        );
      }
    }

    const session = await prisma.serviceSession.create({
      data: {
        type,
        label: label.trim(),
        tableId: tableId || null,
        customerId: customerId || null,
      },
      include: {
        table: { select: { number: true, name: true } },
        customer: { select: { id: true, name: true, phone: true } },
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/restaurant/sessions]", err);
    return NextResponse.json({ error: "Error al crear sesión" }, { status: 500 });
  }
}
