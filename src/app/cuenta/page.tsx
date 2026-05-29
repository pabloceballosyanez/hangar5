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

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  PLACED: "bg-blue-100 text-blue-700",
  IN_KITCHEN: "bg-yellow-100 text-yellow-700",
  READY: "bg-green-100 text-green-700",
  SERVED: "bg-purple-100 text-purple-700",
  PAID: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return null; // redirecting
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-8">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="text-amber-400 hover:text-amber-300 text-sm font-bold">
            ← Volver
          </Link>
          <button
            onClick={handleLogout}
            className="text-red-400 hover:text-red-300 text-sm font-bold"
          >
            Cerrar sesión
          </button>
        </div>

        {/* Profile card */}
        <div className="bg-white/5 border border-amber-400/10 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-amber-400/20 flex items-center justify-center text-2xl">
              👤
            </div>
            <div>
              <h1 className="text-xl font-black text-white">{profile.name}</h1>
              <p className="text-sm text-gray-400">{profile.email}</p>
              {profile.phone && (
                <p className="text-sm text-gray-500">{profile.phone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Order history */}
        <section>
          <h2 className="text-lg font-black text-white mb-4">📋 Historial de pedidos</h2>

          {orders.length === 0 ? (
            <div className="bg-white/5 border border-amber-400/10 rounded-2xl p-6 text-center">
              <span className="text-4xl">🍽️</span>
              <p className="text-gray-400 mt-3 text-sm">
                Aún no tienes pedidos. Cuando hagas tu primer pedido desde una mesa, aparecerá aquí.
              </p>
              <Link
                href="/restaurante"
                className="inline-block mt-4 px-6 py-3 bg-amber-500 text-slate-900 font-bold rounded-xl text-sm"
              >
                Ver menú
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white/5 border border-amber-400/10 rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-700"}`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                    <span className="text-sm font-bold text-amber-400">{fmt(order.total)}</span>
                  </div>
                  <p className="text-sm text-gray-300">
                    {order.orderItems.map((oi) => (
                      <span key={`${oi.menuItem.name}-${oi.variant?.name}`}>
                        {oi.quantity}× {oi.menuItem.name}
                        {oi.variant ? ` (${oi.variant.name})` : ""}
                        {", "}
                      </span>
                    ))}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
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
