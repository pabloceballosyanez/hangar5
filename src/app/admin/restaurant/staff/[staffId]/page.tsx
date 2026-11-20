'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

const roleLabel: Record<string, string> = Object.fromEntries(ROLES.map(r => [r.value, r.label]));
const roleColor: Record<string, string> = {
  SUPER_ADMIN: 'bg-[var(--color-adp-info)] text-white',
  GERENTE: 'bg-[var(--color-adp-info)] text-white',
  GERENTE_TURNO: 'bg-[var(--color-adp-info)] text-white',
  MESERO: 'bg-[var(--color-adp-listo)] text-white',
  COCINERO: 'bg-[var(--color-adp-atencion)] text-white',
  BAR: 'bg-[var(--color-adp-listo)] text-white',
  RECEPCION: 'bg-[var(--color-adp-atencion)] text-[var(--color-adp-atencion)]',
  CAJA: 'bg-[var(--color-adp-papel-3)] text-[var(--color-adp-tinta)]',
};

interface StaffShift {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface StaffClock {
  id: string;
  type: string;
  timestamp: string;
}

interface Staff {
  id: string;
  name: string;
  role: string;
  phone: string | null;
  email: string | null;
  hourlyRate: number;
  isActive: boolean;
  shifts: StaffShift[];
  clocks: StaffClock[];
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString('es-MX', {
    hour: '2-digit', minute: '2-digit',
    day: 'numeric', month: 'short',
  });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatMXN(n: number) { return `$${n.toFixed(2)}`; }

export default function StaffDetailPage() {
  const router = useRouter();
  const params = useParams();
  const staffId = params.staffId as string;

  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'shifts' | 'clocks'>('info');

  // Edit state
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('MESERO');
  const [editPin, setEditPin] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRate, setEditRate] = useState<number | ''>(50);
  const [editActive, setEditActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Shift form
  const [shiftDate, setShiftDate] = useState('');
  const [shiftStart, setShiftStart] = useState('');
  const [shiftEnd, setShiftEnd] = useState('');
  const [addingShift, setAddingShift] = useState(false);

  // Clock form
  const [clockType, setClockType] = useState<'IN' | 'OUT'>('IN');
  const [clockTimestamp, setClockTimestamp] = useState('');
  const [clocking, setClocking] = useState(false);

  const loadStaff = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/restaurant/staff/${staffId}`);
      if (!res.ok) throw new Error('No encontrado');
      const data = await res.json();
      setStaff(data);
      setEditName(data.name);
      setEditRole(data.role);
      setEditPin(data.pin || '');
      setEditPhone(data.phone || '');
      setEditEmail(data.email || '');
      setEditRate(data.hourlyRate);
      setEditActive(data.isActive);

      // Set default shift date to today
      const today = new Date().toISOString().split('T')[0];
      setShiftDate(today);
      setShiftStart('09:00');
      setShiftEnd('17:00');
      setClockTimestamp(new Date().toISOString().slice(0, 16));
    } catch {
      setError('Staff no encontrado');
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  useEffect(() => { loadStaff(); }, [loadStaff]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/restaurant/staff/${staffId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          role: editRole,
          pin: editPin.trim() || '0000',
          phone: editPhone.trim() || null,
          email: editEmail.trim() || null,
          hourlyRate: editRate === '' ? 0 : Number(editRate),
          isActive: editActive,
        }),
      });
      if (!res.ok) throw new Error('Error al guardar');
      await loadStaff();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddShift(e: React.FormEvent) {
    e.preventDefault();
    if (!shiftDate || !shiftStart || !shiftEnd) return;
    setAddingShift(true);
    try {
      const date = new Date(shiftDate + 'T00:00:00').toISOString();
      const startTime = new Date(`${shiftDate}T${shiftStart}:00`).toISOString();
      const endTime = new Date(`${shiftDate}T${shiftEnd}:00`).toISOString();
      const res = await fetch(`/api/admin/restaurant/staff/${staffId}/shifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, startTime, endTime }),
      });
      if (!res.ok) throw new Error('Error');
      await loadStaff();
    } catch {
      alert('No se pudo agregar el turno');
    } finally {
      setAddingShift(false);
    }
  }

  async function handleClock() {
    setClocking(true);
    try {
      const res = await fetch(`/api/admin/restaurant/staff/${staffId}/clocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: clockType, timestamp: new Date(clockTimestamp).toISOString() }),
      });
      if (!res.ok) throw new Error('Error');
      setClockTimestamp(new Date().toISOString().slice(0, 16));
      await loadStaff();
    } catch {
      alert('No se pudo registrar');
    } finally {
      setClocking(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-adp-info)] mx-auto mb-4" />
        <p className="text-[var(--color-adp-tinta-2)]">Cargando...</p>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-[var(--color-adp-urgente)] mb-4">Staff no encontrado</p>
        <Link href="/admin/restaurant/staff" className="text-[var(--color-adp-pino)] text-sm">← Volver</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="mb-2">
        <Link href="/admin/restaurant/staff" className="text-sm text-[var(--color-adp-tinta-2)] hover:text-[var(--color-adp-tinta)]">← Volver a staff</Link>
        <div className="flex items-center gap-3 mt-2">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl ${staff.isActive ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'}`}>
            {staff.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-adp-tinta)]">{staff.name}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColor[staff.role] || 'bg-[var(--color-adp-papel-3)]'}`}>
              {roleLabel[staff.role] || staff.role}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--color-adp-borde)]">
        {[
          { key: 'info' as const, label: 'Información' },
          { key: 'shifts' as const, label: `Turnos (${staff.shifts?.length || 0})` },
          { key: 'clocks' as const, label: `Fichajes (${staff.clocks?.length || 0})` },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? 'border-[var(--color-adp-info)] text-[var(--color-adp-pino)]' : 'border-transparent text-[var(--color-adp-tinta-2)] hover:text-[var(--color-adp-tinta)]'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Info Tab */}
      {activeTab === 'info' && (
        <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-[var(--color-adp-borde)] p-6 space-y-4">
          <h2 className="font-semibold text-[var(--color-adp-tinta)]">Editar información</h2>
          {error && <p className="text-sm text-white bg-[var(--color-adp-urgente)] p-3 rounded-lg">{error}</p>}
          <div>
            <label className="block text-xs text-[var(--color-adp-tinta-2)] mb-1">Nombre</label>
            <input type="text" value={editName} onChange={e => setEditName(e.target.value)} required
              className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none" />
          </div>
          <div>
            <label className="block text-xs text-[var(--color-adp-tinta-2)] mb-1">PIN (4 dígitos)</label>
            <input type="text" value={editPin} onChange={e => setEditPin(e.target.value.replace(/\D/g,'').slice(0,4))}
              maxLength={4}
              className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm tracking-[0.5em] text-center text-lg focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none"
              placeholder="0000" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[var(--color-adp-tinta-2)] mb-1">Rol</label>
              <select value={editRole} onChange={e => setEditRole(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm bg-white focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none">
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--color-adp-tinta-2)] mb-1">Pago/hr (MXN)</label>
              <input type="number" value={editRate} onChange={e => setEditRate(e.target.value === '' ? '' : Number(e.target.value))}
                min={0} step={0.01}
                className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[var(--color-adp-tinta-2)] mb-1">Teléfono</label>
              <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-[var(--color-adp-tinta-2)] mb-1">Email</label>
              <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="editActive" checked={editActive} onChange={e => setEditActive(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--color-adp-borde-2)] text-[var(--color-adp-pino)] focus:ring-[var(--color-adp-pino)]/40" />
            <label htmlFor="editActive" className="text-sm text-[var(--color-adp-tinta)]">Activo</label>
          </div>
          <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="px-4 py-2 bg-[var(--color-adp-pino)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-adp-pino-hondo)] disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <button type="button" onClick={async () => {
            if (!confirm('¿Eliminar a ' + editName + ' permanentemente?')) return;
            try {
              const res = await fetch('/api/admin/restaurant/staff/' + staffId, { method: 'DELETE' });
              if (!res.ok) throw new Error('Error al eliminar');
              router.push('/admin/restaurant/staff');
            } catch { alert('No se pudo eliminar'); }
          }}
            className="px-4 py-2 bg-[var(--color-adp-urgente)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-adp-urgente)]/85">
            🗑 Eliminar
          </button>
          </div></form>
      )}

      {/* Shifts Tab */}
      {activeTab === 'shifts' && (
        <div className="space-y-4">
          {/* Add shift form */}
          <form onSubmit={handleAddShift} className="bg-white rounded-xl shadow-sm border border-[var(--color-adp-borde)] p-5">
            <h2 className="font-semibold text-[var(--color-adp-tinta)] mb-4">Agregar turno</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-[var(--color-adp-tinta-2)] mb-1">Fecha</label>
                <input type="date" value={shiftDate} onChange={e => setShiftDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none" />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-adp-tinta-2)] mb-1">Entrada</label>
                <input type="time" value={shiftStart} onChange={e => setShiftStart(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none" />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-adp-tinta-2)] mb-1">Salida</label>
                <input type="time" value={shiftEnd} onChange={e => setShiftEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none" />
              </div>
            </div>
            <button type="submit" disabled={addingShift}
              className="mt-3 px-4 py-2 bg-[var(--color-adp-pino)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-adp-pino-hondo)] disabled:opacity-50">
              {addingShift ? 'Agregando...' : '+ Agregar turno'}
            </button>
          </form>

          {/* Shifts list */}
          <div className="bg-white rounded-xl shadow-sm border border-[var(--color-adp-borde)] overflow-hidden">
            {(!staff.shifts || staff.shifts.length === 0) ? (
              <div className="p-8 text-center text-[var(--color-adp-tinta-2)]">Sin turnos registrados</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-adp-borde)] bg-[var(--color-adp-papel-3)]">
                    <th className="text-left py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs">Fecha</th>
                    <th className="text-left py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs">Entrada</th>
                    <th className="text-left py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs">Salida</th>
                    <th className="text-right py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs">Horas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-adp-borde)]">
                  {staff.shifts.slice(0, 20).map(s => {
                    const start = new Date(s.startTime);
                    const end = new Date(s.endTime);
                    const hours = ((end.getTime() - start.getTime()) / 3600000).toFixed(1);
                    return (
                      <tr key={s.id}>
                        <td className="py-2 px-4 font-medium text-[var(--color-adp-tinta)]">{fmtDate(s.date)}</td>
                        <td className="py-2 px-4 text-[var(--color-adp-tinta-2)]">{start.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="py-2 px-4 text-[var(--color-adp-tinta-2)]">{end.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="py-2 px-4 text-right font-medium text-[var(--color-adp-tinta)]">{hours}h</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Clocks Tab */}
      {activeTab === 'clocks' && (
        <div className="space-y-4">
          {/* Clock form */}
          <div className="bg-white rounded-xl shadow-sm border border-[var(--color-adp-borde)] p-5">
            <h2 className="font-semibold text-[var(--color-adp-tinta)] mb-4">Registrar fichaje</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-xs text-[var(--color-adp-tinta-2)] mb-1">Tipo</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setClockType('IN')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${clockType === 'IN' ? 'bg-[var(--color-adp-listo)] border-[var(--color-adp-listo)] text-white' : 'bg-white border-[var(--color-adp-borde)] text-[var(--color-adp-tinta-2)]'}`}>
                    🟢 Entrada
                  </button>
                  <button type="button" onClick={() => setClockType('OUT')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${clockType === 'OUT' ? 'bg-[var(--color-adp-urgente)] border-[var(--color-adp-urgente)] text-white' : 'bg-white border-[var(--color-adp-borde)] text-[var(--color-adp-tinta-2)]'}`}>
                    🔴 Salida
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-[var(--color-adp-tinta-2)] mb-1">Fecha y hora</label>
                <input type="datetime-local" value={clockTimestamp} onChange={e => setClockTimestamp(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none" />
              </div>
              <button onClick={handleClock} disabled={clocking}
                className="py-2 bg-[var(--color-adp-pino)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-adp-pino-hondo)] disabled:opacity-50">
                {clocking ? 'Registrando...' : 'Registrar'}
              </button>
            </div>
          </div>

          {/* Clocks list */}
          <div className="bg-white rounded-xl shadow-sm border border-[var(--color-adp-borde)] overflow-hidden">
            {(!staff.clocks || staff.clocks.length === 0) ? (
              <div className="p-8 text-center text-[var(--color-adp-tinta-2)]">Sin fichajes registrados</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-adp-borde)] bg-[var(--color-adp-papel-3)]">
                    <th className="text-left py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs">Tipo</th>
                    <th className="text-left py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs">Fecha y hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-adp-borde)]">
                  {staff.clocks.slice(0, 30).map(c => (
                    <tr key={c.id}>
                      <td className="py-2 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.type === 'IN' ? 'bg-[var(--color-adp-listo)] text-white' : 'bg-[var(--color-adp-urgente)] text-white'}`}>
                          {c.type === 'IN' ? '🟢 Entrada' : '🔴 Salida'}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-[var(--color-adp-tinta-2)]">{fmtTime(c.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
