'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function WaiterNuevoTabPage() {
  const router = useRouter();
  const [label, setLabel] = useState('');
  const [tabType, setTabType] = useState('TAB');
  const [customerName, setCustomerName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) { setError('Ponle un nombre al tab'); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/restaurant/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: tabType,
          label: label.trim(),
          customerName: customerName.trim() || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Error al crear');
      }
      const data = await res.json();
      router.push(`/waiter/session/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur border-b border-slate-800 py-3 flex items-center gap-3">
        <button onClick={() => router.push('/waiter')} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white text-xl">
          ←
        </button>
        <h1 className="font-black text-white text-xl">Nuevo tab</h1>
      </header>

      <form onSubmit={handleSubmit} className="py-6 space-y-5 max-w-md">
        {error && (
          <div className="p-3 bg-red-950/50 border border-red-700/40 rounded-xl text-sm text-red-300">{error}</div>
        )}

        {/* Type */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Tipo</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'TAB', label: '👤 Persona', desc: 'Con nombre' },
              { key: 'WALKIN', label: '🚶 Walk-in', desc: 'Anónimo' },
            ].map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTabType(t.key)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  tabType === t.key
                    ? 'border-amber-400 bg-amber-400/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <p className="font-bold text-white text-lg">{t.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Label */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">Nombre del tab</label>
          <input
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Ej: Juan P., Mesa terraza"
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-lg font-medium placeholder:text-slate-600 focus:outline-none focus:border-amber-400/50"
            required
            autoFocus
          />
        </div>

        {/* Customer name (for TAB type) */}
        {tabType === 'TAB' && (
          <div>
            <label className="block text-sm text-slate-400 mb-1">Cliente (opcional)</label>
            <input
              type="text"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="Nombre del cliente"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400/50"
            />
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.push('/waiter')}
            className="flex-1 py-4 bg-slate-800 text-slate-400 font-semibold rounded-2xl active:scale-95 transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || !label.trim()}
            className="flex-1 py-4 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-900 font-black text-lg rounded-2xl transition-all disabled:opacity-50 shadow-lg shadow-amber-500/20"
          >
            {saving ? 'Creando...' : 'Abrir tab'}
          </button>
        </div>
      </form>
    </div>
  );
}
