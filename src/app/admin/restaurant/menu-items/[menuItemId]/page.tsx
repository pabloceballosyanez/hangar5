'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  kind: string;
}

interface Variant {
  id?: string;
  name: string;
  priceDelta: number;
  isDefault: boolean;
}

interface MenuItem {
  id: string;
  name: string;
  categoryId: string;
  category?: { id: string; name: string };
  description: string | null;
  basePrice: number;
  imageUrl: string | null;
  isActive: boolean;
  prepStation: string;
  estimatedPrepMinutes: number;
  sortOrder: number;
  sku: string | null;
  variants: Variant[];
  menuItemModifierGroups?: { modifierGroup: { id: string; name: string; modifiers: { name: string }[] } }[];
}

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost: number;
  isActive: boolean;
}

interface RecipeItem {
  id?: string;
  ingredientId: string;
  ingredientName?: string;
  ingredientUnit?: string;
  ingredientCost?: number;
  quantity: number;
  inherited?: boolean;
}

interface Recipe {
  id?: string;
  yieldQuantity: number;
  notes: string | null;
  recipeItems: RecipeItem[];
  inheritedItems?: RecipeItem[];
  parentRecipe?: { id: string; notes: string | null; yieldQuantity: number } | null;
}

interface ModifierGroup {
  id: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  isRequired: boolean;
  modifiers: { name: string; priceDelta?: number }[];
  menuItemModifierGroups?: unknown[];
}

const PREP_STATIONS = [
  { value: 'KITCHEN', label: 'Cocina' },
  { value: 'BAR', label: 'Bar' },
  { value: 'COLD_STATION', label: 'Estación fría' },
] as const;

export default function EditMenuItemPage() {
  const router = useRouter();
  const params = useParams();
  const menuItemId = params.menuItemId as string;

  // Form state
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [basePricePesos, setBasePricePesos] = useState<number | ''>('');
  const [prepStation, setPrepStation] = useState('KITCHEN');
  const [estimatedPrepMinutes, setEstimatedPrepMinutes] = useState<number | ''>(15);
  const [imageUrl, setImageUrl] = useState('');
  const [sortOrder, setSortOrder] = useState<number | ''>('');
  const [isActive, setIsActive] = useState(true);
  const [variants, setVariants] = useState<Variant[]>([]);

  // Recipe state
  const [hasRecipe, setHasRecipe] = useState(false);
  const [recipeYield, setRecipeYield] = useState<number | ''>(1);
  const [recipeNotes, setRecipeNotes] = useState('');
  const [recipeItems, setRecipeItems] = useState<RecipeItem[]>([]);
  const [inheritedRecipeItems, setInheritedRecipeItems] = useState<RecipeItem[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [addIngredientId, setAddIngredientId] = useState('');
  const [addIngredientQty, setAddIngredientQty] = useState('');

  // UI state
  const [categories, setCategories] = useState<Category[]>([]);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [selectedModifierGroupIds, setSelectedModifierGroupIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const [itemRes, catRes, mgRes, ingRes] = await Promise.all([
          fetch(`/api/admin/restaurant/menu-items/${menuItemId}`),
          fetch('/api/admin/restaurant/categories'),
          fetch('/api/admin/restaurant/modifier-groups'),
          fetch('/api/admin/restaurant/ingredients'),
        ]);

        if (!itemRes.ok) throw new Error('Item no encontrado');
        const item: MenuItem = await itemRes.json();
        const cats: Category[] = await catRes.json();
        const mgs: ModifierGroup[] = await mgRes.json();
        const ings: Ingredient[] = await ingRes.json();
        setCategories(cats);
        setModifierGroups(Array.isArray(mgs) ? mgs : []);
        setIngredients(Array.isArray(ings) ? ings.filter((i: Ingredient) => i.isActive) : []);

        setName(item.name);
        setCategoryId(item.categoryId);
        setDescription(item.description || '');
        setBasePricePesos(item.basePrice);
        setPrepStation(item.prepStation);
        setEstimatedPrepMinutes(item.estimatedPrepMinutes);
        setImageUrl(item.imageUrl || '');
        setSortOrder(item.sortOrder);
        setIsActive(item.isActive);
        setVariants(item.variants || []);
        const existingIds = (item.menuItemModifierGroups || []).map((mg) => mg.modifierGroup.id);
        setSelectedModifierGroupIds(existingIds);

        // Recipe
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const itemAny = item as any;
        if (itemAny.recipe) {
          setHasRecipe(true);
          setRecipeYield(itemAny.recipe.yieldQuantity || 1);
          setRecipeNotes(itemAny.recipe.notes || '');
          setRecipeItems(
            (itemAny.recipe.recipeItems || []).map((ri: any) => ({
              id: ri.id,
              ingredientId: ri.ingredientId || ri.ingredient?.id,
              ingredientName: ri.ingredient?.name || ri.ingredientName,
              ingredientUnit: ri.ingredient?.unit || ri.ingredientUnit,
              ingredientCost: ri.ingredient?.cost ?? ri.ingredientCost,
              quantity: ri.quantity,
              inherited: false,
            }))
          );
          setInheritedRecipeItems(
            (itemAny.recipe.inheritedItems || []).map((ri: any) => ({
              ingredientId: ri.ingredientId || ri.ingredient?.id,
              ingredientName: ri.ingredient?.name || ri.ingredientName,
              ingredientUnit: ri.ingredient?.unit || ri.ingredientUnit,
              ingredientCost: ri.ingredient?.cost ?? ri.ingredientCost,
              quantity: ri.quantity,
              inherited: true,
            }))
          );
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al cargar');
      } finally {
        setLoading(false);
      }
    }
    load();
    // Safety timeout: never get stuck on loading
    const timeout = setTimeout(() => setLoading(false), 20_000);
    return () => clearTimeout(timeout);
  }, [menuItemId]);

  function addVariant() {
    setVariants([...variants, { name: '', priceDelta: 0, isDefault: variants.length === 0 }]);
  }

  function updateVariant(idx: number, field: keyof Variant, value: string | number | boolean) {
    const updated = [...variants];
    updated[idx] = { ...updated[idx], [field]: value };
    setVariants(updated);
  }

  function removeVariant(idx: number) {
    setVariants(variants.filter((_, i) => i !== idx));
  }

  // ─── Recipe helpers ──────────────────────────────────────────────────────
  function addRecipeItem() {
    if (!addIngredientId || !addIngredientQty) return;
    const qty = parseFloat(addIngredientQty);
    if (isNaN(qty) || qty <= 0) return;
    const ing = ingredients.find((i) => i.id === addIngredientId);
    if (!ing) return;
    setRecipeItems((prev) => [
      ...prev,
      { ingredientId: ing.id, ingredientName: ing.name, ingredientUnit: ing.unit, ingredientCost: ing.cost, quantity: qty },
    ]);
    setAddIngredientId('');
    setAddIngredientQty('');
  }

  function removeRecipeItem(idx: number) {
    setRecipeItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleToggleRecipe() {
    if (hasRecipe && recipeItems.length > 0) {
      if (!confirm('¿Desactivar receta? Se eliminarán todos los ingredientes asociados.')) return;
    }
    setHasRecipe(!hasRecipe);
    if (hasRecipe) {
      // Turning off — reset recipe state
      setRecipeYield(1);
      setRecipeNotes('');
      setRecipeItems([]);
    }
  }

  // ─── Recipe cost calculations ────────────────────────────────────────────
  const inheritedItems = inheritedRecipeItems;
  const allRecipeItems = [...recipeItems, ...inheritedItems];
  const recipeTotalCost = allRecipeItems.reduce(
    (sum, ri) => sum + (ri.ingredientCost || 0) * ri.quantity,
    0
  );
  const ownCost = recipeItems.reduce(
    (sum, ri) => sum + (ri.ingredientCost || 0) * ri.quantity,
    0
  );
  const yieldQty = Number(recipeYield) || 1;
  const costPerPortion = recipeTotalCost / yieldQty;
  const basePrice = Number(basePricePesos) || 0;
  const margin = basePrice - costPerPortion;
  const marginPct = basePrice > 0 ? (margin / basePrice) * 100 : 0;

  // Get available ingredients (not already in recipe)
  const usedIngredientIds = new Set(recipeItems.map((ri) => ri.ingredientId));
  const availableIngredients = ingredients.filter((ing) => !usedIngredientIds.has(ing.id));

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    // Prevent double-submit
    if (saving) return;
    setError(null);

    if (!name.trim()) {
      setError('El nombre es requerido.');
      return;
    }
    if (!categoryId) {
      setError('Selecciona una categoría.');
      return;
    }
    if (basePricePesos === '' || Number(basePricePesos) < 0) {
      setError('El precio base es requerido.');
      return;
    }

    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        categoryId,
        description: description.trim() || null,
        basePrice: Math.round(Number(basePricePesos) * 100),
        prepStation,
        estimatedPrepMinutes: estimatedPrepMinutes !== '' ? Number(estimatedPrepMinutes) : 15,
        imageUrl: imageUrl.trim() || null,
        sortOrder: sortOrder !== '' ? Number(sortOrder) : 0,
        isActive,
        variants: variants
          .filter((v) => v.name.trim())
          .map((v) => ({
            name: v.name.trim(),
            priceDelta: Math.round(v.priceDelta * 100),
            isDefault: v.isDefault,
          })),
        modifierGroupIds: selectedModifierGroupIds,
        recipe: hasRecipe
          ? {
              yieldQuantity: Number(recipeYield) || 1,
              notes: recipeNotes.trim() || null,
              recipeItems: recipeItems.map((ri) => ({
                ingredientId: ri.ingredientId,
                quantity: ri.quantity,
              })),
            }
          : null,
      };

      const res = await fetch(`/api/admin/restaurant/menu-items/${menuItemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = typeof data?.error === 'string'
          ? data.error
          : (data?.error?.fieldErrors || data?.error?.formErrors
            ? 'Datos inválidos. Revisa los campos marcados.'
            : `Error ${res.status}`);
        throw new Error(msg);
      }

      router.push('/admin/restaurant/menu-items');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
      // Scroll to error so user actually sees it
      setTimeout(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('¿Desactivar este item?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/restaurant/menu-items/${menuItemId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error al desactivar');
      router.push('/admin/restaurant/menu-items');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-adp-info)] mx-auto mb-4" />
        <p className="text-[var(--color-adp-tinta-2)]">Cargando item...</p>
      </div>
    );
  }

  if (error && !name) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-[var(--color-adp-urgente)] mb-4">{error}</p>
        <Link href="/admin/restaurant/menu-items" className="text-[var(--color-adp-pino)] hover:text-[var(--color-adp-info)] text-sm font-medium">
          ← Volver al menú
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-3xl">
        <div className="mb-6">
          <Link href="/admin/restaurant/menu-items" className="text-sm text-[var(--color-adp-tinta-2)] hover:text-[var(--color-adp-tinta)] transition-colors">
            ← Volver al menú
          </Link>
          <h1 className="text-2xl font-bold text-[var(--color-adp-tinta)] mt-2">Editar item: {name}</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[var(--color-adp-borde)] p-6">
          <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-adp-tinta)] mb-1">
                Nombre <span className="text-[var(--color-adp-urgente)]">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 focus:border-transparent"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-adp-tinta)] mb-1">
                Categoría <span className="text-[var(--color-adp-urgente)]">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 focus:border-transparent bg-white"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.kind === 'FOOD' ? 'Comida' : 'Bebida'})
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-adp-tinta)] mb-1">
                Descripción <span className="text-[var(--color-adp-tinta-2)] font-normal">(opcional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 focus:border-transparent resize-none"
              />
            </div>

            {/* Price + Prep time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-adp-tinta)] mb-1">
                  Precio base <span className="text-[var(--color-adp-urgente)]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-adp-tinta-2)] text-sm">$</span>
                  <input
                    type="number"
                    value={basePricePesos}
                    onChange={(e) => setBasePricePesos(e.target.value === '' ? '' : Number(e.target.value))}
                    min={0}
                    step={0.01}
                    className="w-full pl-7 pr-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 focus:border-transparent"
                    required
                  />
                </div>
                <p className="text-xs text-[var(--color-adp-tinta-2)] mt-1">En pesos MXN</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-adp-tinta)] mb-1">Tiempo estimado</label>
                <div className="relative">
                  <input
                    type="number"
                    value={estimatedPrepMinutes}
                    onChange={(e) => setEstimatedPrepMinutes(e.target.value === '' ? '' : Number(e.target.value))}
                    min={1}
                    className="w-full pr-14 pl-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 focus:border-transparent"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-adp-tinta-2)] text-sm">min</span>
                </div>
              </div>
            </div>

            {/* Prep station */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-adp-tinta)] mb-1">Estación de preparación</label>
              <select
                value={prepStation}
                onChange={(e) => setPrepStation(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 focus:border-transparent bg-white"
              >
                {PREP_STATIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-adp-tinta)] mb-1">
                URL de imagen <span className="text-[var(--color-adp-tinta-2)] font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="/img/menu/ejemplo.jpg"
                className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 focus:border-transparent"
              />
            </div>

            {/* Active toggle + Sort order */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-[var(--color-adp-pino)] rounded border-[var(--color-adp-borde-2)] focus:ring-[var(--color-adp-pino)]/40"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-[var(--color-adp-tinta)]">Activo</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-adp-tinta)] mb-1">Orden</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value === '' ? '' : Number(e.target.value))}
                  min={0}
                  className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 focus:border-transparent"
                />
              </div>
            </div>

            {/* Variants */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-[var(--color-adp-tinta)]">Variantes</label>
                <button
                  type="button"
                  onClick={addVariant}
                  className="text-xs text-[var(--color-adp-pino)] hover:text-[var(--color-adp-info)] font-medium"
                >
                  + Añadir variante
                </button>
              </div>
              {variants.length === 0 ? (
                <p className="text-xs text-[var(--color-adp-tinta-2)]">Sin variantes. Ej: "Chico", "Grande"</p>
              ) : (
                <div className="space-y-2">
                  {variants.map((v, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-[var(--color-adp-papel-3)] rounded-lg">
                      <input
                        type="text"
                        value={v.name}
                        onChange={(e) => updateVariant(idx, 'name', e.target.value)}
                        placeholder="Nombre"
                        className="flex-1 px-2 py-1 border border-[var(--color-adp-borde-2)] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-adp-pino)]/40"
                      />
                      <div className="relative w-24">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--color-adp-tinta-2)] text-xs">$</span>
                        <input
                          type="number"
                          value={v.priceDelta}
                          onChange={(e) => updateVariant(idx, 'priceDelta', Number(e.target.value))}
                          step={0.01}
                          className="w-full pl-5 pr-2 py-1 border border-[var(--color-adp-borde-2)] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-adp-pino)]/40"
                        />
                      </div>
                      <label className="flex items-center gap-1 text-xs text-[var(--color-adp-tinta-2)]">
                        <input
                          type="checkbox"
                          checked={v.isDefault}
                          onChange={(e) => updateVariant(idx, 'isDefault', e.target.checked)}
                          className="w-3 h-3"
                        />
                        Default
                      </label>
                      <button
                        type="button"
                        onClick={() => removeVariant(idx)}
                        className="text-[var(--color-adp-urgente)] hover:text-[var(--color-adp-urgente)] text-xs px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div ref={errorRef} className="p-3 bg-[var(--color-adp-urgente)] border border-[var(--color-adp-urgente)] rounded-lg text-sm text-white">{error}</div>
            )}

            {/* ── Modifier Groups ── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-[var(--color-adp-tinta)]">Modificadores</label>
                <Link href="/admin/restaurant/modifier-groups" className="text-xs text-[var(--color-adp-pino)] hover:text-[var(--color-adp-info)]">
                  Gestionar grupos →
                </Link>
              </div>
              {modifierGroups.length === 0 ? (
                <p className="text-xs text-[var(--color-adp-tinta-2)]">
                  No hay grupos de modificadores.{' '}
                  <Link href="/admin/restaurant/modifier-groups" className="text-[var(--color-adp-pino)] underline">Crear grupos</Link>
                </p>
              ) : (
                <div className="space-y-1.5 max-h-80 overflow-y-auto border border-[var(--color-adp-borde)] rounded-lg p-2">
                  {modifierGroups.map((mg) => {
                    const isSelected = selectedModifierGroupIds.includes(mg.id);
                    return (
                      <label
                        key={mg.id}
                        className={`flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                          isSelected ? 'bg-[var(--color-adp-info)] border border-[var(--color-adp-info)]' : 'hover:bg-[var(--color-adp-papel-3)] border border-transparent'
                        } text-white`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedModifierGroupIds((prev) =>
                              prev.includes(mg.id) ? prev.filter((id) => id !== mg.id) : [...prev, mg.id]
                            );
                          }}
                          className="w-4 h-4 mt-0.5 rounded border-[var(--color-adp-borde-2)] text-[var(--color-adp-pino)] focus:ring-[var(--color-adp-pino)]/40"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--color-adp-tinta)]">{mg.name}</p>
                          <p className="text-xs text-[var(--color-adp-tinta-2)] mb-1">
                            {mg.modifiers?.length || 0} opciones
                            {mg.isRequired && ' · Obligatorio'}
                            {mg.minSelections > 0 && ` · Mín ${mg.minSelections}`}
                            {mg.maxSelections > 1 && ` · Máx ${mg.maxSelections}`}
                          </p>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                            {(mg.modifiers || []).map((mod, i) => (
                              <span key={i} className="text-xs text-[var(--color-adp-tinta-2)]">
                                • {mod.name}
                                {mod.priceDelta !== undefined && mod.priceDelta !== 0 && (
                                  <span className="text-[var(--color-adp-tinta-2)]"> (+${mod.priceDelta.toFixed(2)})</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Recipe Toggle + Section ── */}
            <div className="border-t border-[var(--color-adp-borde)] pt-5">
              <div className="flex items-center gap-3 mb-1">
                <input
                  type="checkbox"
                  id="hasRecipe"
                  checked={hasRecipe}
                  onChange={handleToggleRecipe}
                  className="w-4 h-4 text-[var(--color-adp-pino)] rounded border-[var(--color-adp-borde-2)] focus:ring-[var(--color-adp-pino)]/40"
                />
                <label htmlFor="hasRecipe" className="text-sm font-semibold text-[var(--color-adp-tinta)]">
                  Tiene receta
                </label>
              </div>
              <p className="text-xs text-[var(--color-adp-tinta-2)] ml-7 mb-3">
                Actívala para calcular el costo de ingredientes y margen del platillo
              </p>

              {hasRecipe && (
                <div className="ml-7 space-y-4 animate-fadeIn">
                  {/* Yield + Notes */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[var(--color-adp-tinta-2)] mb-1">Rendimiento (porciones)</label>
                      <input
                        type="number"
                        value={recipeYield}
                        onChange={(e) => setRecipeYield(e.target.value === '' ? '' : Number(e.target.value))}
                        min={0.5}
                        step={0.5}
                        className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--color-adp-tinta-2)] mb-1">Notas</label>
                      <input
                        type="text"
                        value={recipeNotes}
                        onChange={(e) => setRecipeNotes(e.target.value)}
                        placeholder="Instrucciones, tips..."
                        className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none"
                      />
                    </div>
                  </div>

                  {/* Add ingredient */}
                  <div className="bg-[var(--color-adp-papel-3)] rounded-lg p-3">
                    <p className="text-xs font-medium text-[var(--color-adp-tinta)] mb-2">+ Agregar ingrediente</p>
                    <div className="flex gap-2">
                      <select
                        value={addIngredientId}
                        onChange={(e) => setAddIngredientId(e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-[var(--color-adp-borde-2)] rounded text-xs focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none bg-white"
                      >
                        <option value="">Seleccionar...</option>
                        {availableIngredients.map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} ({ing.unit})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={addIngredientQty}
                        onChange={(e) => setAddIngredientQty(e.target.value)}
                        placeholder="Cant."
                        step="0.01"
                        min="0.01"
                        className="w-20 px-2 py-1.5 border border-[var(--color-adp-borde-2)] rounded text-xs focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none"
                      />
                      <button
                        type="button"
                        onClick={addRecipeItem}
                        disabled={!addIngredientId || !addIngredientQty}
                        className="px-3 py-1.5 bg-[var(--color-adp-pino)] text-white text-xs font-medium rounded hover:bg-[var(--color-adp-pino-hondo)] disabled:opacity-50 transition-colors"
                      >
                        Agregar
                      </button>
                    </div>
                    {availableIngredients.length === 0 && ingredients.length > 0 && (
                      <p className="text-xs text-[var(--color-adp-atencion)] mt-2">Todos los ingredientes ya están en la receta.</p>
                    )}
                    {ingredients.length === 0 && (
                      <p className="text-xs text-[var(--color-adp-tinta-2)] mt-2">
                        No hay ingredientes.{' '}
                        <Link href="/admin/restaurant/ingredients" className="text-[var(--color-adp-pino)] underline">
                          Crear ingredientes
                        </Link>
                      </p>
                    )}
                  </div>

                  {/* Ingredients table */}
                  {recipeItems.length > 0 && (
                    <div className="border border-[var(--color-adp-borde)] rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-[var(--color-adp-papel-3)] border-b border-[var(--color-adp-borde)]">
                            <th className="text-left py-2 px-3 font-medium text-[var(--color-adp-tinta-2)]">Ingrediente</th>
                            <th className="text-center py-2 px-3 font-medium text-[var(--color-adp-tinta-2)] w-16">Cant.</th>
                            <th className="text-right py-2 px-3 font-medium text-[var(--color-adp-tinta-2)] w-20">Costo unit.</th>
                            <th className="text-right py-2 px-3 font-medium text-[var(--color-adp-tinta-2)] w-20">Subtotal</th>
                            <th className="w-8"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-adp-borde)]">
                          {recipeItems.map((ri, idx) => {
                            const subtotal = (ri.ingredientCost || 0) * ri.quantity;
                            return (
                              <tr key={idx} className="hover:bg-[var(--color-adp-papel-3)]">
                                <td className="py-2 px-3 text-[var(--color-adp-tinta)]">{ri.ingredientName}</td>
                                <td className="py-2 px-3 text-center text-[var(--color-adp-tinta-2)]">
                                  {ri.quantity} {ri.ingredientUnit}
                                </td>
                                <td className="py-2 px-3 text-right text-[var(--color-adp-tinta-2)]">
                                  ${(ri.ingredientCost || 0).toFixed(2)}
                                </td>
                                <td className="py-2 px-3 text-right font-medium text-[var(--color-adp-tinta)]">
                                  ${subtotal.toFixed(2)}
                                </td>
                                <td className="py-2 px-1 text-center">
                                  <button
                                    type="button"
                                    onClick={() => removeRecipeItem(idx)}
                                    className="text-[var(--color-adp-urgente)] hover:text-[var(--color-adp-urgente)] text-xs"
                                  >
                                    ✕
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        {inheritedItems.length > 0 && (
                          <tbody className="bg-[var(--color-adp-info)]/30">
                            <tr className="border-b border-[var(--color-adp-info)]">
                              <td colSpan={5} className="py-1.5 px-3 text-xs text-[var(--color-adp-info)] font-medium">
                                🧬 Heredados de template
                              </td>
                            </tr>
                            {inheritedItems.map((ri, idx) => (
                              <tr key={`inh-${idx}`} className="border-b border-[var(--color-adp-info)]">
                                <td className="py-1.5 px-3 text-sm text-[var(--color-adp-info)]">{ri.ingredientName}</td>
                                <td className="py-1.5 px-3 text-xs text-[var(--color-adp-info)]">{ri.ingredientUnit}</td>
                                <td className="py-1.5 px-3 text-right text-sm text-[var(--color-adp-info)]">{ri.quantity.toFixed(2)}</td>
                                <td className="py-1.5 px-3 text-right text-xs text-[var(--color-adp-info)]">${(ri.ingredientCost || 0).toFixed(2)}</td>
                                <td className="py-1.5 px-3 text-right text-sm text-[var(--color-adp-info)]">${((ri.ingredientCost || 0) * ri.quantity).toFixed(2)}</td>
                                <td></td>
                              </tr>
                            ))}
                          </tbody>
                        )}
                        <tfoot>
                          <tr className="bg-[var(--color-adp-papel-3)] border-t border-[var(--color-adp-borde)]">
                            <td colSpan={3} className="py-2 px-3 text-right text-xs font-medium text-[var(--color-adp-tinta-2)]">
                              Costo total:
                            </td>
                            <td className="py-2 px-3 text-right text-xs font-bold text-[var(--color-adp-tinta)]">
                              ${recipeTotalCost.toFixed(2)}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  {/* Margin cards */}
                  {recipeItems.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-[var(--color-adp-papel-3)] rounded-lg p-3 text-center">
                        <p className="text-xs text-[var(--color-adp-tinta-2)]">Costo / porción</p>
                        <p className={`text-sm font-bold ${costPerPortion > 0 ? 'text-[var(--color-adp-atencion)]' : 'text-[var(--color-adp-tinta-2)]'}`}>
                          ${costPerPortion.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-[var(--color-adp-papel-3)] rounded-lg p-3 text-center">
                        <p className="text-xs text-[var(--color-adp-tinta-2)]">Margen</p>
                        <p className={`text-sm font-bold ${margin >= 0 ? 'text-[var(--color-adp-pino)]' : 'text-[var(--color-adp-urgente)]'}`}>
                          ${margin.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-[var(--color-adp-papel-3)] rounded-lg p-3 text-center">
                        <p className="text-xs text-[var(--color-adp-tinta-2)]">% Rentabilidad</p>
                        <p className={`text-sm font-bold ${marginPct >= 0 ? 'text-[var(--color-adp-pino)]' : 'text-[var(--color-adp-urgente)]'}`}>
                          {marginPct.toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Link
                href="/admin/restaurant/menu-items"
                className="px-4 py-2 border border-[var(--color-adp-borde-2)] text-sm font-medium text-[var(--color-adp-tinta)] rounded-lg hover:bg-[var(--color-adp-papel-3)] transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 border border-[var(--color-adp-urgente)] text-sm font-medium text-white rounded-lg hover:bg-[var(--color-adp-urgente)]/85 disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Desactivando...' : 'Desactivar'}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave({ preventDefault: () => {} } as React.FormEvent)}
                className="flex-1 px-4 py-2 bg-[var(--color-adp-pino)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-adp-pino-hondo)] disabled:opacity-50 transition-colors"
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>

            {/* Error also visible near submit button */}
            {error && (
              <div className="p-3 bg-[var(--color-adp-urgente)] border border-[var(--color-adp-urgente)] rounded-lg text-sm text-white">{error}</div>
            )}
          </form>
        </div>
      </div>

      {/* Saving overlay for clear visual feedback */}
      {saving && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg px-6 py-4 flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--color-adp-info)]" />
            <span className="text-sm font-medium text-[var(--color-adp-tinta)]">Guardando cambios...</span>
          </div>
        </div>
      )}
    </div>
  );
}
