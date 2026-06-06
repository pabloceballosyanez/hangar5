import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/restaurant/checkout/account
 * Body: { orderId: string }
 *
 * Charges the order to the customer's account (ledger).
 * The order moves to IN_KITCHEN immediately.
 * A CHARGE ledger entry is created for the customer.
 *
 * Requires: customerEmail on the order (used to find/create customer).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId } = body as { orderId?: string };

    if (!orderId) {
      return NextResponse.json({ error: "orderId requerido" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true, table: true, serviceSession: { include: { table: true } } },
    });

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    if (order.status !== "AWAITING_PAYMENT" && order.status !== "PLACED" && order.status !== "DRAFT") {
      return NextResponse.json({ error: "La orden ya fue procesada" }, { status: 409 });
    }

    if (!order.customerEmail) {
      return NextResponse.json(
        { error: "Se requiere email del cliente para cargar a cuenta" },
        { status: 400 }
      );
    }

    const qrToken = order.table?.qrToken || order.serviceSession?.table?.qrToken || "t1";

    await prisma.$transaction(async (tx) => {
      // Find or create customer
      let customer = await tx.customer.findUnique({
        where: { email: order.customerEmail! },
      });

      if (!customer) {
        // Customer must already exist (created by admin) — no auto-creation
        return NextResponse.json(
          { error: "Cliente no registrado. Contacta al administrador para recibir crédito." },
          { status: 400 }
        );
      }

      if (!customer.hasCredit) {
        return NextResponse.json(
          { error: "No tienes crédito habilitado. Contacta al administrador." },
          { status: 403 }
        );
      }

      // Move order to IN_KITCHEN
      await tx.orderStatusEvent.create({
        data: { orderId, fromStatus: order.status, toStatus: "IN_KITCHEN" },
      });
      await tx.order.update({
        where: { id: orderId },
        data: { status: "IN_KITCHEN" },
      });

      // Create a CHARGE ledger entry (customer now owes this amount)
      await tx.customerLedgerEntry.create({
        data: {
          customerId: customer.id,
          amount: order.total, // positive = customer owes us
          type: "CHARGE",
          serviceSessionId: order.serviceSessionId, // null for QR orders — OK
          note: `Cargo a cuenta: orden ${orderId.slice(-8)}`,
        },
      });

      // Record an ON_ACCOUNT payment (status PENDING until settled)
      await tx.payment.create({
        data: {
          orderId,
          customerId: customer.id,
          amount: order.total,
          method: "ON_ACCOUNT",
          status: "PENDING",
          note: "Cargado a cuenta del cliente",
        },
      });
    });

    return NextResponse.json({
      success: true,
      redirectUrl: `/menu/${qrToken}/confirmation?orderId=${orderId}&status=account`,
    });
  } catch (err) {
    console.error("[POST /api/restaurant/checkout/account]", err);
    return NextResponse.json(
      { error: "Error al cargar a cuenta" },
      { status: 500 }
    );
  }
}
