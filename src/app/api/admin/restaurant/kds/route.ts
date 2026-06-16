import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── GET: KDS — active kitchen orders grouped by prepStation ─────────────────
export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ["PLACED", "IN_KITCHEN", "READY"] },
      },
      orderBy: { createdAt: "asc" }, // FIFO
      include: {
        serviceSession: {
          include: { table: { select: { number: true, name: true, location: true } } },
        },
        table: { select: { number: true, name: true, location: true } },
        orderItems: {
          where: {
            status: { in: ["PENDING", "IN_PREP"] },
          },
          include: {
            menuItem: {
              select: {
                name: true,
                prepStation: true,
                estimatedPrepMinutes: true,
              },
            },
            variant: {
              select: { name: true },
            },
            modifiers: {
              select: { modifierName: true, priceDelta: true },
            },
          },
        },
        payments: {
          select: { method: true, status: true },
        },
      },
    });

    const now = Date.now();

    // Transform and group by prepStation
    const grouped: Record<string, unknown[]> = {};

    for (const order of orders) {
      // Skip orders with no active items
      if (order.orderItems.length === 0) continue;

      // Group items by prepStation
      const itemsByStation: Record<string, unknown[]> = {};
      for (const item of order.orderItems) {
        const station = item.menuItem.prepStation;
        if (!itemsByStation[station]) itemsByStation[station] = [];
        itemsByStation[station].push({
          id: item.id,
          status: item.status,
          quantity: item.quantity,
          menuItem: item.menuItem.name,
          variant: item.variant?.name ?? null,
          specialInstructions: item.specialInstructions,
          estimatedPrepMinutes: item.menuItem.estimatedPrepMinutes,
          modifiers: item.modifiers.map((m) => m.modifierName),
          elapsedSeconds: Math.round((now - new Date(item.createdAt).getTime()) / 1000),
        });
      }

      for (const [station, items] of Object.entries(itemsByStation)) {
        if (!grouped[station]) grouped[station] = [];
        (grouped[station] as unknown[]).push({
          orderId: order.id,
          orderStatus: order.status,
          table: order.table || order.serviceSession?.table || null,
          customerName: order.customerName,
          notes: order.notes,
          source: order.source,
          paymentMethod: order.payments[0]?.method || null,
          paymentStatus: order.payments[0]?.status || null,
          createdAt: order.createdAt,
          elapsedSeconds: Math.round((now - new Date(order.createdAt).getTime()) / 1000),
          items,
        });
      }
    }

    return NextResponse.json(grouped);
  } catch (err) {
    console.error("[GET /api/admin/restaurant/kds]", err);
    return NextResponse.json({ error: "Error al obtener KDS" }, { status: 500 });
  }
}
