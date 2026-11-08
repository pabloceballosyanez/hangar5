'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Inventario por almacén.
 *
 * El café y el restaurante llevan su cuenta por separado. Lo que se mueve
 * entre ellos es un traspaso: sale de uno y entra en otro, nunca se crea
 * mercancía.
 */

interface Almacen {
  id: string;
  clave: string;
  nombre: string;
}

interface Existencia {
  cantidad: number;
  minimo: number;
  bajo: boolean;
}

interface Fila {
  id: string;
  nombre: string;
  unidad: string;
  porAlmacen: Record<string, Existencia>;
}

interface Traspaso {
  id: string;
  folio: string;
  insumo: string;
  unidad: string;
  cantidad: number;
  origen: string;
  destino: string;
  actor: string | null;
  notas: string | null;
  fecha: string;
}

const num = (n: number) => Number(n.toFixed(2));

export default function PaginaAlmacenes() {
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [filas, setFilas] = useState<Fila[]>([]);
  const [traspasos, setTraspasos] = useState<Traspaso[]>([]);
  const [busca, setBusca] = useState('');
  const [error, setError] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/restaurant/almacenes');
      if (!r.ok) throw new Error();
      const d = await r.json();
      setAlmacenes(d.almacenes ?? []);
      setFilas(d.filas ?? []);
      setTraspasos(d.traspasos ?? []);
      setError('');
    } catch {
      setError('No se pudo cargar el inventario');
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const visibles = useMemo(() => {
    const f = busca.trim().toLowerCase();
    return f ? filas.filter((x) => x.nombre.toLowerCase().includes(f)) : filas;
  }, [filas, busca]);

  async function mover(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setGuardando(true);
    setError('');
    try {
      const r = await fetch('/api/admin/restaurant/almacenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredientId: fd.get('ingredientId'),
          origenClave: fd.get('origen'),
          destinoClave: fd.get('destino'),
          cantidad: Number(fd.get('cantidad')),
          notas: (fd.get('notas') as string) || undefined,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(d.error ?? 'No se pudo traspasar');
        return;
      }
      setAbierto(false);
      await cargar();
    } catch {
      setError('No se pudo conectar');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Almacenes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Cada punto lleva su inventario. Lo que se mueve entre ellos es un traspaso.
          </p>
        </div>
        <button
          onClick={() => setAbierto((v) => !v)}
          className="px-4 py-2 bg-[#1b4235] text-white text-sm font-medium rounded-lg hover:bg-[#15352a]"
        >
          {abierto ? 'Cancelar' : 'Traspasar'}
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-[#b03a2e] bg-[#b03a2e]/10 rounded-lg px-3 py-2">{error}</p>}

      {abierto && (
        <form onSubmit={mover} className="bg-white border border-gray-200 rounded-xl p-5 mb-5 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs text-gray-500 mb-1">Insumo</span>
              <select name="ingredientId" required className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg">
                {filas.map((f) => (
                  <option key={f.id} value={f.id}>{f.nombre} ({f.unidad})</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs text-gray-500 mb-1">Cantidad</span>
              <input name="cantidad" type="number" step="0.01" min="0.01" required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" />
            </label>
            <label className="block">
              <span className="block text-xs text-gray-500 mb-1">De</span>
              <select name="origen" required className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg">
                {almacenes.map((a) => <option key={a.clave} value={a.clave}>{a.nombre}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs text-gray-500 mb-1">A</span>
              <select name="destino" required className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg">
                {almacenes.map((a) => <option key={a.clave} value={a.clave}>{a.nombre}</option>)}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="block text-xs text-gray-500 mb-1">Nota (opcional)</span>
            <input name="notas" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" />
          </label>
          <button type="submit" disabled={guardando}
            className="px-4 py-2 bg-[#C9A44F] text-[#0B0B0B] text-sm font-semibold rounded-lg disabled:opacity-40">
            {guardando ? 'Moviendo…' : 'Traspasar'}
          </button>
        </form>
      )}

      <input
        type="search"
        placeholder="Buscar insumo…"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="w-full mb-4 px-4 py-2.5 text-sm border border-gray-300 rounded-lg"
      />

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Insumo</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase">Unidad</th>
              {almacenes.map((a) => (
                <th key={a.id} className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase">
                  {a.nombre}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visibles.map((f) => (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="py-2.5 px-4 text-gray-900">{f.nombre}</td>
                <td className="py-2.5 px-4 text-right text-gray-500">{f.unidad}</td>
                {almacenes.map((a) => {
                  const e = f.porAlmacen[a.clave];
                  return (
                    <td key={a.id} className={`py-2.5 px-4 text-right tabular-nums ${
                      e?.bajo ? 'text-[#b03a2e] font-semibold' : 'text-gray-900'
                    }`}>
                      {num(e?.cantidad ?? 0)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {visibles.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-8">Sin insumos que coincidan</p>
        )}
      </div>

      <h2 className="text-sm font-semibold text-gray-900 mb-2">Últimos traspasos</h2>
      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
        {traspasos.length === 0 && (
          <p className="text-sm text-gray-400 px-4 py-6 text-center">Todavía no hay traspasos</p>
        )}
        {traspasos.map((t) => (
          <div key={t.id} className="px-4 py-3 flex items-center gap-3 text-sm">
            <span className="font-mono text-xs text-gray-400">{t.folio}</span>
            <span className="text-gray-900 flex-1">
              {num(t.cantidad)} {t.unidad} de <b>{t.insumo}</b>
            </span>
            <span className="text-gray-500 text-xs">
              {t.origen} → {t.destino}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
