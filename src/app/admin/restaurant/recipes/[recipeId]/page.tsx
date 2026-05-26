'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface RecipeItem {
  id: string;
  recipeId: string;
  ingredientId: string;
  ingredientName: string;
  ingredientUnit: string;
  ingredientCost: number;
  ingredientCostDisplay: number;
  quantity: number;
}

interface Recipe {
  id: string;
  menuItemId: string;
  yieldQuantity: number;
  notes: string | null;
  menuItem: { id: string; name: string; basePrice: number; isActive: boolean };
  recipeItems: RecipeItem[];
}

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  costDisplay: number;
  currentStock: number;
}

function fmtMXN(pesos: number) { return `$${pesos.toFixed(2)}`; }

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const recipeId = params.recipeId as string;

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit recipe form
  const [yieldQty, setYieldQty] = useState<number>(1);
  const [notes, setNotes] = useState('');

  // Add ingredient form
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [quantity, setQuantity] = useState('');

  const load = useCallback(async () => {
    try {
      const [recRes, ingRes] = await Promise.all([
        fetch(`/api/admin/restaurant/recipes/${recipeId}`),
        fetch('/api/admin/restaurant/ingredients'),
      ]);
      if (recRes.ok) {
        const data = await recRes.json();
        setRecipe(data);
        setYieldQty(data.yieldQuantity);
        setNotes(data.notes || '');
      }
      if (ingRes.ok) setIngredients(await ingRes.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [recipeId]);

  useEffect(() => { load(); }, [load]);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/restaurant/recipes/${recipeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yieldQuantity: yieldQty, notes: notes.trim() || null }),
      });
      if (!res.ok) throw new Error('Error');
      await load();
    } catch { setError('Error al actualizar'); }
    finally { setSaving(false); }
  }

  async function handleAddIngredient(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedIngredientId || !quantity) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/restaurant/recipes/${recipeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredientId: selectedIngredientId, quantity: parseFloat(quantity) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setSelectedIngredientId('');
      setQuantity('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally { setSaving(false); }
  }

  async function handleRemoveItem(itemId: string) {
    if (!confirm('¿Quitar este ingrediente de la receta?')) return;
    try {
      const res = await fetch(`/api/admin/restaurant/recipes/${recipeId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeItemId: itemId }),
      });
      if (!res.ok) throw new Error('Error');
      await load();
    } catch { alert('No se pudo eliminar'); }
  }

  if (loading) return <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" /><p className="text-gray-500">Cargando...</p></div>;
  if (!recipe) return <div className="text-center py-12"><p className="text-gray-500">Receta no encontrada</p><Link href="/admin/restaurant/recipes" className="text-blue-600 text-sm">← Volver</Link></div>;

  // Calculate total cost
  const totalCostCents = recipe.recipeItems.reduce((sum, ri) => sum + ri.ingredientCost * ri.quantity, 0);
  const totalCost = totalCostCents / 100;
  const costPerUnit = recipe.yieldQuantity > 0 ? totalCost / recipe.yieldQuantity : 0;
  const margin = recipe.menuItem.basePrice > 0 ? ((recipe.menuItem.basePrice - costPerUnit) / recipe.menuItem.basePrice * 100).toFixed(1) : '—';

  // Filter ingredients not already in recipe
  const usedIds = new Set(recipe.recipeItems.map(ri => ri.ingredientId));
  const availableIngredients = ingredients.filter(i => !usedIds.has(i.id) && i.currentStock > 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/admin/restaurant/recipes" className="text-sm text-gray-500 hover:text-gray-700">← Volver a recetas</Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-2xl font-bold text-gray-900">{recipe.menuItem.name}</h1>
          {!recipe.menuItem.isActive && <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">Inactivo</span>}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Precio menú: {fmtMXN(recipe.menuItem.basePrice)} · Rinde {recipe.yieldQuantity} porción(es)
        </p>
      </div>

      {/* Cost summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Costo total</p>
          <p className="text-2xl font-bold mt-1 text-gray-900">{fmtMXN(totalCost)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Costo por porción</p>
          <p className="text-2xl font-bold mt-1 text-gray-900">{fmtMXN(costPerUnit)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Margen estimado</p>
          <p className={`text-2xl font-bold mt-1 ${margin !== '—' && Number(margin) > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {margin !== '—' ? `${margin}%` : '—'}
          </p>
        </div>
      </div>

      {/* Edit recipe fields */}
      <form onSubmit={handleUpdate} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
        <h2 className="font-semibold text-gray-900 text-sm">Detalles de receta</h2>
        {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Porciones que rinde</label>
            <input type="number" value={yieldQty} onChange={e => setYieldQty(Number(e.target.value))} min={1}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Notas</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ej: Preparación, variaciones..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>
        <button type="submit" disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </form>

      {/* Ingredients list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Ingredientes ({recipe.recipeItems.length})</h2>
        </div>
        {recipe.recipeItems.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">Sin ingredientes — agrega abajo</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left py-2 px-4 font-medium text-gray-500 text-xs">Ingrediente</th>
                <th className="text-left py-2 px-4 font-medium text-gray-500 text-xs">Unidad</th>
                <th className="text-right py-2 px-4 font-medium text-gray-500 text-xs">Cantidad</th>
                <th className="text-right py-2 px-4 font-medium text-gray-500 text-xs">Costo unit.</th>
                <th className="text-right py-2 px-4 font-medium text-gray-500 text-xs">Subtotal</th>
                <th className="text-center py-2 px-4 font-medium text-gray-500 text-xs w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recipe.recipeItems.map(ri => (
                <tr key={ri.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 font-medium text-gray-900">{ri.ingredientName}</td>
                  <td className="py-2 px-4 text-gray-500">{ri.ingredientUnit}</td>
                  <td className="py-2 px-4 text-right text-gray-900">{ri.quantity}</td>
                  <td className="py-2 px-4 text-right text-gray-600">{fmtMXN(ri.ingredientCostDisplay)}</td>
                  <td className="py-2 px-4 text-right font-semibold text-gray-900">{fmtMXN((ri.ingredientCost * ri.quantity) / 100)}</td>
                  <td className="py-2 px-4 text-center">
                    <button onClick={() => handleRemoveItem(ri.id)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add ingredient form */}
      <form onSubmit={handleAddIngredient} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Agregar ingrediente</h2>
        {availableIngredients.length === 0 ? (
          <p className="text-sm text-gray-400">Todos los ingredientes disponibles ya están en la receta.</p>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-gray-500 mb-1">Ingrediente</label>
              <select value={selectedIngredientId} onChange={e => setSelectedIngredientId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">Seleccionar...</option>
                {availableIngredients.map(i => (
                  <option key={i.id} value={i.id}>{i.name} ({i.unit}) — {fmtMXN(i.costDisplay)}</option>
                ))}
              </select>
            </div>
            <div className="w-32">
              <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
              <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)}
                step="0.01" min="0.01" placeholder="1.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <button type="submit" disabled={saving || !selectedIngredientId || !quantity}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? '...' : '+ Agregar'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
