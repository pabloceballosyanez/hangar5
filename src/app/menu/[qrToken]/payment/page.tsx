"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItemModifier {
  id: string;
  modifierName: string;
  priceDelta: number; // centavos
}

interface OrderItemVariant {
  id: string;
  name: string;
}

interface OrderMenuItem {
  id: string;
  name: string;
}

interface OrderItem {
  id: string;
  menuItem: OrderMenuItem;
  variant?: OrderItemVariant | null;
  modifiers: OrderItemModifier[];
  quantity: number;
  unitPrice: number; // centavos (raw from API)
  specialInstructions?: string | null;
}

interface Order {
  id: string;
  status: string;
  subtotal: number; // pesos (serialized)
  tax: number; // pesos
  total: number; // pesos
  customerName?: string | null;
  notes?: string | null;
  serviceSession: {
    table: {
      number: string;
      name?: string | null;
    };
  };
  orderItems: OrderItem[];
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `$${n.toFixed(2)}`;
}

// unitPrice from API is in centavos; modifiers.priceDelta also centavos
function itemLineTotal(item: OrderItem) {
  const unitPesos = item.unitPrice / 100;
  const extraPesos = item.modifiers.reduce(
    (s, m) => s + m.priceDelta / 100,
    0
  );
  return (unitPesos + extraPesos) * item.quantity;
}

// ─── Payment page content ─────────────────────────────────────────────────────

function PaymentContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const qrToken = params.qrToken as string;
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [payingCash, setPayingCash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError("No se encontró el ID de la orden");
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const res = await fetch(`/api/admin/restaurant/orders/${orderId}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("No pudimos cargar tu orden");
        const data = (await res.json()) as Order;
        setOrder(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [orderId]);

  const handlePay = async () => {
    if (!orderId) return;
    setPaying(true);
    setError(null);

    try {
      const res = await fetch("/api/restaurant/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Error al procesar el pago");
      }

      const { initPoint } = (await res.json()) as {
        preferenceId: string;
        initPoint: string;
        testMode?: boolean;
      };

      // Redirect to MP (or test confirmation)
      window.location.href = initPoint;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
      setPaying(false);
    }
  };

  const handlePayCash = async () => {
    if (!orderId) return;
    setPayingCash(true);
    setError(null);

    try {
      const res = await fetch("/api/restaurant/checkout/cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Error al procesar pago en efectivo");
      }

      const { redirectUrl } = (await res.json()) as { success: boolean; redirectUrl: string };
      window.location.href = redirectUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
      setPayingCash(false);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Cargando tu orden…</p>
      </div>
    );
  }

  // ── Error / no order ──
  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <span className="text-5xl">😕</span>
        <p className="font-semibold text-gray-800">{error ?? "Orden no encontrada"}</p>
        <button
          onClick={() => router.push(`/menu/${qrToken}`)}
          className="px-6 py-3 bg-amber-500 text-white font-bold rounded-2xl min-h-[44px] active:scale-95 transition-transform"
        >
          Volver al menú
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 -mt-2">
        <button
          onClick={() => router.back()}
          aria-label="Volver"
          className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 active:scale-90 transition-transform text-lg"
        >
          ←
        </button>
        <div>
          <h1 className="text-xl font-black text-gray-900">Pagar orden</h1>
          <p className="text-xs text-gray-500">
            Mesa {order.serviceSession.table?.number}
            {order.serviceSession.table?.name
              ? ` · ${order.serviceSession.table?.name}`
              : ""}
          </p>
        </div>
      </div>

      {/* ── Confirmed banner ── */}
      <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex items-center gap-3">
        <span className="text-2xl">✅</span>
        <div>
          <p className="text-sm font-bold text-green-800">
            Orden recibida
          </p>
          <p className="text-xs text-green-600 mt-0.5">
            Hola{order.customerName ? ` ${order.customerName}` : ""}! Tu orden está confirmada.
            Paga para que empiece la preparación.
          </p>
        </div>
      </div>

      {/* ── Order items ── */}
      <section>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
          Resumen
        </h2>
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100 overflow-hidden">
          {order.orderItems.map((item) => (
            <div key={item.id} className="flex justify-between px-4 py-3 gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 leading-snug">
                  {item.quantity}× {item.menuItem.name}
                  {item.variant && (
                    <span className="text-gray-500 font-normal">
                      {" "}({item.variant.name})
                    </span>
                  )}
                </p>
                {item.modifiers.length > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {item.modifiers.map((m) => m.modifierName).join(", ")}
                  </p>
                )}
                {item.specialInstructions && (
                  <p className="text-xs text-gray-400 italic mt-0.5">
                    &quot;{item.specialInstructions}&quot;
                  </p>
                )}
              </div>
              <p className="text-sm font-bold text-amber-600 flex-none">
                {fmt(itemLineTotal(item))}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Totals ── */}
      <section className="bg-white rounded-2xl shadow-sm px-4 py-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span>{fmt(order.subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-400">
          <span>IVA</span>
          <span>Incluido</span>
        </div>
        <div className="flex justify-between font-black text-gray-900 text-lg border-t border-gray-100 pt-2 mt-2">
          <span>Total</span>
          <span className="text-amber-600">{fmt(order.total)}</span>
        </div>
      </section>

      {/* ── Notes ── */}
      {order.notes && (
        <div className="bg-gray-50 rounded-2xl px-4 py-3 text-sm text-gray-600 italic">
          📝 {order.notes}
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm font-medium">
          {error}
        </div>
      )}

      {/* ── Pay buttons ── */}
      <div className="space-y-3">
        {/* Card payment */}
        <button
          onClick={handlePay}
          disabled={paying || payingCash}
          className="w-full bg-[#009ee3] hover:bg-[#0083c6] disabled:opacity-60 active:scale-[0.98] text-white font-black py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 text-base min-h-[56px]"
        >
          {paying ? (
            <>
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Redirigiendo a MP…</span>
            </>
          ) : (
            <>
              <span>💳</span>
              <span>Pagar con tarjeta</span>
              <span className="ml-auto font-black">{fmt(order.total)}</span>
            </>
          )}
        </button>

        {/* Cash payment */}
        <button
          onClick={handlePayCash}
          disabled={payingCash || paying}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 active:scale-[0.98] text-white font-black py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 text-base min-h-[56px]"
        >
          {payingCash ? (
            <>
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Procesando…</span>
            </>
          ) : (
            <>
              <span>💵</span>
              <span>Pagar en efectivo</span>
              <span className="ml-auto font-black">{fmt(order.total)}</span>
            </>
          )}
        </button>
      </div>

      <p className="text-center text-xs text-gray-400">
        Con tarjeta: serás redirigido a Mercado Pago. Con efectivo: pagas directo al mesero.
      </p>
    </div>
  );
}

// ─── Default export with Suspense (required for useSearchParams) ──────────────

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Cargando…</p>
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
