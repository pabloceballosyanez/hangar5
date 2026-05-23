'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface KDSItem {
  id:                   string;
  status:               string;
  quantity:             number;
  menuItem:             string;
  variant:              string | null;
  specialInstructions:  string | null;
  estimatedPrepMinutes: number | null;
  modifiers:            string[];
  elapsedSeconds:       number;
}

interface KDSOrder {
  orderId:        string;
  orderStatus:    string;
  table:          { number: string; name: string | null; location?: string | null };
  customerName:   string | null;
  notes:          string | null;
  source:         string;
  createdAt:      string;
  elapsedSeconds: number;
  items:          KDSItem[];
}

type KDSData = Record<string, KDSOrder[]>;

interface UndoEntry {
  orderId:        string;
  itemId:         string;
  itemName:       string;
  previousStatus: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getUrgency(elapsedSeconds: number): 'low' | 'medium' | 'high' {
  const minutes = elapsedSeconds / 60;
  if (minutes >= 30) return 'high';
  if (minutes >= 15) return 'medium';
  return 'low';
}

function fmtElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

const stationLabel: Record<string, string> = {
  KITCHEN:      '🍳 Cocina',
  BAR:          '🍸 Bar',
  COLD_STATION: '🥗 Estación Fría',
};

const stationEmoji: Record<string, string> = {
  KITCHEN:      '🍳',
  BAR:          '🍸',
  COLD_STATION: '🥗',
};

const sourceLabel: Record<string, string> = {
  WAITER: 'Mesero',
  QR:     'QR',
  ADMIN:  'Admin',
};

const urgencyBorderBg: Record<string, string> = {
  low:    'border-green-400 bg-green-50',
  medium: 'border-amber-400 bg-amber-50',
  high:   'border-red-400 bg-red-50',
};

const urgencyDot: Record<string, string> = {
  low:    'bg-green-500',
  medium: 'bg-amber-500',
  high:   'bg-red-500',
};

// ─── KDS Page ─────────────────────────────────────────────────────────────────

export default function KDSPage() {
  const [data,         setData]         = useState<KDSData>({});
  const [loading,      setLoading]      = useState(true);
  const [lastRefresh,  setLastRefresh]  = useState<Date>(new Date());
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  const [fadingItems,  setFadingItems]  = useState<Set<string>>(new Set());
  const [undoStack,    setUndoStack]    = useState<UndoEntry[]>([]);
  const [toast,        setToast]        = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/restaurant/kds', { cache: 'no-store' });
      if (!res.ok) throw new Error('Error al cargar KDS');
      const json: KDSData = await res.json();
      setData(json);
      setLastRefresh(new Date());
    } catch (e) {
      console.error('[KDS fetch]', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const markItemReady = async (
    orderId: string,
    itemId: string,
    itemName: string,
    previousStatus: string,
  ) => {
    setLoadingItems(prev => new Set(prev).add(itemId));
    try {
      const res = await fetch(
        `/api/admin/restaurant/orders/${orderId}/items/${itemId}/status`,
        {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ status: 'READY' }),
        },
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { error?: string }).error ?? 'Error al marcar item como listo');
      }
      // Push to undo stack (max 3)
      setUndoStack(prev => [
        { orderId, itemId, itemName, previousStatus },
        ...prev.slice(0, 2),
      ]);
      // Start fade-out animation
      setFadingItems(prev => new Set(prev).add(itemId));
      // After animation completes, refetch
      setTimeout(() => {
        setFadingItems(prev => { const n = new Set(prev); n.delete(itemId); return n; });
        fetchData();
      }, 600);
      showToast(`✅ ${itemName} — Listo`);
    } catch (e) {
      showToast(`❌ ${e instanceof Error ? e.message : 'Error'}`);
    } finally {
      setLoadingItems(prev => { const n = new Set(prev); n.delete(itemId); return n; });
    }
  };

  const undoItem = async (entry: UndoEntry) => {
    try {
      const res = await fetch(
        `/api/admin/restaurant/orders/${entry.orderId}/items/${entry.itemId}/status`,
        {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ status: entry.previousStatus }),
        },
      );
      if (!res.ok) throw new Error('Error al deshacer');
      setUndoStack(prev => prev.filter(u => u.itemId !== entry.itemId));
      await fetchData();
      showToast(`↩️ ${entry.itemName} — Deshecho`);
    } catch (e) {
      showToast(`❌ ${e instanceof Error ? e.message : 'Error al deshacer'}`);
    }
  };

  const stations    = Object.keys(data);
  const totalOrders = Object.values(data).reduce((s, orders) => s + orders.length, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">🍽️ KDS — Cocina</h1>
        <span className="text-xs text-gray-400">
          Auto-refresh cada 10s · {typeof window !== 'undefined' ? lastRefresh.toLocaleTimeString('es-MX') : '---'}
        </span>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-5 py-3 rounded-2xl shadow-xl pointer-events-none">
          {toast}
        </div>
      )}

      {/* Undo stack */}
      {undoStack.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {undoStack.map(entry => (
            <button
              key={entry.itemId}
              onClick={() => undoItem(entry)}
              className="text-xs bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors flex items-center gap-1 shadow-sm"
            >
              <span>↩️</span>
              <span>Deshacer</span>
              <span className="font-medium">{entry.itemName}</span>
            </button>
          ))}
        </div>
      )}

      {totalOrders === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
          <span className="text-6xl block mb-4">✅</span>
          <p className="text-xl font-medium text-gray-600">No hay órdenes activas</p>
          <p className="text-sm text-gray-400 mt-1">Todas las órdenes han sido completadas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {stations.map(station => {
            const stationOrders = data[station] ?? [];
            if (stationOrders.length === 0) return null;

            return (
              <div key={station} className="space-y-3">
                <h2 className="text-lg font-bold px-1 flex items-center gap-2 text-gray-800">
                  <span>{stationEmoji[station] ?? '🍽️'}</span>
                  <span>{stationLabel[station] ?? station}</span>
                  <span className="text-sm font-normal text-gray-400">
                    ({stationOrders.length})
                  </span>
                </h2>

                {stationOrders.map(order => {
                  const urgency = getUrgency(order.elapsedSeconds);
                  return (
                    <div
                      key={order.orderId}
                      className={`rounded-xl border-2 p-4 ${urgencyBorderBg[urgency]}`}
                    >
                      {/* Order header */}
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-black/10">
                        <div className="flex items-center gap-2">
                          <span className="text-3xl font-black text-gray-900">
                            {order.table.number}
                          </span>
                          {order.table.name && (
                            <span className="text-xs text-gray-600">{order.table.name}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-gray-700">
                            {fmtElapsed(order.elapsedSeconds)}
                          </span>
                          <span className={`inline-block w-4 h-4 rounded-full ${urgencyDot[urgency]}`} />
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-2">
                        {order.items.map(item => {
                          const isLoading = loadingItems.has(item.id);
                          const isFading  = fadingItems.has(item.id);
                          return (
                            <div
                              key={item.id}
                              style={{ transition: 'opacity 0.5s ease' }}
                              className={`bg-white/50 rounded-lg p-3 ${isFading ? 'opacity-0' : 'opacity-100'}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-base font-bold text-gray-900">
                                    {item.quantity}x {item.menuItem}
                                  </p>
                                  {item.variant && (
                                    <p className="text-sm text-gray-700">
                                      Variante: {item.variant}
                                    </p>
                                  )}
                                  {item.modifiers.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {item.modifiers.map((mod, mi) => (
                                        <span
                                          key={mi}
                                          className="text-xs bg-white text-gray-700 px-2 py-0.5 rounded-full border border-gray-300"
                                        >
                                          {mod}
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

                                {/* Listo button */}
                                <button
                                  onClick={() =>
                                    markItemReady(order.orderId, item.id, item.menuItem, item.status)
                                  }
                                  disabled={isLoading || isFading}
                                  className="shrink-0 min-w-[76px] px-3 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                                >
                                  {isLoading ? (
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                                  ) : (
                                    <>Listo ✓</>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Source footer */}
                      <div className="mt-2 text-xs text-gray-500 text-right">
                        {sourceLabel[order.source] ?? order.source}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
