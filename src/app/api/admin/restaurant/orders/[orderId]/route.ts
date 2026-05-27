import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const TAX_RATE = 0.16;

function serializeOrder(order: Record<string, unknown>) {
  const result = { ...order } as Record<string, unknown>;
  for (const f of ["subtotal", "tax", "total"] as const) {
    if (typeof result[f] === "number") result[f] = (result[f] as number) / 100;
  }
  return result;
}

// ─── GET: full order detail ───────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            menuItem: true,
            variant: true,
            modifiers: true,
            statusEvents: { orderBy: { timestamp: "desc" } },
          },
        },
        statusEvents: { orderBy: { timestamp: "desc" } },
        payments: true,
        serviceSession: { include: { table: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    return NextResponse.json(serializeOrder(order as unknown as Record<string, unknown>));
  } catch (err) {
    console.error("[GET /api/admin/restaurant/orders/[orderId]]", err);
    return NextResponse.json({ error: "Error al obtener orden" }, { status: 500 });
  }
}

// ─── PUT: update order (only if DRAFT) ───────────────────────────────────────
const updateItemSchema = z.object({
  menuItemId: z.string().min(1),
  variantId: z.string().optional().nullable(),
  quantity: z.number().int().positive().default(1),
  specialInstructions: z.string().optional().nullable(),
  modifierIds: z.array(z.string()).default([]),
});

const updateOrderSchema = z.object({
  notes: z.string().optional().nullable(),
  customerName: z.string().optional().nullable(),
  customerEmail: z.string().email().optional().nullable(),
  customerPhone: z.string().optional().nullable(),
  items: z.array(updateItemSchema).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await req.json();
    const parsed = updateOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: { include: { modifiers: true } } },
    });
    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }
    if (order.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Solo se pueden editar órdenes en estado DRAFT" },
        { status: 409 }
      );
    }

    const { notes, customerName, customerEmail, customerPhone, items } = parsed.data;

    const updated = await prisma.$transaction(async (tx) => {
      // If items provided, replace all order items
      if (items !== undefined) {
        const menuItemIds = [...new Set(items.map((i) => i.menuItemId))];
        const variantIds = [...new Set(items.map((i) => i.variantId).filter(Boolean))] as string[];
        const modifierIds = [...new Set(items.flatMap((i) => i.modifierIds))];

        const menuItems = await tx.menuItem.findMany({ where: { id: { in: menuItemIds } } });
        const variants = variantIds.length
          ? await tx.menuItemVariant.findMany({ where: { id: { in: variantIds } } })
          : [];
        const modifiers = modifierIds.length
          ? await tx.modifier.findMany({ where: { id: { in: modifierIds } } })
          : [];

        const menuItemMap = new Map(menuItems.map((m) => [m.id, m]));
        const variantMap = new Map(variants.map((v) => [v.id, v]));
        const modifierMap = new Map(modifiers.map((m) => [m.id, m]));

        // Delete old items (cascade deletes modifiers and status events)
        await tx.orderItemModifier.deleteMany({
          where: { orderItem: { orderId } },
        });
        await tx.orderStatusEvent.deleteMany({
          where: { orderId, orderItemId: { not: null } },
        });
        await tx.orderItem.deleteMany({ where: { orderId } });

        let subtotal = 0;
        for (const item of items) {
          const menuItem = menuItemMap.get(item.menuItemId);
          if (!menuItem) continue;
          const variant = item.variantId ? variantMap.get(item.variantId) : null;
          const unitPrice = menuItem.basePrice + (variant?.priceDelta ?? 0);
          const itemModifiers = item.modifierIds.map((mid) => modifierMap.get(mid)!).filter(Boolean);
          const modifiersTotal = itemModifiers.reduce((sum, m) => sum + m.priceDelta, 0);
          subtotal += (unitPrice + modifiersTotal) * item.quantity;

          const orderItem = await tx.orderItem.create({
            data: {
              orderId,
              menuItemId: item.menuItemId,
              variantId: item.variantId ?? null,
              quantity: item.quantity,
              unitPrice,
              specialInstructions: item.specialInstructions ?? null,
            },
          });

          if (itemModifiers.length > 0) {
            await tx.orderItemModifier.createMany({
              data: itemModifiers.map((m) => ({
                orderItemId: orderItem.id,
                modifierId: m.id,
                modifierName: m.name,
                priceDelta: m.priceDelta,
              })),
            });
          }
        }

        // Prices already include IVA. Tax is desglosado.
        const tax = Math.round(subtotal - subtotal / 1.16);
        const total = subtotal;

        await tx.order.update({
          where: { id: orderId },
          data: {
            notes: notes ?? undefined,
            customerName: customerName ?? undefined,
            customerEmail: customerEmail ?? undefined,
            customerPhone: customerPhone ?? undefined,
            subtotal,
            tax,
            total,
          },
        });
      } else {
        await tx.order.update({
          where: { id: orderId },
          data: {
            notes: notes ?? undefined,
            customerName: customerName ?? undefined,
            customerEmail: customerEmail ?? undefined,
            customerPhone: customerPhone ?? undefined,
          },
        });
      }

      return tx.order.findUnique({
        where: { id: orderId },
        include: {
          orderItems: { include: { menuItem: true, variant: true, modifiers: true } },
          statusEvents: { orderBy: { timestamp: "desc" } },
          payments: true,
          serviceSession: { include: { table: true } },
        },
      });
    });

    return NextResponse.json(serializeOrder(updated as unknown as Record<string, unknown>));
  } catch (err) {
    console.error("[PUT /api/admin/restaurant/orders/[orderId]]", err);
    return NextResponse.json({ error: "Error al actualizar orden" }, { status: 500 });
  }
}

// ─── DELETE: cancel order ─────────────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    if (order.status === "CANCELLED") {
      return NextResponse.json({ error: "La orden ya está cancelada" }, { status: 409 });
    }

    if (order.status === "PAID") {
      return NextResponse.json({ error: "No se puede cancelar una orden pagada" }, { status: 409 });
    }

    const [statusEvent, updated] = await prisma.$transaction([
      prisma.orderStatusEvent.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: "CANCELLED",
        },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      }),
    ]);

    return NextResponse.json({ order: serializeOrder(updated as unknown as Record<string, unknown>), statusEvent });
  } catch (err) {
    console.error("[DELETE /api/admin/restaurant/orders/[orderId]]", err);
    return NextResponse.json({ error: "Error al cancelar orden" }, { status: 500 });
  }
}
