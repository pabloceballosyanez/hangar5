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
  status:              string;
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

interface ServiceSession {
  id:       string;
  status:   string;
  openedAt: string;
  orders:   {
    id: string; status: string; total: number; createdAt: string;
    orderItems?: { id: string; status: string }[];
  }[];
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

function OrderCard({ order, onExpand }: {
  order: Order;
  onExpand: (id: string) => void;
}) {
  const st = STATUS_LABELS[order.status] ?? { label: order.status, color: 'text-slate-400' };
  const items = order.orderItems || [];
  const readyItems = items.filter(i => i.status === 'READY').length;
  const pendingItems = items.filter(i => i.status !== 'READY' && i.status !== 'SERVED' && i.status !== 'CANCELLED').length;
  const isAllReady = items.length > 0 && pendingItems === 0 && readyItems > 0;
  const isPartial = readyItems > 0 && pendingItems > 0;
  
  let borderStyle = 'bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50';
  if (isAllReady) borderStyle = 'bg-emerald-950/60 border-2 border-emerald-500/50 hover:bg-emerald-950 animate-pulse';
  else if (isPartial) borderStyle = 'bg-amber-950/50 border-2 border-amber-500/40 hover:bg-amber-950';
  
  return (
    <button
      onClick={() => onExpand(order.id)}
      className={`w-full flex items-center justify-between p-4 rounded-xl transition-all active:scale-[0.98] text-left ${borderStyle}`}
    >
      <div>
        <p className="text-xs text-slate-500 mb-0.5">{fmtTime(order.createdAt)}</p>
        <p className={`text-sm font-semibold ${st.color}`}>
          {isAllReady && <span className="mr-1">🍽</span>}
          {isPartial && <span className="mr-1">🍹</span>}
          {st.label}
        </p>
      </div>
      <div className="text-right">
        <p className="text-white font-bold">{fmt(order.total / 100)}</p>
        {readyItems > 0 && (
          <p className={`text-xs mt-0.5 ${isAllReady ? 'text-green-400 font-bold' : 'text-amber-400'}`}>
            {readyItems}/{items.length} listos
          </p>
        )}
        <p className="text-xs text-slate-500 mt-0.5">Ver detalle ›</p>
      </div>
    </button>
  );
}

// ── Order detail sheet ────────────────────────────────────────────────────────

function OrderDetailSheet({
  order,
  onClose,
  onDeliver,
}: {
  order: Order;
  onClose: () => void;
  onDeliver?: () => void;
}) {
  const st = STATUS_LABELS[order.status] ?? { label: order.status, color: 'text-slate-400' };
  const items = order.orderItems || [];
  const readyItems = items.filter(i => i.status === 'READY');
  const inPrepItems = items.filter(i => i.status !== 'READY' && i.status !== 'SERVED' && i.status !== 'CANCELLED');
  const servedItems = items.filter(i => i.status === 'SERVED');
  
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 rounded-t-3xl max-h-[85dvh] flex flex-col border-t-2 border-amber-400/20 shadow-2xl">
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-slate-700 rounded-full" /></div>

        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
          <div>
            <p className="font-bold text-white text-base">Orden #{order.id.slice(-6).toUpperCase()}</p>
            <p className={`text-sm ${st.color}`}>{st.label} · {fmtTime(order.createdAt)}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {readyItems.length > 0 && (
            <div>
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">✅ Listo para entregar ({readyItems.length})</p>
              <div className="space-y-2">
                {readyItems.map(item => (
                  <div key={item.id} className="flex gap-3 bg-emerald-950/40 border border-emerald-500/20 rounded-lg p-3">
                    <div className="w-8 h-8 bg-emerald-400/20 border border-emerald-400/30 rounded-lg flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">{item.quantity}×</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm leading-tight">
                        {item.menuItem.name}
                        {item.variant && <span className="text-slate-400"> · {item.variant.name}</span>}
                      </p>
                      {item.modifiers.map(m => <p key={m.id} className="text-xs text-slate-500">+ {m.modifierName}</p>)}
                    </div>
                    <p className="text-white text-sm font-mono shrink-0">{fmt(item.unitPrice * item.quantity)}</p>
                  </div>
                ))}
              </div>
              {onDeliver && (
                <button onClick={onDeliver} className="mt-2 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg active:scale-[0.98] transition-all">
                  ✅ Entregar {readyItems.length} ítem{readyItems.length !== 1 ? 'es' : ''}
                </button>
              )}
            </div>
          )}
          {inPrepItems.length > 0 && (
            <div>
              <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-2">⏳ En preparación ({inPrepItems.length})</p>
              <div className="space-y-2">
                {inPrepItems.map(item => (
                  <div key={item.id} className="flex gap-3 bg-slate-800/60 border border-slate-700/50 rounded-lg p-3">
                    <div className="w-8 h-8 bg-amber-400/10 border border-amber-400/20 rounded-lg flex items-center justify-center text-amber-400 font-bold text-sm shrink-0">{item.quantity}×</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm leading-tight">
                        {item.menuItem.name}
                        {item.variant && <span className="text-slate-400"> · {item.variant.name}</span>}
                      </p>
                      {item.modifiers.map(m => <p key={m.id} className="text-xs text-slate-500">+ {m.modifierName}</p>)}
                      {item.specialInstructions && <p className="text-xs text-amber-400/70 italic mt-0.5">"{item.specialInstructions}"</p>}
                    </div>
                    <p className="text-white text-sm font-mono shrink-0">{fmt(item.unitPrice * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {servedItems.length > 0 && (
            <div>
              <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">🍽️ Ya entregado ({servedItems.length})</p>
              <div className="space-y-2 opacity-60">
                {servedItems.map(item => (
                  <div key={item.id} className="flex gap-3 bg-slate-800/40 border border-slate-700/30 rounded-lg p-3">
                    <div className="w-8 h-8 bg-slate-700/40 rounded-lg flex items-center justify-center text-slate-400 font-bold text-sm shrink-0">{item.quantity}×</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-400 font-medium text-sm leading-tight">{item.menuItem.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-800 space-y-1">
          <div className="flex justify-between text-sm text-slate-400"><span>Subtotal</span><span>{fmt(order.subtotal)}</span></div>
          <div className="flex justify-between text-sm text-slate-400"><span>IVA (16%)</span><span>{fmt(order.tax)}</span></div>
          <div className="flex justify-between font-bold text-white text-base pt-1 border-t border-slate-700"><span>Total</span><span className="text-amber-400">{fmt(order.total)}</span></div>
        </div>
      </div>
    </div>
  );
}

// ── Cuenta sheet ──────────────────────────────────────────────────────────────

const STATUS_PATH_TO_PAID = ['DRAFT', 'PLACED', 'IN_KITCHEN', 'READY', 'SERVED', 'PAID'];

async function advanceOrderToPaid(orderId: string, currentStatus: string, paymentMethod?: string): Promise<void> {
  let realStatus = currentStatus;
  try {
    const fresh = await fetch(`/api/admin/restaurant/orders/${orderId}`);
    if (fresh.ok) {
      const data = await fresh.json();
      if (data?.status && data.status !== currentStatus) realStatus = data.status as string;
    }
  } catch { /* use stale status as fallback */ }

  const startIdx = STATUS_PATH_TO_PAID.indexOf(realStatus);
  if (startIdx === -1 || realStatus === 'PAID' || realStatus === 'CANCELLED') return;
  for (let i = startIdx + 1; i < STATUS_PATH_TO_PAID.length; i++) {
    const nextStatus = STATUS_PATH_TO_PAID[i];
    const isLast = nextStatus === 'PAID';
    const body: Record<string, string> = { status: nextStatus };
    if (isLast && paymentMethod) body.paymentMethod = paymentMethod;
    const res = await fetch(`/api/admin/restaurant/orders/${orderId}/status`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error((d as { error?: string }).error ?? `Error al actualizar orden a ${nextStatus}`);
    }
    if (nextStatus === 'PAID') break;
  }
}

function CuentaSheet({
  session,
  onClose,
  onPaid,
}: {
  session: ServiceSession;
  onClose: () => void;
  onPaid:  () => void;
}) {
  const [paying,   setPaying]   = useState(false);
  const [paid,     setPaid]     = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const activeOrders = session.orders.filter(o => !['PAID', 'CANCELLED'].includes(o.status));
  const grandTotal   = activeOrders.reduce((s, o) => s + o.total, 0);

  const handlePay = async (method: 'CASH' | 'CARD') => {
    setPaying(true);
    setPayError(null);
    try {
      for (const order of activeOrders) {
        await advanceOrderToPaid(order.id, order.status, method);
      }
      setPaid(true);
      onPaid();
    } catch (e) {
      setPayError(e instanceof Error ? e.message : 'Error al procesar pago');
    } finally {
      setPaying(false);
    }
  };

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

          {paid ? (
            <div className="mt-4 p-4 bg-emerald-950/50 border border-emerald-700/40 rounded-xl text-center">
              <p className="text-emerald-400 font-bold text-lg">✅ Cobrado</p>
              <p className="text-xs text-emerald-600 mt-1">Pago procesado exitosamente</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-500 mt-3 mb-3 text-center">
                Selecciona método de pago
              </p>
              {payError && (
                <p className="text-sm text-red-400 text-center mb-3">{payError}</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handlePay('CASH')}
                  disabled={paying || activeOrders.length === 0}
                  className="min-h-[60px] bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-2xl transition-all disabled:opacity-50 flex flex-col items-center justify-center gap-1"
                >
                  <span className="text-2xl">💵</span>
                  <span className="text-sm">Efectivo</span>
                </button>
                <button
                  onClick={() => handlePay('CARD')}
                  disabled={paying || activeOrders.length === 0}
                  className="min-h-[60px] bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold rounded-2xl transition-all disabled:opacity-50 flex flex-col items-center justify-center gap-1"
                >
                  <span className="text-2xl">💳</span>
                  <span className="text-sm">Tarjeta</span>
                </button>
              </div>
              {paying && (
                <p className="text-center text-sm text-slate-400 mt-3 animate-pulse">
                  Procesando pago…
                </p>
              )}
            </>
          )}

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

  const [sessions,      setSessions]     = useState<ServiceSession[]>([]);
  const [tableNumber,   setTableNumber]  = useState('');
  const [loading,       setLoading]      = useState(true);
  const [opening,       setOpening]      = useState(false);
  const [closing,       setClosing]      = useState(false);
  const [error,         setError]        = useState<string | null>(null);
  const [expandOrder,   setExpandOrder]  = useState<Order | null>(null);
  const [loadingOrder,  setLoadingOrder] = useState<string | null>(null);
  const [showCuenta,    setShowCuenta]   = useState(false);
  const [closeError,    setCloseError]   = useState<string | null>(null);
  const [delivering,    setDelivering]   = useState(false);

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
    fetch('/api/auth/login').then(r => { if (!r.ok) router.replace('/login'); });
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

  const deliverReadyItems = async (orderId: string) => {
    setDelivering(true);
    setError(null);
    try {
      const fres = await fetch(`/api/admin/restaurant/orders/${orderId}`);
      if (!fres.ok) throw new Error('Error al obtener orden');
      const order = await fres.json() as Order;
      const readyIds = (order.orderItems || []).filter((i: OrderItem) => i.status === 'READY').map((i: OrderItem) => i.id);
      if (readyIds.length === 0) {
        setError('No hay ítems listos para entregar en esta orden.');
        setExpandOrder(null);
        return;
      }
      for (const itemId of readyIds) {
        await fetch(`/api/admin/restaurant/orders/${orderId}/items/${itemId}/status`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'SERVED' }),
        });
      }
      await loadData();
      setExpandOrder(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al entregar');
    } finally { setDelivering(false); }
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
                    <OrderCard order={o as unknown as Order} onExpand={expandOrderDetail} />
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
        <OrderDetailSheet order={expandOrder} onClose={() => setExpandOrder(null)} onDeliver={() => deliverReadyItems(expandOrder.id)} />
      )}

      {/* Cuenta sheet */}
      {showCuenta && openSession_ && (
        <CuentaSheet session={openSession_} onClose={() => setShowCuenta(false)} onPaid={loadData} />
      )}
    </div>
  );
}
