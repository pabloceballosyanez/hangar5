import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/auth";
import type { OrderStatus, OrderSource } from "@/lib/restaurant-types";
import { ORDER_STATUSES, ORDER_SOURCES } from "@/lib/restaurant-types";

export const dynamic = "force-dynamic";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TAX_RATE = 0.16;

function serializeOrder(order: Record<string, unknown>) {
  const fields = ["subtotal", "tax", "total"] as const;
  const result = { ...order } as Record<string, unknown>;
  for (const f of fields) {
    if (typeof result[f] === "number") result[f] = (result[f] as number) / 100;
  }
  return result;
}

/** Descuenta inventario para una orden dentro de una transacción */
async function deductInventory(
  tx: any,
  items: { menuItemId: string; quantity: number }[]
) {
  for (const item of items) {
    // 1. Buscar receta del platillo
    const recipe = await tx.recipe.findUnique({
      where: { menuItemId: item.menuItemId },
      include: { recipeItems: { include: { ingredient: true } } },
    });

    if (recipe && recipe.recipeItems.length > 0) {
      // Tiene receta: descontar cada ingrediente
      for (const ri of recipe.recipeItems) {
        const decrement = ri.quantity * item.quantity;
        await tx.ingredient.update({
          where: { id: ri.ingredientId },
          data: { currentStock: { decrement } },
        });
        // Registrar movimiento de stock
        await tx.stockMovement.create({
          data: {
            ingredientId: ri.ingredientId,
            delta: -decrement,
            reason: `Venta: ${item.quantity}x`,
          },
        });
      }
      // También heredar de receta padre si existe
      if (recipe.parentRecipeId) {
        const parent = await tx.recipe.findUnique({
          where: { id: recipe.parentRecipeId },
          include: { recipeItems: { include: { ingredient: true } } },
        });
        if (parent) {
          for (const ri of parent.recipeItems) {
            const decrement = ri.quantity * item.quantity;
            await tx.ingredient.update({
              where: { id: ri.ingredientId },
              data: { currentStock: { decrement } },
            });
            await tx.stockMovement.create({
              data: {
                ingredientId: ri.ingredientId,
                delta: -decrement,
                reason: `Venta (base): ${item.quantity}x`,
              },
            });
          }
        }
      }
    } else {
      // Sin receta: buscar ingrediente con mismo nombre que el platillo
      const menuItem = await tx.menuItem.findUnique({ where: { id: item.menuItemId } });
      if (menuItem) {
        const ingredient = await tx.ingredient.findFirst({
          where: { name: menuItem.name },
        });
        if (ingredient) {
          await tx.ingredient.update({
            where: { id: ingredient.id },
            data: { currentStock: { decrement: item.quantity } },
          });
          await tx.stockMovement.create({
            data: {
              ingredientId: ingredient.id,
              delta: -item.quantity,
              reason: `Venta directa: ${item.quantity}x ${menuItem.name}`,
            },
          });
        }
      }
    }
  }
}

// ─── GET: all orders with filters ────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status         = searchParams.get("status") as OrderStatus | null;
    const source         = searchParams.get("source") as OrderSource | null;
    const date           = searchParams.get("date"); // ISO date string YYYY-MM-DD
    const serviceSessionId = searchParams.get("serviceSessionId");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};
    if (status && (ORDER_STATUSES as readonly string[]).includes(status)) where.status = status;
    if (source && (ORDER_SOURCES as readonly string[]).includes(source)) where.source = source;
    if (serviceSessionId) where.serviceSessionId = serviceSessionId;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      where.createdAt = { gte: start, lt: end };
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        serviceSession: {
          include: { table: true },
        },
        orderItems: {
          include: {
            menuItem: true,
            variant: true,
            modifiers: true,
          },
        },
        payments: true,
      },
    });

    return NextResponse.json(orders.map((o) => serializeOrder(o as unknown as Record<string, unknown>)));
  } catch (err) {
    console.error("[GET /api/admin/restaurant/orders]", err);
    return NextResponse.json({ error: "Error al obtener órdenes" }, { status: 500 });
  }
}

// ─── POST: create order ───────────────────────────────────────────────────────
const orderItemSchema = z.object({
  menuItemId: z.string().min(1),
  variantId: z.string().optional().nullable(),
  quantity: z.number().int().positive().default(1),
  specialInstructions: z.string().optional().nullable(),
  modifierIds: z.array(z.string()).default([]),
});

const createOrderSchema = z.object({
  serviceSessionId: z.string().min(1),
  source: z.enum(ORDER_SOURCES),
  customerName: z.string().optional().nullable(),
  customerEmail: z.string().email().optional().nullable(),
  customerPhone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(orderItemSchema).min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { serviceSessionId, source, customerName, customerEmail, customerPhone, notes, items } = parsed.data;

    // ── Resolve customer: logged-in session > email match > new customer ──
    const custSession = getCustomerSession(req);
    let customerId: string | null = null;

    if (custSession) {
      customerId = custSession.customerId;
    } else if (customerEmail) {
      const existing = await prisma.customer.findUnique({ where: { email: customerEmail } });
      if (existing) {
        customerId = existing.id;
      } else {
        const created = await prisma.customer.create({
          data: { name: customerName || customerEmail, email: customerEmail, phone: customerPhone ?? null },
        });
        customerId = created.id;
      }
    }

    // ── Resolve session ──────────────────────────────────────────────────────
    let sessionId: string;
    let sessionDeliveryNote: string | null = null;

    if (source === "QR") {
      // QR orders are CUSTOMER tabs, not table sessions — convert the session
      const parentSession = await prisma.serviceSession.findUnique({
        where: { id: serviceSessionId },
        include: { table: true },
      });
      if (!parentSession) {
        return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
      }

      const tableInfo = parentSession.table;
      const deliveryLabel = tableInfo
        ? `📍 ${tableInfo.name || ("Mesa " + tableInfo.number)}${tableInfo.location ? " · " + tableInfo.location : ""}`
        : "📍 QR";

      // Convert existing session to QR (don't create a new one → avoids empty tab)
      await prisma.serviceSession.update({
        where: { id: serviceSessionId },
        data: {
          type: "QR",
          label: customerName || "Cliente QR",
          tableId: null,
          customerId,
        },
      });
      sessionId = serviceSessionId;
      sessionDeliveryNote = deliveryLabel;
    } else {
      // Waiter/Admin use the existing session
      const svcSession = await prisma.serviceSession.findUnique({ where: { id: serviceSessionId } });
      if (!svcSession) {
        return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
      }
      if (svcSession.status !== "OPEN") {
        return NextResponse.json({ error: "La sesión no está abierta" }, { status: 409 });
      }

      customerId = customerId ?? svcSession.customerId ?? null;
      if (customerId && svcSession.customerId !== customerId) {
        await prisma.serviceSession.update({
          where: { id: serviceSessionId },
          data: { customerId },
        });
      }
      sessionId = serviceSessionId;
    }

    // Prefetch all menuItems and modifiers needed
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

    // Validate all items exist
    for (const item of items) {
      if (!menuItemMap.has(item.menuItemId)) {
        return NextResponse.json(
          { error: `MenuItem ${item.menuItemId} no encontrado` },
          { status: 404 }
        );
      }
    }

    // Calculate totals
    let subtotal = 0;
    const itemsWithPrices = items.map((item) => {
      const menuItem = menuItemMap.get(item.menuItemId)!;
      const variant = item.variantId ? variantMap.get(item.variantId) : null;
      const unitPrice = menuItem.basePrice + (variant?.priceDelta ?? 0);
      const itemModifiers = item.modifierIds.map((mid) => modifierMap.get(mid)!).filter(Boolean);
      const modifiersTotal = itemModifiers.reduce((sum, m) => sum + m.priceDelta, 0);
      const lineTotal = (unitPrice + modifiersTotal) * item.quantity;
      subtotal += lineTotal;
      return { ...item, unitPrice, itemModifiers };
    });

    // Prices already include IVA (Mexico standard). Tax is desglosado.
    const tax = Math.round(subtotal - subtotal / 1.16);
    const total = subtotal;

    const initialStatus = source === "QR" ? "PLACED" : "DRAFT";

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          serviceSessionId: sessionId,
          source,
          customerName,
          customerEmail,
          customerPhone,
          notes: sessionDeliveryNote ? (notes ? `${notes} | ${sessionDeliveryNote}` : sessionDeliveryNote) : (notes || null),
          status: initialStatus,
          subtotal,
          tax,
          total,
        },
      });

      for (const item of itemsWithPrices) {
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: created.id,
            menuItemId: item.menuItemId,
            variantId: item.variantId ?? null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            specialInstructions: item.specialInstructions ?? null,
          },
        });

        if (item.itemModifiers.length > 0) {
          await tx.orderItemModifier.createMany({
            data: item.itemModifiers.map((m) => ({
              orderItemId: orderItem.id,
              modifierId: m.id,
              modifierName: m.name,
              priceDelta: m.priceDelta,
            })),
          });
        }
      }

      // Create initial status event
      await tx.orderStatusEvent.create({
        data: {
          orderId: created.id,
          fromStatus: "DRAFT",
          toStatus: initialStatus,
        },
      });

      // Customer ledger: record the debt
      if (customerId && total > 0) {
        await tx.customerLedgerEntry.create({
          data: {
            customerId,
            amount: total,
            type: "CHARGE",
            serviceSessionId: sessionId,
            note: `Orden #${created.id.slice(-8)}`,
          },
        });
      }

      // Descontar inventario
      await deductInventory(tx, itemsWithPrices.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity })));

      return tx.order.findUnique({
        where: { id: created.id },
        include: {
          orderItems: {
            include: { menuItem: true, variant: true, modifiers: true },
          },
          statusEvents: true,
          serviceSession: { include: { table: true } },
        },
      });
    });

    return NextResponse.json(
      serializeOrder(order as unknown as Record<string, unknown>),
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/admin/restaurant/orders]", err);
    return NextResponse.json({ error: "Error al crear orden" }, { status: 500 });
  }
}
