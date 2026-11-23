'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SalirOPanel } from '@/components/SalirOPanel';

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
  /* Mismos estados y tonos que el KDS y el Modo Solo.
     Antes este archivo usaba emerald, slate, amber y green: cuatro
     familias de color para decir lo mismo que las otras pantallas. */
  empty:         { bg: 'op-neutral', border: '', badge: 'op-neutral', label: 'Vacío', pulse: false },
  active:        { bg: 'op-surface-2', border: '', badge: 'op-neutral', label: 'En cocina', pulse: false },
  partial_ready: { bg: 'op-warn', border: '', badge: 'op-warn', label: 'Parcial', pulse: false },
  all_ready:     { bg: 'op-good', border: '', badge: 'op-good', label: '¡Listo!', pulse: true },
  served:        { bg: 'op-surface', border: '', badge: 'op-neutral', label: 'Entregado', pulse: false },
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

export default function WaiterHomePage() {
  const router = useRouter();
  const [waiterName, setWaiterName] = useState('');
  /* Mesero no tiene acceso al panel: su botón de salida cierra sesión. */
  const [puedeAdmin, setPuedeAdmin] = useState(false);

  /* ── Abrir cuenta, sin salir de la pantalla ─────────────────────────
     Antes "Nuevo tab" navegaba a /waiter/nuevo: dos pasos para lo mismo.
     Ahora el formulario se abre encima y al crear te lleva a la cuenta. */
  const [creando, setCreando] = useState(false);
  const [tabType, setTabType] = useState<'TABLE' | 'TAB' | 'WALKIN'>('WALKIN');
  const [etiqueta, setEtiqueta] = useState('');
  const [mesaId, setMesaId] = useState('');
  const [mesas, setMesas] = useState<Array<{ id: string; number: string; location: string | null }>>([]);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [cliente, setCliente] = useState<{ id: string; name: string; phone: string | null } | null>(null);
  const [clientes, setClientes] = useState<Array<{ id: string; name: string; phone: string | null }>>([]);
  const [guardando, setGuardando] = useState(false);
  const [errorCuenta, setErrorCuenta] = useState('');

  const clientesFiltrados = clientes.filter((c) => {
    const q = buscaCliente.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.phone ?? '').includes(buscaCliente);
  });

  function abrirCuenta() {
    setCreando(true);
    setErrorCuenta('');
    setEtiqueta('');
    setMesaId('');
    setCliente(null);
    setBuscaCliente('');
    // Mesas y clientes se piden al abrir: si cambian durante el turno,
    // la lista siempre está al día.
    fetch('/api/admin/restaurant/tables')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setMesas(Array.isArray(d) ? d.filter((m: { isActive?: boolean }) => m.isActive !== false) : []))
      .catch(() => setMesas([]));
    fetch('/api/admin/restaurant/customers')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setClientes(Array.isArray(d) ? d : (d.customers ?? [])))
      .catch(() => setClientes([]));
  }

  async function crearCuenta() {
    if (!etiqueta.trim()) { setErrorCuenta('Ponle un nombre a la cuenta'); return; }
    if (tabType === 'TABLE' && !mesaId) { setErrorCuenta('Elige una mesa'); return; }
    if (tabType === 'TAB' && !cliente) { setErrorCuenta('Elige un cliente de la lista'); return; }

    setGuardando(true);
    setErrorCuenta('');
    try {
      const cuerpo: Record<string, string | null> = {
        type: tabType,
        label: etiqueta.trim(),
        tableId: tabType === 'TABLE' ? mesaId : null,
        customerId: tabType === 'TAB' ? cliente!.id : null,
      };
      const r = await fetch('/api/admin/restaurant/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || 'No se pudo abrir la cuenta');
      }
      const data = await r.json();
      setCreando(false);
      router.push(`/waiter/session/${data.id}`);
    } catch (e) {
      setErrorCuenta(e instanceof Error ? e.message : 'Error al abrir la cuenta');
    } finally {
      setGuardando(false);
    }
  }
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
        if (!data?.staff) {
          router.replace('/login');
          return;
        }
        /* Antes exigía ser MESERO y nadie más podía usar el mesero, ni el
           gerente para cubrir un turno. Ahora entra quien tenga acceso a
           operación; el resto se va a su pantalla. */
        const rol = data.staff.role as string;
        if (!['MESERO', 'GERENTE', 'SUPER_ADMIN', 'CAJA'].includes(rol)) {
          router.replace('/login');
          return;
        }
        setWaiterName(data.staff.name);
        setPuedeAdmin(rol !== 'MESERO');
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
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brass border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink pb-6 text-snow">
      {/* Header. Antes era slate y no había forma de volver al admin: en
          pantalla bloqueada el mesero quedaba atrapado. */}
      <header className="op-header">
        <div className="min-w-0">
          <h1 className="op-title text-snow">Mesero</h1>
          <p className="op-small text-smoke truncate">{waiterName}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => loadSessions(true)}
            className="op-btn op-btn-ghost op-btn-sm"
            title="Actualizar"
          >
            Actualizar
          </button>
          <SalirOPanel puedeAdmin={puedeAdmin} />
          <button onClick={handleLogout} className="op-btn op-btn-ghost op-btn-sm">
            Salir
          </button>
        </div>
      </header>

      {/* Summary */}
      <div className="flex gap-3 px-5 py-3 border-b border-hair op-small text-ash">
        <span>{sessions.length} tabs abiertos</span>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-950/50 border border-red-700/40 rounded-xl op-body text-red-300">
          {error}
          <button onClick={() => loadSessions()} className="underline op-small ml-3 text-bad">Reintentar</button>
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
              className={`relative flex flex-col p-4 rounded-xl ${cfg.bg} transition-all active:scale-95 text-left min-h-[130px] ${cfg.pulse ? 'animate-pulse' : ''}`}
            >
              <div className="flex items-start justify-between mb-1">
                <span className="op-lead text-snow leading-tight truncate pr-1">
                  {typeIcon[session.type] || '👤'} {session.table?.number || session.label}
                </span>
                <span className="op-micro text-smoke shrink-0">{fmtTime(session.openedAt)}</span>
              </div>
              {session.customer && (
                <p className="op-small text-ash mb-2">{session.customer.name}</p>
              )}
              {session.table && (
                <p className="op-small text-ash mb-2">Mesa {session.table.number}</p>
              )}
              <div className="mt-auto flex items-center justify-between">
                <span className={`op-pill ${cfg.badge}`}>
                  {cfg.label}
                </span>
                <div className="text-right">
                  {activeOrders.length > 0 && (
                    <p className="op-small text-brass font-semibold tabular-nums">
                      {activeOrders.length} ord · ${total.toFixed(0)}
                    </p>
                  )}
                  {urgency === 'partial_ready' && readyCount > 0 && (
                    <p className="op-small font-bold">
                      {readyCount} listo{readyCount !== 1 ? 's' : ''}
                    </p>
                  )}
                  {urgency === 'all_ready' && (
                    <p className="op-small font-bold">
                      {readyCount} listo{readyCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}

      </div>

      {sessions.length === 0 && !creando && (
        <div className="text-center py-12">
          <p className="op-lead text-ash">No hay cuentas abiertas</p>
          <p className="op-small text-smoke mt-1">Toca "Abrir cuenta" para empezar</p>
        </div>
      )}

      {/* ── Abrir cuenta ────────────────────────────────────────────────
          Antes "Nuevo tab" llevaba a /waiter/nuevo, una pantalla aparte con
          el formulario. Eran dos pasos para lo mismo y, con la lista vacía,
          parecía que la app no servía. Pablo: "la página anterior solo es
          una redundancia sin sentido". Ahora el formulario se abre aquí. */}
      {creando && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setCreando(false)}>
          <div
            className="w-full sm:max-w-lg bg-ink-2 rounded-t-2xl sm:rounded-2xl p-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="op-title text-snow">Abrir cuenta</h2>
              <button onClick={() => setCreando(false)} className="op-btn op-btn-ghost op-btn-sm">Cerrar</button>
            </div>

            {/* Los tres tipos de cuenta, en un toque */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {([
                { key: 'TABLE', nombre: 'Mesa', nota: 'Física' },
                { key: 'TAB', nombre: 'Cliente', nota: 'Registrado' },
                { key: 'WALKIN', nombre: 'Walk-in', nota: 'Directo' },
              ] as const).map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => { setTabType(t.key); setCliente(null); setBuscaCliente(''); }}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    tabType === t.key
                      ? 'border-brass bg-brass/10'
                      : 'border-hair hover:border-brass/40'
                  }`}
                >
                  <p className="op-body text-snow font-semibold">{t.nombre}</p>
                  <p className="op-micro text-smoke mt-0.5">{t.nota}</p>
                </button>
              ))}
            </div>

            {tabType === 'TABLE' && (
              <div className="mb-3">
                <label className="op-small text-ash block mb-1">Mesa</label>
                <select
                  value={mesaId}
                  onChange={(e) => {
                    setMesaId(e.target.value);
                    const m = mesas.find((x) => x.id === e.target.value);
                    if (m) setEtiqueta(`Mesa ${m.number}`);
                  }}
                  className="w-full op-surface rounded-lg px-3 py-2.5 op-body text-snow"
                >
                  <option value="">Elige una mesa</option>
                  {mesas.map((m) => (
                    <option key={m.id} value={m.id}>Mesa {m.number}{m.location ? ` · ${m.location}` : ''}</option>
                  ))}
                </select>
              </div>
            )}

            {tabType === 'TAB' && (
              <div className="mb-3 relative">
                <label className="op-small text-ash block mb-1">Cliente del Hangar</label>
                <input
                  value={buscaCliente}
                  onChange={(e) => { setBuscaCliente(e.target.value); setCliente(null); }}
                  placeholder="Buscar por nombre o teléfono"
                  className="w-full op-surface rounded-lg px-3 py-2.5 op-body text-snow"
                />
                {buscaCliente.length >= 2 && !cliente && (
                  <div className="absolute z-10 left-0 right-0 mt-1 op-surface rounded-lg max-h-40 overflow-y-auto shadow-lg">
                    {clientesFiltrados.length === 0 ? (
                      <p className="px-3 py-2 op-small text-smoke">Sin coincidencias</p>
                    ) : clientesFiltrados.slice(0, 6).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { setCliente(c); setEtiqueta(c.name); setBuscaCliente(c.name); }}
                        className="w-full text-left px-3 py-2 op-body text-snow hover:bg-ink-3"
                      >
                        {c.name}{c.phone ? ` · ${c.phone}` : ''}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mb-4">
              <label className="op-small text-ash block mb-1">
                {tabType === 'TABLE' ? 'Nombre de la cuenta' : 'Nombre'}
              </label>
              <input
                value={etiqueta}
                onChange={(e) => setEtiqueta(e.target.value)}
                placeholder={tabType === 'TABLE' ? 'Ej: Mesa terraza' : tabType === 'TAB' ? 'Nombre del cliente' : 'Ej: Juan P.'}
                className="w-full op-surface rounded-lg px-3 py-2.5 op-body text-snow"
              />
            </div>

            {errorCuenta && <p className="op-small text-bad mb-3">{errorCuenta}</p>}

            <button
              onClick={abrirCuenta}
              disabled={guardando || !etiqueta.trim()}
              className="op-btn op-btn-primary w-full h-12"
            >
              {guardando ? 'Abriendo…' : 'Abrir cuenta'}
            </button>
          </div>
        </div>
      )}

      {/* Botón flotante para abrir cuenta, siempre a mano */}
      {!creando && (
        <button
          onClick={() => setCreando(true)}
          className="fixed bottom-5 right-5 op-btn op-btn-primary h-14 px-5 shadow-lg z-40"
        >
          + Abrir cuenta
        </button>
      )}
    </div>
  );
}
