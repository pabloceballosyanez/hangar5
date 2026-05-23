'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface OrderItem {
  id: string;
  quantity: number;
  menuItem: { name: string };
  variant: { name: string } | null;
  modifiers: { modifierName: string; priceDelta: number }[];
}

interface Order {
  id: string;
  status: string;
  total: number;
  subtotal: number;
  tax: number;
  orderItems: OrderItem[];
}

interface Session {
  id: string;
  type: string;
  label: string;
  status: string;
  openedAt: string;
  table: { number: string; name: string | null } | null;
  customer: { id: string; name: string; phone: string | null } | null;
  orders: Order[];
  payments: { amount: number; method: string }[];
  _count: { orders: number };
}

function formatPrice(p: number) { return `$${p.toFixed(2)}`; }

const METHODS = [
  { value: 'CASH', label: '💵 Efectivo' },
  { value: 'CARD', label: '💳 Tarjeta' },
  { value: 'TRANSFER', label: '🏦 Transferencia' },
];

export default function CloseSessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Payment inputs
  const [payments, setPayments] = useState<{ method: string; amount: string }[]>([
    { method: 'CASH', amount: '' },
  ]);

  useEffect(() => {
    fetch(`/api/admin/restaurant/sessions/${sessionId}`)
      .then(r => r.json())
      .then(data => {
        setSession(data);
        // Pre-fill with total
        const total = (data.orders || []).reduce((sum: number, o: Order) => sum + o.total, 0);
        setPayments([{ method: 'CASH', amount: total > 0 ? total.toString() : '' }]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [sessionId]);

  function addPaymentMethod() {
    setPayments([...payments, { method: 'CASH', amount: '' }]);
  }

  function updatePayment(idx: number, field: 'method' | 'amount', value: string) {
    const updated = [...payments];
    updated[idx] = { ...updated[idx], [field]: value };
    setPayments(updated);
  }

  function removePayment(idx: number) {
    setPayments(payments.filter((_, i) => i !== idx));
  }

  async function handleClose() {
    const validPayments = payments.filter(p => p.amount && Number(p.amount) > 0);
    if (validPayments.length === 0) {
      setError('Agrega al menos un método de pago');
      return;
    }

    setClosing(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/restaurant/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payments: validPayments.map(p => ({
            method: p.method,
            amount: Number(p.amount),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cerrar');
      router.push(`/admin/restaurant/sessions?status=CLOSED&closed=true`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setClosing(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-500">Cargando sesión...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <p className="text-red-600 mb-4">Sesión no encontrada</p>
        <Link href="/admin/restaurant/sessions" className="text-blue-600 hover:text-blue-800 text-sm">← Volver</Link>
      </div>
    );
  }

  if (session.status === 'CLOSED') {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="text-4xl mb-4">✅</div>
        <p className="text-xl font-semibold text-gray-900 mb-2">Sesión cerrada</p>
        <p className="text-gray-500 mb-6">{session.label} — {new Date(session.openedAt).toLocaleDateString('es-MX')}</p>
        <Link href="/admin/restaurant/sessions" className="text-blue-600 hover:text-blue-800 text-sm font-medium">← Volver a tabs</Link>
      </div>
    );
  }

  const ordersTotal = session.orders.reduce((sum, o) => sum + o.total, 0);
  const paidTotal = payments.reduce((sum, p) => sum + (p.amount ? Number(p.amount) : 0), 0);
  const balance = ordersTotal - paidTotal;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/restaurant/sessions" className="text-sm text-gray-500 hover:text-gray-700">← Volver</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Cerrar: {session.label}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders summary */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Órdenes ({session.orders.length})</h2>
            {session.orders.length === 0 ? (
              <p className="text-gray-400 text-sm">Sin órdenes en esta sesión</p>
            ) : (
              <div className="space-y-2">
                {session.orders.map(o => (
                  <div key={o.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <div className="min-w-0">
                      {o.orderItems.slice(0, 3).map((item, i) => (
                        <p key={i} className="text-sm text-gray-700 truncate">
                          {item.quantity}x {item.menuItem.name}
                          {item.variant && <span className="text-gray-400"> ({item.variant.name})</span>}
                        </p>
                      ))}
                      {o.orderItems.length > 3 && (
                        <p className="text-xs text-gray-400">+{o.orderItems.length - 3} items más</p>
                      )}
                    </div>
                    <span className="font-medium text-gray-900 shrink-0 ml-4">{formatPrice(o.total)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-lg text-gray-900">{formatPrice(ordersTotal)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Cobrar</h2>

          {payments.map((p, idx) => (
            <div key={idx} className="mb-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <select
                  value={p.method}
                  onChange={e => updatePayment(idx, 'method', e.target.value)}
                  className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
                >
                  {METHODS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                {payments.length > 1 && (
                  <button type="button" onClick={() => removePayment(idx)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  value={p.amount}
                  onChange={e => updatePayment(idx, 'amount', e.target.value)}
                  placeholder="0.00"
                  min={0}
                  step={0.01}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addPaymentMethod}
            className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium mb-4"
          >
            + Agregar método de pago
          </button>

          {/* Balance summary */}
          <div className="border-t border-gray-200 pt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Total órdenes</span>
              <span className="font-medium">{formatPrice(ordersTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Pagado</span>
              <span className="font-medium text-green-600">{formatPrice(paidTotal)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-gray-100">
              <span className="font-semibold">
                {balance > 0 ? 'Pendiente' : balance < 0 ? 'A favor' : 'Cuadrado'}
              </span>
              <span className={`font-bold ${balance > 0 ? 'text-red-600' : balance < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                {balance > 0 ? formatPrice(balance) : balance < 0 ? formatPrice(Math.abs(balance)) : '—'}
              </span>
            </div>
            {session.customer && balance !== 0 && (
              <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded mt-2">
                {balance > 0
                  ? `Queda pendiente $${balance.toFixed(2)} en la cuenta de ${session.customer.name}`
                  : `Queda crédito de $${Math.abs(balance).toFixed(2)} a favor de ${session.customer.name}`
                }
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mt-4">{error}</p>
          )}

          <button
            onClick={handleClose}
            disabled={closing}
            className="w-full mt-4 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {closing ? 'Cerrando...' : 'Cerrar sesión y cobrar'}
          </button>
        </div>
      </div>
    </div>
  );
}
