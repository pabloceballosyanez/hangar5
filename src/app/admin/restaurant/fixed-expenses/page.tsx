'use client';

import { useState, useEffect, useCallback } from 'react';

interface FixedExpense {
  id: string;
  description: string;
  amount: number;
  category: string;
  isActive: boolean;
  amountDisplay: number;
  createdAt: string;
}

const categoryLabels: Record<string, string> = {
  RENT: '🏠 Renta',
  UTILITIES: '💡 Servicios',
  SERVICES: '🔧 Mantenimiento',
  OTHER: '📦 Otros',
};

const categoryColors: Record<string, string> = {
  RENT: 'bg-purple-100 text-purple-700',
  UTILITIES: 'bg-amber-100 text-amber-700',
  SERVICES: 'bg-blue-100 text-blue-700',
  OTHER: 'bg-gray-100 text-gray-700',
};

function formatPrice(pesos: number) {
  return pesos.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export default function FixedExpensesPage() {
  const [expenses, setExpenses] = useState<FixedExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('OTHER');
  const [isActive, setIsActive] = useState(true);

  const loadExpenses = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/restaurant/fixed-expenses');
      if (res.ok) setExpenses(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadExpenses(); }, [loadExpenses]);

  function resetForm() {
    setDescription('');
    setAmount('');
    setCategory('OTHER');
    setIsActive(true);
    setEditId(null);
    setShowForm(false);
    setError(null);
  }

  function startEdit(e: FixedExpense) {
    setEditId(e.id);
    setDescription(e.description);
    setAmount(e.amountDisplay.toString());
    setCategory(e.category);
    setIsActive(e.isActive);
    setShowForm(true);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() || !amount) return;
    setSaving(true);
    setError(null);
    try {
      const body = {
        description: description.trim(),
        amount: Math.round(parseFloat(amount) * 100),
        category,
        isActive,
      };
      const url = editId
        ? `/api/admin/restaurant/fixed-expenses/${editId}`
        : '/api/admin/restaurant/fixed-expenses';
      const res = await fetch(url, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Error al guardar');
      resetForm();
      await loadExpenses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, desc: string) {
    if (!confirm(`¿Eliminar gasto "${desc}"?`)) return;
    try {
      const res = await fetch(`/api/admin/restaurant/fixed-expenses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error');
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch {
      alert('No se pudo eliminar');
    }
  }

  const activeExpenses = expenses.filter(e => e.isActive);
  const inactiveExpenses = expenses.filter(e => !e.isActive);
  const monthlyTotal = activeExpenses.reduce((sum, e) => sum + e.amountDisplay, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gastos Fijos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Total mensual: <span className="font-bold text-gray-900">{formatPrice(monthlyTotal)}</span>
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nuevo gasto
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">{editId ? 'Editar gasto' : 'Nuevo gasto fijo'}</h2>
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Descripción</label>
              <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Ej: Renta del local" required autoFocus
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Monto mensual (MXN)</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                step="0.01" min="0" required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Categoría</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                {Object.entries(categoryLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-700">Activo</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Guardando...' : editId ? 'Actualizar' : 'Crear gasto'}
            </button>
            <button type="button" onClick={resetForm}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Expenses list */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Cargando...</p>
        </div>
      ) : expenses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-400 text-lg">No hay gastos fijos registrados</p>
          <p className="text-sm text-gray-400 mt-1">Agrega renta, servicios, mantenimiento, etc.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active */}
          {activeExpenses.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Activos</h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase text-xs tracking-wider">Descripción</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase text-xs tracking-wider">Categoría</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500 uppercase text-xs tracking-wider">Monto/mes</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-500 uppercase text-xs tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {activeExpenses.map(e => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{e.description}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[e.category] || 'bg-gray-100'}`}>
                            {categoryLabels[e.category] || e.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900">{formatPrice(e.amountDisplay)}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => startEdit(e)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium">Editar</button>
                            <button onClick={() => handleDelete(e.id, e.description)}
                              className="text-xs text-red-500 hover:text-red-700 font-medium">Eliminar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Inactive */}
          {inactiveExpenses.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Inactivos</h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden opacity-60">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-50">
                    {inactiveExpenses.map(e => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-500">{e.description}</td>
                        <td className="py-3 px-4">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">
                            {categoryLabels[e.category] || e.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-400">{formatPrice(e.amountDisplay)}</td>
                        <td className="py-3 px-4 text-center">
                          <button onClick={() => startEdit(e)}
                            className="text-xs text-blue-500 hover:text-blue-700 font-medium">Reactivar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
