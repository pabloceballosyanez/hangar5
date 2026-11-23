'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import SoloMenuPanel from '@/components/SoloMenuPanel';
import SoloOrdersPanel from '@/components/SoloOrdersPanel';
import SoloKDSPanel from '@/components/SoloKDSPanel';

export default function SoloPage() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  /* Quién eres. El Modo Solo lo usan tanto el admin como la cocina, así
     que el botón de volver al panel solo tiene sentido para quien puede
     entrar. A cocina ese panel le está cerrado y el botón la rebotaría. */
  const [puedeAdmin, setPuedeAdmin] = useState(false);

  useEffect(() => {
    fetch('/api/auth/login')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const rol = d?.staff?.role;
        if (rol) setPuedeAdmin(['SUPER_ADMIN', 'GERENTE', 'CAJA'].includes(rol));
      })
      .catch(() => {});
  }, []);

  // Shared refresh signal: any mutation in one panel triggers an instant
  // re-fetch in the others (no remount, no flicker). Polling is the backup.
  const [refreshSignal, setRefreshSignal] = useState(0);
  const bumpRefresh = useCallback(() => setRefreshSignal(k => k + 1), []);

  const handleSelectSession = useCallback((id: string) => {
    setSelectedSessionId(id);
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-ink text-snow">
      {/* ── Barra superior ──────────────────────────────────────────────
          Misma altura, mismo orden y mismo estilo que el KDS y el
          Mesero. Antes era blanca mientras las otras eran oscuras:
          tres pantallas del mismo turno parecían de tres apps. */}
      <header className="shrink-0 op-header">
        <div className="min-w-0">
          <h1 className="op-title text-snow">Modo Solo</h1>
          <p className="op-small text-smoke truncate">
            Mesero · Cocina · Cobro
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {puedeAdmin && (
            <Link href="/admin/restaurant" className="op-btn op-btn-ghost op-btn-sm">
              ← Admin
            </Link>
          )}
          <Link href="/kds" className="op-btn op-btn-ghost op-btn-sm">
            KDS →
          </Link>
        </div>
      </header>

      {/* ── Paneles ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* IZQUIERDA: menú + carrito */}
        <div className="flex-1 min-w-0 border-r border-hair">
          {selectedSessionId ? (
            <SoloMenuPanel
              key={`menu-${selectedSessionId}`}
              sessionId={selectedSessionId}
              onOrderSent={bumpRefresh}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <p className="op-lead text-ash">Seleccioná un tab</p>
                <p className="op-small text-smoke mt-1">para empezar a tomar pedidos</p>
              </div>
            </div>
          )}
        </div>

        {/* CENTRO: órdenes */}
        <div className="flex-1 min-w-0 border-r border-hair">
          <SoloOrdersPanel
            selectedSessionId={selectedSessionId}
            onSelectSession={handleSelectSession}
            refreshSignal={refreshSignal}
            onMutate={bumpRefresh}
          />
        </div>

        {/* DERECHA: cocina */}
        <div className="flex-1 min-w-0">
          <SoloKDSPanel refreshSignal={refreshSignal} onMutate={bumpRefresh} />
        </div>
      </div>
    </div>
  );
}
