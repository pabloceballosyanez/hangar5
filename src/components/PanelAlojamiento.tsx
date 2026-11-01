"use client";

import { useEffect, useState } from "react";

/**
 * Panel de alojamiento dentro de la cuenta del restaurante.
 *
 * Es la pieza visible de la cuenta unificada: permite juntar la comida
 * con la cabaña, sin importar qué pasó primero.
 *
 * Dos caminos, los mismos dos que pasan en el Hangar:
 *
 *   · "Agregar alojamiento"  → el cliente está comiendo y decide
 *                              quedarse. Se crea la reserva aquí mismo.
 *   · "Vincular reserva"     → ya tenía reserva y hay que cargarle
 *                              la comida a esa reserva.
 *
 * Una vez vinculado, el panel muestra el saldo del alojamiento y avisa
 * si ya está pagado (para que nadie lo cobre dos veces).
 */

interface ReservaCuenta {
  id: string;
  nombre: string;
  tipo: string;
  inicio: string;
  fin: string;
  huespedes: number;
  total: number;
  estado: string;
  estadoPago: string;
  montoPagado: number;
  saldoAlojamiento: number;
}

interface Cuenta {
  sessionId: string;
  folio: string;
  etiqueta: string;
  consumoRestaurante: number;
  reserva: ReservaCuenta | null;
  totalAlojamiento: number;
  totalGeneral: number;
}

interface Candidata {
  id: string;
  nombre: string;
  tipo: string;
  cliente: string;
  inicio: string;
  fin: string;
  total: number;
  estado: string;
  estadoPago: string;
  pagado: number;
}

interface Alojamiento {
  id: string;
  name: string;
  price: number;
}

const pesos = (centavos: number) =>
  `$${(centavos / 100).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short" });

export default function PanelAlojamiento({
  sessionId,
  cuenta,
  onCambio,
}: {
  sessionId: string;
  cuenta: Cuenta | null;
  onCambio: () => void;
}) {
  const [modo, setModo] = useState<"cerrado" | "crear" | "vincular">("cerrado");
  const [alojamientos, setAlojamientos] = useState<Alojamiento[]>([]);
  const [candidatas, setCandidatas] = useState<Candidata[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Formulario de reserva nueva
  const [itemId, setItemId] = useState("");
  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");
  const [huespedes, setHuespedes] = useState(1);

  useEffect(() => {
    if (modo !== "crear" || alojamientos.length) return;
    fetch("/api/admin/bookings/items")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setAlojamientos(Array.isArray(d) ? d : []))
      .catch(() => setAlojamientos([]));
  }, [modo, alojamientos.length]);

  useEffect(() => {
    if (modo !== "vincular") return;
    const t = setTimeout(() => {
      const q = busqueda ? `&q=${encodeURIComponent(busqueda)}` : "";
      fetch(`/api/admin/restaurant/sessions/${sessionId}/cuenta?candidatas=1${q}`)
        .then((r) => r.json())
        .then((d) => setCandidatas(d.candidatas ?? []))
        .catch(() => setCandidatas([]));
    }, 250);
    return () => clearTimeout(t);
  }, [modo, busqueda, sessionId]);

  if (!cuenta) return null;

  const reserva = cuenta.reserva;

  async function crearReserva(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setGuardando(true);
    try {
      const r = await fetch(
        `/api/admin/restaurant/sessions/${sessionId}/cuenta/alojamiento`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId, startDate: inicio, endDate: fin, guests: huespedes }),
        }
      );
      const d = await r.json();
      if (!r.ok) {
        setError(d.error ?? "No se pudo crear la reserva");
        return;
      }
      setModo("cerrado");
      onCambio();
    } finally {
      setGuardando(false);
    }
  }

  async function vincular(bookingId: string | null) {
    setError("");
    setGuardando(true);
    try {
      const r = await fetch(`/api/admin/restaurant/sessions/${sessionId}/cuenta/vincular`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error ?? "No se pudo vincular");
        return;
      }
      setModo("cerrado");
      setBusqueda("");
      onCambio();
    } finally {
      setGuardando(false);
    }
  }

  // ── Ya hay alojamiento vinculado ──────────────────────────────────
  if (reserva) {
    const pagada = reserva.estadoPago === "paid";
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Alojamiento</h2>
            <p className="text-xs text-gray-400 mt-0.5">Cuenta {cuenta.folio}</p>
          </div>
          <button
            onClick={() => vincular(null)}
            disabled={guardando}
            className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40"
          >
            Quitar
          </button>
        </div>

        <div className="flex justify-between items-start py-2 border-b border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-900">{reserva.nombre}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {fecha(reserva.inicio)} → {fecha(reserva.fin)} · {reserva.huespedes}{" "}
              {reserva.huespedes === 1 ? "huésped" : "huéspedes"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{pesos(reserva.total)}</p>
            {pagada ? (
              <p className="text-xs text-green-600 mt-0.5">Pagado</p>
            ) : reserva.montoPagado > 0 ? (
              <p className="text-xs text-amber-600 mt-0.5">
                Abonado {pesos(reserva.montoPagado)}
              </p>
            ) : (
              <p className="text-xs text-gray-400 mt-0.5">Sin pagar</p>
            )}
          </div>
        </div>

        {pagada && (
          <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mt-3">
            El alojamiento ya está pagado. Al cerrar la cuenta solo se cobra el consumo.
          </p>
        )}

        <div className="flex justify-between pt-3">
          <span className="text-sm font-semibold text-gray-900">Total de la cuenta</span>
          <span className="font-bold text-lg text-gray-900">{pesos(cuenta.totalGeneral)}</span>
        </div>
      </div>
    );
  }

  // ── Sin alojamiento: ofrecer los dos caminos ──────────────────────
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Alojamiento</h2>
      <p className="text-xs text-gray-400 mb-3">
        Suma una cabaña o glamping a esta cuenta — se cobra todo junto.
      </p>

      {modo === "cerrado" && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setModo("crear")}
            className="px-3 py-2 text-sm rounded-lg bg-[#1b4235] text-white hover:bg-[#15352a]"
          >
            + Agregar alojamiento
          </button>
          <button
            onClick={() => setModo("vincular")}
            className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Vincular reserva existente
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-3">{error}</p>
      )}

      {/* Crear reserva nueva */}
      {modo === "crear" && (
        <form onSubmit={crearReserva} className="mt-3 space-y-2">
          <select
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
          >
            <option value="">Elige cabaña o glamping…</option>
            {alojamientos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} — {pesos(a.price)}/noche
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-gray-500">
              Entrada
              <input
                type="date"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
                required
                className="w-full mt-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
              />
            </label>
            <label className="text-xs text-gray-500">
              Salida
              <input
                type="date"
                value={fin}
                onChange={(e) => setFin(e.target.value)}
                required
                className="w-full mt-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
              />
            </label>
          </div>

          <label className="text-xs text-gray-500 block">
            Huéspedes
            <input
              type="number"
              min={1}
              value={huespedes}
              onChange={(e) => setHuespedes(Number(e.target.value))}
              className="w-full mt-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
            />
          </label>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={guardando}
              className="px-3 py-2 text-sm rounded-lg bg-[#1b4235] text-white hover:bg-[#15352a] disabled:opacity-50"
            >
              {guardando ? "Guardando…" : "Agregar"}
            </button>
            <button
              type="button"
              onClick={() => { setModo("cerrado"); setError(""); }}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Vincular reserva existente */}
      {modo === "vincular" && (
        <div className="mt-3">
          <input
            type="search"
            placeholder="Buscar por nombre o correo…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg mb-2"
          />
          <div className="max-h-56 overflow-y-auto space-y-1">
            {candidatas.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">No hay reservas que coincidan.</p>
            ) : (
              candidatas.map((c) => (
                <button
                  key={c.id}
                  onClick={() => vincular(c.id)}
                  disabled={guardando}
                  className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-[#1b4235] hover:bg-gray-50 disabled:opacity-50"
                >
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-medium text-gray-900">{c.nombre}</span>
                    <span className="text-sm text-gray-700">{pesos(c.total)}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {c.cliente} · {fecha(c.inicio)} → {fecha(c.fin)}
                    {c.estadoPago === "paid" && " · ya pagada"}
                  </div>
                </button>
              ))
            )}
          </div>
          <button
            type="button"
            onClick={() => { setModo("cerrado"); setError(""); }}
            className="mt-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
