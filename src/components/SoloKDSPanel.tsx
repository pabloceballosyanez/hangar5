'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface KDSItem {
  id: string;
  status: string;
  quantity: number;
  menuItem: string;
  variant: string | null;
  specialInstructions: string | null;
  estimatedPrepMinutes: number | null;
  modifiers: string[];
  elapsedSeconds: number;
}

interface KDSOrder {
  orderId: string;
  orderStatus: string;
  table: { number: string | number; name: string } | null;
  customerName: string | null;
  source: string;
  paymentMethod: string | null;
  paymentStatus: string | null;
  createdAt: string;
  elapsedSeconds: number;
  items: KDSItem[];
  station: string;
}

interface StationGroup {
  station: string;
  orders: KDSOrder[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATION_LABELS: Record<string, string> = {
  KITCHEN: 'Cocina',
  BAR: 'Bar',
  COLD_STATION: 'Estación Fría',
};

const STATION_ORDER = ['KITCHEN', 'BAR', 'COLD_STATION'];

const URGENCY_THRESHOLDS = {
  LOW_MAX: 10,     // < 10 min = green
  MEDIUM_MAX: 25,  // < 25 min = amber, >= 25 = red
} as const;

type Urgency = 'low' | 'medium' | 'high';

function getUrgency(elapsedSeconds: number): Urgency {
  const minutes = elapsedSeconds / 60;
  if (minutes >= URGENCY_THRESHOLDS.MEDIUM_MAX) return 'high';
  if (minutes >= URGENCY_THRESHOLDS.LOW_MAX) return 'medium';
  return 'low';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function urgencyBorder(urgency: Urgency): string {
  switch (urgency) {
    case 'high': return 'border-l-red-500';
    case 'medium': return 'border-l-amber-500';
    case 'low': return 'border-l-green-500';
  }
}

function urgencyBg(urgency: Urgency): string {
  switch (urgency) {
    case 'high': return 'bg-red-50';
    case 'medium': return 'bg-amber-50';
    case 'low': return 'bg-green-50';
  }
}

function urgencyTextColor(urgency: Urgency): string {
  switch (urgency) {
    case 'high': return 'text-red-600';
    case 'medium': return 'text-amber-600';
    case 'low': return 'text-green-600';
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SoloKDSPanel() {
  const [grouped, setGrouped] = useState<StationGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [optimisticReadyItems, setOptimisticReadyItems] = useState<Set<string>>(new Set());
  const optimisticRef = useRef(optimisticReadyItems);

  // Keep ref in sync (can't assign .current during render — React lint)
  useEffect(() => {
    optimisticRef.current = optimisticReadyItems;
  }, [optimisticReadyItems]);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/restaurant/kds');
      if (!res.ok) return;
      const data = await res.json() as Record<string, unknown[]>;

      const now = Date.now();
      const stationGroups: StationGroup[] = [];
      const currentOptimistic = optimisticRef.current;

      for (const station of STATION_ORDER) {
        const rawOrders = data[station];
        if (!rawOrders || rawOrders.length === 0) continue;

        const orders: KDSOrder[] = [];
        for (const raw of rawOrders) {
          const r = raw as Record<string, unknown>;
          const rawItems = (r.items as Array<Record<string, unknown>>) || [];

          // Recalculate elapsed from createdAt for freshness
          const createdAt = new Date(r.createdAt as string).getTime();
          const elapsedSeconds = Math.round((now - createdAt) / 1000);

          // Filter out items already optimistically marked ready
          const activeItems = rawItems
            .filter((item) => !currentOptimistic.has(item.id as string))
            .map((item) => ({
              id: item.id as string,
              status: item.status as string,
              quantity: item.quantity as number,
              menuItem: item.menuItem as string,
              variant: (item.variant as string) || null,
              specialInstructions: (item.specialInstructions as string) || null,
              estimatedPrepMinutes: (item.estimatedPrepMinutes as number) || null,
              modifiers: (item.modifiers as string[]) || [],
              elapsedSeconds: item.elapsedSeconds as number,
            }));

          if (activeItems.length === 0) continue;

          orders.push({
            orderId: r.orderId as string,
            orderStatus: r.orderStatus as string,
            table: (r.table as { number: string | number; name: string }) || null,
            customerName: (r.customerName as string) || null,
            source: r.source as string,
            paymentMethod: (r.paymentMethod as string) || null,
            paymentStatus: (r.paymentStatus as string) || null,
            createdAt: r.createdAt as string,
            elapsedSeconds,
            items: activeItems,
            station,
          });
        }

        if (orders.length > 0) {
          stationGroups.push({ station, orders });
        }
      }

      setGrouped(stationGroups);
      setLastRefresh(new Date());
      // Clear old optimistic IDs that are no longer in the data
      const allCurrentIds = new Set<string>();
      for (const sg of stationGroups) {
        for (const o of sg.orders) {
          for (const item of o.items) {
            allCurrentIds.add(item.id);
          }
        }
      }
      setOptimisticReadyItems((prev) => {
        const next = new Set<string>();
        for (const id of prev) {
          if (!allCurrentIds.has(id)) next.add(id);
        }
        return next;
      });
    } catch {
      // keep stale data on error
    } finally {
      setLoading(false);
    }
  }, []); // stable: reads optimisticRef.current at call time

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // ── Mark Ready ─────────────────────────────────────────────────────────────

  const markItemReady = useCallback(async (orderId: string, itemId: string) => {
    // Optimistic update
    setOptimisticReadyItems((prev) => new Set(prev).add(itemId));

    try {
      const res = await fetch(
        `/api/admin/restaurant/orders/${orderId}/items/${itemId}/status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'READY' }),
        }
      );
      if (!res.ok) {
        // Revert on failure
        setOptimisticReadyItems((prev) => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
      }
    } catch {
      setOptimisticReadyItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  }, []);

  const markAllItemsReady = useCallback(
    async (orderId: string, itemIds: string[]) => {
      const pendingIds = itemIds.filter((id) => !optimisticReadyItems.has(id));
      if (pendingIds.length === 0) return;

      // Optimistic update
      setOptimisticReadyItems((prev) => {
        const next = new Set(prev);
        for (const id of pendingIds) next.add(id);
        return next;
      });

      // Fire all requests in parallel
      const results = await Promise.allSettled(
        pendingIds.map((itemId) =>
          fetch(`/api/admin/restaurant/orders/${orderId}/items/${itemId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'READY' }),
          }).then((res) => {
            if (!res.ok) throw new Error('Failed');
          })
        )
      );

      // Revert any failed ones
      const failedIds = pendingIds.filter(
        (_, i) => results[i].status === 'rejected'
      );
      if (failedIds.length > 0) {
        setOptimisticReadyItems((prev) => {
          const next = new Set(prev);
          for (const id of failedIds) next.delete(id);
          return next;
        });
      }
    },
    [optimisticReadyItems]
  );

  // ── Stats ──────────────────────────────────────────────────────────────────

  const allOrders = grouped.flatMap((g) => g.orders);
  const totalItems = allOrders.reduce((sum, o) => sum + o.items.length, 0);
  const urgentCount = allOrders.filter((o) => getUrgency(o.elapsedSeconds) === 'high').length;
  const avgWaitSeconds =
    allOrders.length > 0
      ? Math.round(allOrders.reduce((s, o) => s + o.elapsedSeconds, 0) / allOrders.length)
      : 0;

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1b4235] mx-auto mb-3" />
          <p className="text-sm text-gray-400">Cargando cocina...</p>
        </div>
      </div>
    );
  }

  // ── Empty State ────────────────────────────────────────────────────────────

  if (allOrders.length === 0) {
    return (
      <div className="h-full flex flex-col bg-white">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between shrink-0">
          <h1 className="text-sm font-bold text-[#1b4235] uppercase tracking-wider">
            Cocina
          </h1>
          <span className="text-[10px] text-gray-400">
            {lastRefresh.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        {/* Empty */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-sm font-medium text-gray-400">No hay órdenes activas</p>
            <p className="text-xs text-gray-300 mt-1">Todo está al día en cocina</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-bold text-[#1b4235] uppercase tracking-wider">
            Cocina
          </h1>
          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium animate-pulse">
            LIVE
          </span>
        </div>
        <span className="text-[10px] text-gray-400">
          {lastRefresh.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>

      {/* Orders scroll area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {grouped.map(({ station, orders }) => (
          <div key={station}>
            {/* Station Header */}
            <div className="flex items-center gap-2 mb-2 px-1">
              <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                {STATION_LABELS[station] || station}
              </h2>
              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">
                {orders.reduce((sum, o) => sum + o.items.length, 0)}
              </span>
            </div>

            {/* Order Cards */}
            <div className="space-y-2">
              {orders.map((order) => {
                const urgency = getUrgency(order.elapsedSeconds);

                return (
                  <div
                    key={order.orderId}
                    className={`bg-white border border-gray-100 border-l-4 ${urgencyBorder(urgency)} rounded-lg shadow-sm overflow-hidden`}
                  >
                    {/* Card Header */}
                    <div className={`px-3 py-2 flex items-center justify-between ${urgencyBg(urgency)}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Table info */}
                        {order.table ? (
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-base font-black text-[#1b4235] leading-none">
                              {order.table.number}
                            </span>
                            {order.table.name && (
                              <span className="text-[10px] text-gray-400 truncate max-w-[80px]">
                                {order.table.name}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-base font-black text-[#1b4235]">—</span>
                        )}

                        {/* Customer name */}
                        {order.customerName && (
                          <span className="text-[10px] text-gray-500 truncate max-w-[100px]">
                            👤 {order.customerName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Elapsed time */}
                        <span className={`text-xs font-bold ${urgencyTextColor(urgency)}`}>
                          {formatElapsed(order.elapsedSeconds)}
                        </span>

                        {/* Urgency dot with pulse for urgent */}
                        <span
                          className={`inline-block w-2.5 h-2.5 rounded-full ${
                            urgency === 'high'
                              ? 'bg-red-500 animate-pulse'
                              : urgency === 'medium'
                                ? 'bg-amber-500'
                                : 'bg-green-500'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Items */}
                    <div className="px-3 py-2 space-y-1.5">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-start gap-2 group">
                          {/* Individual mark-ready button */}
                          <button
                            onClick={() => markItemReady(order.orderId, item.id)}
                            disabled={optimisticReadyItems.has(item.id)}
                            className="shrink-0 mt-0.5 w-4 h-4 rounded border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-green-50 hover:border-green-400 disabled:opacity-50 disabled:bg-green-50 disabled:border-green-400"
                            title="Marcar listo"
                          >
                            {optimisticReadyItems.has(item.id) ? (
                              <span className="text-[10px] text-green-600 leading-none">✓</span>
                            ) : null}
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-1">
                              <span className="text-xs font-bold text-[#1b4235]">
                                {item.quantity}× {item.menuItem}
                              </span>
                              {item.variant && (
                                <span className="text-[10px] text-gray-400">
                                  · {item.variant}
                                </span>
                              )}
                            </div>

                            {/* Modifiers */}
                            {item.modifiers.length > 0 && (
                              <div className="flex flex-wrap gap-0.5 mt-0.5">
                                {item.modifiers.map((mod, mi) => (
                                  <span
                                    key={mi}
                                    className="text-[10px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded border border-gray-100"
                                  >
                                    {mod}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Special instructions */}
                            {item.specialInstructions && (
                              <p className="text-[10px] text-amber-600 font-medium mt-0.5 italic">
                                ⚠ {item.specialInstructions}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Mark all ready button */}
                    {order.items.some((i) => !optimisticReadyItems.has(i.id)) && (
                      <div className="px-2 pb-2">
                        <button
                          onClick={() =>
                            markAllItemsReady(
                              order.orderId,
                              order.items.map((i) => i.id)
                            )
                          }
                          className="w-full text-center text-[11px] font-medium text-gray-400 py-1.5 rounded-md bg-gray-50 hover:bg-green-50 hover:text-green-600 transition-colors"
                        >
                          ✓ Marcar listo ({order.items.filter((i) => !optimisticReadyItems.has(i.id)).length})
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Stats */}
      <div className="shrink-0 px-4 py-2 border-t border-gray-100 bg-gray-50/50">
        <div className="flex gap-2">
          <div className="flex-1 text-center px-2 py-1.5 bg-white rounded border border-gray-100">
            <div className="text-xs font-bold text-[#1b4235]">{totalItems}</div>
            <div className="text-[9px] text-gray-400">Pendientes</div>
          </div>
          <div className={`flex-1 text-center px-2 py-1.5 bg-white rounded border ${urgentCount > 0 ? 'border-red-200' : 'border-gray-100'}`}>
            <div className={`text-xs font-bold ${urgentCount > 0 ? 'text-red-600' : 'text-[#1b4235]'}`}>
              {urgentCount}
            </div>
            <div className="text-[9px] text-gray-400">Urgentes</div>
          </div>
          <div className="flex-1 text-center px-2 py-1.5 bg-white rounded border border-gray-100">
            <div className="text-xs font-bold text-[#1b4235]">
              {formatElapsed(avgWaitSeconds)}
            </div>
            <div className="text-[9px] text-gray-400">Promedio</div>
          </div>
        </div>
      </div>
    </div>
  );
}
