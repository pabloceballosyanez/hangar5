'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const sidebarLinks = [
  { href: '/admin/restaurant/categories', label: 'Categorías', icon: '📂' },
  { href: '/admin/restaurant/menu-items', label: 'Menú', icon: '📋' },
  { href: '/admin/restaurant/sessions', label: 'Tabs', icon: '🧾' },
  { href: '/admin/restaurant/customers', label: 'Clientes', icon: '👥' },
  { href: '/admin/restaurant/orders', label: 'Órdenes', icon: '📦' },
  { href: '/kds', label: 'KDS Cocina', icon: '👨‍🍳' },
  { href: '/admin/restaurant/reports', label: 'Reportes', icon: '📊' },
  { href: '/admin/restaurant/staff', label: 'Staff', icon: '👤' },
];

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
          <nav className="p-3 space-y-1">
            {sidebarLinks.map((link) => {
              const isActive = pathname.startsWith(link.href) || (link.href === '/admin/restaurant' && pathname === '/admin/restaurant');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="text-base">{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
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
              <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-3.5rem)]">
                {sidebarLinks.map((link) => {
                  const isActive = pathname.startsWith(link.href) || (link.href === '/admin/restaurant' && pathname === '/admin/restaurant');
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span className="text-lg">{link.icon}</span>
                      {link.label}
                    </Link>
                  );
                })}

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
      `}</style>
    </div>
  );
}
