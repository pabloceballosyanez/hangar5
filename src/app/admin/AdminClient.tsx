"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isActivity, getTypeLabel } from "@/lib/types";

type Item = { id: string; name: string; slug: string; type: string; description: string | null; price: number; capacity: string | null; image: string | null; featured: boolean; active: boolean };
type Booking = { id: string; itemId: string; customerName: string; customerEmail: string; customerPhone: string | null; startDate: string; endDate: string; guests: number; totalPrice: number; status: string; notes: string | null; item: { name: string; type: string } };

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800 line-through",
  maintenance: "bg-gray-100 text-gray-500 italic",
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

  const inputClass = "w-full border border-[#e0d6cf] rounded-lg p-3 bg-white text-[#1b4235] focus:outline-none focus:border-[#b88364] text-sm";

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-medium text-[#1b4235] uppercase tracking-wider">Hangar 5 — Admin</h1>
          <div className="flex items-center gap-4 text-sm text-[#b88364]">
            <span>{data.bookings.length} reservas</span>
            <span>{data.items.length} items</span>
            <a href="/api/admin/logout" className="ml-4 text-[10px] uppercase tracking-wider border border-[#b88364]/30 px-3 py-1 rounded hover:bg-[#b88364]/5 transition-colors">
              Salir
            </a>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-[#e0d6cf]">
          <button onClick={() => setTab("dashboard")} className={`px-6 py-3 text-sm uppercase tracking-wider transition-colors ${tab === "dashboard" ? "text-[#1b4235] border-b-2 border-[#1b4235] font-medium" : "text-[#b88364] hover:text-[#1b4235]"}`}>
            📊 Dashboard
          </button>
          <button onClick={() => setTab("reservas")} className={`px-6 py-3 text-sm uppercase tracking-wider transition-colors ${tab === "reservas" ? "text-[#1b4235] border-b-2 border-[#1b4235] font-medium" : "text-[#b88364] hover:text-[#1b4235]"}`}>
            📋 Reservas
          </button>
          <button onClick={() => setTab("items")} className={`px-6 py-3 text-sm uppercase tracking-wider transition-colors ${tab === "items" ? "text-[#1b4235] border-b-2 border-[#1b4235] font-medium" : "text-[#b88364] hover:text-[#1b4235]"}`}>
            🏷️ Items
          </button>
        </div>

        {/* ===== TAB: DASHBOARD ===== */}
        {tab === "dashboard" && (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-[#1b4235] text-white rounded-lg p-5">
                <p className="text-[#b88364] text-[10px] uppercase tracking-widest mb-1">Reservas este mes</p>
                <p className="text-3xl font-serif">{monthBookings.length}</p>
              </div>
              <div className="bg-[#1b4235] text-white rounded-lg p-5">
                <p className="text-[#b88364] text-[10px] uppercase tracking-widest mb-1">Ingresos este mes</p>
                <p className="text-3xl font-serif">${formatPrice(monthRevenue)}</p>
              </div>
              <div className="bg-white border border-[#e0d6cf] rounded-lg p-5">
                <p className="text-[#b88364] text-[10px] uppercase tracking-widest mb-1">Items activos</p>
                <p className="text-3xl font-serif text-[#1b4235]">{data.items.filter(i => i.active).length}</p>
              </div>
              <div className="bg-white border border-[#e0d6cf] rounded-lg p-5">
                <p className="text-[#b88364] text-[10px] uppercase tracking-widest mb-1">Próximos check-ins</p>
                <p className="text-3xl font-serif text-[#1b4235]">{upcoming.length}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Revenue chart */}
              <div className="bg-white border border-[#e0d6cf] rounded-lg p-5">
                <h3 className="text-sm font-medium text-[#1b4235] mb-4 uppercase tracking-wider">Ingresos últimos 6 meses</h3>
                <div className="flex items-end gap-2 h-32">
                  {monthlyRevenue.map((r, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-[#1b4235] font-medium">${(r.revenue / 100).toLocaleString()}</span>
                      <div
                        className="w-full rounded-t bg-[#b88364] hover:bg-[#1b4235] transition-colors cursor-pointer"
                        style={{ height: `${Math.max(4, (r.revenue / maxRev) * 80)}px` }}
                      />
                      <span className="text-[9px] text-gray-400 uppercase">{r.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming */}
              <div className="bg-white border border-[#e0d6cf] rounded-lg p-5">
                <h3 className="text-sm font-medium text-[#1b4235] mb-4 uppercase tracking-wider">Próximas reservas</h3>
                {upcoming.length === 0 ? (
                  <p className="text-sm text-gray-400">No hay reservas próximas</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {upcoming.map(b => (
                      <div key={b.id} className="flex justify-between items-center text-xs py-1 border-b border-gray-50 last:border-0">
                        <div>
                          <span className="font-medium text-[#1b4235]">{b.item.name}</span>
                          <span className="text-gray-400 ml-2">{b.customerName}</span>
                        </div>
                        <span className="text-[#b88364]">{new Date(b.startDate).toLocaleDateString("es-MX")}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Calendar */}
            <div className="bg-white border border-[#e0d6cf] rounded-lg p-5">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-medium text-[#1b4235] uppercase tracking-wider">
                  📅 {monthsFull[calMonth]} {calYear}
                </h3>
                <div className="flex gap-2">
                  <button onClick={() => {
                    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
                    else setCalMonth(m => m - 1);
                  }} className="px-3 py-1 text-xs border border-[#e0d6cf] rounded hover:bg-gray-50">←</button>
                  <button onClick={() => {
                    const t = new Date();
                    setCalMonth(t.getMonth());
                    setCalYear(t.getFullYear());
                  }} className="px-3 py-1 text-xs border border-[#e0d6cf] rounded hover:bg-gray-50">Hoy</button>
                  <button onClick={() => {
                    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
                    else setCalMonth(m => m + 1);
                  }} className="px-3 py-1 text-xs border border-[#e0d6cf] rounded hover:bg-gray-50">→</button>
                </div>
              </div>

              {/* Calendar grid */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left text-[#b88364] uppercase tracking-wider pr-3 py-2 w-40">Item</th>
                      {Array.from({ length: daysInMonth(calYear, calMonth) }, (_, i) => (
                        <th key={i} className={`text-center py-2 w-8 ${i + 1 === now.getDate() && calMonth === now.getMonth() && calYear === now.getFullYear() ? 'bg-[#1b4235] text-white rounded' : ''}`}>
                          {i + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.filter(i => i.active).map(item => {
                      const itemBookings = activeBookings.filter(b => b.itemId === item.id);
                      return (
                        <tr key={item.id} className="border-t border-gray-100">
                          <td className="pr-3 py-1 text-[#1b4235] truncate">{item.name}</td>
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
                                isBlocked ? 'bg-gray-200' :
                                isBooked ? 'bg-[#b88364]/20' :
                                past ? '' :
                                'hover:bg-gray-50'
                              }`}>
                                <div className={`w-full h-1 rounded ${
                                  isBlocked ? 'bg-gray-400' :
                                  isBooked ? 'bg-[#b88364]' :
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
              <div className="flex gap-6 mt-4 text-[10px] text-gray-500">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#b88364]" /> Reservado</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-gray-400" /> Mantenimiento</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded border border-gray-300" /> Disponible</span>
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
                className="px-4 py-2 text-xs uppercase tracking-wider border border-[#b88364]/30 text-[#b88364] rounded-lg hover:bg-[#b88364]/5 transition-colors">
                {showBlock ? "Cerrar" : "🔧 Bloquear fechas"}
              </button>
              <button onClick={() => { setShowReserve(!showReserve); setShowBlock(false); }}
                className="px-4 py-2 text-xs uppercase tracking-wider bg-[#1b4235] text-white rounded-lg hover:bg-[#0f2a20] transition-colors">
                {showReserve ? "Cerrar" : "📝 Reserva manual"}
              </button>
            </div>

            {/* Maintenance block form */}
            {showBlock && (
              <div className="mb-8 bg-[#f7f3f0] rounded-lg p-6 border border-[#e0d6cf]">
                <h3 className="text-sm uppercase tracking-wider text-[#1b4235] font-medium mb-4">🔧 Bloquear fechas por mantenimiento</h3>
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
                <button onClick={blockDates} className="px-6 py-2 bg-[#1b4235] text-white rounded-lg text-xs uppercase tracking-wider hover:bg-[#0f2a20] transition-colors">
                  Bloquear
                </button>
              </div>
            )}

            {/* Manual reservation form */}
            {showReserve && (
              <div className="mb-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
                <h3 className="text-sm uppercase tracking-wider text-[#1b4235] font-medium mb-4">📝 Reserva manual (sin pago)</h3>
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
                <button onClick={createReservation} className="px-6 py-2 bg-[#1b4235] text-white rounded-lg text-xs uppercase tracking-wider hover:bg-[#0f2a20] transition-colors">
                  Crear reserva
                </button>
              </div>
            )}
              </div>
            )}

            {/* Reservations table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-[#b88364] uppercase tracking-wider text-xs">
                    <th className="py-3 pr-4">Item</th>
                    <th className="py-3 pr-4">Cliente</th>
                    <th className="py-3 pr-4">Tipo</th>
                    <th className="py-3 pr-4">Fechas</th>
                    <th className="py-3 pr-4">Pers.</th>
                    <th className="py-3 pr-4">Total</th>
                    <th className="py-3 pr-4">Estado</th>
                    <th className="py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bookings.map((b) => {
                    const isAct = isActivity(b.item.type);
                    const maint = b.status === "maintenance";
                    return (
                      <tr key={b.id} className={`border-b hover:bg-gray-50 ${maint ? "opacity-60" : ""}`}>
                        <td className="py-3 pr-4 font-medium">{b.item.name}</td>
                        <td className="py-3 pr-4">
                          {maint ? (
                            <span className="text-gray-400 italic">{b.customerName}</span>
                          ) : (
                            <>{b.customerName}<br /><span className="text-xs text-gray-400">{b.customerEmail}</span></>
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
                          {b.totalPrice > 0 ? `$${(b.totalPrice / 100).toLocaleString()}` : <span className="text-gray-400">—</span>}
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
                                    className="px-2 py-1 text-[10px] uppercase bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50">
                                    Pagada
                                  </button>
                                  <button onClick={() => confirmBooking(b.id)} disabled={statusLoading === b.id}
                                    className="px-2 py-1 text-[10px] uppercase bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors disabled:opacity-50">
                                    Confirmar
                                  </button>
                                </>
                              )}
                              {b.status === "paid" && (
                                <button onClick={() => confirmBooking(b.id)} disabled={statusLoading === b.id}
                                  className="px-2 py-1 text-[10px] uppercase bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors disabled:opacity-50">
                                  Confirmar
                                </button>
                              )}
                              {(b.status === "pending" || b.status === "paid" || b.status === "confirmed") && (
                                <button onClick={() => cancelBooking(b.id)} disabled={statusLoading === b.id}
                                  className="px-2 py-1 text-[10px] uppercase bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors disabled:opacity-50">
                                  Cancelar
                                </button>
                              )}
                            </div>
                          )}
                          {maint && (
                            <button onClick={() => updateStatus(b.id, "cancelled")} disabled={statusLoading === b.id}
                              className="px-2 py-1 text-[10px] uppercase bg-gray-200 text-gray-600 rounded hover:bg-gray-300 transition-colors disabled:opacity-50">
                              Quitar bloqueo
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {data.bookings.length === 0 && (
                    <tr><td colSpan={8} className="py-12 text-center text-gray-400">No hay reservas todavía</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ===== TAB: ITEMS ===== */}
        {tab === "items" && (
          <>
            {/* Items editor modal */}
            {editingItem && (
              <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => setEditingItem(null)}>
                <div className="bg-white rounded-lg w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-medium text-[#1b4235] mb-1">Editar: {editingItem.name}</h3>
                  <p className="text-xs text-[#b88364] uppercase tracking-wider mb-6">{getTypeLabel(editingItem.type)}</p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[#b88364] mb-1">Nombre</label>
                      <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[#b88364] mb-1">Descripción</label>
                      <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={4} className={inputClass} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-[#b88364] mb-1">Precio (centavos)</label>
                        <input type="number" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: parseInt(e.target.value) || 0 }))} className={inputClass} />
                        <p className="text-xs text-gray-400 mt-1">${formatPrice(editForm.price)} MXN</p>
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-[#b88364] mb-1">Capacidad</label>
                        <input type="text" value={editForm.capacity} onChange={e => setEditForm(f => ({ ...f, capacity: e.target.value }))} className={inputClass} placeholder="Ej: 2 huéspedes" />
                      </div>
                    </div>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 text-sm text-[#1b4235]">
                        <input type="checkbox" checked={editForm.active} onChange={e => setEditForm(f => ({ ...f, active: e.target.checked }))} className="w-4 h-4" />
                        Activo
                      </label>
                      <label className="flex items-center gap-2 text-sm text-[#1b4235]">
                        <input type="checkbox" checked={editForm.featured} onChange={e => setEditForm(f => ({ ...f, featured: e.target.checked }))} className="w-4 h-4" />
                        Destacado
                      </label>
                    </div>
                  </div>

                  {editMsg && <p className="mt-4 text-sm">{editMsg}</p>}

                  <div className="flex gap-3 mt-6">
                    <button onClick={saveItem} disabled={editSaving}
                      className="flex-1 py-3 bg-[#1b4235] text-white rounded-lg text-sm uppercase tracking-wider hover:bg-[#0f2a20] transition-colors disabled:opacity-50">
                      {editSaving ? "Guardando..." : "Guardar"}
                    </button>
                    <button onClick={() => setEditingItem(null)}
                      className="px-6 py-3 border border-[#e0d6cf] text-[#5c3d2e] rounded-lg text-sm hover:bg-gray-50 transition-colors">
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
                <h3 className="text-sm tracking-[0.2em] uppercase text-[#b88364] mb-4 border-b pb-2">🏠 Alojamientos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {data.items.filter(i => i.type === "cabana" || i.type === "glamping").map((item) => (
                    <ItemCard key={item.id} item={item} onEdit={openEdit} formatPrice={formatPrice} />
                  ))}
                </div>
              </div>

              {/* Actividades */}
              <div>
                <h3 className="text-sm tracking-[0.2em] uppercase text-[#b88364] mb-4 border-b pb-2">🪂 Actividades</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {data.items.filter(i => i.type === "parapente" || i.type === "aladelta" || i.type === "hike").map((item) => (
                    <ItemCard key={item.id} item={item} onEdit={openEdit} formatPrice={formatPrice} />
                  ))}
                </div>
              </div>

              {/* Renta */}
              <div>
                <h3 className="text-sm tracking-[0.2em] uppercase text-[#b88364] mb-4 border-b pb-2">🏍️ Renta</h3>
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
    <div className={`border rounded-lg p-4 hover:shadow-sm transition-shadow ${item.active ? "border-[#e0d6cf]" : "border-red-200 bg-red-50/50"}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-medium text-[#1b4235] text-sm">{item.name}</p>
          <p className="text-[10px] text-[#b88364] uppercase tracking-wider">{getTypeLabel(item.type)}</p>
        </div>
        <span className={`text-[10px] uppercase px-2 py-0.5 rounded ${item.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {item.active ? "Activo" : "Inactivo"}
        </span>
      </div>
      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{item.description || "—"}</p>
      <div className="flex justify-between items-center">
        <p className="text-sm font-bold text-[#1b4235]">${formatPrice(item.price)}</p>
        <button onClick={() => onEdit(item)}
          className="text-xs uppercase tracking-wider text-[#b88364] hover:text-[#1b4235] transition-colors">
          Editar →
        </button>
      </div>
    </div>
  );
}
