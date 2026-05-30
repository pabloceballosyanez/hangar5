'use client';

import { useState, useEffect, useCallback } from 'react';
import { MarkReadyButton } from './MarkReadyButton';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getUrgency(elapsedMinutes: number): 'low' | 'medium' | 'high' {
  if (elapsedMinutes >= 30) return 'high';
  if (elapsedMinutes >= 15) return 'medium';
  return 'low';
}

const stationLabel: Record<string, string> = {
  KITCHEN: 'Cocina',
  BAR: 'Bar',
  COLD_STATION: 'Estación Fría',
};

const sourceLabel: Record<string, string> = {
  WAITER: 'Mesero',
  QR: 'QR',
  ADMIN: 'Admin',
};

const urgencyBorderBg: Record<string, string> = {
  low: 'border-green-400 bg-green-50',
  medium: 'border-amber-400 bg-amber-50',
  high: 'border-red-400 bg-red-50',
};

const urgencyDot: Record<string, string> = {
  low: 'bg-green-500',
  medium: 'bg-amber-500',
  high: 'bg-red-500',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface KDSItem {
  id: string;
  menuItemName: string;
  variantName: string | null;
  quantity: number;
  specialInstructions: string | null;
  modifiers: { modifierName: string; priceDelta: number }[];
  status: string;
  prepStation: string;
}

interface KDSOrder {
  id: string;
  tableNumber: string | number;
  tableName: string | null;
  source: string;
  status: string;
  customerName: string | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
  elapsed: number;
  urgency: 'low' | 'medium' | 'high';
  items: KDSItem[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function KDSPage() {
  const [orders, setOrders] = useState<KDSOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/restaurant/kds');
      if (!res.ok) return;
      const grouped = await res.json();

      const now = Date.now();
      const allOrders: KDSOrder[] = [];

      for (const [, stationOrders] of Object.entries(grouped) as [string, unknown[]][]) {
        for (const raw of stationOrders) {
          const o = raw as Record<string, unknown>;
          const items = (o.items as Array<Record<string, unknown>>) || [];
          const elapsedMs = now - new Date(o.createdAt as string).getTime();
          const elapsedMinutes = Math.floor(elapsedMs / 60000);

          allOrders.push({
            id: o.orderId as string,
            tableNumber: (o.table as Record<string, unknown>)?.number as string | number,
            tableName: ((o.table as Record<string, unknown>)?.name as string) || null,
            source: o.source as string,
            status: o.orderStatus as string,
            customerName: (o.customerName as string) || null,
            paymentMethod: (o.paymentMethod as string) || null,
            paymentStatus: (o.paymentStatus as string) || null,
            elapsed: elapsedMinutes,
            urgency: getUrgency(elapsedMinutes),
            items: items.map((item) => ({
              id: item.id as string,
              menuItemName: item.menuItem as string,
              variantName: (item.variant as string) || null,
              quantity: item.quantity as number,
              specialInstructions: (item.specialInstructions as string) || null,
              modifiers: (item.modifiers as string[])?.map((m: string) => ({
                modifierName: m,
                priceDelta: 0,
              })) || [],
              status: item.status as string,
              prepStation: (() => {
                for (const [station, ords] of Object.entries(grouped) as [string, unknown[]][]) {
                  if (ords.includes(raw)) return station;
                }
                return 'KITCHEN';
              })(),
            })),
          });
        }
      }

      setOrders(allOrders);
      setLastRefresh(new Date());
    } catch {
      // keep old data on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Group by station
  const stationSet = new Set<string>();
  for (const order of orders) {
    for (const item of order.items) {
      stationSet.add(item.prepStation);
    }
  }
  const stations = Array.from(stationSet);

  const stationOrderMap: Record<string, KDSOrder[]> = {};
  for (const station of stations) {
    stationOrderMap[station] = orders.filter((o) =>
      o.items.some((item) => item.prepStation === station)
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-4" />
          <p className="text-gray-400">Cargando órdenes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-white">Órdenes activas</h1>
          <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full font-medium animate-pulse">
            LIVE
          </span>
        </div>
        <span className="text-xs text-gray-500">
          Actualizado: {lastRefresh.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-16 text-center">
          <p className="text-xl font-medium text-gray-400">No hay órdenes activas</p>
          <p className="text-sm text-gray-500 mt-1">
            Todas las órdenes han sido completadas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {stations.map((station) => {
            const stationOrders = stationOrderMap[station] || [];
            if (stationOrders.length === 0) return null;

            return (
              <div key={station} className="space-y-3">
                <h2 className="text-lg font-bold px-1 text-white">
                  {stationLabel[station] || station}
                  <span className="text-sm font-normal text-gray-400 ml-2">
                    ({stationOrders.length})
                  </span>
                </h2>

                {stationOrders.map((order) => (
                  <div
                    key={order.id}
                    className={`rounded-xl border-2 p-4 ${
                      order.urgency === 'high'
                        ? 'border-red-500 bg-red-900/20'
                        : order.urgency === 'medium'
                          ? 'border-amber-500 bg-amber-900/20'
                          : 'border-green-500 bg-green-900/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                      <div>
                        {order.source === "QR" && order.customerName ? (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-black text-white">
                                👤 {order.customerName}
                              </span>
                              <span className="text-xs bg-blue-600/30 text-blue-300 px-1.5 py-0.5 rounded font-bold">📱</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              📍 Mesa {order.tableNumber}
                              {order.tableName ? ` · ${order.tableName}` : ""}
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-3xl font-black text-white">
                                {order.tableNumber}
                              </span>
                              {order.tableName && (
                                <span className="text-xs text-gray-400">
                                  {order.tableName}
                                </span>
                              )}
                            </div>
                            {order.customerName && (
                              <p className="text-xs text-gray-300 mt-0.5">👤 {order.customerName}</p>
                            )}
                          </>
                        )}
                        {order.paymentMethod && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {order.paymentMethod === "CASH" ? "💵 Efectivo" : order.paymentMethod === "MP" ? "💳 Tarjeta" : order.paymentMethod}
                            {order.paymentStatus === "COMPLETED" ? " ✅" : order.paymentStatus === "PENDING" ? " ⏳" : ""}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-white">
                          {order.elapsed < 60
                            ? `${order.elapsed} min`
                            : `${Math.floor(order.elapsed / 60)}h ${order.elapsed % 60}m`}
                        </span>
                        <span
                          className={`inline-block w-4 h-4 rounded-full ${
                            order.urgency === 'high'
                              ? 'bg-red-500'
                              : order.urgency === 'medium'
                                ? 'bg-amber-500'
                                : 'bg-green-500'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white/10 rounded-lg p-3"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-bold text-white">
                                {item.quantity}x {item.menuItemName}
                              </p>
                              {item.variantName && (
                                <p className="text-sm text-gray-300">
                                  Variante: {item.variantName}
                                </p>
                              )}
                              {item.modifiers.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.modifiers.map((mod, mi) => (
                                    <span
                                      key={mi}
                                      className="text-xs bg-white/20 text-gray-200 px-2 py-0.5 rounded-full border border-white/10"
                                    >
                                      {mod.modifierName}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {item.specialInstructions && (
                                <p className="text-sm text-yellow-400 font-medium mt-1 italic">
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
  );
}
