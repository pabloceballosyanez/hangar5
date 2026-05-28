'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ROLES = [
  { value: 'SUPER_ADMIN', label: '👑 Super Admin' },
  { value: 'GERENTE', label: '💼 Gerente' },
  { value: 'GERENTE_TURNO', label: '🕐 Gerente Turno' },
  { value: 'MESERO', label: '🤵 Mesero' },
  { value: 'COCINERO', label: '👨‍🍳 Cocinero' },
  { value: 'BAR', label: '🍸 Bartender' },
  { value: 'RECEPCION', label: '🛎️ Recepción' },
  { value: 'CAJA', label: '💰 Caja' },
] as const;

export default function NuevoStaffPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [role, setRole] = useState('MESERO');
  const [pin, setPin] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [hourlyRate, setHourlyRate] = useState<number | ''>(50);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/restaurant/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          role,
          pin: pin.trim() || '0000',
          phone: phone.trim() || null,
          email: email.trim() || null,
          hourlyRate: hourlyRate === '' ? 0 : Number(hourlyRate),
          isActive: true,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Error al crear');
      }
      router.push('/admin/restaurant/staff');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nuevo miembro del staff</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Ej: Ana López"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">PIN (4 dígitos)</label>
          <input
            type="text"
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g,'').slice(0,4))}
            maxLength={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none tracking-[0.5em] text-center text-lg"
            placeholder="0000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rol <span className="text-red-500">*</span></label>
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {ROLES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="+52..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="correo@..."
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pago por hora (MXN)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              value={hourlyRate}
              onChange={e => setHourlyRate(e.target.value === '' ? '' : Number(e.target.value))}
              min={0}
              step={0.01}
              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            href="/admin/restaurant/staff"
            className="flex-1 text-center px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Creando...' : 'Crear staff'}
          </button>
        </div>
      </form>
    </div>
  );
}
