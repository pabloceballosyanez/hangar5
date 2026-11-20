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
  TAB: 'Cuenta',
  WALKIN: 'Sin reserva',
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
        <h1 className="text-2xl font-bold text-[var(--color-adp-tinta)]">Cuentas y Sesiones</h1>
        <Link
          href="/admin/restaurant/sessions/nuevo"
          className="px-4 py-2 bg-[var(--color-adp-pino)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-adp-pino-hondo)] transition-colors"
        >
          + Nueva cuenta
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
                ? 'bg-[var(--color-adp-pino)] text-white'
                : 'bg-[var(--color-adp-papel-3)] text-[var(--color-adp-tinta-2)] hover:bg-[var(--color-adp-borde)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-adp-info)] mx-auto mb-4" />
          <p className="text-[var(--color-adp-tinta-2)]">Cargando...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-[var(--color-adp-borde)] p-8 text-center">
          <p className="text-[var(--color-adp-tinta-2)] text-lg">No hay sesiones {filter === 'OPEN' ? 'abiertas' : ''}</p>
          <Link href="/admin/restaurant/sessions/nuevo" className="inline-block mt-4 text-[var(--color-adp-pino)] hover:text-[var(--color-adp-info)] text-sm font-medium">
            + Abrir la primera cuenta →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-[var(--color-adp-borde)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-adp-borde)] bg-[var(--color-adp-papel-3)]">
                  <th className="text-left py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs">Tipo</th>
                  <th className="text-left py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs">Etiqueta</th>
                  <th className="text-left py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs">Cliente</th>
                  <th className="text-center py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs">Órdenes</th>
                  <th className="text-right py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs">Pagado</th>
                  <th className="text-right py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs">Abierta</th>
                  <th className="text-right py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-adp-borde)]">
                {sessions.map(s => {
                  const ordersTotal = s.orders.reduce((sum, o) => sum + o.total, 0);
                  const paidTotal = s.payments.reduce((sum, p) => sum + p.amount, 0);
                  const isOpen = s.status === 'OPEN';
                  return (
                    <tr key={s.id} className={`hover:bg-[var(--color-adp-papel-3)] transition-colors ${isOpen ? 'hover:bg-[var(--color-adp-atencion)]/85/10/30' : ''}`}>
                      <td className="py-3 px-4">
                        <span className="text-lg">{typeIcon[s.type] || '❓'}</span>
                        <span className="text-xs text-[var(--color-adp-tinta-2)] ml-1">{typeLabel[s.type] || s.type}</span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-[var(--color-adp-tinta)]">{s.label}</p>
                        {s.table && <p className="text-xs text-[var(--color-adp-tinta-2)]">Mesa {s.table.number} · {s.table.location}</p>}
                      </td>
                      <td className="py-3 px-4">
                        {s.customer ? (
                          <Link href={`/admin/restaurant/customers/${s.customer.id}`} className="text-[var(--color-adp-pino)] hover:text-[var(--color-adp-info)] font-medium">
                            {s.customer.name}
                          </Link>
                        ) : (
                          <span className="text-[var(--color-adp-tinta-2)]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-medium text-[var(--color-adp-tinta)]">{s.orders.length}</span>
                        <span className="text-xs text-[var(--color-adp-tinta-2)] ml-1">({formatPrice(ordersTotal)})</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={paidTotal > 0 ? 'text-[var(--color-adp-pino)] font-medium' : 'text-[var(--color-adp-tinta-2)]'}>
                          {formatPrice(paidTotal)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-xs text-[var(--color-adp-tinta-2)]">
                        {new Date(s.openedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isOpen ? (
                          <Link
                            href={`/admin/restaurant/sessions/${s.id}`}
                            className="text-[var(--color-adp-pino)] hover:text-[var(--color-adp-info)] text-sm font-medium"
                          >
                            Cerrar →
                          </Link>
                        ) : (
                          <Link
                            href={`/admin/restaurant/sessions/${s.id}`}
                            className="text-[var(--color-adp-tinta-2)] hover:text-[var(--color-adp-tinta-2)] text-sm"
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
