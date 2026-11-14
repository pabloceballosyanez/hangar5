'use client';

import { useEffect, useState } from 'react';

/**
 * Qué se vende en cada ubicación.
 *
 * Una tabla con un checkbox por punto de venta. Lo que se marque aquí
 * es lo que aparece en el menú de esa ubicación y lo que se puede
 * pedir en línea para recoger ahí.
 *
 * El restaurante viene con todo marcado y el café vacío: así el café
 * arranca sin nada y se va armando a mano, que es lo que se quiere.
 */

interface Ubicacion {
  id: string;
  clave: string;
  nombre: string;
}

interface Platillo {
  id: string;
  nombre: string;
  precio: number;
  categoria: string;
  ubicaciones: Record<string, boolean>;
}

const pesos = (centavos: number) =>
  `$${(centavos / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

export default function UbicacionesPage() {
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [items, setItems] = useState<Platillo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('');
  const [guardando, setGuardando] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/ubicaciones?items=1')
      .then((r) => r.json())
      .then((d) => {
        setUbicaciones(d.ubicaciones ?? []);
        setItems(d.items ?? []);
        setCargando(false);
      })
      .catch(() => {
        setError('No se pudo cargar');
        setCargando(false);
      });
  }, []);

  async function alternar(platilloId: string, ubicacionId: string, valor: boolean) {
    setGuardando(`${platilloId}:${ubicacionId}`);
    setError('');

    // Optimista: se pinta de inmediato y se revierte si falla.
    setItems((prev) =>
      prev.map((p) =>
        p.id === platilloId
          ? { ...p, ubicaciones: { ...p.ubicaciones, [ubicacionId]: valor } }
          : p
      )
    );

    try {
      const r = await fetch('/api/admin/ubicaciones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuItemId: platilloId, ubicacionId, disponible: valor }),
      });
      if (!r.ok) throw new Error();
    } catch {
      setError('No se guardó el cambio');
      setItems((prev) =>
        prev.map((p) =>
          p.id === platilloId
            ? { ...p, ubicaciones: { ...p.ubicaciones, [ubicacionId]: !valor } }
            : p
        )
      );
    } finally {
      setGuardando(null);
    }
  }

  const visibles = items.filter((i) =>
    filtro
      ? i.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
        i.categoria.toLowerCase().includes(filtro.toLowerCase())
      : true
  );

  const cafe = ubicaciones.find((u) => u.clave === 'cafe');
  const cuantosEnCafe = cafe
    ? items.filter((i) => i.ubicaciones[cafe.id]).length
    : 0;

  if (cargando) {
    return <div className="p-8 text-center text-gray-500">Cargando…</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ubicaciones</h1>
        <p className="text-sm text-gray-500 mt-1">
          Marca qué se vende en cada punto. El restaurante tiene todo; el café
          solo lo que marques.
        </p>
      </div>

      {error && (
        <p className="text-sm text-[#b03a2e] bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>
      )}

      <div className="flex flex-wrap gap-3 items-center mb-4">
        <input
          type="search"
          placeholder="Buscar platillo o categoría…"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="flex-1 min-w-[220px] px-3 py-2 text-sm border border-gray-300 rounded-lg"
        />
        <span className="text-sm text-gray-500">
          {cuantosEnCafe} de {items.length} en el café
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Platillo</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Categoría</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">Precio</th>
              {ubicaciones.map((u) => (
                <th key={u.id} className="text-center px-4 py-2 font-medium text-gray-600">
                  {u.nombre}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibles.map((p) => (
              <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-900">{p.nombre}</td>
                <td className="px-4 py-2 text-gray-500">{p.categoria}</td>
                <td className="px-4 py-2 text-right text-gray-700">{pesos(p.precio)}</td>
                {ubicaciones.map((u) => {
                  const activo = p.ubicaciones[u.id] ?? false;
                  const ocupado = guardando === `${p.id}:${u.id}`;
                  return (
                    <td key={u.id} className="px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={activo}
                        disabled={ocupado}
                        onChange={(e) => alternar(p.id, u.id, e.target.checked)}
                        className="w-4 h-4 accent-[#1b4235] disabled:opacity-40"
                        aria-label={`${p.nombre} en ${u.nombre}`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
            {visibles.length === 0 && (
              <tr>
                <td colSpan={3 + ubicaciones.length} className="px-4 py-6 text-center text-gray-500">
                  Ningún platillo coincide.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
