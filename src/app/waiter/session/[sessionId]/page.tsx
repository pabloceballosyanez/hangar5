'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderItemModifier {
  id: string; modifierName: string; priceDelta: number;
}
interface OrderItem {
  id: string; quantity: number; unitPrice: number; specialInstructions: string | null;
  menuItem: { name: string }; variant: { name: string } | null; modifiers: OrderItemModifier[];
}
interface Order {
  id: string; status: string; source: string; subtotal: number; tax: number; total: number;
  createdAt: string; notes: string | null; orderItems: OrderItem[];
}
interface Session {
  id: string; type: string; label: string; status: string; openedAt: string;
  table: { number: string; name: string | null } | null;
  customer: { id: string; name: string } | null;
  orders: { id: string; status: string; total: number; createdAt: string }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Borrador', color: 'text-slate-400' },
  PLACED: { label: 'Enviada', color: 'text-blue-400' },
  IN_KITCHEN: { label: 'En cocina', color: 'text-yellow-400' },
  READY: { label: 'Lista', color: 'text-emerald-400' },
  SERVED: { label: 'Servida', color: 'text-purple-400' },
  PAID: { label: 'Pagada', color: 'text-slate-500' },
  CANCELLED: { label: 'Cancelada', color: 'text-red-500' },
};
function fmt(p: number) { return `$${p.toFixed(2)}`; }
function fmtTime(iso: string) { return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }); }

const typeLabel: Record<string, string> = { TABLE: 'Mesa', TAB: 'Tab', WALKIN: 'Walk-in' };

// ── Order card ────────────────────────────────────────────────────────────────

function OrderCard({ summary, onExpand }: {
  summary: { id: string; status: string; total: number; createdAt: string };
  onExpand: (id: string) => void;
}) {
  const st = STATUS_LABELS[summary.status] ?? { label: summary.status, color: 'text-slate-400' };
  return (
    <button onClick={() => onExpand(summary.id)} className="w-full flex items-center justify-between p-4 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/50 transition-all active:scale-[0.98] text-left">
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

function OrderDetailSheet({ order, onClose }: { order: Order; onClose: () => void }) {
  const st = STATUS_LABELS[order.status] ?? { label: order.status, color: 'text-slate-400' };
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
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
          {order.orderItems.map(item => (
            <div key={item.id} className="flex gap-3">
              <div className="w-8 h-8 bg-amber-400/10 border border-amber-400/20 rounded-lg flex items-center justify-center text-amber-400 font-bold text-sm shrink-0">{item.quantity}×</div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm leading-tight">
                  {item.menuItem.name}
                  {item.variant && <span className="text-slate-400"> · {item.variant.name}</span>}
                </p>
                {item.modifiers.map(m => <p key={m.id} className="text-xs text-slate-500">+ {m.modifierName}</p>)}
                {item.specialInstructions && <p className="text-xs text-amber-400/70 italic mt-0.5">"{item.specialInstructions}"</p>}
              </div>
              <p className="text-white text-sm font-mono shrink-0">{fmt(item.unitPrice * item.quantity / 100)}</p>
            </div>
          ))}
        </div>
        <div className="px-5 py-4 border-t border-slate-800 space-y-1">
          <div className="flex justify-between text-sm text-slate-400"><span>Subtotal</span><span>{fmt(order.subtotal / 100)}</span></div>
          <div className="flex justify-between text-sm text-slate-400"><span>IVA (16%)</span><span>{fmt(order.tax / 100)}</span></div>
          <div className="flex justify-between font-bold text-white text-base pt-1 border-t border-slate-700"><span>Total</span><span className="text-amber-400">{fmt(order.total / 100)}</span></div>
        </div>
      </div>
    </div>
  );
}

// ── Payment sheet ─────────────────────────────────────────────────────────────

const STATUS_PATH_TO_PAID = ['DRAFT', 'PLACED', 'IN_KITCHEN', 'READY', 'SERVED', 'PAID'];

async function advanceOrderToPaid(orderId: string, currentStatus: string): Promise<void> {
  const startIdx = STATUS_PATH_TO_PAID.indexOf(currentStatus);
  if (startIdx === -1 || currentStatus === 'PAID' || currentStatus === 'CANCELLED') return;
  for (let i = startIdx + 1; i < STATUS_PATH_TO_PAID.length; i++) {
    const res = await fetch(`/api/admin/restaurant/orders/${orderId}/status`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: STATUS_PATH_TO_PAID[i] }),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error((d as { error?: string }).error ?? 'Error'); }
    if (STATUS_PATH_TO_PAID[i] === 'PAID') break;
  }
}

function CuentaSheet({ session, onClose, onPaid }: { session: Session; onClose: () => void; onPaid: () => void }) {
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const activeOrders = session.orders.filter(o => !['PAID', 'CANCELLED'].includes(o.status));
  const grandTotal = activeOrders.reduce((s, o) => s + o.total, 0);

  const handlePay = async (_method: 'CASH' | 'CARD') => {
    setPaying(true); setPayError(null);
    try {
      for (const order of activeOrders) await advanceOrderToPaid(order.id, order.status);
      setPaid(true); onPaid();
    } catch (e) {
      setPayError(e instanceof Error ? e.message : 'Error al procesar pago');
    } finally { setPaying(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 rounded-t-3xl border-t-2 border-amber-400/20 shadow-2xl">
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-slate-700 rounded-full" /></div>
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
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-500 mt-3 mb-3 text-center">Selecciona método de pago</p>
              {payError && <p className="text-sm text-red-400 text-center mb-3">{payError}</p>}
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handlePay('CASH')} disabled={paying || activeOrders.length === 0}
                  className="min-h-[60px] bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-2xl transition-all disabled:opacity-50 flex flex-col items-center justify-center gap-1">
                  <span className="text-2xl">💵</span><span className="text-sm">Efectivo</span>
                </button>
                <button onClick={() => handlePay('CARD')} disabled={paying || activeOrders.length === 0}
                  className="min-h-[60px] bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold rounded-2xl transition-all disabled:opacity-50 flex flex-col items-center justify-center gap-1">
                  <span className="text-2xl">💳</span><span className="text-sm">Tarjeta</span>
                </button>
              </div>
              {paying && <p className="text-center text-sm text-slate-400 mt-3 animate-pulse">Procesando pago…</p>}
            </>
          )}
          <button onClick={onClose} className="w-full mt-4 py-4 bg-slate-800 text-white rounded-xl font-semibold active:scale-95 transition-all">Cerrar</button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function WaiterSessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandOrder, setExpandOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState<string | null>(null);
  const [showCuenta, setShowCuenta] = useState(false);
  const [closing, setClosing] = useState(false);

  const loadSession = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/restaurant/sessions/${sessionId}`);
      if (!res.ok) throw new Error('Sesión no encontrada');
      setSession(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally { setLoading(false); }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionStorage.getItem('waiterName')) { router.replace('/waiter/login'); return; }
    loadSession();
  }, [router, loadSession]);

  const expandOrderDetail = async (orderId: string) => {
    setLoadingOrder(orderId);
    try {
      const res = await fetch(`/api/admin/restaurant/orders/${orderId}`);
      if (!res.ok) throw new Error('Error');
      setExpandOrder(await res.json());
    } catch { /* ignore */ } finally { setLoadingOrder(null); }
  };

  const closeSession = async () => {
    setClosing(true);
    try {
      const res = await fetch(`/api/admin/restaurant/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payments: [] }),
      });
      // Even if close fails (needs payment), try the legacy close via table sessions
      if (!res.ok) {
        // Try to advance all orders to PAID and mark session closed via status
        const activeOrders = session?.orders.filter(o => !['PAID', 'CANCELLED'].includes(o.status)) || [];
        for (const o of activeOrders) {
          try { await advanceOrderToPaid(o.id, o.status); } catch { /* ignore */ }
        }
        // Try closing again
        await fetch(`/api/admin/restaurant/sessions/${sessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payments: [{ method: 'CASH', amount: 0 }] }),
        });
      }
      router.push('/waiter');
    } catch { /* ignore */ } finally { setClosing(false); }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <p className="text-red-400">{error || 'Sesión no encontrada'}</p>
        <button onClick={() => router.push('/waiter')} className="text-amber-400 text-sm">← Volver</button>
      </div>
    );
  }

  const activeOrders = session.orders.filter(o => !['PAID', 'CANCELLED'].includes(o.status));
  const grandTotal = activeOrders.reduce((s, o) => s + o.total, 0);

  return (
    <div className="min-h-screen bg-slate-950 pb-8">
      <header className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push('/waiter')} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white">←</button>
        <div className="flex-1">
          <h1 className="font-black text-white text-xl leading-tight">{session.label}</h1>
          <p className="text-xs text-slate-500">
            {typeLabel[session.type] || session.type} · abierto {fmtTime(session.openedAt)}
            {session.customer && <span className="text-amber-400 ml-2">· {session.customer.name}</span>}
          </p>
        </div>
        {grandTotal > 0 && (
          <button onClick={() => setShowCuenta(true)} className="text-sm bg-amber-500/20 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-lg font-semibold">
            ${(grandTotal / 100).toFixed(0)}
          </button>
        )}
      </header>

      <div className="px-4 py-5 space-y-5">
        {error && <div className="p-3 bg-red-950/50 border border-red-700/40 rounded-xl text-sm text-red-300">{error}</div>}

        {activeOrders.length === 0 ? (
          <div className="text-center py-8 text-slate-600">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-sm">Sin pedidos aún</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold px-1">Pedidos activos</p>
            {activeOrders.map(o => (
              <div key={o.id} className="relative">
                {loadingOrder === o.id && <div className="absolute inset-0 bg-slate-900/50 rounded-xl flex items-center justify-center z-10"><div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>}
                <OrderCard summary={o} onExpand={expandOrderDetail} />
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3 pt-2">
          <button onClick={() => router.push(`/waiter/session/${sessionId}/order`)}
            className="w-full min-h-[60px] bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-900 font-black text-lg rounded-2xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2">
            <span className="text-2xl">+</span><span>Agregar pedido</span>
          </button>
          {grandTotal > 0 && (
            <button onClick={() => setShowCuenta(true)}
              className="w-full min-h-[56px] bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2">
              <span>💳</span><span>Ver cuenta · {fmt(grandTotal / 100)}</span>
            </button>
          )}
          <button onClick={closeSession} disabled={closing}
            className="w-full min-h-[56px] bg-slate-800/50 hover:bg-red-950/50 border border-slate-700 hover:border-red-700/50 active:scale-95 text-slate-400 hover:text-red-400 font-semibold rounded-2xl transition-all disabled:opacity-50">
            {closing ? 'Cerrando…' : '🔒 Cerrar tab'}
          </button>
        </div>
      </div>

      {expandOrder && <OrderDetailSheet order={expandOrder} onClose={() => setExpandOrder(null)} />}
      {showCuenta && <CuentaSheet session={session} onClose={() => setShowCuenta(false)} onPaid={loadSession} />}
    </div>
  );
}
