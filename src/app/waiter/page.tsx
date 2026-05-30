'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface SessionOrderItem { id: string; status: string; }
interface SessionOrder {
  id: string;
  status: string;
  total: number;
  orderItems?: SessionOrderItem[];
}
interface Session {
  id: string;
  type: string;
  label: string;
  status: string;
  openedAt: string;
  table: { number: string; name: string | null } | null;
  customer: { id: string; name: string } | null;
  orders: SessionOrder[];
  urgency?: 'empty' | 'active' | 'partial_ready' | 'all_ready' | 'served';
  itemSummary?: { ready: number; pending: number };
}

const typeIcon: Record<string, string> = { TABLE: '🪑', TAB: '👤', WALKIN: '🚶' };

function getSessionUrgency(session: Session): 'empty' | 'active' | 'partial_ready' | 'all_ready' | 'served' {
  // Use server-computed urgency if available
  if (session.urgency) return session.urgency;
  
  // Fallback: client-side computation (item-level)
  const active = session.orders.filter(o => !['PAID', 'CANCELLED'].includes(o.status));
  if (active.length === 0) return 'empty';
  
  let hasReady = false, hasPending = false;
  for (const order of active) {
    const items = order.orderItems || [];
    if (items.length === 0) {
      if (order.status === 'READY') hasReady = true;
      else if (order.status !== 'SERVED') hasPending = true;
    } else {
      for (const item of items) {
        if (item.status === 'READY') hasReady = true;
        else if (item.status !== 'SERVED' && item.status !== 'CANCELLED') hasPending = true;
      }
    }
  }
  if (hasReady && hasPending) return 'partial_ready';
  if (hasReady && !hasPending) return 'all_ready';
  if (!hasReady && !hasPending) return 'served';
  return 'active';
}

const URGENCY_CONFIG: Record<string, { bg: string; border: string; badge: string; label: string; pulse: boolean }> = {
  empty:         { bg: 'bg-emerald-950/50', border: 'border-emerald-600/30', badge: 'bg-emerald-700/80', label: 'Vacío', pulse: false },
  active:        { bg: 'bg-slate-800/60',    border: 'border-slate-600/40',   badge: 'bg-slate-600',      label: 'En cocina', pulse: false },
  partial_ready: { bg: 'bg-amber-950/50',    border: 'border-amber-500/50',    badge: 'bg-amber-600',      label: 'Parcial', pulse: false },
  all_ready:     { bg: 'bg-green-950/60',    border: 'border-green-500/60',    badge: 'bg-green-600',      label: '¡Listo!', pulse: true },
  served:        { bg: 'bg-slate-900/60',    border: 'border-slate-700/50',    badge: 'bg-slate-700',      label: 'Entregado', pulse: false },
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

export default function WaiterHomePage() {
  const router = useRouter();
  const [waiterName, setWaiterName] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/restaurant/sessions?status=OPEN');
      if (!res.ok) throw new Error('Error al cargar');
      setSessions(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Leer sesión del login principal por PIN
    fetch('/api/auth/login')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.staff || data.staff.role !== 'MESERO') {
          router.replace('/login');
          return;
        }
        setWaiterName(data.staff.name);
        loadSessions();
      })
      .catch(() => router.replace('/login'));
  }, [router, loadSessions]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => loadSessions(true), 30000);
    return () => clearInterval(interval);
  }, [loadSessions]);

  const handleLogout = () => {
    
    
    fetch('/api/auth/login',{method:'DELETE'}).then(()=>router.push('/login'));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-6">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-black text-white text-xl leading-tight">Tabs</h1>
          <p className="text-xs text-amber-400/80">👋 {waiterName}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => loadSessions(true)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <span className="text-xl">↺</span>
          </button>
          <button onClick={handleLogout} className="text-sm text-slate-400 hover:text-white bg-slate-800 px-3 py-2 rounded-lg transition-all active:scale-95">
            Salir
          </button>
        </div>
      </header>

      {/* Summary */}
      <div className="flex gap-3 px-4 py-3 border-b border-slate-800/50 text-sm text-slate-400">
        <span>{sessions.length} tabs abiertos</span>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-950/50 border border-red-700/40 rounded-xl text-sm text-red-300">
          {error}
          <button onClick={() => loadSessions()} className="text-red-400 underline text-xs ml-3">Reintentar</button>
        </div>
      )}

      {/* Sessions grid */}
      <div className="grid grid-cols-2 gap-3 p-4">
        {sessions.map(session => {
          const urgency = getSessionUrgency(session);
          const cfg = URGENCY_CONFIG[urgency];
          const activeOrders = session.orders.filter(o => !['PAID', 'CANCELLED'].includes(o.status));
          const total = activeOrders.reduce((sum, o) => sum + (o.total || 0), 0);
          const readyCount = session.itemSummary?.ready || 0;
          const pendingCount = session.itemSummary?.pending || 0;

          return (
            <button
              key={session.id}
              onClick={() => router.push(`/waiter/session/${session.id}`)}
              className={`relative flex flex-col p-4 rounded-2xl border-2 ${cfg.bg} ${cfg.border} transition-all active:scale-95 text-left min-h-[130px] ${cfg.pulse ? 'animate-pulse' : ''}`}
            >
              <div className="flex items-start justify-between mb-1">
                <span className="text-2xl font-black text-white leading-tight truncate pr-1">
                  {typeIcon[session.type] || '👤'} {session.label}
                </span>
                <span className="text-xs text-slate-500 shrink-0">{fmtTime(session.openedAt)}</span>
              </div>
              {session.customer && (
                <p className="text-xs text-slate-500 mb-2">{session.customer.name}</p>
              )}
              {session.table && (
                <p className="text-xs text-slate-600 mb-2">Mesa {session.table.number}</p>
              )}
              <div className="mt-auto flex items-center justify-between">
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full text-white font-medium ${cfg.badge}`}>
                  {cfg.label}
                </span>
                <div className="text-right">
                  {activeOrders.length > 0 && (
                    <p className="text-xs text-amber-400 font-semibold">
                      {activeOrders.length} ord · ${total.toFixed(0)}
                    </p>
                  )}
                  {urgency === 'partial_ready' && readyCount > 0 && (
                    <p className="text-xs text-amber-400 font-bold">
                      🍹 {readyCount} listo{readyCount !== 1 ? 's' : ''}
                    </p>
                  )}
                  {urgency === 'all_ready' && (
                    <p className="text-xs text-green-400 font-bold">
                      🍽 {readyCount} listo{readyCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {/* New tab button */}
        <button
          onClick={() => router.push('/waiter/nuevo')}
          className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-700 hover:border-amber-400/40 bg-slate-900/40 min-h-[130px] transition-all active:scale-95 gap-2"
        >
          <span className="text-4xl">➕</span>
          <span className="text-sm text-slate-500 font-medium">Nuevo tab</span>
        </button>
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-12 text-slate-600">
          <div className="text-5xl mb-3">👤</div>
          <p className="text-sm">No hay tabs abiertos</p>
          <p className="text-xs text-slate-700 mt-1">Toca + para abrir uno</p>
        </div>
      )}
    </div>
  );
}
