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
  creditLimit: number | null;
  _count: { sessions: number };
  isActive: boolean;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'active' | 'inactive' | 'all'>('active');

  const loadCustomers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (filter !== 'active') params.set('includeInactive', 'true');
    fetch(`/api/admin/restaurant/customers?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        let arr = Array.isArray(data) ? data : [];
        if (filter === 'inactive') arr = arr.filter((c: Customer) => !c.isActive);
        setCustomers(arr);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [search, filter]);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

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

  async function handleCleanupInactive() {
    if (!confirm('¿Eliminar todos los clientes sin actividad (sin sesiones, pagos ni movimientos)? Esta acción no se puede deshacer.')) return;
    try {
      const res = await fetch('/api/admin/restaurant/customers/cleanup', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(`Se eliminaron ${data.deleted} cliente(s) fantasma.`);
        loadCustomers();
      } else {
        alert(data.error || 'Error al limpiar');
      }
    } catch {
      alert('Error de conexión');
    }
  }

  const filterTabs = [
    { key: 'active' as const, label: 'Activos' },
    { key: 'inactive' as const, label: 'Inactivos' },
    { key: 'all' as const, label: 'Todos' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <div className="flex gap-2">
          <button
            onClick={handleCleanupInactive}
            className="px-3 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors"
          >
            🧹 Limpiar inactivos
          </button>
          <Link
            href="/admin/restaurant/customers/nuevo"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Nuevo cliente
          </Link>
        </div>
      </div>

      {/* Búsqueda + filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o teléfono..."
            className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {filterTabs.map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Cargando...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-400 text-lg">No hay clientes</p>
          <Link href="/admin/restaurant/customers/nuevo" className="inline-block mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium">
            + Agregar primer cliente →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map(c => (
            <div key={c.id} className={`rounded-xl border shadow-sm hover:shadow-md transition-shadow flex flex-col ${c.isActive ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-80'}`}>
              <Link href={`/admin/restaurant/customers/${c.id}`} className="block p-5 pb-3 flex-1">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 ${c.isActive ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'}`}>
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`font-semibold truncate ${c.isActive ? 'text-gray-900' : 'text-gray-500'}`}>{c.name}</p>
                    {c.email && <p className="text-xs text-gray-400 truncate">{c.email}</p>}
                    {c.phone && <p className="text-xs text-gray-400 truncate">{c.phone}</p>}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Saldo</p>
                    <p className={`font-bold text-sm ${c.balance > 0 ? 'text-red-600' : c.balance < 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      {c.balance > 0 ? `Debe $${c.balance.toFixed(2)}` : c.balance < 0 ? `Crédito $${Math.abs(c.balance).toFixed(2)}` : '$0.00'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Visitas</p>
                    <p className="font-medium text-sm text-gray-700">{c._count.sessions}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                    {c.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                  {c.hasCredit && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">📋 Crédito</span>
                  )}
                  {c.hasCredit && c.creditLimit != null && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700">Tope ${(c.creditLimit / 100).toFixed(0)}</span>
                  )}
                </div>
              </Link>

              {/* Acciones (fila inferior, sin encimar) */}
              <div className="px-3 py-2.5 border-t border-gray-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleCredit(c.id, c.name, c.hasCredit)}
                  disabled={toggling === c.id}
                  className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-lg border transition-all disabled:opacity-50 ${
                    c.hasCredit
                      ? 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-red-50 hover:border-red-200 hover:text-red-500'
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600'
                  }`}
                >
                  {toggling === c.id ? '⋯' : c.hasCredit ? 'Quitar crédito' : 'Dar crédito'}
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleActive(c.id, c.name, c.isActive)}
                  disabled={toggling === c.id}
                  className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-lg border transition-all disabled:opacity-50 ${
                    c.isActive
                      ? 'bg-white border-gray-200 text-gray-500 hover:bg-red-50 hover:border-red-200 hover:text-red-500'
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-green-50 hover:border-green-200 hover:text-green-600'
                  }`}
                >
                  {toggling === c.id ? '⋯' : c.isActive ? 'Desactivar' : 'Reactivar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
