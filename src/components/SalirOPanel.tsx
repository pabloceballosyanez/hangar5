'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Salir de una pantalla que no tiene a dónde volver.
 *
 * El KDS y el Mesero se usan en tablet con la pantalla bloqueada, así que
 * no hay botón atrás del navegador. Pero el personal de piso (cocinero,
 * mesero) no tiene acceso al admin: mandarlo a /admin/restaurant hace que
 * el proxy lo devuelva a su propia pantalla y el botón no haga nada.
 *
 * Este botón se adapta al rol:
 *   · quien puede entrar al panel → vuelve al panel
 *   · quien no → cierra su sesión y llega al login, donde puede quedarse
 *     o dejarle la tablet a otra persona
 */
export function SalirOPanel({
  puedeAdmin,
  etiquetaVolver = '← Volver',
}: {
  puedeAdmin: boolean;
  etiquetaVolver?: string;
}) {
  const router = useRouter();
  const [saliendo, setSaliendo] = useState(false);

  async function salir() {
    setSaliendo(true);
    try {
      await fetch('/api/auth/login', { method: 'DELETE' });
    } catch {
      /* aunque falle, se va al login: la cookie vence sola */
    }
    router.push('/login');
  }

  if (puedeAdmin) {
    return (
      <button
        onClick={() => router.push('/admin/restaurant')}
        className="text-xs px-3 py-2 rounded-lg border border-hair text-ash hover:text-snow transition-colors"
      >
        {etiquetaVolver}
      </button>
    );
  }

  return (
    <button
      onClick={salir}
      disabled={saliendo}
      className="text-xs px-3 py-2 rounded-lg border border-hair text-ash hover:text-snow transition-colors disabled:opacity-40"
    >
      {saliendo ? 'Saliendo…' : 'Salir'}
    </button>
  );
}
