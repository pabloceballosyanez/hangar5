'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const FASES = [
  { num: 1, title: 'Electrónica', slug: 'fase-1-electronica' },
  { num: 2, title: 'Prototipo', slug: 'fase-2-prototipo' },
  { num: 3, title: 'Programación', slug: 'fase-3-programacion' },
  { num: 4, title: 'Montaje', slug: 'fase-4-impermeabilizacion' },
  { num: 5, title: 'Instalación', slug: 'fase-5-instalacion' },
  { num: 6, title: 'Monitoreo', slug: 'fase-6-monitoreo' },
];

export default function CursoNav({ fase }: { fase: number }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-[#1b4235]/95 backdrop-blur-sm text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/comunidad" className="text-sm tracking-[0.2em] uppercase hover:opacity-70 transition-opacity">
            ← Comunidad
          </Link>

          {/* Desktop: indicador de fases */}
          <div className="hidden md:flex items-center gap-1">
            {FASES.map((f, i) => (
              <span key={f.slug}>
                <Link
                  href={`/comunidad/${f.slug}`}
                  className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-xs font-medium transition-all ${
                    f.num === fase
                      ? 'bg-[#b88364] text-white'
                      : 'bg-white/10 text-white/50 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  {f.num}
                </Link>
                {i < FASES.length - 1 && (
                  <span className="inline-block w-4 h-px bg-white/20 mx-1 align-middle" />
                )}
              </span>
            ))}
            <span className="ml-4 text-xs text-white/30 tracking-wider uppercase">
              Fase {fase} de 6
            </span>
          </div>

          {/* Mobile: botón de fases */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden text-xs tracking-[0.2em] uppercase opacity-70 hover:opacity-100"
          >
            Fase {fase} ▾
          </button>
        </div>
      </nav>

      {/* Mobile: dropdown de fases */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/90" onClick={() => setOpen(false)} />
          <div className="relative z-10 flex flex-col items-center justify-center h-full gap-4 px-6">
            <p className="text-[#b88364] text-xs tracking-[0.3em] uppercase mb-4">Ir a fase</p>
            {FASES.map((f) => (
              <Link
                key={f.slug}
                href={`/comunidad/${f.slug}`}
                onClick={() => setOpen(false)}
                className={`text-2xl font-light tracking-[0.1em] ${
                  f.num === fase ? 'text-[#b88364]' : 'text-white/60'
                } hover:text-white transition-colors`}
              >
                {f.num}. {f.title}
              </Link>
            ))}
            <Link
              href="/comunidad"
              onClick={() => setOpen(false)}
              className="text-white/30 text-sm mt-8 hover:text-white/60"
            >
              ← Volver al curso
            </Link>
          </div>
        </div>
      )}

      {/* Spacer para compensar el nav fijo */}
      <div className="h-16" />
    </>
  );
}
