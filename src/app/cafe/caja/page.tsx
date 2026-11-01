'use client';

import { useEffect, useMemo, useState } from 'react';

/**
 * Caja del Café del Despegue.
 *
 * ── Para qué es ────────────────────────────────────────────────────
 * El café no tiene mesas: todos son walk-ins. Alguien llega al
 * mostrador, pide un latte y un panqué, y se va. Aquí el barista lo
 * cobra en el momento, sin abrir cuenta ni mesa.
 *
 * ── Lo que NO hace ─────────────────────────────────────────────────
 * No reemplaza al KDS. Esta pantalla es para VENDER; los pedidos que ya
 * están en curso se ven en /cafe. Al cobrar, el pedido aparece allá
 * listo para preparar, con su código.
 */

interface Producto {
  id: string;
  nombre: string;
  precio: number;
  categoria: string;
}

interface Linea {
  menuItemId: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

interface Venta {
  orderId: string;
  codigo: string | null;
  total: number;
  metodoPago: string;
  clienteNombre: string | null;
}

const pesos = (centavos: number) =>
  `$${(centavos / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

const METODOS = [
  { valor: 'CASH', etiqueta: 'Efectivo' },
  { valor: 'CARD', etiqueta: 'Tarjeta' },
  { valor: 'TRANSFER', etiqueta: 'Transferencia' },
  { valor: 'CUENTA', etiqueta: 'Cargar a cuenta' },
] as const;

export default function CajaCafe() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [filtro, setFiltro] = useState('');
  const [metodo, setMetodo] = useState<string>('CASH');
  const [cliente, setCliente] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [cobrando, setCobrando] = useState(false);
  const [venta, setVenta] = useState<Venta | null>(null);

  useEffect(() => {
    fetch('/api/cafe/caja')
      .then((r) => r.json())
      .then((d) => setProductos(d.items ?? []))
      .catch(() => setError('No se pudo cargar el menú del café'));
  }, []);

  const total = lineas.reduce((s, l) => s + l.precio * l.cantidad, 0);

  const visibles = useMemo(
    () =>
      productos.filter((p) =>
        filtro
          ? p.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
            p.categoria.toLowerCase().includes(filtro.toLowerCase())
          : true
      ),
    [productos, filtro]
  );

  const porCategoria = useMemo(() => {
    const grupos = new Map<string, Producto[]>();
    for (const p of visibles) {
      if (!grupos.has(p.categoria)) grupos.set(p.categoria, []);
      grupos.get(p.categoria)!.push(p);
    }
    return Array.from(grupos.entries());
  }, [visibles]);

  function agregar(p: Producto) {
    setVenta(null);
    setLineas((prev) => {
      const ya = prev.find((l) => l.menuItemId === p.id);
      if (ya) {
        return prev.map((l) =>
          l.menuItemId === p.id ? { ...l, cantidad: l.cantidad + 1 } : l
        );
      }
      return [...prev, { menuItemId: p.id, nombre: p.nombre, precio: p.precio, cantidad: 1 }];
    });
  }

  function cambiarCantidad(id: string, delta: number) {
    setLineas((prev) =>
      prev
        .map((l) =>
          l.menuItemId === id ? { ...l, cantidad: l.cantidad + delta } : l
        )
        .filter((l) => l.cantidad > 0)
    );
  }

  function limpiar() {
    setLineas([]);
    setCliente('');
    setEmail('');
    setError('');
    setVenta(null);
  }

  async function cobrar() {
    if (lineas.length === 0) return;
    if (metodo === 'CUENTA' && !cliente.trim() && !email.trim()) {
      setError('Para cargar a cuenta necesito el nombre o el correo');
      return;
    }

    setError('');
    setCobrando(true);

    try {
      const r = await fetch('/api/cafe/caja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: lineas.map((l) => ({ menuItemId: l.menuItemId, cantidad: l.cantidad })),
          metodoPago: metodo,
          clienteNombre: cliente.trim() || null,
          clienteEmail: email.trim() || null,
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error ?? 'No se pudo cobrar');
        return;
      }
      setVenta(d);
      setLineas([]);
      setCliente('');
      setEmail('');
    } catch {
      setError('No se pudo cobrar');
    } finally {
      setCobrando(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink text-snow p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl">Caja · Café del Despegue</h1>
            <p className="text-xs text-ash mt-0.5">Venta en mostrador</p>
          </div>
          <a href="/cafe" className="text-xs px-3 py-2 rounded-lg border border-hair text-ash hover:text-snow">
            Ver pedidos →
          </a>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-4">
          {/* Productos */}
          <div>
            <input
              type="search"
              placeholder="Buscar producto…"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full mb-3 px-4 py-3 rounded-xl bg-ink-2 border border-hair text-snow placeholder:text-smoke focus:outline-none focus:border-brass/50"
            />

            {productos.length === 0 && (
              <p className="text-sm text-smoke bg-ink-2 rounded-xl px-4 py-6 text-center">
                Todavía no hay productos marcados para el café. Márcalos en
                Admin → Ubicaciones.
              </p>
            )}

            {porCategoria.map(([cat, items]) => (
              <div key={cat} className="mb-4">
                <h2 className="text-xs uppercase tracking-wide text-smoke mb-2">{cat}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {items.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => agregar(p)}
                      className="text-left px-3 py-3 rounded-xl bg-ink-2 border border-hair hover:border-brass/50 transition-colors"
                    >
                      <span className="block text-sm text-snow leading-tight">{p.nombre}</span>
                      <span className="block text-xs text-brass mt-1">{pesos(p.precio)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Ticket */}
          <div className="lg:sticky lg:top-4 self-start">
            <div className="bg-ink-2 rounded-xl border border-hair p-4">
              <h2 className="text-sm font-bold uppercase tracking-wide text-smoke mb-3">
                Ticket
              </h2>

              {venta ? (
                <div className="text-center py-4">
                  <p className="text-xs text-smoke uppercase tracking-wide mb-2">Cobrado</p>
                  <p className="font-mono text-4xl text-brass tracking-[0.25em] mb-2">
                    {venta.codigo ?? '—'}
                  </p>
                  <p className="text-sm text-ash mb-1">{pesos(venta.total * 100)}</p>
                  <p className="text-xs text-smoke">
                    {METODOS.find((m) => m.valor === venta.metodoPago)?.etiqueta}
                  </p>
                  <button
                    onClick={limpiar}
                    className="mt-4 w-full py-3 rounded-lg bg-brass text-ink font-medium"
                  >
                    Nueva venta
                  </button>
                </div>
              ) : (
                <>
                  {lineas.length === 0 ? (
                    <p className="text-sm text-smoke py-4 text-center">
                      Toca un producto para empezar
                    </p>
                  ) : (
                    <div className="space-y-2 mb-3">
                      {lineas.map((l) => (
                        <div key={l.menuItemId} className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-snow truncate">{l.nombre}</p>
                            <p className="text-xs text-smoke">{pesos(l.precio * l.cantidad)}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => cambiarCantidad(l.menuItemId, -1)}
                              className="w-9 h-9 rounded-lg bg-ink-3 text-snow"
                              aria-label="Quitar uno"
                            >
                              −
                            </button>
                            <span className="w-7 text-center text-sm">{l.cantidad}</span>
                            <button
                              onClick={() => cambiarCantidad(l.menuItemId, 1)}
                              className="w-9 h-9 rounded-lg bg-ink-3 text-snow"
                              aria-label="Agregar uno"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between pt-2 border-t border-hair">
                        <span className="text-sm font-medium">Total</span>
                        <span className="text-lg font-bold text-brass">{pesos(total)}</span>
                      </div>
                    </div>
                  )}

                  {/* Método de pago */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {METODOS.map((m) => (
                      <button
                        key={m.valor}
                        onClick={() => setMetodo(m.valor)}
                        className={`py-2 rounded-lg text-xs border transition-colors ${
                          metodo === m.valor
                            ? 'bg-brass/15 border-brass/50 text-brass'
                            : 'border-hair text-ash'
                        }`}
                      >
                        {m.etiqueta}
                      </button>
                    ))}
                  </div>

                  {metodo === 'CUENTA' && (
                    <div className="space-y-2 mb-3">
                      <input
                        value={cliente}
                        onChange={(e) => setCliente(e.target.value)}
                        placeholder="Nombre del cliente"
                        className="w-full px-3 py-2 rounded-lg bg-ink-3 border border-hair text-sm text-snow placeholder:text-smoke focus:outline-none"
                      />
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Correo (opcional)"
                        type="email"
                        className="w-full px-3 py-2 rounded-lg bg-ink-3 border border-hair text-sm text-snow placeholder:text-smoke focus:outline-none"
                      />
                    </div>
                  )}

                  {error && (
                    <p className="text-xs text-bad bg-bad/10 rounded-lg px-3 py-2 mb-3">{error}</p>
                  )}

                  <button
                    onClick={cobrar}
                    disabled={cobrando || lineas.length === 0}
                    className="w-full py-4 rounded-xl bg-brass text-ink font-semibold disabled:opacity-40"
                  >
                    {cobrando ? 'Cobrando…' : `Cobrar ${pesos(total)}`}
                  </button>

                  {lineas.length > 0 && (
                    <button
                      onClick={limpiar}
                      className="w-full mt-2 py-2 text-xs text-smoke hover:text-snow"
                    >
                      Cancelar
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
