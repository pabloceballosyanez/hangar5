'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Barra del Café del Despegue.
 *
 * ── El flujo del negocio ────────────────────────────────────────────
 *   1. ¿Quién pide?   (nombre, o cliente del Hangar)
 *   2. Productos      (+ modificadores cuando el producto los tiene)
 *   3. Cobrar
 *   4. Preparar → Entregar
 *
 * ── Regla de negocio ────────────────────────────────────────────────
 * Nada entra a preparación sin responsable del dinero: o se cobra en el
 * acto, o se carga a la cuenta de un huésped. El servidor lo impone; la
 * pantalla lo refleja.
 */

interface Opcion { id: string; nombre: string; delta: number; }
interface Grupo {
  id: string; nombre: string; min: number; max: number; obligatorio: boolean;
  opciones: Opcion[];
}
interface Variante { id: string; nombre: string; delta: number; }
interface Producto {
  id: string; nombre: string; precio: number; categoria: string;
  variantes: Variante[]; grupos: Grupo[];
}
interface ItemPedido {
  id: string; cantidad: number; nombre: string;
  variante: string | null; extras: string[]; notas: string | null;
}
interface Pedido {
  id: string; nombre: string; codigo: string | null;
  estado: 'PREPARANDO' | 'LISTO';
  minutos: number; total: number; origen: string;
  notaLibre: string | null; pagado: boolean; aCuenta: boolean;
  items: ItemPedido[];
}
interface Barra { productos: Producto[]; preparando: Pedido[]; listos: Pedido[]; }
interface ClienteHangar { id: string; name: string; email: string | null; }

interface Linea {
  key: string;
  producto: Producto;
  cantidad: number;
  varianteId: string | null;
  modifierIds: string[];
  notas: string;
}

const pesos = (centavos: number) =>
  `$${(centavos / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

const METODOS = [
  { valor: 'CASH', etiqueta: 'Efectivo' },
  { valor: 'CARD', etiqueta: 'Tarjeta' },
  { valor: 'TRANSFER', etiqueta: 'Transferencia' },
  { valor: 'CUENTA', etiqueta: 'A su cuenta' },
] as const;

let contadorLineas = 0;

export default function BarraCafe() {
  const [barra, setBarra] = useState<Barra>({ productos: [], preparando: [], listos: [] });
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [lineaActiva, setLineaActiva] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [metodo, setMetodo] = useState<string>('CASH');
  const [filtro, setFiltro] = useState('');
  const [error, setError] = useState('');
  const [cobrando, setCobrando] = useState(false);
  const [ultimaVenta, setUltimaVenta] = useState<{ nombre: string; total: number } | null>(null);

  const [buscaCliente, setBuscaCliente] = useState('');
  const [sugerencias, setSugerencias] = useState<ClienteHangar[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cargar = useCallback(async () => {
    try {
      const r = await fetch('/api/cafe/barra');
      if (!r.ok) throw new Error();
      setBarra(await r.json());
    } catch {
      /* se reintenta en el siguiente ciclo */
    }
  }, []);

  useEffect(() => {
    cargar();
    const t = setInterval(cargar, 12000);
    return () => clearInterval(t);
  }, [cargar]);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (buscaCliente.trim().length < 2) { setSugerencias([]); return; }
    debounce.current = setTimeout(async () => {
      try {
        const r = await fetch(
          `/api/admin/restaurant/customers?search=${encodeURIComponent(buscaCliente.trim())}`
        );
        if (!r.ok) return;
        const d = await r.json();
        setSugerencias((Array.isArray(d) ? d : d.customers ?? []).slice(0, 6));
      } catch { /* silencioso */ }
    }, 250);
  }, [buscaCliente]);

  const precioLinea = useCallback((l: Linea) => {
    let p = l.producto.precio;
    const v = l.producto.variantes.find((x) => x.id === l.varianteId);
    if (v) p += v.delta;
    for (const g of l.producto.grupos) {
      for (const m of g.opciones) {
        if (l.modifierIds.includes(m.id)) p += m.delta;
      }
    }
    return p * l.cantidad;
  }, []);

  const total = lineas.reduce((s, l) => s + precioLinea(l), 0);
  const activa = lineas.find((l) => l.key === lineaActiva) ?? null;

  const visibles = useMemo(
    () => barra.productos.filter((p) => {
      if (!filtro) return true;
      const f = filtro.toLowerCase();
      return p.nombre.toLowerCase().includes(f) || p.categoria.toLowerCase().includes(f);
    }),
    [barra.productos, filtro]
  );

  const porCategoria = useMemo(() => {
    const g = new Map<string, Producto[]>();
    for (const p of visibles) {
      if (!g.has(p.categoria)) g.set(p.categoria, []);
      g.get(p.categoria)!.push(p);
    }
    return Array.from(g.entries());
  }, [visibles]);

  function agregar(p: Producto) {
    setUltimaVenta(null);
    const key = `l${++contadorLineas}`;
    const nueva: Linea = {
      key, producto: p, cantidad: 1, varianteId: null, modifierIds: [], notas: '',
    };
    setLineas((prev) => [...prev, nueva]);
    // Si el producto tiene opciones, se abre para elegirlas
    if (p.grupos.length > 0 || p.variantes.length > 0) setLineaActiva(key);
  }

  function cambiar(key: string, delta: number) {
    setLineas((prev) =>
      prev.map((l) => (l.key === key ? { ...l, cantidad: l.cantidad + delta } : l))
        .filter((l) => l.cantidad > 0)
    );
  }

  function alternarModificador(key: string, grupo: Grupo, modId: string) {
    setLineas((prev) => prev.map((l) => {
      if (l.key !== key) return l;
      const ya = l.modifierIds.includes(modId);
      const delGrupo = grupo.opciones.map((o) => o.id);
      let ids = l.modifierIds.filter((id) => !delGrupo.includes(id));

      if (ya) {
        ids = l.modifierIds.filter((id) => id !== modId);
      } else if (grupo.max === 1) {
        ids = [...ids, modId];
      } else {
        const actualesDelGrupo = l.modifierIds.filter((id) => delGrupo.includes(id));
        if (actualesDelGrupo.length < grupo.max) ids = [...l.modifierIds, modId];
        else ids = [...ids, modId];
      }
      return { ...l, modifierIds: ids };
    }));
  }

  function limpiar() {
    setLineas([]); setNombre(''); setClienteId(null);
    setBuscaCliente(''); setSugerencias([]); setError(''); setLineaActiva(null);
  }

  async function cobrar() {
    if (lineas.length === 0) return;
    if (!nombre.trim()) { setError('Escribe el nombre de quien pide'); return; }

    // Validar grupos obligatorios antes de mandar
    for (const l of lineas) {
      for (const g of l.producto.grupos) {
        if (!g.obligatorio && g.min === 0) continue;
        const elegidos = l.modifierIds.filter((id) => g.opciones.some((o) => o.id === id));
        if (elegidos.length < g.min) {
          setError(`Falta elegir "${g.nombre}" en ${l.producto.nombre}`);
          setLineaActiva(l.key);
          return;
        }
      }
    }

    setError('');
    setCobrando(true);
    try {
      const r = await fetch('/api/cafe/barra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: lineas.map((l) => ({
            menuItemId: l.producto.id,
            cantidad: l.cantidad,
            variantId: l.varianteId,
            modifierIds: l.modifierIds,
            notas: l.notas || null,
          })),
          metodoPago: metodo,
          clienteNombre: nombre.trim(),
          clienteId,
        }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error ?? 'No se pudo cobrar'); return; }
      setUltimaVenta({ nombre: nombre.trim(), total: d.total * 100 });
      limpiar();
      await cargar();
    } catch {
      setError('No se pudo cobrar');
    } finally {
      setCobrando(false);
    }
  }

  async function avanzar(orderId: string, accion: 'listo' | 'entregar') {
    setError('');
    try {
      const r = await fetch('/api/cafe/pedidos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, accion }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setError(r.status === 401
          ? 'Tu sesión caducó. Vuelve a entrar con tu PIN.'
          : d.error ?? 'No se pudo avanzar el pedido');
        return;
      }
      await cargar();
    } catch {
      setError('Sin conexión. Revisa la red del café.');
    }
  }

  const activos = barra.preparando.length + barra.listos.length;

  return (
    <div className="min-h-screen bg-ink text-snow">
      <header className="border-b border-hair px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl">Café del Despegue</h1>
          <p className="text-xs text-smoke">
            Barra · {activos} {activos === 1 ? 'pedido activo' : 'pedidos activos'}
          </p>
        </div>
        <button onClick={cargar}
          className="text-xs px-3 py-2 rounded-lg border border-hair text-ash hover:text-snow">
          Actualizar
        </button>
      </header>

      {error && (
        <div className="bg-bad/15 border-b border-bad/40 px-4 py-2 text-sm text-bad">{error}</div>
      )}

      <div className="grid lg:grid-cols-[1fr_400px]">
        {/* IZQUIERDA */}
        <div className="p-4 border-r border-hair">
          <section className="mb-4">
            <h2 className="text-xs uppercase tracking-wide text-brass mb-2">1 · ¿Quién pide?</h2>
            <div className="relative">
              <input value={nombre}
                onChange={(e) => { setNombre(e.target.value); setClienteId(null); }}
                placeholder="Nombre de quien pide"
                className="w-full px-4 py-3 rounded-xl bg-ink-2 border border-hair text-snow text-lg placeholder:text-smoke focus:outline-none focus:border-brass/60" />
              {clienteId && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-good">
                  cliente del Hangar
                </span>
              )}
            </div>
            <div className="relative mt-2">
              <input value={buscaCliente}
                onChange={(e) => { setBuscaCliente(e.target.value); setMostrarSugerencias(true); }}
                onFocus={() => setMostrarSugerencias(true)}
                placeholder="…o busca un cliente del Hangar"
                className="w-full px-4 py-2 rounded-lg bg-ink-2 border border-hair text-sm text-ash placeholder:text-smoke focus:outline-none" />
              {mostrarSugerencias && sugerencias.length > 0 && (
                <div className="absolute z-20 mt-1 w-full bg-ink-3 border border-hair rounded-lg overflow-hidden">
                  {sugerencias.map((c) => (
                    <button key={c.id}
                      onClick={() => {
                        setNombre(c.name); setClienteId(c.id);
                        setBuscaCliente(''); setSugerencias([]); setMostrarSugerencias(false);
                      }}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-ink-4">
                      <span className="text-snow">{c.name}</span>
                      {c.email && <span className="text-smoke text-xs ml-2">{c.email}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-wide text-brass mb-2">2 · Productos</h2>
            <input type="search" placeholder="Buscar producto…" value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full mb-3 px-3 py-2 rounded-lg bg-ink-2 border border-hair text-sm text-snow placeholder:text-smoke focus:outline-none" />

            {barra.productos.length === 0 && (
              <p className="text-sm text-smoke bg-ink-2 rounded-xl px-4 py-6 text-center">
                No hay productos marcados para el café. Márcalos en Admin → Ubicaciones.
              </p>
            )}

            {porCategoria.map(([cat, items]) => (
              <div key={cat} className="mb-3">
                <h3 className="text-[11px] uppercase tracking-wide text-smoke mb-1.5">{cat}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {items.map((p) => (
                    <button key={p.id} onClick={() => agregar(p)}
                      className="text-left px-3 py-2.5 rounded-lg bg-ink-2 border border-hair hover:border-brass/50 transition-colors">
                      <span className="block text-sm leading-tight">{p.nombre}</span>
                      <span className="block text-xs text-brass mt-0.5">{pesos(p.precio)}</span>
                      {(p.grupos.length > 0 || p.variantes.length > 0) && (
                        <span className="block text-[10px] text-smoke mt-0.5">con opciones</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </div>

        {/* DERECHA: ticket + opciones */}
        <aside className="p-4 lg:sticky lg:top-0 lg:self-start lg:max-h-screen lg:overflow-y-auto">
          <h2 className="text-xs uppercase tracking-wide text-brass mb-2">3 · Cobrar</h2>

          {ultimaVenta && (
            <div className="mb-3 bg-good/10 border border-good/30 rounded-xl px-3 py-2.5">
              <p className="text-xs text-good">
                Cobrado a <span className="font-medium">{ultimaVenta.nombre}</span> ·{' '}
                {pesos(ultimaVenta.total)}
              </p>
              <p className="text-[11px] text-smoke mt-0.5">Ya está abajo, en preparación</p>
            </div>
          )}

          <div className="bg-ink-2 rounded-xl border border-hair p-3">
            {nombre.trim() && (
              <p className="text-xs text-ash border-b border-hair pb-2 mb-2">
                Para: <span className="text-snow font-medium">{nombre}</span>
              </p>
            )}

            {lineas.length === 0 ? (
              <p className="text-sm text-smoke py-6 text-center">Toca un producto para empezar</p>
            ) : (
              <div className="space-y-1.5 mb-3">
                {lineas.map((l) => {
                  const v = l.producto.variantes.find((x) => x.id === l.varianteId);
                  const mods = l.producto.grupos
                    .flatMap((g) => g.opciones)
                    .filter((o) => l.modifierIds.includes(o.id));
                  const isActiva = l.key === lineaActiva;
                  return (
                    <div key={l.key}
                      className={`rounded-lg p-1 -m-1 ${isActiva ? 'bg-brass/5 border border-brass/30' : ''}`}>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setLineaActiva(isActiva ? null : l.key)}
                          className="flex-1 min-w-0 text-left">
                          <p className="text-sm truncate">
                            {l.producto.nombre}
                            {v && <span className="text-smoke"> ({v.nombre})</span>}
                          </p>
                          <p className="text-xs text-smoke">{pesos(precioLinea(l))}</p>
                          {mods.length > 0 && (
                            <p className="text-[10px] text-brass/80 truncate">
                              + {mods.map((m) => m.nombre).join(', ')}
                            </p>
                          )}
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => cambiar(l.key, -1)}
                            className="w-8 h-8 rounded-lg bg-ink-3" aria-label="Quitar uno">−</button>
                          <span className="w-6 text-center text-sm">{l.cantidad}</span>
                          <button onClick={() => cambiar(l.key, 1)}
                            className="w-8 h-8 rounded-lg bg-ink-3" aria-label="Agregar uno">+</button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="flex justify-between pt-2 border-t border-hair">
                  <span className="text-sm font-medium">Total</span>
                  <span className="text-lg font-bold text-brass">{pesos(total)}</span>
                </div>
              </div>
            )}

            {/* Opciones de la línea activa */}
            {activa && (activa.producto.variantes.length > 0 || activa.producto.grupos.length > 0) && (
              <div className="mb-3 border-t border-hair pt-2">
                <p className="text-[11px] text-smoke mb-1.5">
                  Opciones de <span className="text-snow">{activa.producto.nombre}</span>
                </p>

                {activa.producto.variantes.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[11px] text-brass mb-1">Tamaño</p>
                    {activa.producto.variantes.map((v) => (
                      <button key={v.id}
                        onClick={() => setLineas((prev) => prev.map((l) =>
                          l.key === activa.key ? { ...l, varianteId: v.id } : l))}
                        className={`w-full flex justify-between text-xs px-2 py-1.5 rounded mb-0.5 ${
                          activa.varianteId === v.id
                            ? 'bg-brass/15 text-snow border border-brass/40'
                            : 'bg-ink-3 text-ash border border-transparent'
                        }`}>
                        <span>{v.nombre}</span>
                        <span>{v.delta ? `+${pesos(v.delta)}` : '—'}</span>
                      </button>
                    ))}
                  </div>
                )}

                {activa.producto.grupos.map((g) => (
                  <div key={g.id} className="mb-2">
                    <p className="text-[11px] text-brass mb-1">
                      {g.nombre}
                      {g.obligatorio && <span className="text-bad"> · obligatorio</span>}
                      {!g.obligatorio && <span className="text-smoke"> · opcional</span>}
                    </p>
                    {g.opciones.map((o) => {
                      const sel = activa.modifierIds.includes(o.id);
                      return (
                        <button key={o.id}
                          onClick={() => alternarModificador(activa.key, g, o.id)}
                          className={`w-full flex justify-between text-xs px-2 py-1.5 rounded mb-0.5 ${
                            sel
                              ? 'bg-brass/15 text-snow border border-brass/40'
                              : 'bg-ink-3 text-ash border border-transparent'
                          }`}>
                          <span>{sel ? '✓ ' : ''}{o.nombre}</span>
                          <span>{o.delta ? `+${pesos(o.delta)}` : '—'}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {METODOS.map((m) => (
                <button key={m.valor} onClick={() => setMetodo(m.valor)}
                  className={`py-2 rounded-lg text-xs border transition-colors ${
                    metodo === m.valor
                      ? 'bg-brass/15 border-brass/50 text-brass'
                      : 'border-hair text-ash'
                  }`}>
                  {m.etiqueta}
                </button>
              ))}
            </div>

            {metodo === 'CUENTA' && (
              <p className="text-[10px] text-smoke bg-ink-3 rounded px-2 py-1.5 mb-2">
                Se carga a la cuenta del huésped. Hace falta que tenga correo registrado.
              </p>
            )}

            <button onClick={cobrar} disabled={cobrando || lineas.length === 0}
              className="w-full py-4 rounded-xl bg-brass text-ink font-semibold disabled:opacity-40">
              {cobrando ? 'Cobrando…' : `Cobrar ${pesos(total)}`}
            </button>

            {lineas.length > 0 && (
              <button onClick={limpiar} className="w-full mt-2 py-1.5 text-xs text-smoke">
                Cancelar
              </button>
            )}
          </div>
        </aside>
      </div>

      {/* Colas */}
      <div className="border-t border-hair grid md:grid-cols-2 gap-4 p-4">
        <Cola titulo="En preparación" pedidos={barra.preparando}
          accion={{ texto: 'Listo', tipo: 'listo' }} onAccion={avanzar}
          vacio="Sin pedidos pendientes" />
        <Cola titulo="Listos para entregar" pedidos={barra.listos}
          accion={{ texto: 'Entregado', tipo: 'entregar' }} onAccion={avanzar}
          vacio="Nada esperando" destacado />
      </div>
    </div>
  );
}

function Cola({
  titulo, pedidos, accion, onAccion, vacio, destacado,
}: {
  titulo: string;
  pedidos: Pedido[];
  accion: { texto: string; tipo: 'listo' | 'entregar' };
  onAccion: (id: string, tipo: 'listo' | 'entregar') => void;
  vacio: string;
  destacado?: boolean;
}) {
  return (
    <section>
      <h2 className="text-xs uppercase tracking-wide text-smoke mb-2">
        {titulo} ({pedidos.length})
      </h2>
      {pedidos.length === 0 ? (
        <p className="text-sm text-smoke bg-ink-2 rounded-xl px-4 py-5 text-center">{vacio}</p>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2">
          {pedidos.map((p) => (
            <div key={p.id}
              className={`bg-ink-2 rounded-xl p-3 border ${destacado ? 'border-good/40' : 'border-hair'}`}>
              <div className="flex justify-between items-start mb-1.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.nombre}</p>
                  <p className="text-[11px] text-smoke">
                    {p.origen}
                    {p.codigo && <span className="font-mono text-brass"> · {p.codigo}</span>}
                    {p.aCuenta && <span className="text-warn"> · a cuenta</span>}
                  </p>
                </div>
                <span className={`text-[11px] shrink-0 ml-2 ${p.minutos >= 8 ? 'text-warn' : 'text-smoke'}`}>
                  {p.minutos}′
                </span>
              </div>
              <ul className="text-xs space-y-0.5 mb-2">
                {p.items.map((i) => (
                  <li key={i.id}>
                    <span className="text-brass">{i.cantidad}×</span> {i.nombre}
                    {i.variante && <span className="text-smoke"> ({i.variante})</span>}
                    {i.extras.length > 0 && (
                      <span className="text-smoke"> + {i.extras.join(', ')}</span>
                    )}
                    {i.notas && <span className="block text-warn pl-4">{i.notas}</span>}
                  </li>
                ))}
              </ul>
              {p.notaLibre && (
                <p className="text-[11px] text-warn bg-warn/10 rounded px-2 py-1 mb-2">{p.notaLibre}</p>
              )}
              <button onClick={() => onAccion(p.id, accion.tipo)}
                className={`w-full py-2 rounded-lg text-xs font-medium ${
                  accion.tipo === 'entregar'
                    ? 'bg-good/20 text-good border border-good/40'
                    : 'bg-brass/15 text-brass border border-brass/30'
                }`}>
                {accion.texto}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
