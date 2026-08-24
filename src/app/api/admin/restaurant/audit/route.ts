import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/restaurant/audit?type=stock|orders|payments|ledger
 * Vista unificada de auditoría para el restaurante.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "stock";

  try {
    if (type === "stock") {
      const moves = await prisma.stockMovement.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
        include: { ingredient: { select: { name: true, unit: true } } },
      });
      return NextResponse.json(
        moves.map((m) => ({
          id: m.id,
          kind: "stock",
          date: m.createdAt,
          title: m.ingredient.name,
          detail: `${m.delta > 0 ? "+" : ""}${m.delta} ${m.ingredient.unit}`,
          reason: m.reason,
          actor: m.actorName,
          notes: m.notes,
        }))
      );
    }

    if (type === "orders") {
      const events = await prisma.orderStatusEvent.findMany({
        orderBy: { timestamp: "desc" },
        take: 200,
        include: {
          order: { select: { id: true, total: true, source: true, customerName: true } },
        },
      });
      return NextResponse.json(
        events.map((e) => ({
          id: e.id,
          kind: "order",
          date: e.timestamp,
          title: `Orden #${e.order.id.slice(-6).toUpperCase()}`,
          detail: `${e.fromStatus} → ${e.toStatus}`,
          reason: e.reason,
          actor: e.actorName,
          notes: e.order.customerName,
          total: e.order.total,
        }))
      );
    }

    if (type === "payments") {
      const payments = await prisma.payment.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
        include: {
          order: { select: { id: true } },
          customer: { select: { name: true } },
        },
      });
      return NextResponse.json(
        payments.map((p) => ({
          id: p.id,
          kind: "payment",
          date: p.paidAt || p.createdAt,
          title: p.order ? `Orden #${p.order.id.slice(-6).toUpperCase()}` : "Pago a cuenta",
          detail: p.method,
          reason: p.status,
          actor: p.customer?.name || null,
          notes: p.note,
          total: p.amount,
        }))
      );
    }

    if (type === "ledger") {
      const entries = await prisma.customerLedgerEntry.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
        include: { customer: { select: { name: true } } },
      });
      return NextResponse.json(
        entries.map((e) => ({
          id: e.id,
          kind: "ledger",
          date: e.createdAt,
          title: e.customer.name,
          detail: e.type,
          reason: null,
          actor: null,
          notes: e.note,
          total: e.amount,
        }))
      );
    }

    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  } catch (err) {
    console.error("[GET /api/admin/restaurant/audit]", err);
    return NextResponse.json({ error: "Error al obtener auditoría" }, { status: 500 });
  }
}
