'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

/**
 * El Café del Despegue — menú público.
 *
 * Pablo: "tenemos una seccion en la pagina web donde mostramos el menu de
 * forma mas extensiva, pero no esta separando las ubicaciones y eso es
 * crucial. Por lo tanto debemos tener una para el despegue tambien".
 *
 * Es la misma estructura que /restaurante, pero pide el menú de la
 * ubicación "cafe". Solo aparecen los productos marcados para el Despegue
 * en Admin → Ubicaciones, así que la gente ve lo que de verdad hay ahí.
 *
 * El Despegue no tiene mesas: es barra, se pide y se recoge. Por eso el
 * cierre invita a pasar al mostrador en vez de escanear un QR.
 */

interface MenuItemVariant {
  id: string;
  name: string;
  priceDelta: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  imageUrl?: string;
  variants: MenuItemVariant[];
  slug?: string;
  hasStory?: boolean;
}

interface Category {
  id: string;
  name: string;
  menuItems: MenuItem[];
  sortOrder: number;
}

function formatPrice(cents: number) {
  const pesos = Math.round(cents / 100);
  return pesos.toString();
}

export default function DespeguePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        /* Solo lo del Despegue. Antes esto traía todo el menú del
           restaurante, que aquí no se vende. */
        const response = await fetch('/api/menu?lugar=cafe');
        if (!response.ok) throw new Error('Failed to fetch menu');
        const data = await response.json();
        setCategories(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching menu:', error);
        setLoading(false);
        setCategories([]);
      }
    };

    fetchMenu();
  }, []);

  const handleImageError = (itemId: string) => {
    setImageErrors(prev => new Set([...prev, itemId]));
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-night flex items-center justify-center">
        <p className="kicker">Cargando…</p>
      </main>
    );
  }

  if (categories.length === 0) {
    return (
      <main className="min-h-screen bg-night">
        <section className="min-h-screen flex items-center justify-center px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <p className="kicker mb-6">Barra de café</p>
            <h1 className="display text-6xl md:text-7xl mb-4">
              El <em>Despegue</em>
            </h1>
            <p className="text-lg text-muted font-light tracking-wide mb-10">
              El menú está siendo actualizado. Por favor, intenta de nuevo más tarde.
            </p>
            <Link href="/" className="btn-gold">
              Volver al inicio
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-night text-cream">
      {/* Navigation Sticky */}
      <nav className="fixed top-0 w-full z-40 bg-night/85 backdrop-blur-md border-b border-line">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" aria-label="Hangar 5 — inicio" className="no-underline shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/img/logo.png"
                alt="Hangar 5"
                width={64}
                height={64}
                className="h-11 w-auto opacity-95 transition-opacity hover:opacity-100"
              />
            </Link>
            <div className="hidden md:flex gap-2 overflow-x-auto pb-0 flex-wrap justify-center flex-1 mx-8">
              {categories.map((cat, idx) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(idx);
                    document.getElementById(`category-${cat.id}`)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`px-4 py-2 text-[11px] font-medium tracking-[0.18em] uppercase whitespace-nowrap transition-all duration-300 rounded-full ${
                    activeCategory === idx ? 'text-gold' : 'text-muted hover:text-cream'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            <Link
              href="/restaurante"
              className="text-[11px] tracking-[0.22em] uppercase text-faint hover:text-gold transition-colors"
            >
              Restaurante
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative w-full h-[62vh] overflow-hidden flex items-end">
        <img
          src="/img/hero-bg.jpg?v=3"
          alt=""
          className="absolute inset-0 w-full h-full object-cover foto-fondo"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-night via-night/35 to-night/55" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-[10vh]">
          <div className="flex items-center gap-3.5 kicker mb-6">
            <span className="w-11 h-px bg-gold inline-block" />
            Café de altura · El Peñón
          </div>
          <h1 className="display text-[clamp(44px,7vw,96px)]">
            <span className="line-reveal"><span>El Despegue</span></span>
            <span className="line-reveal d1"><span>café y <em>barra.</em></span></span>
          </h1>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mt-10">
            <p className="text-sm md:text-[15px] text-muted max-w-md leading-relaxed">
              Café de la sierra, pan dulce y algo fresco para el camino. Pasa al mostrador, pide y te lo llevas.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/restaurante" className="btn-gold inline-flex items-center gap-2.5">
                Ver el restaurante
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Sections */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        {categories.map((category) => (
          <section
            key={category.id}
            id={`category-${category.id}`}
            className="mb-28 scroll-mt-32"
          >
            <div className="mb-14">
              <h2 className="display text-4xl md:text-5xl">{category.name}</h2>
              <span className="block w-14 h-px bg-line mt-6" />
            </div>

            {category.menuItems && category.menuItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.menuItems.map((item) => {
                  const hasImageError = imageErrors.has(item.id);
                  const hasImage = item.imageUrl && !hasImageError;
                  const conFicha = !!(item.hasStory && item.slug);

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (conFicha) {
                          sessionStorage.setItem('h5-menu-scroll', String(window.scrollY));
                          window.location.href = `/carta/${item.slug}?from=menu`;
                        }
                      }}
                      role={conFicha ? 'link' : undefined}
                      className={`group flex flex-col card-night overflow-hidden hover:border-gold-dim/50 transition-all duration-500 ${conFicha ? 'cursor-pointer' : ''}`}
                    >
                      <div className="relative w-full bg-night-3 aspect-[4/3] overflow-hidden">
                        {hasImage ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover foto group-hover:scale-105 group-hover:saturate-100 transition-all duration-700"
                            onError={() => handleImageError(item.id)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="display italic text-3xl text-gold-dim">H5</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 p-6 flex flex-col">
                        <div className="mb-4">
                          <h3 className="font-[family-name:var(--font-display)] text-xl mb-2 group-hover:text-gold transition-colors duration-300">
                            {item.name}
                          </h3>
                          {item.description && (
                            <p className="text-sm text-muted leading-relaxed line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {item.variants && item.variants.length > 0 && (
                          <div className="mb-4 flex flex-wrap gap-2">
                            {item.variants.slice(0, 2).map((variant) => (
                              <span
                                key={variant.id}
                                className="inline-block px-3 py-1 border border-gold-dim/40 text-gold text-[10px] tracking-[0.12em] uppercase rounded-full"
                              >
                                {variant.name}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex-1" />

                        <div className="pt-4 border-t border-line">
                          <div className="flex items-baseline justify-between">
                            <span className="font-[family-name:var(--font-display)] text-2xl text-gold">
                              ${formatPrice(item.basePrice)}
                            </span>
                            {conFicha ? (
                              <span className="accion text-[10px] tracking-[0.2em] uppercase group-hover:tracking-[0.3em] transition-all duration-300">
                                Su historia &rarr;
                              </span>
                            ) : (
                              <span className="text-[10px] text-faint tracking-[0.2em] uppercase">MXN</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-faint tracking-[0.2em] uppercase text-xs">
                  No hay items disponibles en esta categoría
                </p>
              </div>
            )}
          </section>
        ))}
      </div>

      {/* CTA */}
      <section className="py-24 px-6 bg-night-2 border-t border-line">
        <div className="max-w-3xl mx-auto text-center">
          <p className="kicker mb-6">En el mostrador</p>
          <h2 className="display text-4xl md:text-5xl mb-6">
            Pide y <em>llévatelo</em>
          </h2>
          <p className="text-[15px] text-muted mb-10 font-light leading-relaxed max-w-xl mx-auto">
            El Despegue es barra: pasas, pides y te lo llevas. Si quieres quedarte, el restaurante está a unos pasos.
          </p>
          <Link href="/restaurante" className="btn-gold inline-flex items-center gap-2.5">
            Ver la cocina
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-line bg-night text-center">
        <div className="max-w-7xl mx-auto">
          <p className="mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/img/logo.png"
              alt="Hangar 5 — El Peñón, Temascaltepec"
              width={96}
              height={96}
              className="h-16 w-auto mx-auto opacity-90"
            />
          </p>
          <p className="text-xs text-faint font-light tracking-wide">
            © {new Date().getFullYear()} Todos los derechos reservados
          </p>
        </div>
      </footer>
    </main>
  );
}
