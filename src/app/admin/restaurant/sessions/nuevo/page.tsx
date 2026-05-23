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

export default function NuevoTabPage() {
  const router = useRouter();

  const [tabType, setTabType] = useState('TAB');
  const [label, setLabel] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/restaurant/customers')
      .then(r => r.json())
      .then(data => setCustomers(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const filteredCustomers = customerSearch
    ? customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || (c.phone && c.phone.includes(customerSearch)))
    : customers.slice(0, 5);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) { setError('La etiqueta es requerida'); return; }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/restaurant/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: tabType,
          label: label.trim(),
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Abrir tab</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

        {/* Type selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'TAB', label: '👤 Tab', desc: 'Persona con cuenta' },
              { key: 'WALKIN', label: '🚶 Walk-in', desc: 'Anónimo rápido' },
            ].map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTabType(t.key)}
                className={`p-3 rounded-lg border-2 text-sm text-left transition-colors ${
                  tabType === t.key
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-medium">{t.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Label */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Etiqueta <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder={'Ej: Juan P., Mesa terraza, Grupo verde'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
        </div>

        {/* Customer search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
          <input
            type="text"
            value={customerSearch}
            onChange={e => { setCustomerSearch(e.target.value); setSelectedCustomer(null); }}
            placeholder="Buscar cliente existente..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-2"
          />
          {customerSearch && filteredCustomers.length > 0 && !selectedCustomer && (
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 mb-2 max-h-40 overflow-y-auto">
              {filteredCustomers.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(c);
                    setCustomerSearch(c.name);
                    if (!label) setLabel(c.name);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                >
                  <span className="font-medium">{c.name}</span>
                  {c.phone && <span className="text-gray-400 ml-2">{c.phone}</span>}
                  {c.balance !== 0 && (
                    <span className={`ml-2 text-xs font-medium ${c.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {c.balance > 0 ? `Debe $${c.balance}` : `Crédito $${Math.abs(c.balance)}`}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          {selectedCustomer && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-sm flex items-center justify-between">
              <span>
                👤 <span className="font-medium">{selectedCustomer.name}</span>
                {selectedCustomer.balance !== 0 && (
                  <span className={`ml-2 text-xs font-medium ${selectedCustomer.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    Saldo: ${selectedCustomer.balance}
                  </span>
                )}
              </span>
              <button type="button" onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
          )}
        </div>

        {/* Quick new customer (if no customer selected) */}
        {!selectedCustomer && tabType !== 'WALKIN' && (
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <p className="text-xs text-gray-500 uppercase font-medium">O crear cliente nuevo</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nombre</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Nombre"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="+52..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Link href="/admin/restaurant/sessions" className="flex-1 text-center px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Creando...' : 'Abrir tab'}
          </button>
        </div>
      </form>
    </div>
  );
}
