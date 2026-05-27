import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ sessionId: string }> };

function serialize(s: Record<string, unknown>) {
  const r = { ...s };
  if (r.orders && Array.isArray(r.orders)) {
    r.orders = (r.orders as Record<string, unknown>[]).map(o => ({
      ...o, total: (o.total as number) / 100, subtotal: (o.subtotal as number) / 100, tax: (o.tax as number) / 100,
    }));
  }
  if (r.payments && Array.isArray(r.payments)) {
    r.payments = (r.payments as Record<string, unknown>[]).map(p => ({
      ...p, amount: (p.amount as number) / 100,
    }));
  }
  return r;
}

// ─── GET: session detail ─────────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { sessionId } = await params;
    const session = await prisma.serviceSession.findUnique({
      where: { id: sessionId },
      include: {
        table: true,
        customer: true,
        orders: {
          include: {
            orderItems: {
              include: {
                menuItem: { select: { name: true } },
                variant: { select: { name: true } },
                modifiers: { select: { modifierName: true, priceDelta: true } },
              },
            },
          },
        },
        payments: true,
        _count: { select: { orders: true } },
      },
    });
    if (!session) return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
    return NextResponse.json(serialize(session as unknown as Record<string, unknown>));
  } catch (err) {
    console.error("[GET /api/admin/restaurant/sessions/[sessionId]]", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

// ─── PUT: close session with payment ─────────────────────────────────────────
const closeSessionSchema = z.object({
  payments: z.array(z.object({
    method: z.enum(["CASH", "CARD", "TRANSFER"]),
    amount: z.number().min(0),
  })).optional().default([]),
});

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { sessionId } = await params;
    const body = await req.json();
    const parsed = closeSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const session = await prisma.serviceSession.findUnique({
      where: { id: sessionId },
      include: { orders: true, customer: true },
    });
    if (!session) return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
    if (session.status === "CLOSED") return NextResponse.json({ error: "Sesión ya cerrada" }, { status: 409 });

    // Calculate total from orders
    const totalOwed = session.orders.reduce((sum, o) => sum + o.total, 0);
    const totalPaid = parsed.data.payments.reduce((sum, p) => sum + Math.round(p.amount * 100), 0);

    // Block closing walk-in/table sessions with unpaid orders
    const isCustomer = session.customerId && session.type === "TAB";
    if (!isCustomer && totalPaid < totalOwed) {
      return NextResponse.json(
        { error: "Esta sesión requiere pago completo antes de cerrar. Solo clientes registrados pueden quedar con saldo pendiente." },
        { status: 409 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create payment records (skip $0 payments)
      for (const p of parsed.data.payments) {
        const cents = Math.round(p.amount * 100);
        if (cents <= 0) continue;
        await tx.payment.create({
          data: {
            serviceSessionId: sessionId,
            customerId: session.customerId,
            amount: cents,
            method: p.method,
            status: "COMPLETED",
            paidAt: new Date(),
          },
        });
      }

      // Calculate remaining balance
      const balance = totalOwed - totalPaid;

      // If customer linked and balance ≠ 0, create ledger entry
      if (session.customerId && balance !== 0) {
        const ledgerAmount = balance > 0 ? balance : -Math.abs(balance);
        await tx.customerLedgerEntry.create({
          data: {
            customerId: session.customerId,
            amount: ledgerAmount,
            type: "CHARGE",
            serviceSessionId: sessionId,
            note: `Saldo de sesión: ${session.label}`,
          },
        });
      }

      // Mark session closed
      const closed = await tx.serviceSession.update({
        where: { id: sessionId },
        data: { status: "CLOSED", closedAt: new Date() },
        include: { customer: true },
      });

      return { session: closed, totalOwed, totalPaid, balance };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[PUT /api/admin/restaurant/sessions/[sessionId]]", err);
    return NextResponse.json({ error: "Error al cerrar sesión" }, { status: 500 });
  }
}
