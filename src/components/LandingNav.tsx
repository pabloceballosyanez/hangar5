'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const landingLinks = [
  { href: '#restaurante', label: 'Restaurante' },
  { href: '#actividades', label: 'Actividades' },
  { href: '#renta', label: 'Renta' },
  { href: '#cabanas', label: 'Cabañas' },
  { href: '#glampings', label: 'Glampings' },
  { href: '#contacto', label: 'Contacto' },
];

const pageLinks = [
  { href: '/comunidad', label: 'Comunidad' },
];

export default function LandingNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === '/';

  const anchorHref = (hash: string) => (isHome ? hash : `/${hash}`);

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-gradient-to-b from-[rgba(11,11,11,0.85)] to-transparent">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          {/* Izquierda: navegación */}
          <div className="flex items-center gap-8">
            <div className="hidden md:flex items-center gap-8">
              {landingLinks.map(l => (
                <a
                  key={l.href}
                  href={anchorHref(l.href)}
                  className="text-[11px] tracking-[0.22em] uppercase text-[rgba(244,244,244,0.75)] hover:text-gold transition-colors no-underline"
                >
                  {l.label}
                </a>
              ))}
            </div>
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden flex flex-col gap-1.5 w-6 h-5 justify-center"
              aria-label="Menú"
            >
              <span className={`block h-[1.5px] bg-cream transition-all duration-300 ${open ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block h-[1.5px] bg-cream transition-all duration-300 ${open ? 'opacity-0' : ''}`} />
              <span className={`block h-[1.5px] bg-cream transition-all duration-300 ${open ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>

          {/* Derecha: logo + acciones */}
          <div className="flex items-center gap-6">
            {pageLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="hidden md:block text-[11px] tracking-[0.22em] uppercase text-[rgba(244,244,244,0.75)] hover:text-gold transition-colors no-underline"
              >
                {l.label}
              </Link>
            ))}
            <a href={anchorHref('#cabanas')} className="hidden md:inline-block btn-outline !py-2.5 !px-5">
              Reservar
            </a>
            {/* El logo, en la esquina superior derecha */}
            <Link href="/" aria-label="Hangar 5 — inicio" className="no-underline shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/img/logo.png"
                alt="Hangar 5"
                width={72}
                height={72}
                className="h-14 w-auto md:h-16 opacity-95 transition-opacity hover:opacity-100"
              />
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-night/97 backdrop-blur-lg" onClick={() => setOpen(false)} />
          <div className="relative z-10 flex flex-col items-center justify-center h-full gap-8">
            {landingLinks.map(l => (
              <a
                key={l.href}
                href={anchorHref(l.href)}
                onClick={() => setOpen(false)}
                className="font-[family-name:var(--font-display)] text-cream text-3xl font-light tracking-[0.08em] hover:text-gold transition-colors no-underline"
              >
                {l.label}
              </a>
            ))}
            {pageLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="font-[family-name:var(--font-display)] text-cream text-3xl font-light tracking-[0.08em] hover:text-gold transition-colors no-underline"
              >
                {l.label}
              </Link>
            ))}
            <a
              href={anchorHref('#cabanas')}
              onClick={() => setOpen(false)}
              className="btn-gold mt-4"
            >
              Reservar
            </a>
          </div>
        </div>
      )}
    </>
  );
}
