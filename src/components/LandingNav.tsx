'use client';

import { useState } from 'react';
import Link from 'next/link';

const links = [
  { href: '#cabanas', label: 'Cabañas' },
  { href: '#glampings', label: 'Glampings' },
  { href: '#actividades', label: 'Actividades' },
  { href: '#renta', label: 'Renta' },
  { href: '#restaurante', label: 'Restaurante' },
  { href: '#contacto', label: 'Contacto' },
];

export default function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 w-full z-50 mix-blend-difference text-white">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <Link href="/" className="text-lg font-semibold tracking-[0.3em] uppercase">
            Hangar 5
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex gap-10 text-xs tracking-[0.2em] uppercase">
            {links.map(l => (
              <a key={l.href} href={l.href} className="hover:opacity-70 transition-opacity">
                {l.label}
              </a>
            ))}
          </div>

          {/* Right side: hamburger (mobile) + admin */}
          <div className="flex items-center gap-6">
            {/* Hamburger — visible only on mobile */}
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden flex flex-col gap-1.5 w-6 h-5 justify-center group"
              aria-label="Menú"
            >
              <span className={`block h-0.5 bg-white transition-all duration-300 ${open ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block h-0.5 bg-white transition-all duration-300 ${open ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 bg-white transition-all duration-300 ${open ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
            <Link href="/admin" className="text-xs tracking-[0.2em] uppercase opacity-50 hover:opacity-100 transition-opacity">
              Admin
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-lg" onClick={() => setOpen(false)} />
          <div className="relative z-10 flex flex-col items-center justify-center h-full gap-8">
            {links.map(l => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-white text-2xl font-light tracking-[0.2em] uppercase hover:opacity-70 transition-opacity"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
