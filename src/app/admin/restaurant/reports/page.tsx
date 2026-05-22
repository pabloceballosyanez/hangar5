import { prisma } from "@/lib/prisma";
import { apiUrl } from "@/lib/api";
import Link from "next/link";

export const dynamic = "force-dynamic";

// ─── Types ──────────────────────────────────────────────────────────────────

interface DailyReport {
  date: string;
  totalOrders: number;
  ordersBySource: Record<string, number>;
  totalRevenue: number;
  revenueByMethod: Record<string, number>;
  avgTicket: number;
  topItems: TopItem[];
  cancelledOrders: number;
  taxCollected: number;
  laborCost: number;
  laborHours: number;
}

interface TopItem {
  menuItemId: string;
  name: string;
  quantity: number;
  revenue: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatMXN(cents: number): string {
  const pesos = cents;
  return pesos.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });
}

function methodLabel(method: string): string {
  const map: Record<string, string> = { CASH: "Efectivo", CARD: "Tarjeta", MP: "MercadoPago", TRANSFER: "Transferencia" };
  return map[method] || method;
}

function sourceLabel(source: string): string {
  const map: Record<string, string> = { WAITER: "Mesero", QR: "QR", ADMIN: "Admin" };
  return map[source] || source;
}

// ─── Server Component ───────────────────────────────────────────────────────

export default async function ReportsPage() {
  const today = new Date().toISOString().slice(0, 10);

  let report: DailyReport | null = null;
  let fetchError = "";

  try {
    // We call our own API route (server-to-server). In prod we'd use apiUrl.
    const res = await fetch(apiUrl(`/api/admin/restaurant/reports/daily?date=${today}`));
    if (!res.ok) {
      fetchError = `API error: ${res.status}`;
    } else {
      report = await res.json();
    }
  } catch (e) {
    fetchError = `Fetch failed: ${String(e)}`;
  }

  // If the API call failed, try to compute inline as fallback
  if (!report) {
    report = await computeDailyReport(today);
  }

  // Estimate margins for the card
  const estimatedTax = report.totalRevenue > 0 ? Math.round(report.totalRevenue * 0.16 / 1.16) : 0;
  const netAfterLabor = report.totalRevenue - estimatedTax - report.laborCost;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">📊 Reportes</h1>
        <Link
          href="/admin/restaurant/reports/pl"
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Ver P&L Mensual →
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Ventas Hoy"
          value={formatMXN(report.totalRevenue)}
          subtitle={`${report.totalOrders} órdenes`}
          icon="💰"
          color="green"
        />
        <SummaryCard
          title="Ticket Promedio"
          value={formatMXN(report.avgTicket)}
          subtitle={report.totalOrders > 0 ? `${(report.totalRevenue / report.totalOrders).toFixed(0)} px` : "N/A"}
          icon="🧾"
          color="blue"
        />
        <SummaryCard
          title="IVA Cobrado"
          value={formatMXN(report.taxCollected)}
          subtitle="16% IVA"
          icon="📋"
          color="amber"
        />
        <SummaryCard
          title="Costo Laboral"
          value={formatMXN(report.laborCost)}
          subtitle={`${report.laborHours} hrs`}
          icon="👥"
          color="purple"
        />
      </div>

      {/* Second row: source/method breakdown + margin estimate */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Revenue by method */}
        <Card title="Ingresos por Método">
          <div className="space-y-2 mt-2">
            {Object.entries(report.revenueByMethod).length === 0 && (
              <p className="text-sm text-gray-400">Sin cobros hoy</p>
            )}
            {Object.entries(report.revenueByMethod).map(([method, amount]) => {
              const pct = report.totalRevenue > 0 ? ((amount / report.totalRevenue) * 100) : 0;
              return (
                <div key={method} className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 w-24 shrink-0">
                    {methodLabel(method)}
                  </span>
                  <Bar value={pct} color="bg-blue-500" />
                  <span className="text-sm text-gray-600 w-24 text-right shrink-0">
                    {formatMXN(amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Orders by source */}
        <Card title="Órdenes por Origen">
          <div className="space-y-2 mt-2">
            {Object.entries(report.ordersBySource).length === 0 && (
              <p className="text-sm text-gray-400">Sin órdenes hoy</p>
            )}
            {Object.entries(report.ordersBySource).map(([source, count]) => {
              const pct = report.totalOrders > 0 ? ((count / report.totalOrders) * 100) : 0;
              return (
                <div key={source} className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 w-16 shrink-0">
                    {sourceLabel(source)}
                  </span>
                  <Bar value={pct} color="bg-emerald-500" />
                  <span className="text-sm text-gray-600 w-16 text-right shrink-0">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Margin estimate */}
        <Card title="Margen Estimado">
          <div className="mt-2 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Ingresos</span>
              <span className="font-medium text-gray-900">{formatMXN(report.totalRevenue)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">IVA</span>
              <span className="font-medium text-amber-600">-{formatMXN(estimatedTax)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Laboral</span>
              <span className="font-medium text-purple-600">-{formatMXN(report.laborCost)}</span>
            </div>
            <hr className="border-gray-200" />
            <div className="flex justify-between text-sm font-bold">
              <span className="text-gray-700">Neto (est.)</span>
              <span className={netAfterLabor >= 0 ? "text-green-600" : "text-red-600"}>
                {formatMXN(netAfterLabor)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Top 10 Items */}
      <Card title="Top 10 Items Vendidos">
        {report.topItems.length === 0 ? (
          <p className="text-sm text-gray-400 mt-2">Sin ventas hoy</p>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-2 font-medium">#</th>
                  <th className="pb-2 font-medium">Item</th>
                  <th className="pb-2 font-medium text-right">Cantidad</th>
                  <th className="pb-2 font-medium text-right">Ingreso</th>
                </tr>
              </thead>
              <tbody>
                {report.topItems.map((item, idx) => (
                  <tr key={item.menuItemId} className="border-b border-gray-100">
                    <td className="py-2 text-gray-400">{idx + 1}</td>
                    <td className="py-2 font-medium text-gray-800">{item.name}</td>
                    <td className="py-2 text-right text-gray-600">{item.quantity}</td>
                    <td className="py-2 text-right font-medium text-gray-900">
                      {formatMXN(item.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Cancelled */}
      <div className="text-sm text-gray-400">
        {report.cancelledOrders > 0 && (
          <p>⚠️ {report.cancelledOrders} órdenes canceladas hoy</p>
        )}
      </div>
    </div>
  );
}

// ─── Pure CSS Bar Component ─────────────────────────────────────────────────

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

// ─── Summary Card Component ─────────────────────────────────────────────────

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: "green" | "blue" | "amber" | "purple";
}) {
  const borderMap: Record<string, string> = {
    green: "border-l-green-500",
    blue: "border-l-blue-500",
    amber: "border-l-amber-500",
    purple: "border-l-purple-500",
  };
  const bgMap: Record<string, string> = {
    green: "bg-green-50",
    blue: "bg-blue-50",
    amber: "bg-amber-50",
    purple: "bg-purple-50",
  };

  return (
    <div className={`rounded-xl bg-white border border-gray-200 border-l-4 ${borderMap[color]} p-4 shadow-sm`}>
      <div className="flex items-center gap-2">
        <span className={`w-8 h-8 rounded-lg ${bgMap[color]} flex items-center justify-center text-lg`}>
          {icon}
        </span>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
    </div>
  );
}

// ─── Generic Card ────────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      {children}
    </div>
  );
}

// ─── Fallback: compute report inline if API fails ──────────────────────────

async function computeDailyReport(date: string): Promise<DailyReport> {
  const start = new Date(date + "T00:00:00.000-06:00");
  const end = new Date(date + "T23:59:59.999-06:00");

  const totalOrders = await prisma.order.count({
    where: { createdAt: { gte: start, lte: end } },
  });

  const ordersRaw = await prisma.order.findMany({
    where: { createdAt: { gte: start, lte: end } },
    select: { source: true },
  });
  const ordersBySource: Record<string, number> = {};
  for (const o of ordersRaw) {
    ordersBySource[o.source] = (ordersBySource[o.source] || 0) + 1;
  }

  const payments = await prisma.payment.findMany({
    where: { status: "COMPLETED", paidAt: { gte: start, lte: end } },
    select: { amount: true, method: true },
  });
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const revenueByMethod: Record<string, number> = {};
  for (const p of payments) {
    revenueByMethod[p.method] = (revenueByMethod[p.method] || 0) + p.amount;
  }

  const avgTicket = payments.length > 0 ? Math.round(totalRevenue / payments.length) : 0;

  const orderItemsToday = await prisma.orderItem.findMany({
    where: {
      order: { createdAt: { gte: start, lte: end } },
      status: { not: "CANCELLED" },
    },
    include: { menuItem: { select: { id: true, name: true } } },
  });

  const itemMap = new Map<string, TopItem>();
  for (const oi of orderItemsToday) {
    const key = oi.menuItemId;
    const existing = itemMap.get(key);
    const lineRev = oi.quantity * oi.unitPrice;
    if (existing) {
      existing.quantity += oi.quantity;
      existing.revenue += lineRev;
    } else {
      itemMap.set(key, {
        menuItemId: key,
        name: oi.menuItem.name,
        quantity: oi.quantity,
        revenue: lineRev,
      });
    }
  }

  const topItems = [...itemMap.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
    .map((i) => ({ ...i, revenue: Math.round(i.revenue / 100) }));

  const cancelledOrders = await prisma.order.count({
    where: { status: "CANCELLED", createdAt: { gte: start, lte: end } },
  });

  const taxAgg = await prisma.order.aggregate({
    where: { createdAt: { gte: start, lte: end }, payment: { status: "COMPLETED" } },
    _sum: { tax: true },
  });

  const shifts = await prisma.staffShift.findMany({
    where: { date: { gte: start, lte: end } },
    include: { staff: { select: { hourlyRate: true } } },
  });

  let laborCost = 0;
  let laborHours = 0;
  for (const s of shifts) {
    const hours = (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / (1000 * 60 * 60);
    laborHours += hours;
    laborCost += hours * s.staff.hourlyRate;
  }

  return {
    date,
    totalOrders,
    ordersBySource,
    totalRevenue: Math.round(totalRevenue / 100),
    revenueByMethod: Object.fromEntries(
      Object.entries(revenueByMethod).map(([k, v]) => [k, Math.round(v / 100)])
    ),
    avgTicket: Math.round(avgTicket / 100),
    topItems,
    cancelledOrders,
    taxCollected: Math.round((taxAgg._sum.tax ?? 0) / 100),
    laborCost: Math.round(laborCost / 100),
    laborHours: Math.round(laborHours * 10) / 10,
  };
}
