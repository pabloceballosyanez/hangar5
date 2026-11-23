'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Compatibilidad: algunas tablets tienen /waiter/login guardado como
 * inicio de la app instalada.
 *
 * Antes esta página mandaba a /login sin más, y el login no sabía a dónde
 * volver: te dejaba en el panel de admin. Pablo lo describió como "le doy
 * al botón del mesero, pongo mi contraseña y me bota de regreso a la app".
 *
 * Ahora arrastra el destino: si venías a /waiter, te devuelve a /waiter.
 */
export default function WaiterLoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login?from=%2Fwaiter');
  }, [router]);

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center">
      <p className="op-body text-ash">Entrando al mesero…</p>
    </div>
  );
}
