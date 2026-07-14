'use client';

import { useEffect, useState, useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderItemModifier {
  id: string;
  modifierName: string;
  priceDelta: number;
}

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  specialInstructions: string | null;
  menuItem: { name: string };
  variant: { name: string } | null;
  modifiers: OrderItemModifier[];
  status: string;
}

interface Order {
  id: string;
  status: string;
  source: string;
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  notes: string | null;
  orderItems: OrderItem[];
}

interface SessionSummary {
  id: string;
  type: string;
  label: string;
  status: string;
  openedAt: string;
  table: { number: string; name: string | null } | null;
  customer: { id: string; name: string } | null;
  orders: { id: string; status: string; subtotal: number; tax: number; total: number; createdAt: string; notes: string | null }[];
  urgency?: string;
  itemSummary?: string;
}

interface SessionDetail {
  id: string;
  type: string;
  label: string;
  status: string;
  openedAt: string;
  table: { number: string; name: string | null } | null;
  customer: { id: string; name: string } | null;
  orders: Order[];
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface SoloOrdersPanelProps {
  selectedSessionId: string | null;
  onSelectSession: (id: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  DRAFT: { label: 'Borrador', bg: 'bg-gray-100', text: 'text-gray-600' },
  PLACED: { label: 'Enviada', bg: 'bg-blue-100', text: 'text-blue-700' },
  IN_KITCHEN: { label: 'En Cocina', bg: 'bg-amber-100', text: 'text-amber-800' },
  READY: { label: 'Lista', bg: 'bg-green-100', text: 'text-green-800' },
  SERVED: { label: 'Entregada', bg: 'bg-purple-100', text: 'text-purple-800' },
  PAID: { label: 'Pagada', bg: 'bg-gray-100', text: 'text-gray-500' },
  CANCELLED: { label: 'Cancelada', bg: 'bg-red-100', text: 'text-red-600' },
};

const ITEM_STATUS_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  PENDING: { label: 'Pendiente', color: 'text-gray-400', icon: '⏳' },
  IN_PREP: { label: 'En prep', color: 'text-amber-500', icon: '👨‍🍳' },
  READY: { label: 'Listo', color: 'text-green-500', icon: '✅' },
  SERVED: { label: 'Entregado', color: 'text-purple-500', icon: '🍽️' },
  CANCELLED: { label: 'Cancelado', color: 'text-red-500', icon: '❌' },
};

function fmt(p: number) {
  return `$${p.toFixed(2)}`;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function elapsedMinutes(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

function elapsedDot(minutes: number): string {
  if (minutes < 5) return '🟢';
  if (minutes < 15) return '🟡';
  if (minutes < 30) return '🟠';
  return '🔴';
}

// ── Payment: advance order status step by step ────────────────────────────────

const STATUS_PATH_TO_PAID = ['DRAFT', 'PLACED', 'IN_KITCHEN', 'READY', 'SERVED', 'PAID'];

async function advanceOrderToPaid(orderId: string, currentStatus: string, paymentMethod?: string): Promise<void> {
  // Fetch real status from server first (avoid stale session data)
  let realStatus = currentStatus;
  try {
    const fresh = await fetch(`/api/admin/restaurant/orders/${orderId}`);
    if (fresh.ok) {
      const data = await fresh.json();
      if (data?.status && data.status !== currentStatus) {
        realStatus = data.status as string;
      }
    }
  } catch {
    /* use stale status as fallback */
  }

  const startIdx = STATUS_PATH_TO_PAID.indexOf(realStatus);
  if (startIdx === -1 || realStatus === 'PAID' || realStatus === 'CANCELLED') return;
  for (let i = startIdx + 1; i < STATUS_PATH_TO_PAID.length; i++) {
    const nextStatus = STATUS_PATH_TO_PAID[i];
    const isLast = nextStatus === 'PAID';
    const body: Record<string, string> = { status: nextStatus };
    if (isLast && paymentMethod) body.paymentMethod = paymentMethod;
    const res = await fetch(`/api/admin/restaurant/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error((d as { error?: string }).error ?? 'Error');
    }
    if (STATUS_PATH_TO_PAID[i] === 'PAID') break;
  }
}

// ── Payment Sheet ─────────────────────────────────────────────────────────────

function PaymentSheet({
  orders,
  sessionLabel,
  onClose,
  onPaid,
}: {
  orders: Order[];
  sessionLabel: string;
  onClose: () => void;
  onPaid: () => void;
}) {
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const activeOrders = orders.filter(o => !['PAID', 'CANCELLED'].includes(o.status));
  const grandTotal = activeOrders.reduce((s, o) => s + o.total, 0);

  const handlePay = async (method: string) => {
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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl max-h-[80dvh] flex flex-col border border-gray-200 shadow-2xl">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="font-bold text-gray-900 text-xl">💳 Cobrar</h2>
          <p className="text-xs text-gray-500 mt-1">{sessionLabel}</p>
        </div>

        {/* Order summary */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {activeOrders.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Sin pedidos pendientes</p>
          ) : (
            <div className="space-y-3">
              {activeOrders.map((o, oIdx) => (
                <div key={o.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-semibold text-gray-500">
                      Orden {oIdx + 1} · {STATUS_LABELS[o.status]?.label ?? o.status} · {fmtTime(o.createdAt)}
                    </p>
                    <span className="text-sm font-semibold text-gray-900">{fmt(o.total)}</span>
                  </div>
                  <div className="space-y-1">
                    {(o.orderItems || []).map(item => (
                      <div key={item.id} className="flex items-start gap-2 text-sm">
                        <span className="text-gray-500 font-mono text-xs w-8 shrink-0 text-right">
                          {item.quantity}×
                        </span>
                        <span className="text-gray-700 flex-1 leading-tight">
                          {item.menuItem.name}
                          {item.variant && <span className="text-gray-400"> · {item.variant.name}</span>}
                        </span>
                        <span className="text-gray-900 font-mono text-xs shrink-0">
                          {fmt(item.unitPrice * item.quantity / 100)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment footer */}
        <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 rounded-b-3xl">
          <div className="flex justify-between mb-4">
            <span className="font-bold text-gray-900 text-lg">Total</span>
            <span className="font-black text-gray-900 text-2xl font-mono">{fmt(grandTotal)}</span>
          </div>

          {paid ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
              <p className="text-green-600 font-bold text-lg">✅ Cobrado</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-500 mb-3 text-center">Seleccioná método de pago</p>
              {payError && (
                <p className="text-sm text-red-500 text-center mb-3 bg-red-50 py-1.5 rounded-lg">
                  {payError}
                </p>
              )}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handlePay('CASH')}
                  disabled={paying || activeOrders.length === 0}
                  className="min-h-[64px] bg-green-600 hover:bg-green-700 active:scale-95 text-white font-bold rounded-2xl transition-all disabled:opacity-50 flex flex-col items-center justify-center gap-1"
                >
                  <span className="text-2xl">💵</span>
                  <span className="text-xs">Efectivo</span>
                </button>
                <button
                  onClick={() => handlePay('CARD')}
                  disabled={paying || activeOrders.length === 0}
                  className="min-h-[64px] bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-2xl transition-all disabled:opacity-50 flex flex-col items-center justify-center gap-1"
                >
                  <span className="text-2xl">💳</span>
                  <span className="text-xs">Tarjeta</span>
                </button>
                <button
                  onClick={() => handlePay('ON_ACCOUNT')}
                  disabled={paying || activeOrders.length === 0}
                  className="min-h-[64px] bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-2xl transition-all disabled:opacity-50 flex flex-col items-center justify-center gap-1"
                >
                  <span className="text-2xl">📒</span>
                  <span className="text-xs">Cuenta</span>
                </button>
              </div>
              {paying && (
                <p className="text-center text-sm text-gray-500 mt-3 animate-pulse">
                  Procesando pago…
                </p>
              )}
            </>
          )}

          <button
            onClick={onClose}
            className="w-full mt-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold active:scale-95 transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Order Card ────────────────────────────────────────────────────────────────

function OrderCard({
  order,
  onDeliver,
  delivering,
}: {
  order: Order;
  onDeliver: (orderId: string) => void;
  delivering: boolean;
}) {
  const st = STATUS_LABELS[order.status] ?? { label: order.status, bg: 'bg-gray-100', text: 'text-gray-600' };
  const items = order.orderItems || [];
  const readyItems = items.filter(i => i.status === 'READY');
  const hasReady = readyItems.length > 0;
  const isDelivered = order.status === 'SERVED' || order.status === 'PAID';
  const mins = elapsedMinutes(order.createdAt);

  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden transition-opacity ${
        isDelivered ? 'opacity-50' : ''
      }`}
    >
      {/* Order header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
            #{order.id.slice(-6).toUpperCase()}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>
            {st.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span>{elapsedDot(mins)}</span>
          <span>{mins} min</span>
        </div>
      </div>

      {/* Order items */}
      <div className="px-4 py-3 space-y-2">
        {items.map(item => {
          const itemSt = ITEM_STATUS_LABELS[item.status] ?? { label: item.status, color: 'text-gray-400', icon: '' };
          return (
            <div key={item.id} className="flex gap-3">
              <div className="w-7 h-7 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center text-gray-700 font-bold text-xs shrink-0">
                {item.quantity}×
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 leading-tight">
                  {item.menuItem.name}
                  {item.variant && (
                    <span className="text-gray-400 font-normal"> · {item.variant.name}</span>
                  )}
                </p>
                {item.modifiers.map(m => (
                  <p key={m.id} className="text-xs text-gray-400">
                    + {m.modifierName}
                  </p>
                ))}
                {item.specialInstructions && (
                  <p className="text-xs text-amber-600 italic mt-0.5">
                    &ldquo;{item.specialInstructions}&rdquo;
                  </p>
                )}
                <span className={`text-xs ${itemSt.color}`}>
                  {itemSt.icon} {itemSt.label}
                </span>
              </div>
              <span className="text-sm font-mono text-gray-500 shrink-0">
                {fmt(item.unitPrice * item.quantity / 100)}
              </span>
            </div>
          );
        })}

        {/* Order total */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            {!order.notes ? '' : `Nota: ${order.notes}`}
          </span>
          <span className="text-sm font-bold text-gray-900">{fmt(order.total)}</span>
        </div>
      </div>

      {/* Delivery button */}
      {hasReady && !isDelivered && (
        <div className="px-4 pb-3">
          <button
            onClick={() => onDeliver(order.id)}
            disabled={delivering}
            className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-sm font-bold rounded-lg active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
          >
            <span>🍽️</span>
            <span>
              Entregar orden ({readyItems.length} listo{readyItems.length !== 1 ? 's' : ''})
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SoloOrdersPanel({
  selectedSessionId,
  onSelectSession,
}: SoloOrdersPanelProps) {
  // Modo Solo — inline session creation, no redirects to /waiter
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [sessionDetail, setSessionDetail] = useState<SessionDetail | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [delivering, setDelivering] = useState(false);

  // ── New table modal ──────────────────────────────────────────────────────
  const [showNewTable, setShowNewTable] = useState(false);
  const [availableTables, setAvailableTables] = useState<Array<{ id: string; number: string; name: string | null }>>([]);
  const [selectedTableId, setSelectedTableId] = useState('');
  const [creatingSession, setCreatingSession] = useState(false);
  const [newTableError, setNewTableError] = useState<string | null>(null);

  const openNewTableModal = useCallback(async () => {
    setNewTableError(null);
    setSelectedTableId('');
    try {
      // Fetch both tables and open sessions to know which tables are free
      const [tRes, sRes] = await Promise.all([
        fetch('/api/admin/restaurant/tables'),
        fetch('/api/admin/restaurant/sessions?status=OPEN'),
      ]);
      if (!tRes.ok) throw new Error('Error al cargar mesas');
      const tables = await tRes.json();
      const sessions = sRes.ok ? await sRes.json() : [];
      const occupiedTableIds = new Set(
        (Array.isArray(sessions) ? sessions : []).map((s: any) => s.table?.id).filter(Boolean)
      );
      const free = (Array.isArray(tables) ? tables : [])
        .filter((t: any) => t.isActive !== false && !occupiedTableIds.has(t.id));
      setAvailableTables(free);
      setShowNewTable(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar mesas');
    }
  }, []);

  const createSession = useCallback(async () => {
    if (!selectedTableId) return;
    setCreatingSession(true);
    setNewTableError(null);
    try {
      const table = availableTables.find(t => t.id === selectedTableId);
      const label = table ? `Mesa ${table.number}` : 'Mesa';
      const res = await fetch('/api/admin/restaurant/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'TABLE', label, tableId: selectedTableId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Error al crear sesión');
      }
      const session = await res.json();
      setShowNewTable(false);
      // Reload sessions to include the new one
      try {
        const sRes = await fetch('/api/admin/restaurant/sessions?status=OPEN');
        if (sRes.ok) {
          const data = await sRes.json();
          setSessions(Array.isArray(data) ? data : []);
        }
      } catch { /* ignore */ }
      onSelectSession(session.id);
    } catch (e) {
      setNewTableError(e instanceof Error ? e.message : 'Error');
    } finally {
      setCreatingSession(false);
    }
  }, [selectedTableId, availableTables, onSelectSession]);

  // ── Load open sessions ────────────────────────────────────────────────────

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/restaurant/sessions?status=OPEN');
      if (res.ok) {
        const data = await res.json();
        setSessions(Array.isArray(data) ? data : []);
      }
    } catch {
      /* keep stale data */
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // ── Load session detail when selected ─────────────────────────────────────

  const loadSessionDetail = useCallback(async (sessionId: string) => {
    setLoadingDetail(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/restaurant/sessions/${sessionId}`);
      if (!res.ok) throw new Error('Sesión no encontrada');
      const data = await res.json();
      setSessionDetail(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar sesión');
      setSessionDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      loadSessionDetail(selectedSessionId);
    } else {
      setSessionDetail(null);
    }
  }, [selectedSessionId, loadSessionDetail]);

  // ── Auto-refresh every 30 seconds ─────────────────────────────────────────

  useEffect(() => {
    const interval = setInterval(() => {
      loadSessions();
      if (selectedSessionId) loadSessionDetail(selectedSessionId);
    }, 30000);
    return () => clearInterval(interval);
  }, [loadSessions, loadSessionDetail, selectedSessionId]);

  // ── Deliver ready items ───────────────────────────────────────────────────

  const deliverReadyItems = async (orderId: string) => {
    setDelivering(true);
    try {
      const fres = await fetch(`/api/admin/restaurant/orders/${orderId}`);
      if (!fres.ok) throw new Error('Error al obtener orden');
      const order = (await fres.json()) as Order;
      const readyIds = (order.orderItems || [])
        .filter(i => i.status === 'READY')
        .map(i => i.id);
      for (const itemId of readyIds) {
        await fetch(`/api/admin/restaurant/orders/${orderId}/items/${itemId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'SERVED' }),
        });
      }
      await loadSessionDetail(selectedSessionId!);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al entregar');
    } finally {
      setDelivering(false);
    }
  };

  // ── Compute totals ────────────────────────────────────────────────────────

  const detailOrders = sessionDetail?.orders || [];
  const activeOrders = detailOrders.filter(o => !['PAID', 'CANCELLED'].includes(o.status));
  const grandTotal = activeOrders.reduce((s, o) => s + o.total, 0);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* ── Session bar (horizontal scrollable tabs) ─────────────────────── */}
      <div className="shrink-0 bg-white border-b border-gray-200 px-3 py-2">
        {loadingSessions ? (
          <div className="flex items-center justify-center py-3">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            <span className="ml-2 text-sm text-gray-400">Cargando sesiones…</span>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-400 mb-2">No hay sesiones abiertas</p>
            <button
              onClick={openNewTableModal}
              className="inline-block text-sm text-[#b88364] hover:text-[#8a5d44] font-medium"
            >
              + Abrir mesa
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {sessions.map(s => {
              const sessTotal = (s.orders || []).reduce((sum, o) => sum + (o.total || 0), 0);
              const activeCount = (s.orders || []).filter(
                o => !['PAID', 'CANCELLED'].includes(o.status)
              ).length;
              const isSelected = s.id === selectedSessionId;
              return (
                <button
                  key={s.id}
                  onClick={() => onSelectSession(s.id)}
                  className={`shrink-0 min-w-[120px] px-3 py-2 rounded-lg text-left transition-all border ${
                    isSelected
                      ? 'bg-white border-[#D4724A] shadow-sm border-l-[3px]'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100 border-l-[3px] border-l-transparent'
                  }`}
                >
                  <p className="text-xs font-semibold text-gray-900 truncate">
                    {s.table
                      ? `Mesa ${s.table.number}`
                      : s.label || 'Sin mesa'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {sessTotal > 0 && (
                      <span className="text-xs font-mono font-bold text-gray-700">
                        {fmt(sessTotal)}
                      </span>
                    )}
                    {activeCount > 0 && (
                      <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-medium">
                        {activeCount} activa{activeCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            {/* + Abrir mesa button */}
            <button
              onClick={openNewTableModal}
              className="shrink-0 min-w-[100px] px-3 py-2 rounded-lg border border-dashed border-gray-300 bg-white hover:bg-gray-50 text-center flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <span className="text-lg">+</span>
              <span>Abrir mesa</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Error banner ──────────────────────────────────────────────────── */}
      {error && (
        <div className="shrink-0 mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-400 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Main content area ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4">
        {!selectedSessionId ? (
          /* No session selected */
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-400 text-sm">
              Seleccioná una mesa para ver sus órdenes
            </p>
          </div>
        ) : loadingDetail ? (
          /* Loading detail */
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
          </div>
        ) : !sessionDetail ? (
          /* Detail error */
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-gray-400 text-sm">
              {error || 'No se pudo cargar la sesión'}
            </p>
            <button
              onClick={() => selectedSessionId && loadSessionDetail(selectedSessionId)}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <>
            {/* ── Session header ──────────────────────────────────────────── */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {sessionDetail.label}
                  {sessionDetail.table && (
                    <span className="text-gray-400 font-normal text-sm ml-2">
                      Mesa {sessionDetail.table.number}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Abierta {fmtTime(sessionDetail.openedAt)}
                  {sessionDetail.customer && (
                    <span> · {sessionDetail.customer.name}</span>
                  )}
                </p>
              </div>

              {/* Payment button */}
              {grandTotal > 0 && (
                <button
                  onClick={() => setShowPayment(true)}
                  className="shrink-0 px-4 py-2 bg-gray-100 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 active:scale-95 transition-all"
                >
                  💵 Cobrar {fmt(grandTotal)}
                </button>
              )}
            </div>

            {/* ── Orders ─────────────────────────────────────────────────── */}
            {activeOrders.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">📋</div>
                <p className="text-sm text-gray-400">Sin pedidos activos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeOrders.map(o => (
                  <OrderCard
                    key={o.id}
                    order={o}
                    onDeliver={deliverReadyItems}
                    delivering={delivering}
                  />
                ))}
              </div>
            )}

            {/* ── Paid/delivered orders ───────────────────────────────────── */}
            {detailOrders.filter(o => o.status === 'PAID' || o.status === 'SERVED').length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Entregadas / Pagadas
                </p>
                <div className="space-y-3">
                  {detailOrders
                    .filter(o => o.status === 'PAID' || o.status === 'SERVED')
                    .map(o => (
                      <OrderCard
                        key={o.id}
                        order={o}
                        onDeliver={() => {}}
                        delivering={false}
                      />
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Payment sheet ─────────────────────────────────────────────────── */}
      {showPayment && sessionDetail && (
        <PaymentSheet
          orders={detailOrders}
          sessionLabel={sessionDetail.label}
          onClose={() => setShowPayment(false)}
          onPaid={() => {
            loadSessionDetail(selectedSessionId!);
            setShowPayment(false);
          }}
        />
      )}

      {/* ── New table modal ───────────────────────────────────────────────── */}
      {showNewTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowNewTable(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Abrir mesa</h3>
            <p className="text-sm text-gray-500 mb-4">Seleccioná una mesa disponible</p>

            {newTableError && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">{newTableError}</div>
            )}

            {availableTables.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No hay mesas disponibles</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto mb-4">
                {availableTables.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTableId(t.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all border ${
                      selectedTableId === t.id
                        ? 'bg-[#fef9f6] border-[#b88364] font-semibold text-[#b88364]'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    🪑 Mesa {t.number}
                    {t.name && <span className="text-gray-400 ml-1 text-xs">· {t.name}</span>}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowNewTable(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={createSession}
                disabled={!selectedTableId || creatingSession}
                className="flex-1 py-2.5 bg-[#b88364] text-white text-sm font-semibold rounded-lg hover:bg-[#8a5d44] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingSession ? 'Creando…' : 'Abrir mesa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
