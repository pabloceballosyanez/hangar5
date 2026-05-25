'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Table {
  id: string; number: string; name: string | null; location: string | null; isActive: boolean;
}

interface Customer {
  id: string; name: string; phone: string | null;
}

export default function WaiterNuevoTabPage() {
  const router = useRouter();
  const [label, setLabel] = useState('');
  const [tabType, setTabType] = useState('TABLE');
  const [tableId, setTableId] = useState('');
  const [tables, setTables] = useState<Table[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Customer search state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/admin/restaurant/tables')
      .then(r => r.json())
      .then(data => setTables(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Search customers as user types
  const searchCustomers = useCallback(async (q: string) => {
    if (q.trim().length === 0) {
      setCustomers([]);
      setShowDropdown(false);
      return;
    }
    setLoadingCustomers(true);
    try {
      const res = await fetch(`/api/admin/restaurant/customers?search=${encodeURIComponent(q.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(Array.isArray(data) ? data.slice(0, 10) : []);
        setShowDropdown(true);
      }
    } catch { /* ignore */ }
    finally { setLoadingCustomers(false); }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) { setError('Ponle un nombre al tab'); return; }
    if (tabType === 'TABLE' && !tableId) { setError('Selecciona una mesa'); return; }
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, string | null> = {
        type: tabType,
        label: label.trim(),
        tableId: tabType === 'TABLE' ? tableId : null,
      };
      if (tabType === 'TAB') {
        if (selectedCustomer) {
          body.customerId = selectedCustomer.id;
        } else if (customerSearch.trim()) {
          body.customerName = customerSearch.trim();
        }
      }
      const res = await fetch('/api/admin/restaurant/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Error al crear');
      }
      const data = await res.json();
      router.push(`/waiter/session/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally { setSaving(false); }
  }

  const placeholder = tabType === 'TABLE' ? 'Ej: Mesa terraza' : tabType === 'TAB' ? 'Ej: Juan P.' : 'Ej: Barra-1';

  return (
    <div className="min-h-screen bg-slate-950 px-4">
      <header className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur border-b border-slate-800 py-3 flex items-center gap-3">
        <button onClick={() => router.push('/waiter')} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white text-xl">←</button>
        <h1 className="font-black text-white text-xl">Nuevo tab</h1>
      </header>

      <form onSubmit={handleSubmit} className="py-6 space-y-5 max-w-md">
        {error && <div className="p-3 bg-red-950/50 border border-red-700/40 rounded-xl text-sm text-red-300">{error}</div>}

        <div>
          <label className="block text-sm text-slate-400 mb-2">Tipo</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'TABLE', label: '🪑 Mesa', desc: 'Física' },
              { key: 'TAB', label: '👤 Persona', desc: 'Con nombre' },
              { key: 'WALKIN', label: '🚶 Walk-in', desc: 'Anónimo' },
            ].map(t => (
              <button key={t.key} type="button" onClick={() => { setTabType(t.key); setSelectedCustomer(null); setCustomerSearch(''); }}
                className={`p-3 rounded-xl border-2 text-left transition-all ${tabType === t.key ? 'border-amber-400 bg-amber-400/10' : 'border-slate-700 hover:border-slate-600'}`}>
                <p className="font-bold text-white text-sm">{t.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Nombre</label>
          <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder={placeholder}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-lg font-medium placeholder:text-slate-600 focus:outline-none focus:border-amber-400/50" required autoFocus />
        </div>

        {tabType === 'TABLE' && (
          <div>
            <label className="block text-sm text-slate-400 mb-1">Mesa</label>
            <select value={tableId} onChange={e => setTableId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400/50">
              <option value="">Seleccionar...</option>
              {tables.filter(t => t.isActive).map(t => (
                <option key={t.id} value={t.id}>{t.number} {t.name ? `· ${t.name}` : ''}</option>
              ))}
            </select>
          </div>
        )}

        {tabType === 'TAB' && (
          <div ref={dropdownRef} className="relative">
            <label className="block text-sm text-slate-400 mb-1">
              Cliente {selectedCustomer && <span className="text-emerald-400 ml-1">✓ Seleccionado</span>}
            </label>
            {selectedCustomer ? (
              /* Selected customer chip */
              <div className="flex items-center gap-2 p-3 bg-emerald-950/40 border border-emerald-700/40 rounded-xl">
                <span className="text-xl">👤</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{selectedCustomer.name}</p>
                  {selectedCustomer.phone && <p className="text-xs text-slate-400">{selectedCustomer.phone}</p>}
                </div>
                <button type="button" onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }}
                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors">
                  ✕
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={customerSearch}
                    onChange={e => { setCustomerSearch(e.target.value); searchCustomers(e.target.value); }}
                    onFocus={() => { if (customers.length > 0) setShowDropdown(true); }}
                    placeholder="Buscar cliente por nombre o teléfono..."
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400/50"
                  />
                  {loadingCustomers && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                {/* Dropdown */}
                {showDropdown && customers.length > 0 && (
                  <div className="absolute z-30 left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-2xl max-h-60 overflow-y-auto">
                    {customers.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); setShowDropdown(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-700/50 transition-colors border-b border-slate-700/50 last:border-0"
                      >
                        <span className="text-lg shrink-0">👤</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm truncate">{c.name}</p>
                          {c.phone && <p className="text-xs text-slate-400">{c.phone}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {/* No results */}
                {showDropdown && customerSearch.trim() && customers.length === 0 && !loadingCustomers && (
                  <div className="absolute z-30 left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-2xl p-4">
                    <p className="text-sm text-slate-400 text-center mb-2">Ningún cliente encontrado</p>
                    <p className="text-xs text-slate-500 text-center">
                      Se creará un cliente nuevo con el nombre: <span className="text-amber-400 font-medium">"{customerSearch.trim()}"</span>
                    </p>
                  </div>
                )}
              </>
            )}
            {/* Hint when empty */}
            {!selectedCustomer && !customerSearch && (
              <p className="text-xs text-slate-600 mt-1.5">Escribe para buscar clientes existentes o crear uno nuevo</p>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button type="button" onClick={() => router.push('/waiter')}
            className="flex-1 py-4 bg-slate-800 text-slate-400 font-semibold rounded-2xl active:scale-95 transition-all">Cancelar</button>
          <button type="submit" disabled={saving || !label.trim()}
            className="flex-1 py-4 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-900 font-black text-lg rounded-2xl transition-all disabled:opacity-50 shadow-lg shadow-amber-500/20">
            {saving ? 'Creando...' : 'Abrir tab'}
          </button>
        </div>
      </form>
    </div>
  );
}
