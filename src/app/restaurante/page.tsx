'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Image from 'next/image';

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

interface RestaurantPageProps {}

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
      <main className="min-h-screen bg-gradient-to-b from-[#fefae0] to-[#f5e6d3] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c1663b] mx-auto mb-4"></div>
          <p className="text-[#6b6b6b]">Cargando menú...</p>
        </div>
      </main>
    );
  }

  if (categories.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#fefae0] to-[#f5e6d3]">
        <section className="pt-32 pb-24 px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-serif text-[#2d2d2d] mb-4">
              Hangar Cinco
            </h1>
            <h2 className="text-2xl md:text-3xl font-serif text-[#c1663b] italic mb-6">
              Cocina de Montaña
            </h2>
            <p className="text-lg text-[#6b6b6b] font-light tracking-wide mb-8">
              El menú está siendo actualizado. Por favor, intenta de nuevo más tarde.
            </p>
            <Link href="/" className="inline-block px-8 py-3 bg-[#c1663b] hover:bg-[#a8542e] text-white rounded-lg font-medium tracking-wider uppercase transition-all duration-300">
              Volver al inicio
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#fefae0] to-[#f5e6d3]">
      {/* Navigation Sticky */}
      <nav className="fixed top-0 w-full z-40 bg-white/80 backdrop-blur-md border-b border-stone-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-[#2d2d2d] font-serif text-lg tracking-wide">
              Hangar Cinco
            </Link>
            <div className="hidden md:flex gap-1 overflow-x-auto pb-0">
              {categories.map((cat, idx) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(idx);
                    document.getElementById(`category-${cat.id}`)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-4 py-2 text-sm font-medium tracking-wide rounded-lg transition-all duration-300 whitespace-nowrap"
                  style={{
                    color: activeCategory === idx ? '#c1663b' : '#6b6b6b',
                    backgroundColor: activeCategory === idx ? '#f5e6d3' : 'transparent',
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
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
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
        
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
          <h1 className="text-5xl md:text-7xl font-serif text-white mb-4 tracking-tight leading-tight">
            Hangar Cinco
          </h1>
          <p className="text-xl md:text-2xl font-serif text-[#ffd699] italic mb-2">
            Cocina de Montaña
          </p>
          <p className="text-lg text-white/90 font-light tracking-wide max-w-2xl">
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
              <h2 className="text-4xl md:text-5xl font-serif text-[#2d2d2d] tracking-tight mb-6 text-center">
                {category.name}
              </h2>
              <div className="h-px w-24 bg-gradient-to-r from-[#c1663b] to-[#d4a853] mx-auto" />
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
                      className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-lg shadow-stone-200/50 transition-all duration-300 hover:shadow-xl hover:shadow-stone-200/70 hover:-translate-y-1"
                    >
                      {/* Image Container */}
                      <div className="relative w-full bg-gradient-to-b from-[#f5e6d3] to-[#e8d9c6] aspect-[4/3] overflow-hidden">
                        {hasImage ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={() => handleImageError(item.id)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-6xl mb-2">🍽️</div>
                              <p className="text-sm text-[#6b6b6b]">Imagen no disponible</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-6 flex flex-col">
                        {/* Name & Description */}
                        <div className="mb-4">
                          <h3 className="text-xl font-serif text-[#2d2d2d] mb-2 group-hover:text-[#c1663b] transition-colors duration-300">
                            {item.name}
                          </h3>
                          {item.description && (
                            <p className="text-sm text-[#6b6b6b] leading-relaxed line-clamp-2">
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
                                className="inline-block px-3 py-1 bg-[#f5e6d3] text-[#c1663b] text-xs font-medium rounded-full"
                              >
                                {variant.name}
                              </span>
                            ))}
                            {item.variants.length > 2 && (
                              <span className="inline-block px-3 py-1 bg-[#f5e6d3] text-[#c1663b] text-xs font-medium rounded-full">
                                +{item.variants.length - 2} más
                              </span>
                            )}
                          </div>
                        )}

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* Price */}
                        <div className="pt-4 border-t border-stone-200/50">
                          <div className="flex items-baseline justify-between">
                            <span className="text-3xl font-serif text-[#d4a853]">
                              ${formatPrice(item.basePrice)}
                            </span>
                            <span className="text-xs text-[#6b6b6b] tracking-wider">MXN</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-[#6b6b6b] tracking-widest uppercase text-sm">
                  No hay items disponibles en esta categoría
                </p>
              </div>
            )}
          </section>
        ))}
      </div>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-white/50 backdrop-blur-sm border-t border-stone-200/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-serif text-[#2d2d2d] mb-6">
            Realiza tu Orden
          </h2>
          <p className="text-lg text-[#6b6b6b] mb-8 font-light tracking-wide">
            Escanea el código QR en tu mesa para acceder al menú interactivo y realizar tu pedido en tiempo real.
          </p>
          <div className="w-48 h-48 mx-auto rounded-2xl p-6 bg-white shadow-lg shadow-stone-200/50 border border-stone-200/50">
            <div className="w-full h-full bg-gradient-to-br from-[#f5e6d3] to-[#e8d9c6] rounded-xl flex items-center justify-center">
              <span className="text-[#6b6b6b] text-sm tracking-wider font-light">QR Code</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-stone-200/50 bg-gradient-to-b from-[#fefae0]/50 to-transparent text-center">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm text-[#2d2d2d] tracking-wide mb-4 font-serif">
            Hangar Cinco — El Peñón, Temascaltepec
          </p>
          <p className="text-xs text-[#6b6b6b] font-light">
            © {new Date().getFullYear()} Todos los derechos reservados
          </p>
        </div>
      </footer>
    </main>
  );
}
