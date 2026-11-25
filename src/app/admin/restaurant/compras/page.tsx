'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Compras — lo que se compró, a quién y cuándo.
 *
 * Pablo: "me gustaría un módulo de compras para ir cuadrando todo. Hoy no
 * sabría dónde ver lo que hemos comprado y que ello quede registrado".
 *
 * Antes cada insumo se movía suelto y no había forma de ver una compra
 * completa. Aquí una compra agrupa sus renglones con folio, proveedor y
 * fecha. Tres formas de capturar:
 *
 *   TICKET   se escanea la foto y el modelo saca los renglones
 *   MANUAL   varios renglones escritos a mano (el proveedor sin ticket)
 *   RAPIDA   un solo insumo, en dos toques
 */

interface Proveedor {
  id: string;
  nombre: string;
  telefono: string | null;
  compras: number;
}

interface Compra {
  id: string;
  folio: string;
  fecha: string;
  proveedor: string;
  origen: string;
  total: number;
  notas: string | null;
  renglones: { descripcion: string; cantidad: number; unidad: string }[];
}

interface Almacen {
  id: string;
  nombre: string;
  clave?: string;
}

interface Insumo {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  cost: number;
}

interface Renglon {
  ingredientId: string;
  cantidad: string;
  costoUnitario: string;
}

function precio(n: number) {
  return `$${n.toFixed(2)}`;
}

const ORIGEN: Record<string, string> = {
  TICKET: 'Foto del ticket',
  MANUAL: 'Manual',
  RAPIDA: 'Captura rápida',
};

export default function ComprasPage() {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [cargando, setCargando] = useState(true);

  /* Formulario */
  const [abierto, setAbierto] = useState(false);
  const [proveedorId, setProveedorId] = useState('');
  const [proveedorNombre, setProveedorNombre] = useState('');
  const [almacenId, setAlmacenId] = useState('');
  const [notas, setNotas] = useState('');
  const [renglones, setRenglones] = useState<Renglon[]>([{ ingredientId: '', cantidad: '', costoUnitario: '' }]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nuevoProveedor, setNuevoProveedor] = useState('');

  /* Buscador de insumo por renglón */
  const [busqueda, setBusqueda] = useState<Record<number, string>>({});

  const cargar = useCallback(async () => {
    try {
      const [c, p, a, i] = await Promise.all([
        fetch('/api/admin/restaurant/compras?limit=50'),
        fetch('/api/admin/restaurant/proveedores'),
        fetch('/api/admin/restaurant/almacenes'),
        fetch('/api/admin/restaurant/ingredients'),
      ]);
      if (c.ok) setCompras(await c.json());
      if (p.ok) setProveedores(await p.json());
      if (a.ok) {
        const d = await a.json();
        const lista = d.almacenes ?? d;
        setAlmacenes(Array.isArray(lista) ? lista : []);
        const cocina = (Array.isArray(lista) ? lista : []).find(
          (x: Almacen) => (x.clave ?? '').includes('cocina')
        );
        if (cocina) setAlmacenId((prev) => prev || cocina.id);
      }
      if (i.ok) {
        const d = await i.json();
        const lista = Array.isArray(d) ? d : d.ingredients ?? [];
        setInsumos(lista.filter((x: Insumo) => x.name));
      }
    } catch { /* sin datos */ }
    setCargando(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const totalFormulario = renglones.reduce((s, r) => {
    const c = parseFloat(r.cantidad) || 0;
    const cu = parseFloat(r.costoUnitario) || 0;
    return s + c * cu;
  }, 0);

  function actualizarRenglon(i: number, campo: keyof Renglon, valor: string) {
    setRenglones((prev) => prev.map((r, idx) => (idx === i ? { ...r, [campo]: valor } : r)));
  }

  async function crearProveedor() {
    if (!nuevoProveedor.trim()) return;
    try {
      const r = await fetch('/api/admin/restaurant/proveedores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nuevoProveedor.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'No se pudo crear');
      setProveedores((prev) => [...prev, { ...d, compras: 0 }].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setProveedorId(d.id);
      setNuevoProveedor('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el proveedor');
    }
  }

  async function guardar() {
    setError(null);
    const limpios = renglones.filter((r) => r.ingredientId && parseFloat(r.cantidad) > 0);
    if (limpios.length === 0) {
      setError('Agrega al menos un insumo con cantidad.');
      return;
    }
    if (!almacenId) {
      setError('Elige el almacén donde entra la compra.');
      return;
    }

    setGuardando(true);
    try {
      const r = await fetch('/api/admin/restaurant/compras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proveedorId: proveedorId || null,
          proveedorNombre: proveedorId ? null : proveedorNombre || null,
          almacenId,
          notas: notas || null,
          origen: 'MANUAL',
          renglones: limpios.map((x) => ({
            ingredientId: x.ingredientId,
            cantidad: parseFloat(x.cantidad),
            /* La pantalla trabaja en pesos; la API en centavos. */
            costoUnitario: Math.round((parseFloat(x.costoUnitario) || 0) * 100),
          })),
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'No se pudo registrar');

      setAbierto(false);
      setRenglones([{ ingredientId: '', cantidad: '', costoUnitario: '' }]);
      setNotas('');
      setProveedorId('');
      setProveedorNombre('');
      setBusqueda({});
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo registrar');
    } finally {
      setGuardando(false);
    }
  }

  const insumosFiltrados = (i: number) => {
    const q = (busqueda[i] ?? '').toLowerCase().trim();
    const lista = q
      ? insumos.filter((x) => x.name.toLowerCase().includes(q))
      : insumos;
    return lista.slice(0, 40);
  };

  if (cargando) {
    return <div className="p-6 text-sm text-[var(--color-adp-tinta-2)]">Cargando compras…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-adp-tinta)]">Compras</h1>
          <p className="text-sm text-[var(--color-adp-tinta-2)] mt-1">
            {compras.length} compras registradas
          </p>
        </div>
        <button
          onClick={() => { setAbierto(true); setError(null); }}
          className="px-4 py-2 bg-[var(--color-adp-pino)] hover:bg-[var(--color-adp-pino-hondo)] text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Nueva compra
        </button>
      </div>

      {/* ─── Formulario ─── */}
      {abierto && (
        <div className="bg-white border border-[var(--color-adp-borde)] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--color-adp-tinta)]">Nueva compra</h2>
            <button onClick={() => setAbierto(false)} className="text-xs text-[var(--color-adp-tinta-2)] hover:underline">
              Cancelar
            </button>
          </div>

          {error && (
            <p className="text-sm text-white bg-[var(--color-adp-urgente)] p-3 rounded-lg">{error}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--color-adp-tinta-2)] mb-1">Proveedor</label>
              <select
                value={proveedorId}
                onChange={(e) => setProveedorId(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm bg-white"
              >
                <option value="">— Sin registrar —</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
              {!proveedorId && (
                <div className="flex gap-1 mt-1.5">
                  <input
                    type="text"
                    value={proveedorNombre}
                    onChange={(e) => setProveedorNombre(e.target.value)}
                    placeholder="Escribe el nombre a mano"
                    className="flex-1 px-2 py-1 border border-[var(--color-adp-borde-2)] rounded text-xs"
                  />
                  {proveedorNombre.trim() && (
                    <button
                      onClick={crearProveedor}
                      className="px-2 py-1 bg-[var(--color-adp-pino)] text-white rounded text-xs"
                      title="Guardarlo como proveedor para la próxima"
                    >
                      Guardar
                    </button>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs text-[var(--color-adp-tinta-2)] mb-1">¿En qué almacén entra?</label>
              <select
                value={almacenId}
                onChange={(e) => setAlmacenId(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm bg-white"
              >
                {almacenes.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Renglones */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--color-adp-tinta)]">Qué se compró</p>
            {renglones.map((r, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-12 sm:col-span-6">
                  <input
                    type="text"
                    value={busqueda[i] ?? ''}
                    onChange={(e) => setBusqueda((prev) => ({ ...prev, [i]: e.target.value }))}
                    placeholder="Buscar insumo…"
                    className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm"
                  />
                  <select
                    value={r.ingredientId}
                    onChange={(e) => actualizarRenglon(i, 'ingredientId', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm bg-white"
                    size={busqueda[i] ? 5 : 1}
                  >
                    <option value="">— Elige insumo —</option>
                    {insumosFiltrados(i).map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name} ({x.unit})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <input
                    type="number"
                    step="0.001"
                    value={r.cantidad}
                    onChange={(e) => actualizarRenglon(i, 'cantidad', e.target.value)}
                    placeholder="Cant."
                    className="w-full px-2 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm"
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <input
                    type="number"
                    step="0.01"
                    value={r.costoUnitario}
                    onChange={(e) => actualizarRenglon(i, 'costoUnitario', e.target.value)}
                    placeholder="$/unidad"
                    className="w-full px-2 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm"
                  />
                </div>
                <div className="col-span-3 sm:col-span-1 text-right text-sm font-medium pt-2">
                  {precio((parseFloat(r.cantidad) || 0) * (parseFloat(r.costoUnitario) || 0))}
                </div>
                <div className="col-span-1 pt-1">
                  {renglones.length > 1 && (
                    <button
                      onClick={() => setRenglones((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-[var(--color-adp-urgente)] text-xs"
                      title="Quitar renglón"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              onClick={() => setRenglones((prev) => [...prev, { ingredientId: '', cantidad: '', costoUnitario: '' }])}
              className="text-xs text-[var(--color-adp-pino)] hover:underline"
            >
              + Agregar otro insumo
            </button>
          </div>

          <div>
            <label className="block text-xs text-[var(--color-adp-tinta-2)] mb-1">Notas (opcional)</label>
            <input
              type="text"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej. sin ticket, pagado en efectivo"
              className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[var(--color-adp-borde)]">
            <p className="text-sm text-[var(--color-adp-tinta-2)]">
              Total: <span className="font-bold text-[var(--color-adp-tinta)]">{precio(totalFormulario)}</span>
            </p>
            <button
              onClick={guardar}
              disabled={guardando}
              className="px-5 py-2.5 bg-[var(--color-adp-pino)] hover:bg-[var(--color-adp-pino-hondo)] disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {guardando ? 'Guardando…' : 'Registrar compra'}
            </button>
          </div>
        </div>
      )}

      {/* ─── Historial ─── */}
      {compras.length === 0 ? (
        <div className="bg-white border border-[var(--color-adp-borde)] rounded-xl p-8 text-center">
          <p className="text-sm text-[var(--color-adp-tinta-2)]">
            Todavía no hay compras registradas.
          </p>
          <p className="text-xs text-[var(--color-adp-tinta-2)] mt-1">
            Registra la primera con el botón de arriba.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {compras.map((c) => (
            <div key={c.id} className="bg-white border border-[var(--color-adp-borde)] rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-[var(--color-adp-tinta-2)]">{c.folio}</span>
                    <span className="font-medium text-sm text-[var(--color-adp-tinta)]">{c.proveedor}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-adp-papel-3)] text-[var(--color-adp-tinta-2)]">
                      {ORIGEN[c.origen] ?? c.origen}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-adp-tinta-2)] mt-0.5">
                    {new Date(c.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {' · '}{c.renglones.length} insumos
                  </p>
                </div>
                <p className="text-base font-bold text-[var(--color-adp-pino-hondo)]">{precio(c.total)}</p>
              </div>
              <div className="mt-2 pt-2 border-t border-[var(--color-adp-borde)] space-y-0.5">
                {c.renglones.map((r, i) => (
                  <p key={i} className="text-xs text-[var(--color-adp-tinta-2)]">
                    {r.descripcion} — {r.cantidad} {r.unidad}
                  </p>
                ))}
              </div>
              {c.notas && (
                <p className="text-[11px] text-[var(--color-adp-tinta-2)] mt-1 italic">{c.notas}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
