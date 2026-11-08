'use client';

import { useState } from 'react';

/**
 * Restablecer el PIN de alguien.
 *
 * El sistema genera uno nuevo y lo muestra UNA sola vez. Después ya no
 * se puede consultar: si se pierde, hay que generar otro. Por eso se
 * pide confirmación y el número se resalta para que se copie antes de
 * cerrar.
 */
export function BotonPin({ staffId, nombre }: { staffId: string; nombre: string }) {
  const [pin, setPin] = useState<string | null>(null);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState('');

  async function generar() {
    if (!confirm(`¿Generar un PIN nuevo para ${nombre}?\n\nEl que tenga ahora dejará de funcionar.`)) {
      return;
    }
    setGenerando(true);
    setError('');
    try {
      const r = await fetch(`/api/admin/restaurant/staff/${staffId}/pin`, { method: 'POST' });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(d.error ?? 'No se pudo generar');
        return;
      }
      setPin(d.pin);
    } catch {
      setError('No se pudo conectar');
    } finally {
      setGenerando(false);
    }
  }

  if (pin) {
    return (
      <div className="mt-3 rounded-lg border border-[#C9A44F]/40 bg-[#C9A44F]/8 p-3">
        <p className="text-[11px] text-gray-600 mb-1">PIN nuevo de {nombre}</p>
        <p className="text-2xl font-bold tracking-[0.35em] text-gray-900 font-mono">{pin}</p>
        <p className="text-[10px] text-gray-500 mt-1.5">
          Apúntalo. No se puede volver a ver.
        </p>
        <p className="text-[10px] text-gray-400 mt-1">
          Al entrar, {nombre} tendrá que cambiarlo por uno propio.
        </p>
        <button
          onClick={() => setPin(null)}
          className="mt-2 text-[11px] text-gray-500 hover:text-gray-700 underline"
        >
          Lo apunté
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <button
        onClick={generar}
        disabled={generando}
        className="text-[11px] text-gray-500 hover:text-[#1b4235] disabled:opacity-40"
      >
        {generando ? 'Generando…' : 'Restablecer PIN'}
      </button>
      {error && <p className="text-[10px] text-[#b03a2e] mt-1">{error}</p>}
    </div>
  );
}
