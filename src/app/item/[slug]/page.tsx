import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BookingForm } from "@/components/BookingForm";
import { ItemCalendar } from "@/components/ItemCalendar";
import Gallery from "@/components/Gallery";
import { getItemImages } from "@/lib/images";
import { getTypeLabel, isActivity, isRental } from "@/lib/types";
import { notFound } from "next/navigation";

function formatPrice(cents: number) { return (cents / 100).toLocaleString("es-MX"); }

export default async function ItemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await prisma.item.findUnique({ where: { slug } });
  if (!item) notFound();

  const images = getItemImages(slug);

  const isRent = isRental(item.type);
  const isAct = isActivity(item.type);
  const unit = isAct ? "persona" : (isRent ? "día" : "noche");

  return (
    <main className="min-h-screen bg-ink">
      <nav className="py-6 px-6 border-b border-hair bg-snow/10 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-snow font-semibold tracking-[0.2em] uppercase text-sm">Hangar 5</Link>
          <Link href="/" className="text-xs tracking-[0.2em] uppercase text-brass hover:text-snow transition-colors">← Volver</Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Breadcrumb & type */}
        <div className="mb-12">
          <p className="text-xs tracking-[0.3em] uppercase text-brass mb-3">{getTypeLabel(item.type)}</p>
          <h1 className="font-serif text-5xl md:text-6xl text-snow tracking-[-0.02em] mb-6">{item.name}</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-16 mb-20">
          {/* Image Gallery */}
          <div>
            {images.length > 0 ? (
              <Gallery images={images} />
            ) : (
              <>
                <div className="aspect-[4/5] rounded-lg overflow-hidden bg-cover bg-center shadow-lg"
                  style={{ backgroundImage: `url('${item.image || "/img/paisaje.jpg"}')` }} />
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="aspect-square rounded bg-cover bg-center opacity-60" style={{ backgroundImage: `url('${item.image || "/img/paisaje.jpg"}')` }} />
                  <div className="aspect-square rounded bg-cover bg-center opacity-60" style={{ backgroundImage: `url('${item.image || "/img/paisaje.jpg"}')` }} />
                  <div className="aspect-square rounded bg-cover bg-center opacity-60" style={{ backgroundImage: `url('${item.image || "/img/paisaje.jpg"}')` }} />
                </div>
              </>
            )}
          </div>

          {/* Details */}
          <div>
            <p className="text-lg text-ash leading-relaxed mb-8">{item.description}</p>
            
            <div className="space-y-4 pb-8 mb-8 border-b border-brass/20">
              <div className="flex items-center gap-3 text-snow">
                <svg className="w-5 h-5 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{item.capacity}</span>
              </div>
              <div className="flex items-center gap-3 text-snow">
                <svg className="w-5 h-5 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{isAct ? "Por persona" : `Por ${unit}`}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-serif text-snow font-medium">${formatPrice(item.price)}</span>
                <span className="text-brass">MXN / {isAct ? "persona" : unit}</span>
              </div>
            </div>

            {/* Calendar */}
            <h3 className="text-sm tracking-[0.3em] uppercase text-brass mb-4">Disponibilidad</h3>
            <div className="bg-ink-2 border border-hair rounded-lg p-6 mb-8">
              <ItemCalendar itemId={item.id} />
            </div>
          </div>
        </div>

        {/* Booking section */}
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <div className="h-px w-24 bg-brass/30 mx-auto mb-8" />
            <h2 className="font-serif text-3xl text-snow tracking-[-0.02em] mb-3">Reservar</h2>
            <p className="text-ash text-sm">{isAct ? "Elige la fecha y número de participantes" : "Selecciona tus fechas y completa el formulario"}</p>
          </div>
          <div className="bg-ink-2 border border-hair rounded-lg p-8 shadow-sm">
            <BookingForm item={item} hasMpToken={!!process.env.MP_ACCESS_TOKEN} />
          </div>
        </div>
      </div>
    </main>
  );
}
