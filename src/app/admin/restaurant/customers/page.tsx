'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  balance: number;
  _count: { sessions: number };
  isActive: boolean;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadCustomers = useCallback(() => {
    fetch('/api/admin/restaurant/customers')
      .then(r => r.json())
      .then(data => { setCustomers(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  async function handleDelete(customerId: string, name: string) {
    if (!confirm(`¿Eliminar a ${name}? Los ingresos registrados se conservan. Se borrarán sus movimientos contables.`)) return;
    setDeleting(customerId);
    try {
      const res = await fetch(`/api/admin/restaurant/customers/${customerId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || 'Error del servidor');
      }
      setCustomers(prev => prev.filter(c => c.id !== customerId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo eliminar el cliente');
    } finally {
      setDeleting(null);
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
            <div key={c.id} className="relative bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <Link
                href={`/admin/restaurant/customers/${c.id}`}
                className="block p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{c.name}</p>
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
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                  <span className="text-gray-300 group-hover:text-gray-400 transition-colors text-sm">
                    Ver →
                  </span>
                </div>
              </Link>
              {/* Delete button always visible, outside Link */}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(c.id, c.name); }}
                disabled={deleting === c.id}
                className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-300 hover:bg-red-50 transition-all text-xs disabled:opacity-50 shadow-sm"
                title="Eliminar cliente"
              >
                {deleting === c.id ? '⋯' : '✕'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
