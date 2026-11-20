'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const LOCATIONS = ['Interior', 'Terraza', 'Barra', 'Exterior'] as const;

export default function NuevaMessaPage() {
  const router = useRouter();

  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState<number | ''>('');
  const [location, setLocation] = useState<string>(LOCATIONS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!number.trim()) {
      setError('El número/identificador de mesa es requerido.');
      return;
    }
    if (!capacity || Number(capacity) < 1) {
      setError('La capacidad debe ser al menos 1.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/restaurant/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: number.trim(),
          name: name.trim() || undefined,
          capacity: Number(capacity),
          location,
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
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/restaurant/tables"
            className="text-sm text-[var(--color-adp-tinta-2)] hover:text-[var(--color-adp-tinta)] transition-colors"
          >
            ← Volver a mesas
          </Link>
          <h1 className="text-2xl font-bold text-[var(--color-adp-tinta)] mt-2">Nueva mesa</h1>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-sm border border-[var(--color-adp-borde)] p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Number */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-adp-tinta)] mb-1">
                Identificador <span className="text-[var(--color-adp-urgente)]">*</span>
              </label>
              <input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="Ej: T9, M3, Bar-1"
                className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 focus:border-transparent"
                required
              />
              <p className="text-xs text-[var(--color-adp-tinta-2)] mt-1">Código único que identifica la mesa.</p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-adp-tinta)] mb-1">
                Nombre <span className="text-[var(--color-adp-tinta-2)] font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Mesa del rincón"
                className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 focus:border-transparent"
              />
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-adp-tinta)] mb-1">
                Capacidad <span className="text-[var(--color-adp-urgente)]">*</span>
              </label>
              <input
                type="number"
                value={capacity}
                onChange={(e) =>
                  setCapacity(e.target.value === '' ? '' : Number(e.target.value))
                }
                placeholder="Número de personas"
                min={1}
                className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 focus:border-transparent"
                required
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-adp-tinta)] mb-1">
                Ubicación
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 focus:border-transparent bg-white"
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-[var(--color-adp-urgente)] border border-[var(--color-adp-urgente)] rounded-lg text-sm text-white">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Link
                href="/admin/restaurant/tables"
                className="flex-1 text-center px-4 py-2 border border-[var(--color-adp-borde-2)] text-sm font-medium text-[var(--color-adp-tinta)] rounded-lg hover:bg-[var(--color-adp-papel-3)] transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-[var(--color-adp-pino)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-adp-pino-hondo)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creando…' : 'Crear mesa'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
