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

  if (loading) {
    return (
      <main className="min-h-screen bg-[#faf7f5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#b88364] mx-auto mb-4" />
          <p className="text-[#5c3d2e]">Cargando menú...</p>
        </div>
      </main>
    );
  }

  if (categories.length === 0) {
    return (
      <main className="min-h-screen bg-[#faf7f5]">
        <section className="pt-32 pb-24 px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-serif text-[#1b4235] mb-4 tracking-[-0.02em] leading-[0.85]">
              Hangar <span className="italic">5</span>
            </h1>
            <h2 className="text-2xl md:text-3xl font-serif text-[#b88364] italic mb-6">
              Cocina de Montaña
            </h2>
            <p className="text-lg text-[#5c3d2e] font-light tracking-wide mb-8">
              El menú está siendo actualizado. Por favor, intenta de nuevo más tarde.
            </p>
            <Link href="/" className="inline-block px-8 py-3 bg-[#b88364] hover:bg-[#a07550] text-white rounded-lg font-semibold tracking-widest uppercase transition-all duration-300">
              Volver al inicio
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf7f5]">
      {/* Navigation Sticky */}
      <nav className="fixed top-0 w-full z-40 bg-[#faf7f5]/90 backdrop-blur-sm border-b border-[#b88364]/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-lg font-semibold tracking-[0.3em] uppercase text-[#1b4235]">
              Hangar 5
            </Link>
            <div className="hidden md:flex gap-2 overflow-x-auto pb-0 flex-wrap justify-center flex-1 mx-8">
              {categories.map((cat, idx) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(idx);
                    document.getElementById(`category-${cat.id}`)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-4 py-2 text-xs font-medium tracking-[0.15em] uppercase whitespace-nowrap transition-all duration-300 rounded-lg"
                  style={{
                    color: activeCategory === idx ? '#b88364' : '#5c3d2e',
                    backgroundColor: activeCategory === idx ? '#b88364/10' : 'transparent',
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            <Link href="/" className="text-xs tracking-[0.2em] uppercase text-[#5c3d2e] hover:text-[#b88364] transition-colors">
              Inicio
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative w-full h-[60vh] md:h-[60vh] overflow-hidden pt-16">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://source.unsplash.com/1600x900/?mountain,sunset,adventure)',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
        
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
          <h1 className="text-5xl md:text-7xl font-serif text-white mb-4 tracking-[-0.02em] leading-[0.85]">
            Hangar <span className="italic">5</span>
          </h1>
          <p className="text-xl md:text-2xl font-serif text-white/80 italic mb-2">
            Cocina de Montaña
          </p>
          <p className="text-lg text-white/70 font-light tracking-wider max-w-2xl">
            Sabores artesanales al pie del Peñón
          </p>
        </div>
      </section>

      {/* Menu Sections */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        {categories.map((category, catIdx) => (
          <section
            key={category.id}
            id={`category-${category.id}`}
            className="mb-32 scroll-mt-32"
          >
            {/* Category Header */}
            <div className="mb-16">
              <p className="text-[#b88364] tracking-[0.3em] uppercase text-sm mb-4 text-center">Menú</p>
              <h2 className="text-4xl md:text-5xl font-serif text-[#1b4235] tracking-tight mb-6 text-center">
                {category.name}
              </h2>
              <div className="h-px w-24 bg-[#b88364]/30 mx-auto" />
            </div>

            {/* Items Grid */}
            {category.menuItems && category.menuItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {category.menuItems.map((item) => {
                  const hasImageError = imageErrors.has(item.id);
                  const hasImage = item.imageUrl && !hasImageError;

                  return (
                    <div
                      key={item.id}
                      className="group flex flex-col bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-[#b88364]/10 hover:border-[#b88364]/30"
                    >
                      {/* Image Container */}
                      <div className="relative w-full bg-[#f5f2ef] aspect-[4/3] overflow-hidden">
                        {hasImage ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={() => handleImageError(item.id)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center text-[#a07550]">
                              <div className="text-4xl mb-2">-</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-6 flex flex-col">
                        {/* Name & Description */}
                        <div className="mb-4">
                          <h3 className="text-lg font-serif text-[#1b4235] mb-2 group-hover:text-[#b88364] transition-colors duration-300">
                            {item.name}
                          </h3>
                          {item.description && (
                            <p className="text-sm text-[#5c3d2e]/70 leading-relaxed line-clamp-2">
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
                                className="inline-block px-3 py-1 bg-[#b88364]/10 text-[#b88364] text-xs font-medium rounded-full"
                              >
                                {variant.name}
                              </span>
                            ))}
                            {item.variants.length > 2 && (
                              <span className="inline-block px-3 py-1 bg-[#b88364]/10 text-[#b88364] text-xs font-medium rounded-full">
                                +{item.variants.length - 2} más
                              </span>
                            )}
                          </div>
                        )}

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* Price */}
                        <div className="pt-4 border-t border-[#b88364]/10">
                          <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-serif text-[#b88364]">
                              ${formatPrice(item.basePrice)}
                            </span>
                            <span className="text-xs text-[#5c3d2e]/60 tracking-wider uppercase">MXN</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-[#5c3d2e]/60 tracking-widest uppercase text-sm">
                  No hay items disponibles en esta categoría
                </p>
              </div>
            )}
          </section>
        ))}
      </div>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-[#f5f2ef] border-t border-[#b88364]/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-serif text-[#1b4235] mb-6">
            Realiza tu Orden
          </h2>
          <p className="text-lg text-[#5c3d2e] mb-8 font-light tracking-wide">
            Escanea el código QR en tu mesa para acceder al menú interactivo y realizar tu pedido en tiempo real.
          </p>
          <div className="w-48 h-48 mx-auto rounded-lg p-6 bg-white shadow-sm border border-[#b88364]/10">
            <div className="w-full h-full bg-[#f5f2ef] rounded-lg flex items-center justify-center">
              <span className="text-[#a07550] text-sm tracking-wider font-light">QR Code</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-[#b88364]/10 bg-[#faf7f5] text-center">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm text-[#1b4235] tracking-wide mb-4 font-serif">
            Hangar 5 — El Peñón, Temascaltepec
          </p>
          <p className="text-xs text-[#5c3d2e]/60 font-light">
            © {new Date().getFullYear()} Todos los derechos reservados
          </p>
        </div>
      </footer>
    </main>
  );
}
