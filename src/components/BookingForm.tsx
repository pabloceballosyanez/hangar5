"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface BookingFormProps {
  item: { id: string; slug: string; name: string; price: number; type: string };
}

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

  const checkAvailability = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setError("");
    const res = await fetch(`/api/availability?itemId=${item.id}&start=${startDate}&end=${endDate}`);
    const data = await res.json();
    setAvailability({ available: data.available, checked: true });
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Create booking
    const bookingRes = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemId: item.id, customerName: name, customerEmail: email,
        customerPhone: phone, startDate, endDate, guests, notes,
      }),
    });

    if (!bookingRes.ok) {
      const err = await bookingRes.json();
      setError(err.error || "Error creating booking");
      setLoading(false);
      return;
    }

    const booking = await bookingRes.json();

    // Try Stripe checkout
    const checkoutRes = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: booking.id }),
    });

    const checkoutData = await checkoutRes.json();

    if (checkoutData.url) {
      window.location.href = checkoutData.url;
    } else {
      router.push(`/reservar/${booking.id}`);
    }
  };

  const days = startDate && endDate
    ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const total = days * item.price;

  const isRental = item.type === "moto" || item.type === "bici";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#1b4235] mb-1 uppercase tracking-wider">
            Fecha {isRental ? "inicio" : "entrada"}
          </label>
          <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setAvailability({ available: false, checked: false }); }}
            min={new Date().toISOString().split("T")[0]}
            className="w-full border border-[#b88364]/30 p-3 focus:outline-none focus:border-[#b88364]"
            required />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1b4235] mb-1 uppercase tracking-wider">
            Fecha {isRental ? "fin" : "salida"}
          </label>
          <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setAvailability({ available: false, checked: false }); }}
            min={startDate || new Date().toISOString().split("T")[0]}
            className="w-full border border-[#b88364]/30 p-3 focus:outline-none focus:border-[#b88364]"
            required />
        </div>
      </div>

      {startDate && endDate && startDate < endDate && (
        <button type="button" onClick={checkAvailability} disabled={loading}
          className="w-full py-2 border border-[#1b4235] text-[#1b4235] text-sm uppercase tracking-wider hover:bg-[#1b4235] hover:text-white transition-colors disabled:opacity-50">
          {loading ? "Verificando..." : "Verificar disponibilidad"}
        </button>
      )}

      {availability.checked && (
        <div className={`p-3 text-sm ${availability.available ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {availability.available ? "✓ Disponible para estas fechas" : "✗ No disponible. Selecciona otras fechas."}
        </div>
      )}

      {availability.available && (
        <>
          <div className="bg-[#f7f3f0] p-4">
            <div className="flex justify-between text-sm text-[#1b4235] mb-1">
              <span>{item.name} × {days} {isRental ? "día(s)" : "noche(s)"}</span>
              <span>${(total / 100).toLocaleString()} MXN</span>
            </div>
            <div className="border-t border-[#b88364]/30 mt-2 pt-2 flex justify-between font-bold text-[#1b4235]">
              <span>Total</span>
              <span>${(total / 100).toLocaleString()} MXN</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1b4235] mb-1 uppercase tracking-wider">Nombre completo *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full border border-[#b88364]/30 p-3 focus:outline-none focus:border-[#b88364]" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1b4235] mb-1 uppercase tracking-wider">Email *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[#b88364]/30 p-3 focus:outline-none focus:border-[#b88364]" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1b4235] mb-1 uppercase tracking-wider">Teléfono</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-[#b88364]/30 p-3 focus:outline-none focus:border-[#b88364]" />
          </div>

          {!isRental && (
            <div>
              <label className="block text-sm font-medium text-[#1b4235] mb-1 uppercase tracking-wider">Huéspedes</label>
              <input type="number" value={guests} onChange={(e) => setGuests(parseInt(e.target.value))} min="1" max="10"
                className="w-full border border-[#b88364]/30 p-3 focus:outline-none focus:border-[#b88364]" />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#1b4235] mb-1 uppercase tracking-wider">Notas adicionales</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              className="w-full border border-[#b88364]/30 p-3 focus:outline-none focus:border-[#b88364]"
              placeholder="¿Algo que debamos saber?" />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-4 bg-[#1b4235] text-[#edd3c5] uppercase tracking-widest text-sm hover:bg-[#0f2a20] transition-colors disabled:opacity-50">
            {loading ? "Procesando..." : "Reservar ahora"}
          </button>

          <p className="text-xs text-center text-gray-400 mt-4">
            Serás redirigido a Stripe para completar el pago. Tus datos están seguros.
          </p>
        </>
      )}
    </form>
  );
}
