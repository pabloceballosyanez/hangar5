'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  kind: string;
}

interface Variant {
  id?: string;
  name: string;
  priceDelta: number;
  isDefault: boolean;
}

interface MenuItem {
  id: string;
  name: string;
  categoryId: string;
  category?: { id: string; name: string };
  description: string | null;
  basePrice: number;
  imageUrl: string | null;
  isActive: boolean;
  prepStation: string;
  estimatedPrepMinutes: number;
  sortOrder: number;
  sku: string | null;
  variants: Variant[];
  menuItemModifierGroups?: { modifierGroup: { id: string; name: string; modifiers: { name: string }[] } }[];
}

interface ModifierGroup {
  id: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  isRequired: boolean;
  modifiers: { name: string }[];
  menuItemModifierGroups?: unknown[];
}

const PREP_STATIONS = [
  { value: 'KITCHEN', label: 'Cocina' },
  { value: 'BAR', label: 'Bar' },
  { value: 'COLD_STATION', label: 'Estación fría' },
] as const;

export default function EditMenuItemPage() {
  const router = useRouter();
  const params = useParams();
  const menuItemId = params.menuItemId as string;

  // Form state
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [basePricePesos, setBasePricePesos] = useState<number | ''>('');
  const [prepStation, setPrepStation] = useState('KITCHEN');
  const [estimatedPrepMinutes, setEstimatedPrepMinutes] = useState<number | ''>(15);
  const [imageUrl, setImageUrl] = useState('');
  const [sortOrder, setSortOrder] = useState<number | ''>('');
  const [isActive, setIsActive] = useState(true);
  const [variants, setVariants] = useState<Variant[]>([]);

  // UI state
  const [categories, setCategories] = useState<Category[]>([]);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [selectedModifierGroupIds, setSelectedModifierGroupIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [itemRes, catRes, mgRes] = await Promise.all([
          fetch(`/api/admin/restaurant/menu-items/${menuItemId}`),
          fetch('/api/admin/restaurant/categories'),
          fetch('/api/admin/restaurant/modifier-groups'),
        ]);

        if (!itemRes.ok) throw new Error('Item no encontrado');
        const item: MenuItem = await itemRes.json();
        const cats: Category[] = await catRes.json();
        const mgs: ModifierGroup[] = await mgRes.json();
        setCategories(cats);
        setModifierGroups(Array.isArray(mgs) ? mgs : []);

        setName(item.name);
        setCategoryId(item.categoryId);
        setDescription(item.description || '');
        setBasePricePesos(item.basePrice);
        setPrepStation(item.prepStation);
        setEstimatedPrepMinutes(item.estimatedPrepMinutes);
        setImageUrl(item.imageUrl || '');
        setSortOrder(item.sortOrder);
        setIsActive(item.isActive);
        setVariants(item.variants || []);
        const existingIds = (item.menuItemModifierGroups || []).map((mg) => mg.modifierGroup.id);
        setSelectedModifierGroupIds(existingIds);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al cargar');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [menuItemId]);

  function addVariant() {
    setVariants([...variants, { name: '', priceDelta: 0, isDefault: variants.length === 0 }]);
  }

  function updateVariant(idx: number, field: keyof Variant, value: string | number | boolean) {
    const updated = [...variants];
    updated[idx] = { ...updated[idx], [field]: value };
    setVariants(updated);
  }

  function removeVariant(idx: number) {
    setVariants(variants.filter((_, i) => i !== idx));
  }

  async function handleSave(e: React.FormEvent) {
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
      setError('El precio base es requerido.');
      return;
    }

    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        categoryId,
        description: description.trim() || null,
        basePrice: Math.round(Number(basePricePesos) * 100),
        prepStation,
        estimatedPrepMinutes: estimatedPrepMinutes !== '' ? Number(estimatedPrepMinutes) : 15,
        imageUrl: imageUrl.trim() || null,
        sortOrder: sortOrder !== '' ? Number(sortOrder) : 0,
        isActive,
        variants: variants
          .filter((v) => v.name.trim())
          .map((v) => ({
            name: v.name.trim(),
            priceDelta: Math.round(v.priceDelta * 100),
            isDefault: v.isDefault,
          })),
        modifierGroupIds: selectedModifierGroupIds,
      };

      const res = await fetch(`/api/admin/restaurant/menu-items/${menuItemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `Error ${res.status}`);
      }

      router.push('/admin/restaurant/menu-items');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('¿Desactivar este item?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/restaurant/menu-items/${menuItemId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error al desactivar');
      router.push('/admin/restaurant/menu-items');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-500">Cargando item...</p>
      </div>
    );
  }

  if (error && !name) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Link href="/admin/restaurant/menu-items" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          ← Volver al menú
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-2xl">
        <div className="mb-6">
          <Link href="/admin/restaurant/menu-items" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            ← Volver al menú
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Editar item: {name}</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSave} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría <span className="text-red-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.kind === 'FOOD' ? 'Comida' : 'Bebida'})
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Price + Prep time */}
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
                    onChange={(e) => setBasePricePesos(e.target.value === '' ? '' : Number(e.target.value))}
                    min={0}
                    step={0.01}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">En pesos MXN</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo estimado</label>
                <div className="relative">
                  <input
                    type="number"
                    value={estimatedPrepMinutes}
                    onChange={(e) => setEstimatedPrepMinutes(e.target.value === '' ? '' : Number(e.target.value))}
                    min={1}
                    className="w-full pr-14 pl-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">min</span>
                </div>
              </div>
            </div>

            {/* Prep station */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estación de preparación</label>
              <select
                value={prepStation}
                onChange={(e) => setPrepStation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {PREP_STATIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
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

            {/* Active toggle + Sort order */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Activo</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value === '' ? '' : Number(e.target.value))}
                  min={0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Variants */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Variantes</label>
                <button
                  type="button"
                  onClick={addVariant}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  + Añadir variante
                </button>
              </div>
              {variants.length === 0 ? (
                <p className="text-xs text-gray-400">Sin variantes. Ej: "Chico", "Grande"</p>
              ) : (
                <div className="space-y-2">
                  {variants.map((v, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <input
                        type="text"
                        value={v.name}
                        onChange={(e) => updateVariant(idx, 'name', e.target.value)}
                        placeholder="Nombre"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <div className="relative w-24">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                        <input
                          type="number"
                          value={v.priceDelta}
                          onChange={(e) => updateVariant(idx, 'priceDelta', Number(e.target.value))}
                          step={0.01}
                          className="w-full pl-5 pr-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <label className="flex items-center gap-1 text-xs text-gray-500">
                        <input
                          type="checkbox"
                          checked={v.isDefault}
                          onChange={(e) => updateVariant(idx, 'isDefault', e.target.checked)}
                          className="w-3 h-3"
                        />
                        Default
                      </label>
                      <button
                        type="button"
                        onClick={() => removeVariant(idx)}
                        className="text-red-400 hover:text-red-600 text-xs px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
            )}

            {/* ── Modifier Groups ── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Modificadores</label>
                <Link href="/admin/restaurant/modifier-groups" className="text-xs text-blue-600 hover:text-blue-800">
                  Gestionar grupos →
                </Link>
              </div>
              {modifierGroups.length === 0 ? (
                <p className="text-xs text-gray-400">
                  No hay grupos de modificadores.{' '}
                  <Link href="/admin/restaurant/modifier-groups" className="text-blue-600 underline">Crear grupos</Link>
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {modifierGroups.map((mg) => {
                    const isSelected = selectedModifierGroupIds.includes(mg.id);
                    return (
                      <label
                        key={mg.id}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedModifierGroupIds((prev) =>
                              prev.includes(mg.id) ? prev.filter((id) => id !== mg.id) : [...prev, mg.id]
                            );
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{mg.name}</p>
                          <p className="text-xs text-gray-400">
                            {mg.modifiers?.length || 0} opciones
                            {mg.isRequired && ' · Obligatorio'}
                            {mg.minSelections > 0 && ` · Mín ${mg.minSelections}`}
                            {mg.maxSelections > 1 && ` · Máx ${mg.maxSelections}`}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Link
                href="/admin/restaurant/menu-items"
                className="px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 border border-red-200 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
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
      </div>
    </div>
  );
}
