import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const featured = await prisma.item.findMany({
    where: { featured: true, active: true },
  });
  const glampings = await prisma.item.findMany({
    where: { type: "glamping", active: true },
  });
  const bikes = await prisma.item.findMany({
    where: { type: "bici", active: true },
  });
  const motos = await prisma.item.findMany({
    where: { type: "moto", active: true },
  });

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-[#1b4235]">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <div className="relative z-20 text-center px-4">
          <p className="text-[#ece7e3] uppercase tracking-[44px] text-sm mb-4">Bienvenidos a</p>
          <h1 className="text-[125px] font-['Hertical'] uppercase text-[#edd3c5] leading-none mb-8">Hangar 5</h1>
          <Link href="#alojamiento" className="inline-block px-8 py-3 border border-[#b88364] text-[#b88364] hover:bg-[#b88364] hover:text-white transition-colors uppercase tracking-widest text-sm">
            Explorar
          </Link>
        </div>
      </section>

      {/* Alojamiento */}
      <section id="alojamiento" className="py-24 bg-[#b88364]">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-5xl font-medium text-white uppercase tracking-[-0.5px] mb-16">Las Cabañas</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {featured.map((item) => (
              <Link key={item.id} href={`/item/${item.slug}`} className="group block bg-white/10 backdrop-blur sm p-6 hover:bg-white/20 transition-colors">
                <div className="w-full h-64 bg-white/20 mb-6 flex items-center justify-center text-white/30">
                  {item.name}
                </div>
                <h3 className="text-2xl font-medium text-white mb-2">{item.name}</h3>
                <p className="text-white/70 text-sm mb-1">{item.capacity}</p>
                <p className="text-white font-bold">${(item.price / 100).toLocaleString()} MXN / noche</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Glampings */}
      <section className="py-24 bg-[#b88364]">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-5xl font-medium text-white uppercase tracking-[-0.5px] mb-16">Los Glampings</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {glampings.map((item) => (
              <Link key={item.id} href={`/item/${item.slug}`} className="block bg-white/10 p-6 hover:bg-white/20 transition-colors">
                <h3 className="text-2xl font-medium text-white mb-2">{item.name}</h3>
                <p className="text-white/70 text-sm mb-1">{item.capacity}</p>
                <p className="text-white font-bold">${(item.price / 100).toLocaleString()} MXN / noche</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Actividades */}
      <section className="py-24 bg-[#1b4235]">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-5xl font-medium text-white uppercase tracking-[-0.5px] mb-16">Renta de Equipo</h2>
          
          <div className="mb-16">
            <h3 className="text-3xl text-[#edd3c5] uppercase mb-8">Motos</h3>
            <div className="grid md:grid-cols-2 gap-8">
              {motos.map((item) => (
                <Link key={item.id} href={`/item/${item.slug}`} className="block bg-white/5 p-6 border border-[#b88364]/30 hover:bg-white/10 transition-colors">
                  <h4 className="text-xl font-medium text-[#edd3c5] mb-2">{item.name}</h4>
                  <p className="text-white/50 text-sm mb-1">{item.description}</p>
                  <p className="text-white font-bold mt-2">${(item.price / 100).toLocaleString()} MXN / día</p>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-3xl text-[#edd3c5] uppercase mb-8">Bicicletas</h3>
            <div className="grid md:grid-cols-3 gap-8">
              {bikes.map((item) => (
                <Link key={item.id} href={`/item/${item.slug}`} className="block bg-white/5 p-6 border border-[#b88364]/30 hover:bg-white/10 transition-colors">
                  <h4 className="text-xl font-medium text-[#edd3c5] mb-2">{item.name}</h4>
                  <p className="text-white/50 text-sm mb-1">{item.description}</p>
                  <p className="text-white font-bold mt-2">${(item.price / 100).toLocaleString()} MXN / día</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section className="py-24 bg-[#1b4235]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-start gap-16">
          <div>
            <h2 className="text-5xl font-medium text-[#edd3c5] uppercase tracking-[-0.5px] mb-8">Contáctanos</h2>
            <div className="space-y-6 text-[#edd3c5]">
              <div>
                <p className="text-sm uppercase tracking-[100px] mb-1">Phone</p>
                <p className="text-lg">+52 722 455 6628</p>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[100px] mb-1">Email</p>
                <p className="text-lg">hangar.cinco.mexico@gmail.com</p>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[100px] mb-1">Social</p>
                <p className="text-lg">hangar5_mexico</p>
              </div>
            </div>
          </div>
          <div className="min-w-[300px]">
            <p className="text-sm uppercase tracking-[100px] text-[#edd3c5] mb-4">Ubicación</p>
            <p className="text-lg text-[#edd3c5] leading-relaxed">
              El Peñón Temascaltepec<br />
              51305 El Peñón, Méx.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-[#0f2a20] text-center text-white/30 text-sm">
        <p>Hangar 5 &copy; {new Date().getFullYear()}</p>
      </footer>
    </main>
  );
}
