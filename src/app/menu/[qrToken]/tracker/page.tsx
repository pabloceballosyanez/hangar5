"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

interface TrackItem {
  id: string;
  status: string;
  quantity: number;
  menuItem: { name: string };
  variant: { name: string } | null;
}

interface TrackOrder {
  id: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  orderItems: TrackItem[];
}

const STATUS_STEPS = [
  { key: "PLACED", icon: "📋", label: "Recibido", desc: "Tu pedido fue recibido" },
  { key: "IN_KITCHEN", icon: "👨‍🍳", label: "En preparación", desc: "La cocina está trabajando" },
  { key: "READY", icon: "🍽️", label: "¡Listo!", desc: "Tu pedido está listo para entregar" },
  { key: "SERVED", icon: "✅", label: "Entregado", desc: "Pedido entregado" },
];

const ORDERED_STEPS = ["PLACED", "IN_KITCHEN", "READY", "SERVED"];

function fmt(v: number) {
  return `$${v.toFixed(2)}`;
}

export default function OrderTrackerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const qrToken = params.qrToken as string;
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<TrackOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await fetch(`/api/restaurant/orders/${orderId}/public-status`);
      if (!res.ok) throw new Error("Error al cargar orden");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setOrder(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 10000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  const handleConfirmDelivery = async () => {
    if (!orderId) return;
    setConfirming(true);
    try {
      const res = await fetch(`/api/restaurant/orders/${orderId}/confirm-delivery`, { method: "POST" });
      if (!res.ok) throw new Error("Error al confirmar");
      setConfirmed(true);
      await fetchOrder();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex flex-col items-center justify-center gap-4 px-4">
        <span className="text-5xl">🔍</span>
        <p className="text-amber-100 font-bold text-lg">No se encontró la orden</p>
        <Link href={`/menu/${qrToken}`} className="text-amber-400 underline">
          ← Volver al menú
        </Link>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex flex-col items-center justify-center gap-4 px-4">
        <span className="text-5xl">😕</span>
        <p className="text-amber-100 font-bold text-lg">No pudimos cargar tu orden</p>
        <p className="text-amber-200/60 text-sm">{error}</p>
        <Link href={`/menu/${qrToken}`} className="text-amber-400 underline">
          ← Volver al menú
        </Link>
      </div>
    );
  }

  if (!order) return null;

  const currentStepIdx = ORDERED_STEPS.indexOf(order.status);
  const isReady = order.status === "READY" || order.status === "IN_KITCHEN" && order.orderItems.some(i => i.status === "READY");
  const isDone = order.status === "SERVED" || confirmed;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 pb-8">
      {/* Header */}
      <div className="px-4 pt-8 pb-6 text-center">
        <h1 className="text-3xl font-black text-white mb-2">Tu pedido</h1>
        <p className="text-amber-200/60 text-sm">Mesa · Seguimiento en vivo</p>
      </div>

      {/* Status steps */}
      <div className="px-4 mb-8">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 space-y-0">
          {STATUS_STEPS.map((step, i) => {
            const stepIdx = ORDERED_STEPS.indexOf(step.key);
            const isComplete = currentStepIdx >= stepIdx;
            const isCurrent = ORDERED_STEPS[currentStepIdx] === step.key;
            return (
              <div key={step.key} className="flex items-center gap-4 py-3 relative">
                {/* Connector line */}
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`absolute left-[19px] top-[48px] w-0.5 h-[calc(100%-16px)] ${isComplete ? "bg-amber-400/50" : "bg-slate-700"}`} />
                )}
                {/* Circle */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg z-10 ${
                  isComplete ? "bg-amber-400 text-slate-900" : "bg-slate-700 text-slate-500"
                }`}>
                  {isComplete ? step.icon : "○"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm ${isComplete ? "text-white" : "text-slate-500"}`}>
                    {step.label}
                  </p>
                  <p className={`text-xs ${isCurrent ? "text-amber-400" : isComplete ? "text-slate-400" : "text-slate-600"}`}>
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order items */}
      <div className="px-4 mb-6">
        <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-3 px-1">
          🛒 {order.orderItems.length} ítem{order.orderItems.length !== 1 ? "es" : ""}
        </h2>
        <div className="space-y-2">
          {order.orderItems.map((item) => {
            const itemDone = item.status === "SERVED" || item.status === "CANCELLED";
            const itemReady = item.status === "READY";
            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  itemReady ? "bg-emerald-950/40 border border-emerald-500/30" :
                  itemDone ? "bg-slate-800/40 opacity-60" :
                  "bg-slate-800/60 border border-slate-700/50"
                }`}
              >
                <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold bg-amber-400/10 text-amber-400">
                  {item.quantity}×
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium leading-tight">
                    {item.menuItem.name}
                    {item.variant && <span className="text-slate-400"> · {item.variant.name}</span>}
                  </p>
                </div>
                <span className="text-sm shrink-0">
                  {itemReady ? "✅" : itemDone ? "🍽️" : "⏳"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-4 space-y-3">
        {isReady && !isDone && (
          <button
            onClick={handleConfirmDelivery}
            disabled={confirming}
            className="w-full min-h-[60px] bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-white font-black text-lg rounded-2xl transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
          >
            {confirming ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>✅ Ya recibí mi pedido</>
            )}
          </button>
        )}

        {isDone && (
          <div className="bg-emerald-950/50 border border-emerald-600/30 rounded-2xl p-5 text-center">
            <p className="text-4xl mb-2">🎉</p>
            <p className="text-emerald-400 font-bold text-lg">¡Pedido entregado!</p>
            <p className="text-emerald-600/70 text-sm mt-1">Gracias por confirmar</p>
          </div>
        )}

        <Link
          href={`/menu/${qrToken}`}
          className="w-full min-h-[56px] bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
        >
          🍴 Pedir algo más
        </Link>
      </div>
    </div>
  );
}
