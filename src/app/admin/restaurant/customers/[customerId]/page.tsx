'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface LedgerEntry {
  id: string;
  amount: number;
  type: string;
  note: string | null;
  createdAt: string;
}

interface Order {
  id: string;
  total: number;
  status: string;
  createdAt?: string;
}

interface Session {
  id: string;
  label: string;
  type: string;
  status: string;
  openedAt: string;
  closedAt: string | null;
  orders: { total: number; status: string }[];
  payments: { amount: number; method: string }[];
}

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  balance: number;
  isActive: boolean;
  ledgerEntries: LedgerEntry[];
  sessions: Session[];
}

function formatPrice(p: number) { return `$${p.toFixed(2)}`; }
function fmtTime(iso: string) { return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }); }

const typeLabels: Record<string, string> = { CHARGE: 'Cargo', PAYMENT: 'Pago', REFUND: 'Reembolso', ADJUSTMENT: 'Ajuste' };

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.customerId as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Payment state
  const [payingSessionId, setPayingSessionId] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [paidSessionIds, setPaidSessionIds] = useState<Set<string>>(new Set());

  // Edit state
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const loadCustomer = async () => {
    const res = await fetch(`/api/admin/restaurant/customers/${customerId}`);
    const data = await res.json();
    setCustomer(data);
    setEditName(data.name || '');
    setEditPhone(data.phone || '');
    setEditEmail(data.email || '');
    setEditNotes(data.notes || '');
  };

  useEffect(() => {
    loadCustomer().then(() => setLoading(false)).catch(() => setLoading(false));
  }, [customerId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/restaurant/customers/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), phone: editPhone.trim() || null, email: editEmail.trim() || null, notes: editNotes.trim() || null }),
      });
      if (!res.ok) throw new Error('Error al guardar');
      router.push('/admin/restaurant/customers');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function handlePaySession(sessionId: string) {
    if (!customer) return;
    setPayingSessionId(sessionId);
    setPayError(null);
    try {
      // Get full order details for this session
      const sessionRes = await fetch(`/api/admin/restaurant/sessions/${sessionId}`);
      if (!sessionRes.ok) throw new Error('Error al obtener sesión');
      const session = await sessionRes.json();

      const activeOrders = session.orders.filter((o: { status: string }) => !['PAID', 'CANCELLED'].includes(o.status));
      const grandTotal = activeOrders.reduce((sum: number, o: { total: number }) => sum + o.total, 0);

      // Close the session with the total as payment
      await fetch(`/api/admin/restaurant/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payments: [{ method: 'CASH', amount: grandTotal }],
        }),
      });

      setPaidSessionIds(prev => new Set(prev).add(sessionId));
      await loadCustomer();
    } catch (e) {
      setPayError(e instanceof Error ? e.message : 'Error al cobrar');
    } finally {
      setPayingSessionId(null);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-red-600 mb-4">Cliente no encontrado</p>
        <Link href="/admin/restaurant/customers" className="text-blue-600 hover:text-blue-800 text-sm">← Volver</Link>
      </div>
    );
  }

  const openSessions = customer.sessions.filter(s => s.status === 'OPEN');
  const closedSessions = customer.sessions.filter(s => s.status !== 'OPEN');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <Link href="/admin/restaurant/customers" className="text-sm text-gray-500 hover:text-gray-700">← Volver a clientes</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">{customer.name}</h1>
      </div>

      {/* ─── Open Sessions (Cobrar) ─── */}
      {openSessions.length > 0 && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
          <h2 className="text-lg font-semibold text-amber-900 mb-3">
            🧾 Sesiones abiertas ({openSessions.length})
          </h2>
          {payError && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-3">{payError}</p>
          )}
          <div className="space-y-3">
            {openSessions.map(s => {
              const activeOrders = s.orders.filter(o => !['PAID', 'CANCELLED'].includes(o.status));
              const total = activeOrders.reduce((sum, o) => sum + o.total, 0);
              const isPaid = paidSessionIds.has(s.id);
              return (
                <div key={s.id} className="flex items-center justify-between bg-white rounded-lg p-4 border border-amber-200">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{s.label}</p>
                    <p className="text-xs text-gray-400">
                      Abierta {fmtTime(s.openedAt)} · {activeOrders.length} orden{activeOrders.length !== 1 ? 'es' : ''} activa{activeOrders.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-lg font-bold text-amber-700">{formatPrice(total)}</span>
                    {isPaid ? (
                      <span className="px-3 py-2 bg-green-100 text-green-700 text-sm font-medium rounded-lg">✅ Cobrado</span>
                    ) : (
                      <button
                        onClick={() => handlePaySession(s.id)}
                        disabled={payingSessionId === s.id || activeOrders.length === 0}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-white text-sm font-bold rounded-lg transition-all disabled:opacity-50 shadow-sm"
                      >
                        {payingSessionId === s.id ? 'Cobrando...' : '💵 Cobrar'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Edit form + Balance */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <form onSubmit={handleSave} className="space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nombre</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Teléfono</label>
                <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email</label>
                <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Notas</label>
                <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
              </div>
              <button type="submit" disabled={saving} className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </form>
          </div>

          {/* Balance card */}
          <div className={`rounded-xl p-5 text-center ${customer.balance > 0 ? 'bg-red-50 border border-red-200' : customer.balance < 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
            <p className="text-sm text-gray-500 mb-1">Saldo actual</p>
            <p className={`text-3xl font-black ${customer.balance > 0 ? 'text-red-600' : customer.balance < 0 ? 'text-green-600' : 'text-gray-600'}`}>
              {customer.balance > 0 ? formatPrice(customer.balance) : customer.balance < 0 ? `-${formatPrice(Math.abs(customer.balance))}` : '$0.00'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {customer.balance > 0 ? 'Pendiente de pago' : customer.balance < 0 ? 'Crédito a favor' : 'Cuenta al día'}
            </p>
          </div>
        </div>

        {/* Ledger + Sessions history */}
        <div className="lg:col-span-2 space-y-4">
          {/* Ledger */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Libro contable</h2>
            {customer.ledgerEntries.length === 0 ? (
              <p className="text-gray-400 text-sm">Sin movimientos</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {customer.ledgerEntries.map(e => (
                  <div key={e.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full mr-2 ${e.type === 'CHARGE' ? 'bg-red-100 text-red-700' : e.type === 'PAYMENT' ? 'bg-green-100 text-green-700' : e.type === 'REFUND' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {typeLabels[e.type] || e.type}
                      </span>
                      {e.note && <span className="text-sm text-gray-600">{e.note}</span>}
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-medium ${e.amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {e.amount > 0 ? `+${formatPrice(e.amount)}` : formatPrice(e.amount)}
                      </span>
                      <p className="text-xs text-gray-400">{new Date(e.createdAt).toLocaleDateString('es-MX')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sessions history */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Historial de sesiones</h2>
            {closedSessions.length === 0 && openSessions.length === 0 ? (
              <p className="text-gray-400 text-sm">Sin sesiones</p>
            ) : (
              <div className="space-y-2">
                {closedSessions.slice(0, 10).map(s => {
                  const ordersTotal = s.orders.reduce((sum, o) => sum + o.total, 0);
                  const paidTotal = s.payments.reduce((sum, p) => sum + p.amount, 0);
                  return (
                    <div key={s.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{s.label}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(s.openedAt).toLocaleDateString('es-MX')} · {s.orders.length} órdenes
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-medium ${paidTotal >= ordersTotal ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPrice(paidTotal)}
                        </span>
                        {s.closedAt && (
                          <p className="text-xs text-gray-400">{new Date(s.closedAt).toLocaleDateString('es-MX')}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
