import Link from "next/link";
import { prisma } from "@/lib/prisma";

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("es-MX");
}

export default async function Home() {
  const featured = await prisma.item.findMany({ where: { featured: true, active: true } });
  const glampings = await prisma.item.findMany({ where: { type: "glamping", active: true } });
  const bikes = await prisma.item.findMany({ where: { type: "bici", active: true } });
  const motos = await prisma.item.findMany({ where: { type: "moto", active: true } });

  return (
    <main className="min-h-screen bg-[#faf7f5]">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 mix-blend-difference text-white">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <Link href="/" className="text-lg font-semibold tracking-[0.3em] uppercase">Hangar 5</Link>
          <div className="hidden md:flex gap-10 text-xs tracking-[0.2em] uppercase">
            <a href="#cabanas" className="hover:opacity-70 transition-opacity">Cabañas</a>
            <a href="#glampings" className="hover:opacity-70 transition-opacity">Glampings</a>
            <a href="#equipo" className="hover:opacity-70 transition-opacity">Equipo</a>
            <a href="#contacto" className="hover:opacity-70 transition-opacity">Contacto</a>
          </div>
          <Link href="/admin" className="text-xs tracking-[0.2em] uppercase opacity-50 hover:opacity-100 transition-opacity">Admin</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('/img/hero-bg.jpg')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
        <div className="relative z-10 text-center text-white px-4">
          <p className="tracking-[0.5em] text-sm md:text-base uppercase mb-6 opacity-80">Bienvenidos a</p>
          <h1 className="font-serif text-7xl md:text-[9rem] leading-[0.85] mb-8 tracking-[-0.02em]">
            Hangar <span className="italic">5</span>
          </h1>
          <p className="text-lg md:text-xl font-light tracking-wider max-w-xl mx-auto opacity-80">
            Cabañas · Glampings · Aventura<br />
            El Peñón, Temascaltepec
          </p>
          <div className="mt-12">
            <a href="#cabanas" className="inline-flex items-center gap-3 px-8 py-4 border border-white/30 hover:border-white/80 rounded-full text-sm tracking-widest uppercase transition-all duration-300 hover:bg-white/10">
              Explorar
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
            </a>
          </div>
        </div>
      </section>

      {/* Cabañas */}
      <section id="cabanas" className="py-32 bg-[#faf7f5]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-20">
            <p className="text-[#b88364] tracking-[0.3em] uppercase text-sm mb-4">Alojamiento</p>
            <h2 className="font-serif text-5xl md:text-6xl text-[#1b4235] tracking-[-0.02em]">Las Cabañas</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {featured.map((item, i) => (
              <Link key={item.id} href={`/item/${item.slug}`} className="group block">
                <div className="relative overflow-hidden aspect-[3/4] mb-6">
                  <div className="absolute inset-0 bg-[url('/img/cabana-1.jpg')] bg-cover bg-center group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: `url('${item.image}')` }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    <span className="text-white text-sm tracking-widest uppercase bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                      Reservar →
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#b88364] tracking-[0.2em] uppercase mb-2">Cabaña</p>
                <h3 className="text-2xl font-serif text-[#1b4235] mb-2">{item.name}</h3>
                <p className="text-sm text-[#5c3d2e] mb-3">{item.capacity}</p>
                <p className="text-lg font-medium text-[#1b4235]">
                  ${formatPrice(item.price)} <span className="text-sm text-[#b88364] font-normal">MXN / noche</span>
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Glampings */}
      <section id="glampings" className="py-32 bg-[#1b4235] text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-20">
            <p className="text-[#b88364] tracking-[0.3em] uppercase text-sm mb-4">Bajo las estrellas</p>
            <h2 className="font-serif text-5xl md:text-6xl tracking-[-0.02em]">Los Glampings</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-12">
            {glampings.map((item) => (
              <Link key={item.id} href={`/item/${item.slug}`} className="group block">
                <div className="relative overflow-hidden aspect-[16/9] mb-6 rounded-lg">
                  <div className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: `url('${item.image}')` }} />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500" />
                </div>
                <p className="text-xs text-[#b88364] tracking-[0.2em] uppercase mb-2">Glamping</p>
                <h3 className="text-2xl font-serif mb-2">{item.name}</h3>
                <p className="text-sm text-white/60 mb-3">{item.capacity}</p>
                <p className="text-lg font-medium">
                  ${formatPrice(item.price)} <span className="text-sm text-white/50 font-normal">MXN / noche</span>
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Equipo */}
      <section id="equipo" className="py-32 bg-[#faf7f5]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-20">
            <p className="text-[#b88364] tracking-[0.3em] uppercase text-sm mb-4">Aventura</p>
            <h2 className="font-serif text-5xl md:text-6xl text-[#1b4235] tracking-[-0.02em]">Renta de Equipo</h2>
          </div>

          {/* Motos */}
          <div className="mb-24">
            <div className="flex items-center gap-4 mb-10">
              <div className="h-px flex-1 bg-[#b88364]/20" />
              <h3 className="text-lg tracking-[0.3em] uppercase text-[#b88364]">Motos</h3>
              <div className="h-px flex-1 bg-[#b88364]/20" />
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {motos.map((item) => (
                <Link key={item.id} href={`/item/${item.slug}`} className="group flex gap-6 p-6 bg-white hover:bg-white hover:shadow-xl transition-all duration-500 rounded-lg border border-transparent hover:border-[#b88364]/20">
                  <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url('${item.image}')` }} />
                  <div className="flex flex-col justify-center">
                    <p className="text-xs text-[#b88364] tracking-[0.2em] uppercase mb-1">Moto</p>
                    <h4 className="text-xl font-serif text-[#1b4235] mb-1">{item.name}</h4>
                    <p className="text-sm text-[#5c3d2e] mb-2 line-clamp-2">{item.description}</p>
                    <p className="text-lg font-medium text-[#1b4235]">
                      ${formatPrice(item.price)} <span className="text-sm text-[#b88364] font-normal">MXN / día</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Bicis */}
          <div>
            <div className="flex items-center gap-4 mb-10">
              <div className="h-px flex-1 bg-[#b88364]/20" />
              <h3 className="text-lg tracking-[0.3em] uppercase text-[#b88364]">Bicicletas</h3>
              <div className="h-px flex-1 bg-[#b88364]/20" />
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {bikes.map((item) => (
                <Link key={item.id} href={`/item/${item.slug}`} className="group block p-6 bg-white hover:shadow-xl transition-all duration-500 rounded-lg border border-transparent hover:border-[#b88364]/20">
                  <div className="w-full h-48 rounded-lg overflow-hidden mb-4 bg-cover bg-center" style={{ backgroundImage: `url('${item.image}')` }} />
                  <p className="text-xs text-[#b88364] tracking-[0.2em] uppercase mb-1">Bicicleta</p>
                  <h4 className="text-lg font-serif text-[#1b4235] mb-1">{item.name}</h4>
                  <p className="text-sm text-[#5c3d2e] mb-2 line-clamp-2">{item.description}</p>
                  <p className="text-base font-medium text-[#1b4235]">
                    ${formatPrice(item.price)} <span className="text-sm text-[#b88364] font-normal">MXN / día</span>
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section id="contacto" className="py-32 bg-[#1b4235] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('/img/paisaje.jpg')] bg-cover bg-center" />
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16">
            <div>
              <p className="text-[#b88364] tracking-[0.3em] uppercase text-sm mb-4">Contacto</p>
              <h2 className="font-serif text-5xl md:text-6xl tracking-[-0.02em] mb-12">Contáctanos</h2>
              <div className="space-y-8">
                <div>
                  <p className="text-xs tracking-[0.3em] uppercase text-[#b88364] mb-2">Teléfono</p>
                  <p className="text-xl font-light">+52 722 455 6628</p>
                </div>
                <div>
                  <p className="text-xs tracking-[0.3em] uppercase text-[#b88364] mb-2">Email</p>
                  <p className="text-xl font-light">hangar.cinco.mexico@gmail.com</p>
                </div>
                <div>
                  <p className="text-xs tracking-[0.3em] uppercase text-[#b88364] mb-2">Instagram</p>
                  <p className="text-xl font-light">@hangar5_mexico</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-end">
              <div className="border border-white/10 rounded-lg p-8">
                <p className="text-xs tracking-[0.3em] uppercase text-[#b88364] mb-4">Ubicación</p>
                <p className="text-2xl font-serif leading-relaxed mb-4">
                  El Peñón Temascaltepec
                </p>
                <p className="text-white/50 text-sm">
                  51305 El Peñón, Méx.<br />
                  A 2 horas de CDMX y 45 min de Toluca
                </p>
                <div className="mt-6 pt-6 border-t border-white/10">
                  <a href="https://maps.google.com/?q=El+Peñón+Temascaltepec+51305" target="_blank" rel="noopener"
                    className="inline-flex items-center gap-2 text-sm tracking-wider uppercase text-[#b88364] hover:text-white transition-colors">
                    Ver en Google Maps →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f2a20] text-white/30 py-12 text-center">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-xs tracking-[0.3em] uppercase mb-2">Hangar 5</p>
          <p className="text-xs">© {new Date().getFullYear()} · Todos los derechos reservados</p>
        </div>
      </footer>
    </main>
  );
}
