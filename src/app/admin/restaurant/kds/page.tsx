import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getUrgency(elapsedMinutes: number): "low" | "medium" | "high" {
  if (elapsedMinutes >= 30) return "high";
  if (elapsedMinutes >= 15) return "medium";
  return "low";
}

const stationLabel: Record<string, string> = {
  KITCHEN: "Cocina",
  BAR: "Bar",
  COLD_STATION: "Estación Fría",
};

const sourceLabel: Record<string, string> = {
  WAITER: "Mesero",
  QR: "QR",
  ADMIN: "Admin",
};

const urgencyBorderBg: Record<string, string> = {
  low: "border-green-400 bg-green-50",
  medium: "border-amber-400 bg-amber-50",
  high: "border-red-400 bg-red-50",
};

const urgencyDot: Record<string, string> = {
  low: "bg-green-500",
  medium: "bg-amber-500",
  high: "bg-red-500",
};

// ─── Mark Ready Button (Client Component island) ──────────────────────────────
import { MarkReadyButton } from "./MarkReadyButton";

// ─── Server Component ─────────────────────────────────────────────────────────

export default async function KDSPage() {
  const now = Date.now();

  const rawOrders = await prisma.order.findMany({
    where: {
      status: { in: ["PLACED", "IN_KITCHEN"] },
    },
    orderBy: { createdAt: "asc" },
    include: {
      tableSession: {
        include: { table: { select: { number: true, name: true } } },
      },
      orderItems: {
        where: {
          status: { in: ["PENDING", "IN_PREP"] },
        },
        include: {
          menuItem: { select: { name: true, prepStation: true } },
          variant: { select: { name: true } },
          modifiers: { select: { modifierName: true } },
        },
      },
    },
  });

  const orders = rawOrders
    .filter((o) => o.orderItems.length > 0)
    .map((o) => {
      const elapsedMs = now - new Date(o.createdAt).getTime();
      const elapsedMinutes = Math.floor(elapsedMs / 60000);
      return {
        id: o.id,
        tableNumber: o.tableSession.table.number,
        tableName: o.tableSession.table.name,
        source: o.source,
        status: o.status,
        elapsed: elapsedMinutes,
        urgency: getUrgency(elapsedMinutes),
        items: o.orderItems.map((item) => ({
          id: item.id,
          menuItemName: item.menuItem.name,
          variantName: item.variant?.name ?? null,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions,
          modifiers: item.modifiers.map((m) => ({
            modifierName: m.modifierName,
            priceDelta: 0,
          })),
          status: item.status,
          prepStation: item.menuItem.prepStation,
        })),
      };
    });

  const stationSet = new Set<string>();
  for (const order of orders) {
    for (const item of order.items) {
      stationSet.add(item.prepStation);
    }
  }
  const stations = Array.from(stationSet);

  const stationOrderMap: Record<string, typeof orders> = {};
  for (const station of stations) {
    stationOrderMap[station] = orders.filter((o) =>
      o.items.some((item) => item.prepStation === station)
    );
  }

  return (
    <>
      <head>
        <meta httpEquiv="refresh" content="15" />
      </head>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">KDS — Cocina</h1>
          <span className="text-xs text-gray-400">
            Auto-refresh cada 15s
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
            <p className="text-xl font-medium text-gray-600">No hay órdenes activas</p>
            <p className="text-sm text-gray-400 mt-1">
              Todas las órdenes han sido completadas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {stations.map((station) => {
              const stationOrders = stationOrderMap[station] || [];
              if (stationOrders.length === 0) return null;

              return (
                <div key={station} className="space-y-3">
                  <h2 className="text-lg font-bold px-1 text-gray-800">
                    {stationLabel[station] || station}
                    <span className="text-sm font-normal text-gray-400 ml-2">
                      ({stationOrders.length})
                    </span>
                  </h2>

                  {stationOrders.map((order) => (
                    <div
                      key={order.id}
                      className={`rounded-xl border-2 p-4 ${urgencyBorderBg[order.urgency]}`}
                    >
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-black/10">
                        <div className="flex items-center gap-2">
                          <span className="text-3xl font-black text-gray-900">
                            {order.tableNumber}
                          </span>
                          {order.tableName && (
                            <span className="text-xs text-gray-600">
                              {order.tableName}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-gray-700">
                            {order.elapsed < 60
                              ? `${order.elapsed} min`
                              : `${Math.floor(order.elapsed / 60)}h ${order.elapsed % 60}m`}
                          </span>
                          <span
                            className={`inline-block w-4 h-4 rounded-full ${urgencyDot[order.urgency]}`}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        {order.items
                          .filter((item) => item.prepStation === station)
                          .map((item) => (
                            <div
                              key={item.id}
                              className="bg-white/50 rounded-lg p-3"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="text-base font-bold text-gray-900">
                                    {item.quantity}x {item.menuItemName}
                                  </p>
                                  {item.variantName && (
                                    <p className="text-sm text-gray-700">
                                      Variante: {item.variantName}
                                    </p>
                                  )}
                                  {item.modifiers.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {item.modifiers.map((mod, mi) => (
                                        <span
                                          key={mi}
                                          className="text-xs bg-white text-gray-700 px-2 py-0.5 rounded-full border border-gray-300"
                                        >
                                          {mod.modifierName}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {item.specialInstructions && (
                                    <p className="text-sm text-red-600 font-medium mt-1 italic">
                                      ⚠️ {item.specialInstructions}
                                    </p>
                                  )}
                                </div>
                                <MarkReadyButton
                                  orderId={order.id}
                                  itemId={item.id}
                                  itemName={item.menuItemName}
                                />
                              </div>
                            </div>
                          ))}
                      </div>

                      <div className="mt-2 text-xs text-gray-500 text-right">
                        {sourceLabel[order.source] || order.source}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
