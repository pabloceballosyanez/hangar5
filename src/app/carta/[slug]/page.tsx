import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getHistoria, slugify } from "@/lib/carta-historias";
import type { Prisma } from "@prisma/client";
import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

type ItemConVariantes = Prisma.MenuItemGetPayload<{ include: { variants: true } }>;

function mxn(cents: number) {
  return (cents / 100).toLocaleString("es-MX", { maximumFractionDigits: 0 });
}

/**
 * Fotos adicionales del platillo para la galeria de la ficha.
 * Convencion: public/img/menu/galeria/<slug-del-platillo>/01.jpg, 02.jpg...
 * Para agregar fotos solo hay que dejarlas caer en la carpeta — sin tocar codigo.
 */
function fotosGaleria(slug: string): string[] {
  const dir = path.join(process.cwd(), "public", "img", "menu", "galeria", slug);
  try {
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
      .sort()
      .map((f) => `/img/menu/galeria/${slug}/${f}`);
  } catch {
    return [];
  }
}


export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Hangar 5 — ${slug.replace(/-/g, " ")}` };
}

export default async function FichaPlatillo({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { slug } = await params;
  const { from } = await searchParams;
  const desdeMenu = from === "menu";

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

  let item: ItemConVariantes | null = null;
  let categoria = "";
  for (const cat of categories) {
    const found = cat.menuItems.find((m: ItemConVariantes) => slugify(m.name) === slug);
    if (found) {
      item = found;
      categoria = cat.name;
      break;
    }
  }
  if (!item) notFound();

  const ficha = getHistoria(item.name);
  const galeria = fotosGaleria(slug);

  return (
    <main className={desdeMenu ? "ficha oscura" : "ficha"}>
      <style>{`
        ${desdeMenu ? "" : "@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');"}
        .ficha {
          --ink: #17150F; --accent: #9A7434; --hair: #DDD8CC;
          --dot: #B5AE9E; --faint: #98917F; --paper: #FBF9F4;
          min-height: 100vh; background: #FFFFFF; color: var(--ink);
          font-family: 'Inter', sans-serif; font-size: 10pt; line-height: 1.65;
          -webkit-font-smoothing: antialiased;
        }
        .ficha.oscura {
          --ink: #F3EEE4; --accent: #C9945E; --hair: #2A3B31;
          --dot: #4A5B51; --faint: #7E8A81; --paper: #132019;
          background: #0E1B15;
          font-family: var(--font-sans, 'Inter', sans-serif);
        }
        .ficha.oscura .plato img { background: #0E1B15; border-color: var(--hair); }
        .ficha.oscura h1 {
          font-family: var(--font-display, Georgia, serif);
          font-weight: 400; letter-spacing: -0.01em;
          font-size: clamp(38px, 8vw, 56px);
        }
        .ficha.oscura .historia { font-weight: 300; letter-spacing: 0.005em; }
        .ficha.oscura .historia::first-letter {
          font-family: var(--font-display, Georgia, serif);
          font-weight: 400; font-style: italic;
        }
        .ficha.oscura .precio {
          font-family: var(--font-display, Georgia, serif);
          font-size: 26px; font-weight: 400; color: var(--accent);
        }
        .ficha.oscura .precio .moneda { font-size: 16px; }
        .ficha.oscura .kicker, .ficha.oscura .volver, .ficha.oscura h2,
        .ficha.oscura .pidesi .etiqueta {
          font-family: var(--font-sans, 'Inter', sans-serif);
          font-weight: 600; font-size: 11px; letter-spacing: 0.22em;
        }
        .ficha.oscura .coords, .ficha.oscura .fig,
        .ficha.oscura .variantes span, .ficha.oscura .foot {
          font-family: var(--font-sans, 'Inter', sans-serif);
          font-weight: 500; font-size: 10px;
        }
        .ficha .wrap { max-width: 640px; margin: 0 auto; padding: 40px 26px 70px; }
        .ficha .coords {
          display: flex; justify-content: space-between;
          font-family: 'IBM Plex Mono', monospace; font-size: 8.5px;
          letter-spacing: 0.14em; text-transform: uppercase; color: var(--faint);
        }
        .ficha .volver {
          display: inline-block; margin-top: 22px; margin-right: 18px;
          font-family: 'IBM Plex Mono', monospace; font-size: 9px;
          letter-spacing: 0.16em; text-transform: uppercase;
          color: var(--accent); text-decoration: none;
        }
        .ficha .volver:hover { text-decoration: underline; }
        .ficha .plato { margin-top: 26px; }
        .ficha .plato img {
          display: block; width: 100%; height: auto;
          border: 1px solid var(--hair); padding: 8px; background: #FFFFFF;
        }
        .ficha .kicker {
          margin-top: 30px;
          font-family: 'IBM Plex Mono', monospace; font-size: 9.5px;
          letter-spacing: 0.26em; text-transform: uppercase; color: var(--accent);
        }
        .ficha h1 {
          font-family: 'Archivo', sans-serif; font-weight: 800;
          font-size: clamp(34px, 7vw, 52px); letter-spacing: -0.02em;
          line-height: 1.02; margin-top: 8px;
        }
        .ficha .precio {
          margin-top: 14px;
          font-family: 'IBM Plex Mono', monospace; font-size: 15px; font-weight: 500;
        }
        .ficha .precio .moneda { color: var(--faint); font-size: 12px; margin-right: 2px; }
        .ficha .variantes { margin-top: 8px; }
        .ficha .variantes span {
          display: inline-block; margin: 0 10px 4px 0;
          font-family: 'IBM Plex Mono', monospace; font-size: 9.5px; color: var(--faint);
        }
        .ficha .emblema { margin: 26px auto 0; max-width: 480px; }
        .ficha .emblema img { display: block; width: 100%; height: auto; }
        .ficha .fig {
          font-family: 'IBM Plex Mono', monospace; font-size: 8.5px;
          letter-spacing: 0.14em; text-transform: uppercase; color: var(--faint); margin-top: 6px;
        }
        .ficha .rule { height: 1px; background: var(--hair); margin: 26px 0; }
        .ficha .historia {
          font-weight: 300; font-size: 11.5pt; line-height: 1.75; color: var(--ink);
        }
        .ficha .historia::first-letter {
          font-family: 'Archivo', sans-serif; font-weight: 800;
          font-size: 2.6em; float: left; line-height: 0.9;
          padding: 4px 10px 0 0; color: var(--accent);
        }
        .ficha h2 {
          font-family: 'IBM Plex Mono', monospace; font-weight: 500; font-size: 10px;
          letter-spacing: 0.24em; text-transform: uppercase; color: var(--accent);
          margin: 34px 0 12px;
        }
        .ficha ul.materia { list-style: none; }
        .ficha ul.materia li {
          display: flex; align-items: baseline; gap: 10px;
          padding: 6px 0; border-bottom: 1px dotted var(--dot);
          font-weight: 300; font-size: 10.5pt;
        }
        .ficha ul.materia li::before {
          content: ""; width: 5px; height: 5px; border-radius: 50%;
          background: var(--accent); flex-shrink: 0; transform: translateY(-2px);
        }
        .ficha .maridaje { font-weight: 300; font-size: 10.5pt; color: var(--ink); }
        .ficha .pidesi {
          margin-top: 36px; padding: 22px 24px;
          background: var(--paper); border-left: 3px solid var(--accent);
        }
        .ficha .pidesi .etiqueta {
          font-family: 'IBM Plex Mono', monospace; font-size: 9px;
          letter-spacing: 0.24em; text-transform: uppercase; color: var(--accent);
          margin-bottom: 8px;
        }
        .ficha .pidesi p { font-weight: 400; font-size: 11pt; line-height: 1.6; }

        /* ---- Galeria: fotos adicionales del platillo ---- */
        .ficha .galeria {
          margin-top: 16px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 10px;
        }
        .ficha .galeria figure { margin: 0; }
        .ficha .galeria img {
          display: block; width: 100%; height: 100%;
          aspect-ratio: 4 / 3; object-fit: cover;
          border: 1px solid var(--hair);
          transition: transform .5s ease, filter .5s ease;
        }
        .ficha .galeria figure:hover img { transform: scale(1.02); }
        .ficha.oscura .galeria img { border-color: var(--hair); }
        /* Una sola foto: que no se estire a lo ancho */
        .ficha .galeria figure:only-child { grid-column: 1 / -1; max-width: 420px; }
        .ficha .galeria figcaption {
          font-family: 'IBM Plex Mono', monospace; font-size: 8px;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--faint); margin-top: 6px;
        }
        .ficha .foot {
          margin-top: 44px; padding-top: 14px; border-top: 1px solid var(--hair);
          display: flex; justify-content: space-between;
          font-family: 'IBM Plex Mono', monospace; font-size: 8.5px;
          letter-spacing: 0.14em; text-transform: uppercase; color: var(--faint);
        }
      `}</style>

      <div className="wrap">
        <div className="coords">
          <span>N 19.18&deg; &middot; W 99.97&deg;</span>
          <span>Fig. 02 &mdash; Ficha de platillo</span>
        </div>

        {desdeMenu ? (
          <Link href="/restaurante" className="volver">&larr; Men&uacute;</Link>
        ) : (
          <Link href="/carta" className="volver">&larr; Carta</Link>
        )}

        <div className="kicker">{categoria}</div>
        <h1>{item.name}</h1>
        <div className="precio">
          <span className="moneda">$</span>
          {mxn(item.basePrice)} <span style={{ color: "var(--faint)", fontSize: 11 }}>MXN</span>
        </div>
        {item.variants.length > 0 && (
          <div className="variantes">
            {item.variants.map((v: ItemConVariantes["variants"][number]) => (
              <span key={v.id}>
                {v.name} {v.priceDelta >= 0 ? "+" : "−"}${mxn(Math.abs(v.priceDelta))}
              </span>
            ))}
          </div>
        )}

        {item.imageUrl && (
          <figure className="plato">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.imageUrl} alt={item.name} />
            <figcaption className="fig">Fig. 02 &mdash; El plato &middot; Hangar 5</figcaption>
          </figure>
        )}

        {ficha && (
          <>
            {!item.imageUrl && (
              <div className="emblema">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/img/${ficha.emblema}`} alt={`${item.name} en puntillismo`} />
                <div className="fig">Ilustraci&oacute;n puntillismo &middot; Hangar 5</div>
              </div>
            )}

            <div className="rule" />

            <p className="historia">{item.description || ficha.historia}</p>

            <h2>La materia</h2>
            <ul className="materia">
              {ficha.ingredientes.map((ing) => (
                <li key={ing}>{ing}</li>
              ))}
            </ul>

            <h2>Maridaje</h2>
            <p className="maridaje">{ficha.maridaje}</p>
          </>
        )}

        {/* Galeria: independiente de que el platillo tenga historia curada */}
        {galeria.length > 0 && (
          <>
            {!ficha && <div className="rule" />}
            <h2>{galeria.length === 1 ? "Así lo servimos" : "El proceso"}</h2>
            <div className="galeria">
              {galeria.map((src, i) => (
                <figure key={src}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`${item.name} — foto ${i + 1}`} />
                  <figcaption>
                    Fig. {String(i + 3).padStart(2, "0")} &mdash; {item.name}
                  </figcaption>
                </figure>
              ))}
            </div>
          </>
        )}

        {ficha && (
          <div className="pidesi">
            <div className="etiqueta">P&iacute;delo si&hellip;</div>
            <p>{ficha.pideSi}</p>
          </div>
        )}

        <footer className="foot">
          <span>Hangar 5 &middot; El Pe&ntilde;&oacute;n</span>
          <span>Alt 2,800 M</span>
        </footer>
      </div>
    </main>
  );
}
