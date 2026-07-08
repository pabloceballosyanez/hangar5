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

    const paymentInputs = parsed.data.payments;
    const totalPaid = paymentInputs.reduce((sum, p) => sum + Math.round(p.amount * 100), 0);

    // Run entire close operation inside a transaction to prevent race conditions.
    // Session read + status check + close happen atomically.
    const result = await prisma.$transaction(async (tx) => {
      const session = await tx.serviceSession.findUnique({
        where: { id: sessionId },
        include: { orders: true, customer: true },
      });

      if (!session) throw new Error("NOT_FOUND");
      if (session.status === "CLOSED") throw new Error("ALREADY_CLOSED");

      const unpaidOrders = session.orders.filter(o => o.status !== "PAID" && o.status !== "CANCELLED");
      const totalOwed = unpaidOrders.reduce((sum, o) => sum + o.total, 0);

      const isCustomer = session.customerId && (session.type === "TAB" || session.type === "QR");
      if (!isCustomer && totalPaid < totalOwed) {
        throw new Error("UNPAID_ORDERS");
      }

      for (const p of paymentInputs) {
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

      const balance = totalOwed - totalPaid;

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
        for (const order of unpaidOrders) {
          await tx.order.update({
            where: { id: order.id },
            data: { status: "PAID" },
          });
          await tx.orderStatusEvent.create({
            data: { orderId: order.id, fromStatus: order.status, toStatus: "PAID" },
          });
        }
      }

      const closed = await tx.serviceSession.update({
        where: { id: sessionId },
        data: { status: "CLOSED", closedAt: new Date() },
        include: { customer: true },
      });

      return { session: closed, totalOwed, totalPaid, balance };
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = (err as Error).message;
    if (message === "NOT_FOUND") {
      return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
    }
    if (message === "ALREADY_CLOSED") {
      return NextResponse.json({ error: "Sesión ya cerrada" }, { status: 409 });
    }
    if (message === "UNPAID_ORDERS") {
      return NextResponse.json(
        { error: "Hay órdenes sin pagar. Usa 'Pagar' antes de cerrar la sesión." },
        { status: 409 }
      );
    }
    console.error("[PUT /api/admin/restaurant/sessions/[sessionId]]", err);
    return NextResponse.json({ error: "Error al cerrar sesión" }, { status: 500 });
  }
}
