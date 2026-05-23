'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  kind: string;
}

const PREP_STATIONS = [
  { value: 'KITCHEN', label: 'Cocina' },
  { value: 'BAR', label: 'Bar' },
  { value: 'COLD_STATION', label: 'Estación fría' },
] as const;

export default function NuevoMenuItemPage() {
  const router = useRouter();

  // Form state
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [basePricePesos, setBasePricePesos] = useState<number | ''>('');
  const [prepStation, setPrepStation] = useState<string>('KITCHEN');
  const [estimatedPrepMinutes, setEstimatedPrepMinutes] = useState<number | ''>(15);
  const [imageUrl, setImageUrl] = useState('');
  const [sortOrder, setSortOrder] = useState<number | ''>('');

  // UI state
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/restaurant/categories')
      .then((r) => r.json())
      .then((data: Category[]) => {
        setCategories(data);
        if (data.length > 0) setCategoryId(data[0].id);
      })
      .catch(() => setError('No se pudieron cargar las categorías.'))
      .finally(() => setLoadingCategories(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('El nombre es requerido.');
      return;
    }
    if (!categoryId) {
      setError('Selecciona una categoría.');
      return;
    }
    if (basePricePesos === '' || Number(basePricePesos) < 0) {
      setError('El precio base es requerido y debe ser mayor o igual a 0.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/restaurant/menu-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          categoryId,
          description: description.trim() || undefined,
          basePrice: Math.round(Number(basePricePesos) * 100),
          prepStation,
          estimatedPrepMinutes: estimatedPrepMinutes !== '' ? Number(estimatedPrepMinutes) : 15,
          imageUrl: imageUrl.trim() || undefined,
          sortOrder: sortOrder !== '' ? Number(sortOrder) : undefined,
          variants: [],
          modifierGroupIds: [],
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `Error ${res.status}`);
      }

      router.push('/admin/restaurant/menu-items');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/restaurant/menu-items"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Volver al menú
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Nuevo item del menú</h1>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Tacos de pastor"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría <span className="text-red-500">*</span>
              </label>
              {loadingCategories ? (
                <div className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-400 bg-gray-50">
                  Cargando categorías…
                </div>
              ) : (
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  required
                >
                  {categories.length === 0 && (
                    <option value="">Sin categorías disponibles</option>
                  )}
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.kind === 'FOOD' ? 'Comida' : 'Bebida'})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción del platillo o bebida…"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Price + Prep time row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio base <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    value={basePricePesos}
                    onChange={(e) =>
                      setBasePricePesos(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="0.00"
                    min={0}
                    step={0.01}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">En pesos MXN</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiempo estimado
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={estimatedPrepMinutes}
                    onChange={(e) =>
                      setEstimatedPrepMinutes(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="15"
                    min={1}
                    className="w-full pr-14 pl-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">min</span>
                </div>
              </div>
            </div>

            {/* Prep station */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estación de preparación
              </label>
              <select
                value={prepStation}
                onChange={(e) => setPrepStation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {PREP_STATIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL de imagen <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://…"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Sort order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Orden <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) =>
                  setSortOrder(e.target.value === '' ? '' : Number(e.target.value))
                }
                placeholder="0"
                min={0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">
                Número menor aparece primero en el menú.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Link
                href="/admin/restaurant/menu-items"
                className="flex-1 text-center px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading || loadingCategories}
                className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creando…' : 'Crear item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
