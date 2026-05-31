"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import "./menu.css";

// ─── Domain types (mirrors /api/restaurant/menu response) ─────────────────────

interface MenuModifier {
  id: string;
  name: string;
  priceDelta: number; // pesos
}

interface MenuModifierGroup {
  id: string;
  pivotId: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  isRequired: boolean;
  modifiers: MenuModifier[];
}

interface MenuVariant {
  id: string;
  name: string;
  priceDelta: number; // pesos
  isDefault: boolean;
}

interface MenuItemData {
  id: string;
  name: string;
  description?: string | null;
  basePrice: number; // pesos
  imageUrl?: string | null;
  estimatedPrepMinutes: number;
  variants: MenuVariant[];
  modifierGroups: MenuModifierGroup[];
}

interface MenuCategory {
  id: string;
  name: string;
  kind: string;
  sortOrder: number;
  imageUrl?: string | null;
  menuItems: MenuItemData[];
}

interface TableInfo {
  tableId: string;
  tableNumber: string;
  tableName: string | null;
  tableLocation: string | null;
}

// ─── Cart types ───────────────────────────────────────────────────────────────

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
  unitPrice: number; // basePrice + variantDelta, pesos
  specialInstructions?: string;
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function fmt(pesos: number) {
  return `$${pesos.toFixed(2)}`;
}

function itemLineTotal(item: CartItem) {
  const modsExtra = item.modifiers.reduce((s, m) => s + m.priceDelta, 0);
  return (item.unitPrice + modsExtra) * item.quantity;
}

function cartSubtotal(items: CartItem[]) {
  return items.reduce((s, i) => s + itemLineTotal(i), 0);
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MenuPage() {
  const params = useParams();
  const router = useRouter();
  const qrToken = params.qrToken as string;

  // ── Remote data ──
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [tableInfo, setTableInfo] = useState<TableInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── UI ──
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  // ── Cart ──
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState<string | null>(null);

  // ── Modal ──
  const [selectedItem, setSelectedItem] = useState<MenuItemData | null>(null);
  const [selVariantId, setSelVariantId] = useState<string | null>(null);
  const [selModIds, setSelModIds] = useState<Set<string>>(new Set());
  const [itemQty, setItemQty] = useState(1);
  const [itemNotes, setItemNotes] = useState("");

  // ── Hydrate cart from localStorage ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem("hangar5_cart");
      if (raw) setCart(JSON.parse(raw) as CartItem[]);
    } catch { /* ignore */ }
  }, []);

  // ── Persist cart to localStorage ──
  useEffect(() => {
    try {
      localStorage.setItem("hangar5_cart", JSON.stringify(cart));
    } catch { /* ignore */ }
  }, [cart]);

  // ── Check if logged in ──
  useEffect(() => {
    fetch("/api/auth/customer/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.customer) setCustomerName(data.customer.name);
      })
      .catch(() => {});
  }, []);

  // ── Fetch menu + session ──
  useEffect(() => {
    if (!qrToken) return;

    const load = async () => {
      try {
        // Reuse stored session to avoid creating duplicates on page reload
        let storedSession: TableInfo | null = null;
        try {
          const raw = localStorage.getItem("hangar5_session");
          if (raw) storedSession = JSON.parse(raw) as TableInfo;
        } catch { /* ignore */ }

        if (storedSession) {
          setTableInfo(storedSession);
        }

        const [menuRes, sessRes] = await Promise.all([
          fetch("/api/restaurant/menu", { cache: "no-store" }),
          fetch(`/api/restaurant/session?qrToken=${encodeURIComponent(qrToken)}`, { cache: "no-store" }),
        ]);

        if (!menuRes.ok) throw new Error("Error al cargar el menú");
        const menuData = (await menuRes.json()) as MenuCategory[];
        setCategories(menuData);
        if (menuData.length > 0) setActiveCategory(menuData[0].id);

        if (sessRes.ok) {
          const sessData = (await sessRes.json()) as TableInfo;
          // Only create a new session if we don't have one stored (first visit)
          // If we have a stored session, keep using it — avoid duplicates
          if (!storedSession) {
            setTableInfo(sessData);
            try { localStorage.setItem("hangar5_session", JSON.stringify(sessData)); } catch { /* ignore */ }
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [qrToken]);

  // ── Open item detail modal ──
  const openItem = useCallback((item: MenuItemData) => {
    const defaultVariant =
      item.variants.find((v) => v.isDefault) ?? item.variants[0] ?? null;
    setSelectedItem(item);
    setSelVariantId(defaultVariant?.id ?? null);
    setSelModIds(new Set());
    setItemQty(1);
    setItemNotes("");
  }, []);

  // ── Close modal ──
  const closeModal = useCallback(() => setSelectedItem(null), []);

  // ── Toggle modifier with group max enforcement ──
  const toggleMod = useCallback(
    (group: MenuModifierGroup, modId: string) => {
      setSelModIds((prev) => {
        const next = new Set(prev);
        if (next.has(modId)) {
          next.delete(modId);
        } else {
          const groupSelected = group.modifiers
            .map((m) => m.id)
            .filter((id) => next.has(id));
          if (groupSelected.length >= group.maxSelections) {
            next.delete(groupSelected[0]);
          }
          next.add(modId);
        }
        return next;
      });
    },
    []
  );

  // ── Add to cart ──
  const addToCart = useCallback(() => {
    if (!selectedItem) return;
    const variant = selVariantId
      ? selectedItem.variants.find((v) => v.id === selVariantId)
      : null;
    const unitPrice = selectedItem.basePrice + (variant?.priceDelta ?? 0);

    const mods: CartMod[] = [];
    for (const group of selectedItem.modifierGroups) {
      for (const mod of group.modifiers) {
        if (selModIds.has(mod.id)) {
          mods.push({ id: mod.id, name: mod.name, priceDelta: mod.priceDelta });
        }
      }
    }

    const newItem: CartItem = {
      cartId: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      menuItemId: selectedItem.id,
      name: selectedItem.name,
      imageUrl: selectedItem.imageUrl,
      variantId: selVariantId,
      variantName: variant?.name ?? null,
      modifiers: mods,
      quantity: itemQty,
      unitPrice,
      specialInstructions: itemNotes.trim() || undefined,
    };

    setCart((prev) => [...prev, newItem]);
    closeModal();
  }, [selectedItem, selVariantId, selModIds, itemQty, itemNotes, closeModal]);

  // ── Remove item from cart ──
  const removeFromCart = useCallback((cartId: string) => {
    setCart((prev) => prev.filter((i) => i.cartId !== cartId));
  }, []);

  // ── Go to checkout ──
  const goCheckout = useCallback(() => {
    router.push(`/menu/${qrToken}/checkout`);
  }, [router, qrToken]);

  // ── Derived values ──
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cartSubtotal(cart);
  const activeItems =
    categories.find((c) => c.id === activeCategory)?.menuItems ?? [];

  // ── Modal price preview ──
  const modalVariant = selVariantId
    ? selectedItem?.variants.find((v) => v.id === selVariantId)
    : null;
  const modalModsTotal = [...selModIds].reduce((sum, id) => {
    if (!selectedItem) return sum;
    for (const g of selectedItem.modifierGroups) {
      const m = g.modifiers.find((mod) => mod.id === id);
      if (m) return sum + m.priceDelta;
    }
    return sum;
  }, 0);
  const modalItemTotal =
    selectedItem
      ? ((selectedItem.basePrice + (modalVariant?.priceDelta ?? 0) + modalModsTotal) * itemQty)
      : 0;

  // ─────────────────────────────────────────────────────────────────────────────
  // Loading state
  // ─────────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-amber-100">Cargando menú…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 text-center px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <span className="text-5xl">😕</span>
        <p className="font-semibold text-amber-100">No pudimos cargar el menú</p>
        <p className="text-sm text-amber-200/70">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl min-h-[44px] active:scale-95 transition-all shadow-lg"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-screen">
      {/* ── Hero Header ── */}
      <div className="hero-section relative overflow-hidden">
        {/* Background gradient simulando atardecer en montañas */}
        <div className="absolute inset-0 h-72 bg-gradient-to-b from-orange-600/20 via-slate-800/40 to-transparent pointer-events-none" />
        
        <div className="relative z-10 px-4 pt-6 pb-12">
          {/* User profile link */}
          <div className="flex justify-end mb-2">
            {customerName ? (
              <a
                href="/cuenta"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm border border-amber-400/20 transition-all"
              >
                <span className="w-6 h-6 rounded-full bg-amber-400/30 flex items-center justify-center text-xs">
                  {customerName.charAt(0).toUpperCase()}
                </span>
                {customerName}
              </a>
            ) : (
              <a
                href={`/ingresar?redirect=/menu/${qrToken}`}
                className="inline-flex items-center gap-1 text-amber-200/60 hover:text-amber-300 text-sm transition-colors"
              >
                👤 Ingresar
              </a>
            )}
          </div>

          {/* Título principal */}
          <div className="mb-8 animate-fadeIn">
            <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight leading-tight mb-2">
              HANGAR
              <br />
              <span className="text-amber-400">CINCO</span>
            </h1>
            <p className="text-lg text-amber-100/80 font-light italic max-w-md">
              Donde la montaña se encuentra con la cocina
            </p>
            {tableInfo && (
              <p className="text-sm text-amber-200/60 mt-4">
                Mesa {tableInfo.tableNumber}
                {tableInfo.tableName && ` • ${tableInfo.tableName}`}
                {tableInfo.tableLocation && ` • ${tableInfo.tableLocation}`}
              </p>
            )}
          </div>

          {/* Carrito flotante en header */}
          {totalItems > 0 && (
            <div className="flex justify-end animate-slideDown">
              <button
                onClick={goCheckout}
                aria-label={`Ver carrito con ${totalItems} artículos`}
                className="relative inline-flex items-center gap-2 bg-white/95 hover:bg-white text-slate-900 px-5 py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-all backdrop-blur-sm"
              >
                <span className="text-xl">🛒</span>
                <span className="text-sm font-semibold">
                  {totalItems} {totalItems === 1 ? "artículo" : "artículos"}
                </span>
                <span className="text-amber-600 font-bold">{fmt(subtotal)}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Category pills — sticky ── */}
      <div className="sticky top-0 z-40 bg-slate-800/80 backdrop-blur-lg border-b border-amber-400/10 shadow-lg">
        <div
          className="flex gap-2 overflow-x-auto px-4 py-3"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          ref={tabsRef}
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-none px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap min-h-[40px] ${
                activeCategory === cat.id
                  ? "bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/40 scale-105"
                  : "bg-slate-700/50 text-amber-100 hover:bg-slate-700 border border-amber-400/20"
              }`}
            >
              {cat.kind === "DRINK" ? "🥤" : "🍴"}
              {" "}
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Items grid ── */}
      <div
        className="px-4 pt-6"
        style={{ paddingBottom: totalItems > 0 ? "8rem" : "3rem" }}
      >
        {activeItems.length === 0 ? (
          <div className="text-center py-20 text-amber-200/50">
            <div className="text-6xl mb-4">🍽️</div>
            <p className="font-semibold text-lg">Sin platillos en esta categoría</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeItems.map((item, idx) => (
              <div key={item.id} className={`animate-fadeInUp`} style={{ animationDelay: `${idx * 50}ms` }}>
                <MenuItemCard item={item} onAdd={() => openItem(item)} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Floating checkout bar ── */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-6 pt-4 bg-gradient-to-t from-slate-950 via-slate-900 to-transparent pointer-events-none">
          <button
            onClick={goCheckout}
            className="pointer-events-auto w-full max-w-lg mx-auto flex items-center justify-between bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-[0.98] text-slate-900 font-black py-4 px-5 rounded-xl shadow-2xl shadow-amber-500/30 transition-all"
          >
            <span className="bg-slate-900/30 text-amber-100 text-sm px-3 py-1.5 rounded-lg font-bold">
              {totalItems} {totalItems === 1 ? "artículo" : "artículos"}
            </span>
            <span className="flex-1 text-center">Ver carrito</span>
            <span className="font-mono text-lg">{fmt(subtotal)}</span>
          </button>
        </div>
      )}

      {/* ── Item detail modal ── */}
      {selectedItem && (
        <ItemModal
          item={selectedItem}
          quantity={itemQty}
          selectedVariantId={selVariantId}
          selectedModIds={selModIds}
          notes={itemNotes}
          totalPrice={modalItemTotal}
          onClose={closeModal}
          onQuantityChange={setItemQty}
          onVariantChange={setSelVariantId}
          onToggleMod={toggleMod}
          onNotesChange={setItemNotes}
          onAddToCart={addToCart}
        />
      )}

      {/* ── Mini cart pills ── */}
      {cart.length > 0 && !selectedItem && (
        <div className="fixed bottom-32 right-4 z-20 flex flex-col items-end gap-2 max-w-[calc(100vw-2rem)]">
          {cart.slice(-3).map((item) => (
            <div
              key={item.cartId}
              className="flex items-center gap-2 bg-slate-800/95 backdrop-blur-md border border-amber-400/30 shadow-lg rounded-lg px-3 py-2 text-xs animate-slideInRight"
            >
              <span className="font-semibold text-amber-100 max-w-[120px] truncate">
                {item.quantity}× {item.name}
              </span>
              <button
                onClick={() => removeFromCart(item.cartId)}
                className="text-amber-400/60 hover:text-red-400 ml-1 leading-none font-bold text-lg"
                aria-label={`Quitar ${item.name}`}
              >
                ×
              </button>
            </div>
          ))}
          {cart.length > 3 && (
            <span className="text-xs text-amber-200/50 pr-1">
              +{cart.length - 3} más
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Menu Item Card ───────────────────────────────────────────────────────────

function MenuItemCard({
  item,
  onAdd,
}: {
  item: MenuItemData;
  onAdd: () => void;
}) {
  return (
    <div
      onClick={onAdd}
      className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-amber-400/20 hover:border-amber-400/60 backdrop-blur-sm cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/20 hover:-translate-y-1 active:scale-[0.98]"
    >
      {/* Image/Placeholder */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-6xl opacity-50">
            🥘
          </div>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Name */}
        <h3 className="font-black text-white text-lg leading-tight mb-2 line-clamp-2">
          {item.name}
        </h3>

        {/* Description */}
        {item.description && (
          <p className="text-sm text-amber-100/70 mb-4 line-clamp-2 leading-relaxed font-light">
            {item.description}
          </p>
        )}

        {/* Meta info */}
        <div className="flex items-center justify-between mb-4 text-xs text-amber-200/60">
          {item.variants.length > 0 && (
            <span>{item.variants.length} opciones</span>
          )}
          {item.estimatedPrepMinutes > 0 && (
            <span>~{item.estimatedPrepMinutes} min ⏱️</span>
          )}
        </div>

        {/* Price + Button */}
        <div className="flex items-center justify-between gap-3">
          <div className="font-mono text-2xl font-black text-amber-400">
            {fmt(item.basePrice).split(".")[0]}
            <span className="text-xs text-amber-400/60 ml-0.5">
              {fmt(item.basePrice).split(".")[1]}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-black w-12 h-12 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/40 active:scale-90 transition-all text-xl leading-none"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Item Modal (bottom sheet) ────────────────────────────────────────────────

interface ItemModalProps {
  item: MenuItemData;
  quantity: number;
  selectedVariantId: string | null;
  selectedModIds: Set<string>;
  notes: string;
  totalPrice: number;
  onClose: () => void;
  onQuantityChange: (q: number) => void;
  onVariantChange: (id: string | null) => void;
  onToggleMod: (group: MenuModifierGroup, modId: string) => void;
  onNotesChange: (s: string) => void;
  onAddToCart: () => void;
}

function ItemModal({
  item,
  quantity,
  selectedVariantId,
  selectedModIds,
  notes,
  totalPrice,
  onClose,
  onQuantityChange,
  onVariantChange,
  onToggleMod,
  onNotesChange,
  onAddToCart,
}: ItemModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end animate-overlayFadeIn">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative bg-gradient-to-b from-slate-800 to-slate-900 rounded-t-3xl overflow-hidden max-h-[92dvh] flex flex-col shadow-2xl animate-slideUp border-t-2 border-amber-400/30">
        {/* Hero image or header */}
        {item.imageUrl ? (
          <div className="relative h-56 flex-none overflow-hidden group">
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="absolute top-5 right-5 bg-slate-900/80 hover:bg-slate-800 w-10 h-10 rounded-full flex items-center justify-center text-amber-400 font-black text-xl shadow-lg backdrop-blur-sm transition-all"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="flex justify-between items-center px-6 py-5 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-amber-400/10">
            <div className="text-4xl">🍽️</div>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="bg-slate-700/50 hover:bg-slate-600 w-10 h-10 rounded-full flex items-center justify-center text-amber-400 font-black text-lg transition-all"
            >
              ✕
            </button>
          </div>
        )}

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          {/* Title + description + price */}
          <div className="border-b border-amber-400/10 pb-5">
            <h2 className="text-3xl font-black text-white leading-tight mb-3">
              {item.name}
            </h2>
            {item.description && (
              <p className="text-base text-amber-100/70 mb-4 leading-relaxed font-light">
                {item.description}
              </p>
            )}
            <div className="text-4xl font-black text-amber-400 font-mono">
              {fmt(item.basePrice)}
            </div>
          </div>

          {/* Variants */}
          {item.variants.length > 0 && (
            <section>
              <h3 className="font-black text-amber-400 mb-3 text-sm uppercase tracking-widest">
                Elige una variante
              </h3>
              <div className="space-y-2.5">
                {item.variants.map((v) => (
                  <label
                    key={v.id}
                    className={`flex items-center justify-between min-h-[52px] px-4 py-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedVariantId === v.id
                        ? "border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-400/20"
                        : "border-slate-700 hover:border-amber-400/50 hover:bg-slate-700/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedVariantId === v.id
                          ? "border-amber-400 bg-amber-400"
                          : "border-slate-500"
                      }`}>
                        {selectedVariantId === v.id && (
                          <div className="w-2 h-2 rounded-full bg-slate-900" />
                        )}
                      </div>
                      <span className="text-base font-semibold text-white">
                        {v.name}
                      </span>
                    </div>
                    {v.priceDelta !== 0 && (
                      <span className="text-base font-bold text-amber-400 font-mono">
                        {v.priceDelta > 0 ? "+" : ""}
                        {fmt(v.priceDelta)}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </section>
          )}

          {/* Modifier Groups */}
          {item.modifierGroups.map((group) => (
            <section key={group.id}>
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <h3 className="font-black text-amber-400 text-sm uppercase tracking-widest">
                  {group.name}
                </h3>
                {group.isRequired && (
                  <span className="text-xs bg-red-500/20 text-red-300 px-2.5 py-1 rounded-full font-bold border border-red-500/30">
                    Obligatorio
                  </span>
                )}
                {group.maxSelections > 1 && (
                  <span className="text-xs text-amber-200/60 font-semibold">
                    Máx {group.maxSelections}
                  </span>
                )}
              </div>

              <div className="space-y-2.5">
                {group.modifiers.map((mod) => (
                  <label
                    key={mod.id}
                    className={`flex items-center justify-between min-h-[52px] px-4 py-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedModIds.has(mod.id)
                        ? "border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-400/20"
                        : "border-slate-700 hover:border-amber-400/50 hover:bg-slate-700/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        selectedModIds.has(mod.id)
                          ? "border-amber-400 bg-amber-400"
                          : "border-slate-500"
                      }`}>
                        {selectedModIds.has(mod.id) && (
                          <svg className="w-3 h-3 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="text-base font-semibold text-white">
                        {mod.name}
                      </span>
                    </div>
                    {mod.priceDelta !== 0 && (
                      <span className="text-base font-bold text-amber-400 font-mono">
                        +{fmt(mod.priceDelta)}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </section>
          ))}

          {/* Special instructions */}
          <section>
            <h3 className="font-black text-amber-400 text-sm uppercase tracking-widest mb-3">
              Instrucciones especiales
            </h3>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Sin cilantro, extra picante, sin sal…"
              rows={3}
              className="w-full bg-slate-700/40 border border-slate-600 text-white placeholder-slate-400 px-4 py-3 rounded-lg text-base focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 resize-none transition-all"
            />
          </section>
        </div>

        {/* Fixed footer */}
        <div className="flex-none px-6 py-5 bg-gradient-to-t from-slate-950 to-slate-900 border-t border-amber-400/10 space-y-4">
          {/* Quantity selector */}
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              aria-label="Reducir cantidad"
              className="w-12 h-12 rounded-lg bg-slate-700/50 hover:bg-slate-600 text-amber-400 font-black text-2xl flex items-center justify-center active:scale-90 transition-all border border-slate-600 hover:border-amber-400/50"
            >
              −
            </button>
            <span className="text-3xl font-black text-white w-12 text-center tabular-nums">
              {quantity}
            </span>
            <button
              onClick={() => onQuantityChange(quantity + 1)}
              aria-label="Aumentar cantidad"
              className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-slate-900 font-black text-2xl flex items-center justify-center active:scale-90 transition-all shadow-lg shadow-amber-500/40"
            >
              +
            </button>
          </div>

          {/* Add to cart button */}
          <button
            onClick={onAddToCart}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-[0.98] text-slate-900 font-black py-4 rounded-lg shadow-xl shadow-amber-500/30 transition-all flex items-center justify-between px-5 text-base min-h-[56px]"
          >
            <span>Agregar al carrito</span>
            <span className="font-mono text-lg">{fmt(totalPrice)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
