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
    <main className="min-h-screen bg-night text-cream">
      <LandingNav />

      {/* ============ HERO — pantalla de cine ============ */}
      <section className="relative h-screen flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center kenburns"
            style={{ backgroundImage: "url('/img/hero-bg.jpg?v=3')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-night via-night/35 to-night/55" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-[14vh]">
          <div className="flex items-center gap-3.5 kicker mb-6">
            <span className="w-11 h-px bg-gold inline-block" />
            Un refugio de montaña · Temascaltepec
          </div>
          <h1 className="display text-[clamp(44px,7.5vw,110px)] max-w-4xl">
            <span className="line-reveal"><span>Hay un lugar</span></span>
            <span className="line-reveal d1"><span>donde el bosque</span></span>
            <span className="line-reveal d2"><span>te <em>devuelve el aliento.</em></span></span>
          </h1>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mt-10">
            <p className="text-sm md:text-[15px] text-muted max-w-md leading-relaxed">
              Cabañas, glampings y vuelo libre a 2,800 metros.
              A dos horas de la ciudad, otro ritmo te espera.
            </p>
            <div className="flex items-center gap-4">
              <a href="#cabanas" className="btn-gold">Reservar estancia</a>
              <a href="#cabanas" className="btn-outline">Explorar</a>
            </div>
          </div>
        </div>
      </section>

      {/* ============ Restaurante ============ */}
      <section id="restaurante" className="py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="display text-5xl md:text-6xl">El sabor <em>del refugio</em></h2>
            <span className="block w-14 h-px bg-line mt-6" />
          </div>
          <div className="grid md:grid-cols-2 gap-14 items-center">
            <div>
              <p className="kicker mb-4">Gastronomía</p>
              <h3 className="display text-4xl md:text-5xl mb-6">Humo, leña<br />y <em>huerta</em></h3>
              <p className="text-muted leading-relaxed mb-8 max-w-md">
                Cocina artesanal con vistas a la montaña. Menú fresco con ingredientes
                locales, preparado con dedicación — desde entradas hasta postres,
                en el corazón de El Peñón.
              </p>
              <Link href="/restaurante" className="btn-gold">Explorar menú</Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { src: "/img/menu/galeria/pizza-champinones/01.jpg", alt: "Pizza de champiñones recién horneada" },
                { src: "/img/menu/galeria/hamburguesa-de-wagyu/01.jpg", alt: "Hamburguesa de wagyu" },
                { src: "/img/menu/galeria/pizza-champinones/03.jpg", alt: "Pizza en el horno de piedra" },
                { src: "/img/menu/galeria/hamburguesa-de-wagyu/02.jpg", alt: "Cebolla caramelizada en la plancha" },
              ].map((img) => (
                <div key={img.src} className="group aspect-square rounded-md overflow-hidden">
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover foto"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ Actividades ============ */}
      <section id="actividades" className="py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="display text-5xl md:text-6xl">El aire <em>te llama</em></h2>
            <span className="block w-14 h-px bg-line mt-6" />
          </div>

          {/* Vuelos */}
          <div className="mb-20">
            <div className="flex items-center gap-4 mb-10">
              <div className="h-px flex-1 bg-line" />
              <h3 className="text-[13px] tracking-[0.3em] uppercase text-gold">Vuelos</h3>
              <div className="h-px flex-1 bg-line" />
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {parapentes.map((item) => (
                <Link key={item.id} href={`/item/${item.slug}`} className="group block">
                  <div className="relative overflow-hidden rounded-md aspect-[4/5]">
                    <div
                      className="absolute inset-0 bg-cover bg-center foto group-hover:scale-105 group-hover:saturate-100 transition-all duration-700"
                      style={{ backgroundImage: `url('${item.image}')` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-night/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                      <span className="btn-outline !border-cream/40 !text-cream backdrop-blur-sm">Reservar vuelo</span>
                    </div>
                  </div>
                  <p className="text-[11px] tracking-[0.2em] uppercase text-gold mt-4 mb-1.5">{getTypeLabel(item.type)}</p>
                  <h3 className="font-[family-name:var(--font-display)] text-xl mb-1.5">{item.name}</h3>
                  <p className="text-sm text-muted line-clamp-2 mb-2">{item.description}</p>
                  <p className="font-[family-name:var(--font-display)] text-lg text-gold">
                    ${formatPrice(item.price)} <span className="font-[family-name:var(--font-sans)] text-xs text-faint">MXN / persona</span>
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* Hikes */}
          {hikes.length > 0 && (
            <div>
              <div className="flex items-center gap-4 mb-10">
                <div className="h-px flex-1 bg-line" />
                <h3 className="text-[13px] tracking-[0.3em] uppercase text-gold">Senderismo</h3>
                <div className="h-px flex-1 bg-line" />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {hikes.map((item) => (
                  <Link key={item.id} href={`/item/${item.slug}`} className="group flex gap-6 p-5 card-night hover:border-gold-dim/50 transition-all duration-500">
                    <div
                      className="w-32 h-32 flex-shrink-0 rounded-md bg-cover bg-center foto transition-all"
                      style={{ backgroundImage: `url('${item.image}')` }}
                    />
                    <div className="flex flex-col justify-center">
                      <p className="text-[11px] tracking-[0.2em] uppercase text-gold mb-1">Caminata</p>
                      <h4 className="font-[family-name:var(--font-display)] text-xl mb-1">{item.name}</h4>
                      <p className="text-sm text-muted line-clamp-2 mb-2">{item.description}</p>
                      <p className="font-[family-name:var(--font-display)] text-base text-gold">
                        ${formatPrice(item.price)} <span className="font-[family-name:var(--font-sans)] text-xs text-faint">MXN / persona</span>
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ============ Renta de equipo ============ */}
      <section id="renta" className="py-28 bg-night-2">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="display text-5xl md:text-6xl">A tu <em>propio ritmo</em></h2>
            <span className="block w-14 h-px bg-line mt-6" />
          </div>

          {/* Motos */}
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-10">
              <div className="h-px flex-1 bg-line" />
              <h3 className="text-[13px] tracking-[0.3em] uppercase text-gold">Motos</h3>
              <div className="h-px flex-1 bg-line" />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {motos.map((item) => (
                <Link key={item.id} href={`/item/${item.slug}`} className="group flex gap-6 p-5 card-night hover:border-gold-dim/50 transition-all duration-500">
                  <div
                    className="w-32 h-32 flex-shrink-0 rounded-md bg-cover bg-center foto transition-all"
                    style={{ backgroundImage: `url('${item.image}')` }}
                  />
                  <div className="flex flex-col justify-center">
                    <p className="text-[11px] tracking-[0.2em] uppercase text-gold mb-1">Moto</p>
                    <h4 className="font-[family-name:var(--font-display)] text-xl mb-1">{item.name}</h4>
                    <p className="text-sm text-muted line-clamp-2 mb-2">{item.description}</p>
                    <p className="font-[family-name:var(--font-display)] text-base text-gold">
                      ${formatPrice(item.price)} <span className="font-[family-name:var(--font-sans)] text-xs text-faint">MXN / día</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Bicis */}
          <div>
            <div className="flex items-center gap-4 mb-10">
              <div className="h-px flex-1 bg-line" />
              <h3 className="text-[13px] tracking-[0.3em] uppercase text-gold">Bicicletas</h3>
              <div className="h-px flex-1 bg-line" />
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {bikes.map((item) => (
                <Link key={item.id} href={`/item/${item.slug}`} className="group block p-5 card-night hover:border-gold-dim/50 transition-all duration-500">
                  <div
                    className="w-full h-44 rounded-md mb-4 bg-cover bg-center foto transition-all"
                    style={{ backgroundImage: `url('${item.image}')` }}
                  />
                  <p className="text-[11px] tracking-[0.2em] uppercase text-gold mb-1">Bicicleta</p>
                  <h4 className="font-[family-name:var(--font-display)] text-lg mb-1">{item.name}</h4>
                  <p className="text-sm text-muted line-clamp-2 mb-2">{item.description}</p>
                  <p className="font-[family-name:var(--font-display)] text-base text-gold">
                    ${formatPrice(item.price)} <span className="font-[family-name:var(--font-sans)] text-xs text-faint">MXN / día</span>
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ Cabañas ============ */}
      <section id="cabanas" className="py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="display text-5xl md:text-6xl">Dormir <em>entre pinos</em></h2>
            <span className="block w-14 h-px bg-line mt-6" />
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {cabanas.map((item) => (
              <Link key={item.id} href={`/item/${item.slug}`} className="group block">
                <div className="relative overflow-hidden rounded-md">
                  <div
                    className="aspect-[3/4] bg-cover bg-center foto"
                    style={{ backgroundImage: `url('${item.image}')` }}
                  />
                </div>
                <div className="flex justify-between items-baseline mt-4">
                  <div>
                    <h3 className="font-[family-name:var(--font-display)] text-[22px]">{item.name}</h3>
                    <p className="text-[11px] tracking-[0.18em] uppercase text-faint mt-1.5">{item.capacity}</p>
                  </div>
                  <p className="font-[family-name:var(--font-display)] text-lg text-gold whitespace-nowrap">
                    ${formatPrice(item.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Glampings ============ */}
      <section id="glampings" className="py-28 bg-night-2">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="display text-5xl md:text-6xl">Bajo <em>las estrellas</em></h2>
            <span className="block w-14 h-px bg-line mt-6" />
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {glampings.map((item) => (
              <Link key={item.id} href={`/item/${item.slug}`} className="group block">
                <div className="relative overflow-hidden rounded-md">
                  <div
                    className="aspect-video bg-cover bg-center foto group-hover:scale-105 group-hover:saturate-100 transition-all duration-700"
                    style={{ backgroundImage: `url('${item.image}')` }}
                  />
                  <div className="absolute bottom-3 right-3.5 text-[10.5px] tracking-[0.14em] text-cream/85 bg-night/60 backdrop-blur-md px-2.5 py-1 rounded tabular-nums">
                    Desde ${formatPrice(item.price)} MXN
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-[11px] tracking-[0.2em] uppercase text-gold mb-1.5">Glamping</p>
                  <h3 className="font-[family-name:var(--font-display)] text-2xl mb-1">{item.name}</h3>
                  <p className="text-sm text-muted">{item.capacity}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Contacto (créditos) ============ */}
      <section id="contacto" className="py-28 bg-night-2 relative overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="display text-5xl md:text-6xl">Créditos <em>finales</em></h2>
            <span className="block w-14 h-px bg-line mt-6" />
          </div>
          <div className="grid md:grid-cols-2 gap-14">
            <div className="space-y-9">
              <div>
                <p className="kicker mb-2">Teléfono</p>
                <p className="font-[family-name:var(--font-display)] text-2xl font-light">+52 722 455 6628</p>
              </div>
              <div>
                <p className="kicker mb-2">Email</p>
                <p className="font-[family-name:var(--font-display)] text-2xl font-light">hangar.cinco.mexico@gmail.com</p>
              </div>
              <div>
                <p className="kicker mb-2">Instagram</p>
                <p className="font-[family-name:var(--font-display)] text-2xl font-light">@hangar5_mexico</p>
              </div>
            </div>
            <div className="flex flex-col justify-end">
              <div className="card-night p-8">
                <p className="kicker mb-4">Ubicación</p>
                <p className="font-[family-name:var(--font-display)] text-2xl leading-relaxed mb-3">
                  El Peñón, Temascaltepec
                </p>
                <p className="text-muted text-sm leading-relaxed">
                  51305 El Peñón, Méx.<br />
                  A 2 horas de CDMX y 45 min de Toluca
                </p>
                <div className="mt-6 pt-6 border-t border-line">
                  <a
                    href="https://maps.app.goo.gl/Bcb1xeE3wwr4w2xv8"
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-2 text-[12px] tracking-[0.18em] uppercase text-gold hover:text-cream transition-colors no-underline"
                  >
                    Ver en Google Maps
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 text-center">
        <p className="font-[family-name:var(--font-display)] text-lg tracking-[0.08em] text-cream mb-1">
          HANGAR <span className="text-gold">N°5</span>
        </p>
        <p className="text-[11px] tracking-[0.24em] uppercase text-faint">
          © {new Date().getFullYear()} · El Peñón, Temascaltepec
        </p>
      </footer>
    </main>
  );
}
