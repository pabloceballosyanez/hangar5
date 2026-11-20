'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NuevoClientePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [hasCredit, setHasCredit] = useState(true);
  const [creditLimit, setCreditLimit] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/restaurant/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          email: email.trim() || null,
          notes: notes.trim() || null,
          hasCredit,
          creditLimit: creditLimit.trim() ? parseFloat(creditLimit) : null,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Error al crear');
      }
      router.push('/admin/restaurant/customers');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-[var(--color-adp-tinta)] mb-6">Nuevo cliente</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-[var(--color-adp-borde)] p-6 space-y-4">
        {error && <p className="text-sm text-white bg-[var(--color-adp-urgente)] p-3 rounded-lg">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-[var(--color-adp-tinta)] mb-1">Nombre <span className="text-[var(--color-adp-urgente)]">*</span></label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full border border-[var(--color-adp-borde-2)] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 focus:border-[var(--color-adp-info)] outline-none"
            placeholder="Ej: Juan Pérez"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-adp-tinta)] mb-1">Teléfono</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full border border-[var(--color-adp-borde-2)] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none"
              placeholder="+52..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-adp-tinta)] mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-[var(--color-adp-borde-2)] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none"
              placeholder="correo@..."
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-adp-tinta)] mb-1">Notas</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className="w-full border border-[var(--color-adp-borde-2)] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none resize-none"
            placeholder="Cliente frecuente, prefiere terraza..."
          />
        </div>

        <div className="border border-[var(--color-adp-borde)] rounded-lg p-4 space-y-3 bg-[var(--color-adp-papel-3)]/50">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hasCredit}
              onChange={e => setHasCredit(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--color-adp-borde-2)] text-[var(--color-adp-pino)] focus:ring-[var(--color-adp-pino)]/40"
            />
            <span className="text-sm font-medium text-[var(--color-adp-tinta)]">📋 Habilitar crédito (puede cargar a su cuenta)</span>
          </label>
          {hasCredit && (
            <div>
              <label className="block text-xs font-medium text-[var(--color-adp-tinta-2)] mb-1">Límite de crédito (opcional)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={creditLimit}
                onChange={e => setCreditLimit(e.target.value)}
                className="w-full border border-[var(--color-adp-borde-2)] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none"
                placeholder="Ej: 5000 (dejar vacío = sin límite)"
              />
              <p className="text-xs text-[var(--color-adp-tinta-2)] mt-1">En pesos MXN. Dejalo vacío para crédito sin tope.</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Link href="/admin/restaurant/customers" className="flex-1 text-center px-4 py-2 border border-[var(--color-adp-borde-2)] text-sm font-medium text-[var(--color-adp-tinta)] rounded-lg hover:bg-[var(--color-adp-papel-3)] transition-colors">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="flex-1 py-2.5 bg-[var(--color-adp-pino)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-adp-pino-hondo)] disabled:opacity-50 transition-colors"
          >
            {saving ? 'Creando...' : 'Crear cliente'}
          </button>
        </div>
      </form>
    </div>
  );
}
