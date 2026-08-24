'use client';

import { useState, useEffect, useCallback } from 'react';

type AuditEntry = {
  id: string;
  kind: string;
  date: string;
  title: string;
  detail: string;
  reason: string | null;
  actor: string | null;
  notes: string | null;
  total?: number;
};

const TABS = [
  { key: 'stock', label: '📦 Inventario' },
  { key: 'orders', label: '🧾 Órdenes' },
  { key: 'payments', label: '💳 Pagos' },
  { key: 'ledger', label: '📒 Cuentas' },
];

function fmtMXN(cents: number) {
  return (cents / 100).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const reasonLabel: Record<string, string> = {
  PURCHASE: 'Compra',
  ADJUSTMENT: 'Ajuste manual',
  CANCELLED: 'Cancelación',
  CHARGE: 'Cargo',
  PAYMENT: 'Pago',
  REFUND: 'Reembolso',
};

export default function AuditPage() {
  const [tab, setTab] = useState('stock');
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (type: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/restaurant/audit?type=${type}`);
      if (res.ok) setEntries(await res.json());
      else setEntries([]);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Auditoría</h1>
          <p className="text-sm text-gray-500 mt-1">
            Registro de todos los movimientos del restaurante
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
              tab === t.key
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-3xl mb-2">🗂️</div>
            <p className="text-sm text-gray-400">No hay registros en esta vista.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4 font-medium">Fecha</th>
                  <th className="py-3 px-4 font-medium">Concepto</th>
                  <th className="py-3 px-4 font-medium">Detalle</th>
                  <th className="py-3 px-4 font-medium">Actor</th>
                  <th className="py-3 px-4 text-right font-medium">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {entries.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">
                      {fmtDate(e.date)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium text-gray-900">{e.title}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-gray-600">{e.detail}</span>
                      {e.reason && (
                        <span className="ml-2 inline-block px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-600">
                          {reasonLabel[e.reason] || e.reason}
                        </span>
                      )}
                      {e.notes && (
                        <span className="block text-xs text-gray-400 mt-0.5">{e.notes}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">
                      {e.actor || '—'}
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-medium text-gray-900 whitespace-nowrap">
                      {e.total !== undefined ? fmtMXN(e.total) : '—'}
                    </td>
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
