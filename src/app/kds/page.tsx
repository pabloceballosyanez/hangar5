'use client';

import { useState, useEffect, useCallback } from 'react';
import { SalirOPanel } from '@/components/SalirOPanel';
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

/* De dónde viene el pedido. MOSTRADOR es la barra del Despegue: se
   mostraba el texto crudo y en cocina no sabían qué significaba. */
const sourceLabel: Record<string, string> = {
  WAITER: 'Mesero',
  QR: 'QR',
  ADMIN: 'Admin',
  MOSTRADOR: 'Despegue',
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
  /* Quién está frente a la pantalla. Decide si el botón de salida vuelve
     al panel o cierra sesión: cocina no tiene acceso al admin. */
  const [puedeAdmin, setPuedeAdmin] = useState(true);

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

    /* Con qué rol se entró. Si es cocina, el botón de salida cierra
       sesión en vez de intentar volver al panel, que no le toca. */
    fetch('/api/auth/login')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const rol = d?.staff?.role;
        setPuedeAdmin(rol === 'SUPER_ADMIN' || rol === 'GERENTE' || rol === 'CAJA');
      })
      .catch(() => {});

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
      <div className="min-h-screen bg-ink text-snow flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brass mx-auto mb-4" />
          <p className="text-ash">Cargando órdenes…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink text-snow">
      {/* Encabezado. Antes el KDS entraba a pelo, sin forma de salir: en
          una tablet con la pantalla bloqueada no había vuelta al admin.
          Ahora lleva el mismo encabezado que la barra del Despegue. */}
      <header className="border-b border-hair px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-[family-name:var(--font-display)] text-xl text-snow">KDS Cocina</h1>
          <p className="text-xs text-smoke">
            {orders.length} {orders.length === 1 ? 'orden en curso' : 'órdenes en curso'}
            {' · '}
            <span className="text-brass">en vivo</span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline text-[11px] text-smoke tabular-nums">
            {lastRefresh.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <button
            onClick={fetchOrders}
            className="text-xs px-3 py-2 rounded-lg border border-hair text-ash hover:text-snow transition-colors"
          >
            Actualizar
          </button>
          {/* Salida. En pantalla bloqueada (PWA o kiosco) no hay botón
              atrás del navegador. Para quien no tiene acceso al panel,
              este botón cierra sesión en vez de rebotarlo. */}
          <SalirOPanel puedeAdmin={puedeAdmin} />
        </div>
      </header>

      {orders.length === 0 ? (
        <div className="p-6">
          <div className="rounded-xl border border-hair bg-ink-2 p-16 text-center">
            <p className="text-xl font-medium text-ash">No hay órdenes activas</p>
            <p className="text-sm text-smoke mt-1">Todo está al día en cocina.</p>
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
          {stations.map((station) => {
            const stationOrders = stationOrderMap[station] || [];
            if (stationOrders.length === 0) return null;

            return (
              <div key={station} className="space-y-3">
                <h2 className="text-lg font-bold px-1 text-snow">
                  {stationLabel[station] || station}
                  <span className="text-sm font-normal text-smoke ml-2">
                    ({stationOrders.length})
                  </span>
                </h2>

                {stationOrders.map((order) => (
                  <div
                    key={order.id}
                    className={`rounded-xl border-2 p-4 ${
                      order.urgency === 'high'
                        ? 'border-bad bg-bad/10'
                        : order.urgency === 'medium'
                          ? 'border-brass-dim bg-brass/10'
                          : 'border-good bg-good/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-hair">
                      <div>
                        {order.source === "QR" && order.customerName ? (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-black text-snow">
                                👤 {order.customerName}
                              </span>
                              <span className="text-xs bg-brass/15 text-brass px-1.5 py-0.5 rounded font-bold">📱</span>
                            </div>
                            <p className="text-xs text-smoke mt-0.5">
                              📍 Mesa {order.tableNumber}
                              {order.tableName ? ` · ${order.tableName}` : ""}
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-3xl font-black text-snow">
                                {order.tableNumber}
                              </span>
                              {order.tableName && (
                                <span className="text-xs text-smoke">
                                  {order.tableName}
                                </span>
                              )}
                            </div>
                            {order.customerName && (
                              <p className="text-xs text-ash mt-0.5">👤 {order.customerName}</p>
                            )}
                          </>
                        )}
                        {order.paymentMethod && (
                          <p className="text-xs text-smoke mt-0.5">
                            {order.paymentMethod === "CASH" ? "💵 Efectivo" : order.paymentMethod === "MP" ? "💳 Tarjeta" : order.paymentMethod}
                            {order.paymentStatus === "COMPLETED" ? " ✅" : order.paymentStatus === "PENDING" ? " ⏳" : ""}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-snow">
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
                              <p className="text-base font-bold text-snow">
                                {item.quantity}x {item.menuItemName}
                              </p>
                              {item.variantName && (
                                <p className="text-sm text-ash">
                                  Variante: {item.variantName}
                                </p>
                              )}
                              {item.modifiers.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.modifiers.map((mod, mi) => (
                                    <span
                                      key={mi}
                                      className="text-xs bg-ink-3 text-ash px-2 py-0.5 rounded-full border border-hair"
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

                    <div className="mt-2 text-xs text-smoke text-right">
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
