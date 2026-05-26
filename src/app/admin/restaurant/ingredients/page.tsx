'use client';

import { useState, useEffect, useCallback } from 'react';

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;
  cost: number;
  costDisplay: number;
  isActive: boolean;
  recipeUsageCount: number;
  createdAt: string;
  updatedAt: string;
}

function formatPrice(pesos: number) {
  return pesos.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [minStock, setMinStock] = useState('');
  const [cost, setCost] = useState('');

  const loadIngredients = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/restaurant/ingredients');
      if (res.ok) setIngredients(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadIngredients(); }, [loadIngredients]);

  function resetForm() {
    setName('');
    setUnit('');
    setCurrentStock('0');
    setMinStock('0');
    setCost('');
    setEditId(null);
    setShowForm(false);
    setError(null);
  }

  function startEdit(ing: Ingredient) {
    setEditId(ing.id);
    setName(ing.name);
    setUnit(ing.unit);
    setCurrentStock(ing.currentStock.toString());
    setMinStock(ing.minStock.toString());
    setCost(ing.costDisplay.toString());
    setShowForm(true);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !unit.trim() || !cost) return;
    setSaving(true);
    setError(null);
    try {
      const body = {
        name: name.trim(),
        unit: unit.trim(),
        currentStock: parseFloat(currentStock) || 0,
        minStock: parseFloat(minStock) || 0,
        cost: Math.round(parseFloat(cost) * 100),
      };
      const url = editId
        ? `/api/admin/restaurant/ingredients/${editId}`
        : '/api/admin/restaurant/ingredients';
      const res = await fetch(url, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Error al guardar');
      }
      resetForm();
      await loadIngredients();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar ingrediente "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/restaurant/ingredients/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Error al eliminar');
      setIngredients(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo eliminar');
    }
  }

  async function toggleActive(ing: Ingredient) {
    try {
      const res = await fetch(`/api/admin/restaurant/ingredients/${ing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !ing.isActive }),
      });
      if (res.ok) await loadIngredients();
    } catch { /* ignore */ }
  }

  const activeIngredients = ingredients.filter(i => i.isActive);
  const inactiveIngredients = ingredients.filter(i => !i.isActive);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeIngredients.length} ingredientes activos
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nuevo ingrediente
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">{editId ? 'Editar ingrediente' : 'Nuevo ingrediente'}</h2>
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nombre</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Ej: Harina de trigo" required autoFocus
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Unidad</label>
              <input type="text" value={unit} onChange={e => setUnit(e.target.value)}
                placeholder="Ej: kg, L, pza" required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Costo unitario (MXN)</label>
              <input type="number" value={cost} onChange={e => setCost(e.target.value)}
                step="0.01" min="0" required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Stock actual</label>
              <input type="number" value={currentStock} onChange={e => setCurrentStock(e.target.value)}
                step="0.01" min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Stock mínimo</label>
              <input type="number" value={minStock} onChange={e => setMinStock(e.target.value)}
                step="0.01" min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? 'Guardando...' : editId ? 'Actualizar' : 'Crear ingrediente'}
            </button>
            <button type="button" onClick={resetForm}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Ingredients list */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Cargando...</p>
        </div>
      ) : ingredients.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-400 text-lg">No hay ingredientes registrados</p>
          <p className="text-sm text-gray-400 mt-1">Agrega ingredientes para empezar a crear recetas</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active */}
          {activeIngredients.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Activos</h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase text-xs tracking-wider">Nombre</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase text-xs tracking-wider">Unidad</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-500 uppercase text-xs tracking-wider">Stock</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-500 uppercase text-xs tracking-wider">Mínimo</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-500 uppercase text-xs tracking-wider">Costo</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-500 uppercase text-xs tracking-wider">Recetas</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-500 uppercase text-xs tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {activeIngredients.map(ing => {
                        const isLowStock = ing.currentStock <= ing.minStock;
                        return (
                          <tr key={ing.id} className={`hover:bg-gray-50 ${isLowStock ? 'bg-red-50' : ''}`}>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{ing.name}</span>
                                {isLowStock && (
                                  <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                                    Bajo
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-600">{ing.unit}</td>
                            <td className={`py-3 px-4 text-right font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                              {ing.currentStock}
                            </td>
                            <td className="py-3 px-4 text-right text-gray-600">{ing.minStock}</td>
                            <td className="py-3 px-4 text-right text-gray-900">{formatPrice(ing.costDisplay)}</td>
                            <td className="py-3 px-4 text-center text-gray-500">{ing.recipeUsageCount}</td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => startEdit(ing)}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors">Editar</button>
                                <button onClick={() => toggleActive(ing)}
                                  className="text-xs text-gray-500 hover:text-gray-700 font-medium transition-colors">Desactivar</button>
                                <button onClick={() => handleDelete(ing.id, ing.name)}
                                  className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors">Eliminar</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Inactive */}
          {inactiveIngredients.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Inactivos</h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden opacity-60">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-50">
                      {inactiveIngredients.map(ing => (
                        <tr key={ing.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-500">{ing.name}</td>
                          <td className="py-3 px-4 text-gray-400">{ing.unit}</td>
                          <td className="py-3 px-4 text-right text-gray-400">{ing.currentStock}</td>
                          <td className="py-3 px-4 text-right text-gray-400">{ing.minStock}</td>
                          <td className="py-3 px-4 text-right text-gray-400">{formatPrice(ing.costDisplay)}</td>
                          <td className="py-3 px-4 text-center text-gray-400">{ing.recipeUsageCount}</td>
                          <td className="py-3 px-4 text-center">
                            <button onClick={() => toggleActive(ing)}
                              className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors">Reactivar</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
