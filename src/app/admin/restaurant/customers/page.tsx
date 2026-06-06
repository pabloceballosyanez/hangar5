'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  balance: number;
  hasCredit: boolean;
  _count: { sessions: number };
  isActive: boolean;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const loadCustomers = useCallback(() => {
    fetch('/api/admin/restaurant/customers?includeInactive=true')
      .then(r => r.json())
      .then(data => { setCustomers(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  async function handleToggleActive(customerId: string, name: string, currentlyActive: boolean) {
    const action = currentlyActive ? 'desactivar' : 'reactivar';
    if (!confirm(`¿${action === 'desactivar' ? 'Desactivar' : 'Reactivar'} a ${name}? ${currentlyActive ? 'No aparecerá en búsquedas del mesero pero su historial se conserva.' : 'Volverá a estar disponible en búsquedas.'}`)) return;
    setToggling(customerId);
    try {
      const res = await fetch(`/api/admin/restaurant/customers/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentlyActive }),
      });
      if (!res.ok) throw new Error('Error');
      setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, isActive: !currentlyActive } : c));
    } catch {
      alert('No se pudo completar la acción');
    } finally {
      setToggling(null);
    }
  }

  async function handleToggleCredit(customerId: string, name: string, hasCredit: boolean) {
    if (!confirm(`¿${hasCredit ? 'Quitar' : 'Dar'} crédito a ${name}? ${hasCredit ? 'Ya no podrá cargar a su cuenta.' : 'Podrá pagar con cargo a su cuenta en pedidos online.'}`)) return;
    setToggling(customerId);
    try {
      const res = await fetch(`/api/admin/restaurant/customers/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hasCredit: !hasCredit }),
      });
      if (!res.ok) throw new Error('Error');
      setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, hasCredit: !hasCredit } : c));
    } catch {
      alert('No se pudo completar la acción');
    } finally {
      setToggling(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <Link
          href="/admin/restaurant/customers/nuevo"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nuevo cliente
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Cargando...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-400 text-lg">No hay clientes registrados</p>
          <Link href="/admin/restaurant/customers/nuevo" className="inline-block mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium">
            + Agregar primer cliente →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map(c => (
            <div key={c.id} className={`relative rounded-xl shadow-sm border hover:shadow-md transition-shadow ${c.isActive ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-75'}`}>
              <Link
                href={`/admin/restaurant/customers/${c.id}`}
                className="block p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${c.isActive ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'}`}>
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className={`font-semibold transition-colors ${c.isActive ? 'text-gray-900' : 'text-gray-500'}`}>{c.name}</p>
                      {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Visitas</span>
                    <span className="font-medium text-gray-700">{c._count.sessions}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Saldo</span>
                    <span className={`font-bold ${c.balance > 0 ? 'text-red-600' : c.balance < 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      {c.balance > 0 ? `Debe $${c.balance.toFixed(2)}` : c.balance < 0 ? `Crédito $${Math.abs(c.balance).toFixed(2)}` : '$0.00'}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                  <div className="flex gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                      {c.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                    {c.hasCredit && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">📋 Crédito</span>
                    )}
                  </div>
                  <span className="text-gray-300 group-hover:text-gray-400 transition-colors text-sm">
                    Ver →
                  </span>
                </div>
              </Link>
              {/* Toggle credit button */}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleCredit(c.id, c.name, c.hasCredit); }}
                disabled={toggling === c.id}
                className={`absolute top-3 right-3 z-10 px-2 py-1 text-xs font-medium rounded-lg border transition-all disabled:opacity-50 shadow-sm ${
                  c.hasCredit
                    ? 'bg-amber-50 border-amber-200 text-amber-600 hover:text-red-500 hover:border-red-300 hover:bg-red-50'
                    : 'bg-white border-gray-200 text-gray-400 hover:text-amber-500 hover:border-amber-300 hover:bg-amber-50'
                }`}
                title={c.hasCredit ? 'Quitar crédito' : 'Dar crédito'}
              >
                {toggling === c.id ? '⋯' : c.hasCredit ? '📋 Quitar crédito' : '📋 Dar crédito'}
              </button>
              {/* Toggle active/inactive button */}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleActive(c.id, c.name, c.isActive); }}
                disabled={toggling === c.id}
                className={`absolute top-3 right-3 z-10 px-2 py-1 text-xs font-medium rounded-lg border transition-all disabled:opacity-50 shadow-sm ${
                  c.isActive
                    ? 'bg-white border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-300 hover:bg-red-50'
                    : 'bg-white border-gray-200 text-gray-400 hover:text-green-500 hover:border-green-300 hover:bg-green-50'
                }`}
                title={c.isActive ? 'Desactivar cliente' : 'Reactivar cliente'}
              >
                {toggling === c.id ? '⋯' : c.isActive ? '✕ Desactivar' : '↻ Reactivar'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
