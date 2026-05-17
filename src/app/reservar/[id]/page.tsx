import Link from "next/link";
import { prisma } from "@/lib/prisma";

function fmt(c: number) { return (c / 100).toLocaleString("es-MX"); }

const paymentLabels: Record<string, string> = {
  card: "💳 Tarjeta",
  transfer: "🏦 Transferencia bancaria",
  cash: "💵 Efectivo",
};

export default async function Page({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; confirmed?: string; payment?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const booking = await prisma.booking.findUnique({ where: { id }, include: { item: true } });
  if (!booking) return <main className="min-h-screen bg-[#faf7f5] flex items-center justify-center"><div className="text-center"><h1 className="font-serif text-3xl text-[#1b4235] mb-4">Reserva no encontrada</h1><Link href="/" className="text-[#b88364]">Volver</Link></div></main>;

  const isPaid = sp.success && booking.status === "paid";
  const isConfirmed = sp.confirmed || booking.status === "confirmed";
  const paymentMethod = sp.payment || booking.paymentMethod;

  const bankName = process.env.BANK_NAME || "";
  const bankClabe = process.env.BANK_CLABE || "";
  const bankHolder = process.env.BANK_ACCOUNT_HOLDER || "";
  const bankCard = process.env.BANK_CARD || "";

  let statusEmoji, statusTitle, statusDesc;

  if (isPaid) {
    statusEmoji = "🎉";
    statusTitle = "¡Pago Completado!";
    statusDesc = "Tu pago ha sido procesado. ¡Te esperamos en Hangar 5!";
  } else if (paymentMethod === "transfer" && isConfirmed) {
    statusEmoji = "✅";
    statusTitle = "¡Reserva Confirmada!";
    statusDesc = "Realiza el pago por transferencia y envíanos tu comprobante para agilizar tu llegada.";
  } else if (paymentMethod === "cash" && isConfirmed) {
    statusEmoji = "✅";
    statusTitle = "¡Reserva Confirmada!";
    statusDesc = "Paga en efectivo cuando llegues a Hangar 5. ¡Te esperamos!";
  } else if (isConfirmed) {
    statusEmoji = "✅";
    statusTitle = "¡Reserva Confirmada!";
    statusDesc = "Tu reserva ha sido confirmada. Te esperamos en Hangar 5.";
  } else {
    statusEmoji = "⏳";
    statusTitle = "Reserva Pendiente";
    statusDesc = booking.status === "pending" ? "Falta completar el pago para confirmar tu reserva." : `Estado: ${booking.status}`;
  }

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
          {/* Payment method badge */}
          {paymentMethod && (
            <div className={`mt-3 pt-3 border-t border-[#b88364]/10 text-xs flex items-center gap-2 ${
              paymentMethod === "transfer" ? "text-amber-700" : "text-[#b88364]"
            }`}>
              <span>{paymentLabels[paymentMethod] || paymentMethod}</span>
            </div>
          )}

          {/* Bank details for transferencias */}
          {paymentMethod === "transfer" && isConfirmed && (bankName || bankClabe) && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
              <p className="text-xs uppercase tracking-wider text-amber-800 font-medium mb-3">📋 Datos para transferencia</p>
              <div className="space-y-2 text-xs text-amber-900">
                {bankName && <p><span className="text-amber-600">Banco:</span> {bankName}</p>}
                {bankClabe && <p><span className="text-amber-600">CLABE:</span> <span className="font-mono font-bold">{bankClabe}</span></p>}
                {bankCard && <p><span className="text-amber-600">Tarjeta:</span> <span className="font-mono">{bankCard}</span></p>}
                {bankHolder && <p><span className="text-amber-600">Titular:</span> {bankHolder}</p>}
                <p className="mt-2"><span className="text-amber-600">Referencia:</span> <span className="font-mono font-bold">{booking.id.slice(-8).toUpperCase()}</span></p>
              </div>
              <p className="text-[11px] text-amber-600/70 mt-3 italic">
                Envía tu comprobante al <strong>+52 722 455 6628</strong> (WhatsApp) para confirmar tu pago.
              </p>
            </div>
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
