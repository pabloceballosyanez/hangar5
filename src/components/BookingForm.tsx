"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isRental, isActivity } from "@/lib/types";

interface BookingFormProps {
  item: { id: string; slug: string; name: string; price: number; type: string };
}

function formatPrice(cents: number) { return (cents / 100).toLocaleString("es-MX"); }

export function BookingForm({ item }: BookingFormProps) {
  const router = useRouter();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [guests, setGuests] = useState(1);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState<{ available: boolean; checked: boolean }>({ available: false, checked: false });
  const [error, setError] = useState("");
  const [bookingComplete, setBookingComplete] = useState(false);

  const isRent = isRental(item.type);
  const isAct = isActivity(item.type);

  const checkAvailability = async () => {
    if (!startDate || (!isAct && !endDate)) return;
    const effectiveEnd = isAct ? startDate : endDate;
    setLoading(true);
    setError("");
    const res = await fetch(`/api/availability?itemId=${item.id}&start=${startDate}&end=${effectiveEnd}`);
    const data = await res.json();
    setAvailability({ available: data.available, checked: true });
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!availability.available) return;
    setLoading(true);
    setError("");

    const effectiveEnd = isAct ? startDate : endDate;

    const bookingRes = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id, customerName: name, customerEmail: email, customerPhone: phone, startDate, endDate: effectiveEnd, guests, notes }),
    });

    if (!bookingRes.ok) {
      const err = await bookingRes.json();
      setError(err.error || "Error al crear la reserva");
      setLoading(false);
      return;
    }

    const booking = await bookingRes.json();
    const checkoutRes = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: booking.id }),
    });
    const checkoutData = await checkoutRes.json();

    if (checkoutData.url) {
      window.location.href = checkoutData.url;
    } else if (checkoutData.redirectUrl) {
      router.push(checkoutData.redirectUrl);
    } else {
      setBookingComplete(true);
      router.push(`/reservar/${booking.id}`);
    }
  };

  const days = isAct ? 1 : (startDate && endDate
    ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 0);
  const total = isAct ? item.price * guests : days * item.price;

  const inputClass = "w-full border border-[#e0d6cf] rounded-lg p-4 bg-white text-[#1b4235] placeholder:text-[#b88364]/50 focus:outline-none focus:border-[#b88364] focus:ring-1 focus:ring-[#b88364]/20 transition-all text-sm";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Date(s) */}
      {isAct ? (
        <div>
          <label className="block text-xs tracking-[0.2em] uppercase text-[#b88364] mb-2 font-medium">Fecha de la actividad</label>
          <input type="date" value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setAvailability({ available: false, checked: false }); }}
            min={new Date().toISOString().split("T")[0]} className={inputClass} required />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs tracking-[0.2em] uppercase text-[#b88364] mb-2 font-medium">
              {isRent ? "Inicio" : "Entrada"}
            </label>
            <input type="date" value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setAvailability({ available: false, checked: false }); }}
              min={new Date().toISOString().split("T")[0]} className={inputClass} required />
          </div>
          <div>
            <label className="block text-xs tracking-[0.2em] uppercase text-[#b88364] mb-2 font-medium">
              {isRent ? "Fin" : "Salida"}
            </label>
            <input type="date" value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setAvailability({ available: false, checked: false }); }}
              min={startDate || new Date().toISOString().split("T")[0]} className={inputClass} required />
          </div>
        </div>
      )}

      {/* Check availability button */}
      {startDate && (isAct || (startDate < endDate)) && !availability.checked && (
        <button type="button" onClick={checkAvailability} disabled={loading}
          className="w-full py-3 border-2 border-[#b88364]/20 text-[#b88364] rounded-lg uppercase tracking-wider text-xs font-medium hover:bg-[#b88364]/5 transition-colors disabled:opacity-50">
          {loading ? "Verificando..." : "Verificar disponibilidad"}
        </button>
      )}

      {/* Availability result */}
      {availability.checked && (
        availability.available ? (
          <div className="bg-[#ebf5eb] text-[#1b4235] rounded-lg p-4 text-sm flex items-center gap-3">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Disponible
          </div>
        ) : (
          <div className="bg-[#fef0ef] text-[#8b1a1a] rounded-lg p-4 text-sm flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            No disponible para {isAct ? "esa fecha" : "esas fechas"}. Por favor selecciona {isAct ? "otra fecha" : "otras"}.
          </div>
        )
      )}

      {/* Booking details */}
      {availability.available && (
        <>
          {/* Price summary */}
          <div className="bg-[#f7f3f0] rounded-lg p-5">
            {isAct ? (
              <div className="flex justify-between text-sm text-[#1b4235] mb-2">
                <span>{item.name} × {guests} {guests === 1 ? "persona" : "personas"}</span>
                <span>${formatPrice(total)} MXN</span>
              </div>
            ) : (
              <div className="flex justify-between text-sm text-[#1b4235] mb-2">
                <span>{item.name} × {days} {isRent ? "día(s)" : "noche(s)"}</span>
                <span>${formatPrice(total)} MXN</span>
              </div>
            )}
            <div className="border-t border-[#b88364]/20 mt-3 pt-3 flex justify-between font-semibold text-[#1b4235]">
              <span>Total</span>
              <span>${formatPrice(total)} MXN</span>
            </div>
          </div>

          {/* Contact fields */}
          <div>
            <label className="block text-xs tracking-[0.2em] uppercase text-[#b88364] mb-2 font-medium">Nombre completo *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Tu nombre" required />
          </div>

          <div>
            <label className="block text-xs tracking-[0.2em] uppercase text-[#b88364] mb-2 font-medium">Correo electrónico *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="tu@email.com" required />
          </div>

          <div>
            <label className="block text-xs tracking-[0.2em] uppercase text-[#b88364] mb-2 font-medium">Teléfono</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="+52 55 ..." />
          </div>

          {/* Guests / Participants */}
          <div>
            <label className="block text-xs tracking-[0.2em] uppercase text-[#b88364] mb-2 font-medium">
              {isAct ? "Participantes" : "Huéspedes"}
            </label>
            {isAct ? (
              <input type="number" value={guests} onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value) || 1))}
                min="1" max={item.type === "hike" ? "4" : "4"} className={inputClass} />
            ) : (
              !isRent && (
                <input type="number" value={guests} onChange={(e) => setGuests(parseInt(e.target.value))}
                  min="1" max="10" className={inputClass} />
              )
            )}
          </div>

          <div>
            <label className="block text-xs tracking-[0.2em] uppercase text-[#b88364] mb-2 font-medium">Notas adicionales</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className={inputClass} placeholder={isAct ? "Horario preferido o cualquier detalle" : "¿Algo que debamos saber?"} />
          </div>

          {error && (
            <div className="bg-[#fef0ef] text-[#8b1a1a] rounded-lg p-4 text-sm">{error}</div>
          )}

          <button type="submit" disabled={loading || !availability.available}
            className="w-full py-4 bg-[#1b4235] text-white rounded-lg uppercase tracking-wider text-sm font-medium hover:bg-[#0f2a20] transition-colors disabled:opacity-50 shadow-lg shadow-[#1b4235]/10">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Procesando...
              </span>
            ) : isAct ? "Reservar actividad" : "Reservar ahora"}
          </button>

          <p className="text-xs text-center text-[#b88364]/60 mt-3">
            Serás redirigido a Stripe para completar el pago de forma segura.
          </p>
        </>
      )}
    </form>
  );
}
