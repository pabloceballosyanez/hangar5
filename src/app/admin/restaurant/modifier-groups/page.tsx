'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Modifier {
  id: string;
  name: string;
  priceDelta: number;
}

interface ModifierGroup {
  id: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  isRequired: boolean;
  modifiers: Modifier[];
}

export default function ModifierGroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<ModifierGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadGroups();
  }, []);

  async function loadGroups() {
    try {
      const res = await fetch('/api/admin/restaurant/modifier-groups');
      if (!res.ok) throw new Error('Error al cargar grupos');
      const data = await res.json();
      setGroups(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(group: ModifierGroup) {
    if (group.modifiers.length > 0) {
      if (!confirm(`¿Eliminar el grupo "${group.name}" y sus ${group.modifiers.length} modificadores?`)) return;
    } else {
      if (!confirm(`¿Eliminar el grupo "${group.name}"?`)) return;
    }

    setDeletingId(group.id);
    try {
      const res = await fetch(`/api/admin/restaurant/modifier-groups/${group.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Error al eliminar');
      }
      setGroups((prev) => prev.filter((g) => g.id !== group.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-adp-info)] mx-auto mb-4" />
        <p className="text-[var(--color-adp-tinta-2)]">Cargando grupos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-adp-tinta)]">Modificadores</h1>
        <Link
          href="/admin/restaurant/modifier-groups/nuevo"
          className="px-4 py-2 bg-[var(--color-adp-pino)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-adp-pino-hondo)] transition-colors"
        >
          + Nuevo grupo
        </Link>
      </div>

      {error && (
        <div className="p-3 bg-[var(--color-adp-urgente)] border border-[var(--color-adp-urgente)] rounded-lg text-sm text-white">{error}</div>
      )}

      {groups.length === 0 && !loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-[var(--color-adp-borde)] p-8 text-center">
          <p className="text-[var(--color-adp-tinta-2)] text-lg mb-2">No hay grupos de modificadores</p>
          <p className="text-[var(--color-adp-tinta-2)] text-sm">
            Crea tu primer grupo de modificadores para personalizar los platillos.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-[var(--color-adp-borde)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-adp-borde)] bg-[var(--color-adp-papel-3)]">
                  <th className="text-left py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs tracking-wider">
                    Nombre
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs tracking-wider">
                    Mín / Máx
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs tracking-wider">
                    Requerido
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs tracking-wider">
                    Modificadores
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-adp-borde)]">
                {groups.map((group) => (
                  <tr key={group.id} className="hover:bg-[var(--color-adp-papel-3)] transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-medium text-[var(--color-adp-tinta)]">{group.name}</p>
                    </td>
                    <td className="py-3 px-4 text-center text-[var(--color-adp-tinta-2)]">
                      {group.minSelections} / {group.maxSelections}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          group.isRequired ? 'bg-[var(--color-adp-atencion)]' : 'bg-[var(--color-adp-borde)]'
                        } text-white`}
                      />
                    </td>
                    <td className="py-3 px-4 text-center text-[var(--color-adp-tinta-2)]">
                      {group.modifiers.length}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/restaurant/modifier-groups/${group.id}`}
                          className="text-[var(--color-adp-pino)] hover:text-[var(--color-adp-info)] text-sm font-medium"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDelete(group)}
                          disabled={deletingId === group.id}
                          className="text-[var(--color-adp-urgente)] hover:text-[var(--color-adp-urgente)] text-sm font-medium disabled:opacity-50"
                        >
                          {deletingId === group.id ? 'Eliminando...' : 'Eliminar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
