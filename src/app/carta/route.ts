import { NextResponse } from "next/server";

export const dynamic = "force-static";

const HTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Hangar 5 — Carta</title>
<style>
  @page { size: letter; margin: 0.4in; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Georgia', 'Times New Roman', serif;
    color: #1b4235;
    background: #faf7f5;
    max-width: 8.5in;
    margin: 0 auto;
    padding: 0.3in;
    font-size: 9pt;
    line-height: 1.4;
  }
  .page { page-break-after: always; }
  .page:last-child { page-break-after: avoid; }
  .header {
    text-align: center;
    border-bottom: 2px solid #b88364;
    padding-bottom: 12px;
    margin-bottom: 16px;
  }
  .header h1 {
    font-size: 28pt;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #1b4235;
    font-weight: normal;
    margin-bottom: 4px;
  }
  .header .subtitle {
    font-size: 8pt;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: #b88364;
  }
  .header .tagline {
    font-size: 7pt;
    font-style: italic;
    color: #5c3d2e;
    margin-top: 6px;
  }
  .section { margin-bottom: 10px; break-inside: avoid; }
  .section-title {
    font-size: 7pt;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: #b88364;
    border-bottom: 1px solid #e0d6cf;
    padding-bottom: 3px;
    margin-bottom: 6px;
  }
  .columns { display: flex; gap: 20px; }
  .col { flex: 1; }
  .item { display: flex; justify-content: space-between; align-items: baseline; padding: 1.5px 0; font-size: 8pt; }
  .item .name { font-weight: normal; }
  .item .price { color: #b88364; font-weight: normal; white-space: nowrap; margin-left: 8px; }
  .item .variant { font-size: 7pt; color: #5c3d2e; margin-left: 12px; }
  .footer {
    text-align: center;
    font-size: 6pt;
    color: #b88364;
    border-top: 1px solid #e0d6cf;
    padding-top: 8px;
    margin-top: 16px;
  }
  .activities-section { margin-top: 12px; padding-top: 8px; border-top: 1px dashed #b88364; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <h1>Hangar 5</h1>
    <div class="subtitle">Cocina de Montaña &amp; Aventura</div>
    <div class="tagline">Peñón del Marqués • Sabores con altura</div>
  </div>
  <div class="columns">
    <div class="col">
      <div class="section"><div class="section-title">☕ Cafetería</div>
        <div class="item"><span class="name">Café</span><span class="price">$30</span></div>
        <div class="item"><span class="name">Café Americano</span><span class="price">$50</span></div>
        <div class="item"><span class="name">Espresso</span><span class="price">$50</span></div>
        <div class="item"><span class="name">Latte</span><span class="price">$60</span></div>
      </div>
      <div class="section"><div class="section-title">🧃 Bebidas sin Alcohol</div>
        <div class="item"><span class="name">Agua de Fruta</span><span class="price">$10</span></div>
        <div class="item"><span class="name">Smoothie Berry</span><span class="price">$60</span></div>
        <div class="item"><span class="name">Smoothie ChocoBanana</span><span class="price">$60</span></div>
        <div class="item"><span class="name">Piña Colada</span><span class="price">$100</span></div>
        <div class="item"><span class="name">Coca Cola 335ml</span><span class="price">$30</span></div>
        <div class="item"><span class="name">Coca Cola Light</span><span class="price">$30</span></div>
        <div class="item"><span class="name">Coca Cola Zero</span><span class="price">$30</span></div>
        <div class="item"><span class="name">Agua Mineral</span><span class="price">$30</span></div>
        <div class="item"><span class="name">Suero</span><span class="price">$35</span></div>
        <div class="item"><span class="name">Botella de Agua 1L</span><span class="price">$30</span></div>
        <div class="item"><span class="name">Botella de Agua 500ml</span><span class="price">$15</span></div>
        <div class="item"><span class="name">Jugo de Naranja</span><span class="price">$35</span></div>
        <div class="item"><span class="name">Clamato</span><span class="price">$40</span></div>
        <div class="item"><span class="name">Té Infusión</span><span class="price">$30</span></div>
      </div>
    </div>
    <div class="col">
      <div class="section"><div class="section-title">🍸 Bebidas con Alcohol</div>
        <div class="item"><span class="name">Copa Vino</span><span class="price">$100</span></div>
        <div class="item"><span class="name">Mezcalina</span><span class="price">$90</span></div>
        <div class="item"><span class="name">Piña Colada c/Alcohol</span><span class="price">$150</span></div>
        <div class="item"><span class="name">Cerveza Victoria</span><span class="price">$35</span></div>
        <div class="item"><span class="name"><span class="variant">Chelada</span></span><span class="price">$40</span></div>
        <div class="item"><span class="name"><span class="variant">Michelada</span></span><span class="price">$50</span></div>
        <div class="item"><span class="name">Cerveza Corona Clara</span><span class="price">$35</span></div>
        <div class="item"><span class="name">Cerveza Corona Oscura</span><span class="price">$35</span></div>
        <div class="item"><span class="name">Shot Tequila</span><span class="price">$100</span></div>
        <div class="item"><span class="name">Shot Mezcal</span><span class="price">$100</span></div>
        <div class="item"><span class="name">Paloma Tequila</span><span class="price">$130</span></div>
        <div class="item"><span class="name">Whisky</span><span class="price">$100</span></div>
        <div class="item"><span class="name">Whisky Soda</span><span class="price">$130</span></div>
        <div class="item"><span class="name">Mojito</span><span class="price">$150</span></div>
        <div class="item"><span class="name">Carajillo</span><span class="price">$150</span></div>
        <div class="item"><span class="name">Margarita</span><span class="price">$130</span></div>
        <div class="item"><span class="name">Botella de Vino</span><span class="price">$550</span></div>
      </div>
      <div class="section"><div class="section-title">🥪 Cafetería</div>
        <div class="item"><span class="name">Panqué</span><span class="price">$40</span></div>
        <div class="item"><span class="name">Sándwich</span><span class="price">$70</span></div>
      </div>
    </div>
  </div>
  <div class="section"><div class="section-title">🍳 Desayunos — Todo el día</div>
    <div class="columns">
      <div class="col">
        <div class="item"><span class="name">Chilaquiles</span><span class="price">$70</span></div>
        <div class="item"><span class="name"><span class="variant">Con pollo</span></span><span class="price">$90</span></div>
        <div class="item"><span class="name">Huevos a la Mexicana</span><span class="price">$70</span></div>
        <div class="item"><span class="name">Huevos Rancheros</span><span class="price">$70</span></div>
        <div class="item"><span class="name">Huevo con Champiñones</span><span class="price">$70</span></div>
      </div>
      <div class="col">
        <div class="item"><span class="name">Huevos con Jamón</span><span class="price">$80</span></div>
        <div class="item"><span class="name">Fruta de Temporada</span><span class="price">$65</span></div>
        <div class="item"><span class="name"><span class="variant">con miel y chile piquín</span></span></div>
      </div>
    </div>
  </div>
  <div class="section"><div class="section-title">🌿 Entradas &amp; Ensaladas</div>
    <div class="columns">
      <div class="col">
        <div class="item"><span class="name">Guacamole</span><span class="price">$110</span></div>
        <div class="item"><span class="name">Aceitunas Preparadas</span><span class="price">$75</span></div>
        <div class="item"><span class="name">Quesadillas</span><span class="price">$25</span></div>
        <div class="item"><span class="name">Empanadas</span><span class="price">$35</span></div>
        <div class="item"><span class="name">Flautas</span><span class="price">$40</span></div>
        <div class="item"><span class="name">Verduras Preparadas</span><span class="price">$75</span></div>
      </div>
      <div class="col">
        <div class="item"><span class="name">Ensalada Caprese</span><span class="price">$130</span></div>
        <div class="item"><span class="name">Ensalada Tropical</span><span class="price">$130</span></div>
        <div class="item"><span class="name">Ensalada Mixta</span><span class="price">$90</span></div>
      </div>
    </div>
  </div>
  <div class="columns">
    <div class="col">
      <div class="section"><div class="section-title">🔥 Parrilla</div>
        <div class="item"><span class="name">Hamburguesa de Wagyu</span><span class="price">$250</span></div>
        <div class="item"><span class="name">Taco</span><span class="price">$30</span></div>
      </div>
    </div>
    <div class="col">
      <div class="section"><div class="section-title">🍕 Horno de Leña</div>
        <div class="item"><span class="name">Pizza Margarita</span><span class="price">$200</span></div>
        <div class="item"><span class="name">Pizza Pepperoni</span><span class="price">$240</span></div>
        <div class="item"><span class="name">Pizza Prosciutto</span><span class="price">$240</span></div>
        <div class="item"><span class="name">Pizza Champiñones</span><span class="price">$220</span></div>
        <div class="item"><span class="name">Pizza Tomate Deshidratado</span><span class="price">$240</span></div>
        <div class="item"><span class="name">Pizza Vegetariana</span><span class="price">$240</span></div>
      </div>
    </div>
  </div>
  <div class="section"><div class="section-title">🍰 Postres</div>
    <div class="columns">
      <div class="col">
        <div class="item"><span class="name">Flan Napolitano</span><span class="price">$40</span></div>
        <div class="item"><span class="name">Panqué de Plátano</span><span class="price">$40</span></div>
        <div class="item"><span class="name">Panqué de Queso</span><span class="price">$40</span></div>
      </div>
      <div class="col">
        <div class="item"><span class="name">Pay de Queso</span><span class="price">$40</span></div>
        <div class="item"><span class="name">Pizza Nutella &amp; Plátano</span><span class="price">$200</span></div>
      </div>
    </div>
  </div>
  <div class="footer">Precios en MXN • IVA incluido</div>
</div>
<div class="page">
  <div class="header">
    <h1>Experiencias</h1>
    <div class="subtitle">Aventura • Naturaleza • Descanso</div>
    <div class="tagline">Hangar 5 • Peñón del Marqués</div>
  </div>
  <div class="section"><div class="section-title">🪂 Vuelo &amp; Aventura</div>
    <div class="columns">
      <div class="col">
        <div class="item"><span class="name">Parapente — Aventura</span><span class="price">$2,500</span></div>
        <div class="item"><span class="name"><span class="variant">20 min en tándem. Instructor certificado.</span></span></div>
        <div class="item"><span class="name">Parapente — Exploración</span><span class="price">$3,500</span></div>
        <div class="item"><span class="name"><span class="variant">45 min de vuelo extendido.</span></span></div>
        <div class="item"><span class="name">Ala Delta</span><span class="price">$3,000</span></div>
        <div class="item"><span class="name"><span class="variant">20 min en tándem.</span></span></div>
      </div>
      <div class="col">
        <div class="item"><span class="name">Hike Guiado</span><span class="price">$500</span></div>
        <div class="item"><span class="name"><span class="variant">~1 hora. Grupos 1-4 pers.</span></span></div>
        <div class="item"><span class="name">Fogata</span><span class="price">$250</span></div>
        <div class="item"><span class="name"><span class="variant">Bajo las estrellas.</span></span></div>
      </div>
    </div>
  </div>
  <div class="section"><div class="section-title">🏍️ Rentas</div>
    <div class="columns">
      <div class="col">
        <div class="item"><span class="name">Moto Enduro 300cc</span><span class="price">$1,800</span></div>
        <div class="item"><span class="name"><span class="variant">Día completo. Equipo incluido. 3 unidades.</span></span></div>
      </div>
      <div class="col">
        <div class="item"><span class="name">Bici Enduro 160mm</span><span class="price">$950</span></div>
        <div class="item"><span class="name"><span class="variant">Doble suspensión. Día completo. 3 unidades.</span></span></div>
      </div>
    </div>
  </div>
  <div class="section"><div class="section-title">🏡 Hospedaje</div>
    <div class="columns">
      <div class="col">
        <div class="item"><span class="name">Casa del Árbol</span><span class="price">$2,500</span></div>
        <div class="item"><span class="name">Medialuna</span><span class="price">$2,000</span></div>
        <div class="item"><span class="name">Cóndor y Zopilote</span><span class="price">$2,800</span></div>
        <div class="item"><span class="name">Zopilote</span><span class="price">$2,200</span></div>
      </div>
      <div class="col">
        <div class="item"><span class="name">Glamping Familiar</span><span class="price">$1,300</span></div>
        <div class="item"><span class="name">Glamping Individual</span><span class="price">$900</span></div>
        <div class="item"><span class="name">Camping</span><span class="price">$200</span></div>
        <div class="item"><span class="name"><span class="variant">Por persona. Bajo las estrellas.</span></span></div>
      </div>
    </div>
  </div>
  <div class="activities-section">
    <div style="text-align:center;font-size:7pt;color:#5c3d2e;font-style:italic;margin-bottom:8px">
      "Donde el cielo toca la tierra y la aventura despierta los sentidos"
    </div>
  </div>
  <div class="footer">Hangar 5 • Peñón del Marqués • hangar5.onrender.com/carta • Precios en MXN • IVA incluido</div>
</div>
</body>
</html>`;

export async function GET() {
  return new NextResponse(HTML, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
