import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const TAX_RATE = 0.16;

const addItemSchema = z.object({
  menuItemId: z.string().min(1),
  variantId: z.string().optional().nullable(),
  quantity: z.number().int().positive().default(1),
  specialInstructions: z.string().optional().nullable(),
  modifierIds: z.array(z.string()).default([]),
});

const addItemsSchema = z.object({
  items: z.array(addItemSchema).min(1),
});

// ─── POST: add items to existing order (DRAFT or PLACED) ─────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await req.json();
    const parsed = addItemsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { items } = parsed.data;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    if (order.status !== "DRAFT" && order.status !== "PLACED") {
      return NextResponse.json(
        { error: "Solo se pueden agregar items a órdenes en estado DRAFT o PLACED" },
        { status: 409 }
      );
    }

    const menuItemIds = [...new Set(items.map((i) => i.menuItemId))];
    const variantIds = [...new Set(items.map((i) => i.variantId).filter(Boolean))] as string[];
    const modifierIds = [...new Set(items.flatMap((i) => i.modifierIds))];

    const menuItems = await prisma.menuItem.findMany({ where: { id: { in: menuItemIds } } });
    const variants = variantIds.length
      ? await prisma.menuItemVariant.findMany({ where: { id: { in: variantIds } } })
      : [];
    const modifiers = modifierIds.length
      ? await prisma.modifier.findMany({ where: { id: { in: modifierIds } } })
      : [];

    const menuItemMap = new Map(menuItems.map((m) => [m.id, m]));
    const variantMap = new Map(variants.map((v) => [v.id, v]));
    const modifierMap = new Map(modifiers.map((m) => [m.id, m]));

    for (const item of items) {
      if (!menuItemMap.has(item.menuItemId)) {
        return NextResponse.json(
          { error: `MenuItem ${item.menuItemId} no encontrado` },
          { status: 404 }
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      let additionalSubtotal = 0;

      for (const item of items) {
        const menuItem = menuItemMap.get(item.menuItemId)!;
        const variant = item.variantId ? variantMap.get(item.variantId) : null;
        const unitPrice = menuItem.basePrice + (variant?.priceDelta ?? 0);
        const itemModifiers = item.modifierIds.map((mid) => modifierMap.get(mid)!).filter(Boolean);
        const modifiersTotal = itemModifiers.reduce((sum, m) => sum + m.priceDelta, 0);
        additionalSubtotal += (unitPrice + modifiersTotal) * item.quantity;

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

      const newSubtotal = order.subtotal + additionalSubtotal;
      const newTax = Math.round(newSubtotal * TAX_RATE);
      const newTotal = newSubtotal + newTax;

      return tx.order.update({
        where: { id: orderId },
        data: { subtotal: newSubtotal, tax: newTax, total: newTotal },
        include: {
          orderItems: {
            include: { menuItem: true, variant: true, modifiers: true },
          },
          payment: true,
          tableSession: { include: { table: true } },
        },
      });
    });

    return NextResponse.json({
      ...result,
      subtotal: result.subtotal / 100,
      tax: result.tax / 100,
      total: result.total / 100,
    }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/restaurant/orders/[orderId]/items]", err);
    return NextResponse.json({ error: "Error al agregar items" }, { status: 500 });
  }
}
