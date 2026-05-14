import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function BookingConfirmPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string }>;
}) {
  const { id } = await params;
  const { success } = await searchParams;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { item: true },
  });

  if (!booking) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-3xl text-[#1b4235] mb-4">Reserva no encontrada</h1>
          <Link href="/" className="text-[#b88364] underline">Volver al inicio</Link>
        </div>
      </main>
    );
  }

  if (success && booking.status === "paid") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-lg px-4">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-4xl text-[#1b4235] mb-4">¡Reserva Confirmada!</h1>
          <p className="text-[#391b0b] mb-8">Tu pago ha sido procesado exitosamente.</p>
          <div className="bg-[#f7f3f0] p-6 text-left mb-8">
            <h2 className="text-xl font-medium text-[#1b4235] mb-4">{booking.item.name}</h2>
            <p className="text-sm text-[#391b0b]">
              {new Date(booking.startDate).toLocaleDateString("es-MX")} → {new Date(booking.endDate).toLocaleDateString("es-MX")}
            </p>
            <p className="text-sm text-[#391b0b]">Reserva: {booking.id}</p>
            <p className="text-lg font-bold text-[#1b4235] mt-2">${(booking.totalPrice / 100).toLocaleString()} MXN</p>
          </div>
          <Link href="/" className="inline-block px-6 py-3 bg-[#1b4235] text-[#edd3c5] uppercase tracking-wider text-sm">
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center max-w-lg px-4">
        <div className="text-6xl mb-6">⏳</div>
        <h1 className="text-4xl text-[#1b4235] mb-4">Reserva Pendiente</h1>
        <p className="text-[#391b0b] mb-8">
          {booking.status === "pending" 
            ? "Tu reserva ha sido creada pero aún no se ha completado el pago."
            : `Estado: ${booking.status}`}
        </p>
        <div className="bg-[#f7f3f0] p-6 text-left mb-8">
          <h2 className="text-xl font-medium text-[#1b4235] mb-4">{booking.item.name}</h2>
          <p className="text-sm text-[#391b0b]">
            {new Date(booking.startDate).toLocaleDateString("es-MX")} → {new Date(booking.endDate).toLocaleDateString("es-MX")}
          </p>
          <p className="text-sm text-[#391b0b]">Reserva: {booking.id}</p>
          <p className="text-sm text-[#391b0b]">Cliente: {booking.customerName}</p>
          <p className="text-lg font-bold text-[#1b4235] mt-2">${(booking.totalPrice / 100).toLocaleString()} MXN</p>
        </div>
        <div className="space-y-3">
          {booking.status === "pending" && (
            <form action="/api/checkout" method="POST" className="inline">
              <input type="hidden" name="bookingId" value={booking.id} />
              <button className="w-full px-6 py-3 bg-[#1b4235] text-[#edd3c5] uppercase tracking-wider text-sm hover:bg-[#0f2a20]">
                Pagar con Stripe
              </button>
            </form>
          )}
          <Link href="/" className="block text-[#b88364] underline text-sm">
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
