'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Tipos de producto.
 *
 * Un tipo dice qué ES un platillo (Pizza, Refresco, Café) y de ahí
 * hereda sus modificadores. Es distinto de la categoría, que solo
 * agrupa la carta para el cliente.
 *
 * Esta pantalla existe porque la clasificación inicial se hizo con
 * reglas de nombre que nadie ve: aquí se revisa y se corrige.
 */

interface Platillo {
  id: string;
  nombre: string;
  activo: boolean;
  categoria: string;
}

interface Grupo {
  id: string;
  nombre: string;
  opciones: number;
}

interface Tipo {
  id: string;
  nombre: string;
  platillos: Platillo[];
  hereda: Array<{ id: string; nombre: string }>;
}

interface Datos {
  tipos: Tipo[];
  gruposDisponibles: Grupo[];
}

export default function PaginaTipos() {
  const [datos, setDatos] = useState<Datos>({ tipos: [], gruposDisponibles: [] });
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('');
  const [abierto, setAbierto] = useState<string | null>(null);
  const [agregando, setAgregando] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/restaurant/tipos');
      if (!r.ok) throw new Error();
      setDatos(await r.json());
      setError('');
    } catch {
      setError('No se pudieron cargar los tipos');
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const visibles = useMemo(() => {
    if (!filtro.trim()) return datos.tipos;
    const f = filtro.toLowerCase();
    return datos.tipos.filter(
      (t) =>
        t.nombre.toLowerCase().includes(f) ||
        t.platillos.some((p) => p.nombre.toLowerCase().includes(f))
    );
  }, [datos.tipos, filtro]);

  async function heredar(tipoId: string, grupoId: string) {
    setGuardando(true);
    try {
      const r = await fetch('/api/admin/restaurant/tipos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipoId, modifierGroupId: grupoId }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setError(d.error ?? 'No se pudo agregar');
        return;
      }
      setAgregando(null);
      await cargar();
    } catch {
      setError('No se pudo agregar');
    } finally {
      setGuardando(false);
    }
  }

  async function dejarDeHeredar(tipoId: string, grupoId: string, nombre: string) {
    if (!confirm(`¿Quitar "${nombre}" de este tipo? Los platillos dejarán de heredarlo.`)) return;
    setGuardando(true);
    try {
      const r = await fetch(
        `/api/admin/restaurant/tipos?tipoId=${tipoId}&modifierGroupId=${grupoId}`,
        { method: 'DELETE' }
      );
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setError(d.error ?? 'No se pudo quitar');
        return;
      }
      await cargar();
    } catch {
      setError('No se pudo quitar');
    } finally {
      setGuardando(false);
    }
  }

  const totalPlatillos = datos.tipos.reduce((s, t) => s + t.platillos.length, 0);
  const sinHerencia = datos.tipos.filter((t) => t.hereda.length === 0).length;

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Tipos de producto</h1>
        <p className="text-sm text-gray-500 mt-1">
          Un tipo dice qué es un platillo y de ahí hereda sus modificadores. Es distinto
          de la categoría, que solo agrupa la carta.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Tipos</p>
          <p className="text-2xl font-bold text-gray-900">{datos.tipos.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Platillos clasificados</p>
          <p className="text-2xl font-bold text-gray-900">{totalPlatillos}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Sin modificadores</p>
          <p className="text-2xl font-bold text-gray-900">{sinHerencia}</p>
        </div>
      </div>

      <input
        type="search"
        placeholder="Buscar tipo o platillo…"
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        className="w-full mb-4 px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#1b4235]"
      />

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="space-y-2">
        {visibles.map((t) => {
          const expandido = abierto === t.id;
          const disponibles = datos.gruposDisponibles.filter(
            (g) => !t.hereda.some((h) => h.id === g.id)
          );

          return (
            <div key={t.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setAbierto(expandido ? null : t.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
              >
                <span className="text-gray-400 text-xs">{expandido ? '▾' : '▸'}</span>
                <span className="font-medium text-gray-900 flex-1">{t.nombre}</span>
                <span className="text-xs text-gray-500">{t.platillos.length} platillos</span>
                <div className="flex gap-1 flex-wrap justify-end max-w-[45%]">
                  {t.hereda.length === 0 ? (
                    <span className="text-xs text-gray-400">sin modificadores</span>
                  ) : (
                    t.hereda.map((h) => (
                      <span
                        key={h.id}
                        className="text-[11px] bg-[#1b4235]/8 text-[#1b4235] border border-[#1b4235]/20 px-2 py-0.5 rounded-full"
                      >
                        {h.nombre}
                      </span>
                    ))
                  )}
                </div>
              </button>

              {expandido && (
                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50">
                  <div className="mb-3">
                    <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1.5">
                      Platillos de este tipo
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {t.platillos.map((p) => (
                        <span
                          key={p.id}
                          className={`text-xs px-2 py-1 rounded border ${
                            p.activo
                              ? 'bg-white border-gray-200 text-gray-700'
                              : 'bg-gray-100 border-gray-200 text-gray-400 line-through'
                          }`}
                          title={p.categoria}
                        >
                          {p.nombre}
                          <span className="text-gray-400 ml-1">· {p.categoria}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1.5">
                      Modificadores que hereda
                    </p>
                    <div className="space-y-1.5 mb-2">
                      {t.hereda.length === 0 && (
                        <p className="text-xs text-gray-400">Ninguno. Sus platillos no llevan opciones.</p>
                      )}
                      {t.hereda.map((h) => (
                        <div
                          key={h.id}
                          className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2"
                        >
                          <span className="text-sm text-gray-800">{h.nombre}</span>
                          <button
                            onClick={() => dejarDeHeredar(t.id, h.id, h.nombre)}
                            disabled={guardando}
                            className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40 px-2"
                          >
                            Quitar
                          </button>
                        </div>
                      ))}
                    </div>

                    {agregando === t.id ? (
                      <div className="bg-white border border-gray-200 rounded-lg p-2">
                        <select
                          className="w-full text-sm px-2 py-2 border border-gray-200 rounded mb-2"
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) heredar(t.id, e.target.value);
                          }}
                        >
                          <option value="">Elige un grupo…</option>
                          {disponibles.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.nombre} ({g.opciones} opciones)
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => setAgregando(null)}
                          className="text-xs text-gray-500"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      disponibles.length > 0 && (
                        <button
                          onClick={() => setAgregando(t.id)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-white"
                        >
                          + Heredar un grupo
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
