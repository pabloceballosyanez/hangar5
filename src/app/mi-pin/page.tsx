'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Cambio de PIN.
 *
 * Sirve para dos casos: la primera vez que alguien entra (el PIN lo
 * generó el sistema y tiene que reemplazarlo), y cuando quiere cambiarlo
 * por su cuenta. Pide el actual aunque acabe de entrar, para que quien
 * encuentre la tablet abierta no pueda apropiarse de la cuenta.
 */

const REGLAS = [
  'Cuatro dígitos',
  'Que no sea 0000, 1111 ni una secuencia como 1234',
  'Que nadie más lo use',
];

export default function CambiarPin() {
  const router = useRouter();
  const [actual, setActual] = useState('');
  const [nuevo, setNuevo] = useState('');
  const [repetir, setRepetir] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [listo, setListo] = useState(false);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (nuevo !== repetir) {
      setError('Los dos PIN nuevos no coinciden');
      return;
    }

    setGuardando(true);
    try {
      const r = await fetch('/api/auth/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinActual: actual, pinNuevo: nuevo }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(d.error ?? 'No se pudo cambiar');
        return;
      }
      setListo(true);
      // A su pantalla, que para eso eligió el PIN
      setTimeout(() => router.push('/login?listo=1'), 1400);
    } catch {
      setError('No se pudo conectar');
    } finally {
      setGuardando(false);
    }
  }

  if (listo) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-4xl mb-4">✓</p>
          <p className="text-[#F4F4F4] text-lg font-medium">PIN actualizado</p>
          <p className="text-[#F4F4F4]/50 text-sm mt-1">Vuelve a entrar con tu nuevo PIN</p>
        </div>
      </div>
    );
  }

  const campo = (
    valor: string,
    set: (v: string) => void,
    etiqueta: string,
    autoFocus = false
  ) => (
    <label className="block mb-4">
      <span className="block text-xs text-[#F4F4F4]/50 mb-1.5">{etiqueta}</span>
      <input
        type="password"
        inputMode="numeric"
        maxLength={4}
        autoFocus={autoFocus}
        value={valor}
        onChange={(e) => set(e.target.value.replace(/\D/g, '').slice(0, 4))}
        className="w-full text-center text-2xl tracking-[0.5em] bg-[#161616] border border-[#F4F4F4]/15
                   rounded-xl px-4 py-3 text-[#F4F4F4] focus:outline-none focus:border-[#C9A44F]"
        placeholder="••••"
      />
    </label>
  );

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-4 py-8">
      <form onSubmit={guardar} className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-[#F4F4F4] mb-1">Elige tu PIN</h1>
        <p className="text-sm text-[#F4F4F4]/50 mb-6">
          Con esto entras a partir de ahora.
        </p>

        {error && (
          <p className="mb-4 text-sm text-[#e07a6e] bg-[#e07a6e]/10 rounded-lg px-3 py-2.5">
            {error}
          </p>
        )}

        {campo(actual, setActual, 'Tu PIN actual', true)}
        {campo(nuevo, setNuevo, 'PIN nuevo')}
        {campo(repetir, setRepetir, 'Repite el PIN nuevo')}

        <ul className="mb-6 space-y-1">
          {REGLAS.map((r) => (
            <li key={r} className="text-[11px] text-[#F4F4F4]/35 flex gap-1.5">
              <span>·</span>
              {r}
            </li>
          ))}
        </ul>

        <button
          type="submit"
          disabled={guardando || nuevo.length !== 4 || repetir.length !== 4 || actual.length !== 4}
          className="w-full py-3 rounded-xl bg-[#C9A44F] text-[#0B0B0B] font-semibold text-sm
                     disabled:opacity-30 transition-opacity"
        >
          {guardando ? 'Guardando…' : 'Guardar PIN'}
        </button>
      </form>
    </div>
  );
}
