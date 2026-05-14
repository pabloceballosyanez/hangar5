import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BookingForm } from "@/components/BookingForm";
import { ItemCalendar } from "@/components/ItemCalendar";
import { notFound } from "next/navigation";

function formatPrice(cents: number) { return (cents / 100).toLocaleString("es-MX"); }

export default async function ItemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await prisma.item.findUnique({ where: { slug } });
  if (!item) notFound();

  const typeLabels: Record<string, string> = { cabana: "Cabaña", glamping: "Glamping", moto: "Moto", bici: "Bicicleta" };
  const isRental = item.type === "moto" || item.type === "bici";
  const unit = isRental ? "día" : "noche";

  return (
    <main className="min-h-screen bg-[#faf7f5]">
      <nav className="py-6 px-6 border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-[#1b4235] font-semibold tracking-[0.2em] uppercase text-sm">Hangar 5</Link>
          <Link href="/" className="text-xs tracking-[0.2em] uppercase text-[#b88364] hover:text-[#1b4235] transition-colors">← Volver</Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Breadcrumb & type */}
        <div className="mb-12">
          <p className="text-xs tracking-[0.3em] uppercase text-[#b88364] mb-3">{typeLabels[item.type]}</p>
          <h1 className="font-serif text-5xl md:text-6xl text-[#1b4235] tracking-[-0.02em] mb-6">{item.name}</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-16 mb-20">
          {/* Image */}
          <div>
            <div className="aspect-[4/5] rounded-lg overflow-hidden bg-cover bg-center shadow-lg"
              style={{ backgroundImage: `url('${item.image || "/img/paisaje.jpg"}')` }} />
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="aspect-square rounded bg-cover bg-center opacity-60" style={{ backgroundImage: `url('${item.image || "/img/paisaje.jpg"}')` }} />
              <div className="aspect-square rounded bg-cover bg-center opacity-60" style={{ backgroundImage: `url('${item.image || "/img/paisaje.jpg"}')` }} />
              <div className="aspect-square rounded bg-cover bg-center opacity-60" style={{ backgroundImage: `url('${item.image || "/img/paisaje.jpg"}')` }} />
            </div>
          </div>

          {/* Details */}
          <div>
            <p className="text-lg text-[#5c3d2e] leading-relaxed mb-8">{item.description}</p>
            
            <div className="space-y-4 pb-8 mb-8 border-b border-[#b88364]/20">
              <div className="flex items-center gap-3 text-[#1b4235]">
                <svg className="w-5 h-5 text-[#b88364]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{item.capacity}</span>
              </div>
              <div className="flex items-center gap-3 text-[#1b4235]">
                <svg className="w-5 h-5 text-[#b88364]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Por {unit}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-serif text-[#1b4235] font-medium">${formatPrice(item.price)}</span>
                <span className="text-[#b88364]">MXN / {unit}</span>
              </div>
            </div>

            {/* Calendar */}
            <h3 className="text-sm tracking-[0.3em] uppercase text-[#b88364] mb-4">Disponibilidad</h3>
            <div className="bg-white border border-black/5 rounded-lg p-6 mb-8">
              <ItemCalendar itemId={item.id} />
            </div>
          </div>
        </div>

        {/* Booking section */}
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <div className="h-px w-24 bg-[#b88364]/30 mx-auto mb-8" />
            <h2 className="font-serif text-3xl text-[#1b4235] tracking-[-0.02em] mb-3">Reservar</h2>
            <p className="text-[#5c3d2e] text-sm">Selecciona tus fechas y completa el formulario</p>
          </div>
          <div className="bg-white border border-black/5 rounded-lg p-8 shadow-sm">
            <BookingForm item={item} />
          </div>
        </div>
      </div>
    </main>
  );
}
