'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface StockMovement {
  id: string;
  ingredientId: string;
  delta: number;
  reason: string;
  notes: string | null;
  createdAt: string;
}

interface IngredientDetail {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;
  cost: number;
  costDisplay: number;
  isActive: boolean;
  recipeUsageCount: number;
  stockMovements: StockMovement[];
  createdAt: string;
  updatedAt: string;
}

function formatPrice(pesos: number) {
  return pesos.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function IngredientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ingredientId = params.ingredientId as string;

  const [ingredient, setIngredient] = useState<IngredientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stock adjustment form
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState('');
  const [movementNotes, setMovementNotes] = useState('');

  // Edit form
  const [editName, setEditName] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editCurrentStock, setEditCurrentStock] = useState('');
  const [editMinStock, setEditMinStock] = useState('');
  const [editCost, setEditCost] = useState('');
  const [showEditForm, setShowEditForm] = useState(false);

  const loadIngredient = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/restaurant/ingredients/${ingredientId}`);
      if (res.ok) {
        const data = await res.json();
        setIngredient(data);
        setEditName(data.name);
        setEditUnit(data.unit);
        setEditCurrentStock(data.currentStock.toString());
        setEditMinStock(data.minStock.toString());
        setEditCost(data.costDisplay.toString());
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [ingredientId]);

  useEffect(() => { loadIngredient(); }, [loadIngredient]);

  async function handleStockAdjustment(e: React.FormEvent) {
    e.preventDefault();
    if (!delta || !reason.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/restaurant/stock-movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredientId,
          delta: parseFloat(delta),
          reason: reason.trim(),
          notes: movementNotes.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Error al ajustar stock');
      setDelta('');
      setReason('');
      setMovementNotes('');
      await loadIngredient();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editName.trim() || !editUnit.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/restaurant/ingredients/${ingredientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          unit: editUnit.trim(),
          currentStock: parseFloat(editCurrentStock) || 0,
          minStock: parseFloat(editMinStock) || 0,
          cost: Math.round(parseFloat(editCost) * 100),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Error al actualizar');
      setShowEditForm(false);
      await loadIngredient();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!ingredient) return;
    if (!confirm(`¿Eliminar "${ingredient.name}" permanentemente?`)) return;
    try {
      const res = await fetch(`/api/admin/restaurant/ingredients/${ingredientId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Error');
      router.push('/admin/restaurant/ingredients');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo eliminar');
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (!ingredient) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Ingrediente no encontrado</p>
        <button onClick={() => router.push('/admin/restaurant/ingredients')}
          className="mt-4 text-sm text-blue-600 hover:text-blue-800">
          ← Volver al inventario
        </button>
      </div>
    );
  }

  const isLowStock = ingredient.currentStock <= ingredient.minStock;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <button onClick={() => router.push('/admin/restaurant/ingredients')}
        className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
        ← Volver al inventario
      </button>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{ingredient.name}</h1>
            {isLowStock && (
              <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-semibold">
                Stock bajo
              </span>
            )}
            {!ingredient.isActive && (
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full font-medium">
                Inactivo
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {ingredient.recipeUsageCount} receta(s) usan este ingrediente
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowEditForm(!showEditForm)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            {showEditForm ? 'Cancelar edición' : '✏️ Editar'}
          </button>
          {ingredient.recipeUsageCount === 0 && (
            <button onClick={handleDelete}
              className="px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 border border-red-200 transition-colors">
              🗑 Eliminar
            </button>
          )}
        </div>
      </div>

      {/* Edit form */}
      {showEditForm && (
        <form onSubmit={handleUpdate} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Editar ingrediente</h2>
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nombre</label>
              <input type="text" value={editName} onChange={e => setEditName(e.target.value)} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Unidad</label>
              <input type="text" value={editUnit} onChange={e => setEditUnit(e.target.value)} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Costo unitario (MXN)</label>
              <input type="number" value={editCost} onChange={e => setEditCost(e.target.value)}
                step="0.01" min="0" required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Stock actual</label>
              <input type="number" value={editCurrentStock} onChange={e => setEditCurrentStock(e.target.value)}
                step="0.01" min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Stock mínimo</label>
              <input type="number" value={editMinStock} onChange={e => setEditMinStock(e.target.value)}
                step="0.01" min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? 'Guardando...' : 'Actualizar'}
            </button>
            <button type="button" onClick={() => { setShowEditForm(false); setError(null); }}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Stock actual</p>
          <p className={`text-2xl font-bold mt-1 ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
            {ingredient.currentStock}
          </p>
          <p className="text-xs text-gray-400">{ingredient.unit}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Stock mínimo</p>
          <p className="text-2xl font-bold mt-1 text-gray-900">{ingredient.minStock}</p>
          <p className="text-xs text-gray-400">{ingredient.unit}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Costo unitario</p>
          <p className="text-2xl font-bold mt-1 text-gray-900">{formatPrice(ingredient.costDisplay)}</p>
          <p className="text-xs text-gray-400">por {ingredient.unit}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Recetas</p>
          <p className="text-2xl font-bold mt-1 text-gray-900">{ingredient.recipeUsageCount}</p>
          <p className="text-xs text-gray-400">usos</p>
        </div>
      </div>

      {/* Stock adjustment */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Ajustar stock</h2>
        {error && !showEditForm && (
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-4">{error}</p>
        )}
        <form onSubmit={handleStockAdjustment} className="flex flex-wrap items-end gap-3">
          <div className="w-28">
            <label className="block text-xs text-gray-500 mb-1">Ajuste (+/-)</label>
            <input type="number" value={delta} onChange={e => setDelta(e.target.value)}
              step="0.01" required
              placeholder="-2.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs text-gray-500 mb-1">Motivo</label>
            <select value={reason} onChange={e => setReason(e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Seleccionar...</option>
              <option value="COMPRA">Compra / Reposición</option>
              <option value="MERMA">Merma / Desperdicio</option>
              <option value="USO">Uso en cocina</option>
              <option value="DEVOLUCION">Devolución</option>
              <option value="INVENTARIO">Ajuste de inventario</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs text-gray-500 mb-1">Notas (opcional)</label>
            <input type="text" value={movementNotes} onChange={e => setMovementNotes(e.target.value)}
              placeholder="Detalle del ajuste"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <button type="submit" disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? '...' : 'Ajustar'}
          </button>
        </form>
      </div>

      {/* Stock movements history */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Historial de movimientos</h2>
        </div>
        {ingredient.stockMovements.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-gray-400">Sin movimientos registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left py-2 px-4 font-medium text-gray-500 text-xs">Fecha</th>
                  <th className="text-right py-2 px-4 font-medium text-gray-500 text-xs">Ajuste</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-500 text-xs">Motivo</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-500 text-xs">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ingredient.stockMovements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 text-gray-600 whitespace-nowrap">{formatDate(mov.createdAt)}</td>
                    <td className={`py-2 px-4 text-right font-semibold whitespace-nowrap ${mov.delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {mov.delta > 0 ? '+' : ''}{mov.delta}
                    </td>
                    <td className="py-2 px-4">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
                        {mov.reason}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-gray-500 max-w-[200px] truncate">{mov.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
