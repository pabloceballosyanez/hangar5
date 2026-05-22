'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const sidebarLinks = [
  { href: '/admin/restaurant/categories', label: 'Categorías' },
  { href: '/admin/restaurant/menu-items', label: 'Menú' },
  { href: '/admin/restaurant/tables', label: 'Mesas' },
  { href: '/admin/restaurant/orders', label: 'Órdenes' },
  { href: '/admin/restaurant/reports', label: 'Reportes' },
  { href: '/admin/restaurant/staff', label: 'Staff' },
];

export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 h-14 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/restaurant"
              className="text-xl font-bold text-gray-900 hover:text-gray-600 transition-colors"
            >
              🍽️ Restaurante
            </Link>
          </div>
          <Link
            href="/admin"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Volver al admin
          </Link>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar */}
        <aside className="hidden md:block w-56 shrink-0 border-r border-gray-200 bg-white min-h-[calc(100vh-3.5rem)]">
          <nav className="p-3 space-y-1">
            {sidebarLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile nav */}
        <nav className="md:hidden w-full overflow-x-auto border-b border-gray-200 bg-white">
          <div className="flex gap-1 p-2">
            {sidebarLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
