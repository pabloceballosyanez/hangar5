'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderSummary {
  id:     string;
  status: string;
  total:  number;
}

interface TableSession {
  id:      string;
  status:  string;
  orders:  OrderSummary[];
}

interface Table {
  id:       string;
  number:   string;
  name:     string | null;
  capacity: number;
  location: string | null;
  sessions: TableSession[];
}

type TableStatus = 'free' | 'occupied' | 'waiting_payment';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getTableStatus(table: Table): TableStatus {
  const open = table.sessions.find(s => s.status === 'OPEN');
  if (!open) return 'free';

  const activeOrders = open.orders.filter(o => !['PAID', 'CANCELLED'].includes(o.status));
  if (activeOrders.length === 0) return 'occupied'; // session open but no orders yet

  const awaitingPayment = activeOrders.some(o => o.status === 'SERVED');
  if (awaitingPayment) return 'waiting_payment';

  return 'occupied';
}

const STATUS_CONFIG: Record<TableStatus, {
  bg: string; border: string; badge: string; label: string; dot: string;
}> = {
  free: {
    bg:     'bg-emerald-950/60',
    border: 'border-emerald-500/40',
    badge:  'bg-emerald-600',
    label:  'Libre',
    dot:    '🟢',
  },
  occupied: {
    bg:     'bg-orange-950/60',
    border: 'border-orange-500/40',
    badge:  'bg-orange-600',
    label:  'Ocupada',
    dot:    '🟠',
  },
  waiting_payment: {
    bg:     'bg-red-950/60',
    border: 'border-red-500/40',
    badge:  'bg-red-600',
    label:  'Cobrar',
    dot:    '🔴',
  },
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WaiterTablesPage() {
  const router = useRouter();
  const [waiterName, setWaiterName] = useState('');
  const [tables,     setTables]     = useState<Table[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const loadTables = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/restaurant/tables', { cache: 'no-store' });
      if (!res.ok) throw new Error('Error al cargar mesas');
      setTables(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const name = sessionStorage.getItem('waiterName');
    if (!name) {
      router.replace('/waiter/login');
      return;
    }
    setWaiterName(name);
    loadTables();
  }, [router, loadTables]);

  const handleLogout = () => {
    sessionStorage.removeItem('waiterId');
    sessionStorage.removeItem('waiterName');
    router.push('/waiter/login');
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Counts for summary bar ──
  const freeCnt    = tables.filter(t => getTableStatus(t) === 'free').length;
  const occupiedCnt = tables.filter(t => getTableStatus(t) !== 'free').length;

  return (
    <div className="min-h-screen bg-slate-950 pb-6">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-black text-white text-xl leading-tight">Mesas</h1>
          <p className="text-xs text-amber-400/80">👋 {waiterName}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadTables(true)}
            disabled={refreshing}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            aria-label="Actualizar"
          >
            <span className={`text-xl ${refreshing ? 'animate-spin inline-block' : ''}`}>↺</span>
          </button>
          <button
            onClick={handleLogout}
            className="text-sm text-slate-400 hover:text-white bg-slate-800 px-3 py-2 rounded-lg transition-all active:scale-95"
          >
            Salir
          </button>
        </div>
      </header>

      {/* Summary bar */}
      <div className="flex gap-3 px-4 py-3 border-b border-slate-800/50">
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-base">🟢</span>
          <span className="text-slate-400">{freeCnt} libres</span>
        </div>
        <div className="w-px bg-slate-800" />
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-base">🟠</span>
          <span className="text-slate-400">{occupiedCnt} ocupadas</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-950/50 border border-red-700/40 rounded-xl text-sm text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => loadTables()} className="text-red-400 underline text-xs ml-3">
            Reintentar
          </button>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 p-4">
        {tables.map((table) => {
          const status   = getTableStatus(table);
          const cfg      = STATUS_CONFIG[status];
          const openSess = table.sessions.find(s => s.status === 'OPEN');
          const orderCnt = openSess
            ? openSess.orders.filter(o => !['PAID', 'CANCELLED'].includes(o.status)).length
            : 0;
          const total = openSess
            ? openSess.orders
                .filter(o => !['PAID', 'CANCELLED'].includes(o.status))
                .reduce((s, o) => s + o.total, 0)
            : 0;

          return (
            <button
              key={table.id}
              onClick={() => router.push(`/waiter/table/${table.id}`)}
              className={`relative flex flex-col p-4 rounded-2xl border-2 ${cfg.bg} ${cfg.border} transition-all active:scale-95 text-left min-h-[130px]`}
            >
              {/* Number + dot */}
              <div className="flex items-start justify-between mb-1">
                <span className="text-4xl font-black text-white leading-none">{table.number}</span>
                <span className="text-2xl leading-none">{cfg.dot}</span>
              </div>

              {/* Location */}
              {table.location && (
                <p className="text-xs text-slate-400 mb-2 leading-tight">{table.location}</p>
              )}

              {/* Footer */}
              <div className="mt-auto space-y-1.5">
                <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full text-white font-medium ${cfg.badge}`}>
                  {cfg.label}
                </span>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">{table.capacity}p</p>
                  {orderCnt > 0 && (
                    <p className="text-xs text-amber-400 font-semibold">
                      {orderCnt} {orderCnt === 1 ? 'orden' : 'órdenes'} · ${(total / 100).toFixed(0)}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {tables.length === 0 && !error && (
          <div className="col-span-2 text-center py-20 text-slate-600">
            <div className="text-5xl mb-3">🪑</div>
            <p className="text-sm">No hay mesas configuradas</p>
          </div>
        )}
      </div>
    </div>
  );
}
