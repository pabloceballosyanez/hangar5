"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isActivity, getTypeLabel } from "@/lib/types";

type Item = { id: string; name: string; slug: string; type: string; description: string | null; price: number; capacity: string | null; image: string | null; featured: boolean; active: boolean };
type Booking = { id: string; itemId: string; customerName: string; customerEmail: string; customerPhone: string | null; startDate: string; endDate: string; guests: number; totalPrice: number; status: string; paymentMethod: string | null; notes: string | null; item: { name: string; type: string } };

const statusColors: Record<string, string> = {
  pending: "bg-[var(--color-adp-atencion)] text-[var(--color-adp-atencion)]",
  paid: "bg-[var(--color-adp-info)] text-white",
  confirmed: "bg-[var(--color-adp-listo)] text-white",
  cancelled: "bg-[var(--color-adp-urgente)] text-white line-through",
  maintenance: "bg-[var(--color-adp-papel-3)] text-[var(--color-adp-tinta-2)] italic",
};

const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const monthsFull = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  paid: "Pagada",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  maintenance: "Mantenimiento",
};

const paymentLabels: Record<string, string> = {
  card: "💳 Tarjeta",
  transfer: "🏦 Transferencia",
  cash: "💵 Efectivo",
}

export default function AdminClient({ bookings, items, cabanas, activities, rentals }: {
  bookings: Booking[];
  items: Item[];
  cabanas: Item[];
  activities: Item[];
  rentals: Item[];
}) {
  const [data, setData] = useState({ bookings, items });
  const [statusLoading, setStatusLoading] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", price: 0, capacity: "", active: true, featured: false });
  const [showNewItem, setShowNewItem] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", slug: "", type: "cabana", description: "", price: 0, capacity: "", image: "", featured: false, active: true });
  const [newItemMsg, setNewItemMsg] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editMsg, setEditMsg] = useState("");
  const [blockForm, setBlockForm] = useState({ itemId: "", startDate: "", endDate: "", reason: "" });
  const [reserveForm, setReserveForm] = useState({ itemId: "", startDate: "", endDate: "", reason: "", customerName: "", customerEmail: "", customerPhone: "", guests: 1 });
  const [showBlock, setShowBlock] = useState(false);
  const [showReserve, setShowReserve] = useState(false);
  const [blockMsg, setBlockMsg] = useState("");
  const [reserveMsg, setReserveMsg] = useState("");
  const [tab, setTab] = useState<"dashboard" | "reservas" | "items">("dashboard");
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());

  // Dashboard computed stats
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const activeBookings = data.bookings.filter(b => b.status !== "cancelled" && b.status !== "maintenance");
  const monthBookings = activeBookings.filter(b => {
    const d = new Date(b.startDate);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });
  const monthRevenue = monthBookings.reduce((s, b) => s + b.totalPrice, 0);
  const upcoming = activeBookings.filter(b => new Date(b.startDate) >= now).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).slice(0, 10);

  // Monthly revenue data for chart (last 6 months)
  const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
    const m = (thisMonth - 5 + i + 12) % 12;
    const y = thisYear + (thisMonth - 5 + i < 0 ? -1 : 0) + (thisMonth - 5 + i >= 12 ? 1 : 0);
    const rev = activeBookings
      .filter(b => { const d = new Date(b.startDate); return d.getMonth() === m && d.getFullYear() === y; })
      .reduce((s, b) => s + b.totalPrice, 0);
    return { month: m, year: y, revenue: rev, label: months[m] };
  });
  const maxRev = Math.max(...monthlyRevenue.map(r => r.revenue), 1);

  const formatPrice = (cents: number) => (cents / 100).toLocaleString("es-MX");
  const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

  const updateStatus = async (bookingId: string, status: string) => {
    setStatusLoading(bookingId);
    const res = await fetch(`/api/admin/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setData(d => ({
        ...d,
        bookings: d.bookings.map(b => b.id === bookingId ? updateBooking(b, updated) : b),
      }));
    }
    setStatusLoading(null);
  };

  const updateBooking = (old: Booking, updated: Booking): Booking => ({
    ...old,
    status: updated.status,
  });

  const confirmBooking = (id: string) => updateStatus(id, "confirmed");
  const cancelBooking = (id: string) => updateStatus(id, "cancelled");
  const markPaid = (id: string) => updateStatus(id, "paid");

  // Item editing
  const openEdit = (item: Item) => {
    setEditingItem(item);
    setEditForm({
      name: item.name,
      description: item.description || "",
      price: item.price,
      capacity: item.capacity || "",
      active: item.active,
      featured: item.featured,
    });
    setEditMsg("");
  };

  const saveItem = async () => {
    if (!editingItem) return;
    setEditSaving(true);
    setEditMsg("");
    const res = await fetch(`/api/admin/items/${editingItem.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      const updated = await res.json();
      setData(d => ({
        ...d,
        items: d.items.map(i => i.id === editingItem.id ? { ...i, ...updated } : i),
      }));
      setEditMsg("✅ Guardado");
      setTimeout(() => setEditingItem(null), 1000);
    } else {
      const err = await res.json();
      setEditMsg("❌ " + (err.error || "Error"));
    }
    setEditSaving(false);
  };

  // Block dates for maintenance
  const blockDates = async () => {
    if (!blockForm.itemId || !blockForm.startDate || !blockForm.endDate) return;
    setBlockMsg("");
    const res = await fetch("/api/admin/bookings/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...blockForm, type: "maintenance" }),
    });
    if (res.ok) {
      const created = await res.json();
      setData(d => ({ ...d, bookings: [created, ...d.bookings] }));
      setBlockMsg("✅ Fechas bloqueadas");
      setBlockForm({ itemId: "", startDate: "", endDate: "", reason: "" });
      setTimeout(() => setShowBlock(false), 1500);
    } else {
      const err = await res.json();
      setBlockMsg("❌ " + (err.error || "Error"));
    }
  };

  // Admin reservation (no payment)
  const createReservation = async () => {
    if (!reserveForm.itemId || !reserveForm.startDate || !reserveForm.endDate) return;
    setReserveMsg("");
    const res = await fetch("/api/admin/bookings/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...reserveForm, type: "reservation" }),
    });
    if (res.ok) {
      const created = await res.json();
      setData(d => ({ ...d, bookings: [created, ...d.bookings] }));
      setReserveMsg("✅ Reserva creada");
      setReserveForm({ itemId: "", startDate: "", endDate: "", reason: "", customerName: "", customerEmail: "", customerPhone: "", guests: 1 });
      setTimeout(() => setShowReserve(false), 1500);
    } else {
      const err = await res.json();
      setReserveMsg("❌ " + (err.error || "Error"));
    }
  };

  const inputClass = "w-full border border-[var(--color-adp-borde)] rounded-lg p-3 bg-white text-[var(--color-adp-pino)] focus:outline-none focus:border-[var(--color-adp-pino)] text-sm";

  return (
    <main className="min-h-screen bg-[var(--color-adp-papel)]">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-medium text-[var(--color-adp-pino)] uppercase tracking-wider">Hangar 5 — Admin</h1>
          <div className="flex items-center gap-4 text-sm text-[var(--color-adp-pino)]">
            <span>{data.bookings.length} reservas</span>
            <span>{data.items.length} items</span>
            <a href="/admin/restaurant" className="text-[10px] uppercase tracking-wider border border-[var(--color-adp-atencion)]/40 bg-[var(--color-adp-atencion)] text-white transition-colors font-medium">
              🍽️ Restaurante
            </a>
            <a href="/admin/aventura/calendarios" className="text-[10px] uppercase tracking-wider border border-[var(--color-adp-info)]/40 bg-[var(--color-adp-info)] text-white transition-colors font-medium">
              📡 iCal Sync
            </a>
            <a href="/recetario" className="text-[10px] uppercase tracking-wider border border-[var(--color-adp-pino)]/40 bg-[var(--color-adp-pino)] text-white transition-colors font-medium">
              📋 Recetario
            </a>
            <a href="/admin/ayuda" className="text-[10px] uppercase tracking-wider border border-[var(--color-adp-pino)]/30 bg-[var(--color-adp-pino)] text-white/5 transition-colors">
              📖 Ayuda
            </a>
            <a href="/api/admin/logout" className="ml-2 text-[10px] uppercase tracking-wider border border-[var(--color-adp-pino)]/30 px-3 py-1 rounded hover:bg-[var(--color-adp-pino)]/85/5 transition-colors">
              Salir
            </a>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-[var(--color-adp-borde)]">
          <button onClick={() => setTab("dashboard")} className={`px-6 py-3 text-sm uppercase tracking-wider transition-colors ${tab === "dashboard" ? "text-[var(--color-adp-pino)] border-b-2 border-[var(--color-adp-pino)] font-medium" : "text-[var(--color-adp-pino)] hover:text-[var(--color-adp-pino)]"}`}>
            📊 Dashboard
          </button>
          <button onClick={() => setTab("reservas")} className={`px-6 py-3 text-sm uppercase tracking-wider transition-colors ${tab === "reservas" ? "text-[var(--color-adp-pino)] border-b-2 border-[var(--color-adp-pino)] font-medium" : "text-[var(--color-adp-pino)] hover:text-[var(--color-adp-pino)]"}`}>
            📋 Reservas
          </button>
          <button onClick={() => setTab("items")} className={`px-6 py-3 text-sm uppercase tracking-wider transition-colors ${tab === "items" ? "text-[var(--color-adp-pino)] border-b-2 border-[var(--color-adp-pino)] font-medium" : "text-[var(--color-adp-pino)] hover:text-[var(--color-adp-pino)]"}`}>
            🏷️ Items
          </button>
          <div className="ml-auto" />
        </div>

        {/* ===== TAB: DASHBOARD ===== */}
        {tab === "dashboard" && (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-[var(--color-adp-pino)] text-white rounded-lg p-5">
                <p className="text-[var(--color-adp-pino)] text-[10px] uppercase tracking-widest mb-1">Reservas este mes</p>
                <p className="text-3xl font-serif">{monthBookings.length}</p>
              </div>
              <div className="bg-[var(--color-adp-pino)] text-white rounded-lg p-5">
                <p className="text-[var(--color-adp-pino)] text-[10px] uppercase tracking-widest mb-1">Ingresos este mes</p>
                <p className="text-3xl font-serif">${formatPrice(monthRevenue)}</p>
              </div>
              <div className="bg-white border border-[var(--color-adp-borde)] rounded-lg p-5">
                <p className="text-[var(--color-adp-pino)] text-[10px] uppercase tracking-widest mb-1">Items activos</p>
                <p className="text-3xl font-serif text-[var(--color-adp-pino)]">{data.items.filter(i => i.active).length}</p>
              </div>
              <div className="bg-white border border-[var(--color-adp-borde)] rounded-lg p-5">
                <p className="text-[var(--color-adp-pino)] text-[10px] uppercase tracking-widest mb-1">Próximos check-ins</p>
                <p className="text-3xl font-serif text-[var(--color-adp-pino)]">{upcoming.length}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Revenue chart */}
              <div className="bg-white border border-[var(--color-adp-borde)] rounded-lg p-5">
                <h3 className="text-sm font-medium text-[var(--color-adp-pino)] mb-4 uppercase tracking-wider">Ingresos últimos 6 meses</h3>
                <div className="flex items-end gap-2 h-32">
                  {monthlyRevenue.map((r, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-[var(--color-adp-pino)] font-medium">${(r.revenue / 100).toLocaleString()}</span>
                      <div
                        className="w-full rounded-t bg-[var(--color-adp-pino)] hover:bg-[var(--color-adp-pino)]/85 transition-colors cursor-pointer"
                        style={{ height: `${Math.max(4, (r.revenue / maxRev) * 80)}px` }}
                      />
                      <span className="text-[9px] text-[var(--color-adp-tinta-2)] uppercase">{r.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming */}
              <div className="bg-white border border-[var(--color-adp-borde)] rounded-lg p-5">
                <h3 className="text-sm font-medium text-[var(--color-adp-pino)] mb-4 uppercase tracking-wider">Próximas reservas</h3>
                {upcoming.length === 0 ? (
                  <p className="text-sm text-[var(--color-adp-tinta-2)]">No hay reservas próximas</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {upcoming.map(b => (
                      <div key={b.id} className="flex justify-between items-center text-xs py-1 border-b border-[var(--color-adp-borde)] last:border-0">
                        <div>
                          <span className="font-medium text-[var(--color-adp-pino)]">{b.item.name}</span>
                          <span className="text-[var(--color-adp-tinta-2)] ml-2">{b.customerName}</span>
                        </div>
                        <span className="text-[var(--color-adp-pino)]">{new Date(b.startDate).toLocaleDateString("es-MX")}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Calendar */}
            <div className="bg-white border border-[var(--color-adp-borde)] rounded-lg p-5">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-medium text-[var(--color-adp-pino)] uppercase tracking-wider">
                  📅 {monthsFull[calMonth]} {calYear}
                </h3>
                <div className="flex gap-2">
                  <button onClick={() => {
                    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
                    else setCalMonth(m => m - 1);
                  }} className="px-3 py-1 text-xs border border-[var(--color-adp-borde)] rounded hover:bg-[var(--color-adp-papel-3)]">←</button>
                  <button onClick={() => {
                    const t = new Date();
                    setCalMonth(t.getMonth());
                    setCalYear(t.getFullYear());
                  }} className="px-3 py-1 text-xs border border-[var(--color-adp-borde)] rounded hover:bg-[var(--color-adp-papel-3)]">Hoy</button>
                  <button onClick={() => {
                    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
                    else setCalMonth(m => m + 1);
                  }} className="px-3 py-1 text-xs border border-[var(--color-adp-borde)] rounded hover:bg-[var(--color-adp-papel-3)]">→</button>
                </div>
              </div>

              {/* Calendar grid */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left text-[var(--color-adp-pino)] uppercase tracking-wider pr-3 py-2 w-40">Item</th>
                      {Array.from({ length: daysInMonth(calYear, calMonth) }, (_, i) => (
                        <th key={i} className={`text-center py-2 w-8 ${i + 1 === now.getDate() && calMonth === now.getMonth() && calYear === now.getFullYear() ? 'bg-[var(--color-adp-pino)] text-white rounded' : ''}`}>
                          {i + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.filter(i => i.active).map(item => {
                      const itemBookings = activeBookings.filter(b => b.itemId === item.id);
                      return (
                        <tr key={item.id} className="border-t border-[var(--color-adp-borde)]">
                          <td className="pr-3 py-1 text-[var(--color-adp-pino)] truncate">{item.name}</td>
                          {Array.from({ length: daysInMonth(calYear, calMonth) }, (_, i) => {
                            const date = new Date(calYear, calMonth, i + 1);
                            const dayBookings = itemBookings.filter(b => {
                              const s = new Date(b.startDate);
                              const e = new Date(b.endDate);
                              return date >= s && date <= e;
                            });
                            const isBlocked = dayBookings.some(b => b.status === "maintenance");
                            const isBooked = dayBookings.some(b => b.status !== "maintenance");
                            const past = date < new Date(now.getFullYear(), now.getMonth(), now.getDate());
                            return (
                              <td key={i} className={`text-center p-0.5 ${
                                isBlocked ? 'bg-[var(--color-adp-borde)]' :
                                isBooked ? 'bg-[var(--color-adp-pino)]/20' :
                                past ? '' :
                                'hover:bg-[var(--color-adp-papel-3)]'
                              }`}>
                                <div className={`w-full h-1 rounded ${
                                  isBlocked ? 'bg-[var(--color-adp-borde-2)]' :
                                  isBooked ? 'bg-[var(--color-adp-pino)]' :
                                  ''
                                }`} />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              <div className="flex gap-6 mt-4 text-[10px] text-[var(--color-adp-tinta-2)]">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[var(--color-adp-pino)]" /> Reservado</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[var(--color-adp-borde-2)]" /> Mantenimiento</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded border border-[var(--color-adp-borde-2)]" /> Disponible</span>
              </div>
            </div>
          </>
        )}

        {/* ===== TAB: RESERVAS ===== */}
        {tab === "reservas" && (
          <>
            {/* Action buttons */}
            <div className="mb-6 flex justify-end gap-3">
              <button onClick={() => { setShowBlock(!showBlock); setShowReserve(false); }}
                className="px-4 py-2 text-xs uppercase tracking-wider border border-[var(--color-adp-pino)]/30 bg-[var(--color-adp-pino)] text-white/5 transition-colors">
                {showBlock ? "Cerrar" : "🔧 Bloquear fechas"}
              </button>
              <button onClick={() => { setShowReserve(!showReserve); setShowBlock(false); }}
                className="px-4 py-2 text-xs uppercase tracking-wider bg-[var(--color-adp-pino)] text-white rounded-lg hover:bg-[var(--color-adp-pino-hondo)] transition-colors">
                {showReserve ? "Cerrar" : "📝 Reserva manual"}
              </button>
            </div>

            {/* Maintenance block form */}
            {showBlock && (
              <div className="mb-8 bg-[var(--color-adp-papel-3)] rounded-lg p-6 border border-[var(--color-adp-borde)]">
                <h3 className="text-sm uppercase tracking-wider text-[var(--color-adp-pino)] font-medium mb-4">🔧 Bloquear fechas por mantenimiento</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <select value={blockForm.itemId} onChange={e => setBlockForm(f => ({ ...f, itemId: e.target.value }))} className={inputClass}>
                    <option value="">Seleccionar item...</option>
                    {data.items.map(i => (
                      <option key={i.id} value={i.id}>{i.name} ({getTypeLabel(i.type)})</option>
                    ))}
                  </select>
                  <input type="date" value={blockForm.startDate} onChange={e => setBlockForm(f => ({ ...f, startDate: e.target.value }))} className={inputClass} />
                  <input type="date" value={blockForm.endDate} onChange={e => setBlockForm(f => ({ ...f, endDate: e.target.value }))} className={inputClass} />
                  <input type="text" value={blockForm.reason} onChange={e => setBlockForm(f => ({ ...f, reason: e.target.value }))} className={inputClass} placeholder="Motivo (opcional)" />
                </div>
                {blockMsg && <p className="text-sm mb-3">{blockMsg}</p>}
                <button onClick={blockDates} className="px-6 py-2 bg-[var(--color-adp-pino)] text-white rounded-lg text-xs uppercase tracking-wider hover:bg-[var(--color-adp-pino-hondo)] transition-colors">
                  Bloquear
                </button>
              </div>
            )}

            {/* Manual reservation form */}
            {showReserve && (
              <div className="mb-8 bg-[var(--color-adp-info)] rounded-lg p-6 border border-[var(--color-adp-info)] text-white">
                <h3 className="text-sm uppercase tracking-wider text-[var(--color-adp-pino)] font-medium mb-4">📝 Reserva manual (sin pago)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <select value={reserveForm.itemId} onChange={e => setReserveForm(f => ({ ...f, itemId: e.target.value }))} className={inputClass}>
                    <option value="">Seleccionar item...</option>
                    {data.items.map(i => (
                      <option key={i.id} value={i.id}>{i.name} ({getTypeLabel(i.type)})</option>
                    ))}
                  </select>
                  <input type="date" value={reserveForm.startDate} onChange={e => setReserveForm(f => ({ ...f, startDate: e.target.value }))} className={inputClass} />
                  <input type="date" value={reserveForm.endDate} onChange={e => setReserveForm(f => ({ ...f, endDate: e.target.value }))} className={inputClass} />
                  <input type="text" value={reserveForm.customerName} onChange={e => setReserveForm(f => ({ ...f, customerName: e.target.value }))} className={inputClass} placeholder="Nombre del huésped" />
                  <input type="email" value={reserveForm.customerEmail} onChange={e => setReserveForm(f => ({ ...f, customerEmail: e.target.value }))} className={inputClass} placeholder="Email (opcional)" />
                  <input type="tel" value={reserveForm.customerPhone} onChange={e => setReserveForm(f => ({ ...f, customerPhone: e.target.value }))} className={inputClass} placeholder="Teléfono (opcional)" />
                  <input type="number" value={reserveForm.guests} onChange={e => setReserveForm(f => ({ ...f, guests: Math.max(1, parseInt(e.target.value) || 1) }))} min="1" className={inputClass} placeholder="Personas" />
                  <input type="text" value={reserveForm.reason} onChange={e => setReserveForm(f => ({ ...f, reason: e.target.value }))} className={inputClass} placeholder="Notas (opcional)" />
                </div>
                {reserveMsg && <p className="text-sm mb-3">{reserveMsg}</p>}
                <button onClick={createReservation} className="px-6 py-2 bg-[var(--color-adp-pino)] text-white rounded-lg text-xs uppercase tracking-wider hover:bg-[var(--color-adp-pino-hondo)] transition-colors">
                  Crear reserva
                </button>
              </div>
            )}

            {/* Reservations table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-[var(--color-adp-pino)] uppercase tracking-wider text-xs">
                    <th className="py-3 pr-4">Item</th>
                    <th className="py-3 pr-4">Cliente</th>
                    <th className="py-3 pr-4">Tipo</th>
                    <th className="py-3 pr-4">Fechas</th>
                    <th className="py-3 pr-4">Pers.</th>
                    <th className="py-3 pr-4">Total</th>
                    <th className="py-3 pr-4">Pago</th>
                    <th className="py-3 pr-4">Estado</th>
                    <th className="py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bookings.map((b) => {
                    const isAct = isActivity(b.item.type);
                    const maint = b.status === "maintenance";
                    return (
                      <tr key={b.id} className={`border-b hover:bg-[var(--color-adp-papel-3)] ${maint ? "opacity-60" : ""}`}>
                        <td className="py-3 pr-4 font-medium">{b.item.name}</td>
                        <td className="py-3 pr-4">
                          {maint ? (
                            <span className="text-[var(--color-adp-tinta-2)] italic">{b.customerName}</span>
                          ) : (
                            <>{b.customerName}<br /><span className="text-xs text-[var(--color-adp-tinta-2)]">{b.customerEmail}</span></>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-xs">{maint ? "Manto" : isAct ? "Actividad" : "Reserva"}</td>
                        <td className="py-3 pr-4 text-xs">
                          {maint || isAct
                            ? new Date(b.startDate).toLocaleDateString("es-MX")
                            : `${new Date(b.startDate).toLocaleDateString("es-MX")} → ${new Date(b.endDate).toLocaleDateString("es-MX")}`
                          }
                        </td>
                        <td className="py-3 pr-4">{b.guests}</td>
                        <td className="py-3 pr-4 font-medium">
                          {b.totalPrice > 0 ? `$${(b.totalPrice / 100).toLocaleString()}` : <span className="text-[var(--color-adp-tinta-2)]">—</span>}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-xs whitespace-nowrap">{paymentLabels[b.paymentMethod || ""] || "—"}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`px-2 py-1 text-xs uppercase rounded ${statusColors[b.status] || ""}`}>
                            {statusLabels[b.status] || b.status}
                          </span>
                        </td>
                        <td className="py-3">
                          {!maint && (
                            <div className="flex gap-1">
                              {b.status === "pending" && (
                                <>
                                  <button onClick={() => markPaid(b.id)} disabled={statusLoading === b.id}
                                    className="px-2 py-1 text-[10px] uppercase bg-[var(--color-adp-info)] text-white rounded hover:bg-[var(--color-adp-info)]/85 transition-colors disabled:opacity-50">
                                    Pagada
                                  </button>
                                  <button onClick={() => confirmBooking(b.id)} disabled={statusLoading === b.id}
                                    className="px-2 py-1 text-[10px] uppercase bg-[var(--color-adp-listo)] text-white rounded hover:bg-[var(--color-adp-listo)]/85 transition-colors disabled:opacity-50">
                                    Confirmar
                                  </button>
                                </>
                              )}
                              {b.status === "paid" && (
                                <button onClick={() => confirmBooking(b.id)} disabled={statusLoading === b.id}
                                  className="px-2 py-1 text-[10px] uppercase bg-[var(--color-adp-listo)] text-white rounded hover:bg-[var(--color-adp-listo)]/85 transition-colors disabled:opacity-50">
                                  Confirmar
                                </button>
                              )}
                              {(b.status === "pending" || b.status === "paid" || b.status === "confirmed") && (
                                <button onClick={() => cancelBooking(b.id)} disabled={statusLoading === b.id}
                                  className="px-2 py-1 text-[10px] uppercase bg-[var(--color-adp-urgente)] text-white rounded hover:bg-[var(--color-adp-urgente)]/85 transition-colors disabled:opacity-50">
                                  Cancelar
                                </button>
                              )}
                            </div>
                          )}
                          {maint && (
                            <button onClick={() => updateStatus(b.id, "cancelled")} disabled={statusLoading === b.id}
                              className="px-2 py-1 text-[10px] uppercase bg-[var(--color-adp-borde)] text-[var(--color-adp-tinta-2)] rounded hover:bg-[var(--color-adp-borde)] transition-colors disabled:opacity-50">
                              Quitar bloqueo
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {data.bookings.length === 0 && (
                    <tr><td colSpan={8} className="py-12 text-center text-[var(--color-adp-tinta-2)]">No hay reservas todavía</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ===== TAB: ITEMS ===== */}
        {tab === "items" && (
          <>
            {/* New Item button */}
            <div className="mb-6 flex justify-end">
              <button onClick={() => setShowNewItem(true)}
                className="px-4 py-2 text-xs uppercase tracking-wider bg-[var(--color-adp-pino)] text-white rounded-lg hover:bg-[var(--color-adp-pino-hondo)] transition-colors">
                + Nuevo ítem
              </button>
            </div>

            {/* Create Item modal */}
            {showNewItem && (
              <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => { setShowNewItem(false); setNewItemMsg(""); }}>
                <div className="bg-white rounded-lg w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-medium text-[var(--color-adp-pino)] mb-1">Nuevo ítem</h3>
                  <p className="text-xs text-[var(--color-adp-pino)] uppercase tracking-wider mb-6">Crear un nuevo elemento</p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[var(--color-adp-pino)] mb-1">Nombre *</label>
                      <input type="text" value={newItem.name} onChange={e => {
                        const name = e.target.value;
                        const slug = name.toLowerCase().replace(/[^a-z0-9áéíóúñ]+/g, '-').replace(/^-|-$/g, '');
                        setNewItem(f => ({ ...f, name, slug }));
                      }} className={inputClass} placeholder="Ej: Moto Enduro 300cc #3" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-[var(--color-adp-pino)] mb-1">Slug *</label>
                        <input type="text" value={newItem.slug} onChange={e => setNewItem(f => ({ ...f, slug: e.target.value }))} className={inputClass} placeholder="moto-3" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-[var(--color-adp-pino)] mb-1">Tipo *</label>
                        <select value={newItem.type} onChange={e => setNewItem(f => ({ ...f, type: e.target.value }))} className={inputClass}>
                          <option value="cabana">Cabaña</option>
                          <option value="glamping">Glamping</option>
                          <option value="moto">Moto</option>
                          <option value="bici">Bicicleta</option>
                          <option value="parapente">Parapente</option>
                          <option value="aladelta">Ala Delta</option>
                          <option value="hike">Hike</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[var(--color-adp-pino)] mb-1">Descripción</label>
                      <textarea value={newItem.description} onChange={e => setNewItem(f => ({ ...f, description: e.target.value }))} rows={3} className={inputClass} placeholder="Descripción del ítem" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-[var(--color-adp-pino)] mb-1">Precio (centavos) *</label>
                        <input type="number" value={newItem.price} onChange={e => setNewItem(f => ({ ...f, price: parseInt(e.target.value) || 0 }))} className={inputClass} />
                        <p className="text-xs text-[var(--color-adp-tinta-2)] mt-1">${formatPrice(newItem.price)} MXN</p>
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-[var(--color-adp-pino)] mb-1">Capacidad</label>
                        <input type="text" value={newItem.capacity} onChange={e => setNewItem(f => ({ ...f, capacity: e.target.value }))} className={inputClass} placeholder="Ej: 1 persona" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[var(--color-adp-pino)] mb-1">Imagen (opcional)</label>
                      <input type="text" value={newItem.image} onChange={e => setNewItem(f => ({ ...f, image: e.target.value }))} className={inputClass} placeholder={`/img/items/${newItem.slug}/01.jpg`} />
                    </div>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 text-sm text-[var(--color-adp-pino)]">
                        <input type="checkbox" checked={newItem.active} onChange={e => setNewItem(f => ({ ...f, active: e.target.checked }))} className="w-4 h-4" />
                        Activo
                      </label>
                      <label className="flex items-center gap-2 text-sm text-[var(--color-adp-pino)]">
                        <input type="checkbox" checked={newItem.featured} onChange={e => setNewItem(f => ({ ...f, featured: e.target.checked }))} className="w-4 h-4" />
                        Destacado
                      </label>
                    </div>
                  </div>

                  {newItemMsg && <p className="mt-4 text-sm">{newItemMsg}</p>}

                  <div className="flex gap-3 mt-6">
                    <button onClick={async () => {
                      if (!newItem.name || !newItem.slug || !newItem.type || !newItem.price) {
                        setNewItemMsg("❌ Completa los campos obligatorios"); return;
                      }
                      setNewItemMsg("");
                      const res = await fetch('/api/admin/items', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...newItem, image: newItem.image || '/img/items/' + newItem.slug + '/01.jpg' }),
                      });
                      if (res.ok) {
                        const created = await res.json();
                        setData(d => ({ ...d, items: [...d.items, created] }));
                        setNewItemMsg("✅ Creado");
                        setTimeout(() => { setShowNewItem(false); setNewItem({ name: '', slug: '', type: 'cabana', description: '', price: 0, capacity: '', image: '', featured: false, active: true }); setNewItemMsg(''); }, 1000);
                      } else {
                        const err = await res.json();
                        setNewItemMsg("❌ " + (err.error || "Error"));
                      }
                    }}
                      className="flex-1 py-3 bg-[var(--color-adp-pino)] text-white rounded-lg text-sm uppercase tracking-wider hover:bg-[var(--color-adp-pino-hondo)] transition-colors">
                      Crear
                    </button>
                    <button onClick={() => { setShowNewItem(false); setNewItemMsg(""); }}
                      className="px-6 py-3 border border-[var(--color-adp-borde)] text-[var(--color-adp-tinta-2)] rounded-lg text-sm hover:bg-[var(--color-adp-papel-3)] transition-colors">
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Items editor modal */}
            {editingItem && (
              <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => setEditingItem(null)}>
                <div className="bg-white rounded-lg w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-medium text-[var(--color-adp-pino)] mb-1">Editar: {editingItem.name}</h3>
                  <p className="text-xs text-[var(--color-adp-pino)] uppercase tracking-wider mb-6">{getTypeLabel(editingItem.type)}</p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[var(--color-adp-pino)] mb-1">Nombre</label>
                      <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[var(--color-adp-pino)] mb-1">Descripción</label>
                      <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={4} className={inputClass} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-[var(--color-adp-pino)] mb-1">Precio (centavos)</label>
                        <input type="number" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: parseInt(e.target.value) || 0 }))} className={inputClass} />
                        <p className="text-xs text-[var(--color-adp-tinta-2)] mt-1">${formatPrice(editForm.price)} MXN</p>
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-[var(--color-adp-pino)] mb-1">Capacidad</label>
                        <input type="text" value={editForm.capacity} onChange={e => setEditForm(f => ({ ...f, capacity: e.target.value }))} className={inputClass} placeholder="Ej: 2 huéspedes" />
                      </div>
                    </div>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 text-sm text-[var(--color-adp-pino)]">
                        <input type="checkbox" checked={editForm.active} onChange={e => setEditForm(f => ({ ...f, active: e.target.checked }))} className="w-4 h-4" />
                        Activo
                      </label>
                      <label className="flex items-center gap-2 text-sm text-[var(--color-adp-pino)]">
                        <input type="checkbox" checked={editForm.featured} onChange={e => setEditForm(f => ({ ...f, featured: e.target.checked }))} className="w-4 h-4" />
                        Destacado
                      </label>
                    </div>
                  </div>

                  {editMsg && <p className="mt-4 text-sm">{editMsg}</p>}

                  <div className="flex gap-3 mt-6">
                    <button onClick={saveItem} disabled={editSaving}
                      className="flex-1 py-3 bg-[var(--color-adp-pino)] text-white rounded-lg text-sm uppercase tracking-wider hover:bg-[var(--color-adp-pino-hondo)] transition-colors disabled:opacity-50">
                      {editSaving ? "Guardando..." : "Guardar"}
                    </button>
                    <button onClick={() => setEditingItem(null)}
                      className="px-6 py-3 border border-[var(--color-adp-borde)] text-[var(--color-adp-tinta-2)] rounded-lg text-sm hover:bg-[var(--color-adp-papel-3)] transition-colors">
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Items by category */}
            <section className="space-y-10">
              {/* Alojamientos */}
              <div>
                <h3 className="text-sm tracking-[0.2em] uppercase text-[var(--color-adp-pino)] mb-4 border-b pb-2">🏠 Alojamientos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {data.items.filter(i => i.type === "cabana" || i.type === "glamping").map((item) => (
                    <ItemCard key={item.id} item={item} onEdit={openEdit} formatPrice={formatPrice} />
                  ))}
                </div>
              </div>

              {/* Actividades */}
              <div>
                <h3 className="text-sm tracking-[0.2em] uppercase text-[var(--color-adp-pino)] mb-4 border-b pb-2">🪂 Actividades</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {data.items.filter(i => i.type === "parapente" || i.type === "aladelta" || i.type === "hike").map((item) => (
                    <ItemCard key={item.id} item={item} onEdit={openEdit} formatPrice={formatPrice} />
                  ))}
                </div>
              </div>

              {/* Renta */}
              <div>
                <h3 className="text-sm tracking-[0.2em] uppercase text-[var(--color-adp-pino)] mb-4 border-b pb-2">🏍️ Renta</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {data.items.filter(i => i.type === "moto" || i.type === "bici").map((item) => (
                    <ItemCard key={item.id} item={item} onEdit={openEdit} formatPrice={formatPrice} />
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function ItemCard({ item, onEdit, formatPrice }: { item: Item; onEdit: (i: Item) => void; formatPrice: (c: number) => string }) {
  return (
    <div className={`border rounded-lg p-4 hover:shadow-sm transition-shadow ${item.active ? "border-[var(--color-adp-borde)]" : "border-[var(--color-adp-urgente)] bg-[var(--color-adp-urgente)]/50"}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-medium text-[var(--color-adp-pino)] text-sm">{item.name}</p>
          <p className="text-[10px] text-[var(--color-adp-pino)] uppercase tracking-wider">{getTypeLabel(item.type)}</p>
        </div>
        <span className={`text-[10px] uppercase px-2 py-0.5 rounded ${item.active ? "bg-[var(--color-adp-listo)] text-white" : "bg-[var(--color-adp-urgente)] text-white"}`}>
          {item.active ? "Activo" : "Inactivo"}
        </span>
      </div>
      <p className="text-xs text-[var(--color-adp-tinta-2)] line-clamp-2 mb-3">{item.description || "—"}</p>
      <div className="flex justify-between items-center">
        <p className="text-sm font-bold text-[var(--color-adp-pino)]">${formatPrice(item.price)}</p>
        <button onClick={() => onEdit(item)}
          className="text-xs uppercase tracking-wider text-[var(--color-adp-pino)] hover:text-[var(--color-adp-pino)] transition-colors">
          Editar →
        </button>
      </div>
    </div>
  );
}
