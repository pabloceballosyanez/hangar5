import Link from "next/link";
import { prisma } from "@/lib/prisma";

function formatPrice(c: number) { return (c / 100).toLocaleString("es-MX"); }

export default async function BookingConfirmPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string }>;
}) {
  const { id } = await params;
  const { success } = await searchParams;
  const booking = await prisma.booking.findUnique({ where: { id }, include: { item: true } });
  if (!booking) return (
    <main className="min-h-screen bg-[#faf7f5] flex items-center justify-center">
      <div className="text-center"><h1 className="font-serif text-3xl text-[#1b4235] mb-4">Reserva no encontrada</h1><Link href="/" className="text-[#b88364]">Volver</Link></div>
    </main>
  );

  const isPaid = success && booking.status === "paid";

  return (
    <main className="min-h-screen bg-[#faf7f5] flex items-center justify-center">
      <div className="text-center max-w-lg px-6">
        <div className="text-7xl mb-8">{isPaid ? "🎉" : "⏳"}</div>
        <h1 className="font-serif text-4xl text-[#1b4235] tracking-[-0.02em] mb-4">
          {isPaid ? "¡Reserva Confirmada!" : "Reserva Pendiente"}
        </h1>
        <p className="text-[#5c3d2e] mb-10">
          {isPaid
            ? "Tu pago ha sido procesado exitosamente. ¡Te esperamos!"
            : booking.status === "pending"
              ? "Tu reserva fue creada pero falta completar el pago."
              : `Estado actual: ${booking.status}`}
        </p>
        <div className="bg-white rounded-lg p-8 text-left mb-10 border border-black/5">
          <p className="text-xs tracking-[0.2em] uppercase text-[#b88364] mb-4">
            {booking.item.type === "moto" || booking.item.type === "bici" ? "Renta" : "Reserva"}
          </p>
          <h2 className="text-2xl font-serif text-[#1b4235] mb-4">{booking.item.name}</h2>
          <div className="space-y-2 text-sm text-[#5c3d2e]">
            <p>{new Date(booking.startDate).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} → {new Date(booking.endDate).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
            <p className="text-[#b88364] text-xs">{booking.id}</p>
          </div>
          <div className="border-t border-[#b88364]/10 mt-4 pt-4">
            <p className="text-2xl font-medium text-[#1b4235]">${formatPrice(booking.totalPrice)} <span className="text-sm text-[#b88364]">MXN</span></p>
          </div>
        </div>
        <Link href="/" className="inline-block px-8 py-4 bg-[#1b4235] text-white rounded-lg text-sm tracking-wider uppercase hover:bg-[#0f2a20] transition-colors">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
