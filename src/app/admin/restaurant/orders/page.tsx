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
  DRAFT: "bg-[var(--color-adp-papel-3)] text-[var(--color-adp-tinta)] border-[var(--color-adp-borde-2)]",
  AWAITING_PAYMENT: "bg-[var(--color-adp-atencion)] text-white border-[var(--color-adp-atencion)]",
  PLACED: "bg-[var(--color-adp-info)] text-white border-[var(--color-adp-info)]",
  IN_KITCHEN: "bg-[var(--color-adp-atencion)] text-white border-[var(--color-adp-atencion)]",
  READY: "bg-[var(--color-adp-listo)] text-white border-[var(--color-adp-listo)]",
  SERVED: "bg-[var(--color-adp-listo)] text-white border-[var(--color-adp-listo)]",
  PAID: "bg-[var(--color-adp-info)] text-white border-[var(--color-adp-info)]",
  CANCELLED: "bg-[var(--color-adp-urgente)] text-white border-[var(--color-adp-urgente)]",
  };

const statusLabel: Record<string, string> = {
  DRAFT: "Borrador",
  AWAITING_PAYMENT: "Pendiente de pago",
  PLACED: "Recibida",
  IN_KITCHEN: "En cocina",
  READY: "Lista",
  SERVED: "Servida",
  /* Cobrar no es un paso de la cocina: la comida ya salió. Decir
     "Pagada" aquí repetía lo que la columna PAGO ya dice y borraba el
     dato de si el platillo llegó a la mesa. */
  PAID: "Entregada",
  CANCELLED: "Cancelada",
};

const sourceLabel: Record<string, string> = {
  WAITER: "Mesero",
  QR: "QR",
  ADMIN: "Admin",
  MOSTRADOR: "Despegue",
  TEST: "Prueba",
};

/* Etiqueta de PREPARACIÓN.
   Antes había una sola columna "Status" que mezclaba dos cosas
   distintas: dónde va el pedido y si está pagado. Una venta de
   mostrador cobrada al momento aparecía como "En cocina" y se leía
   como si no estuviera pagada, cuando el pago sí estaba registrado.
   Ahora se muestran separadas. */
const prepLabel: Record<string, string> = {
  DRAFT: "Borrador",
  AWAITING_PAYMENT: "Sin pagar",
  PLACED: "Recibida",
  IN_KITCHEN: "En preparación",
  READY: "Lista",
  SERVED: "Servida",
  /* Cobrar no es un paso de la cocina: la comida ya salió. Decir
     "Pagada" aquí repetía lo que la columna PAGO ya dice y borraba el
     dato de si el platillo llegó a la mesa. */
  PAID: "Entregada",
  CANCELLED: "Cancelada",
};

const prepColors: Record<string, string> = {
  DRAFT: "bg-[var(--color-adp-papel-3)] text-[var(--color-adp-tinta-2)] border-[var(--color-adp-borde-2)]",
  AWAITING_PAYMENT: "bg-[var(--color-adp-atencion)] text-white border-[var(--color-adp-atencion)]",
  PLACED: "bg-[var(--color-adp-info)] text-white border-[var(--color-adp-info)]",
  IN_KITCHEN: "bg-[var(--color-adp-atencion)] text-white border-[var(--color-adp-atencion)]",
  READY: "bg-[var(--color-adp-info)] text-white border-[var(--color-adp-info)]",
  SERVED: "bg-[var(--color-adp-listo)] text-white border-[var(--color-adp-listo)]",
  PAID: "bg-[var(--color-adp-listo)] text-white border-[var(--color-adp-listo)]",
  /* PAID y CANCELLED ya no se pintan aquí: el cobro vive en su propia
     columna y "cancelada" tiene su propio tab. Esta columna responde una
     sola pregunta: ¿por dónde va la comida? */

  CANCELLED: "bg-[var(--color-adp-urgente)] text-white border-[var(--color-adp-urgente)]",
};

const paymentMethodLabel: Record<string, string> = {
  CASH: "💵 Efectivo",
  CARD: "💳 Tarjeta",
  TRANSFER: "🏦 Transferencia",
  MP: "💳 MercadoPago",
  ON_ACCOUNT: "📒 Crédito",
};

const paymentOptions = [
  { method: "CASH", label: "💵 Efectivo", color: "bg-[var(--color-adp-listo)] text-white border-[var(--color-adp-listo)] hover:bg-[var(--color-adp-listo)]" },
  { method: "CARD", label: "💳 Tarjeta", color: "bg-[var(--color-adp-info)] text-white border-[var(--color-adp-info)] hover:bg-[var(--color-adp-info)]" },
  { method: "ON_ACCOUNT", label: "📒 Crédito", color: "bg-[var(--color-adp-atencion)] text-white border-[var(--color-adp-atencion)] hover:bg-[var(--color-adp-atencion)]", requiresCustomer: true },
];

/* Los tabs siguen el FLUJO, no los nombres internos de los estados.
   Antes "Pendientes" buscaba AWAITING_PAYMENT, un estado que casi no se
   usa, así que una orden en cocina sin pagar no aparecía ahí; y "Activas"
   metía las entregadas, que ya no están activas en ninguna parte.

   Ahora cada tab responde una pregunta que el encargado sí se hace:
     Activas    ¿qué se está trabajando?
     Por cobrar ¿qué ya salió y falta que alguien pague?
     Cerradas   ¿qué ya está cobrado?
     Canceladas ¿qué se cayó? */
const tabs = [
  { key: "", label: "Todas" },
  { key: "activas", label: "Activas" },
  { key: "por-cobrar", label: "Por cobrar" },
  { key: "cerradas", label: "Cerradas" },
  { key: "canceladas", label: "Canceladas" },
] as const;

// Agrupación por flujo. El servidor entiende las mismas claves.
const TAB_FILTER: Record<string, string[]> = {
  activas: ["DRAFT", "PLACED", "IN_KITCHEN", "READY"],
  "por-cobrar": ["SERVED"],
  cerradas: ["PAID"],
  canceladas: ["CANCELLED"],
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
    label: string;
    type: string;
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

  const fetchOrders = async () => {
    try {
      /* Se le pasa el tab al servidor: él distingue "por cobrar" de
      /* "cerradas" por el pago, cosa que un filtro por status no puede
      /* hacer, porque una orden cobrada sigue en SERVED. */
      const qs = activeTab ? `?status=${encodeURIComponent(activeTab)}` : "";
      const res = await fetch(`/api/admin/restaurant/orders${qs}`);
      if (!res.ok) return;
      const data: Order[] = await res.json();
      setOrders(data);
    } catch { /* keep old data */ }
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const qs = activeTab ? `?status=${encodeURIComponent(activeTab)}` : "";
        const res = await fetch(`/api/admin/restaurant/orders${qs}`);
        if (!res.ok || cancelled) return;
        const data: Order[] = await res.json();
        if (!cancelled) setOrders(data);
      } catch { /* keep old data */ } finally {
        if (!cancelled) setLoading(false);
      }
    }
    setLoading(true);
    load();
    const interval = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [activeTab]);

  const emptyMessage = activeTab === "activas"
    ? "Nada se está trabajando ahora mismo."
    : activeTab === "por-cobrar"
    ? "Todo lo entregado está cobrado."
    : activeTab === "cerradas"
    ? "Todavía no se ha cobrado ninguna orden."
    : activeTab === "canceladas"
    ? "No hay órdenes canceladas."
    : "Aún no se han registrado órdenes.";

  async function handleCancelOrder() {
    if (!cancelOrderId) return;
    setActionLoading(cancelOrderId);
    setActionError(null);
    try {
      await advanceOrderStatus(cancelOrderId, 'CANCELLED', undefined, cancelPin);
      setCancelOrderId(null);
      setCancelPin("");
      await fetchOrders();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Error');
    }
    setActionLoading(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-adp-tinta)]">Órdenes</h1>
        <span className="text-xs text-[var(--color-adp-tinta-2)]">
          Actualización automática cada 30s
        </span>
      </div>

      {actionError && (
        <div className="bg-[var(--color-adp-urgente)] border border-[var(--color-adp-urgente)] rounded-xl px-4 py-3 text-sm text-white flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-[var(--color-adp-urgente)] hover:text-[var(--color-adp-urgente)]">✕</button>
        </div>
      )}

      {actionSuccess && (
        <div className="bg-[var(--color-adp-listo)] border border-[var(--color-adp-listo)] rounded-xl px-4 py-3 text-sm text-white flex items-center justify-between animate-pulse">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-[var(--color-adp-listo)] hover:text-[var(--color-adp-pino)]">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--color-adp-borde)]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-[var(--color-adp-info)] text-[var(--color-adp-pino)]"
                : "border-transparent text-[var(--color-adp-tinta-2)] hover:text-[var(--color-adp-tinta)] hover:border-[var(--color-adp-borde-2)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-[var(--color-adp-borde)] p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-adp-info)] mx-auto mb-4" />
          <p className="text-[var(--color-adp-tinta-2)] text-sm">Cargando órdenes...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-[var(--color-adp-borde)] p-8 text-center">
          <p className="text-[var(--color-adp-tinta-2)] text-lg">No hay órdenes</p>
          <p className="text-[var(--color-adp-tinta-2)] text-sm mt-1">{emptyMessage}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-[var(--color-adp-borde)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-adp-borde)] bg-[var(--color-adp-papel-3)]">
                  <th className="text-left py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs tracking-wider">
                    Mesa
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs tracking-wider">
                    Fuente
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs tracking-wider">
                    Items
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs tracking-wider">
                    Total
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs tracking-wider">
                    Preparación
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs tracking-wider">
                    Pago
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs tracking-wider">
                    Hora
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-adp-borde)]">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-[var(--color-adp-papel-3)] transition-colors">
                    <td className="py-3 px-4">
                      {/* Quién es el pedido.
                          Antes solo se mostraba customerName, que casi
                          nunca se llena: el nombre real vive en la sesión
                          (cliente registrado, walk-in o el label del tab).
                          Por eso "desapareció" el nombre del walk-in. */}
                      {(() => {
                        const mesa = order.table?.number || order.serviceSession?.table?.number;
                        const mesaNombre = order.table?.name || order.serviceSession?.table?.name;
                        const cliente =
                          order.serviceSession?.customer?.name ||
                          order.customerName ||
                          order.serviceSession?.label ||
                          null;
                        const esWalkIn = order.serviceSession?.type === "WALKIN";
                        const esTab = order.serviceSession?.type === "TAB";

                        return (
                          <div>
                            <span className="font-bold text-[var(--color-adp-tinta)]">
                              {mesa || (esWalkIn ? "Walk-in" : esTab ? "Cliente" : "—")}
                            </span>
                            {mesaNombre && (
                              <span className="text-xs text-[var(--color-adp-tinta-2)] ml-1">· {mesaNombre}</span>
                            )}
                            {cliente && cliente !== mesa && (
                              <p className="text-xs text-[var(--color-adp-tinta-2)]">{cliente}</p>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-[var(--color-adp-tinta-2)]">
                        {sourceLabel[order.source] || order.source}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="space-y-1">
                        {order.orderItems.map((item) => (
                          <div key={item.id} className="text-xs">
                            <span className="text-[var(--color-adp-tinta)] font-medium">
                              {item.quantity}x {item.menuItem.name}
                            </span>
                            {item.variant && (
                              <span className="text-[var(--color-adp-tinta-2)]"> ({item.variant.name})</span>
                            )}
                            {item.modifiers && item.modifiers.length > 0 && (
                              <span className="text-[var(--color-adp-tinta-2)]">
                                {" "}
                                · {item.modifiers.map((m) => m.modifierName).join(", ")}
                              </span>
                            )}
                            {item.specialInstructions && (
                              <p className="text-[var(--color-adp-tinta-2)] italic pl-2">
                                Nota: {item.specialInstructions}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-[var(--color-adp-tinta)] whitespace-nowrap">
                      {formatPrice(order.total)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full border ${
                          prepColors[order.status] || "bg-[var(--color-adp-papel-3)] text-[var(--color-adp-tinta)]"
                        }`}
                      >
                        {prepLabel[order.status] || order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {order.status === "CANCELLED" ? (
                        /* Una orden cancelada no se cobra: decir "Pendiente"
                           hace pensar que falta dinero, cuando en realidad
                           ya no hay nada que cobrar. */
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="inline-block px-2 py-1 text-xs font-medium rounded-full border bg-[var(--color-adp-papel-3)] text-[var(--color-adp-tinta-2)] border-[var(--color-adp-borde-2)]">
                            No se cobra
                          </span>
                          <span className="text-[10px] text-[var(--color-adp-tinta-2)]">cancelada</span>
                        </div>
                      ) : order.payments && order.payments.length > 0 ? (() => {
                        const p = order.payments[0];
                        const pagado = p.status === "COMPLETED";
                        const aCuenta = p.method === "ON_ACCOUNT";
                        return (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${
                              pagado
                                ? "bg-[var(--color-adp-listo)] text-white border-[var(--color-adp-listo)]"
                                : "bg-[var(--color-adp-atencion)] text-[var(--color-adp-atencion)] border-[var(--color-adp-atencion)]"
                            }`}>
                              {pagado ? "Pagado" : "Pendiente"}
                            </span>
                            <span className="text-[10px] text-[var(--color-adp-tinta-2)]">
                              {aCuenta
                                ? "a su cuenta (libro)"
                                : paymentMethodLabel[p.method] || p.method}
                            </span>
                          </div>
                        );
                      })() : (
                        /* Pagada sin registro de pago: son órdenes de
                           antes de que existiera el registro. Decir "—"
                           hace dudar si falta cobrar. */
                        order.status === "PAID" ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="inline-block px-2 py-1 text-xs font-medium rounded-full border bg-[var(--color-adp-papel-3)] text-[var(--color-adp-tinta-2)] border-[var(--color-adp-borde-2)]">
                              Sin registro
                            </span>
                            <span className="text-[10px] text-[var(--color-adp-tinta-2)]">orden vieja</span>
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--color-adp-tinta-2)]">—</span>
                        )
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-[var(--color-adp-tinta-2)] whitespace-nowrap">
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
            <h3 className="text-lg font-semibold text-[var(--color-adp-tinta)] mb-1">Cancelar orden</h3>
            <p className="text-sm text-[var(--color-adp-tinta-2)] mb-4">
              Esta acción requiere autorización de un gerente o del dueño, y quedará registrada en la auditoría.
            </p>

            {/* Qué se cobra y qué se cancela.
                Si la orden ya tiene platillos entregados, no se cancela
                todo: lo que el cliente ya consumió se cobra. Sin este
                aviso, el cajero cancela creyendo que no queda nada por
                pagar y luego aparece una cuenta viva. */}
            {(() => {
              const o = orders.find(x => x.id === cancelOrderId);
              if (!o) return null;
              const vivios = o.orderItems.filter(i => i.status !== 'CANCELLED');
              const cobran = vivios.filter(i => i.status === 'SERVED' || i.status === 'READY');
              const cancelan = vivios.filter(i => i.status === 'PENDING');
              if (cobran.length === 0) return null;
              return (
                <div className="mb-4 rounded-lg border border-[var(--color-adp-atencion)] bg-[var(--color-adp-atencion)] p-3 text-left text-white">
                  <p className="text-xs font-semibold text-[var(--color-adp-atencion)] mb-1">
                    Esta orden ya tiene {cobran.length} ítem(s) entregado(s)
                  </p>
                  <p className="text-xs text-[var(--color-adp-atencion)]">
                    Solo se cancelarán los {cancelan.length} pendiente(s).
                    Lo entregado se queda y hay que cobrarlo.
                  </p>
                </div>
              );
            })()}

            {/* El error se guardaba pero nunca se veía: el botón parecía
                no hacer nada. Ahora se muestra aquí mismo. */}
            {actionError && (
              <p className="mb-3 text-sm bg-[var(--color-adp-urgente)] text-white rounded-lg px-3 py-2">
                {actionError}
              </p>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[var(--color-adp-tinta-2)] mb-1">
                  PIN del gerente (4 dígitos) o clave del dueño
                </label>
                <input
                  type="password"
                  value={cancelPin}
                  onChange={(e) => setCancelPin(e.target.value)}
                  autoFocus
                  placeholder="Ej. 5043"
                  className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-adp-urgente)]/40 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => { setCancelOrderId(null); setCancelPin(""); }}
                className="flex-1 px-4 py-2 bg-[var(--color-adp-papel-3)] text-[var(--color-adp-tinta)] text-sm font-medium rounded-lg hover:bg-[var(--color-adp-borde)] transition-colors"
              >
                Volver
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={actionLoading === cancelOrderId}
                className="flex-1 px-4 py-2 bg-[var(--color-adp-urgente)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-adp-urgente)]/85 disabled:opacity-50 transition-colors"
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
