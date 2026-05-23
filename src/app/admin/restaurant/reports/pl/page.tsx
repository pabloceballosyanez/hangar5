import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

// ─── Types ──────────────────────────────────────────────────────────────────

interface PLReport {
  month: string;
  revenue: { total: number; food: number; drinks: number; tax: number };
  costs: {
    ingredients: number;
    labor: number;
    laborHours: number;
    fixed: number;
    fixedBreakdown: { id: string; description: string; amount: number; category: string }[];
  };
  profit: { gross: number; net: number; margin: number };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatMXN(cents: number): string {
  return cents.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });
}

function negStyle(cents: number): string {
  return cents < 0 ? "text-red-600" : "text-gray-900";
}

function monthLabel(month: string): string {
  const [y, m] = month.split("-");
  const names = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  return `${names[Number(m) - 1]} ${y}`;
}

function centsDisplay(cents: number): number {
  return Math.round(cents / 100);
}

function monthRange(monthParam: string): { start: Date; end: Date } {
  const [y, m] = monthParam.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1); // first of next month (exclusive)
  return { start, end };
}

// ─── Compute P&L from Prisma ─────────────────────────────────────────────────

async function computePLReport(monthParam: string): Promise<PLReport> {
  const { start, end } = monthRange(monthParam);

  // Revenue: completed payments in month
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

  // Ingredient cost (estimated from recipes)
  const processedMenuItems = new Map<string, number>();
  for (const p of payments) {
    for (const oi of p.order.orderItems) {
      const prev = processedMenuItems.get(oi.menuItemId) || 0;
      processedMenuItems.set(oi.menuItemId, prev + oi.quantity);
    }
  }

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

  let ingredientCost = 0;
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

  // Labor cost
  const shifts = await prisma.staffShift.findMany({
    where: { date: { gte: start, lt: end } },
    include: { staff: { select: { hourlyRate: true } } },
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

  // Fixed expenses
  const fixedExpenses = await prisma.fixedExpense.findMany({
    where: { isActive: true },
  });
  const fixedTotal = fixedExpenses.reduce((sum, fe) => sum + fe.amount, 0);

  // Profit
  const grossProfit = totalRevenue - ingredientCost;
  const netProfit = totalRevenue - ingredientCost - laborCost - fixedTotal;
  const margin =
    totalRevenue > 0
      ? Math.round((netProfit / totalRevenue) * 10000) / 100
      : 0;

  return {
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
  };
}

// ─── Server Component ───────────────────────────────────────────────────────

export default async function PLPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const selectedMonth = monthParam || defaultMonth;

  let report: PLReport | null = null;
  let error = "";

  try {
    report = await computePLReport(selectedMonth);
  } catch (e) {
    error = String(e);
    console.error("[PLPage] Error computing P&L:", e);
  }

  // Generate month options (± 12 months from current)
  const monthOptions: { value: string; label: string }[] = [];
  for (let i = -12; i <= 0; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthOptions.push({ value: val, label: monthLabel(val) });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/restaurant/reports"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Reportes
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">📈 P&L Mensual</h1>
        </div>

        {/* Month selector */}
        <form method="GET" className="flex items-center gap-2">
          <select
            name="month"
            defaultValue={selectedMonth}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Ver
          </button>
        </form>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          Error al cargar el reporte: {error}
        </div>
      )}

      {report && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MiniCard title="Ingresos Totales" value={formatMXN(report.revenue.total)} color="green" />
            <MiniCard title="Margen Bruto" value={formatMXN(report.profit.gross)} color="blue" />
            <MiniCard title="Margen Neto" value={formatMXN(report.profit.net)} color={report.profit.net >= 0 ? "purple" : "red"} />
            <MiniCard title="Margen %" value={`${report.profit.margin}%`} color="amber" />
          </div>

          {/* P&L Table */}
          <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">{monthLabel(report.month)}</h2>
            </div>

            {/* INGRESOS */}
            <SectionHeader label="INGRESOS" />
            <PLRow label="Ventas alimentos" value={report.revenue.food} />
            <PLRow label="Ventas bebidas" value={report.revenue.drinks} />
            <PLRow label="IVA cobrado" value={report.revenue.tax} />
            <PLRow
              label="Total Ingresos"
              value={report.revenue.total}
              bold
              border
            />

            {/* COSTOS */}
            <SectionHeader label="COSTOS" />
            <PLRow label="Ingredientes (est.)" value={-report.costs.ingredients} />
            <PLRow label="Mano de obra" value={-report.costs.labor} subtitle={`${report.costs.laborHours} hrs`} />

            {/* Fixed expenses breakdown */}
            {report.costs.fixedBreakdown.length > 0 && (
              <>
                {report.costs.fixedBreakdown.map((fe) => (
                  <PLRow
                    key={fe.id}
                    label={`  ${fe.description}`}
                    value={-fe.amount}
                    indent
                  />
                ))}
              </>
            )}
            <PLRow label="Gastos fijos" value={-report.costs.fixed} bold />
            <PLRow
              label="Total Costos"
              value={-(report.costs.ingredients + report.costs.labor + report.costs.fixed)}
              bold
              border
            />

            {/* RESULTADO */}
            <SectionHeader label="RESULTADO" />
            <PLRow
              label="Margen Bruto"
              value={report.profit.gross}
              subtitle={`Ingresos - Ingredientes`}
            />
            <PLRow
              label="Margen Neto"
              value={report.profit.net}
              subtitle={`Ingresos - Todos los costos`}
              bold
              prominent
            />
            <PLRow
              label="Margen %"
              value={report.profit.margin}
              suffix="%"
              bold
              border
            />
          </div>
        </>
      )}
    </div>
  );
}

// ─── PL Table Row ───────────────────────────────────────────────────────────

function PLRow({
  label,
  value,
  subtitle,
  suffix,
  bold,
  indent,
  border,
  prominent,
}: {
  label: string;
  value: number | string;
  subtitle?: string;
  suffix?: string;
  bold?: boolean;
  indent?: boolean;
  border?: boolean;
  prominent?: boolean;
}) {
  const formatted =
    typeof value === "number"
      ? `${value < 0 ? "-" : ""}${formatMXN(Math.abs(value))}${suffix || ""}`
      : `${value}${suffix || ""}`;
  const numericValue = typeof value === "number" ? value : 0;
  const colorClass =
    prominent && numericValue >= 0
      ? "text-green-700 bg-green-50"
      : prominent && numericValue < 0
      ? "text-red-700 bg-red-50"
      : bold
      ? "text-gray-900"
      : "text-gray-700";

  return (
    <div
      className={`flex justify-between items-center px-6 py-2.5 ${
        border ? "border-b border-gray-200" : ""
      } ${prominent ? "rounded mx-4 my-1" : ""} ${
        indent ? "pl-10" : ""
      }`}
    >
      <div>
        <span className={`text-sm ${bold ? "font-semibold" : ""} ${colorClass}`}>
          {label}
        </span>
        {subtitle && (
          <span className="text-xs text-gray-400 ml-2">{subtitle}</span>
        )}
      </div>
      <span
        className={`text-sm text-right font-mono tabular-nums ${
          bold ? "font-semibold" : ""
        } ${
          typeof value === "number" && value < 0
            ? "text-red-600"
            : colorClass
        }`}
      >
        {formatted}
      </span>
    </div>
  );
}

// ─── Section Header ─────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="px-6 py-2 bg-gray-50 border-b border-gray-100">
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

// ─── Mini Summary Card ──────────────────────────────────────────────────────

function MiniCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: "green" | "blue" | "amber" | "purple" | "red";
}) {
  const borderMap: Record<string, string> = {
    green: "border-l-green-500",
    blue: "border-l-blue-500",
    amber: "border-l-amber-500",
    purple: "border-l-purple-500",
    red: "border-l-red-500",
  };
  return (
    <div
      className={`rounded-xl bg-white border border-gray-200 border-l-4 ${borderMap[color]} p-4 shadow-sm`}
    >
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {title}
      </p>
      <p className="mt-1 text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
