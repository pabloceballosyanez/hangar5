"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

interface OrderSummary {
  id: string;
  status: string;
  subtotal: number; // pesos
  tax: number;
  total: number;
  createdAt: string;
  orderItems: {
    quantity: number;
    menuItem: { name: string };
    variant?: { name: string } | null;
  }[];
}

function fmt(n: number) {
  return `$${n.toFixed(2)}`;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  PLACED: "Recibida",
  IN_KITCHEN: "En cocina",
  READY: "Lista",
  SERVED: "Servida",
  PAID: "Pagada",
  CANCELLED: "Cancelada",
};

const STATUS_BADGES: Record<string, string> = {
  DRAFT: "badge badge-info",
  PLACED: "badge badge-gold",
  IN_KITCHEN: "badge badge-warn",
  READY: "badge badge-ok",
  SERVED: "badge badge-info",
  PAID: "badge badge-ok",
  CANCELLED: "badge badge-bad",
};

export default function CuentaPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const meRes = await fetch("/api/auth/customer/me");
        const meData = await meRes.json();
        if (!meData.customer) {
          router.push("/ingresar?redirect=/cuenta");
          return;
        }
        setProfile(meData.customer);

        // Fetch orders for this customer
        const ordersRes = await fetch("/api/auth/customer/orders", { cache: "no-store" });
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setOrders(Array.isArray(ordersData) ? ordersData : []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/customer/logout", { method: "POST" });
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-night flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return null; // redirecting
  }

  return (
    <div className="min-h-screen bg-night text-cream px-4 py-10">
      <div className="max-w-lg mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="text-[11px] tracking-[0.2em] uppercase text-muted hover:text-gold transition-colors">
            ← Volver
          </Link>
          <button
            onClick={handleLogout}
            className="text-[11px] tracking-[0.2em] uppercase text-bad hover:text-cream transition-colors"
          >
            Cerrar sesión
          </button>
        </div>

        {/* Profile card */}
        <div className="card-night p-7">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-full border border-gold-dim/50 bg-gold/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="display text-2xl">{profile.name}</h1>
              <p className="text-sm text-muted mt-1">{profile.email}</p>
              {profile.phone && (
                <p className="text-sm text-faint">{profile.phone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Order history */}
        <section>
          <div className="scene-head mb-8">
            <span className="scene-num">Escena 01</span>
            <h2 className="display text-3xl">Tus <em>pedidos</em></h2>
            <span className="scene-rule" />
          </div>

          {orders.length === 0 ? (
            <div className="card-night p-8 text-center">
              <p className="text-muted text-sm leading-relaxed">
                Aún no tienes pedidos. Cuando hagas tu primer pedido desde una mesa, aparecerá aquí.
              </p>
              <Link href="/restaurante" className="btn-gold mt-6">
                Ver menú
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order, i) => (
                <div key={order.id} className="card-night p-5 hover:border-gold-dim/40 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="scene-num">{String(i + 1).padStart(2, "0")}</span>
                      <span className={STATUS_BADGES[order.status] || "badge badge-info"}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </div>
                    <span className="font-[family-name:var(--font-display)] text-lg text-gold">{fmt(order.total)}</span>
                  </div>
                  <p className="text-sm text-cream/85">
                    {order.orderItems.map((oi) => (
                      <span key={`${oi.menuItem.name}-${oi.variant?.name}`}>
                        {oi.quantity}× {oi.menuItem.name}
                        {oi.variant ? ` (${oi.variant.name})` : ""}
                        {", "}
                      </span>
                    ))}
                  </p>
                  <p className="text-[11px] tracking-[0.14em] uppercase text-faint mt-2">
                    {new Date(order.createdAt).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
