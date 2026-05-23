'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';

// ── Domain types (mirrors /api/restaurant/menu response) ──────────────────────

interface MenuModifier {
  id:         string;
  name:       string;
  priceDelta: number;
}

interface MenuModifierGroup {
  id:            string;
  pivotId:       string;
  name:          string;
  minSelections: number;
  maxSelections: number;
  isRequired:    boolean;
  modifiers:     MenuModifier[];
}

interface MenuVariant {
  id:         string;
  name:       string;
  priceDelta: number;
  isDefault:  boolean;
}

interface MenuItemData {
  id:                    string;
  name:                  string;
  description?:          string | null;
  basePrice:             number;
  imageUrl?:             string | null;
  estimatedPrepMinutes:  number;
  variants:              MenuVariant[];
  modifierGroups:        MenuModifierGroup[];
}

interface MenuCategory {
  id:        string;
  name:      string;
  kind:      string;
  sortOrder: number;
  imageUrl?: string | null;
  menuItems: MenuItemData[];
}

// ── Cart types ────────────────────────────────────────────────────────────────

interface CartMod {
  id:         string;
  name:       string;
  priceDelta: number;
}

interface CartItem {
  cartId:              string;
  menuItemId:          string;
  name:                string;
  variantId?:          string | null;
  variantName?:        string | null;
  modifiers:           CartMod[];
  quantity:            number;
  unitPrice:           number;
  specialInstructions?: string;
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function fmt(pesos: number) {
  return `$${pesos.toFixed(2)}`;
}

function cartLineTotal(item: CartItem) {
  const mods = item.modifiers.reduce((s, m) => s + m.priceDelta, 0);
  return (item.unitPrice + mods) * item.quantity;
}

function cartSubtotal(items: CartItem[]) {
  return items.reduce((s, i) => s + cartLineTotal(i), 0);
}

function randId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  FOOD:  '🍽️',
  DRINK: '🥤',
};

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold text-white max-w-xs text-center transition-all ${
      type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
    }`}>
      {message}
    </div>
  );
}

// ── Item Modal (bottom sheet) ─────────────────────────────────────────────────

interface ItemModalProps {
  item:              MenuItemData;
  quantity:          number;
  selectedVariantId: string | null;
  selectedModIds:    Set<string>;
  notes:             string;
  onClose:           () => void;
  onQtyChange:       (q: number) => void;
  onVariantChange:   (id: string | null) => void;
  onToggleMod:       (group: MenuModifierGroup, modId: string) => void;
  onNotesChange:     (s: string) => void;
  onAdd:             () => void;
}

function ItemModal({
  item, quantity, selectedVariantId, selectedModIds, notes,
  onClose, onQtyChange, onVariantChange, onToggleMod, onNotesChange, onAdd,
}: ItemModalProps) {
  const variant    = selectedVariantId ? item.variants.find(v => v.id === selectedVariantId) : null;
  const modsTotal  = [...selectedModIds].reduce((sum, id) => {
    for (const g of item.modifierGroups) {
      const m = g.modifiers.find(mod => mod.id === id);
      if (m) return sum + m.priceDelta;
    }
    return sum;
  }, 0);
  const totalPrice = (item.basePrice + (variant?.priceDelta ?? 0) + modsTotal) * quantity;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-slate-900 rounded-t-3xl overflow-hidden max-h-[92dvh] flex flex-col border-t-2 border-amber-400/20 shadow-2xl">
        {/* Handle + close */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1 flex-none">
          <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pb-4 flex-none border-b border-slate-800">
          <div className="flex-1 mr-3">
            <h2 className="font-black text-white text-xl leading-tight">{item.name}</h2>
            {item.description && (
              <p className="text-sm text-slate-400 mt-1 leading-relaxed">{item.description}</p>
            )}
            <p className="text-2xl font-black text-amber-400 font-mono mt-2">{fmt(item.basePrice)}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          {/* Variants */}
          {item.variants.length > 0 && (
            <section>
              <h3 className="font-bold text-amber-400 text-xs uppercase tracking-widest mb-2.5">Variante</h3>
              <div className="space-y-2">
                {item.variants.map((v) => (
                  <label key={v.id} className={`flex items-center justify-between min-h-[52px] px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedVariantId === v.id
                      ? 'border-amber-400 bg-amber-400/10'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedVariantId === v.id ? 'border-amber-400 bg-amber-400' : 'border-slate-500'
                      }`}>
                        {selectedVariantId === v.id && <div className="w-2 h-2 rounded-full bg-slate-900" />}
                      </div>
                      <input
                        type="radio"
                        name="variant"
                        className="sr-only"
                        checked={selectedVariantId === v.id}
                        onChange={() => onVariantChange(v.id)}
                      />
                      <span className="text-white font-medium">{v.name}</span>
                    </div>
                    {v.priceDelta !== 0 && (
                      <span className="text-amber-400 font-mono font-bold text-sm">
                        {v.priceDelta > 0 ? '+' : ''}{fmt(v.priceDelta)}
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
                <h3 className="font-bold text-amber-400 text-xs uppercase tracking-widest">{group.name}</h3>
                {group.isRequired && (
                  <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full font-semibold border border-red-500/30">
                    Requerido
                  </span>
                )}
                {group.maxSelections > 1 && (
                  <span className="text-xs text-slate-500">Máx {group.maxSelections}</span>
                )}
              </div>
              <div className="space-y-2">
                {group.modifiers.map((mod) => (
                  <label key={mod.id} className={`flex items-center justify-between min-h-[52px] px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedModIds.has(mod.id)
                      ? 'border-amber-400 bg-amber-400/10'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          selectedModIds.has(mod.id) ? 'border-amber-400 bg-amber-400' : 'border-slate-500'
                        }`}
                        onClick={() => onToggleMod(group, mod.id)}
                      >
                        {selectedModIds.has(mod.id) && (
                          <svg className="w-3 h-3 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
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
                      <span className="text-white font-medium">{mod.name}</span>
                    </div>
                    {mod.priceDelta !== 0 && (
                      <span className="text-amber-400 font-mono font-bold text-sm">
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
            <h3 className="font-bold text-amber-400 text-xs uppercase tracking-widest mb-2.5">Nota especial</h3>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Sin cilantro, extra picante, sin sal…"
              rows={2}
              className="w-full bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-amber-400/60 resize-none transition-all"
            />
          </section>
        </div>

        {/* Footer: qty + add button */}
        <div className="flex-none px-5 pb-6 pt-4 bg-gradient-to-t from-slate-950 to-slate-900 border-t border-slate-800 space-y-3">
          {/* Quantity */}
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => onQtyChange(Math.max(1, quantity - 1))}
              className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-black text-2xl flex items-center justify-center active:scale-90 transition-all border border-slate-700"
            >
              −
            </button>
            <span className="text-3xl font-black text-white w-10 text-center">{quantity}</span>
            <button
              onClick={() => onQtyChange(quantity + 1)}
              className="w-12 h-12 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-black text-2xl flex items-center justify-center active:scale-90 transition-all shadow-lg shadow-amber-500/30"
            >
              +
            </button>
          </div>

          {/* Add to cart */}
          <button
            onClick={onAdd}
            className="w-full min-h-[56px] bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-900 font-black text-base rounded-xl shadow-xl shadow-amber-500/20 transition-all flex items-center justify-between px-5"
          >
            <span>Agregar al pedido</span>
            <span className="font-mono text-lg">{fmt(totalPrice)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Cart Sheet ─────────────────────────────────────────────────────────────────

function CartSheet({
  cart,
  sending,
  onClose,
  onRemove,
  onSend,
}: {
  cart:     CartItem[];
  sending:  boolean;
  onClose:  () => void;
  onRemove: (cartId: string) => void;
  onSend:   () => void;
}) {
  const subtotal = cartSubtotal(cart);
  const tax      = subtotal * 0.16;
  const total    = subtotal + tax;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-slate-900 rounded-t-3xl max-h-[85dvh] flex flex-col border-t-2 border-amber-400/20 shadow-2xl">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-700 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 flex-none">
          <h2 className="font-black text-white text-xl">🛒 Pedido</h2>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors">✕</button>
        </div>

        {/* Items */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
          {cart.map((item) => (
            <div key={item.cartId} className="flex gap-3 items-start">
              <div className="w-8 h-8 bg-amber-400/10 border border-amber-400/20 rounded-lg flex items-center justify-center text-amber-400 font-bold text-sm shrink-0">
                {item.quantity}×
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm leading-tight">
                  {item.name}
                  {item.variantName && <span className="text-slate-400"> · {item.variantName}</span>}
                </p>
                {item.modifiers.map((m, i) => (
                  <p key={i} className="text-xs text-slate-500">+ {m.name}</p>
                ))}
                {item.specialInstructions && (
                  <p className="text-xs text-amber-400/70 italic mt-0.5">"{item.specialInstructions}"</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-white text-sm font-mono">{fmt(cartLineTotal(item))}</p>
                <button
                  onClick={() => onRemove(item.cartId)}
                  className="text-xs text-red-400/60 hover:text-red-400 mt-0.5 transition-colors"
                >
                  Quitar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Totals + send */}
        <div className="flex-none px-5 pb-6 pt-3 border-t border-slate-800 space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-sm text-slate-400">
              <span>Subtotal</span><span>{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-400">
              <span>IVA (16%)</span><span>{fmt(tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-white pt-1 border-t border-slate-700">
              <span>Total estimado</span>
              <span className="text-amber-400 font-mono">{fmt(total)}</span>
            </div>
          </div>

          <button
            onClick={onSend}
            disabled={sending || cart.length === 0}
            className="w-full min-h-[60px] bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-black text-base rounded-xl shadow-xl shadow-emerald-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Enviando…</span>
              </>
            ) : (
              <>
                <span>✉️</span>
                <span>Enviar a cocina</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function WaiterOrderPage() {
  const router  = useRouter();
  const params  = useParams();
  const tableId = params.tableId as string;

  // Remote data
  const [categories,  setCategories]  = useState<MenuCategory[]>([]);
  const [sessionId,   setSessionId]   = useState<string | null>(null);
  const [tableNumber, setTableNumber] = useState('');
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  // UI
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search,          setSearch]         = useState('');
  const tabsRef = useRef<HTMLDivElement>(null);

  // Modal state
  const [selectedItem,   setSelectedItem]   = useState<MenuItemData | null>(null);
  const [selVariantId,   setSelVariantId]   = useState<string | null>(null);
  const [selModIds,      setSelModIds]      = useState<Set<string>>(new Set());
  const [itemQty,        setItemQty]        = useState(1);
  const [itemNotes,      setItemNotes]      = useState('');

  // Cart
  const [cart,      setCart]      = useState<CartItem[]>([]);
  const [showCart,  setShowCart]  = useState(false);

  // Sending
  const [sending, setSending] = useState(false);
  const [toast,   setToast]   = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // ── Load data ──
  useEffect(() => {
    if (!sessionStorage.getItem('waiterName')) {
      router.replace('/waiter/login');
      return;
    }

    const load = async () => {
      try {
        const [menuRes, sessRes, tableRes] = await Promise.all([
          fetch('/api/restaurant/menu', { cache: 'no-store' }),
          fetch(`/api/admin/restaurant/tables/${tableId}/sessions`, { cache: 'no-store' }),
          fetch(`/api/admin/restaurant/tables/${tableId}`, { cache: 'no-store' }),
        ]);

        if (!menuRes.ok)  throw new Error('Error al cargar el menú');
        if (!sessRes.ok)  throw new Error('Error al cargar la sesión');
        if (!tableRes.ok) throw new Error('Mesa no encontrada');

        const menuData: MenuCategory[] = await menuRes.json();
        const sessData: { id: string; status: string }[] = await sessRes.json();
        const tableData: { number: string } = await tableRes.json();

        const openSess = sessData.find(s => s.status === 'OPEN');
        if (!openSess) {
          // No open session — go back to table page to open one
          router.replace(`/waiter/table/${tableId}`);
          return;
        }

        setCategories(menuData);
        setSessionId(openSess.id);
        setTableNumber(tableData.number);
        if (menuData.length > 0) setActiveCategory(menuData[0].id);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router, tableId]);

  // ── Open item ──
  const openItem = useCallback((item: MenuItemData) => {
    const defaultVariant = item.variants.find(v => v.isDefault) ?? item.variants[0] ?? null;
    setSelectedItem(item);
    setSelVariantId(defaultVariant?.id ?? null);
    setSelModIds(new Set());
    setItemQty(1);
    setItemNotes('');
  }, []);

  // ── Toggle modifier ──
  const toggleMod = useCallback((group: MenuModifierGroup, modId: string) => {
    setSelModIds(prev => {
      const next = new Set(prev);
      if (next.has(modId)) {
        next.delete(modId);
      } else {
        const groupSelected = group.modifiers.map(m => m.id).filter(id => next.has(id));
        if (groupSelected.length >= group.maxSelections) next.delete(groupSelected[0]);
        next.add(modId);
      }
      return next;
    });
  }, []);

  // ── Add to cart ──
  const addToCart = useCallback(() => {
    if (!selectedItem) return;
    const variant  = selVariantId ? selectedItem.variants.find(v => v.id === selVariantId) : null;
    const unitPrice = selectedItem.basePrice + (variant?.priceDelta ?? 0);

    const mods: CartMod[] = [];
    for (const group of selectedItem.modifierGroups) {
      for (const mod of group.modifiers) {
        if (selModIds.has(mod.id)) mods.push({ id: mod.id, name: mod.name, priceDelta: mod.priceDelta });
      }
    }

    const newItem: CartItem = {
      cartId:              randId(),
      menuItemId:          selectedItem.id,
      name:                selectedItem.name,
      variantId:           selVariantId,
      variantName:         variant?.name ?? null,
      modifiers:           mods,
      quantity:            itemQty,
      unitPrice,
      specialInstructions: itemNotes.trim() || undefined,
    };
    setCart(prev => [...prev, newItem]);
    setSelectedItem(null);
  }, [selectedItem, selVariantId, selModIds, itemQty, itemNotes]);

  // ── Send to kitchen ──
  const sendToKitchen = useCallback(async () => {
    if (!sessionId || cart.length === 0) return;
    setSending(true);
    try {
      // 1. Create the order (WAITER source → DRAFT)
      const orderRes = await fetch('/api/admin/restaurant/orders', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableSessionId: sessionId,
          source:         'WAITER',
          items: cart.map(item => ({
            menuItemId:          item.menuItemId,
            variantId:           item.variantId ?? null,
            quantity:            item.quantity,
            specialInstructions: item.specialInstructions ?? null,
            modifierIds:         item.modifiers.map(m => m.id),
          })),
        }),
      });

      if (!orderRes.ok) {
        const d = await orderRes.json();
        throw new Error(d.error ?? 'Error al crear la orden');
      }

      const order = await orderRes.json();

      // 2. Advance to PLACED (sends to kitchen)
      const statusRes = await fetch(`/api/admin/restaurant/orders/${order.id}/status`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PLACED' }),
      });

      if (!statusRes.ok) {
        const d = await statusRes.json();
        throw new Error(d.error ?? 'Error al enviar a cocina');
      }

      // Success!
      setCart([]);
      setShowCart(false);
      setToast({ msg: '✅ Pedido enviado a cocina', type: 'success' });
      setTimeout(() => {
        setToast(null);
        router.push(`/waiter/table/${tableId}`);
      }, 1800);
    } catch (e) {
      setToast({ msg: e instanceof Error ? e.message : 'Error al enviar', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSending(false);
    }
  }, [sessionId, cart, tableId, router]);

  // ── Filtered items ──
  const filteredItems = useMemo(() => {
    if (search.trim()) {
      // Search across all categories
      const q = search.toLowerCase();
      return categories.flatMap(c => c.menuItems).filter(
        item => item.name.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q)
      );
    }
    return categories.find(c => c.id === activeCategory)?.menuItems ?? [];
  }, [categories, activeCategory, search]);

  // ── Cart summary ──
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const subtotal   = cartSubtotal(cart);

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="text-5xl">😕</span>
        <p className="text-white font-bold">Error al cargar el menú</p>
        <p className="text-sm text-slate-400">{error}</p>
        <button onClick={() => router.push(`/waiter/table/${tableId}`)} className="mt-2 px-6 py-3 bg-amber-500 text-slate-900 font-bold rounded-xl active:scale-95 transition-all">
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-32">
      {/* Toast */}
      {toast && <Toast message={toast.msg} type={toast.type} />}

      {/* Header */}
      <header className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.push(`/waiter/table/${tableId}`)}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            ←
          </button>
          <div className="flex-1">
            <h1 className="font-black text-white text-lg leading-tight">Nuevo pedido</h1>
            <p className="text-xs text-amber-400/80">Mesa {tableNumber}</p>
          </div>
          {totalItems > 0 && (
            <button
              onClick={() => setShowCart(true)}
              className="bg-amber-500/20 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-lg text-sm font-bold"
            >
              🛒 {totalItems}
            </button>
          )}
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar platillo o bebida…"
            className="w-full bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-amber-400/60 transition-all"
          />
        </div>

        {/* Category tabs (hidden during search) */}
        {!search.trim() && (
          <div
            ref={tabsRef}
            className="flex gap-2 overflow-x-auto px-4 pb-3"
            style={{ scrollbarWidth: 'none' }}
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-none flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap min-h-[40px] transition-all ${
                  activeCategory === cat.id
                    ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/30'
                    : 'bg-slate-800/80 text-slate-300 border border-slate-700'
                }`}
              >
                <span>{CATEGORY_EMOJIS[cat.kind] ?? '🍴'}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Items grid */}
      <div className="p-4">
        {search.trim() && filteredItems.length === 0 && (
          <div className="text-center py-16 text-slate-600">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-sm">Sin resultados para &quot;{search}&quot;</p>
          </div>
        )}

        {!search.trim() && filteredItems.length === 0 && (
          <div className="text-center py-16 text-slate-600">
            <div className="text-4xl mb-2">🍽️</div>
            <p className="text-sm">Sin platillos en esta categoría</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => openItem(item)}
              className="flex flex-col bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-amber-400/40 rounded-2xl overflow-hidden text-left transition-all active:scale-95"
            >
              {/* Placeholder image area */}
              <div className="w-full h-28 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-4xl">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="opacity-50">🥘</span>
                )}
              </div>
              {/* Info */}
              <div className="p-3 flex-1 flex flex-col">
                <p className="font-bold text-white text-sm leading-tight line-clamp-2 flex-1">{item.name}</p>
                <div className="flex items-end justify-between mt-2 gap-1">
                  <p className="text-amber-400 font-black font-mono text-base leading-none">{fmt(item.basePrice)}</p>
                  <div className="w-8 h-8 bg-amber-500 hover:bg-amber-400 rounded-lg flex items-center justify-center text-slate-900 font-black text-lg shrink-0 transition-all active:scale-90">
                    +
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Floating cart button */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-4 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none z-30">
          <button
            onClick={() => setShowCart(true)}
            className="pointer-events-auto w-full max-w-lg mx-auto flex items-center justify-between bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-900 font-black py-4 px-5 rounded-2xl shadow-2xl shadow-amber-500/30 transition-all"
          >
            <span className="bg-slate-900/30 text-amber-100 text-sm px-3 py-1.5 rounded-lg font-bold">
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </span>
            <span className="flex-1 text-center">🛒 Ver pedido</span>
            <span className="font-mono text-lg">{fmt(subtotal)}</span>
          </button>
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

      {/* Cart sheet */}
      {showCart && (
        <CartSheet
          cart={cart}
          sending={sending}
          onClose={() => setShowCart(false)}
          onRemove={(id) => setCart(prev => prev.filter(i => i.cartId !== id))}
          onSend={sendToKitchen}
        />
      )}
    </div>
  );
}
