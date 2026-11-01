'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * KDS del Café del Despegue.
 *
 * ── Por qué es distinto al de la cocina ────────────────────────────
 * La cocina tiene estaciones, varias personas y pedidos largos. El café
 * lo opera UNA persona: cobra, prepara y entrega. Por eso aquí no hay
 * columnas de estación ni filtros: dos listas y un buscador de códigos.
 *
 * ── El buscador de códigos ─────────────────────────────────────────
 * Es lo primero de la pantalla porque es lo que más se usa: el cliente
 * llega con su código en el celular, el barista lo teclea, ve que es el
 * pedido correcto y lo entrega. Sin esto, cualquiera podría decir
 * "vengo por el pedido de Juan".
 */

interface Item {
  id: string;
  cantidad: number;
  nombre: string;
  variante: string | null;
  notas: string | null;
  extras: string[];
}

interface Pedido {
  id: string;
  codigo: string | null;
  cliente: string;
  minutos: number;
  total: number;
  nota: string | null;
  origen: string;
  items: Item[];
}

interface Respuesta {
  ubicacion: string;
  porHacer: Pedido[];
  listos: Pedido[];
}

export default function KDSCafe() {
  const [datos, setDatos] = useState<Respuesta | null>(null);
  const [error, setError] = useState('');
  const [codigo, setCodigo] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [encontrado, setEncontrado] = useState<{
    id: string;
    codigo: string;
    cliente: string;
    total: number;
    estado: string;
    items: Item[];
  } | null>(null);
  const [aviso, setAviso] = useState('');

  const cargar = useCallback(async () => {
    try {
      const r = await fetch('/api/cafe/pedidos?ubicacion=cafe');
      if (!r.ok) throw new Error();
      setDatos(await r.json());
      setError('');
    } catch {
      setError('No se pudo cargar la barra');
    }
  }, []);

  useEffect(() => {
    cargar();
    // Se refresca solo: la barra no debería tener que recargar a mano.
    const t = setInterval(cargar, 15000);
    return () => clearInterval(t);
  }, [cargar]);

  async function avanzar(orderId: string, accion: 'empezar' | 'listo' | 'entregar') {
    try {
      const r = await fetch('/api/cafe/pedidos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, accion }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setAviso(d.error ?? 'No se pudo avanzar');
        return;
      }
      setEncontrado(null);
      setCodigo('');
      await cargar();
    } catch {
      setAviso('No se pudo avanzar');
    }
  }

  async function buscarCodigo(e: React.FormEvent) {
    e.preventDefault();
    if (codigo.trim().length === 0) return;
    setBuscando(true);
    setAviso('');
    setEncontrado(null);

    try {
      const r = await fetch('/api/cafe/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo }),
      });
      const d = await r.json();
      if (!r.ok) {
        setAviso(d.error ?? 'Código no encontrado');
        return;
      }
      setEncontrado(d.pedido);
    } catch {
      setAviso('No se pudo buscar');
    } finally {
      setBuscando(false);
    }
  }

  const totalPedidos = (datos?.porHacer.length ?? 0) + (datos?.listos.length ?? 0);

  return (
    <div className="min-h-screen bg-ink text-snow p-4 md:p-6">
      {/* Encabezado */}
      <div className="max-w-6xl mx-auto mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl">Café del Despegue</h1>
          <p className="text-xs text-ash mt-0.5">Barra · {totalPedidos} pedidos activos</p>
        </div>
        <button
          onClick={cargar}
          className="text-xs px-3 py-2 rounded-lg border border-hair text-ash hover:text-snow hover:border-brass/40"
        >
          Actualizar
        </button>
      </div>

      {/* Buscador de código — lo que más se usa */}
      <div className="max-w-6xl mx-auto mb-6">
        <form onSubmit={buscarCodigo} className="flex gap-2">
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="Código de recogida (ej. A3F2)"
            maxLength={4}
            className="flex-1 px-4 py-4 rounded-xl bg-ink-2 border border-hair text-snow text-lg tracking-[0.3em] font-mono text-center placeholder:tracking-normal placeholder:text-sm placeholder:font-sans placeholder:text-smoke focus:outline-none focus:border-brass/60"
          />
          <button
            type="submit"
            disabled={buscando}
            className="px-6 py-4 rounded-xl bg-brass text-ink font-medium disabled:opacity-50"
          >
            {buscando ? '…' : 'Buscar'}
          </button>
        </form>

        {aviso && (
          <p className="mt-3 text-sm text-bad bg-bad/10 rounded-lg px-3 py-2">{aviso}</p>
        )}

        {encontrado && (
          <div className="mt-3 bg-ink-2 border border-brass/40 rounded-xl p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs text-smoke uppercase tracking-wide">Pedido</p>
                <p className="font-mono text-2xl text-brass tracking-widest">{encontrado.codigo}</p>
                <p className="text-sm text-snow mt-1">{encontrado.cliente}</p>
              </div>
              <p className="text-lg font-medium">${encontrado.total.toFixed(2)}</p>
            </div>

            <ul className="text-sm text-ash space-y-1 mb-4">
              {encontrado.items.map((i) => (
                <li key={i.id}>
                  {i.cantidad}× {i.nombre}
                  {i.variante && <span className="text-smoke"> ({i.variante})</span>}
                  {i.extras.length > 0 && <span className="text-smoke"> + {i.extras.join(', ')}</span>}
                </li>
              ))}
            </ul>

            <button
              onClick={() => avanzar(encontrado.id, 'entregar')}
              className="w-full py-3 rounded-lg bg-good/20 text-good border border-good/40 font-medium hover:bg-good/30"
            >
              Marcar como entregado
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="max-w-6xl mx-auto text-sm text-bad bg-bad/10 rounded-lg px-3 py-2 mb-4">{error}</p>
      )}

      {/* Dos columnas: lo que falta y lo que está listo */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-4">
        <Columna
          titulo="Por preparar"
          pedidos={datos?.porHacer ?? []}
          accion={{ texto: 'Listo', tipo: 'listo' }}
          onAccion={avanzar}
          vacio="Sin pedidos pendientes"
        />
        <Columna
          titulo="Listos para entregar"
          pedidos={datos?.listos ?? []}
          accion={{ texto: 'Entregar', tipo: 'entregar' }}
          onAccion={avanzar}
          vacio="Nada esperando"
          destacado
        />
      </div>
    </div>
  );
}

function Columna({
  titulo,
  pedidos,
  accion,
  onAccion,
  vacio,
  destacado,
}: {
  titulo: string;
  pedidos: Pedido[];
  accion: { texto: string; tipo: 'listo' | 'entregar' };
  onAccion: (id: string, tipo: 'empezar' | 'listo' | 'entregar') => void;
  vacio: string;
  destacado?: boolean;
}) {
  return (
    <div>
      <h2 className="text-xs uppercase tracking-wide text-smoke mb-2">
        {titulo} ({pedidos.length})
      </h2>

      {pedidos.length === 0 ? (
        <p className="text-sm text-smoke bg-ink-2 rounded-xl px-4 py-6 text-center">{vacio}</p>
      ) : (
        <div className="space-y-3">
          {pedidos.map((p) => (
            <div
              key={p.id}
              className={`bg-ink-2 rounded-xl p-4 border ${
                destacado ? 'border-good/40' : 'border-hair'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-mono text-lg text-brass tracking-widest">
                    {p.codigo ?? '—'}
                  </p>
                  <p className="text-xs text-ash">
                    {p.cliente} · {p.origen}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm">${p.total.toFixed(2)}</p>
                  <p
                    className={`text-xs ${
                      p.minutos >= 8 ? 'text-warn' : 'text-smoke'
                    }`}
                  >
                    {p.minutos} min
                  </p>
                </div>
              </div>

              <ul className="text-sm text-snow space-y-0.5 mb-3">
                {p.items.map((i) => (
                  <li key={i.id}>
                    <span className="text-brass">{i.cantidad}×</span> {i.nombre}
                    {i.variante && <span className="text-smoke"> ({i.variante})</span>}
                    {i.extras.length > 0 && (
                      <span className="text-smoke"> + {i.extras.join(', ')}</span>
                    )}
                    {i.notas && <span className="block text-xs text-warn pl-5">{i.notas}</span>}
                  </li>
                ))}
              </ul>

              {p.nota && (
                <p className="text-xs text-warn bg-warn/10 rounded px-2 py-1 mb-3">{p.nota}</p>
              )}

              <button
                onClick={() => onAccion(p.id, accion.tipo)}
                className={`w-full py-2.5 rounded-lg text-sm font-medium ${
                  accion.tipo === 'entregar'
                    ? 'bg-good/20 text-good border border-good/40 hover:bg-good/30'
                    : 'bg-brass/15 text-brass border border-brass/30 hover:bg-brass/25'
                }`}
              >
                {accion.texto}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
