'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  balance: number;
}

interface Table {
  id: string;
  number: string;
  name: string | null;
  location: string | null;
  isActive: boolean;
}

export default function NuevoTabPage() {
  const router = useRouter();

  const [tabType, setTabType] = useState('TAB');
  const [label, setLabel] = useState('');
  const [tableId, setTableId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/restaurant/customers')
      .then(r => r.json())
      .then(data => setCustomers(Array.isArray(data) ? data : []))
      .catch(() => {});
    fetch('/api/admin/restaurant/tables')
      .then(r => r.json())
      .then(data => setTables(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const filteredCustomers = customerSearch
    ? customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || (c.phone && c.phone.includes(customerSearch)))
    : customers.slice(0, 5);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) { setError('La etiqueta es requerida'); return; }
    if (tabType === 'TABLE' && !tableId) { setError('Selecciona una mesa'); return; }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/restaurant/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: tabType,
          label: label.trim(),
          tableId: tabType === 'TABLE' ? tableId : null,
          customerId: selectedCustomer?.id || null,
          customerName: selectedCustomer ? null : customerName.trim() || null,
          customerPhone: selectedCustomer ? null : customerPhone.trim() || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Error al crear');
      }
      router.push('/admin/restaurant/sessions');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-[var(--color-adp-tinta)] mb-6">Abrir cuenta</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-[var(--color-adp-borde)] p-6 space-y-4">
        {error && <p className="text-sm text-white bg-[var(--color-adp-urgente)] p-3 rounded-lg">{error}</p>}

        {/* Type selector */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-adp-tinta)] mb-2">Tipo</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'TABLE', label: '🪑 Mesa', desc: 'Con mesa física' },
              { key: 'TAB', label: '👤 Cuenta', desc: 'Persona con cuenta' },
              { key: 'WALKIN', label: 'Sin reserva', desc: 'Cliente sin registro' },
            ].map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTabType(t.key)}
                className={`p-3 rounded-lg border-2 text-sm text-left transition-colors ${
                  tabType === t.key
                    ? 'border-[var(--color-adp-info)] bg-[var(--color-adp-info)]'
                    : 'border-[var(--color-adp-borde)] hover:border-[var(--color-adp-borde-2)]'
                } text-white`}
              >
                <p className="font-medium">{t.label}</p>
                <p className="text-xs text-[var(--color-adp-tinta-2)] mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Label */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-adp-tinta)] mb-1">Etiqueta <span className="text-[var(--color-adp-urgente)]">*</span></label>
          <input
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder={tabType === 'TABLE' ? 'Ej: Mesa terraza' : 'Ej: Grupo Juan'}
            className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none"
            required
          />
        </div>

        {/* Table selector (only for TABLE type) */}
        {tabType === 'TABLE' && (
          <div>
            <label className="block text-sm font-medium text-[var(--color-adp-tinta)] mb-1">Mesa</label>
            <select
              value={tableId}
              onChange={e => setTableId(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm bg-white focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none"
            >
              <option value="">Seleccionar mesa...</option>
              {tables.filter(t => t.isActive).map(t => (
                <option key={t.id} value={t.id}>
                  {t.number} {t.name ? `· ${t.name}` : ''} {t.location ? `(${t.location})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Customer search */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-adp-tinta)] mb-1">Cliente</label>
          <input
            type="text"
            value={customerSearch}
            onChange={e => { setCustomerSearch(e.target.value); setSelectedCustomer(null); }}
            placeholder="Buscar cliente existente..."
            className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none mb-2"
          />
          {customerSearch && filteredCustomers.length > 0 && !selectedCustomer && (
            <div className="border border-[var(--color-adp-borde)] rounded-lg divide-y divide-[var(--color-adp-borde)] mb-2 max-h-40 overflow-y-auto">
              {filteredCustomers.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(c);
                    setCustomerSearch(c.name);
                    if (!label) setLabel(c.name);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[var(--color-adp-papel-3)] text-sm"
                >
                  <span className="font-medium">{c.name}</span>
                  {c.phone && <span className="text-[var(--color-adp-tinta-2)] ml-2">{c.phone}</span>}
                  {c.balance !== 0 && (
                    <span className={`ml-2 text-xs font-medium ${c.balance > 0 ? 'text-[var(--color-adp-urgente)]' : 'text-[var(--color-adp-listo)]'}`}>
                      {c.balance > 0 ? `Debe $${c.balance}` : `Crédito $${Math.abs(c.balance)}`}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          {selectedCustomer && (
            <div className="bg-[var(--color-adp-info)] border border-[var(--color-adp-info)] rounded-lg p-2 text-sm flex items-center justify-between text-white">
              <span>
                👤 <span className="font-medium">{selectedCustomer.name}</span>
                {selectedCustomer.balance !== 0 && (
                  <span className={`ml-2 text-xs font-medium ${selectedCustomer.balance > 0 ? 'text-[var(--color-adp-urgente)]' : 'text-[var(--color-adp-listo)]'}`}>
                    Saldo: ${selectedCustomer.balance}
                  </span>
                )}
              </span>
              <button type="button" onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }} className="text-[var(--color-adp-tinta-2)] hover:text-[var(--color-adp-tinta-2)]">✕</button>
            </div>
          )}
        </div>

        {/* Quick new customer (if no customer selected) */}
        {!selectedCustomer && tabType !== 'WALKIN' && (
          <div className="border-t border-[var(--color-adp-borde)] pt-4 space-y-3">
            <p className="text-xs text-[var(--color-adp-tinta-2)] uppercase font-medium">O crear cliente nuevo</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[var(--color-adp-tinta-2)] mb-1">Nombre</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Nombre"
                  className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-adp-tinta-2)] mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="+52..."
                  className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Link href="/admin/restaurant/sessions" className="flex-1 text-center px-4 py-2 border border-[var(--color-adp-borde-2)] text-sm font-medium text-[var(--color-adp-tinta)] rounded-lg hover:bg-[var(--color-adp-papel-3)] transition-colors">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 bg-[var(--color-adp-pino)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-adp-pino-hondo)] disabled:opacity-50 transition-colors"
          >
            {saving ? 'Creando...' : 'Abrir cuenta'}
          </button>
        </div>
      </form>
    </div>
  );
}
