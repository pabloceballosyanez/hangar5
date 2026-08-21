'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

function formatPrice(pesos: number): string {
  return pesos.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700 border-gray-300",
  AWAITING_PAYMENT: "bg-yellow-100 text-yellow-700 border-yellow-300",
  PLACED: "bg-blue-100 text-blue-700 border-blue-300",
  IN_KITCHEN: "bg-orange-100 text-orange-700 border-orange-300",
  READY: "bg-green-100 text-green-700 border-green-300",
  SERVED: "bg-emerald-100 text-emerald-800 border-emerald-300",
  PAID: "bg-violet-100 text-violet-700 border-violet-300",
  CANCELLED: "bg-red-100 text-red-700 border-red-300",
};

const statusLabel: Record<string, string> = {
  DRAFT: "Borrador",
  AWAITING_PAYMENT: "Pendiente de pago",
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

const paymentMethodLabel: Record<string, string> = {
  CASH: "💵 Efectivo",
  CARD: "💳 Tarjeta",
  TRANSFER: "🏦 Transferencia",
  MP: "💳 MercadoPago",
  ON_ACCOUNT: "📒 Crédito",
};

const paymentOptions = [
  { method: "CASH", label: "💵 Efectivo", color: "bg-green-100 text-green-700 border-green-300 hover:bg-green-200" },
  { method: "CARD", label: "💳 Tarjeta", color: "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200" },
  { method: "ON_ACCOUNT", label: "📒 Crédito", color: "bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200", requiresCustomer: true },
];

const tabs = [
  { key: "", label: "Todas" },
  { key: "active", label: "Activas" },
  { key: "pending-pay", label: "Pendientes" },
  { key: "completed", label: "Completadas" },
  { key: "cancelled", label: "Canceladas" },
] as const;

// API filters map to status arrays for client-side filtering
const TAB_FILTER: Record<string, string[]> = {
  active: ["PLACED", "IN_KITCHEN", "READY", "SERVED"],
  "pending-pay": ["AWAITING_PAYMENT"],
  completed: ["PAID"],
  cancelled: ["CANCELLED"],
};

interface OrderItem {
  id: string;
  quantity: number;
  status: string;
  menuItem: { name: string; prepStation: string };
  variant: { name: string } | null;
  modifiers: { modifierName: string; priceDelta: number }[];
  specialInstructions: string | null;
}

interface Order {
  id: string;
  serviceSession: {
    table: { number: string; name: string | null } | null;
    customer: { id: string; name: string; hasCredit: boolean } | null;
  } | null;
  table: { number: string; name: string | null } | null;
  customerName: string | null;
  source: string;
  status: string;
  total: number;
  subtotal: number;
  tax: number;
  createdAt: string;
  orderItems: OrderItem[];
  payments: { method: string; status: string }[];
}

async function advanceOrderStatus(orderId: string, newStatus: string, paymentMethod?: string, supervisorPin?: string, reason?: string): Promise<void> {
  const body: Record<string, string> = { status: newStatus };
  if (paymentMethod) body.paymentMethod = paymentMethod;
  if (supervisorPin) body.supervisorPin = supervisorPin;
  if (reason) body.reason = reason;
  const res = await fetch(`/api/admin/restaurant/orders/${orderId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error((d as { error?: string }).error ?? 'Error');
  }
}

async function deliverOrderItems(orderId: string): Promise<number> {
  // confirm-delivery marks READY items as SERVED and auto-advances order to SERVED when all items are done
  const res = await fetch(`/api/restaurant/orders/${orderId}/confirm-delivery`, {
    method: 'POST',
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error((d as { error?: string }).error ?? 'Error');
  }
  const data = await res.json();
  return (data as { itemsMarked?: number }).itemsMarked ?? 0;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [selectingPayment, setSelectingPayment] = useState<string | null>(null);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelPin, setCancelPin] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/admin/restaurant/orders");
      if (!res.ok) return;
      let data: Order[] = await res.json();
      const statusFilter = TAB_FILTER[activeTab];
      if (statusFilter) data = data.filter(o => statusFilter.includes(o.status));
      setOrders(data);
    } catch { /* keep old data */ }
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/restaurant/orders");
        if (!res.ok || cancelled) return;
        let data: Order[] = await res.json();
        if (!cancelled) {
          const statusFilter = TAB_FILTER[activeTab];
          if (statusFilter) data = data.filter(o => statusFilter.includes(o.status));
          setOrders(data);
        }
      } catch { /* keep old data */ } finally {
        if (!cancelled) setLoading(false);
      }
    }
    setLoading(true);
    load();
    const interval = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [activeTab]);

  const emptyMessage = activeTab === "active"
    ? "No hay órdenes activas en este momento."
    : activeTab === "pending-pay"
    ? "No hay órdenes pendientes de pago."
    : activeTab === "completed"
    ? "No hay órdenes completadas."
    : activeTab === "cancelled"
    ? "No hay órdenes canceladas."
    : "Aún no se han registrado órdenes.";

  async function handleCancelOrder() {
    if (!cancelOrderId) return;
    if (!cancelReason.trim()) {
      setActionError("Escribí un motivo para cancelar la orden");
      return;
    }
    setActionLoading(cancelOrderId);
    setActionError(null);
    try {
      await advanceOrderStatus(cancelOrderId, 'CANCELLED', undefined, cancelPin, cancelReason);
      setCancelOrderId(null);
      setCancelPin("");
      setCancelReason("");
      await fetchOrders();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Error');
    }
    setActionLoading(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Órdenes</h1>
        <span className="text-xs text-gray-400">
          Actualización automática cada 30s
        </span>
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {actionSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 flex items-center justify-between animate-pulse">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-green-400 hover:text-green-600">✕</button>
        </div>
      )}

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
                  <th className="text-center py-3 px-4 font-medium text-gray-500 uppercase text-xs tracking-wider">
                    Pago
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500 uppercase text-xs tracking-wider">
                    Acción
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
                          {order.table?.number || order.serviceSession?.table?.number || "—"}
                        </span>
                        {(order.table?.name || order.serviceSession?.table?.name) && (
                          <span className="text-xs text-gray-400 ml-1">
                            · {order.table?.name || order.serviceSession?.table?.name}
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
                    <td className="py-3 px-4 text-center">
                      {order.payments && order.payments.length > 0 ? (
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${
                          order.payments[0].status === "COMPLETED"
                            ? "bg-green-100 text-green-700 border-green-300"
                            : "bg-yellow-100 text-yellow-700 border-yellow-300"
                        }`}>
                          {paymentMethodLabel[order.payments[0].method] || order.payments[0].method}
                          {order.payments[0].status === "COMPLETED" ? " ✓" : " ⏳"}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {actionLoading === order.id ? (
                        <span className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin inline-block" />
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          {['DRAFT', 'AWAITING_PAYMENT', 'PLACED', 'IN_KITCHEN', 'READY'].includes(order.status) && (
                        <button
                          onClick={() => { setCancelOrderId(order.id); setCancelPin(""); setCancelReason(""); }}
                          className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 border border-red-300 rounded-md hover:bg-red-200 transition-colors"
                          title="Cancelar orden (requiere supervisor)"
                        >
                          ❌ Cancelar
                        </button>
                      )}
                      {(order.orderItems.some(i => i.status === 'READY')) && (
                            (() => {
                              const readyCount = order.orderItems.filter(i => i.status === 'READY').length;
                              return (
                                <button
                                  onClick={async () => {
                                    setActionLoading(order.id);
                                    setActionSuccess(null);
                                    setActionError(null);
                                    try {
                                      const count = await deliverOrderItems(order.id);
                                      setActionSuccess(`✅ ${count} ítem(s) entregado(s)`);
                                      await fetchOrders();
                                    } catch (e) { setActionError(e instanceof Error ? e.message : 'Error'); }
                                    setActionLoading(null);
                                  }}
                                  className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-md hover:bg-emerald-200 transition-colors"
                                  title={`Entregar ${readyCount} ítem(es) listo(s)`}
                                >
                                  ✅ Entregar ({readyCount})
                                </button>
                              );
                            })()
                          )}
                          {order.status === 'SERVED' && selectingPayment !== order.id && (
                            <button
                              onClick={() => setSelectingPayment(order.id)}
                              className="px-2 py-1 text-xs font-medium bg-violet-100 text-violet-700 border border-violet-300 rounded-md hover:bg-violet-200 transition-colors"
                              title="Seleccionar método de pago"
                            >
                              💰 Pagar
                            </button>
                          )}
                          {order.status === 'SERVED' && selectingPayment === order.id && (
                            <div className="flex flex-col gap-1">
                              {paymentOptions.map((opt) => {
                                const disabled = opt.requiresCustomer && !order.serviceSession?.customer?.hasCredit;
                                return (
                                  <button
                                    key={opt.method}
                                    disabled={disabled}
                                    onClick={async () => {
                                      setActionLoading(order.id);
                                      setSelectingPayment(null);
                                      try {
                                        await advanceOrderStatus(order.id, 'PAID', opt.method);
                                        await fetchOrders();
                                      } catch (e) {
                                        setActionError(e instanceof Error ? e.message : 'Error');
                                      }
                                      setActionLoading(null);
                                    }}
                                    className={`px-2 py-1 text-xs font-medium border rounded-md transition-colors ${
                                      disabled
                                        ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed'
                                        : opt.color
                                    }`}
                                    title={disabled ? 'Cliente sin crédito habilitado' : opt.label}
                                  >
                                    {opt.label}{disabled ? ' 🔒' : ''}
                                  </button>
                                );
                              })}
                              <button
                                onClick={() => setSelectingPayment(null)}
                                className="px-2 py-0.5 text-xs text-gray-400 hover:text-gray-600"
                              >
                                Cancelar
                              </button>
                            </div>
                          )}
                          {order.status !== 'AWAITING_PAYMENT' && order.status !== 'READY' && order.status !== 'SERVED' && order.status !== 'PAID' && order.status !== 'CANCELLED' &&
                            // Hide "Avanzar" for IN_KITCHEN when items are still pending (Fix #1 blocks it, cook handles it via KDS)
                            !(order.status === 'IN_KITCHEN' && order.orderItems.some(i => i.status !== 'READY' && i.status !== 'SERVED' && i.status !== 'CANCELLED')) && (
                            <button
                              onClick={async () => {
                                setActionLoading(order.id);
                                try {
                                  const next: Record<string, string> = { PLACED: 'IN_KITCHEN', IN_KITCHEN: 'READY', DRAFT: 'PLACED' };
                                  const target = next[order.status];
                                  if (target) await advanceOrderStatus(order.id, target);
                                  await fetchOrders();
                                } catch (e) { setActionError(e instanceof Error ? e.message : 'Error'); }
                                setActionLoading(null);
                              }}
                              className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 border border-blue-300 rounded-md hover:bg-blue-200 transition-colors"
                              title="Avanzar estado"
                            >
                              ⏭ Avanzar
                            </button>
                          )}
                        </div>
                      )}
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

      {/* ── Cancel order modal ─────────────────────────────────────────────── */}
      {cancelOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setCancelOrderId(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Cancelar orden</h3>
            <p className="text-sm text-gray-500 mb-4">
              Esta acción requiere autorización de supervisor y quedará registrada en la auditoría.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">PIN de supervisor *</label>
                <input
                  type="password"
                  value={cancelPin}
                  onChange={(e) => setCancelPin(e.target.value)}
                  autoFocus
                  placeholder="Clave de supervisor"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Motivo de cancelación *</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={2}
                  placeholder='Ej: "Error al tomar la orden", "Cliente canceló"'
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => { setCancelOrderId(null); setCancelPin(""); setCancelReason(""); }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Volver
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={actionLoading === cancelOrderId}
                className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading === cancelOrderId ? 'Cancelando...' : 'Confirmar cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
