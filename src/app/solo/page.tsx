'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import SoloMenuPanel from '@/components/SoloMenuPanel';
import SoloOrdersPanel from '@/components/SoloOrdersPanel';
import SoloKDSPanel from '@/components/SoloKDSPanel';

export default function SoloPage() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

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
        <Link
          href="/kds"
          className="op-btn op-btn-ghost op-btn-sm shrink-0"
        >
          KDS →
        </Link>
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
