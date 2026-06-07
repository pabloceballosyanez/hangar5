'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface RecipeSummary {
  id: string;
  menuItemId: string | null;
  menuItemName: string;
  menuItemActive: boolean;
  isTemplate: boolean;
  yieldQuantity: number;
  notes: string | null;
  ingredientCount: number;
  createdAt: string;
}

interface MenuItem {
  id: string;
  name: string;
  basePrice: number;
  isActive: boolean;
  categoryName?: string;
}

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost: number;
  costDisplay: number;
  currentStock: number;
  isActive: boolean;
}

interface RecipeDetail {
  id: string;
  menuItemId: string | null;
  yieldQuantity: number;
  notes: string | null;
  menuItem: { id: string; name: string; basePrice: number; isActive: boolean } | null;
  recipeItems: {
    id: string;
    recipeId: string;
    ingredientId: string;
    ingredientName: string;
    ingredientUnit: string;
    ingredientCost: number;
    ingredientCostDisplay: number;
    quantity: number;
  }[];
}

function formatPrice(pesos: number) {
  return pesos.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState('');
  const [selectedParentId, setSelectedParentId] = useState('');
  const [yieldQuantity, setYieldQuantity] = useState('1');
  const [notes, setNotes] = useState('');

  // Detail modal
  const [detailRecipe, setDetailRecipe] = useState<RecipeDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Add ingredient form in detail
  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');

  const loadRecipes = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/restaurant/recipes');
      if (res.ok) setRecipes(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  const loadMenuItems = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/restaurant/menu-items');
      if (res.ok) setMenuItems(await res.json());
    } catch { /* ignore */ }
  }, []);

  const loadIngredients = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/restaurant/ingredients');
      if (res.ok) setIngredients(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadRecipes();
    loadMenuItems();
    loadIngredients();
  }, [loadRecipes, loadMenuItems, loadIngredients]);

  function resetCreateForm() {
    setSelectedMenuItemId('');
    setSelectedParentId('');
    setYieldQuantity('1');
    setNotes('');
    setShowCreateForm(false);
    setError(null);
  }

  async function handleCreateRecipe(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMenuItemId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/restaurant/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menuItemId: selectedMenuItemId,
          parentRecipeId: selectedParentId || undefined,
          yieldQuantity: parseFloat(yieldQuantity) || 1,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Error al crear');
      resetCreateForm();
      await loadRecipes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar receta de "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/restaurant/recipes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error');
      setRecipes(prev => prev.filter(r => r.id !== id));
      setDetailRecipe(null);
    } catch {
      alert('No se pudo eliminar');
    }
  }

  async function openDetail(recipeId: string) {
    setDetailLoading(true);
    setDetailRecipe(null);
    try {
      const res = await fetch(`/api/admin/restaurant/recipes/${recipeId}`);
      if (res.ok) setDetailRecipe(await res.json());
    } catch { /* ignore */ }
    finally { setDetailLoading(false); }
  }

  async function handleAddRecipeItem(e: React.FormEvent) {
    e.preventDefault();
    if (!detailRecipe || !selectedIngredientId || !itemQuantity) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/restaurant/recipes/${detailRecipe.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredientId: selectedIngredientId,
          quantity: parseFloat(itemQuantity),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Error al agregar');
      setSelectedIngredientId('');
      setItemQuantity('');
      // Reload detail
      await openDetail(detailRecipe.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveRecipeItem(recipeItemId: string) {
    if (!detailRecipe) return;
    if (!confirm('¿Quitar este ingrediente de la receta?')) return;
    try {
      const res = await fetch(`/api/admin/restaurant/recipes/${detailRecipe.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeItemId }),
      });
      if (!res.ok) throw new Error('Error');
      await openDetail(detailRecipe.id);
    } catch {
      alert('No se pudo quitar');
    }
  }

  // Available menu items (those without a recipe yet)
  const existingMenuItemIds = new Set(recipes.map(r => r.menuItemId));
  const availableMenuItems = menuItems.filter(mi => !existingMenuItemIds.has(mi.id) && mi.isActive);

  // Available ingredients (those not already in the recipe)
  const existingIngredientIds = detailRecipe
    ? new Set(detailRecipe.recipeItems.map(ri => ri.ingredientId))
    : new Set<string>();
  const availableIngredients = ingredients.filter(
    ing => !existingIngredientIds.has(ing.id) && ing.isActive
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recetas</h1>
          <p className="text-sm text-gray-500 mt-1">
            {recipes.length} recetas registradas
          </p>
        </div>
        <button
          onClick={() => {
            resetCreateForm();
            setShowCreateForm(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nueva receta
        </button>
      </div>

      {/* Create recipe form */}
      {showCreateForm && (
        <form onSubmit={handleCreateRecipe} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Nueva receta</h2>
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ítem del menú</label>
              <select value={selectedMenuItemId} onChange={e => setSelectedMenuItemId(e.target.value)}
                required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">Seleccionar ítem...</option>
                {availableMenuItems.map(mi => (
                  <option key={mi.id} value={mi.id}>{mi.name}</option>
                ))}
              </select>
              {availableMenuItems.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">Todos los ítems activos ya tienen receta.</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Receta base (template)</label>
              <select value={selectedParentId} onChange={e => setSelectedParentId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">Ninguna (receta independiente)</option>
                {recipes.filter(r => r.isTemplate).map(r => (
                  <option key={r.id} value={r.id}>{r.menuItemName}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">Hereda ingredientes del template seleccionado</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Rendimiento (porciones)</label>
              <input type="number" value={yieldQuantity} onChange={e => setYieldQuantity(e.target.value)}
                step="0.5" min="0.5" required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Notas</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                rows={2} placeholder="Notas de preparación, instrucciones, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? 'Guardando...' : 'Crear receta'}
            </button>
            <button type="button" onClick={resetCreateForm}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Recipes list */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Cargando...</p>
        </div>
      ) : recipes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-400 text-lg">No hay recetas registradas</p>
          <p className="text-sm text-gray-400 mt-1">Crea recetas vinculando ítems del menú con ingredientes</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase text-xs tracking-wider">Ítem del menú</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500 uppercase text-xs tracking-wider">Ingredientes</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 uppercase text-xs tracking-wider">Rinde</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500 uppercase text-xs tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recipes.map(recipe => (
                  <tr key={recipe.id} className={`hover:bg-gray-50 ${!recipe.menuItemActive ? 'opacity-50' : ''}`}>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">{recipe.menuItemName}</span>
                      {!recipe.menuItemActive && (
                        <span className="ml-2 text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">Inactivo</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${recipe.ingredientCount > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                        {recipe.ingredientCount} ingredientes
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">{recipe.yieldQuantity} porc.</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/admin/restaurant/recipes/${recipe.id}`}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors">Ver</Link>
                        <button onClick={() => handleDelete(recipe.id, recipe.menuItemName)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recipe detail modal */}
      {detailRecipe && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] overflow-auto">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setDetailRecipe(null); setError(null); }} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{detailRecipe.menuItem?.name ?? <span className="text-gray-400">(sin ítem)</span>}</h2>
                <p className="text-xs text-gray-500">
                  Rinde {detailRecipe.yieldQuantity} porciones
                  {detailRecipe.menuItem?.basePrice ? ` · Precio: ${formatPrice(detailRecipe.menuItem.basePrice / 100)}` : ''}
                </p>
              </div>
              <button onClick={() => { setDetailRecipe(null); setError(null); }}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Notes */}
            {detailRecipe.notes && (
              <div className="px-6 py-3 border-b border-gray-100 bg-amber-50">
                <p className="text-sm text-amber-800">{detailRecipe.notes}</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="px-6 pt-4">
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
              </div>
            )}

            {/* Recipe items */}
            <div className="p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                📋 Ingredientes
                <span className="text-xs text-gray-400 font-normal">
                  ({detailRecipe.recipeItems.length})
                </span>
              </h3>

              {detailRecipe.recipeItems.length === 0 ? (
                <p className="text-sm text-gray-400">No hay ingredientes en esta receta aún.</p>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="text-left py-2 px-3 font-medium text-gray-500 text-xs">Ingrediente</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-500 text-xs">Cantidad</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-500 text-xs">Costo unit.</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-500 text-xs">Subtotal</th>
                        <th className="text-center py-2 px-3 font-medium text-gray-500 text-xs w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {detailRecipe.recipeItems.map(ri => {
                        const lineCost = ri.ingredientCostDisplay * ri.quantity;
                        return (
                          <tr key={ri.id} className="hover:bg-gray-50">
                            <td className="py-2 px-3 font-medium text-gray-900">{ri.ingredientName}</td>
                            <td className="py-2 px-3 text-right text-gray-600">
                              {ri.quantity} {ri.ingredientUnit}
                            </td>
                            <td className="py-2 px-3 text-right text-gray-600">
                              {formatPrice(ri.ingredientCostDisplay)}
                            </td>
                            <td className="py-2 px-3 text-right font-semibold text-gray-900">
                              {formatPrice(lineCost)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button onClick={() => handleRemoveRecipeItem(ri.id)}
                                className="text-xs text-red-400 hover:text-red-600 transition-colors" title="Quitar">
                                ✕
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {detailRecipe.recipeItems.length > 0 && (
                      <tfoot>
                        <tr className="border-t border-gray-200 bg-gray-50">
                          <td colSpan={3} className="py-2 px-3 text-right text-xs font-semibold text-gray-500">
                            Costo total:
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-gray-900">
                            {formatPrice(
                              detailRecipe.recipeItems.reduce(
                                (sum, ri) => sum + ri.ingredientCostDisplay * ri.quantity, 0
                              )
                            )}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}

              {/* Add ingredient form */}
              <div className="border border-dashed border-gray-300 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">+ Agregar ingrediente</h4>
                <form onSubmit={handleAddRecipeItem} className="flex flex-wrap items-end gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs text-gray-500 mb-1">Ingrediente</label>
                    <select value={selectedIngredientId} onChange={e => setSelectedIngredientId(e.target.value)}
                      required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="">Seleccionar...</option>
                      {availableIngredients.map(ing => (
                        <option key={ing.id} value={ing.id}>
                          {ing.name} ({ing.unit} — {formatPrice(ing.costDisplay)})
                        </option>
                      ))}
                    </select>
                    {availableIngredients.length === 0 && ingredients.length > 0 && (
                      <p className="text-xs text-amber-600 mt-1">Todos los ingredientes ya están agregados.</p>
                    )}
                  </div>
                  <div className="w-28">
                    <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
                    <input type="number" value={itemQuantity} onChange={e => setItemQuantity(e.target.value)}
                      step="0.01" min="0.01" required
                      placeholder="0.5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <button type="submit" disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                    {saving ? '...' : 'Agregar'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
