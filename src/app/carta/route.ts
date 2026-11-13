import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify, tieneHistoria } from "@/lib/carta-historias";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type CatConItems = Prisma.CategoryGetPayload<{
  include: { menuItems: { include: { variants: true } } };
}>;
type ItemConVariantes = CatConItems["menuItems"][number];
type Variante = ItemConVariantes["variants"][number];

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function mxn(cents: number) {
  return (cents / 100).toLocaleString("es-MX", { maximumFractionDigits: 0 });
}

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { isActive: true, menuItems: { some: { isActive: true } } },
    include: {
      menuItems: {
        where: { isActive: true },
        include: { variants: true },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  const sections = categories
    .map((cat: CatConItems) => {
      const items = cat.menuItems
        .map((item: ItemConVariantes) => {
          const variants = item.variants
            .map(
              (v: Variante) => `
        <div class="item variant">
          <span class="name">${esc(v.name)}</span><span class="leader"></span><span class="price">${v.priceDelta >= 0 ? "+" : "−"}${mxn(Math.abs(v.priceDelta))}</span>
        </div>`
            )
            .join("");
          const fila = `<span class="name">${esc(item.name)}</span><span class="leader"></span><span class="price">${mxn(item.basePrice)}</span>`;
          const conHistoria = tieneHistoria(item.name);
          return conHistoria
            ? `
        <a class="item" href="/carta/${slugify(item.name)}">${fila}</a>${variants}`
            : `
        <div class="item">${fila}</div>${variants}`;
        })
        .join("");
      return `
      <section class="cat">
        <h3>${esc(cat.name)}</h3>${items}
      </section>`;
    })
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Hangar 5 — Carta</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;700;800&family=Inter:wght@300;400;500&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root {
    --ink: #17150F; --accent: #9A7434; --hair: #DDD8CC;
    --dot: #B5AE9E; --faint: #98917F;
  }
  /* ===== Hoja CARTA 8.5 x 11 in — optimizada para impresion ===== */
  @page { size: letter portrait; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html {
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
    background: #FFFFFF;
  }
  body {
    font-family: 'Inter', sans-serif;
    background: #FFFFFF; color: var(--ink);
    font-size: 9pt; line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }
  /* Ancho util completo de la hoja (antes 7in: dejaba 1.5in de aire) */
  .page {
    width: 8.5in; min-height: 11in;
    padding: 0.36in 0.42in 0.30in;
    margin: 0 auto;
    display: flex; flex-direction: column;
  }

  /* Encabezado expedición */
  .coords {
    display: flex; justify-content: space-between;
    font-family: 'IBM Plex Mono', monospace; font-size: 6.4pt;
    letter-spacing: 0.12em; color: var(--faint); text-transform: uppercase;
  }
  h1 {
    font-family: 'Archivo', sans-serif; font-weight: 800;
    font-size: 40pt; letter-spacing: -0.025em; margin-top: 7pt; line-height: 0.95;
  }
  .sub {
    font-size: 7pt; letter-spacing: 0.3em; text-transform: uppercase;
    font-weight: 600; color: var(--accent); margin-top: 6pt;
  }
  /* ===== PORTADA =====
     La foto del hero va de fondo, a todo el ancho, con el tratamiento de
     puntos que le da el SVG. El logo en blanco flota encima del cielo,
     que es la zona limpia de la foto.

     Antes la foto iba en una franja de 0.56in y salía truncada. Ahora la
     banda mide lo que necesita la portada y la foto se recorta sola. */
  .portada {
    position: relative;
    margin: -0.36in -0.42in 0;   /* sangra hasta el borde de la hoja */
    padding: 0 0.42in 6pt;
    overflow: hidden;
  }
  .portada-foto {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    object-fit: cover; object-position: center 32%;
    filter: grayscale(1) contrast(1.3) brightness(0.85);
  }

  /* Rejilla de puntos: puntos opacos separados por huecos transparentes.
     Al pasar sobre la foto, la deja ver solo a través de los puntos, que
     es exactamente el efecto de grabado. */
  .portada-puntos {
    position: absolute; inset: 0;
    background-image: radial-gradient(circle at center,
      rgba(255,255,255,0.92) 0.9px, transparent 1.1px);
    background-size: 4.5px 4.5px;
    mix-blend-mode: overlay;
    opacity: 0.85;
  }

  /* Velo: oscurece arriba y abajo, deja respirar el centro. Sin esto el
     logo blanco se pierde contra el cielo claro. */
  .portada-velo {
    position: absolute; inset: 0;
    background: linear-gradient(180deg,
      rgba(8,8,8,0.62) 0%,
      rgba(8,8,8,0.18) 45%,
      rgba(8,8,8,0.55) 100%);
  }
  .portada-contenido {
    position: relative;
    padding: 0.30in 0 0.34in;
  }
  /* Sobre la foto, las coordenadas van en claro */
  .portada .coords { color: rgba(255,255,255,0.72); }

  .marca { margin-top: 10pt; }
  .marca img { display: block; width: 2.15in; height: auto; }

  .portada .sub { color: #E8C77E; }

  .fig {
    position: relative;
    font-family: 'IBM Plex Mono', monospace; font-size: 6.4pt;
    letter-spacing: 0.14em; text-transform: uppercase;
    color: rgba(255,255,255,0.55);
    padding-top: 4pt;
  }

  /* Emblema con alto FIJO: no crece con la hoja */
  /* El logo reemplaza al texto "Hangar 5". Se controla por ancho, no por
     altura, para que la marca quede del tamaño correcto sin deformarse. */
  .marca { margin-top: 8pt; }
  .marca img { display: block; width: 2.05in; height: auto; }

  /* La foto del hero en lugar del dibujo de puntos. Misma altura que el
     emblema anterior para que la retícula de abajo no se mueva.
     En gris para que imprima bien y no pelee con la tipografía. */
  .emblem { margin-top: 10pt; overflow: hidden; }
  .emblem img {
    display: block; width: 100%; height: 1.05in;
    object-fit: cover; object-position: center 55%;
    filter: grayscale(1) contrast(1.08);
  }
  .fig {
    font-family: 'IBM Plex Mono', monospace; font-size: 6.6pt;
    letter-spacing: 0.14em; text-transform: uppercase; color: var(--faint); margin-top: 5pt;
  }
  .rule { height: 1px; background: var(--hair); margin-top: 9pt; }

  /* Cuerpo: 3 columnas para llenar la hoja */
  .cols {
    column-count: 3; column-gap: 20pt;
    column-fill: balance;
    margin-top: 4pt; flex: 1;
  }
  .cat { break-inside: avoid; margin-top: 9pt; }
  .cat:first-child { margin-top: 10pt; }
  .cat h3 {
    font-family: 'IBM Plex Mono', monospace; font-weight: 500; font-size: 8.6pt;
    letter-spacing: 0.2em; text-transform: uppercase; color: var(--accent);
    border-bottom: 1px solid var(--hair); padding-bottom: 3.5pt; margin-bottom: 3pt;
  }
  /* Renglones: mas altos = mas legibles en papel */
  .item { display: flex; align-items: baseline; gap: 5pt; padding: 2.4pt 0; text-decoration: none; color: inherit; border-radius: 2pt; }
  a.item:hover { background: #F6F3EA; }
  a.item:hover .name { color: var(--accent); }
  a.item::after { content: "→"; font-size: 6.5pt; color: var(--accent); opacity: 0; margin-left: 2pt; transition: opacity .15s; }
  a.item:hover::after { opacity: 1; }
  .item .name { font-weight: 300; font-size: 9pt; }
  .item .leader { flex: 1; border-bottom: 1px dotted var(--dot); transform: translateY(-2pt); }
  .item .price {
    font-family: 'IBM Plex Mono', monospace; font-weight: 500;
    font-size: 9pt; font-variant-numeric: tabular-nums; white-space: nowrap;
  }
  .item .price::before { content: "$"; font-size: 85%; margin-right: 1pt; color: var(--faint); }
  .item.variant .name { font-size: 8pt; color: var(--faint); padding-left: 8pt; }
  .item.variant .price { font-size: 8pt; color: var(--faint); font-weight: 400; }

  .foot {
    margin-top: 10pt; padding-top: 6pt; border-top: 1px solid var(--hair);
    display: flex; justify-content: space-between;
    font-family: 'IBM Plex Mono', monospace; font-size: 6.8pt;
    letter-spacing: 0.14em; text-transform: uppercase; color: var(--faint);
  }

  /* Elementos solo-pantalla */
  .print-btn {
    position: fixed; bottom: 22px; right: 22px; z-index: 10;
    font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
    background: var(--ink); color: #FFFFFF; border: none; border-radius: 999px;
    padding: 12px 22px; cursor: pointer;
  }
  .print-btn:hover { opacity: 0.85; }

  @media print {
    /* El tamano ya esta afinado para la hoja: no se re-escala al imprimir */
    .print-btn, .hint-screen { display: none !important; }
    a.item::after { display: none !important; }
  }
</style>
</head>
<body>
<button class="print-btn" onclick="window.print()">Imprimir</button>
<div class="page">
  <!-- Encabezado: la foto del hero como banda de fondo con efecto de
       grabado, y el logo encima. Antes la foto iba en una franja aparte
       y quedaba truncada; ahora respira a todo el ancho y el logo flota
       sobre el cielo. -->
  <header class="portada">
    <!-- La foto del hero y, encima, una rejilla de puntos. El puntillismo
         se consigue con la máscara CSS, no con una imagen procesada: pesa
         nada y el navegador lo compone al vuelo. -->
    <img class="portada-foto" src="/img/hero-bg.jpg" alt="El Pe&ntilde;&oacute;n de Temascaltepec">
    <div class="portada-puntos"></div>
    <div class="portada-velo"></div>
    <div class="portada-contenido">
      <div class="coords"><span>N 19.18&deg; &middot; W 99.97&deg;</span><span>ALT 2,800 M</span></div>
      <div class="marca"><img src="/img/logo-claro-512.png" alt="Hangar 5"></div>
      <div class="sub">Restaurante de monta&ntilde;a</div>
    </div>
    <div class="fig">Fig. 01 &mdash; El Pe&ntilde;&oacute;n &middot; Temascaltepec</div>
  </header>

  <div class="cols">${sections}
  </div>

  <footer class="foot">
    <span>Precios en MXN &middot; IVA incluido</span>
    <span class="hint-screen">Toca un platillo para conocer su historia</span>
    <span>Hangar 5 &middot; El Pe&ntilde;&oacute;n, Temascaltepec</span>
  </footer>
</div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
