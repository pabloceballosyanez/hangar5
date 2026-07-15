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
    <div
      className="flex flex-col h-screen overflow-hidden bg-gray-100"
      style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
    >
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="shrink-0 h-11 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[#1b4235]">🔥 Modo Solo</span>
          <span className="text-[10px] text-gray-400 hidden sm:inline">
            Mesero · Cocina · Cobro en una pantalla
          </span>
        </div>
        <Link
          href="/admin/restaurant"
          className="flex items-center gap-1.5 text-xs font-semibold text-[#b88364] hover:text-white hover:bg-[#b88364] border border-[#b88364]/40 px-3 py-1.5 rounded-lg transition-all"
        >
          <span>←</span>
          <span>Volver al admin</span>
        </Link>
      </header>

      {/* ── Panels ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* LEFT: Menú + carrito */}
        <div className="flex-1 min-w-0 border-r border-gray-200">
          {selectedSessionId ? (
            <SoloMenuPanel
              key={`menu-${selectedSessionId}`}
              sessionId={selectedSessionId}
              onOrderSent={bumpRefresh}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-white">
              <div className="text-center text-gray-400">
                <div className="text-5xl mb-3">👈</div>
                <p className="text-sm font-medium">Seleccioná un tab</p>
                <p className="text-xs mt-1">para empezar a tomar pedidos</p>
              </div>
            </div>
          )}
        </div>

        {/* CENTER: Órdenes */}
        <div className="flex-1 min-w-0 border-r border-gray-200">
          <SoloOrdersPanel
            selectedSessionId={selectedSessionId}
            onSelectSession={handleSelectSession}
            refreshSignal={refreshSignal}
            onMutate={bumpRefresh}
          />
        </div>

        {/* RIGHT: KDS */}
        <div className="flex-1 min-w-0">
          <SoloKDSPanel refreshSignal={refreshSignal} onMutate={bumpRefresh} />
        </div>
      </div>
    </div>
  );
}
