'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

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

function CartIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="17" cy="20" r="1.4" />
      <path d="M3 4h2l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h7.9a1.5 1.5 0 0 0 1.5-1.2L20 8H6" />
    </svg>
  );
}

export default function RestaurantePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch('/api/menu');
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

  // Al volver de una ficha, restaurar el punto exacto del menú donde estabas
  useEffect(() => {
    if (loading) return;
    const saved = sessionStorage.getItem('h5-menu-scroll');
    if (saved) {
      sessionStorage.removeItem('h5-menu-scroll');
      const y = parseInt(saved, 10);
      // Esperar a que las imágenes acomoden el layout antes de saltar
      setTimeout(() => window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior }), 250);
    }
  }, [loading]);

  if (loading) {
    return (
      <main className="min-h-screen bg-night flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gold border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-muted tracking-wide">Cargando menú...</p>
        </div>
      </main>
    );
  }

  if (categories.length === 0) {
    return (
      <main className="min-h-screen bg-night">
        <section className="min-h-screen flex items-center justify-center px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <p className="kicker mb-6">Cocina de Montaña</p>
            <h1 className="display text-6xl md:text-7xl mb-4">
              Hangar <em>5</em>
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
            <Link href="/" className="font-[family-name:var(--font-display)] text-lg tracking-[0.08em] text-cream no-underline">
              HANGAR <span className="text-snow-2 not-italic">N°5</span>
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
                    activeCategory === idx
                      ? 'text-gold'
                      : 'text-muted hover:text-cream'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            <Link href="/" className="text-[11px] tracking-[0.22em] uppercase text-faint hover:text-gold transition-colors">
              Inicio
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section — pantalla de cine */}
      <section className="relative w-full h-[70vh] overflow-hidden flex items-end">
        <img
          src="/img/hero-bg.jpg?v=3"
          alt=""
          className="absolute inset-0 w-full h-full object-cover foto-fondo"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-night via-night/35 to-night/55" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-[12vh]">
          <div className="flex items-center gap-3.5 kicker mb-6">
            <span className="w-11 h-px bg-gold inline-block" />
            Cocina de Montaña · El Peñón
          </div>
          <h1 className="display text-[clamp(44px,7vw,96px)]">
            <span className="line-reveal"><span>Sabores artesanales</span></span>
            <span className="line-reveal d1"><span>al pie del <em>Peñón.</em></span></span>
          </h1>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mt-10">
            <p className="text-sm md:text-[15px] text-muted max-w-md leading-relaxed">
              Hangar 5 — Cocina de Montaña. Ingredientes locales, fuego lento y la mejor vista de Temascaltepec.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/pedir" className="btn-gold inline-flex items-center gap-2.5">
                <CartIcon />
                Pedir online
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Sections — cada categoría es una escena */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        {categories.map((category, catIdx) => (
          <section
            key={category.id}
            id={`category-${category.id}`}
            className="mb-28 scroll-mt-32"
          >
            {/* Encabezado de la categoría */}
            <div className="mb-14">
              <h2 className="display text-4xl md:text-5xl">
                {category.name}
              </h2>
              <span className="block w-14 h-px bg-line mt-6" />
            </div>

            {/* Items Grid */}
            {category.menuItems && category.menuItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.menuItems.map((item) => {
                  const hasImageError = imageErrors.has(item.id);
                  const hasImage = item.imageUrl && !hasImageError;
                  const conFicha = !!(item.hasStory && item.slug);

                  return (
                    <div
                      key={item.id}
                      onClick={() => { if (conFicha) { sessionStorage.setItem('h5-menu-scroll', String(window.scrollY)); window.location.href = `/carta/${item.slug}?from=menu`; } }}
                      role={conFicha ? "link" : undefined}
                      className={`group flex flex-col card-night overflow-hidden hover:border-gold-dim/50 transition-all duration-500 ${conFicha ? 'cursor-pointer' : ''}`}
                    >
                      {/* Image Container */}
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

                      {/* Content */}
                      <div className="flex-1 p-6 flex flex-col">
                        {/* Name & Description */}
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

                        {/* Variants Pills */}
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
                            {item.variants.length > 2 && (
                              <span className="inline-block px-3 py-1 border border-gold-dim/40 text-gold text-[10px] tracking-[0.12em] uppercase rounded-full">
                                +{item.variants.length - 2} más
                              </span>
                            )}
                          </div>
                        )}

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* Price */}
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

      {/* CTA Section */}
      <section className="py-24 px-6 bg-night-2 border-t border-line">
        <div className="max-w-3xl mx-auto text-center">
          <p className="kicker mb-6">En tu mesa</p>
          <h2 className="display text-4xl md:text-5xl mb-6">
            Realiza tu <em>orden</em>
          </h2>
          <p className="text-[15px] text-muted mb-10 font-light leading-relaxed max-w-xl mx-auto">
            Escanea el código QR en tu mesa para acceder al menú interactivo y realizar tu pedido en tiempo real.
          </p>
          <div className="w-48 h-48 mx-auto card-night p-6">
            <div className="w-full h-full bg-night-3 rounded-lg flex items-center justify-center">
              <span className="text-faint text-[11px] tracking-[0.25em] uppercase font-light">Código QR</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-line bg-night text-center">
        <div className="max-w-7xl mx-auto">
          <p className="font-[family-name:var(--font-display)] text-lg mb-3">
            Hangar <span className="italic text-gold">5</span> — El Peñón, Temascaltepec
          </p>
          <p className="text-xs text-faint font-light tracking-wide">
            © {new Date().getFullYear()} Todos los derechos reservados
          </p>
        </div>
      </footer>
    </main>
  );
}
