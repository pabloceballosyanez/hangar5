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
      <span className="op-pill op-good shrink-0">
        Listo
      </span>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="op-btn op-btn-primary op-btn-sm shrink-0 min-w-[84px]"
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
      ) : (
        "Listo ✓"
      )}
    </button>
  );
}
