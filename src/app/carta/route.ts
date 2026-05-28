import { NextResponse } from "next/server";

export const dynamic = "force-static";

const HTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Hangar 5 — Carta</title>
<style>
  @page { size: letter; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  body {
    font-family: 'Helvetica Neue', 'Inter', 'SF Pro Display', sans-serif;
    background: #fcfcfc;
    color: #111;
    max-width: 8.5in;
    margin: 0 auto;
    font-size: 7.5pt;
    line-height: 1.35;
    letter-spacing: 0.02em;
    position: relative;
    overflow-x: hidden;
  }
  
  /* Dot pattern background */
  body::before {
    content: '';
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background-image: radial-gradient(circle, #ddd 0.5px, transparent 0.5px);
    background-size: 12px 12px;
    opacity: 0.5;
    z-index: 0;
    pointer-events: none;
  }
  
  .page {
    position: relative;
    z-index: 1;
    padding: 0.35in 0.3in 0.3in;
  }
  
  /* Geometric line header */
  .geo-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid #222;
  }
  .geo-header .lines {
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: 1;
  }
  .geo-header .lines span {
    display: block;
    height: 0.5px;
    background: #222;
  }
  .geo-header .lines span:nth-child(1) { width: 100%; }
  .geo-header .lines span:nth-child(2) { width: 80%; }
  .geo-header .lines span:nth-child(3) { width: 60%; }
  .geo-header .lines span:nth-child(4) { width: 40%; }
  .geo-header .lines span:nth-child(5) { width: 20%; }
  
  .geo-header .title-block {
    text-align: right;
    white-space: nowrap;
  }
  .geo-header .title-block .brand {
    font-size: 18pt;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    line-height: 1;
  }
  .geo-header .title-block .sub {
    font-size: 5.5pt;
    text-transform: uppercase;
    letter-spacing: 0.35em;
    color: #555;
    margin-top: 2px;
  }
  
  /* Main grid layout */
  .menu-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px 16px;
  }
  
  .grid-section { break-inside: avoid; }
  .grid-section.full { grid-column: 1 / -1; }
  .grid-section.span2 { grid-column: span 2; }
  
  .section-head {
    font-size: 5pt;
    text-transform: uppercase;
    letter-spacing: 0.3em;
    color: #888;
    border-bottom: 0.5px solid #ccc;
    padding-bottom: 2px;
    margin-bottom: 4px;
  }
  
  .menu-item {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 1px 0;
  }
  .menu-item .name { 
    font-weight: 400;
    color: #111;
  }
  .menu-item .dots {
    flex: 1;
    border-bottom: 1px dotted #ccc;
    margin: 0 6px;
    height: 0;
    align-self: flex-end;
    margin-bottom: 3px;
  }
  .menu-item .price {
    font-weight: 400;
    color: #444;
    white-space: nowrap;
  }
  .menu-item .variant {
    font-size: 6pt;
    color: #888;
    padding-left: 0;
  }
  
  .note {
    font-size: 5.5pt;
    color: #999;
    font-style: italic;
    padding: 0 0 1px 0;
  }
  
  /* Bottom geometric */
  .geo-footer {
    margin-top: 8px;
    padding-top: 4px;
    border-top: 1px solid #222;
    display: flex;
    justify-content: space-between;
    font-size: 5pt;
    text-transform: uppercase;
    letter-spacing: 0.25em;
    color: #888;
  }
  
  /* Concentric circles decoration top-right */
  .circles {
    position: absolute;
    top: 0.2in;
    right: 0.15in;
    opacity: 0.08;
  }
  .circles svg { width: 120px; height: 120px; }
  
  /* Diagonal lines decoration bottom-left */
  .diagonals {
    position: absolute;
    bottom: 0.15in;
    left: 0.2in;
    opacity: 0.06;
  }
</style>
</head>
<body>
<div class="page">
  <div class="circles">
    <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="55" fill="none" stroke="#000" stroke-width="0.5"/><circle cx="60" cy="60" r="40" fill="none" stroke="#000" stroke-width="0.5"/><circle cx="60" cy="60" r="25" fill="none" stroke="#000" stroke-width="0.5"/><circle cx="60" cy="60" r="10" fill="none" stroke="#000" stroke-width="0.5"/></svg>
  </div>
  <div class="diagonals">
    <svg width="80" height="80"><line x1="0" y1="80" x2="80" y2="0" stroke="#000" stroke-width="0.3"/><line x1="0" y1="60" x2="60" y2="0" stroke="#000" stroke-width="0.3"/><line x1="0" y1="40" x2="40" y2="0" stroke="#000" stroke-width="0.3"/><line x1="0" y1="20" x2="20" y2="0" stroke="#000" stroke-width="0.3"/></svg>
  </div>

  <div class="geo-header">
    <div class="lines">
      <span></span><span></span><span></span><span></span><span></span>
    </div>
    <div class="title-block">
      <div class="brand">Hangar 5</div>
      <div class="sub">Cocina de Montaña &middot; Peñón del Marqués</div>
    </div>
  </div>
  
  <div class="menu-grid">
    <div class="grid-section">
      <div class="section-head">Cafetería</div>
      <div class="menu-item"><span class="name">Café</span><span class="dots"></span><span class="price">30</span></div>
      <div class="menu-item"><span class="name">Americano</span><span class="dots"></span><span class="price">50</span></div>
      <div class="menu-item"><span class="name">Espresso</span><span class="dots"></span><span class="price">50</span></div>
      <div class="menu-item"><span class="name">Latte</span><span class="dots"></span><span class="price">60</span></div>
    </div>
    
    <div class="grid-section">
      <div class="section-head">Sin Alcohol</div>
      <div class="menu-item"><span class="name">Agua de Fruta</span><span class="dots"></span><span class="price">10</span></div>
      <div class="menu-item"><span class="name">Smoothie Berry</span><span class="dots"></span><span class="price">60</span></div>
      <div class="menu-item"><span class="name">Smoothie ChocoBanana</span><span class="dots"></span><span class="price">60</span></div>
      <div class="menu-item"><span class="name">Piña Colada</span><span class="dots"></span><span class="price">100</span></div>
      <div class="menu-item"><span class="name">Coca Cola</span><span class="dots"></span><span class="price">30</span></div>
      <div class="note">Light &middot; Zero disponibles</div>
      <div class="menu-item"><span class="name">Agua Mineral</span><span class="dots"></span><span class="price">30</span></div>
      <div class="menu-item"><span class="name">Agua 1L</span><span class="dots"></span><span class="price">30</span></div>
      <div class="menu-item"><span class="name">Agua 500ml</span><span class="dots"></span><span class="price">15</span></div>
      <div class="menu-item"><span class="name">Jugo Naranja</span><span class="dots"></span><span class="price">35</span></div>
      <div class="menu-item"><span class="name">Suero</span><span class="dots"></span><span class="price">35</span></div>
      <div class="menu-item"><span class="name">Clamato</span><span class="dots"></span><span class="price">40</span></div>
      <div class="menu-item"><span class="name">Té Infusión</span><span class="dots"></span><span class="price">30</span></div>
    </div>
    
    <div class="grid-section">
      <div class="section-head">Con Alcohol</div>
      <div class="menu-item"><span class="name">Copa Vino</span><span class="dots"></span><span class="price">100</span></div>
      <div class="menu-item"><span class="name">Mezcalina</span><span class="dots"></span><span class="price">90</span></div>
      <div class="menu-item"><span class="name">Piña Colada</span><span class="dots"></span><span class="price">150</span></div>
      <div class="menu-item"><span class="name">Margarita</span><span class="dots"></span><span class="price">130</span></div>
      <div class="menu-item"><span class="name">Mojito</span><span class="dots"></span><span class="price">150</span></div>
      <div class="menu-item"><span class="name">Paloma Tequila</span><span class="dots"></span><span class="price">130</span></div>
      <div class="menu-item"><span class="name">Carajillo</span><span class="dots"></span><span class="price">150</span></div>
      <div class="menu-item"><span class="name">Cerveza</span><span class="dots"></span><span class="price">35</span></div>
      <div class="note">Chelada 40 &middot; Michelada 50</div>
      <div class="menu-item"><span class="name">Shot Tequila</span><span class="dots"></span><span class="price">100</span></div>
      <div class="menu-item"><span class="name">Shot Mezcal</span><span class="dots"></span><span class="price">100</span></div>
      <div class="menu-item"><span class="name">Whisky</span><span class="dots"></span><span class="price">100</span></div>
      <div class="menu-item"><span class="name">Whisky Soda</span><span class="dots"></span><span class="price">130</span></div>
      <div class="menu-item"><span class="name">Botella Vino</span><span class="dots"></span><span class="price">550</span></div>
    </div>
    
    <!-- Desayunos full width -->
    <div class="grid-section full">
      <div class="section-head">Desayunos &middot; Todo el día</div>
      <div style="display:flex;gap:20px;">
        <div style="flex:1">
          <div class="menu-item"><span class="name">Chilaquiles</span><span class="dots"></span><span class="price">70</span></div>
          <div class="note">Salsa verde o roja &middot; Con pollo 90</div>
          <div class="menu-item"><span class="name">Huevos a la Mexicana</span><span class="dots"></span><span class="price">70</span></div>
          <div class="menu-item"><span class="name">Huevos Rancheros</span><span class="dots"></span><span class="price">70</span></div>
        </div>
        <div style="flex:1">
          <div class="menu-item"><span class="name">Huevo Champiñones</span><span class="dots"></span><span class="price">70</span></div>
          <div class="menu-item"><span class="name">Huevos con Jamón</span><span class="dots"></span><span class="price">80</span></div>
          <div class="menu-item"><span class="name">Fruta de Temporada</span><span class="dots"></span><span class="price">65</span></div>
          <div class="note">Miel de abeja y chile piquín</div>
        </div>
      </div>
    </div>
    
    <!-- Entradas + Ensaladas full -->
    <div class="grid-section full">
      <div class="section-head">Entradas &amp; Ensaladas</div>
      <div style="display:flex;gap:20px;">
        <div style="flex:1">
          <div class="menu-item"><span class="name">Guacamole</span><span class="dots"></span><span class="price">110</span></div>
          <div class="menu-item"><span class="name">Aceitunas</span><span class="dots"></span><span class="price">75</span></div>
          <div class="menu-item"><span class="name">Quesadillas</span><span class="dots"></span><span class="price">25</span></div>
          <div class="menu-item"><span class="name">Empanadas</span><span class="dots"></span><span class="price">35</span></div>
          <div class="menu-item"><span class="name">Flautas</span><span class="dots"></span><span class="price">40</span></div>
          <div class="menu-item"><span class="name">Verduras Preparadas</span><span class="dots"></span><span class="price">75</span></div>
        </div>
        <div style="flex:1">
          <div class="menu-item"><span class="name">Ensalada Caprese</span><span class="dots"></span><span class="price">130</span></div>
          <div class="note">Mozzarella fresca, albahaca, jitomate</div>
          <div class="menu-item"><span class="name">Ensalada Tropical</span><span class="dots"></span><span class="price">130</span></div>
          <div class="note">Mango, fresa, aguacate, nuez</div>
          <div class="menu-item"><span class="name">Ensalada Mixta</span><span class="dots"></span><span class="price">90</span></div>
        </div>
      </div>
    </div>
    
    <!-- Parrilla + Horno -->
    <div class="grid-section">
      <div class="section-head">Parrilla</div>
      <div class="menu-item"><span class="name">Hamburguesa Wagyu</span><span class="dots"></span><span class="price">250</span></div>
      <div class="note">200g carne premium, pan artesanal</div>
      <div class="menu-item"><span class="name">Taco</span><span class="dots"></span><span class="price">30</span></div>
      <div class="note">Pollo deshebrado, cilantro, salsa</div>
    </div>
    
    <div class="grid-section span2">
      <div class="section-head">Horno de Leña</div>
      <div style="display:flex;gap:16px;">
        <div style="flex:1">
          <div class="menu-item"><span class="name">Margarita</span><span class="dots"></span><span class="price">200</span></div>
          <div class="menu-item"><span class="name">Pepperoni</span><span class="dots"></span><span class="price">240</span></div>
          <div class="menu-item"><span class="name">Prosciutto</span><span class="dots"></span><span class="price">240</span></div>
        </div>
        <div style="flex:1">
          <div class="menu-item"><span class="name">Champiñones</span><span class="dots"></span><span class="price">220</span></div>
          <div class="menu-item"><span class="name">Tomate Deshidratado</span><span class="dots"></span><span class="price">240</span></div>
          <div class="menu-item"><span class="name">Vegetariana</span><span class="dots"></span><span class="price">240</span></div>
        </div>
      </div>
    </div>
    
    <!-- Postres + Cafetería -->
    <div class="grid-section">
      <div class="section-head">Postres</div>
      <div class="menu-item"><span class="name">Flan Napolitano</span><span class="dots"></span><span class="price">40</span></div>
      <div class="menu-item"><span class="name">Panqué Plátano</span><span class="dots"></span><span class="price">40</span></div>
      <div class="menu-item"><span class="name">Panqué Queso</span><span class="dots"></span><span class="price">40</span></div>
      <div class="menu-item"><span class="name">Pay de Queso</span><span class="dots"></span><span class="price">40</span></div>
      <div class="menu-item"><span class="name">Pizza Nutella</span><span class="dots"></span><span class="price">200</span></div>
    </div>
    
    <div class="grid-section">
      <div class="section-head">Cafetería</div>
      <div class="menu-item"><span class="name">Panqué del día</span><span class="dots"></span><span class="price">40</span></div>
      <div class="menu-item"><span class="name">Sándwich</span><span class="dots"></span><span class="price">70</span></div>
    </div>
  </div>
  
  <div class="geo-footer">
    <span>Hangar 5 &middot; Peñón del Marqués</span>
    <span>Precios MXN &middot; IVA incluido</span>
  </div>
</div>
</body>
</html>`;

export async function GET() {
  return new NextResponse(HTML, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
