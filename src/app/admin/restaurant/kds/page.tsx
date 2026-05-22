import { apiUrl } from "@/lib/api";

export const dynamic = "force-dynamic";

type KdsModifier = {
  modifierName: string;
  priceDelta: number;
};

type KdsOrderItem = {
  id: string;
  menuItemName: string;
  variantName: string | null;
  quantity: number;
  unitPrice: number;
  specialInstructions: string | null;
  modifiers: KdsModifier[];
  status: string;
  prepStation: string;
};

type KdsOrder = {
  id: string;
  tableNumber: string;
  tableName: string | null;
  source: string;
  status: string;
  elapsed: number;
  urgency: "low" | "medium" | "high";
  items: KdsOrderItem[];
};

type KdsData = {
  orders: KdsOrder[];
  stations: string[];
};

async function fetchKdsData(): Promise<KdsData | null> {
  try {
    const res = await fetch(apiUrl("/api/admin/restaurant/kds"), {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (err) {
    console.error("Error fetching KDS data:", err);
    return null;
  }
}

const stationLabel: Record<string, string> = {
  KITCHEN: "🍳 Cocina",
  BAR: "🍸 Bar",
  COLD_STATION: "🥗 Estación Fría",
};

const stationEmoji: Record<string, string> = {
  KITCHEN: "🍳",
  BAR: "🍸",
  COLD_STATION: "🥗",
};

const sourceLabel: Record<string, string> = {
  WAITER: "Mesero",
  QR: "QR",
  ADMIN: "Admin",
};

const urgencyColor: Record<string, string> = {
  low: "border-green-400 bg-green-50",
  medium: "border-amber-400 bg-amber-50",
  high: "border-red-400 bg-red-50",
};

const urgencyBg: Record<string, string> = {
  low: "bg-green-500",
  medium: "bg-amber-500",
  high: "bg-red-500",
};

export default async function KDSPage() {
  const data = await fetchKdsData();

  const stationOrderMap: Record<string, KdsOrder[]> = {};
  if (data) {
    for (const station of data.stations) {
      stationOrderMap[station] = data.orders.filter((o) =>
        o.items.some((item) => item.prepStation === station)
      );
    }
  }

  return (
    <>
      <head>
        <meta httpEquiv="refresh" content="15" />
      </head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">🍽️ KDS — Cocina</h1>
          <span className="text-xs text-gray-400">
            Auto-refresh cada 15s · {new Date().toLocaleTimeString("es-MX")}
          </span>
        </div>

        {!data || data.orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
            <span className="text-6xl block mb-4">✅</span>
            <p className="text-xl font-medium text-gray-600">No hay órdenes activas</p>
            <p className="text-sm text-gray-400 mt-1">
              Todas las órdenes han sido completadas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {data.stations.map((station) => {
              const orders = stationOrderMap[station] || [];
              if (orders.length === 0) return null;

              return (
                <div key={station} className="space-y-3">
                  <h2 className="text-lg font-bold px-1 flex items-center gap-2 text-gray-800">
                    <span>{stationEmoji[station]}</span>
                    <span>{stationLabel[station] || station}</span>
                    <span className="text-sm font-normal text-gray-400">
                      ({orders.length})
                    </span>
                  </h2>

                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className={`rounded-xl border-2 p-4 ${
                        urgencyColor[order.urgency]
                      }`}
                    >
                      {/* Order header */}
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
                            className={`inline-block w-4 h-4 rounded-full ${
                              urgencyBg[order.urgency]
                            }`}
                          />
                        </div>
                      </div>

                      {/* Order items for this station */}
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
                              </div>
                            </div>
                          ))}
                      </div>

                      {/* Source footer */}
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
