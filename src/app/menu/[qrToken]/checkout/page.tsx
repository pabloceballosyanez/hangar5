"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CartMod {
  id: string;
  name: string;
  priceDelta: number;
}

interface CartItem {
  cartId: string;
  menuItemId: string;
  name: string;
  imageUrl?: string | null;
  variantId?: string | null;
  variantName?: string | null;
  modifiers: CartMod[];
  quantity: number;
  unitPrice: number; // pesos
  specialInstructions?: string;
}

interface TableInfo {
  tableId: string;
  tableNumber: string;
  tableName: string | null;
  serviceSessionId: string;
}

interface CustomerForm {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

// ─── Utils ────────────────────────────────────────────────────────────────────

const TAX = 0.16;

function fmt(n: number) {
  return `$${(n * 1.16).toFixed(2)}`;
}

function lineTotal(item: CartItem) {
  const extra = item.modifiers.reduce((s, m) => s + m.priceDelta, 0);
  return (item.unitPrice + extra) * item.quantity;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const qrToken = params.qrToken as string;

  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableInfo, setTableInfo] = useState<TableInfo | null>(null);
  const [form, setForm] = useState<CustomerForm>({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const rawCart = localStorage.getItem("hangar5_cart");
      if (rawCart) setCart(JSON.parse(rawCart) as CartItem[]);

      const rawSession = localStorage.getItem("hangar5_session");
      if (rawSession) setTableInfo(JSON.parse(rawSession) as TableInfo);
    } catch { /* ignore */ }
  }, []);

  const subtotal = cart.reduce((s, i) => s + lineTotal(i), 0);
  const tax = subtotal * TAX;
  const total = subtotal + tax;

  const removeItem = (cartId: string) => {
    const updated = cart.filter((i) => i.cartId !== cartId);
    setCart(updated);
    try {
      localStorage.setItem("hangar5_cart", JSON.stringify(updated));
    } catch { /* ignore */ }
  };

  const updateField = (field: keyof CustomerForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (cart.length === 0) return;
    if (!form.name.trim()) {
      setError("Por favor ingresa tu nombre");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      // Ensure we have a session; re-fetch if not cached
      let sessionId = tableInfo?.serviceSessionId ?? null;
      if (!sessionId) {
        const sessRes = await fetch(
          `/api/restaurant/session?qrToken=${encodeURIComponent(qrToken)}`,
          { cache: "no-store" }
        );
        if (!sessRes.ok) throw new Error("No pudimos identificar tu mesa");
        const sessData = (await sessRes.json()) as TableInfo;
        sessionId = sessData.serviceSessionId;
        setTableInfo(sessData);
        try {
          localStorage.setItem("hangar5_session", JSON.stringify(sessData));
        } catch { /* ignore */ }
      }

      // Build order payload
      const items = cart.map((item) => ({
        menuItemId: item.menuItemId,
        variantId: item.variantId ?? null,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions ?? null,
        modifierIds: item.modifiers.map((m) => m.id),
      }));

      const orderRes = await fetch("/api/admin/restaurant/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceSessionId: sessionId,
          source: "QR",
          customerName: form.name.trim(),
          customerEmail: form.email.trim() || null,
          customerPhone: form.phone.trim() || null,
          notes: form.notes.trim() || null,
          items,
        }),
      });

      if (!orderRes.ok) {
        const body = (await orderRes.json()) as { error?: string };
        throw new Error(body.error ?? "Error al crear la orden");
      }

      const order = (await orderRes.json()) as { id: string };

      // Clear cart on success
      try {
        localStorage.removeItem("hangar5_cart");
      } catch { /* ignore */ }

      // Navigate to payment
      router.push(`/menu/${qrToken}/payment?orderId=${order.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
      setSubmitting(false);
    }
  };

  // ─── Empty cart ──
  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <span className="text-5xl">🛒</span>
        <p className="font-semibold text-gray-800">Tu carrito está vacío</p>
        <button
          onClick={() => router.push(`/menu/${qrToken}`)}
          className="px-6 py-3 bg-amber-500 text-white font-bold rounded-2xl min-h-[44px] active:scale-95 transition-transform"
        >
          Ir al menú
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
          <h1 className="text-xl font-black text-gray-900">Tu orden</h1>
          {tableInfo && (
            <p className="text-xs text-gray-500">
              Mesa {tableInfo.tableNumber}
              {tableInfo.tableName ? ` · ${tableInfo.tableName}` : ""}
            </p>
          )}
        </div>
      </div>

      {/* ── Cart items ── */}
      <section>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
          Artículos
        </h2>
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100 overflow-hidden">
          {cart.map((item) => (
            <CartRow key={item.cartId} item={item} onRemove={removeItem} />
          ))}
        </div>
      </section>

      {/* ── Price breakdown ── */}
      <section className="bg-white rounded-2xl shadow-sm px-4 py-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span>{fmt(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>IVA (16%)</span>
          <span>{fmt(tax)}</span>
        </div>
        <div className="flex justify-between font-black text-gray-900 text-base border-t border-gray-100 pt-2 mt-2">
          <span>Total</span>
          <span className="text-amber-600">{fmt(total)}</span>
        </div>
      </section>

      {/* ── Customer info ── */}
      <section>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
          Tus datos
        </h2>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100">
          <div className="px-4 py-3">
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="¿Cómo te llamamos?"
              autoComplete="name"
              className="w-full text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
            />
          </div>

          <div className="px-4 py-3">
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Email <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="Para tu comprobante"
              autoComplete="email"
              className="w-full text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
            />
          </div>

          <div className="px-4 py-3">
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Teléfono <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="+52 555 000 0000"
              autoComplete="tel"
              className="w-full text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
            />
          </div>

          <div className="px-4 py-3">
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Notas para la cocina{" "}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Alergias, preferencias generales…"
              rows={2}
              className="w-full text-sm text-gray-800 placeholder-gray-400 focus:outline-none resize-none"
            />
          </div>
        </div>
      </section>

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm font-medium">
          {error}
        </div>
      )}

      {/* ── Submit ── */}
      <button
        onClick={handleSubmit}
        disabled={submitting || cart.length === 0}
        className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 active:scale-[0.98] text-white font-black py-4 rounded-2xl shadow-lg transition-all flex items-center justify-between px-5 text-base min-h-[56px]"
      >
        {submitting ? (
          <>
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Enviando orden…</span>
            <span />
          </>
        ) : (
          <>
            <span>Confirmar y pagar</span>
            <span>{fmt(total)}</span>
          </>
        )}
      </button>

      <p className="text-center text-xs text-gray-400 leading-relaxed">
        Al confirmar aceptas los términos de servicio.
        <br />
        Pago seguro procesado por Mercado Pago.
      </p>
    </div>
  );
}

// ─── Cart Row ─────────────────────────────────────────────────────────────────

function CartRow({
  item,
  onRemove,
}: {
  item: CartItem;
  onRemove: (cartId: string) => void;
}) {
  const total = lineTotal(item);

  return (
    <div className="flex gap-3 px-4 py-3">
      {/* Thumbnail */}
      {item.imageUrl ? (
        <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-none">
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover"
            sizes="56px"
          />
        </div>
      ) : (
        <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center text-2xl flex-none">
          🥘
        </div>
      )}

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1">
            {item.quantity}× {item.name}
          </p>
          <p className="font-bold text-amber-600 text-sm flex-none">{fmt(total)}</p>
        </div>

        {/* Variant */}
        {item.variantName && (
          <p className="text-xs text-gray-500 mt-0.5">{item.variantName}</p>
        )}

        {/* Modifiers */}
        {item.modifiers.length > 0 && (
          <p className="text-xs text-gray-500 mt-0.5">
            {item.modifiers.map((m) => m.name).join(", ")}
          </p>
        )}

        {/* Special instructions */}
        {item.specialInstructions && (
          <p className="text-xs text-gray-400 italic mt-0.5">
            &quot;{item.specialInstructions}&quot;
          </p>
        )}

        {/* Remove */}
        <button
          onClick={() => onRemove(item.cartId)}
          className="text-xs text-red-400 hover:text-red-600 mt-1 font-medium"
        >
          Quitar
        </button>
      </div>
    </div>
  );
}
