'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

const LOCATIONS = ['Interior', 'Terraza', 'Barra', 'Exterior'] as const;

interface ServiceSession {
  id: string;
  status: string;
  openedAt: string;
  closedAt: string | null;
  orders: { id: string; status: string; total: number; createdAt: string }[];
}

interface Table {
  id: string;
  number: string;
  name: string | null;
  capacity: number;
  location: string | null;
  isActive: boolean;
  sessions: ServiceSession[];
}

export default function EditTablePage() {
  const router = useRouter();
  const params = useParams();
  const tableId = params.tableId as string;

  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState<number | ''>('');
  const [location, setLocation] = useState<string>(LOCATIONS[0]);
  const [isActive, setIsActive] = useState(true);
  const [sessions, setSessions] = useState<ServiceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/restaurant/tables/${tableId}`);
        if (!res.ok) throw new Error('Mesa no encontrada');
        const data: Table = await res.json();
        setNumber(data.number);
        setName(data.name || '');
        setCapacity(data.capacity);
        setLocation(data.location || LOCATIONS[0]);
        setIsActive(data.isActive);
        setSessions(data.sessions || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al cargar');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tableId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!number.trim()) {
      setError('El identificador de mesa es requerido.');
      return;
    }
    if (!capacity || Number(capacity) < 1) {
      setError('La capacidad debe ser al menos 1.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/restaurant/tables/${tableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: number.trim(),
          name: name.trim() || null,
          capacity: Number(capacity),
          location,
          isActive,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `Error ${res.status}`);
      }

      router.push('/admin/restaurant/tables');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('¿Desactivar esta mesa? No se eliminará si tiene una sesión activa.')) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/restaurant/tables/${tableId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? 'Error al desactivar');
      }
      router.push('/admin/restaurant/tables');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-500">Cargando mesa...</p>
      </div>
    );
  }

  if (error && !number) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Link href="/admin/restaurant/tables" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          ← Volver a mesas
        </Link>
      </div>
    );
  }

  const openSession = sessions.find((s) => s.status === 'OPEN');

  return (
    <div className="flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-2xl">
        <div className="mb-6">
          <Link href="/admin/restaurant/tables" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            ← Volver a mesas
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Editar mesa: {number}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Edit Form */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <form onSubmit={handleSave} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Identificador <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value === '' ? '' : Number(e.target.value))}
                    min={1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    {LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Activa</label>
              </div>

              <div className="flex gap-3 pt-2">
                <Link
                  href="/admin/restaurant/tables"
                  className="px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </Link>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting || !!openSession}
                  title={openSession ? 'Cierra la sesión activa primero' : 'Desactivar mesa'}
                  className="px-4 py-2 border border-red-200 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {deleting ? 'Desactivando...' : 'Desactivar'}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>

          {/* Session Info */}
          <div className="space-y-4">
            {openSession && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-amber-800 mb-2">🔴 Sesión activa</p>
                <p className="text-xs text-amber-700">
                  Abierta: {new Date(openSession.openedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-xs text-amber-700">
                  Órdenes: {openSession.orders.length}
                </p>
                <p className="text-xs text-amber-600 mt-2">
                  Cierra la sesión antes de desactivar la mesa.
                </p>
              </div>
            )}

            {sessions.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Historial reciente</p>
                <div className="space-y-2">
                  {sessions.slice(0, 5).map((s) => (
                    <div key={s.id} className="text-xs border-b border-gray-50 pb-2 last:border-0">
                      <div className="flex justify-between">
                        <span className={s.status === 'OPEN' ? 'text-amber-600 font-medium' : 'text-gray-500'}>
                          {s.status === 'OPEN' ? 'Abierta' : 'Cerrada'}
                        </span>
                        <span className="text-gray-400">
                          {new Date(s.openedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-gray-500">{s.orders.length} órdenes</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
