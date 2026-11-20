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
  RENT: 'bg-[var(--color-adp-info)] text-white',
  UTILITIES: 'bg-[var(--color-adp-atencion)] text-white',
  SERVICES: 'bg-[var(--color-adp-info)] text-white',
  OTHER: 'bg-[var(--color-adp-papel-3)] text-[var(--color-adp-tinta)]',
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
          <h1 className="text-2xl font-bold text-[var(--color-adp-tinta)]">Gastos Fijos</h1>
          <p className="text-sm text-[var(--color-adp-tinta-2)] mt-1">
            Total mensual: <span className="font-bold text-[var(--color-adp-tinta)]">{formatPrice(monthlyTotal)}</span>
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2 bg-[var(--color-adp-pino)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-adp-pino-hondo)] transition-colors"
        >
          + Nuevo gasto
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-[var(--color-adp-borde)] p-5 space-y-4">
          <h2 className="font-semibold text-[var(--color-adp-tinta)]">{editId ? 'Editar gasto' : 'Nuevo gasto fijo'}</h2>
          {error && <p className="text-sm text-white bg-[var(--color-adp-urgente)] p-3 rounded-lg">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[var(--color-adp-tinta-2)] mb-1">Descripción</label>
              <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Ej: Renta del local" required autoFocus
                className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-[var(--color-adp-tinta-2)] mb-1">Monto mensual (MXN)</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                step="0.01" min="0" required
                className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-[var(--color-adp-tinta-2)] mb-1">Categoría</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none">
                {Object.entries(categoryLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--color-adp-borde-2)] text-[var(--color-adp-pino)] focus:ring-[var(--color-adp-pino)]/40" />
                <span className="text-sm text-[var(--color-adp-tinta)]">Activo</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-[var(--color-adp-pino)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-adp-pino-hondo)] disabled:opacity-50">
              {saving ? 'Guardando...' : editId ? 'Actualizar' : 'Crear gasto'}
            </button>
            <button type="button" onClick={resetForm}
              className="px-4 py-2 bg-[var(--color-adp-papel-3)] text-[var(--color-adp-tinta)] text-sm font-medium rounded-lg hover:bg-[var(--color-adp-borde)]">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Expenses list */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-adp-info)] mx-auto mb-4" />
          <p className="text-[var(--color-adp-tinta-2)]">Cargando...</p>
        </div>
      ) : expenses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-[var(--color-adp-borde)] p-8 text-center">
          <p className="text-[var(--color-adp-tinta-2)] text-lg">No hay gastos fijos registrados</p>
          <p className="text-sm text-[var(--color-adp-tinta-2)] mt-1">Agrega renta, servicios, mantenimiento, etc.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active */}
          {activeExpenses.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-adp-tinta-2)] uppercase tracking-wider mb-3">Activos</h2>
              <div className="bg-white rounded-xl shadow-sm border border-[var(--color-adp-borde)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-adp-borde)] bg-[var(--color-adp-papel-3)]">
                      <th className="text-left py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs tracking-wider">Descripción</th>
                      <th className="text-left py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs tracking-wider">Categoría</th>
                      <th className="text-right py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs tracking-wider">Monto/mes</th>
                      <th className="text-center py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-adp-borde)]">
                    {activeExpenses.map(e => (
                      <tr key={e.id} className="hover:bg-[var(--color-adp-papel-3)]">
                        <td className="py-3 px-4 font-medium text-[var(--color-adp-tinta)]">{e.description}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[e.category] || 'bg-[var(--color-adp-papel-3)]'}`}>
                            {categoryLabels[e.category] || e.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-[var(--color-adp-tinta)]">{formatPrice(e.amountDisplay)}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => startEdit(e)}
                              className="text-xs text-[var(--color-adp-pino)] hover:text-[var(--color-adp-info)] font-medium">Editar</button>
                            <button onClick={() => handleDelete(e.id, e.description)}
                              className="text-xs text-[var(--color-adp-urgente)] hover:text-[var(--color-adp-urgente)] font-medium">Eliminar</button>
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
              <h2 className="text-sm font-semibold text-[var(--color-adp-tinta-2)] uppercase tracking-wider mb-3">Inactivos</h2>
              <div className="bg-white rounded-xl shadow-sm border border-[var(--color-adp-borde)] overflow-hidden opacity-60">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-[var(--color-adp-borde)]">
                    {inactiveExpenses.map(e => (
                      <tr key={e.id} className="hover:bg-[var(--color-adp-papel-3)]">
                        <td className="py-3 px-4 font-medium text-[var(--color-adp-tinta-2)]">{e.description}</td>
                        <td className="py-3 px-4">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-[var(--color-adp-papel-3)] text-[var(--color-adp-tinta-2)]">
                            {categoryLabels[e.category] || e.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-[var(--color-adp-tinta-2)]">{formatPrice(e.amountDisplay)}</td>
                        <td className="py-3 px-4 text-center">
                          <button onClick={() => startEdit(e)}
                            className="text-xs text-[var(--color-adp-info)] hover:text-[var(--color-adp-pino-hondo)] font-medium">Reactivar</button>
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
