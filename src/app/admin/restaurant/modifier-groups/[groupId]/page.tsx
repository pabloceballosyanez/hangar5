'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Modifier {
  id: string;
  name: string;
  priceDelta: number; // pesos from API
}

interface ModifierGroup {
  id: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  isRequired: boolean;
  modifiers: Modifier[];
}

export default function ModifierGroupPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = (params.groupId as string) || '';

  const isNew = groupId === 'nuevo';

  // Group form state
  const [name, setName] = useState('');
  const [minSelections, setMinSelections] = useState(0);
  const [maxSelections, setMaxSelections] = useState(1);
  const [isRequired, setIsRequired] = useState(false);

  // Modifier list state
  const [modifiers, setModifiers] = useState<Modifier[]>([]);

  // New modifier inline form
  const [newModName, setNewModName] = useState('');
  const [newModPrice, setNewModPrice] = useState('');

  // UI state
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [addingMod, setAddingMod] = useState(false);
  const [deletingModId, setDeletingModId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isNew) loadGroup();
  }, [groupId]);

  async function loadGroup() {
    try {
      const res = await fetch(`/api/admin/restaurant/modifier-groups/${groupId}`);
      if (!res.ok) throw new Error('Grupo no encontrado');
      const data: ModifierGroup = await res.json();
      setName(data.name);
      setMinSelections(data.minSelections);
      setMaxSelections(data.maxSelections);
      setIsRequired(data.isRequired);
      setModifiers(data.modifiers || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }

  // ─── Save group (create or update) ─────────────────────────────────────────
  async function handleSaveGroup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const body = {
        name: name.trim(),
        minSelections: Number(minSelections),
        maxSelections: Number(maxSelections),
        isRequired,
      };

      if (isNew) {
        const res = await fetch('/api/admin/restaurant/modifier-groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || 'Error al crear');
        }
        const data = await res.json();
        router.push(`/admin/restaurant/modifier-groups/${data.id}`);
      } else {
        const res = await fetch(`/api/admin/restaurant/modifier-groups/${groupId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || 'Error al guardar');
        }
        // Refresh modifier list in case PUT returned updated data
        await loadGroup();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  // ─── Delete entire group ───────────────────────────────────────────────────
  async function handleDeleteGroup() {
    if (!confirm(`¿Eliminar el grupo "${name}" y todos sus modificadores?`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/restaurant/modifier-groups/${groupId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Error al eliminar');
      }
      router.push('/admin/restaurant/modifier-groups');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar');
    }
  }

  // ─── Add a modifier to this group ──────────────────────────────────────────
  async function handleAddModifier(e: React.FormEvent) {
    e.preventDefault();
    if (!newModName.trim()) return;

    setError(null);
    setAddingMod(true);

    try {
      const newPriceDelta = newModPrice ? parseFloat(newModPrice) : 0;

      const res = await fetch(`/api/admin/restaurant/modifier-groups/${groupId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newModName.trim(),
          priceDelta: newPriceDelta,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(typeof d.error === 'string' ? d.error : 'Error al agregar modificador');
      }

      const data: ModifierGroup = await res.json();
      setModifiers(data.modifiers || []);
      setNewModName('');
      setNewModPrice('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al agregar');
    } finally {
      setAddingMod(false);
    }
  }

  // ─── Delete a single modifier ──────────────────────────────────────────────
  async function handleDeleteModifier(modifier: Modifier) {
    if (!confirm(`¿Eliminar el modificador "${modifier.name}"?`)) return;

    setDeletingModId(modifier.id);
    setError(null);

    try {
      const res = await fetch(`/api/admin/restaurant/modifier-groups/${groupId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modifierId: modifier.id }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(typeof d.error === 'string' ? d.error : 'Error al eliminar modificador');
      }

      const data: ModifierGroup = await res.json();
      setModifiers(data.modifiers || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar');
    } finally {
      setDeletingModId(null);
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-500">Cargando grupo...</p>
      </div>
    );
  }

  if (error && !name && !isNew) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Link
          href="/admin/restaurant/modifier-groups"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Volver a modificadores
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/restaurant/modifier-groups"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Volver a modificadores
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          {isNew ? 'Nuevo grupo de modificadores' : `Editar: ${name}`}
        </h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* Group form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <form onSubmit={handleSaveGroup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder='Ej: "Término de la carne", "Extras"'
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selección mínima
              </label>
              <input
                type="number"
                value={minSelections}
                onChange={(e) => setMinSelections(Math.max(0, parseInt(e.target.value) || 0))}
                min={0}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selección máxima
              </label>
              <input
                type="number"
                value={maxSelections}
                onChange={(e) => setMaxSelections(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isRequired"
              checked={isRequired}
              onChange={(e) => setIsRequired(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="isRequired" className="text-sm font-medium text-gray-700">
              Requerido
            </label>
            <span className="text-xs text-gray-400">
              (el cliente debe seleccionar al menos una opción)
            </span>
          </div>

          <div className="flex gap-3 pt-2">
            <Link
              href="/admin/restaurant/modifier-groups"
              className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              {isNew ? 'Cancelar' : 'Volver'}
            </Link>
            {!isNew && (
              <button
                type="button"
                onClick={handleDeleteGroup}
                className="px-4 py-2 border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
              >
                Eliminar grupo
              </button>
            )}
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Guardando...' : isNew ? 'Crear grupo' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>

      {/* Modifiers section (only for existing groups) */}
      {!isNew && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Modificadores ({modifiers.length})
          </h2>

          {/* Add modifier form */}
          <form onSubmit={handleAddModifier} className="flex gap-3 mb-4 pb-4 border-b border-gray-100">
            <div className="flex-1">
              <input
                type="text"
                value={newModName}
                onChange={(e) => setNewModName(e.target.value)}
                placeholder="Nombre del modificador"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="w-28">
              <input
                type="number"
                step="0.01"
                value={newModPrice}
                onChange={(e) => setNewModPrice(e.target.value)}
                placeholder="Precio"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={addingMod || !newModName.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {addingMod ? '...' : '+ Agregar'}
            </button>
          </form>

          {/* Modifiers list */}
          {modifiers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No hay modificadores. Agrega uno usando el formulario de arriba.
            </p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {modifiers.map((mod) => (
                <li key={mod.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{mod.name}</p>
                    <p className="text-xs text-gray-500">
                      {mod.priceDelta === 0
                        ? 'Sin costo adicional'
                        : `+$${mod.priceDelta.toFixed(2)} MXN`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteModifier(mod)}
                    disabled={deletingModId === mod.id}
                    className="text-red-500 hover:text-red-700 text-sm font-medium disabled:opacity-50 transition-colors"
                  >
                    {deletingModId === mod.id ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
