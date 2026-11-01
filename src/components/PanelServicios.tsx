"use client";

import { useEffect, useState } from "react";

/**
 * Servicios en la cuenta: renta y vuelos.
 *
 * El problema que resuelve: la cuenta solo aceptaba platillos del menú,
 * así que una moto, una bici o un vuelo de parapente NO tenían dónde
 * cobrarse. El cliente quería rentar una moto y no había forma de
 * sumarla a su ticket.
 *
 * Un solo botón, "Agregar servicio", que abre el catálogo agrupado por
 * tipo. El precio se congela al agregar: si mañana sube la moto, la
 * cuenta de hoy sigue diciendo lo que costaba hoy.
 */

interface Servicio {
  id: string;
  descripcion: string;
  cantidad: number;
  total: number;
  fechaServicio: string | null;
}

interface ItemCatalogo {
  id: string;
  name: string;
  price: number;
  type: string;
  capacity: string | null;
}

interface GrupoCatalogo {
  tipo: string;
  etiqueta: string;
  items: ItemCatalogo[];
}

const pesos = (centavos: number) =>
  `$${(centavos / 100).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

const fechaCorta = (iso: string) =>
  new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short" });

export default function PanelServicios({
  sessionId,
  onCambio,
}: {
  sessionId: string;
  onCambio?: () => void;
}) {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [total, setTotal] = useState(0);
  const [catalogo, setCatalogo] = useState<GrupoCatalogo[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Formulario
  const [itemId, setItemId] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [fecha, setFecha] = useState("");

  async function cargar() {
    try {
      const r = await fetch(`/api/admin/restaurant/sessions/${sessionId}/servicios`);
      const d = await r.json();
      setServicios(d.servicios ?? []);
      setTotal(d.total ?? 0);
    } catch {
      /* silencioso: la cuenta sigue usable sin servicios */
    }
  }

  useEffect(() => {
    cargar();
  }, [sessionId]);

  async function abrirCatalogo() {
    setAbierto(true);
    if (catalogo.length) return;
    try {
      const r = await fetch(
        `/api/admin/restaurant/sessions/${sessionId}/servicios?catalogo=1`
      );
      const d = await r.json();
      setCatalogo(d.catalogo ?? []);
    } catch {
      setError("No se pudo cargar el catálogo");
    }
  }

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    if (!itemId) return;
    setError("");
    setGuardando(true);

    try {
      const r = await fetch(`/api/admin/restaurant/sessions/${sessionId}/servicios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          cantidad,
          fechaServicio: fecha || null,
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error ?? "No se pudo agregar");
        return;
      }
      setServicios(d.servicios ?? []);
      setTotal(d.total ?? 0);
      onCambio?.();
      setItemId("");
      setCantidad(1);
      setFecha("");
      setAbierto(false);
    } catch {
      setError("No se pudo agregar");
    } finally {
      setGuardando(false);
    }
  }

  async function quitar(servicioId: string) {
    try {
      const r = await fetch(
        `/api/admin/restaurant/sessions/${sessionId}/servicios?servicioId=${servicioId}`,
        { method: "DELETE" }
      );
      const d = await r.json();
      if (!r.ok) {
        setError(d.error ?? "No se pudo quitar");
        return;
      }
      setServicios(d.servicios ?? []);
      setTotal(d.total ?? 0);
      onCambio?.();
    } catch {
      setError("No se pudo quitar");
    }
  }

  const itemElegido = catalogo
    .flatMap((g) => g.items)
    .find((i) => i.id === itemId);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-1">
        <h2 className="text-lg font-semibold text-gray-900">Servicios</h2>
        {total > 0 && (
          <span className="text-sm font-medium text-gray-900">{pesos(total)}</span>
        )}
      </div>
      <p className="text-xs text-gray-400 mb-3">
        Renta y vuelos: motos, bicis, parapente. Se cobran junto con la cuenta.
      </p>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{error}</p>
      )}

      {servicios.length > 0 && (
        <div className="mb-3 divide-y divide-gray-100">
          {servicios.map((s) => (
            <div key={s.id} className="flex justify-between items-start py-2">
              <div>
                <p className="text-sm text-gray-900">
                  {s.cantidad}× {s.descripcion}
                </p>
                {s.fechaServicio && (
                  <p className="text-xs text-gray-500">{fechaCorta(s.fechaServicio)}</p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-3">
                <span className="text-sm text-gray-700">{pesos(s.total)}</span>
                <button
                  onClick={() => quitar(s.id)}
                  className="text-xs text-red-400 hover:text-red-600"
                  aria-label={`Quitar ${s.descripcion}`}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!abierto && (
        <button
          onClick={abrirCatalogo}
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          + Agregar servicio
        </button>
      )}

      {abierto && (
        <form onSubmit={agregar} className="space-y-2 border-t border-gray-100 pt-3">
          <select
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
          >
            <option value="">Elige qué cobrar…</option>
            {catalogo.map((g) => (
              <optgroup key={g.tipo} label={g.etiqueta}>
                {g.items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} — {pesos(i.price)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          {itemElegido && (
            <p className="text-xs text-gray-500">
              {itemElegido.capacity}
              {itemElegido.type === "moto" || itemElegido.type === "bici"
                ? " · se cobra por día"
                : ""}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-gray-500">
              Cantidad
              <input
                type="number"
                min={1}
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
                className="w-full mt-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
              />
            </label>
            <label className="text-xs text-gray-500">
              Fecha de uso
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full mt-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
              />
            </label>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={guardando || !itemId}
              className="px-3 py-2 text-sm rounded-lg bg-[#1b4235] text-white hover:bg-[#15352a] disabled:opacity-50"
            >
              {guardando ? "Agregando…" : "Agregar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAbierto(false);
                setError("");
              }}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
