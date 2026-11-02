'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/* Menú del admin, agrupado por para qué sirve cada cosa.
 *
 * Antes eran 17 opciones en una lista plana, mezclando lo que el
 * personal usa todo el día con lo que se configura una vez al mes. Para
 * llegar a "Órdenes" había que pasar por 8 entradas de configuración.
 *
 * Los cuatro grupos cuentan una historia:
 *   · Operación      → lo que se usa a diario (siempre visible)
 *   · Menú           → lo que se vende y cómo
 *   · Configuración  → lo que se ajusta de vez en cuando
 *   · Análisis       → números para decidir
 *
 * Inventario vive en Operación porque contar y comprar es del día a día;
 * dar de alta insumos, que es configuración, está ahí mismo como
 * pestaña, para no tener dos entradas parecidas.
 */
const sidebarGroups = [
  {
    titulo: 'Operación',
    links: [
      { href: '/admin/restaurant/orders', label: 'Órdenes', icon: '📦' },
      { href: '/solo', label: 'Modo Solo', icon: '🔥' },
      { href: '/kds', label: 'KDS Cocina', icon: '👨‍🍳' },
      { href: '/admin/restaurant/customers', label: 'Clientes', icon: '👥' },
      { href: '/admin/restaurant/ingredients', label: 'Inventario', icon: '🧂' },
    ],
  },
  {
    titulo: 'Menú y productos',
    links: [
      { href: '/admin/restaurant/menu-items', label: 'Menú', icon: '📋' },
      { href: '/admin/restaurant/categories', label: 'Categorías', icon: '📂' },
      { href: '/admin/restaurant/tipos', label: 'Tipos', icon: '🏷️' },
      { href: '/admin/restaurant/modifier-groups', label: 'Modificadores', icon: '🔧' },
    ],
  },
  {
    titulo: 'Configuración',
    links: [
      { href: '/admin/restaurant/ubicaciones', label: 'Ubicaciones', icon: '📍' },
      { href: '/admin/restaurant/tables', label: 'Mesas', icon: '🪑' },
      { href: '/admin/restaurant/recipes', label: 'Recetas', icon: '📖' },
      { href: '/admin/restaurant/staff', label: 'Staff', icon: '👤' },
    ],
  },
  {
    titulo: 'Análisis',
    links: [
      { href: '/admin/restaurant/reports', label: 'Reportes', icon: '📊' },
      { href: '/admin/restaurant/fixed-expenses', label: 'Gastos Fijos', icon: '💰' },
      { href: '/admin/restaurant/audit', label: 'Auditoría', icon: '🔍' },
    ],
  },
];


/* Renderiza los grupos del menú. Se usa igual en la barra de escritorio
 * y en el cajón del móvil, para que no se desincronicen. */
function MenuAgrupado({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {sidebarGroups.map((grupo) => (
        <div key={grupo.titulo} className="mb-4">
          <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            {grupo.titulo}
          </p>
          <div className="space-y-0.5">
            {grupo.links.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onNavigate}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span className="text-base w-5 text-center">{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 h-14 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Abrir menú"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link
              href="/admin/restaurant"
              className="text-xl font-bold text-gray-900 hover:text-gray-600 transition-colors"
            >
              🍽️ Restaurante
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors hidden sm:block"
            >
              ← Admin
            </Link>
            <a
              href="/waiter/login"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm bg-[#b88364] text-white px-3 py-1.5 rounded-lg hover:bg-[#a07550] transition-colors font-medium"
            >
              📱 Mesero
            </a>
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* ===== DESKTOP SIDEBAR ===== */}
        <aside className="hidden md:block w-56 shrink-0 border-r border-gray-200 bg-white min-h-[calc(100vh-3.5rem)]">
          <nav className="p-3 overflow-y-auto max-h-[calc(100vh-3.5rem)]">
            <MenuAgrupado pathname={pathname} />
          </nav>
        </aside>

        {/* ===== MOBILE DRAWER OVERLAY ===== */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Drawer */}
            <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl animate-slide-in-left">
              {/* Drawer header */}
              <div className="flex items-center justify-between px-4 h-14 border-b border-gray-200">
                <span className="text-lg font-bold text-gray-900">🍽️ Restaurante</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 -mr-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label="Cerrar menú"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              {/* Drawer links */}
              <nav className="p-3 overflow-y-auto max-h-[calc(100vh-3.5rem)]">
                <MenuAgrupado
                  pathname={pathname}
                  onNavigate={() => setMobileMenuOpen(false)}
                />

                {/* Divider + back to admin */}
                <div className="border-t border-gray-200 my-2" />
                <Link
                  href="/admin"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
                >
                  <span className="text-lg">←</span>
                  Volver al admin
                </Link>
              </nav>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">{children}</main>
      </div>

      {/* Animation keyframes injected as global style */}
      <style jsx global>{`
        @keyframes slide-in-left {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.2s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}
