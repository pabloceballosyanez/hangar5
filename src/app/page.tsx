import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getTypeLabel } from "@/lib/types";

export const dynamic = "force-dynamic";

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("es-MX");
}

import LandingNav from "@/components/LandingNav";

export default async function Home() {
  const featured = await prisma.item.findMany({ where: { featured: true, active: true } });
  const cabanas = await prisma.item.findMany({ where: { type: "cabana", active: true } });
  const glampings = await prisma.item.findMany({ where: { type: "glamping", active: true } });
  const activities = await prisma.item.findMany({ where: { type: { in: ["parapente", "aladelta", "hike"] }, active: true } });
  const bikes = await prisma.item.findMany({ where: { type: "bici", active: true } });
  const motos = await prisma.item.findMany({ where: { type: "moto", active: true } });
  const parapentes = activities.filter(a => a.type === "parapente" || a.type === "aladelta");
  const hikes = activities.filter(a => a.type === "hike");

  return (
    <main className="min-h-screen bg-[#faf7f5]">
      <LandingNav />

      {/* Hero */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <Image src="/img/hero-bg.jpg" alt="" fill className="object-cover" priority sizes="100vw" />
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
            {cabanas.map((item) => (
              <Link key={item.id} href={`/item/${item.slug}`} className="group block">
                <div className="relative overflow-hidden aspect-[3/4] mb-6">
                  <Image src={item.image!} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" />
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
                  <Image src={item.image!} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" />
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

      {/* Actividades */}
      <section id="actividades" className="py-32 bg-[#faf7f5]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-20">
            <p className="text-[#b88364] tracking-[0.3em] uppercase text-sm mb-4">Experiencias</p>
            <h2 className="font-serif text-5xl md:text-6xl text-[#1b4235] tracking-[-0.02em]">Actividades</h2>
          </div>

          {/* Vuelos */}
          <div className="mb-24">
            <div className="flex items-center gap-4 mb-10">
              <div className="h-px flex-1 bg-[#b88364]/20" />
              <h3 className="text-lg tracking-[0.3em] uppercase text-[#b88364]">Vuelos</h3>
              <div className="h-px flex-1 bg-[#b88364]/20" />
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {parapentes.map((item) => (
                <Link key={item.id} href={`/item/${item.slug}`} className="group block">
                  <div className="relative overflow-hidden aspect-[4/5] mb-6 rounded-lg">
                    <Image src={item.image!} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                      <span className="text-white text-sm tracking-widest uppercase bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                        Reservar →
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[#b88364] tracking-[0.2em] uppercase mb-2">{getTypeLabel(item.type)}</p>
                  <h3 className="text-xl font-serif text-[#1b4235] mb-2">{item.name}</h3>
                  <p className="text-sm text-[#5c3d2e] mb-3 line-clamp-2">{item.description}</p>
                  <p className="text-lg font-medium text-[#1b4235]">
                    ${formatPrice(item.price)} <span className="text-sm text-[#b88364] font-normal">MXN / persona</span>
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* Hikes */}
          {hikes.length > 0 && (
            <div>
              <div className="flex items-center gap-4 mb-10">
                <div className="h-px flex-1 bg-[#b88364]/20" />
                <h3 className="text-lg tracking-[0.3em] uppercase text-[#b88364]">Senderismo</h3>
                <div className="h-px flex-1 bg-[#b88364]/20" />
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                {hikes.map((item) => (
                  <Link key={item.id} href={`/item/${item.slug}`} className="group flex gap-6 p-6 bg-white hover:shadow-xl transition-all duration-500 rounded-lg border border-transparent hover:border-[#b88364]/20">
                    <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden relative">
                      <Image src={item.image!} alt={item.name} fill className="object-cover" sizes="128px" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <p className="text-xs text-[#b88364] tracking-[0.2em] uppercase mb-1">Hike</p>
                      <h4 className="text-xl font-serif text-[#1b4235] mb-1">{item.name}</h4>
                      <p className="text-sm text-[#5c3d2e] mb-2 line-clamp-2">{item.description}</p>
                      <p className="text-lg font-medium text-[#1b4235]">
                        ${formatPrice(item.price)} <span className="text-sm text-[#b88364] font-normal">MXN / persona</span>
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Renta de Equipo */}
      <section id="renta" className="py-32 bg-[#1b4235] text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-20">
            <p className="text-[#b88364] tracking-[0.3em] uppercase text-sm mb-4">Aventura</p>
            <h2 className="font-serif text-5xl md:text-6xl tracking-[-0.02em]">Renta de Equipo</h2>
          </div>

          {/* Motos */}
          <div className="mb-24">
            <div className="flex items-center gap-4 mb-10">
              <div className="h-px flex-1 bg-white/10" />
              <h3 className="text-lg tracking-[0.3em] uppercase text-[#b88364]">Motos</h3>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {motos.map((item) => (
                <Link key={item.id} href={`/item/${item.slug}`} className="group flex gap-6 p-6 bg-white/5 hover:bg-white/10 transition-all duration-500 rounded-lg border border-white/10 hover:border-[#b88364]/30">
                  <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden relative">
                    <Image src={item.image!} alt={item.name} fill className="object-cover" sizes="128px" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-xs text-[#b88364] tracking-[0.2em] uppercase mb-1">Moto</p>
                    <h4 className="text-xl font-serif mb-1">{item.name}</h4>
                    <p className="text-sm text-white/60 mb-2 line-clamp-2">{item.description}</p>
                    <p className="text-lg font-medium">
                      ${formatPrice(item.price)} <span className="text-sm text-white/50 font-normal">MXN / día</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Bicis */}
          <div>
            <div className="flex items-center gap-4 mb-10">
              <div className="h-px flex-1 bg-white/10" />
              <h3 className="text-lg tracking-[0.3em] uppercase text-[#b88364]">Bicicletas</h3>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {bikes.map((item) => (
                <Link key={item.id} href={`/item/${item.slug}`} className="group block p-6 bg-white/5 hover:bg-white/10 transition-all duration-500 rounded-lg border border-white/10 hover:border-[#b88364]/30">
                  <div className="w-full h-48 rounded-lg overflow-hidden mb-4 relative">
                    <Image src={item.image!} alt={item.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                  </div>
                  <p className="text-xs text-[#b88364] tracking-[0.2em] uppercase mb-1">Bicicleta</p>
                  <h4 className="text-lg font-serif mb-1">{item.name}</h4>
                  <p className="text-sm text-white/60 mb-2 line-clamp-2">{item.description}</p>
                  <p className="text-base font-medium">
                    ${formatPrice(item.price)} <span className="text-sm text-white/50 font-normal">MXN / día</span>
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Restaurante */}
      <section id="restaurante" className="py-32 bg-gradient-to-b from-[#faf7f5] to-[#f5f2ef]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Contenido */}
            <div>
              <p className="text-[#b88364] tracking-[0.3em] uppercase text-sm mb-4">Gastronomía</p>
              <h2 className="font-serif text-5xl md:text-6xl text-[#1b4235] tracking-[-0.02em] mb-6">
                Nuestro Restaurante
              </h2>
              <p className="text-lg text-[#5c3d2e] leading-relaxed mb-8">
                Cocina artesanal con vistas a la montaña. Menú fresco con ingredientes locales, preparado con dedicación. Desde entradas hasta postres, una experiencia culinaria completa en el corazón de El Peñón.
              </p>
              <Link
                href="/restaurante"
                className="inline-flex items-center gap-3 px-8 py-4 bg-[#b88364] hover:bg-[#a07550] text-white rounded-lg text-sm tracking-widest uppercase transition-all duration-300 font-semibold"
              >
                Explorar Menú
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>

            {/* Imágenes del menú */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="aspect-square rounded-lg overflow-hidden relative">
                  <Image src="https://images.unsplash.com/photo-1574071318508-1cdbab80d002" alt="Pizza artesanal" fill className="object-cover hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 50vw, 25vw" />
                </div>
                <div className="aspect-square rounded-lg overflow-hidden relative">
                  <Image src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd" alt="Ensalada fresca" fill className="object-cover hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 50vw, 25vw" />
                </div>
                <div className="aspect-square rounded-lg overflow-hidden relative">
                  <Image src="https://images.unsplash.com/photo-1599789197514-47270cd526b4" alt="Chilaquiles" fill className="object-cover hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 50vw, 25vw" />
                </div>
                <div className="aspect-square rounded-lg overflow-hidden relative">
                  <Image src="https://images.unsplash.com/photo-1676105797000-323c37de780c" alt="Mojito" fill className="object-cover hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 50vw, 25vw" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section id="contacto" className="py-32 bg-[#faf7f5] text-[#1b4235] relative overflow-hidden">
        <Image src="/img/paisaje.jpg" alt="" fill className="object-cover opacity-5" sizes="100vw" />
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
              <div className="border border-[#1b4235]/10 rounded-lg p-8 bg-white/50 backdrop-blur-sm">
                <p className="text-xs tracking-[0.3em] uppercase text-[#b88364] mb-4">Ubicación</p>
                <p className="text-2xl font-serif leading-relaxed mb-4">
                  El Peñón Temascaltepec
                </p>
                <p className="text-[#5c3d2e]/60 text-sm">
                  51305 El Peñón, Méx.<br />
                  A 2 horas de CDMX y 45 min de Toluca
                </p>
                <div className="mt-6 pt-6 border-t border-[#1b4235]/10">
                  <a href="https://maps.google.com/?q=El+Peñón+Temascaltepec+51305" target="_blank" rel="noopener"
                    className="inline-flex items-center gap-2 text-sm tracking-wider uppercase text-[#b88364] hover:text-[#1b4235] transition-colors">
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
