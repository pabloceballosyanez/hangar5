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
  /** Los pagos de la orden. La sesión los guarda por pedido, no solo por
   *  cuenta: así el historial puede decir cómo se cobró cada uno. */
  payments?: { method: string; status: string }[];
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
  customer: { id: string; name: string; hasCredit?: boolean } | null;
  orders: Order[];
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface SoloOrdersPanelProps {
  selectedSessionId: string | null;
  onSelectSession: (id: string) => void;
  /** Bumped by sibling panels — triggers an instant silent re-fetch */
  refreshSignal?: number;
  /** Call after a local mutation so sibling panels re-fetch instantly */
  onMutate?: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  DRAFT: { label: 'Borrador', bg: 'op-surface-2', text: 'text-ash' },
  PLACED: { label: 'Enviada', bg: 'bg-blue-100', text: 'text-blue-700' },
  IN_KITCHEN: { label: 'En Cocina', bg: 'bg-amber-100', text: 'text-amber-800' },
  READY: { label: 'Lista', bg: 'bg-green-100', text: 'text-green-800' },
  SERVED: { label: 'Entregada', bg: 'bg-purple-100', text: 'text-purple-800' },
  PAID: { label: 'Pagada', bg: 'op-surface-2', text: 'text-smoke' },
  CANCELLED: { label: 'Cancelada', bg: 'bg-red-100', text: 'text-red-600' },
};

const ITEM_STATUS_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  PENDING: { label: 'Pendiente', color: 'text-smoke', icon: '⏳' },
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

// ── Session urgency (ported from /waiter — same color system) ─────────────────

type Urgency = 'empty' | 'active' | 'partial_ready' | 'all_ready' | 'served';

function getSessionUrgency(session: SessionSummary): Urgency {
  if (session.urgency) return session.urgency as Urgency;
  const active = (session.orders || []).filter(o => !['PAID', 'CANCELLED'].includes(o.status));
  if (active.length === 0) return 'empty';
  // All orders are SERVED (no items to track)
  if (active.every(o => o.status === 'SERVED')) return 'served';
  // Any order in READY = all ready (simplified — server computes item-level)
  if (active.some(o => o.status === 'READY')) return 'partial_ready';
  const allReady = active.every(o => o.status === 'READY');
  if (allReady) return 'all_ready';
  return 'active';
}

const URGENCY_CONFIG: Record<Urgency, { bg: string; border: string; badge: string; label: string; texto: string }> = {
    /* Mismos cuatro estados que el KDS y el Mesero, con los mismos
       tonos. El texto acompaña al fondo: blanco en los estados fuertes
       (ámbar y verde) y tinta en los claros. Antes era blanco siempre y
       en los estados claros quedaba blanco sobre blanco: 1.01:1. */
    empty:         { bg: 'op-surface',   border: '', badge: 'op-neutral', label: 'Vacío',     texto: 'text-snow' },
    active:        { bg: 'op-warn',      border: '', badge: 'op-warn',    label: 'En cocina', texto: 'text-white' },
    partial_ready: { bg: 'op-warn',      border: '', badge: 'op-warn',    label: 'Parcial',   texto: 'text-white' },
    all_ready:     { bg: 'op-good',      border: '', badge: 'op-good',    label: '¡Listo!',   texto: 'text-white' },
    served:        { bg: 'op-surface-2', border: '', badge: 'op-neutral', label: 'Entregado', texto: 'text-snow' },
  };

/**
 * Un color fijo por cuenta.
 *
 * Antes el único color del tab era el del estado (ámbar = en cocina,
 * verde = listo), así que tres pedidos abiertos se veían idénticos y
 * había que leer el nombre para saber de quién era cada uno. En una
 * tablet, con prisa, eso no se lee.
 *
 * Ahora cada cuenta recibe un color por su posición y lo conserva
 * mientras esté abierta. El estado sigue existiendo, pero como acento,
 * no como único identificador.
 */
const COLORES_CUENTA = [
  { barra: 'bg-[#2F6F8F]', punto: 'bg-[#2F6F8F]' }, // azul
  { barra: 'bg-[#8A5A2B]', punto: 'bg-[#8A5A2B]' }, // café
  { barra: 'bg-[#5C6B3A]', punto: 'bg-[#5C6B3A]' }, // verde oliva
  { barra: 'bg-[#7A3E5C]', punto: 'bg-[#7A3E5C]' }, // vino
  { barra: 'bg-[#4A5A7A]', punto: 'bg-[#4A5A7A]' }, // gris azulado
  { barra: 'bg-[#8A6A2B]', punto: 'bg-[#8A6A2B]' }, // mostaza
  { barra: 'bg-[#3A6B6B]', punto: 'bg-[#3A6B6B]' }, // petróleo
  { barra: 'bg-[#6B4A3A]', punto: 'bg-[#6B4A3A]' }, // tierra
];

/** Color estable por cuenta: mientras siga abierta, no cambia. */
function colorDeCuenta(id: string, todas: Array<{ id: string }>): number {
  const i = todas.findIndex((s) => s.id === id);
  return i >= 0 ? i % COLORES_CUENTA.length : 0;
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
  sessionId,
  sessionLabel,
  customer,
  onClose,
  onPaid,
}: {
  orders: Order[];
  sessionId: string;
  sessionLabel: string;
  customer?: { id: string; name: string; hasCredit?: boolean } | null;
  onClose: () => void;
  onPaid: () => void;
}) {
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const activeOrders = orders.filter(o => !['PAID', 'CANCELLED'].includes(o.status));
  const grandTotal = activeOrders.reduce((s, o) => s + o.total, 0);
  const canCredit = customer != null && customer.hasCredit === true;

  const handlePay = async (method: string) => {
    setPaying(true);
    setPayError(null);
    try {
      /* Cobrar una cuenta y cerrarla son la misma operación.
         Antes se pagaban las órdenes una por una y la sesión quedaba
         ABIERTA: el cliente se iba y su nombre seguía en los tabs para
         siempre, sin nada activo. Ahora se usa el endpoint de cuenta, que
         cobra todo el consumo y cierra la sesión en una sola transacción. */
      /* Los montos que llegan del API ya vienen en PESOS (serializeOrder
         divide entre 100). Aquí NO se vuelve a dividir: hacerlo mandaba
         un pago de $1.90 por una cuenta de $190, el endpoint veía que no
         cuadraba y rechazaba el cobro. */
      const res = await fetch(`/api/admin/restaurant/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payments: [{ method, amount: grandTotal }],
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo cerrar la cuenta');
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
      <div className="relative op-surface rounded-t-3xl max-h-[80dvh] flex flex-col border border-hair shadow-2xl">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-hair rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-4 border-b border-hair">
          <h2 className="font-bold text-snow op-lead">💳 Cobrar</h2>
          <p className="op-small text-ash mt-1">{sessionLabel}</p>
        </div>

        {/* Order summary */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {activeOrders.length === 0 ? (
            <p className="op-body text-ash text-center py-4">Sin pedidos pendientes</p>
          ) : (
            <div className="space-y-3">
              {activeOrders.map((o, oIdx) => (
                <div key={o.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="op-small font-semibold text-ash">
                      Orden {oIdx + 1} · {STATUS_LABELS[o.status]?.label ?? o.status} · {fmtTime(o.createdAt)}
                    </p>
                    <span className="op-body font-semibold text-snow">{fmt(o.total)}</span>
                  </div>
                  <div className="space-y-1">
                    {(o.orderItems || []).map(item => (
                      <div key={item.id} className="flex items-start gap-2 op-body">
                        <span className="text-ash font-mono op-small w-8 shrink-0 text-right">
                          {item.quantity}×
                        </span>
                        <span className="text-snow-2 flex-1 leading-tight">
                          {item.menuItem.name}
                          {item.variant && <span className="text-ash"> · {item.variant.name}</span>}
                        </span>
                        <span className="text-snow font-mono op-small shrink-0">
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
        <div className="px-5 py-4 border-t border-hair op-surface-2 rounded-b-3xl">
          <div className="flex justify-between mb-4">
            <span className="font-bold text-snow op-lead">Total</span>
            <span className="font-black text-snow op-title font-mono">{fmt(grandTotal)}</span>
          </div>

          {paid ? (
            <div className="p-4 op-good border rounded-xl text-center">
              <p className=" font-bold op-lead">✅ Cobrado</p>
            </div>
          ) : (
            <>
              <p className="op-small text-ash mb-3 text-center">Seleccioná método de pago</p>
              {payError && (
                <p className="op-body text-center mb-3 op-bad py-1.5 rounded-lg">
                  {payError}
                </p>
              )}
              <div className={`grid gap-3 ${canCredit ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <button
                  onClick={() => handlePay('CASH')}
                  disabled={paying || activeOrders.length === 0}
                  className="op-btn op-btn-primary h-14 flex-col gap-0.5"
                >
                  <span className="op-title">💵</span>
                  <span className="op-small">Efectivo</span>
                </button>
                <button
                  onClick={() => handlePay('CARD')}
                  disabled={paying || activeOrders.length === 0}
                  className="op-btn op-btn-primary h-14 flex-col gap-0.5"
                >
                  <span className="op-title">💳</span>
                  <span className="op-small">Tarjeta</span>
                </button>
                {canCredit && (
                  <button
                    onClick={() => handlePay('ON_ACCOUNT')}
                    disabled={paying || activeOrders.length === 0}
                    className="op-btn op-btn-primary h-14 flex-col gap-0.5"
                  >
                    <span className="op-title">📒</span>
                    <span className="op-small">Cuenta</span>
                  </button>
                )}
              </div>
              {paying && (
                <p className="text-center op-body text-ash mt-3 animate-pulse">
                  Procesando pago…
                </p>
              )}
            </>
          )}

          <button
            onClick={onClose}
            className="op-btn op-btn-primary w-full mt-4 h-12"
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
  onCancel,
  onItemReady,
  delivering,
}: {
  order: Order;
  onDeliver: (orderId: string) => void;
  onCancel?: (orderId: string) => void;
  /** Marca un platillo como listo sin entregar la orden completa. */
  onItemReady?: (orderId: string, itemId: string) => Promise<void>;
  delivering: boolean;
}) {
  const [markingItem, setMarkingItem] = useState<string | null>(null);
  const st = STATUS_LABELS[order.status] ?? { label: order.status, bg: 'op-surface-2', text: 'text-ash' };
  const items = order.orderItems || [];
  const readyItems = items.filter(i => i.status === 'READY');
  const hasReady = readyItems.length > 0;
  const isDelivered = order.status === 'SERVED' || order.status === 'PAID' || order.status === 'CANCELLED';
  const mins = elapsedMinutes(order.createdAt);

  return (
    <div
      className={`op-surface border border-hair rounded-xl shadow-sm overflow-hidden transition-opacity ${ isDelivered ? 'opacity-50' : '' }`}
    >
      {/* Order header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-hair">
        <div className="flex items-center gap-2">
          <span className="op-small font-mono text-ash op-surface-2 px-1.5 py-0.5 rounded">
            #{order.id.slice(-6).toUpperCase()}
          </span>
          <span className={`op-small font-semibold px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>
            {st.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5 op-small text-ash">
          <span>{elapsedDot(mins)}</span>
          <span>{mins} min</span>
        </div>
      </div>

      {/* Order items */}
      <div className="px-4 py-3 space-y-2">
        {items.map(item => {
          const itemSt = ITEM_STATUS_LABELS[item.status] ?? { label: item.status, color: 'text-ash', icon: '' };
          const listo = item.status === 'READY' || item.status === 'SERVED';
          const cancelado = item.status === 'CANCELLED';

          /* Cada platillo se marca por separado.
             Antes solo se veía su estado como texto gris: para marcar uno
             había que entregar la orden completa. En una barra con varios
             pedidos encimados eso no sirve — el que está listo debe poder
             avisarse solo. El renglón entero es el botón. */
          return (
            <button
              key={item.id}
              type="button"
              disabled={cancelado || listo || markingItem === item.id}
              onClick={async () => {
                if (!onItemReady) return;
                setMarkingItem(item.id);
                try {
                  await onItemReady(order.id, item.id);
                } finally {
                  setMarkingItem(null);
                }
              }}
              className={`w-full text-left flex gap-3 rounded-xl px-2 py-2 -mx-2 transition-colors ${ cancelado ? 'opacity-40 cursor-not-allowed' : listo ? 'op-good border ' : 'border border-hair hover: hover:op-good/50 active:scale-[0.99]' }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold op-small shrink-0 ${ listo ? 'bg-green-600 text-white border ' : 'op-surface-2 border border-hair text-snow-2' }`}>
                {listo ? '✓' : `${item.quantity}×`}
              </div>
              <div className="flex-1 min-w-0">
                <p className="op-body font-medium text-snow leading-tight">
                  {item.menuItem.name}
                  {item.variant && (
                    <span className="text-ash font-normal"> · {item.variant.name}</span>
                  )}
                </p>
                {item.modifiers.map(m => (
                  <p key={m.id} className="op-small text-ash">
                    + {m.modifierName}
                  </p>
                ))}
                {item.specialInstructions && (
                  <p className="op-small italic mt-0.5">
                    &ldquo;{item.specialInstructions}&rdquo;
                  </p>
                )}
                <span className={`op-small font-medium ${itemSt.color}`}>
                  {itemSt.icon} {itemSt.label}
                </span>
              </div>
              <span className="op-body font-mono text-ash shrink-0">
                {fmt(item.unitPrice * item.quantity / 100)}
              </span>
            </button>
          );
        })}

        {/* Order total */}
        <div className="flex justify-between items-center pt-2 border-t border-hair">
          <span className="op-small text-ash">
            {!order.notes ? '' : `Nota: ${order.notes}`}
          </span>
          <span className="op-body font-bold text-snow">{fmt(order.total)}</span>
        </div>
      </div>

      {/* Actions */}
      {!isDelivered && (
        <div className="px-4 pb-3 space-y-2">
          {hasReady && (
            <button
              onClick={() => onDeliver(order.id)}
              disabled={delivering}
              className="op-btn op-btn-primary w-full gap-1.5"
            >
              <span>🍽️</span>
              <span>
                Entregar orden ({readyItems.length} listo{readyItems.length !== 1 ? 's' : ''})
              </span>
            </button>
          )}
          {onCancel && (
            <button
              onClick={() => onCancel(order.id)}
              disabled={delivering}
              className="op-btn op-btn-danger w-full gap-1.5"
            >
              <span>❌</span>
              <span>Cancelar orden</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SoloOrdersPanel({
  selectedSessionId,
  onSelectSession,
  refreshSignal,
  onMutate,
}: SoloOrdersPanelProps) {
  // Modo Solo — inline session creation, no redirects to /waiter
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [sessionDetail, setSessionDetail] = useState<SessionDetail | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [delivering, setDelivering] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelPin, setCancelPin] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // ── New session modal ────────────────────────────────────────────────────
  const [showNewSession, setShowNewSession] = useState(false);
  const [newTabType, setNewTabType] = useState<'TABLE' | 'TAB' | 'WALKIN'>('TABLE');
  const [newTabLabel, setNewTabLabel] = useState('');
  const [availableTables, setAvailableTables] = useState<Array<{ id: string; number: string; name: string | null }>>([]);
  const [selectedTableId, setSelectedTableId] = useState('');
  const [creatingSession, setCreatingSession] = useState(false);
  const [newSessionError, setNewSessionError] = useState<string | null>(null);
  
  // Customer search for TAB type
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Array<{ id: string; name: string; phone: string | null }>>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string; phone: string | null } | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const openNewSessionModal = useCallback(async () => {
    setNewSessionError(null);
    setSelectedTableId('');
    setNewTabType('TABLE');
    setNewTabLabel('');
    setSelectedCustomer(null);
    setCustomerSearch('');
    setCustomers([]);
    try {
      // Fetch tables (only needed upfront to avoid delay when switching to TABLE)
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
      setShowNewSession(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar mesas');
    }
  }, []);

  // Customer search for TAB type
  const searchCustomers = useCallback(async (q: string) => {
    if (q.trim().length === 0) {
      setCustomers([]);
      setShowCustomerDropdown(false);
      return;
    }
    setLoadingCustomers(true);
    try {
      const res = await fetch(`/api/admin/restaurant/customers?search=${encodeURIComponent(q.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(Array.isArray(data) ? data.slice(0, 10) : []);
        setShowCustomerDropdown(true);
      }
    } catch { /* ignore */ }
    finally { setLoadingCustomers(false); }
  }, []);

  const createSession = useCallback(async () => {
    // Validate based on type
    if (newTabType === 'TABLE' && !selectedTableId) {
      setNewSessionError('Seleccioná una mesa');
      return;
    }
    if (newTabType === 'TAB' && !selectedCustomer) {
      setNewSessionError('Seleccioná un cliente');
      return;
    }
    const label = newTabLabel.trim();
    if (!label && newTabType === 'WALKIN') {
      setNewTabLabel('Walk-in');
    }
    const finalLabel =
      newTabType === 'TAB'
        ? (selectedCustomer?.name || label || 'Cliente')
        : (label || 'Walk-in');

    setCreatingSession(true);
    setNewSessionError(null);
    try {
      const body: Record<string, any> = {
        type: newTabType,
        label: newTabType === 'TABLE'
          ? `Mesa ${availableTables.find(t => t.id === selectedTableId)?.number || '?'}`
          : finalLabel,
        tableId: newTabType === 'TABLE' ? selectedTableId : null,
      };
      if (newTabType === 'TAB' && selectedCustomer) {
        body.customerId = selectedCustomer.id;
      }

      const res = await fetch('/api/admin/restaurant/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Error al crear sesión');
      }
      const session = await res.json();
      setShowNewSession(false);
      try {
        const sRes = await fetch('/api/admin/restaurant/sessions?status=OPEN');
        if (sRes.ok) {
          const data = await sRes.json();
          setSessions(Array.isArray(data) ? data : []);
        }
      } catch { /* ignore */ }
      onSelectSession(session.id);
    } catch (e) {
      setNewSessionError(e instanceof Error ? e.message : 'Error');
    } finally {
      setCreatingSession(false);
    }
  }, [newTabType, newTabLabel, selectedTableId, selectedCustomer, availableTables, onSelectSession]);

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

  const loadSessionDetail = useCallback(async (sessionId: string, silent = false) => {
    if (!silent) setLoadingDetail(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/restaurant/sessions/${sessionId}`);
      if (!res.ok) throw new Error('Sesión no encontrada');
      const data = await res.json();
      setSessionDetail(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar sesión');
      if (!silent) setSessionDetail(null);
    } finally {
      if (!silent) setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      loadSessionDetail(selectedSessionId);
    } else {
      setSessionDetail(null);
    }
  }, [selectedSessionId, loadSessionDetail]);

  // ── Instant refresh when sibling panels mutate (silent, no flicker) ────────

  useEffect(() => {
    if (refreshSignal === undefined || refreshSignal === 0) return;
    loadSessions();
    if (selectedSessionId) loadSessionDetail(selectedSessionId, true);
  }, [refreshSignal, loadSessions, loadSessionDetail, selectedSessionId]);

  // ── Auto-refresh every 10 seconds (aligned with KDS) ───────────────────────

  useEffect(() => {
    const interval = setInterval(() => {
      loadSessions();
      if (selectedSessionId) loadSessionDetail(selectedSessionId, true);
    }, 10000);
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
      await loadSessionDetail(selectedSessionId!, true);
      onMutate?.(); // notify KDS + sessions bar instantly
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al entregar');
    } finally {
      setDelivering(false);
    }
  };

  // ── Marcar un platillo como listo, sin entregar la orden ────────────
  const marcarPlatilloListo = async (orderId: string, itemId: string) => {
    const res = await fetch(`/api/admin/restaurant/orders/${orderId}/items/${itemId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'READY' }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(typeof d.error === 'string' ? d.error : 'No se pudo marcar el platillo');
      return;
    }
    await loadSessionDetail(selectedSessionId!, true);
    onMutate?.();
  };

  // ── Cancel order (supervisor PIN) ─────────────────────────────────────────

  const cancelOrder = (orderId: string) => {
    setCancelOrderId(orderId);
    setCancelPin("");
    setError(null);
  };

  const confirmCancelOrder = async () => {
    if (!cancelOrderId) return;
    setCancelling(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/restaurant/orders/${cancelOrderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED', supervisorPin: cancelPin }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Error al cancelar');
      }
      setCancelOrderId(null);
      setCancelPin("");
      await loadSessionDetail(selectedSessionId!, true);
      onMutate?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cancelar');
    } finally {
      setCancelling(false);
    }
  };

  // ── Compute totals ────────────────────────────────────────────────────────

  const detailOrders = sessionDetail?.orders || [];
  const activeOrders = detailOrders.filter(o => !['PAID', 'CANCELLED'].includes(o.status));
  const grandTotal = activeOrders.reduce((s, o) => s + o.total, 0);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full op-surface-2">
      {/* ── Session bar (flex-wrap chips with urgency colors) ──────────────── */}
      <div className="shrink-0 op-surface border-b border-hair px-2.5 py-2">
        {loadingSessions ? (
          <div className="flex items-center justify-center py-3">
            <div className="w-5 h-5 border-2 border-hair border-t-gray-600 rounded-full animate-spin" />
            <span className="ml-2 op-body text-ash">Cargando sesiones…</span>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-4">
            <p className="op-body text-ash mb-2">No hay sesiones abiertas</p>
            <button
              onClick={openNewSessionModal}
              className="inline-block op-body text-brass hover:text-brass-soft font-medium"
            >
              + Nuevo tab
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            {sessions.map(s => {
              const isSelected = s.id === selectedSessionId;
              const urgency = getSessionUrgency(s);
              const cfg = URGENCY_CONFIG[urgency];
              const color = COLORES_CUENTA[colorDeCuenta(s.id, sessions)];
              const activeOrders = (s.orders || []).filter(o => !['PAID', 'CANCELLED'].includes(o.status));
              const sessTotal = activeOrders.reduce((sum, o) => sum + (o.total || 0), 0);
              const activeCount = activeOrders.length;
              return (
                <button
                  key={s.id}
                  onClick={() => onSelectSession(s.id)}
                  title={s.table ? `Mesa ${s.table.number}` : s.label || ''}
                  className={`relative flex items-center gap-1.5 pl-3 pr-2.5 py-2 rounded-lg text-left transition-all overflow-hidden ${cfg.bg} ${
                    isSelected
                      ? 'ring-2 ring-brass'
                      : 'hover:brightness-125'
                  }`}
                >
                  {/* Barra de color de la cuenta: es lo que la hace
                      reconocible de un vistazo. Va pegada al borde
                      izquierdo, así el tab no cambia de ancho. */}
                  <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${color.barra}`} />

                  {/* Type icon */}
                  <span className="op-small shrink-0">
                    {s.type === 'TABLE' ? '🪑' : s.type === 'TAB' ? '👤' : '🚶'}
                  </span>

                  {/* Label */}
                  <span className={`op-small leading-tight max-w-[110px] truncate ${cfg.texto} ${ isSelected ? 'font-bold' : 'font-semibold' }`}>
                    {s.table ? `Mesa ${s.table.number}` : s.label || '…'}
                  </span>

                  {/* Urgency badge */}
                  {urgency !== 'empty' && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${cfg.badge}`}>
                      {urgency === 'all_ready' ? '¡Listo!' : activeCount > 0 ? activeCount : cfg.label}
                    </span>
                  )}

                  {/* Total */}
                  {sessTotal > 0 && (
                    <span className={`text-[10px] font-mono font-bold shrink-0 ${cfg.texto}`}>
                      {fmt(sessTotal)}
                    </span>
                  )}
                </button>
              );
            })}

            {/* + Nuevo tab button */}
            <button
              onClick={openNewSessionModal}
              className="flex items-center gap-1.5 px-3 h-9 rounded-lg border border-dashed border-hair op-surface hover:op-surface-2 op-small text-ash transition-colors"
            >
              <span className="op-body leading-none">+</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Error banner ──────────────────────────────────────────────────── */}
      {error && (
        <div className="shrink-0 mx-4 mt-3 p-3 op-bad border rounded-xl op-body ">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2"
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
            <p className="op-lead text-snow-2">Seleccioná un tab</p>
            <p className="op-small text-ash mt-1">para ver sus órdenes</p>
          </div>
        ) : loadingDetail ? (
          /* Loading detail */
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-hair border-t-gray-600 rounded-full animate-spin" />
          </div>
        ) : !sessionDetail ? (
          /* Detail error */
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="op-title mb-3">⚠️</div>
            <p className="text-ash op-body">
              {error || 'No se pudo cargar la sesión'}
            </p>
            <button
              onClick={() => selectedSessionId && loadSessionDetail(selectedSessionId)}
              className="mt-3 op-body text-brass hover:text-brass-soft"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <>
            {/* ── Session header ──────────────────────────────────────────── */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="op-lead font-bold text-snow">
                  {sessionDetail.label}
                  {sessionDetail.table && (
                    <span className="text-ash font-normal op-body ml-2">
                      Mesa {sessionDetail.table.number}
                    </span>
                  )}
                </h2>
                <p className="op-small text-ash mt-0.5">
                  Abierta {fmtTime(sessionDetail.openedAt)}
                  {sessionDetail.customer && (
                    <span> · {sessionDetail.customer.name}</span>
                  )}
                </p>
              </div>

              {/* Botón de cobro. Solo aparece si la cuenta sigue abierta
                  y tiene algo que cobrar. Después de pagar la sesión se
                  cierra, así que el botón desaparece solo. */}
              {grandTotal > 0 && sessionDetail.status !== 'CLOSED' && (
                <button
                  onClick={() => setShowPayment(true)}
                  className="op-btn op-btn-ghost shrink-0"
                >
                  💵 Cobrar {fmt(grandTotal)}
                </button>
              )}
            </div>

            {/* ── Orders ─────────────────────────────────────────────────── */}
            {activeOrders.length === 0 ? (
              <div className="text-center py-8">
                <div className="op-title mb-2">📋</div>
                <p className="op-body text-ash">Sin pedidos activos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeOrders.map(o => (
                  <OrderCard
                    key={o.id}
                    order={o}
                    onDeliver={deliverReadyItems}
                    onCancel={cancelOrder}
                    onItemReady={marcarPlatilloListo}
                    delivering={delivering}
                  />
                ))}
              </div>
            )}

            {/* ── Historial de la cuenta ──────────────────────────────
                Antes esto repetía la tarjeta completa de cada pedido, con
                su botón de entregar y sus modificadores: la misma orden
                se leía dos veces y el historial pesaba más que lo vivo.
                Ahora es una línea: qué se pidió, cuánto y cómo se pagó. */}
            {detailOrders.filter(o => o.status === 'PAID' || o.status === 'SERVED').length > 0 && (
              <div className="mt-6">
                <p className="op-micro text-smoke mb-2">
                  Ya servido
                </p>
                <div className="op-surface rounded-xl divide-y divide-[var(--color-hair)]">
                  {detailOrders
                    .filter(o => o.status === 'PAID' || o.status === 'SERVED')
                    .map(o => {
                      const pagado = o.payments?.find((p: { status: string }) => p.status === 'COMPLETED');
                      return (
                        <div key={o.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                          <div className="min-w-0">
                            <p className="op-small text-snow truncate">
                              {o.orderItems.map((i: { quantity: number; menuItem?: { name: string } }) => `${i.quantity}× ${i.menuItem?.name ?? ''}`).join(', ')}
                            </p>
                            <p className="op-micro text-smoke mt-0.5">
                              {fmtTime(o.createdAt)}
                              {pagado && ` · ${pagado.method === 'CASH' ? 'Efectivo' : pagado.method === 'CARD' ? 'Tarjeta' : pagado.method === 'ON_ACCOUNT' ? 'A su cuenta' : 'Transferencia'}`}
                            </p>
                          </div>
                          <span className="op-small text-ash tabular-nums shrink-0">{fmt(o.total)}</span>
                        </div>
                      );
                    })}
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
          sessionId={selectedSessionId!}
          sessionLabel={sessionDetail.label}
          customer={sessionDetail.customer}
          onClose={() => setShowPayment(false)}
          onPaid={() => {
            /* Cobrar cierra la cuenta. Si se dejara seleccionada, el
               panel seguiría mostrando una sesión cerrada con su botón
               de cobro vivo, y al tocarlo el servidor responde "ya está
               pagada". Se limpia la selección y el panel vuelve a
               invitar a elegir un tab. */
            setShowPayment(false);
            setSessionDetail(null);
            onSelectSession('');
            loadSessions();
            onMutate?.(); // notify KDS instantly (paid orders leave the queue)
          }}
        />
      )}

      {/* ── New session modal ───────────────────────────────────────────────── */}
      {showNewSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowNewSession(false)}>
          <div className="op-surface rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 max-h-[90dvh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="op-lead font-bold text-snow mb-1">Nuevo tab</h3>
            <p className="op-body text-ash mb-4">Crear sesión para atender</p>

            {newSessionError && (
              <div className="mb-3 p-2 op-bad border rounded-lg op-small ">{newSessionError}</div>
            )}

            {/* Tab type selector */}
            <div className="mb-4">
              <label className="block op-body text-ash mb-2">Tipo</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { key: 'TABLE' as const, icon: '🪑', label: 'Mesa', desc: 'Física' },
                  { key: 'TAB' as const, icon: '👤', label: 'Cliente', desc: 'Registrado' },
                  { key: 'WALKIN' as const, icon: '🚶', label: 'Walk-in', desc: 'Anónimo' },
                ]).map(t => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => { setNewTabType(t.key); setNewSessionError(null); }}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${ newTabType === t.key ? 'border-brass bg-brass/10' : 'border-hair hover:border-hair' }`}
                  >
                    <p className="font-bold text-snow op-body">{t.icon} {t.label}</p>
                    <p className="op-small text-ash mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* TABLE: select mesa */}
            {newTabType === 'TABLE' && (
              <div className="mb-4">
                <label className="block op-body text-ash mb-1">Mesa</label>
                {availableTables.length === 0 ? (
                  <p className="op-body text-ash text-center py-3">No hay mesas disponibles</p>
                ) : (
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {availableTables.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTableId(t.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg op-body transition-all border ${ selectedTableId === t.id ? 'bg-brass/10 border-brass font-semibold text-brass' : 'op-surface-2 border-hair text-snow-2 hover:op-surface-2' }`}
                      >
                        🪑 Mesa {t.number}
                        {t.name && <span className="text-ash ml-1 op-small">· {t.name}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: customer search */}
            {newTabType === 'TAB' && (
              <div className="mb-4 relative">
                <label className="block op-body text-ash mb-1">
                  Cliente {selectedCustomer && <span className=" ml-1">✓ Seleccionado</span>}
                </label>
                {selectedCustomer ? (
                  <div className="flex items-center gap-2 p-3 op-good border rounded-xl">
                    <span className="op-lead">👤</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-snow font-medium truncate">{selectedCustomer.name}</p>
                      {selectedCustomer.phone && <p className="op-small text-ash">{selectedCustomer.phone}</p>}
                    </div>
                    <button type="button" onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }}
                      className="w-8 h-8 flex items-center justify-center text-ash hover: rounded-lg hover:op-surface-2 transition-colors">
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={e => { setCustomerSearch(e.target.value); searchCustomers(e.target.value); }}
                        onFocus={() => { if (customers.length > 0) setShowCustomerDropdown(true); }}
                        placeholder="Buscar cliente por nombre o teléfono..."
                        className="w-full px-4 py-3 op-surface-2 border border-hair rounded-xl text-snow placeholder:text-ash focus:outline-none focus:border-brass op-body"
                      />
                      {loadingCustomers && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-brass border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    {showCustomerDropdown && customers.length > 0 && (
                      <div className="absolute z-30 left-0 right-0 mt-1 op-surface border border-hair rounded-xl overflow-hidden shadow-xl max-h-52 overflow-y-auto">
                        {customers.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); setShowCustomerDropdown(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:op-surface-2 transition-colors border-b border-hair last:border-0"
                          >
                            <span className="op-lead shrink-0">👤</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-snow font-medium op-body truncate">{c.name}</p>
                              {c.phone && <p className="op-small text-ash">{c.phone}</p>}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* WALKIN: optional name */}
            {newTabType === 'WALKIN' && (
              <div className="mb-4">
                <label className="block op-body text-ash mb-1">Nombre (opcional)</label>
                <input
                  type="text"
                  value={newTabLabel}
                  onChange={e => setNewTabLabel(e.target.value)}
                  placeholder="Ej: Pareja terraza, Juan..."
                  className="w-full px-4 py-3 op-surface-2 border border-hair rounded-xl text-snow placeholder:text-ash focus:outline-none focus:border-brass op-body"
                  autoFocus
                />
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowNewSession(false)}
                className="op-btn op-btn-ghost flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={createSession}
                disabled={
                  creatingSession ||
                  (newTabType === 'TABLE' && !selectedTableId) ||
                  (newTabType === 'TAB' && !selectedCustomer)
                }
                className="op-btn op-btn-primary flex-1"
              >
                {creatingSession ? 'Creando…' : 'Abrir tab'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel order modal (supervisor PIN) ─────────────────────────────── */}
      {cancelOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setCancelOrderId(null)}>
          <div className="op-surface rounded-xl shadow-xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="op-lead font-semibold text-snow mb-1">Cancelar orden</h3>
            <p className="op-body text-ash mb-4">Ingresá el PIN de supervisor para cancelar.</p>

            <div className="space-y-3">
              <div>
                <label className="block op-small text-ash mb-1">PIN de supervisor *</label>
                <input
                  type="password"
                  value={cancelPin}
                  onChange={(e) => setCancelPin(e.target.value)}
                  autoFocus
                  placeholder="Clave de supervisor"
                  className="w-full px-3 py-2 border border-hair rounded-lg op-body focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
              {error && <p className="op-body ">{error}</p>}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => { setCancelOrderId(null); setCancelPin(""); }}
                className="op-btn op-btn-ghost flex-1"
              >
                Volver
              </button>
              <button
                onClick={confirmCancelOrder}
                disabled={cancelling}
                className="op-btn op-btn-danger flex-1"
              >
                {cancelling ? 'Cancelando...' : 'Confirmar cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
