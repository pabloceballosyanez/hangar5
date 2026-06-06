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
  hasCredit: boolean;
  ledgerEntries: LedgerEntry[];
  sessions: Session[];
}

function formatPrice(p: number) { return `$${p.toFixed(2)}`; }
function fmtTime(iso: string) { return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }); }

const typeLabels: Record<string, string> = { CHARGE: 'Cargo', PAYMENT: 'Pago', REFUND: 'Reembolso', ADJUSTMENT: 'Ajuste' };
const methodLabels: Record<string, string> = { CASH: '💵 Efectivo', CARD: '💳 Tarjeta', TRANSFER: '🏦 Transferencia', MP: '📱 Mercado Pago' };

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.customerId as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Payment state
  const [showPayForm, setShowPayForm] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CASH');
  const [payNote, setPayNote] = useState('');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [paySuccess, setPaySuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    // Default payment amount to full balance
    setPayAmount(data.balance > 0 ? data.balance.toFixed(2) : '');
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

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) {
      setPayError('Ingresa un monto válido');
      return;
    }
    if (!customer || amount > customer.balance) {
      setPayError(`El monto no puede exceder el saldo pendiente (${formatPrice(customer?.balance || 0)})`);
      return;
    }
    setPaying(true);
    setPayError(null);
    setPaySuccess(false);
    try {
      const res = await fetch(`/api/admin/restaurant/customers/${customerId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, method: payMethod, note: payNote.trim() || null }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Error al registrar pago');
      }
      setPaySuccess(true);
      setShowPayForm(false);
      setPayNote('');
      await loadCustomer();
      setTimeout(() => setPaySuccess(false), 4000);
    } catch (e) {
      setPayError(e instanceof Error ? e.message : 'Error');
    } finally {
      setPaying(false);
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
        <div className="flex items-center justify-between mt-2">
          <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
          <div className="flex gap-2">
            {/* Toggle credit */}
            <button
              onClick={async () => {
                if (!confirm(`¿${customer.hasCredit ? 'Quitar' : 'Dar'} crédito a ${customer.name}? ${customer.hasCredit ? 'Ya no podrá cargar a su cuenta.' : 'Podrá pagar con cargo a su cuenta en pedidos online.'}`)) return;
                setDeleting(true);
                try {
                  const res = await fetch(`/api/admin/restaurant/customers/${customerId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ hasCredit: !customer.hasCredit }),
                  });
                  if (!res.ok) throw new Error('Error');
                  setCustomer({ ...customer, hasCredit: !customer.hasCredit });
                } catch {
                  alert('No se pudo completar');
                } finally {
                  setDeleting(false);
                }
              }}
              disabled={deleting}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border disabled:opacity-50 transition-colors ${
                customer.hasCredit
                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                  : 'text-amber-600 border-amber-200 hover:bg-amber-50'
              }`}
            >
              {deleting ? '⋯' : customer.hasCredit ? '📋 Con crédito' : '📋 Sin crédito'}
            </button>
            <button
            onClick={async () => {
              const action = customer.isActive ? 'desactivar' : 'reactivar';
              if (!confirm(`¿${action === 'desactivar' ? 'Desactivar' : 'Reactivar'} a ${customer.name}? ${customer.isActive ? 'No aparecerá en búsquedas pero su historial se conserva.' : 'Volverá a estar disponible.'}`)) return;
              setDeleting(true);
              try {
                const res = await fetch(`/api/admin/restaurant/customers/${customerId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ isActive: !customer.isActive }),
                });
                if (!res.ok) throw new Error('Error');
                setCustomer({ ...customer, isActive: !customer.isActive });
              } catch {
                alert('No se pudo completar');
              } finally {
                setDeleting(false);
              }
            }}
            disabled={deleting}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border disabled:opacity-50 transition-colors ${
              customer.isActive
                ? 'text-red-600 border-red-200 hover:bg-red-50'
                : 'text-green-600 border-green-200 hover:bg-green-50'
            }`}
          >
            {deleting ? '⋯' : customer.isActive ? '✕ Desactivar' : '↻ Reactivar'}
          </button>
          </div>
        </div>
      </div>

      {/* ─── Cobrar deuda (siempre que tenga saldo pendiente) ─── */}
      {customer.balance > 0 && (
        <div className="bg-red-50 rounded-xl border border-red-200 p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-semibold text-red-900">💳 Deuda pendiente</h2>
              <p className="text-sm text-red-600 mt-0.5">
                Este cliente debe <span className="font-bold">{formatPrice(customer.balance)}</span>
              </p>
            </div>
            {!showPayForm ? (
              <button
                onClick={() => { setShowPayForm(true); setPayAmount(customer.balance.toFixed(2)); setPayError(null); }}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white text-sm font-bold rounded-lg transition-all shadow-sm"
              >
                💵 Registrar pago
              </button>
            ) : (
              <button
                onClick={() => setShowPayForm(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-all"
              >
                Cancelar
              </button>
            )}
          </div>

          {/* Payment form */}
          {showPayForm && (
            <form onSubmit={handlePay} className="mt-4 bg-white rounded-lg border border-red-200 p-4 space-y-3">
              {payError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{payError}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Monto a cobrar</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                    <input
                      type="number"
                      value={payAmount}
                      onChange={e => setPayAmount(e.target.value)}
                      step="0.01"
                      min="0.01"
                      max={customer.balance}
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                      required
                      autoFocus
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setPayAmount(customer.balance.toFixed(2))}
                    className="text-xs text-red-500 hover:text-red-700 mt-1"
                  >
                    Cobrar total: {formatPrice(customer.balance)}
                  </button>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Método de pago</label>
                  <select
                    value={payMethod}
                    onChange={e => setPayMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                  >
                    {Object.entries(methodLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nota (opcional)</label>
                <input
                  type="text"
                  value={payNote}
                  onChange={e => setPayNote(e.target.value)}
                  placeholder="Ej: Pago en efectivo mesa 5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={paying}
                className="w-full py-2.5 bg-green-600 hover:bg-green-500 active:scale-95 text-white text-sm font-bold rounded-lg transition-all disabled:opacity-50"
              >
                {paying ? 'Registrando...' : `✅ Confirmar pago de ${formatPrice(parseFloat(payAmount) || 0)}`}
              </button>
            </form>
          )}
        </div>
      )}

      {/* ─── Success toast ─── */}
      {paySuccess && (
        <div className="bg-green-50 rounded-xl border border-green-200 p-4 flex items-center gap-3">
          <span className="text-xl">✅</span>
          <div>
            <p className="font-semibold text-green-900">¡Pago registrado!</p>
            <p className="text-sm text-green-700">El saldo del cliente se ha actualizado.</p>
          </div>
        </div>
      )}

      {/* ─── Open Sessions (info) ─── */}
      {openSessions.length > 0 && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">
            🧾 Sesiones abiertas ({openSessions.length})
          </h2>
          <div className="space-y-2">
            {openSessions.map(s => {
              const ordersTotal = s.orders.reduce((sum, o) => sum + o.total, 0);
              return (
                <div key={s.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-200">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{s.label}</p>
                    <p className="text-xs text-gray-400">Abierta {fmtTime(s.openedAt)} · {s.orders.length} órdenes</p>
                  </div>
                  <span className="text-sm font-bold text-blue-700">{formatPrice(ordersTotal)}</span>
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
                {[...openSessions, ...closedSessions].slice(0, 15).map(s => {
                  const ordersTotal = s.orders.reduce((sum, o) => sum + o.total, 0);
                  const paidTotal = s.payments.reduce((sum, p) => sum + p.amount, 0);
                  return (
                    <div key={s.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-800">{s.label}</p>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${s.status === 'OPEN' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                            {s.status === 'OPEN' ? 'Abierta' : 'Cerrada'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">
                          {new Date(s.openedAt).toLocaleDateString('es-MX')} · {s.orders.length} órdenes · {formatPrice(ordersTotal)}
                        </p>
                      </div>
                      <div className="text-right">
                        {paidTotal > 0 && (
                          <span className="text-xs font-medium text-green-600">Pagado {formatPrice(paidTotal)}</span>
                        )}
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
