import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BookingForm } from "@/components/BookingForm";
import { ItemCalendar } from "@/components/ItemCalendar";
import { notFound } from "next/navigation";

export default async function ItemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await prisma.item.findUnique({ where: { slug } });
  if (!item) notFound();

  const typeLabels: Record<string, string> = {
    cabana: "Cabaña", glamping: "Glamping", moto: "Moto", bici: "Bicicleta"
  };

  return (
    <main className="min-h-screen bg-white">
      <nav className="py-6 px-4 border-b">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-[#1b4235] font-medium text-xl uppercase tracking-wider">Hangar 5</Link>
          <Link href="/" className="text-[#b88364] text-sm uppercase tracking-widest hover:text-[#1b4235]">← Volver</Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-16">
          {/* Left: Info */}
          <div>
            <p className="text-[#b88364] uppercase tracking-[30px] text-sm mb-4">{typeLabels[item.type]}</p>
            <h1 className="text-5xl font-medium text-[#1b4235] uppercase tracking-[-0.5px] mb-6">{item.name}</h1>
            <p className="text-lg text-[#391b0b] leading-relaxed mb-6">{item.description}</p>
            <div className="space-y-3 mb-8">
              <p className="text-[#b88364] font-medium">{item.capacity}</p>
              <p className="text-2xl font-bold text-[#1b4235]">
                ${(item.price / 100).toLocaleString()} MXN
                <span className="text-base font-normal text-[#b88364]"> / {item.type === "moto" || item.type === "bici" ? "día" : "noche"}</span>
              </p>
            </div>
            <div className="bg-[#f7f3f0] p-6">
              <h3 className="text-lg font-medium text-[#1b4235] mb-3 uppercase tracking-widest">Disponibilidad</h3>
              <ItemCalendar itemId={item.id} />
            </div>
          </div>
          
          {/* Right: Booking Form */}
          <div>
            <h2 className="text-3xl font-medium text-[#1b4235] uppercase tracking-[-0.5px] mb-8">Reservar</h2>
            <BookingForm item={item} />
          </div>
        </div>
      </div>
    </main>
  );
}
