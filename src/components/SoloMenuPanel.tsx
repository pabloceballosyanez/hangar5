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

interface CartEntry {
  id: string; // unique key for React
  menuItemId: string;
  variantId: string | null;
  modifierIds: string[];
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
        // Activate the first category that has items
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

  const cartTotal = useMemo(
    () => cart.reduce((sum, entry) => sum + entry.unitPrice * entry.quantity, 0),
    [cart],
  );

  const cartItemCount = useMemo(
    () => cart.reduce((sum, entry) => sum + entry.quantity, 0),
    [cart],
  );

  // ── Cart actions ─────────────────────────────────────────────────────────

  const addToCart = useCallback((item: MenuItem) => {
    const defVariant = resolveDefaultVariant(item.variants);
    const variantId = defVariant?.id ?? null;
    const priceDelta = defVariant?.priceDelta ?? 0;
    const unitPrice = item.basePrice + priceDelta;

    setCart((prev) => {
      // Check if this exact item+variant combo already exists (without modifiers)
      const existingIdx = prev.findIndex(
        (entry) =>
          entry.menuItemId === item.id &&
          entry.variantId === variantId &&
          entry.modifierIds.length === 0,
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + 1,
        };
        return updated;
      }
      // New entry
      return [
        ...prev,
        {
          id: `${item.id}-${variantId ?? 'novariant'}-${Date.now()}`,
          menuItemId: item.id,
          variantId,
          modifierIds: [],
          quantity: 1,
          name: item.name,
          unitPrice,
        },
      ];
    });
  }, []);

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

  // ── Send order ───────────────────────────────────────────────────────────

  const handleSendToKitchen = useCallback(async () => {
    if (cart.length === 0) return;
    setSending(true);
    setSendError('');
    setSendSuccess(false);

    try {
      const res = await fetch('/api/admin/restaurant/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceSessionId: sessionId,
          source: 'ADMIN',
          items: cart.map((entry) => ({
            menuItemId: entry.menuItemId,
            variantId: entry.variantId,
            modifierIds: entry.modifierIds,
            quantity: entry.quantity,
            specialInstructions: entry.specialInstructions || null,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }

      setCart([]);
      setSendSuccess(true);
      onOrderSent();

      // Clear success message after a few seconds
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Error al enviar la orden');
    } finally {
      setSending(false);
    }
  }, [cart, sessionId, onOrderSent]);

  // ── Render helpers ───────────────────────────────────────────────────────

  const tabClass = (catId: string) =>
    `whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
      activeCategoryId === catId
        ? 'border-[#b88364] text-[#b88364]'
        : 'border-transparent text-gray-500 hover:text-[#1b4235] hover:border-gray-300'
    }`;

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
        <p className="text-xs text-gray-400 mt-0.5">Seleccioná los platillos</p>
      </div>

      {/* Category tabs */}
      <div className="flex-shrink-0 border-b border-gray-100">
        <div className="flex overflow-x-auto scrollbar-hide px-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={tabClass(cat.id)}
              onClick={() => setActiveCategoryId(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu items grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeCategory && activeCategory.menuItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeCategory.menuItems.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col"
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
                  <button
                    type="button"
                    onClick={() => addToCart(item)}
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-[#b88364] text-white flex items-center justify-center hover:bg-[#a07256] active:bg-[#8f654c] transition-colors shadow-sm"
                    title="Agregar al pedido"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-green-700">
                    {formatPrice(item.basePrice)}
                  </span>
                  {item.variants.length > 0 && (
                    <span className="text-[10px] text-gray-400">
                      {item.variants.length} {item.variants.length === 1 ? 'variante' : 'variantes'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="text-3xl">🍽️</div>
              <p className="text-sm text-gray-400 font-medium">
                {activeCategory
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
              <div key={entry.id} className="flex items-center gap-2 text-sm">
                {/* Quantity controls */}
                <div className="flex items-center gap-1">
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

                {/* Item name */}
                <span className="flex-1 text-xs text-[#1b4235] truncate">{entry.name}</span>

                {/* Line price */}
                <span className="text-xs font-semibold text-green-700 whitespace-nowrap">
                  {formatPrice(entry.unitPrice * entry.quantity)}
                </span>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeFromCart(entry.id)}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
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
    </div>
  );
}
