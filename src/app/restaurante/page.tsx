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
  variants: MenuItemVariant[];
}

interface Category {
  id: string;
  name: string;
  menuItems: MenuItem[];
  sortOrder: number;
}

interface RestaurantPageProps {}

const EMOJI_MAP: Record<string, string> = {
  'Entradas': '🥘',
  'Platos Principales': '🍗',
  'Bebidas': '🥤',
  'Postres': '🍰',
  'Aperitivos': '🍽️',
  'Sopas': '🍲',
  'Ensaladas': '🥗',
  'Carnes': '🥩',
  'Pescados': '🐟',
  'Mariscos': '🦐',
  'Cócteles': '🍹',
  'Vinos': '🍷',
  'Cervezas': '🍺',
  'Agua Fresca': '💧',
  'Café': '☕',
  'Pasteles': '🎂',
  'Frutas': '🍎',
  'Helados': '🍦',
};

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function getEmojiForCategory(name: string): string {
  return EMOJI_MAP[name] || '🍽️';
}

export default function RestaurantePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(0);

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
        // Fallback a datos vacíos si hay error
        setCategories([]);
      }
    };

    fetchMenu();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4"></div>
          <p className="text-white/70">Cargando menú...</p>
        </div>
      </main>
    );
  }

  if (categories.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <nav className="fixed top-0 w-full z-40 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-white font-semibold tracking-widest uppercase text-sm">
                Hangar 5
              </Link>
            </div>
          </div>
        </nav>

        <section className="pt-32 pb-24 px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-6xl md:text-7xl font-serif text-white mb-4">
              Hangar Cinco
              <br />
              <span className="italic text-amber-400">Restaurante</span>
            </h1>
            <p className="text-lg text-white/70 font-light tracking-wide mb-8">
              El menú está siendo actualizado. Por favor, intenta de nuevo más tarde.
            </p>
            <Link href="/" className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 text-white rounded-lg font-medium tracking-wider uppercase transition-all duration-300">
              Volver al inicio
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Nav Sticky */}
      <nav className="fixed top-0 w-full z-40 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-white font-semibold tracking-widest uppercase text-sm">
              Hangar 5
            </Link>
            <div className="hidden md:flex gap-2 overflow-x-auto">
              {categories.map((cat, idx) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(idx);
                    document.getElementById(`category-${cat.id}`)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-4 py-2 text-sm font-medium tracking-wider uppercase rounded-lg transition-all duration-300 whitespace-nowrap"
                  style={{
                    color: activeCategory === idx ? '#fbbf24' : 'rgba(255,255,255,0.6)',
                    backgroundColor: activeCategory === idx ? 'rgba(251,191,36,0.1)' : 'transparent',
                    borderColor: activeCategory === idx ? 'rgba(251,191,36,0.3)' : 'transparent',
                    borderWidth: '1px'
                  }}
                >
                  {getEmojiForCategory(cat.name)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="text-6xl md:text-7xl font-serif text-white mb-4 tracking-tight leading-[1.1]">
            Hangar Cinco
            <br />
            <span className="italic text-amber-400">Restaurante</span>
          </h1>
          <p className="text-lg md:text-xl text-white/70 font-light tracking-wide max-w-xl mx-auto mb-8">
            Cocina artesanal con vistas a la montaña
          </p>
          <div className="flex justify-center gap-4">
            <a href="#menu" className="px-6 py-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 rounded-lg font-medium tracking-wider uppercase transition-all duration-300">
              Explorar Menú
            </a>
            <a href="/" className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 text-white rounded-lg font-medium tracking-wider uppercase transition-all duration-300">
              Volver
            </a>
          </div>
        </div>
      </section>

      {/* Menu Sections */}
      <div id="menu" className="max-w-7xl mx-auto px-6 pb-32">
        {categories.map((category, catIdx) => (
          <section
            key={category.id}
            id={`category-${category.id}`}
            className="mb-24 scroll-mt-24"
          >
            {/* Category Header */}
            <div className="mb-16">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
                <div className="text-center">
                  <h2 className="text-4xl md:text-5xl font-serif text-white mb-2 tracking-tight">
                    {getEmojiForCategory(category.name)} {category.name}
                  </h2>
                </div>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent via-amber-500/30 to-transparent" />
              </div>
            </div>

            {/* Items Grid */}
            {category.menuItems && category.menuItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {category.menuItems.map((item) => (
                  <div
                    key={item.id}
                    className="group rounded-xl p-6 transition-all duration-500"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderImage: 'linear-gradient(135deg, rgba(251,191,36,0.3), rgba(255,255,255,0.1))',
                      borderImageSlice: 1
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                      e.currentTarget.style.borderColor = 'rgba(251,191,36,0.4)';
                      e.currentTarget.style.boxShadow = '0 8px 32px rgba(251,191,36,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div className="mb-4">
                      <h3 className="text-xl font-serif text-white mb-2 group-hover:text-amber-300 transition-colors duration-300">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-white/60 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Price & Variants */}
                    <div className="pt-4 border-t border-white/10">
                      <div className="flex items-baseline justify-between mb-4">
                        <span className="text-2xl font-semibold text-amber-400">
                          ${formatPrice(item.basePrice)}
                        </span>
                        <span className="text-xs text-white/40 tracking-widest uppercase">
                          MXN
                        </span>
                      </div>

                      {/* Variants */}
                      {item.variants && item.variants.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-white/50 tracking-widest uppercase font-medium mb-3">
                            Variantes
                          </p>
                          <div className="space-y-2">
                            {item.variants.map((variant) => (
                              <div
                                key={variant.id}
                                className="flex justify-between items-center text-sm p-2 rounded transition-colors hover:bg-white/5"
                              >
                                <span className="text-white/80">{variant.name}</span>
                                {variant.priceDelta !== 0 && (
                                  <span className="text-amber-300 text-xs font-medium">
                                    {variant.priceDelta > 0 ? '+' : ''} ${formatPrice(variant.priceDelta)}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-white/50 tracking-widest uppercase text-sm">
                  No hay items disponibles en esta categoría
                </p>
              </div>
            )}
          </section>
        ))}
      </div>

      {/* QR Section */}
      <section className="py-24 px-6 relative overflow-hidden border-t border-white/10">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-serif text-white mb-6">
            🍽️ Realiza tu Orden
          </h2>
          <p className="text-lg text-white/70 mb-8 font-light tracking-wide">
            Escanea el código QR en tu mesa para acceder al menú interactivo y realizar tu pedido en tiempo real.
          </p>
          <div
            className="w-48 h-48 mx-auto rounded-xl p-6 border border-white/20"
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div className="w-full h-full bg-white/10 rounded-lg flex items-center justify-center">
              <span className="text-white/50 text-sm tracking-wider">QR Code</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10 text-center">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm text-white/50 tracking-widest uppercase mb-4">
            Hangar Cinco — El Peñón, Temascaltepec
          </p>
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} Todos los derechos reservados
          </p>
        </div>
      </footer>
    </main>
  );
}
