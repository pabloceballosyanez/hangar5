'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Session {
  id: string;
  type: string;
  label: string;
  status: string;
  openedAt: string;
  closedAt: string | null;
  table: { number: string; name: string | null; location: string | null } | null;
  customer: { id: string; name: string; phone: string | null } | null;
  orders: { id: string; status: string; total: number }[];
  payments: { id: string; amount: number; method: string; status: string }[];
}

function formatPrice(pesos: number) {
  return `$${pesos.toFixed(2)}`;
}

const typeLabel: Record<string, string> = {
  TABLE: 'Mesa',
  TAB: 'Tab',
  WALKIN: 'Walk-in',
};

const typeIcon: Record<string, string> = {
  TABLE: '🪑',
  TAB: '👤',
  WALKIN: '🚶',
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filter, setFilter] = useState('OPEN');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/restaurant/sessions?status=${filter}`)
      .then(r => r.json())
      .then(data => { setSessions(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filter]);

  const openSessions = sessions.filter(s => s.status === 'OPEN');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tabs y Sesiones</h1>
        <Link
          href="/admin/restaurant/sessions/nuevo"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nuevo tab
        </Link>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2">
        {[
          { key: 'OPEN', label: `Abiertas (${sessions.filter(s => s.status === 'OPEN').length})` },
          { key: 'CLOSED', label: 'Cerradas' },
          { key: 'ALL', label: 'Todas' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
              filter === f.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Cargando...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-400 text-lg">No hay sesiones {filter === 'OPEN' ? 'abiertas' : ''}</p>
          <Link href="/admin/restaurant/sessions/nuevo" className="inline-block mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium">
            + Abrir primer tab →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase text-xs">Tipo</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase text-xs">Etiqueta</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase text-xs">Cliente</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500 uppercase text-xs">Órdenes</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 uppercase text-xs">Pagado</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 uppercase text-xs">Abierta</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 uppercase text-xs">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sessions.map(s => {
                  const ordersTotal = s.orders.reduce((sum, o) => sum + o.total, 0);
                  const paidTotal = s.payments.reduce((sum, p) => sum + p.amount, 0);
                  const isOpen = s.status === 'OPEN';
                  return (
                    <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${isOpen ? 'bg-amber-50/30' : ''}`}>
                      <td className="py-3 px-4">
                        <span className="text-lg">{typeIcon[s.type] || '❓'}</span>
                        <span className="text-xs text-gray-400 ml-1">{typeLabel[s.type] || s.type}</span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{s.label}</p>
                        {s.table && <p className="text-xs text-gray-400">Mesa {s.table.number} · {s.table.location}</p>}
                      </td>
                      <td className="py-3 px-4">
                        {s.customer ? (
                          <Link href={`/admin/restaurant/customers/${s.customer.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                            {s.customer.name}
                          </Link>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-medium text-gray-700">{s.orders.length}</span>
                        <span className="text-xs text-gray-400 ml-1">({formatPrice(ordersTotal)})</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={paidTotal > 0 ? 'text-green-600 font-medium' : 'text-gray-400'}>
                          {formatPrice(paidTotal)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-xs text-gray-400">
                        {new Date(s.openedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isOpen ? (
                          <Link
                            href={`/admin/restaurant/sessions/${s.id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Cerrar →
                          </Link>
                        ) : (
                          <Link
                            href={`/admin/restaurant/sessions/${s.id}`}
                            className="text-gray-400 hover:text-gray-600 text-sm"
                          >
                            Ver →
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
