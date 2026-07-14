'use client';

import { useState, useCallback } from 'react';
import SoloMenuPanel from '@/components/SoloMenuPanel';
import SoloOrdersPanel from '@/components/SoloOrdersPanel';
import SoloKDSPanel from '@/components/SoloKDSPanel';

export default function SoloPage() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleOrderSent = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  const handleSelectSession = useCallback((id: string) => {
    setSelectedSessionId(id);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Modo Solo v2 — inline session creation */}
      {/* LEFT: Menú + carrito */}
      <div className="flex-1 min-w-0 border-r border-gray-200">
        {selectedSessionId ? (
          <SoloMenuPanel
            key={`menu-${selectedSessionId}`}
            sessionId={selectedSessionId}
            onOrderSent={handleOrderSent}
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-white">
            <div className="text-center text-gray-400">
              <div className="text-5xl mb-3">👈</div>
              <p className="text-sm font-medium">Seleccioná una mesa</p>
              <p className="text-xs mt-1">para empezar a tomar pedidos v2</p>
            </div>
          </div>
        )}
      </div>

      {/* CENTER: Órdenes */}
      <div className="flex-1 min-w-0 border-r border-gray-200">
        <SoloOrdersPanel
          key={`orders-${refreshKey}`}
          selectedSessionId={selectedSessionId}
          onSelectSession={handleSelectSession}
        />
      </div>

      {/* RIGHT: KDS */}
      <div className="flex-1 min-w-0">
        <SoloKDSPanel key={`kds-${refreshKey}`} />
      </div>
    </div>
  );
}
