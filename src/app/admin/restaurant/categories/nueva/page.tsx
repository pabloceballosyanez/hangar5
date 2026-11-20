'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NuevaCategoriaPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [kind, setKind] = useState('FOOD');
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/restaurant/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, kind, sortOrder: Number(sortOrder), isActive: true }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Error al crear categoría');
      }
      router.push('/admin/restaurant/categories');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-[var(--color-adp-tinta)] mb-6">Nueva categoría</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-[var(--color-adp-borde)] p-6 space-y-4">
        {error && <p className="text-sm text-white bg-[var(--color-adp-urgente)] p-3 rounded-lg">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-[var(--color-adp-tinta)] mb-1">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full border border-[var(--color-adp-borde-2)] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 focus:border-[var(--color-adp-info)] outline-none"
            placeholder="Ej: Pizzas"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-adp-tinta)] mb-1">Tipo</label>
          <select
            value={kind}
            onChange={e => setKind(e.target.value)}
            className="w-full border border-[var(--color-adp-borde-2)] rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none"
          >
            <option value="FOOD">Comida</option>
            <option value="DRINK">Bebida</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-adp-tinta)] mb-1">Orden</label>
          <input
            type="number"
            value={sortOrder}
            onChange={e => setSortOrder(Number(e.target.value))}
            className="w-full border border-[var(--color-adp-borde-2)] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="w-full py-2.5 bg-[var(--color-adp-pino)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-adp-pino-hondo)] disabled:opacity-50 transition-colors"
        >
          {saving ? 'Creando...' : 'Crear categoría'}
        </button>
      </form>
    </div>
  );
}
