import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function centsDisplay(cents: number): number {
  return Math.round(cents / 100);
}

function monthRange(monthParam: string): { start: Date; end: Date } {
  const [y, m] = monthParam.split("-").map(Number);
  // Use local date constructor: month is 0-indexed
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1); // first of next month → exclusive upper bound
  return { start, end };
}

// ─── GET: P&L monthly report ────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month");
    if (!monthParam || !/^\d{4}-\d{2}$/.test(monthParam)) {
      return NextResponse.json(
        { error: "Parámetro 'month' requerido (YYYY-MM)" },
        { status: 400 }
      );
    }
    const { start, end } = monthRange(monthParam);

    // ── Revenue: completed payments in month ──────────────────────────
    const payments = await prisma.payment.findMany({
      where: {
        status: "COMPLETED",
        paidAt: { gte: start, lt: end },
      },
      include: {
        order: {
          include: {
            orderItems: {
              where: { status: { not: "CANCELLED" } },
              include: {
                menuItem: {
                  include: { category: { select: { kind: true } } },
                },
              },
            },
          },
        },
      },
    });

    let totalRevenue = 0;
    let foodRevenue = 0;
    let drinksRevenue = 0;
    let taxCollected = 0;

    for (const p of payments) {
      totalRevenue += p.amount;
      // Use the order's tax field as a reliable source
      taxCollected += p.order.tax;
      for (const oi of p.order.orderItems) {
        const lineRev = oi.quantity * oi.unitPrice;
        if (oi.menuItem.category?.kind === "DRINK") {
          drinksRevenue += lineRev;
        } else {
          foodRevenue += lineRev;
        }
      }
    }

    // ── Ingredient cost (estimated) ───────────────────────────────────
    // For each order item, look up recipe → recipeItems → ingredient costs
    let ingredientCost = 0;
    const processedMenuItems = new Map<string, number>(); // menuItemId → totalQuantitySold

    for (const p of payments) {
      for (const oi of p.order.orderItems) {
        const prev = processedMenuItems.get(oi.menuItemId) || 0;
        processedMenuItems.set(oi.menuItemId, prev + oi.quantity);
      }
    }

    // Batch-fetch recipes with their items
    const menuItemIds = [...processedMenuItems.keys()];
    const recipes = await prisma.recipe.findMany({
      where: { menuItemId: { in: menuItemIds } },
      include: {
        recipeItems: {
          include: { ingredient: { select: { cost: true } } },
        },
      },
    });
    const recipeMap = new Map(recipes.map((r) => [r.menuItemId, r]));

    for (const [menuItemId, totalQty] of processedMenuItems) {
      const recipe = recipeMap.get(menuItemId);
      if (!recipe || recipe.yieldQuantity <= 0) continue;

      let costPerYield = 0;
      for (const ri of recipe.recipeItems) {
        costPerYield += ri.quantity * ri.ingredient.cost;
      }
      const costPerPortion = costPerYield / recipe.yieldQuantity;
      ingredientCost += costPerPortion * totalQty;
    }
    ingredientCost = Math.round(ingredientCost);

    // ── Labor cost ───────────────────────────────────────────────────
    const shifts = await prisma.staffShift.findMany({
      where: {
        date: { gte: start, lt: end },
      },
      include: {
        staff: { select: { hourlyRate: true } },
      },
    });

    let laborCost = 0;
    let laborHours = 0;
    for (const s of shifts) {
      const hours =
        (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) /
        (1000 * 60 * 60);
      laborHours += hours;
      laborCost += hours * s.staff.hourlyRate;
    }
    laborCost = Math.round(laborCost);

    // ── Fixed expenses ───────────────────────────────────────────────
    const fixedExpenses = await prisma.fixedExpense.findMany({
      where: { isActive: true },
    });
    const fixedTotal = fixedExpenses.reduce((sum, fe) => sum + fe.amount, 0);

    // ── Profit calculations ──────────────────────────────────────────
    const grossProfit = totalRevenue - ingredientCost;
    const netProfit = totalRevenue - ingredientCost - laborCost - fixedTotal;
    const margin =
      totalRevenue > 0
        ? Math.round((netProfit / totalRevenue) * 10000) / 100
        : 0;

    return NextResponse.json({
      month: monthParam,
      revenue: {
        total: centsDisplay(totalRevenue),
        food: centsDisplay(foodRevenue),
        drinks: centsDisplay(drinksRevenue),
        tax: centsDisplay(taxCollected),
      },
      costs: {
        ingredients: centsDisplay(ingredientCost),
        labor: centsDisplay(laborCost),
        laborHours: Math.round(laborHours * 10) / 10,
        fixed: centsDisplay(fixedTotal),
        fixedBreakdown: fixedExpenses.map((fe) => ({
          id: fe.id,
          description: fe.description,
          amount: centsDisplay(fe.amount),
          category: fe.category,
        })),
      },
      profit: {
        gross: centsDisplay(grossProfit),
        net: centsDisplay(netProfit),
        margin,
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/restaurant/reports/pl]", err);
    return NextResponse.json(
      { error: "Error al generar reporte P&L" },
      { status: 500 }
    );
  }
}
