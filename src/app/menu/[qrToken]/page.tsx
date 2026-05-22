"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

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
  tableSessionId: string;
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

  // ── Fetch menu + session ──
  useEffect(() => {
    if (!qrToken) return;

    const load = async () => {
      try {
        const [menuRes, sessRes] = await Promise.all([
          fetch("/api/restaurant/menu", { cache: "no-store" }),
          fetch(`/api/restaurant/session?qrToken=${encodeURIComponent(qrToken)}`, {
            cache: "no-store",
          }),
        ]);

        if (!menuRes.ok) throw new Error("Error al cargar el menú");
        const menuData = (await menuRes.json()) as MenuCategory[];
        setCategories(menuData);
        if (menuData.length > 0) setActiveCategory(menuData[0].id);

        if (sessRes.ok) {
          const sessData = (await sessRes.json()) as TableInfo;
          setTableInfo(sessData);
          try {
            localStorage.setItem("hangar5_session", JSON.stringify(sessData));
          } catch { /* ignore */ }
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
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Cargando menú…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 text-center px-4">
        <span className="text-5xl">😕</span>
        <p className="font-semibold text-gray-800">No pudimos cargar el menú</p>
        <p className="text-sm text-gray-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-6 py-3 bg-amber-500 text-white font-bold rounded-2xl min-h-[44px] active:scale-95 transition-transform"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Main render — escape the layout's padding with negative margins
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="-mt-6 -mx-4">
      {/* ── Header ── */}
      <div className="bg-gradient-to-br from-amber-600 via-orange-500 to-amber-500 text-white px-4 pt-8 pb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight leading-tight">
              🍽️ Hangar&nbsp;5
            </h1>
            <p className="text-amber-100 text-sm mt-1">
              {tableInfo
                ? `Mesa ${tableInfo.tableNumber}${tableInfo.tableName ? ` · ${tableInfo.tableName}` : ""}${tableInfo.tableLocation ? ` · ${tableInfo.tableLocation}` : ""}`
                : "Menú digital"}
            </p>
          </div>

          {totalItems > 0 && (
            <button
              onClick={goCheckout}
              aria-label={`Ver carrito con ${totalItems} artículos`}
              className="relative flex-none bg-white text-amber-600 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"
            >
              <span className="text-xl">🛒</span>
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center leading-none">
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ── Category tabs — sticky ── */}
      <div
        ref={tabsRef}
        className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm"
      >
        <div
          className="flex gap-2 overflow-x-auto px-4 py-3"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-none min-h-[36px] px-4 py-1.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                activeCategory === cat.id
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat.kind === "DRINK" ? "🥤 " : "🍴 "}
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Items list ── */}
      <div
        className="px-4 pt-4 space-y-3"
        style={{ paddingBottom: totalItems > 0 ? "7rem" : "2rem" }}
      >
        {activeItems.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">🍽️</div>
            <p className="font-medium">Sin platillos en esta categoría</p>
          </div>
        ) : (
          activeItems.map((item) => (
            <MenuItemCard key={item.id} item={item} onAdd={() => openItem(item)} />
          ))
        )}
      </div>

      {/* ── Floating checkout bar ── */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-20 px-4 pb-6 pt-4 bg-gradient-to-t from-gray-50 via-gray-50/90 to-transparent pointer-events-none">
          <button
            onClick={goCheckout}
            className="pointer-events-auto w-full max-w-lg mx-auto flex items-center justify-between bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-bold py-4 px-5 rounded-2xl shadow-xl transition-all"
          >
            <span className="bg-amber-600/70 text-white text-sm px-2.5 py-1 rounded-lg font-semibold">
              {totalItems} {totalItems === 1 ? "artículo" : "artículos"}
            </span>
            <span className="text-base">Ver carrito</span>
            <span className="text-base">{fmt(subtotal)}</span>
          </button>
        </div>
      )}

      {/* ── Item detail modal (bottom sheet) ── */}
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

      {/* ── Mini cart drawer (bottom right) when modal is closed ── */}
      {cart.length > 0 && !selectedItem && (
        <div className="fixed bottom-24 right-4 z-10 flex flex-col gap-1 max-w-[calc(100vw-2rem)]">
          {/* Cart items badges — shown as stacked pills */}
          <div className="flex flex-col items-end gap-1 max-h-36 overflow-hidden">
            {cart.slice(-3).map((item) => (
              <div
                key={item.cartId}
                className="flex items-center gap-1.5 bg-white shadow-md rounded-xl px-3 py-1.5 text-xs"
              >
                <span className="font-semibold text-gray-700 max-w-[120px] truncate">
                  {item.quantity}× {item.name}
                </span>
                <button
                  onClick={() => removeFromCart(item.cartId)}
                  className="text-gray-400 hover:text-red-500 ml-1 leading-none"
                  aria-label={`Quitar ${item.name}`}
                >
                  ×
                </button>
              </div>
            ))}
            {cart.length > 3 && (
              <span className="text-xs text-gray-400 pr-1">
                +{cart.length - 3} más
              </span>
            )}
          </div>
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
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex active:scale-[0.98] transition-transform">
      {/* Image */}
      {item.imageUrl ? (
        <div className="relative w-28 flex-none self-stretch">
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover"
            sizes="112px"
          />
        </div>
      ) : (
        <div className="w-28 flex-none bg-amber-50 flex items-center justify-center text-4xl">
          🥘
        </div>
      )}

      {/* Info */}
      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
        <div>
          <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">
            {item.name}
          </h3>
          {item.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}
          {item.variants.length > 0 && (
            <p className="text-xs text-amber-600 mt-0.5">
              {item.variants.length} opciones
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="text-amber-600 font-black text-base">
              {fmt(item.basePrice)}
            </span>
            {item.estimatedPrepMinutes > 0 && (
              <span className="text-xs text-gray-400 ml-1.5">
                ~{item.estimatedPrepMinutes} min
              </span>
            )}
          </div>
          <button
            onClick={onAdd}
            aria-label={`Agregar ${item.name}`}
            className="bg-amber-500 hover:bg-amber-600 active:scale-90 text-white font-black w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-transform text-lg leading-none"
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
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative bg-white rounded-t-3xl overflow-hidden max-h-[92dvh] flex flex-col shadow-2xl">
        {/* Item image or bare header */}
        {item.imageUrl ? (
          <div className="relative h-52 flex-none">
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="absolute top-4 right-4 bg-white/90 w-9 h-9 rounded-full flex items-center justify-center text-gray-700 font-black text-lg shadow-md"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="flex justify-end px-5 pt-4 pb-2">
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="bg-gray-100 w-9 h-9 rounded-full flex items-center justify-center text-gray-600 font-black text-lg"
            >
              ×
            </button>
          </div>
        )}

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          {/* Title + price */}
          <div>
            <h2 className="text-xl font-black text-gray-900 leading-tight">
              {item.name}
            </h2>
            {item.description && (
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                {item.description}
              </p>
            )}
            <p className="text-amber-600 font-black text-xl mt-2">
              {fmt(item.basePrice)}
            </p>
          </div>

          {/* Variants */}
          {item.variants.length > 0 && (
            <section>
              <h3 className="font-bold text-gray-800 mb-2 text-sm uppercase tracking-wide">
                Variante
              </h3>
              <div className="space-y-2">
                {item.variants.map((v) => (
                  <label
                    key={v.id}
                    className={`flex items-center justify-between min-h-[48px] px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                      selectedVariantId === v.id
                        ? "border-amber-500 bg-amber-50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="item-variant"
                        value={v.id}
                        checked={selectedVariantId === v.id}
                        onChange={() => onVariantChange(v.id)}
                        className="accent-amber-500 w-4 h-4"
                      />
                      <span className="text-sm font-semibold text-gray-700">
                        {v.name}
                      </span>
                    </div>
                    {v.priceDelta !== 0 && (
                      <span className="text-sm font-bold text-amber-600">
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
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">
                  {group.name}
                </h3>
                {group.isRequired && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">
                    Requerido
                  </span>
                )}
                {group.maxSelections > 1 && (
                  <span className="text-xs text-gray-400">
                    Máx {group.maxSelections}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {group.modifiers.map((mod) => (
                  <label
                    key={mod.id}
                    className={`flex items-center justify-between min-h-[48px] px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                      selectedModIds.has(mod.id)
                        ? "border-amber-500 bg-amber-50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedModIds.has(mod.id)}
                        onChange={() => onToggleMod(group, mod.id)}
                        className="accent-amber-500 w-4 h-4"
                      />
                      <span className="text-sm font-semibold text-gray-700">
                        {mod.name}
                      </span>
                    </div>
                    {mod.priceDelta !== 0 && (
                      <span className="text-sm font-bold text-amber-600">
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
            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide mb-2">
              Instrucciones especiales
            </h3>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Sin cilantro, extra picante, alergia a nueces…"
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 resize-none"
            />
          </section>
        </div>

        {/* Fixed footer */}
        <div className="flex-none px-5 py-4 bg-white border-t border-gray-100 safe-bottom">
          {/* Quantity selector */}
          <div className="flex items-center justify-center gap-6 mb-4">
            <button
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              aria-label="Reducir cantidad"
              className="w-11 h-11 rounded-full bg-gray-100 text-gray-700 font-black text-2xl flex items-center justify-center active:scale-90 transition-transform"
            >
              −
            </button>
            <span className="text-2xl font-black text-gray-900 w-8 text-center tabular-nums">
              {quantity}
            </span>
            <button
              onClick={() => onQuantityChange(quantity + 1)}
              aria-label="Aumentar cantidad"
              className="w-11 h-11 rounded-full bg-amber-500 text-white font-black text-2xl flex items-center justify-center active:scale-90 transition-transform shadow-md"
            >
              +
            </button>
          </div>

          {/* Add to cart */}
          <button
            onClick={onAddToCart}
            className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-black py-4 rounded-2xl shadow-lg transition-all flex items-center justify-between px-5 text-base min-h-[56px]"
          >
            <span>Agregar al carrito</span>
            <span>{fmt(totalPrice)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
