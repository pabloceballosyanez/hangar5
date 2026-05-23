"use client";

import { useState } from "react";

export function MarkReadyButton({
  orderId,
  itemId,
  itemName,
}: {
  orderId: string;
  itemId: string;
  itemName: string;
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/restaurant/orders/${orderId}/items/${itemId}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "READY" }),
        }
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { error?: string }).error ?? "Error");
      }
      setDone(true);
    } catch {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <span className="shrink-0 px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-100 rounded-lg">
        Listo ✓
      </span>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="shrink-0 min-w-[76px] px-3 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1"
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
      ) : (
        "Listo ✓"
      )}
    </button>
  );
}
