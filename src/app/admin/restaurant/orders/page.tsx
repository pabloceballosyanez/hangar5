'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700 border-gray-300",
  PLACED: "bg-blue-100 text-blue-700 border-blue-300",
  IN_KITCHEN: "bg-orange-100 text-orange-700 border-orange-300",
  READY: "bg-green-100 text-green-700 border-green-300",
  SERVED: "bg-emerald-100 text-emerald-800 border-emerald-300",
  PAID: "bg-violet-100 text-violet-700 border-violet-300",
  CANCELLED: "bg-red-100 text-red-700 border-red-300",
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

const sourceLabel: Record<string, string> = {
  WAITER: "Mesero",
  QR: "QR",
  ADMIN: "Admin",
};

const tabs = [
  { key: "", label: "Todas" },
  { key: "active", label: "Activas" },
  { key: "completed", label: "Completadas" },
  { key: "cancelled", label: "Canceladas" },
] as const;

// API filters map to status arrays for client-side filtering
const TAB_FILTER: Record<string, string[]> = {
  active: ["PLACED", "IN_KITCHEN", "READY", "SERVED"],
  completed: ["PAID"],
  cancelled: ["CANCELLED"],
};

interface OrderItem {
  id: string;
  quantity: number;
  menuItem: { name: string; prepStation: string };
  variant: { name: string } | null;
  modifiers: { modifierName: string; priceDelta: number }[];
  specialInstructions: string | null;
}

interface Order {
  id: string;
  serviceSession: { table: { number: string; name: string | null } | null };
  customerName: string | null;
  source: string;
  status: string;
  total: number;
  subtotal: number;
  tax: number;
  createdAt: string;
  orderItems: OrderItem[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchOrders() {
      try {
        const res = await fetch("/api/admin/restaurant/orders");
        if (!res.ok || cancelled) return;
        let data: Order[] = await res.json();
        if (!cancelled) {
          // Client-side filter
          const statusFilter = TAB_FILTER[activeTab];
          if (statusFilter) {
            data = data.filter(o => statusFilter.includes(o.status));
          }
          setOrders(data);
        }
      } catch {
        // keep old data on error
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    setLoading(true);
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [activeTab]);

  const emptyMessage = activeTab === "active"
    ? "No hay órdenes activas en este momento."
    : activeTab === "completed"
    ? "No hay órdenes completadas."
    : activeTab === "cancelled"
    ? "No hay órdenes canceladas."
    : "Aún no se han registrado órdenes.";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Órdenes</h1>
        <span className="text-xs text-gray-400">
          Actualización automática cada 30s
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Cargando órdenes...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-400 text-lg">No hay órdenes</p>
          <p className="text-gray-400 text-sm mt-1">{emptyMessage}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase text-xs tracking-wider">
                    Mesa
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase text-xs tracking-wider">
                    Fuente
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase text-xs tracking-wider">
                    Items
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 uppercase text-xs tracking-wider">
                    Total
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500 uppercase text-xs tracking-wider">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 uppercase text-xs tracking-wider">
                    Hora
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-bold text-gray-900">
                          {order.serviceSession?.table?.number || "—"}
                        </span>
                        {order.serviceSession?.table?.name && (
                          <span className="text-xs text-gray-400 ml-1">
                            · {order.serviceSession.table.name}
                          </span>
                        )}
                      </div>
                      {order.customerName && (
                        <p className="text-xs text-gray-400">{order.customerName}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-gray-500">
                        {sourceLabel[order.source] || order.source}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="space-y-1">
                        {order.orderItems.map((item) => (
                          <div key={item.id} className="text-xs">
                            <span className="text-gray-900 font-medium">
                              {item.quantity}x {item.menuItem.name}
                            </span>
                            {item.variant && (
                              <span className="text-gray-500"> ({item.variant.name})</span>
                            )}
                            {item.modifiers && item.modifiers.length > 0 && (
                              <span className="text-gray-400">
                                {" "}
                                · {item.modifiers.map((m) => m.modifierName).join(", ")}
                              </span>
                            )}
                            {item.specialInstructions && (
                              <p className="text-gray-400 italic pl-2">
                                Nota: {item.specialInstructions}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900 whitespace-nowrap">
                      {formatPrice(order.total)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full border ${
                          statusColors[order.status] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {statusLabel[order.status] || order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-gray-400 whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleTimeString("es-MX", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
