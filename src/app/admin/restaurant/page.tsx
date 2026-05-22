import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatPesos(cents: number): string {
  return (cents / 100).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });
}

function getTodayBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getTime() + 86400000);
  return { start, end };
}

export default async function RestaurantDashboardPage() {
  const cookieStore = await cookies();
  if (cookieStore.get("hangar5_admin_session")?.value !== "true") {
    redirect("/admin/login");
  }

  const { start: todayStart, end: todayEnd } = getTodayBounds();

  // ─── Stats ──────────────────────────────────────────────────────────────────
  const [activeOrdersCount, dailySalesResult, occupiedTablesCount, staffPresentCount, totalMenuItems] =
    await Promise.all([
      prisma.order.count({
        where: {
          status: { in: ["PLACED", "IN_KITCHEN", "READY", "SERVED"] },
          createdAt: { gte: todayStart, lt: todayEnd },
        },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: "COMPLETED",
          paidAt: { gte: todayStart, lt: todayEnd },
        },
      }),
      prisma.tableSession.count({
        where: { status: "OPEN" },
      }),
      prisma.staffClock.groupBy({
        by: ["staffId"],
        where: {
          type: "IN",
          timestamp: { gte: todayStart, lt: todayEnd },
        },
      }).then(async (ins) => {
        const staffIds = ins.map((i) => i.staffId);
        if (staffIds.length === 0) return 0;
        const outs = await prisma.staffClock.findMany({
          where: {
            staffId: { in: staffIds },
            type: "OUT",
            timestamp: { gte: todayStart, lt: todayEnd },
          },
          select: { staffId: true },
        });
        const outStaffIds = new Set(outs.map((o) => o.staffId));
        return staffIds.filter((id) => !outStaffIds.has(id)).length;
      }),
      prisma.menuItem.count({
        where: { isActive: true },
      }),
    ]);

  const dailySales = dailySalesResult._sum.amount ?? 0;

  // ─── Recent orders ──────────────────────────────────────────────────────────
  const recentOrders = await prisma.order.findMany({
    where: {
      createdAt: { gte: todayStart, lt: todayEnd },
    },
    include: {
      tableSession: {
        include: {
          table: { select: { number: true, name: true } },
        },
      },
      orderItems: {
        take: 3,
        include: {
          menuItem: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // ─── Active tables ──────────────────────────────────────────────────────────
  const activeTables = await prisma.table.findMany({
    where: {
      sessions: { some: { status: "OPEN" } },
    },
    include: {
      sessions: {
        where: { status: "OPEN" },
        take: 1,
        include: {
          orders: { select: { id: true, status: true, total: true } },
        },
      },
    },
    orderBy: { number: "asc" },
  });

  const totalTables = await prisma.table.count({ where: { isActive: true } });

  // ─── Colors for status badges ───────────────────────────────────────────────
  const orderStatusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    PLACED: "bg-blue-100 text-blue-700",
    IN_KITCHEN: "bg-orange-100 text-orange-700",
    READY: "bg-green-100 text-green-700",
    SERVED: "bg-emerald-100 text-emerald-700",
    PAID: "bg-violet-100 text-violet-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  const statusLabel: Record<string, string> = {
    DRAFT: "Borrador",
    PLACED: "Recibida",
    IN_KITCHEN: "En cocina",
    READY: "Lista",
    SERVED: "Servida",
    PAID: "Pagada",
    CANCELLED: "Cancelada",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <span className="text-sm text-gray-500">
          {new Date().toLocaleDateString("es-MX", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>

      {/* ─── Stats Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active orders */}
        <Link
          href="/admin/restaurant/orders"
          className="block bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">Órdenes activas hoy</p>
              <span className="w-2 h-2 rounded-full bg-blue-500" />
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">{activeOrdersCount}</p>
            <p className="mt-1 text-xs text-gray-400">pendientes</p>
          </div>
        </Link>

        {/* Daily sales */}
        <Link
          href="/admin/restaurant/orders"
          className="block bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">Ventas del día</p>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">{formatPesos(dailySales)}</p>
            <p className="mt-1 text-xs text-gray-400">MXN</p>
          </div>
        </Link>

        {/* Occupied tables */}
        <Link
          href="/admin/restaurant/tables"
          className="block bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">Mesas ocupadas</p>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {occupiedTablesCount}/{totalTables}
            </p>
            <p className="mt-1 text-xs text-gray-400">ocupadas / total</p>
          </div>
        </Link>

        {/* Staff present */}
        <Link
          href="/admin/restaurant/staff"
          className="block bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">Staff presente</p>
              <span className="w-2 h-2 rounded-full bg-violet-500" />
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">{staffPresentCount}</p>
            <p className="mt-1 text-xs text-gray-400">en turno</p>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── Recent orders ─── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Órdenes recientes</h2>
            <Link
              href="/admin/restaurant/orders"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Ver todas →
            </Link>
          </div>
          <div className="p-5">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No hay órdenes hoy</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-bold text-lg text-gray-400 shrink-0">
                        {order.tableSession.table.number}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {order.orderItems.map((i) => i.menuItem.name).join(", ")}
                        </p>
                        <p className="text-xs text-gray-400">
                          {order.createdAt.toLocaleTimeString("es-MX", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          orderStatusColors[order.status] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {statusLabel[order.status] || order.status}
                      </span>
                      <span className="text-sm font-semibold text-gray-700">
                        {formatPesos(order.total)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Active tables ─── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Mesas activas</h2>
            <Link
              href="/admin/restaurant/tables"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Ver todas →
            </Link>
          </div>
          <div className="p-5">
            {activeTables.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No hay mesas ocupadas
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {activeTables.map((table) => {
                  const session = table.sessions[0];
                  const orderCount = session?.orders.length ?? 0;
                  return (
                    <Link
                      key={table.id}
                      href={`/admin/restaurant/orders?table=${table.number}`}
                      className="block bg-amber-50 border border-amber-200 rounded-lg p-3 hover:bg-amber-100 transition-colors"
                    >
                      <p className="text-lg font-bold text-amber-800">{table.number}</p>
                      {table.name && (
                        <p className="text-xs text-amber-600 truncate">{table.name}</p>
                      )}
                      <div className="mt-2 flex items-center gap-3 text-xs text-amber-700">
                        <span>{orderCount} orden{orderCount !== 1 ? "es" : ""}</span>
                        {session && (
                          <span>
                            {Math.floor(
                              (Date.now() - new Date(session.openedAt).getTime()) / 60000
                            )}
                            min
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
