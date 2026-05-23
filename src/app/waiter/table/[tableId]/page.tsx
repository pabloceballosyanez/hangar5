'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderItemModifier {
  id:           string;
  modifierName: string;
  priceDelta:   number;
}

interface OrderItem {
  id:                  string;
  quantity:            number;
  unitPrice:           number;
  specialInstructions: string | null;
  menuItem:            { name: string };
  variant:             { name: string } | null;
  modifiers:           OrderItemModifier[];
}

interface Order {
  id:         string;
  status:     string;
  source:     string;
  subtotal:   number;
  tax:        number;
  total:      number;
  createdAt:  string;
  notes:      string | null;
  orderItems: OrderItem[];
}

interface TableSession {
  id:       string;
  status:   string;
  openedAt: string;
  orders:   { id: string; status: string; total: number; createdAt: string }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT:      { label: 'Borrador',      color: 'text-slate-400'  },
  PLACED:     { label: 'Enviada',       color: 'text-blue-400'   },
  IN_KITCHEN: { label: 'En cocina',     color: 'text-yellow-400' },
  READY:      { label: 'Lista',         color: 'text-emerald-400'},
  SERVED:     { label: 'Servida',       color: 'text-purple-400' },
  PAID:       { label: 'Pagada',        color: 'text-slate-500'  },
  CANCELLED:  { label: 'Cancelada',     color: 'text-red-500'    },
};

function fmt(pesos: number) {
  return `$${pesos.toFixed(2)}`;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

// ── Order card ────────────────────────────────────────────────────────────────

function OrderCard({ summary, onExpand }: {
  summary: { id: string; status: string; total: number; createdAt: string };
  onExpand: (id: string) => void;
}) {
  const st = STATUS_LABELS[summary.status] ?? { label: summary.status, color: 'text-slate-400' };
  return (
    <button
      onClick={() => onExpand(summary.id)}
      className="w-full flex items-center justify-between p-4 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/50 transition-all active:scale-[0.98] text-left"
    >
      <div>
        <p className="text-xs text-slate-500 mb-0.5">{fmtTime(summary.createdAt)}</p>
        <p className={`text-sm font-semibold ${st.color}`}>{st.label}</p>
      </div>
      <div className="text-right">
        <p className="text-white font-bold">{fmt(summary.total / 100)}</p>
        <p className="text-xs text-slate-500 mt-0.5">Ver detalle ›</p>
      </div>
    </button>
  );
}

// ── Order detail sheet ────────────────────────────────────────────────────────

function OrderDetailSheet({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  const st = STATUS_LABELS[order.status] ?? { label: order.status, color: 'text-slate-400' };
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 rounded-t-3xl max-h-[85dvh] flex flex-col border-t-2 border-amber-400/20 shadow-2xl">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
          <div>
            <p className="font-bold text-white text-base">Orden #{order.id.slice(-6).toUpperCase()}</p>
            <p className={`text-sm ${st.color}`}>{st.label} · {fmtTime(order.createdAt)}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        {/* Items */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
          {order.orderItems.map((item) => (
            <div key={item.id} className="flex gap-3">
              <div className="w-8 h-8 bg-amber-400/10 border border-amber-400/20 rounded-lg flex items-center justify-center text-amber-400 font-bold text-sm shrink-0">
                {item.quantity}×
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm leading-tight">
                  {item.menuItem.name}
                  {item.variant && <span className="text-slate-400"> · {item.variant.name}</span>}
                </p>
                {item.modifiers.map((m) => (
                  <p key={m.id} className="text-xs text-slate-500">+ {m.modifierName}</p>
                ))}
                {item.specialInstructions && (
                  <p className="text-xs text-amber-400/70 italic mt-0.5">"{item.specialInstructions}"</p>
                )}
              </div>
              <p className="text-white text-sm font-mono shrink-0">
                {fmt(item.unitPrice * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="px-5 py-4 border-t border-slate-800 space-y-1">
          <div className="flex justify-between text-sm text-slate-400">
            <span>Subtotal</span><span>{fmt(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-400">
            <span>IVA (16%)</span><span>{fmt(order.tax)}</span>
          </div>
          <div className="flex justify-between font-bold text-white text-base pt-1 border-t border-slate-700">
            <span>Total</span><span className="text-amber-400">{fmt(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Cuenta sheet ──────────────────────────────────────────────────────────────

function CuentaSheet({
  session,
  onClose,
}: {
  session: TableSession;
  onClose: () => void;
}) {
  const activeOrders = session.orders.filter(o => !['PAID', 'CANCELLED'].includes(o.status));
  const grandTotal   = activeOrders.reduce((s, o) => s + o.total, 0);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 rounded-t-3xl border-t-2 border-amber-400/20 shadow-2xl">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-700 rounded-full" />
        </div>
        <div className="px-5 py-4">
          <h2 className="font-black text-white text-xl mb-4">💳 Cuenta</h2>
          <div className="space-y-2 mb-4">
            {activeOrders.map((o, i) => (
              <div key={o.id} className="flex justify-between text-sm">
                <span className="text-slate-400">Orden {i + 1} — {STATUS_LABELS[o.status]?.label ?? o.status}</span>
                <span className="text-white">{fmt(o.total / 100)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-700 pt-3 flex justify-between">
            <span className="font-bold text-white text-lg">Total</span>
            <span className="font-black text-amber-400 text-2xl font-mono">{fmt(grandTotal / 100)}</span>
          </div>
          <p className="text-xs text-slate-500 mt-3 text-center">
            Procesa el pago en el sistema de caja
          </p>
          <button
            onClick={onClose}
            className="w-full mt-4 py-4 bg-slate-800 text-white rounded-xl font-semibold active:scale-95 transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function WaiterTablePage() {
  const router   = useRouter();
  const params   = useParams();
  const tableId  = params.tableId as string;

  const [sessions,      setSessions]     = useState<TableSession[]>([]);
  const [tableNumber,   setTableNumber]  = useState('');
  const [loading,       setLoading]      = useState(true);
  const [opening,       setOpening]      = useState(false);
  const [closing,       setClosing]      = useState(false);
  const [error,         setError]        = useState<string | null>(null);
  const [expandOrder,   setExpandOrder]  = useState<Order | null>(null);
  const [loadingOrder,  setLoadingOrder] = useState<string | null>(null);
  const [showCuenta,    setShowCuenta]   = useState(false);
  const [closeError,    setCloseError]   = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch table details + sessions
      const [tableRes, sessRes] = await Promise.all([
        fetch(`/api/admin/restaurant/tables/${tableId}`, { cache: 'no-store' }),
        fetch(`/api/admin/restaurant/tables/${tableId}/sessions`, { cache: 'no-store' }),
      ]);
      if (!tableRes.ok) throw new Error('Mesa no encontrada');
      if (!sessRes.ok)  throw new Error('Error al cargar sesiones');
      const tableData = await tableRes.json();
      const sessData  = await sessRes.json();
      setTableNumber(tableData.number);
      setSessions(sessData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [tableId]);

  useEffect(() => {
    if (!sessionStorage.getItem('waiterName')) {
      router.replace('/waiter/login');
      return;
    }
    loadData();
  }, [router, loadData]);

  const openSession = async () => {
    setOpening(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/restaurant/tables/${tableId}/sessions`, {
        method: 'POST',
      });
      if (!res.ok) {
        const d = await res.json();
        // If session already exists, reload
        if (res.status === 409) { await loadData(); return; }
        throw new Error(d.error ?? 'Error al abrir mesa');
      }
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setOpening(false);
    }
  };

  const closeSession = async (sessionId: string) => {
    setClosing(true);
    setCloseError(null);
    try {
      const res = await fetch(
        `/api/admin/restaurant/tables/${tableId}/sessions/${sessionId}`,
        { method: 'PUT' }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al cerrar mesa');
      router.push('/waiter');
    } catch (e) {
      setCloseError(e instanceof Error ? e.message : 'Error al cerrar mesa');
    } finally {
      setClosing(false);
    }
  };

  const expandOrderDetail = async (orderId: string) => {
    setLoadingOrder(orderId);
    try {
      const res = await fetch(`/api/admin/restaurant/orders/${orderId}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Error al cargar orden');
      setExpandOrder(await res.json());
    } catch { /* ignore */ } finally {
      setLoadingOrder(null);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const openSession_ = sessions.find(s => s.status === 'OPEN');
  const activeOrders = openSession_
    ? openSession_.orders.filter(o => !['PAID', 'CANCELLED'].includes(o.status))
    : [];
  const grandTotal = activeOrders.reduce((s, o) => s + o.total, 0);

  return (
    <div className="min-h-screen bg-slate-950 pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.push('/waiter')}
          className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          ←
        </button>
        <div className="flex-1">
          <h1 className="font-black text-white text-xl leading-tight">Mesa {tableNumber}</h1>
          {openSession_ && (
            <p className="text-xs text-emerald-400">
              Sesión abierta · {fmtTime(openSession_.openedAt)}
            </p>
          )}
        </div>
        {openSession_ && grandTotal > 0 && (
          <button
            onClick={() => setShowCuenta(true)}
            className="text-sm bg-amber-500/20 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-lg font-semibold"
          >
            ${(grandTotal / 100).toFixed(0)}
          </button>
        )}
      </header>

      <div className="px-4 py-5 space-y-5">
        {/* Error */}
        {error && (
          <div className="p-3 bg-red-950/50 border border-red-700/40 rounded-xl text-sm text-red-300">
            {error}
          </div>
        )}

        {/* ── NO open session ── */}
        {!openSession_ && (
          <div className="flex flex-col items-center gap-5 py-10">
            <div className="text-6xl">🪑</div>
            <div className="text-center">
              <p className="font-bold text-white text-lg">Mesa cerrada</p>
              <p className="text-sm text-slate-400 mt-1">Ábrela para tomar pedidos</p>
            </div>
            <button
              onClick={openSession}
              disabled={opening}
              className="min-h-[56px] px-8 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-900 font-black text-lg rounded-2xl transition-all disabled:opacity-50 shadow-lg shadow-amber-500/30"
            >
              {opening ? 'Abriendo…' : '🔓 Abrir mesa'}
            </button>
          </div>
        )}

        {/* ── Open session ── */}
        {openSession_ && (
          <>
            {/* Orders list */}
            {activeOrders.length === 0 ? (
              <div className="text-center py-8 text-slate-600">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-sm">Sin pedidos aún</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold px-1">
                  Pedidos activos
                </p>
                {activeOrders.map((o) => (
                  <div key={o.id} className="relative">
                    {loadingOrder === o.id && (
                      <div className="absolute inset-0 bg-slate-900/50 rounded-xl flex items-center justify-center z-10">
                        <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    <OrderCard summary={o} onExpand={expandOrderDetail} />
                  </div>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3 pt-2">
              {/* Add order */}
              <button
                onClick={() => router.push(`/waiter/table/${tableId}/order`)}
                className="w-full min-h-[60px] bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-900 font-black text-lg rounded-2xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <span className="text-2xl">+</span>
                <span>Agregar pedido</span>
              </button>

              {/* Ver cuenta */}
              {grandTotal > 0 && (
                <button
                  onClick={() => setShowCuenta(true)}
                  className="w-full min-h-[56px] bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  <span>💳</span>
                  <span>Ver cuenta · {fmt(grandTotal / 100)}</span>
                </button>
              )}

              {/* Close session */}
              <button
                onClick={() => closeSession(openSession_.id)}
                disabled={closing}
                className="w-full min-h-[56px] bg-slate-800/50 hover:bg-red-950/50 border border-slate-700 hover:border-red-700/50 active:scale-95 text-slate-400 hover:text-red-400 font-semibold rounded-2xl transition-all disabled:opacity-50"
              >
                {closing ? 'Cerrando…' : '🔒 Cerrar mesa'}
              </button>

              {closeError && (
                <p className="text-sm text-red-400 text-center px-2">{closeError}</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Order detail sheet */}
      {expandOrder && (
        <OrderDetailSheet order={expandOrder} onClose={() => setExpandOrder(null)} />
      )}

      {/* Cuenta sheet */}
      {showCuenta && openSession_ && (
        <CuentaSheet session={openSession_} onClose={() => setShowCuenta(false)} />
      )}
    </div>
  );
}
