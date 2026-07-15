'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Modifier {
  id: string;
  name: string;
  priceDelta: number; // pesos
}

interface ModifierGroup {
  id: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  isRequired: boolean;
  pivotId: string;
  modifiers: Modifier[];
}

interface MenuItemVariant {
  id: string;
  name: string;
  priceDelta: number;
  isDefault: boolean;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  basePrice: number; // pesos
  imageUrl: string | null;
  prepStation: string;
  estimatedPrepMinutes: number | null;
  sortOrder: number;
  variants: MenuItemVariant[];
  modifierGroups: ModifierGroup[];
}

interface Category {
  id: string;
  name: string;
  kind: string;
  sortOrder: number;
  imageUrl: string | null;
  menuItems: MenuItem[];
}

interface CartMod {
  id: string;
  name: string;
  priceDelta: number;
}

interface CartEntry {
  id: string; // unique key for React
  menuItemId: string;
  variantId: string | null;
  variantName: string | null;
  modifiers: CartMod[];
  quantity: number;
  specialInstructions?: string;
  // denormalized display info
  name: string;
  unitPrice: number; // basePrice + variant delta (already in pesos)
}

interface SoloMenuPanelProps {
  sessionId: string;
  onOrderSent: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(pesos: number): string {
  return `$${pesos.toFixed(2)}`;
}

function resolveDefaultVariant(variants: MenuItemVariant[]): MenuItemVariant | null {
  const def = variants.find((v) => v.isDefault);
  if (def) return def;
  return variants.length > 0 ? variants[0] : null;
}

function randId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function cartLineTotal(entry: CartEntry): number {
  const mods = entry.modifiers.reduce((s, m) => s + m.priceDelta, 0);
  return (entry.unitPrice + mods) * entry.quantity;
}

// ─── Item Modal (variant + modifiers + notes + qty) ──────────────────────────

interface ItemModalProps {
  item: MenuItem;
  quantity: number;
  selectedVariantId: string | null;
  selectedModIds: Set<string>;
  notes: string;
  onClose: () => void;
  onQtyChange: (q: number) => void;
  onVariantChange: (id: string | null) => void;
  onToggleMod: (group: ModifierGroup, modId: string) => void;
  onNotesChange: (s: string) => void;
  onAdd: () => void;
}

function ItemModal({
  item, quantity, selectedVariantId, selectedModIds, notes,
  onClose, onQtyChange, onVariantChange, onToggleMod, onNotesChange, onAdd,
}: ItemModalProps) {
  const variant = selectedVariantId ? item.variants.find((v) => v.id === selectedVariantId) : null;
  const modsTotal = [...selectedModIds].reduce((sum, id) => {
    for (const g of item.modifierGroups) {
      const m = g.modifiers.find((mod) => mod.id === id);
      if (m) return sum + m.priceDelta;
    }
    return sum;
  }, 0);
  const totalPrice = (item.basePrice + (variant?.priceDelta ?? 0) + modsTotal) * quantity;

  // Required groups without a selection block the "add" button
  const missingRequired = item.modifierGroups.some((g) => {
    if (!g.isRequired) return false;
    const chosen = g.modifiers.filter((m) => selectedModIds.has(m.id)).length;
    return chosen < Math.max(1, g.minSelections);
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-t-3xl overflow-hidden max-h-[92dvh] flex flex-col shadow-2xl border-t border-gray-200">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-none">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pb-4 flex-none border-b border-gray-100">
          <div className="flex-1 mr-3">
            <h2 className="font-bold text-[#1b4235] text-xl leading-tight">{item.name}</h2>
            {item.description && (
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">{item.description}</p>
            )}
            <p className="text-2xl font-bold text-green-700 font-mono mt-2">{formatPrice(item.basePrice)}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          {/* Variants */}
          {item.variants.length > 0 && (
            <section>
              <h3 className="font-bold text-[#b88364] text-xs uppercase tracking-widest mb-2.5">Variante</h3>
              <div className="space-y-2">
                {item.variants.map((v) => (
                  <label
                    key={v.id}
                    className={`flex items-center justify-between min-h-[52px] px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedVariantId === v.id
                        ? 'border-[#b88364] bg-[#fef9f6]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedVariantId === v.id ? 'border-[#b88364] bg-[#b88364]' : 'border-gray-300'
                      }`}>
                        {selectedVariantId === v.id && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <input
                        type="radio"
                        name="variant"
                        className="sr-only"
                        checked={selectedVariantId === v.id}
                        onChange={() => onVariantChange(v.id)}
                      />
                      <span className="text-[#1b4235] font-medium">{v.name}</span>
                    </div>
                    {v.priceDelta !== 0 && (
                      <span className="text-green-700 font-mono font-bold text-sm">
                        {v.priceDelta > 0 ? '+' : ''}{formatPrice(v.priceDelta)}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </section>
          )}

          {/* Modifier groups */}
          {item.modifierGroups.map((group) => (
            <section key={group.id}>
              <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                <h3 className="font-bold text-[#b88364] text-xs uppercase tracking-widest">{group.name}</h3>
                {group.isRequired && (
                  <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-semibold border border-red-200">
                    Requerido
                  </span>
                )}
                {group.maxSelections > 1 && (
                  <span className="text-xs text-gray-400">Máx {group.maxSelections}</span>
                )}
              </div>
              <div className="space-y-2">
                {group.modifiers.map((mod) => (
                  <label
                    key={mod.id}
                    className={`flex items-center justify-between min-h-[52px] px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedModIds.has(mod.id)
                        ? 'border-[#b88364] bg-[#fef9f6]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          selectedModIds.has(mod.id) ? 'border-[#b88364] bg-[#b88364]' : 'border-gray-300'
                        }`}
                      >
                        {selectedModIds.has(mod.id) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={selectedModIds.has(mod.id)}
                        onChange={() => onToggleMod(group, mod.id)}
                      />
                      <span className="text-[#1b4235] font-medium">{mod.name}</span>
                    </div>
                    {mod.priceDelta !== 0 && (
                      <span className="text-green-700 font-mono font-bold text-sm">
                        +{formatPrice(mod.priceDelta)}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </section>
          ))}

          {/* Special instructions */}
          <section>
            <h3 className="font-bold text-[#b88364] text-xs uppercase tracking-widest mb-2.5">Nota especial</h3>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Sin cilantro, extra picante, sin sal…"
              rows={2}
              className="w-full bg-gray-50 border border-gray-200 text-[#1b4235] placeholder-gray-400 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#b88364] resize-none transition-all"
            />
          </section>
        </div>

        {/* Footer: qty + add button */}
        <div className="flex-none px-5 pb-6 pt-4 bg-white border-t border-gray-100 space-y-3">
          {/* Quantity */}
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => onQtyChange(Math.max(1, quantity - 1))}
              className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#b88364] font-bold text-2xl flex items-center justify-center active:scale-90 transition-all border border-gray-200"
            >
              −
            </button>
            <span className="text-3xl font-bold text-[#1b4235] w-10 text-center">{quantity}</span>
            <button
              onClick={() => onQtyChange(quantity + 1)}
              className="w-12 h-12 rounded-xl bg-[#b88364] hover:bg-[#a07256] text-white font-bold text-2xl flex items-center justify-center active:scale-90 transition-all shadow-sm"
            >
              +
            </button>
          </div>

          {/* Add to cart */}
          <button
            onClick={onAdd}
            disabled={missingRequired}
            className="w-full min-h-[56px] bg-[#b88364] hover:bg-[#a07256] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base rounded-xl shadow-sm transition-all flex items-center justify-between px-5"
          >
            <span>{missingRequired ? 'Elegí las opciones requeridas' : 'Agregar al pedido'}</span>
            <span className="font-mono text-lg">{formatPrice(totalPrice)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SoloMenuPanel({ sessionId, onOrderSent }: SoloMenuPanelProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState(false);
  const [search, setSearch] = useState('');

  // ── Modal state ──────────────────────────────────────────────────────────
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selVariantId, setSelVariantId] = useState<string | null>(null);
  const [selModIds, setSelModIds] = useState<Set<string>>(new Set());
  const [itemQty, setItemQty] = useState(1);
  const [itemNotes, setItemNotes] = useState('');

  // ── Fetch menu ───────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    async function fetchMenu() {
      try {
        setLoading(true);
        setLoadError('');
        const res = await fetch('/api/restaurant/menu');
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Error ${res.status}`);
        }
        const data: Category[] = await res.json();
        if (cancelled) return;
        setCategories(data);
        const firstWithItems = data.find((c) => c.menuItems.length > 0);
        if (firstWithItems) {
          setActiveCategoryId(firstWithItems.id);
        }
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : 'Error al cargar el menú');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchMenu();
    return () => { cancelled = true; };
  }, []);

  // ── Derived data ─────────────────────────────────────────────────────────

  const activeCategory = useMemo(
    () => categories.find((c) => c.id === activeCategoryId) ?? null,
    [categories, activeCategoryId],
  );

  const filteredItems = useMemo(() => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return categories.flatMap((c) => c.menuItems).filter(
        (item) => item.name.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q),
      );
    }
    return activeCategory?.menuItems ?? [];
  }, [categories, activeCategory, search]);

  const cartTotal = useMemo(
    () => cart.reduce((sum, entry) => sum + cartLineTotal(entry), 0),
    [cart],
  );

  const cartItemCount = useMemo(
    () => cart.reduce((sum, entry) => sum + entry.quantity, 0),
    [cart],
  );

  // ── Modal actions ────────────────────────────────────────────────────────

  const openItem = useCallback((item: MenuItem) => {
    const defVariant = resolveDefaultVariant(item.variants);
    setSelectedItem(item);
    setSelVariantId(defVariant?.id ?? null);
    setSelModIds(new Set());
    setItemQty(1);
    setItemNotes('');
  }, []);

  const toggleMod = useCallback((group: ModifierGroup, modId: string) => {
    setSelModIds((prev) => {
      const next = new Set(prev);
      if (next.has(modId)) {
        next.delete(modId);
      } else {
        const groupSelected = group.modifiers.map((m) => m.id).filter((id) => next.has(id));
        if (groupSelected.length >= group.maxSelections) next.delete(groupSelected[0]);
        next.add(modId);
      }
      return next;
    });
  }, []);

  const addToCart = useCallback(() => {
    if (!selectedItem) return;
    const variant = selVariantId ? selectedItem.variants.find((v) => v.id === selVariantId) : null;
    const unitPrice = selectedItem.basePrice + (variant?.priceDelta ?? 0);

    const mods: CartMod[] = [];
    for (const group of selectedItem.modifierGroups) {
      for (const mod of group.modifiers) {
        if (selModIds.has(mod.id)) mods.push({ id: mod.id, name: mod.name, priceDelta: mod.priceDelta });
      }
    }

    const newEntry: CartEntry = {
      id: randId(),
      menuItemId: selectedItem.id,
      variantId: selVariantId,
      variantName: variant?.name ?? null,
      modifiers: mods,
      quantity: itemQty,
      specialInstructions: itemNotes.trim() || undefined,
      name: selectedItem.name,
      unitPrice,
    };
    setCart((prev) => [...prev, newEntry]);
    setSelectedItem(null);
  }, [selectedItem, selVariantId, selModIds, itemQty, itemNotes]);

  // ── Cart actions ─────────────────────────────────────────────────────────

  const updateQuantity = useCallback((entryId: string, delta: number) => {
    setCart((prev) => {
      const idx = prev.findIndex((e) => e.id === entryId);
      if (idx < 0) return prev;
      const updated = [...prev];
      const newQty = updated[idx].quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== idx);
      }
      updated[idx] = { ...updated[idx], quantity: newQty };
      return updated;
    });
  }, []);

  const removeFromCart = useCallback((entryId: string) => {
    setCart((prev) => prev.filter((e) => e.id !== entryId));
  }, []);

  // ── Send order to kitchen ─────────────────────────────────────────────────
  // FIX: create order (DRAFT) THEN advance to PLACED so it reaches the KDS.
  // Previously the order stayed in DRAFT and never appeared in the kitchen.

  const handleSendToKitchen = useCallback(async () => {
    if (cart.length === 0) return;
    setSending(true);
    setSendError('');
    setSendSuccess(false);

    try {
      // 1. Create the order (source WAITER → starts as DRAFT)
      const res = await fetch('/api/admin/restaurant/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceSessionId: sessionId,
          source: 'WAITER',
          items: cart.map((entry) => ({
            menuItemId: entry.menuItemId,
            variantId: entry.variantId,
            modifierIds: entry.modifiers.map((m) => m.id),
            quantity: entry.quantity,
            specialInstructions: entry.specialInstructions || null,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }

      const order = await res.json();

      // 2. Advance DRAFT → PLACED (this is what sends it to the kitchen / KDS)
      const statusRes = await fetch(`/api/admin/restaurant/orders/${order.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PLACED' }),
      });

      if (!statusRes.ok) {
        const data = await statusRes.json().catch(() => ({}));
        throw new Error(data.error || 'La orden se creó pero no se pudo enviar a cocina');
      }

      setCart([]);
      setSendSuccess(true);
      onOrderSent();

      setTimeout(() => setSendSuccess(false), 3000);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Error al enviar la orden');
    } finally {
      setSending(false);
    }
  }, [cart, sessionId, onOrderSent]);

  // ── Render helpers ───────────────────────────────────────────────────────

  // ── Loading state ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-white"
        style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <svg className="animate-spin w-8 h-8 text-[#b88364]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm">Cargando menú...</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────

  if (loadError) {
    return (
      <div className="h-full flex flex-col bg-white"
        style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-center px-6">
            <div className="text-4xl">⚠️</div>
            <p className="text-sm text-red-600 font-medium">Error al cargar el menú</p>
            <p className="text-xs text-gray-400">{loadError}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────

  if (categories.length === 0) {
    return (
      <div className="h-full flex flex-col bg-white"
        style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-center px-6">
            <div className="text-4xl">📋</div>
            <p className="text-sm text-gray-500 font-medium">No hay platillos disponibles</p>
            <p className="text-xs text-gray-400">El menú está vacío o no se ha configurado</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-white"
      style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2 border-b border-gray-100 flex-shrink-0">
        <h2 className="text-lg font-bold text-[#1b4235]">Menú</h2>
        <p className="text-xs text-gray-400 mt-0.5">Tocá un platillo para elegir opciones</p>
      </div>

      {/* Search */}
      <div className="px-4 py-2 border-b border-gray-100 flex-shrink-0">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar platillo o bebida…"
          className="w-full bg-gray-50 border border-gray-200 text-[#1b4235] placeholder-gray-400 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-[#b88364] transition-all"
        />
      </div>

      {/* Category tabs (hidden during search) — all visible, wrapping */}
      {!search.trim() && (
        <div className="flex-shrink-0 border-b border-gray-100 px-3 py-2">
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategoryId(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                  activeCategoryId === cat.id
                    ? 'bg-[#b88364] text-white border-[#b88364] shadow-sm'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#b88364]/40 hover:text-[#b88364]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu items grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredItems.map((item) => {
              const hasOptions = item.variants.length > 0 || item.modifierGroups.length > 0;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openItem(item)}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col text-left hover:border-[#b88364]/40 hover:shadow transition-all active:scale-[0.98]"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-[#1b4235] leading-tight">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-full bg-[#b88364] text-white flex items-center justify-center shadow-sm"
                      title="Elegir opciones"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-green-700">
                      {formatPrice(item.basePrice)}
                    </span>
                    {hasOptions && (
                      <span className="text-[10px] text-gray-400">
                        {item.variants.length > 0 && `${item.variants.length} var.`}
                        {item.variants.length > 0 && item.modifierGroups.length > 0 && ' · '}
                        {item.modifierGroups.length > 0 && 'opciones'}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="text-3xl">{search.trim() ? '🔍' : '🍽️'}</div>
              <p className="text-sm text-gray-400 font-medium">
                {search.trim()
                  ? `Sin resultados para "${search}"`
                  : activeCategory
                    ? `No hay platillos en "${activeCategory.name}"`
                    : 'Seleccioná una categoría'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Cart footer */}
      {cart.length > 0 && (
        <div className="flex-shrink-0 border-t border-gray-200 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
          {/* Cart items */}
          <div className="max-h-48 overflow-y-auto px-4 py-3 space-y-2">
            {cart.map((entry) => (
              <div key={entry.id} className="flex items-start gap-2 text-sm">
                {/* Quantity controls */}
                <div className="flex items-center gap-1 pt-0.5">
                  <button
                    type="button"
                    onClick={() => updateQuantity(entry.id, -1)}
                    className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors text-xs"
                  >
                    −
                  </button>
                  <span className="w-5 text-center text-xs font-medium text-[#1b4235]">
                    {entry.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(entry.id, 1)}
                    className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors text-xs"
                  >
                    +
                  </button>
                </div>

                {/* Item name + details */}
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-[#1b4235] font-medium leading-tight">
                    {entry.name}
                    {entry.variantName && <span className="text-gray-400"> · {entry.variantName}</span>}
                  </span>
                  {entry.modifiers.map((m) => (
                    <p key={m.id} className="text-[10px] text-gray-400 leading-tight">+ {m.name}</p>
                  ))}
                  {entry.specialInstructions && (
                    <p className="text-[10px] text-amber-600 italic leading-tight">&ldquo;{entry.specialInstructions}&rdquo;</p>
                  )}
                </div>

                {/* Line price */}
                <span className="text-xs font-semibold text-green-700 whitespace-nowrap pt-0.5">
                  {formatPrice(cartLineTotal(entry))}
                </span>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeFromCart(entry.id)}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                  title="Quitar del pedido"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Total + Send button */}
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                Total · {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
              </span>
              <span className="text-lg font-bold text-green-700">
                {formatPrice(cartTotal)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleSendToKitchen}
              disabled={sending}
              className="px-5 py-2.5 bg-[#b88364] text-white text-sm font-semibold rounded-lg hover:bg-[#a07256] active:bg-[#8f654c] disabled:opacity-60 transition-colors shadow-sm whitespace-nowrap flex items-center gap-2"
            >
              {sending ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Enviando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Enviar a cocina
                </>
              )}
            </button>
          </div>

          {/* Feedback messages */}
          {sendError && (
            <div className="px-4 pb-3">
              <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 text-xs text-red-700 flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{sendError}</span>
              </div>
            </div>
          )}

          {sendSuccess && (
            <div className="px-4 pb-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 text-xs text-green-700 flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>¡Orden enviada a cocina!</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Item modal */}
      {selectedItem && (
        <ItemModal
          item={selectedItem}
          quantity={itemQty}
          selectedVariantId={selVariantId}
          selectedModIds={selModIds}
          notes={itemNotes}
          onClose={() => setSelectedItem(null)}
          onQtyChange={setItemQty}
          onVariantChange={setSelVariantId}
          onToggleMod={toggleMod}
          onNotesChange={setItemNotes}
          onAdd={addToCart}
        />
      )}
    </div>
  );
}
