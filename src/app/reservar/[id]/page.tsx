import Link from "next/link";
import { prisma } from "@/lib/prisma";

function fmt(c: number) { return (c / 100).toLocaleString("es-MX"); }

export default async function Page({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; confirmed?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const booking = await prisma.booking.findUnique({ where: { id }, include: { item: true } });
  if (!booking) return <main className="min-h-screen bg-[#faf7f5] flex items-center justify-center"><div className="text-center"><h1 className="font-serif text-3xl text-[#1b4235] mb-4">Reserva no encontrada</h1><Link href="/" className="text-[#b88364]">Volver</Link></div></main>;

  const isPaid = sp.success && booking.status === "paid";
  const isConfirmed = sp.confirmed || booking.status === "confirmed";

  const statusEmoji = isPaid ? "🎉" : isConfirmed ? "✅" : "⏳";
  const statusTitle = isPaid ? "¡Pago Completado!" : isConfirmed ? "¡Reserva Confirmada!" : "Reserva Pendiente";
  const statusDesc = isPaid ? "Tu pago ha sido procesado. ¡Te esperamos!" :
    isConfirmed ? "Tu reserva ha sido confirmada. Recibirás un correo con los detalles." :
    booking.status === "pending" ? "Falta completar el pago para confirmar tu reserva." :
    `Estado: ${booking.status}`;

  const isRental = booking.item.type === "moto" || booking.item.type === "bici";
  const unit = isRental ? "día(s)" : "noche(s)";
  const days = Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000*60*60*24));

  return (
    <main className="min-h-screen bg-[#faf7f5] flex items-center justify-center">
      <div className="text-center max-w-lg px-6">
        <div className="text-7xl mb-8">{statusEmoji}</div>
        <h1 className="font-serif text-4xl text-[#1b4235] tracking-[-0.02em] mb-4">{statusTitle}</h1>
        <p className="text-[#5c3d2e] mb-10">{statusDesc}</p>
        <div className="bg-white rounded-lg p-8 text-left mb-10 border border-black/5">
          <p className="text-xs tracking-[0.2em] uppercase text-[#b88364] mb-4">{isRental ? "Renta" : "Hospedaje"}</p>
          <h2 className="text-2xl font-serif text-[#1b4235] mb-4">{booking.item.name}</h2>
          <p className="text-sm text-[#5c3d2e]">{booking.customerName} · {booking.customerEmail}</p>
          <p className="text-sm text-[#b88364] my-2">
            {new Date(booking.startDate).toLocaleDateString("es-MX", { weekday:"long", day:"numeric", month:"long" })} → {new Date(booking.endDate).toLocaleDateString("es-MX", { weekday:"long", day:"numeric", month:"long" })}
          </p>
          <p className="text-xs text-[#b88364]/60">{days} {unit} · {booking.guests} {booking.guests === 1 ? "persona" : "personas"}</p>
          <p className="text-xs text-gray-300 mt-2">ID: {booking.id}</p>
          <div className="border-t border-[#b88364]/10 mt-4 pt-4">
            <p className="text-2xl font-medium text-[#1b4235]">${fmt(booking.totalPrice)} <span className="text-sm text-[#b88364]">MXN</span></p>
          </div>
          {booking.status === "pending" && (
            <form action="/api/checkout" method="POST" className="mt-4">
              <input type="hidden" name="bookingId" value={booking.id} />
              <button className="w-full py-3 bg-[#1b4235] text-white rounded-lg text-sm tracking-wider uppercase hover:bg-[#0f2a20] transition-colors">
                Ir a pagar
              </button>
            </form>
          )}
          {booking.notes && (
            <p className="mt-3 text-xs text-[#b88364] italic">Nota: {booking.notes}</p>
          )}
        </div>
        <Link href="/" className="inline-block px-8 py-3 bg-[#1b4235] text-white rounded-lg text-sm tracking-wider uppercase hover:bg-[#0f2a20] transition-colors">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
