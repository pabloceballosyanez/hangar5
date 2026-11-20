'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.categoryId as string;

  const [name, setName] = useState('');
  const [kind, setKind] = useState('FOOD');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [menuItemCount, setMenuItemCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/restaurant/categories/${categoryId}`);
        if (!res.ok) throw new Error('Categoría no encontrada');
        const data = await res.json();
        setName(data.name);
        setKind(data.kind);
        setSortOrder(data.sortOrder);
        setIsActive(data.isActive);
        setMenuItemCount(data.menuItems?.length ?? 0);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al cargar');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [categoryId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/restaurant/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, kind, sortOrder: Number(sortOrder), isActive }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Error al guardar');
      }
      router.push('/admin/restaurant/categories');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar esta categoría?')) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/restaurant/categories/${categoryId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Error al eliminar');
      }
      router.push('/admin/restaurant/categories');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-adp-info)] mx-auto mb-4" />
        <p className="text-[var(--color-adp-tinta-2)]">Cargando categoría...</p>
      </div>
    );
  }

  if (error && !name) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <p className="text-[var(--color-adp-urgente)] mb-4">{error}</p>
        <button
          onClick={() => router.push('/admin/restaurant/categories')}
          className="text-[var(--color-adp-pino)] hover:text-[var(--color-adp-info)] text-sm font-medium"
        >
          ← Volver a categorías
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-[var(--color-adp-tinta)] mb-6">Editar categoría</h1>
      <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-[var(--color-adp-borde)] p-6 space-y-4">
        {error && <p className="text-sm text-white bg-[var(--color-adp-urgente)] p-3 rounded-lg">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-[var(--color-adp-tinta)] mb-1">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full border border-[var(--color-adp-borde-2)] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 focus:border-[var(--color-adp-info)] outline-none"
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

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isActive"
            checked={isActive}
            onChange={e => setIsActive(e.target.checked)}
            className="w-4 h-4 text-[var(--color-adp-pino)] rounded border-[var(--color-adp-borde-2)] focus:ring-[var(--color-adp-pino)]/40"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-[var(--color-adp-tinta)]">
            Activo
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="flex-1 py-2.5 bg-[var(--color-adp-pino)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-adp-pino-hondo)] disabled:opacity-50 transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting || menuItemCount > 0}
            title={menuItemCount > 0 ? 'Elimina los items primero' : 'Eliminar categoría'}
            className="px-4 py-2.5 border border-[var(--color-adp-urgente)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-adp-urgente)]/85 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/restaurant/categories')}
            className="px-4 py-2.5 border border-[var(--color-adp-borde)] text-[var(--color-adp-tinta-2)] text-sm font-medium rounded-lg hover:bg-[var(--color-adp-papel-3)] transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
