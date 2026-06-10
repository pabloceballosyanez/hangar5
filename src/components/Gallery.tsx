"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";

interface GalleryProps {
  images: string[];
}

export default function Gallery({ images }: GalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [current, setCurrent] = useState(0);

  const open = (index: number) => {
    setCurrent(index);
    setIsOpen(true);
  };

  const close = () => setIsOpen(false);

  const prev = useCallback(() => {
    setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));
  }, [images.length]);

  const next = useCallback(() => {
    setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, prev, next]);

  return (
    <>
      {/* Main image */}
      <div
        className="relative aspect-[4/5] rounded-lg overflow-hidden shadow-lg cursor-pointer group"
        onClick={() => open(0)}
      >
        <Image
          src={images[0]}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 text-white text-sm tracking-widest uppercase bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full transition-opacity duration-300">
            Ver galería →
          </span>
        </div>
      </div>

      {/* Thumbnails */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        {[1, 2, 3].map((offset) => {
          const idx = offset < images.length ? offset : 0;
          return (
            <div
              key={offset}
              className="relative aspect-square rounded overflow-hidden opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
              onClick={() => open(idx)}
            >
              <Image
                src={images[idx]}
                alt=""
                fill
                className="object-cover"
                sizes="128px"
              />
            </div>
          );
        })}
      </div>

      {/* Lightbox */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={close}
        >
          {/* Close button */}
          <button
            onClick={close}
            className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors z-10"
            aria-label="Cerrar"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Counter */}
          <div className="absolute top-6 left-6 text-white/40 text-sm tracking-wider">
            {current + 1} / {images.length}
          </div>

          {/* Prev */}
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 md:left-8 text-white/40 hover:text-white transition-colors"
            aria-label="Anterior"
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Lightbox image */}
          <div
            className="relative max-w-[90vw] max-h-[85vh] w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[current]}
              alt=""
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>

          {/* Next */}
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 md:right-8 text-white/40 hover:text-white transition-colors"
            aria-label="Siguiente"
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Thumbnail strip at bottom */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                className={`relative w-16 h-12 rounded flex-shrink-0 overflow-hidden border-2 transition-all ${
                  i === current
                    ? "border-white opacity-100"
                    : "border-transparent opacity-40 hover:opacity-70"
                }`}
              >
                <Image
                  src={img}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
