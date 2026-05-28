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
    font-family: 'Georgia', 'Times New Roman', 'Cormorant Garamond', serif;
    color: #1b4235;
    background: #faf7f5;
    max-width: 8.5in;
    margin: 0 auto;
    padding: 0.35in 0.4in;
    font-size: 9pt;
    line-height: 1.5;
  }
  
  /* Decorative top border */
  body::before {
    content: '';
    display: block;
    height: 4px;
    background: linear-gradient(90deg, transparent 0%, #b88364 20%, #1b4235 50%, #b88364 80%, transparent 100%);
    margin-bottom: 20px;
  }
  
  .header {
    text-align: center;
    margin-bottom: 22px;
  }
  .header .logo {
    font-size: 32pt;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #1b4235;
    font-weight: normal;
    margin-bottom: 2px;
    line-height: 1;
  }
  .header .line {
    font-size: 7pt;
    letter-spacing: 0.35em;
    text-transform: uppercase;
    color: #b88364;
  }
  .header .place {
    font-size: 6.5pt;
    font-style: italic;
    color: #5c3d2e;
    margin-top: 4px;
  }
  
  .divider {
    text-align: center;
    color: #b88364;
    font-size: 7pt;
    letter-spacing: 0.4em;
    margin: 10px 0;
    opacity: 0.5;
  }
  
  .section {
    margin-bottom: 10px;
    break-inside: avoid;
  }
  .section-title {
    font-size: 7.5pt;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: #b88364;
    border-bottom: 1px solid #e0d6cf;
    padding-bottom: 3px;
    margin-bottom: 5px;
  }
  
  .two-col { 
    display: flex; 
    gap: 24px; 
  }
  .col { flex: 1; }
  
  .item {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 1.5px 0;
    font-size: 8pt;
  }
  .item .name { font-weight: normal; }
  .item .price { 
    color: #b88364;
    font-weight: normal;
    white-space: nowrap;
    margin-left: 10px;
    font-size: 8pt;
  }
  .item .note {
    font-size: 6.5pt;
    color: #8a7a6e;
    font-style: italic;
    padding-left: 20px;
    padding-bottom: 2px;
    display: block;
  }
  
  .footer {
    text-align: center;
    font-size: 6pt;
    color: #b88364;
    border-top: 1px solid #e0d6cf;
    padding-top: 8px;
    margin-top: 12px;
    letter-spacing: 0.12em;
  }

  .ornament {
    text-align: center;
    color: #b88364;
    font-size: 8pt;
    letter-spacing: 0.3em;
    margin: 8px 0;
    opacity: 0.4;
  }
</style>
</head>
<body>

<div class="header">
  <div class="logo">Hangar 5</div>
  <div class="line">Cocina de Montaña</div>
  <div class="place">Peñón del Marqués &middot; Sabores con altura</div>
</div>

<div class="two-col">
  <div class="col">
    <div class="section">
      <div class="section-title">Cafetería</div>
      <div class="item"><span class="name">Café</span><span class="price">$30</span></div>
      <div class="item"><span class="name">Café Americano</span><span class="price">$50</span></div>
      <div class="item"><span class="name">Espresso</span><span class="price">$50</span></div>
      <div class="item"><span class="name">Latte</span><span class="price">$60</span></div>
    </div>
    
    <div class="divider">&middot; &middot; &middot;</div>
    
    <div class="section">
      <div class="section-title">Sin Alcohol</div>
      <div class="item"><span class="name">Agua de Fruta</span><span class="price">$10</span></div>
      <div class="item"><span class="name">Smoothie Berry</span><span class="price">$60</span></div>
      <div class="item"><span class="name">Smoothie ChocoBanana</span><span class="price">$60</span></div>
      <div class="item"><span class="name">Piña Colada</span><span class="price">$100</span></div>
      <div class="item"><span class="name">Coca Cola</span><span class="price">$30</span></div>
      <div class="item"><span class="note">Light &middot; Zero disponibles</span></div>
      <div class="item"><span class="name">Agua Mineral</span><span class="price">$30</span></div>
      <div class="item"><span class="name">Botella de Agua 1L</span><span class="price">$30</span></div>
      <div class="item"><span class="name">Botella de Agua 500ml</span><span class="price">$15</span></div>
      <div class="item"><span class="name">Jugo de Naranja</span><span class="price">$35</span></div>
      <div class="item"><span class="name">Suero &middot; Clamato</span><span class="price">$35 / $40</span></div>
      <div class="item"><span class="name">Té Infusión</span><span class="price">$30</span></div>
    </div>
  </div>
  
  <div class="col">
    <div class="section">
      <div class="section-title">Con Alcohol</div>
      <div class="item"><span class="name">Copa de Vino</span><span class="price">$100</span></div>
      <div class="item"><span class="name">Mezcalina</span><span class="price">$90</span></div>
      <div class="item"><span class="name">Piña Colada</span><span class="price">$150</span></div>
      <div class="item"><span class="name">Margarita</span><span class="price">$130</span></div>
      <div class="item"><span class="name">Mojito</span><span class="price">$150</span></div>
      <div class="item"><span class="name">Paloma Tequila</span><span class="price">$130</span></div>
      <div class="item"><span class="name">Carajillo</span><span class="price">$150</span></div>
      
      <div style="margin-top:6px;"></div>
      <div class="item"><span class="name">Cerveza</span><span class="price">$35</span></div>
      <div class="item"><span class="note">Victoria &middot; Corona Clara &middot; Corona Oscura</span></div>
      <div class="item"><span class="note">Chelada $40 &middot; Michelada $50</span></div>
      
      <div style="margin-top:4px;"></div>
      <div class="item"><span class="name">Shot Tequila</span><span class="price">$100</span></div>
      <div class="item"><span class="name">Shot Mezcal</span><span class="price">$100</span></div>
      <div class="item"><span class="name">Whisky</span><span class="price">$100</span></div>
      <div class="item"><span class="name">Whisky Soda</span><span class="price">$130</span></div>
      <div class="item"><span class="name">Botella de Vino</span><span class="price">$550</span></div>
    </div>
    
    <div class="divider">&middot; &middot; &middot;</div>
    
    <div class="section">
      <div class="section-title">Cafetería</div>
      <div class="item"><span class="name">Panqué del día</span><span class="price">$40</span></div>
      <div class="item"><span class="name">Sándwich Artesanal</span><span class="price">$70</span></div>
    </div>
  </div>
</div>

<div class="ornament">&mdash; &loz; &mdash;</div>

<div class="section">
  <div class="section-title">Desayunos &middot; Todo el día</div>
  <div class="two-col">
    <div class="col">
      <div class="item"><span class="name">Chilaquiles</span><span class="price">$70</span></div>
      <div class="item"><span class="note">Salsa verde o roja &middot; Con pollo $90</span></div>
      <div class="item"><span class="name">Huevos a la Mexicana</span><span class="price">$70</span></div>
      <div class="item"><span class="name">Huevos Rancheros</span><span class="price">$70</span></div>
    </div>
    <div class="col">
      <div class="item"><span class="name">Huevo con Champiñones</span><span class="price">$70</span></div>
      <div class="item"><span class="name">Huevos con Jamón</span><span class="price">$80</span></div>
      <div class="item"><span class="name">Fruta de Temporada</span><span class="price">$65</span></div>
      <div class="item"><span class="note">Con miel de abeja y chile piquín</span></div>
    </div>
  </div>
</div>

<div class="ornament">&mdash; &loz; &mdash;</div>

<div class="section">
  <div class="section-title">Entradas &amp; Ensaladas</div>
  <div class="two-col">
    <div class="col">
      <div class="item"><span class="name">Guacamole</span><span class="price">$110</span></div>
      <div class="item"><span class="note">Aguacate, jitomate, cilantro, chile serrano</span></div>
      <div class="item"><span class="name">Aceitunas Preparadas</span><span class="price">$75</span></div>
      <div class="item"><span class="name">Quesadillas</span><span class="price">$25</span></div>
      <div class="item"><span class="name">Empanadas</span><span class="price">$35</span></div>
      <div class="item"><span class="name">Flautas</span><span class="price">$40</span></div>
      <div class="item"><span class="name">Verduras Preparadas</span><span class="price">$75</span></div>
    </div>
    <div class="col">
      <div class="item"><span class="name">Ensalada Caprese</span><span class="price">$130</span></div>
      <div class="item"><span class="note">Mozzarella fresca, albahaca, jitomate</span></div>
      <div class="item"><span class="name">Ensalada Tropical</span><span class="price">$130</span></div>
      <div class="item"><span class="note">Mango, fresa, aguacate, nuez</span></div>
      <div class="item"><span class="name">Ensalada Mixta</span><span class="price">$90</span></div>
    </div>
  </div>
</div>

<div class="ornament">&mdash; &loz; &mdash;</div>

<div class="two-col">
  <div class="col">
    <div class="section">
      <div class="section-title">Parrilla</div>
      <div class="item"><span class="name">Hamburguesa de Wagyu</span><span class="price">$250</span></div>
      <div class="item"><span class="note">200g de carne premium, pan artesanal</span></div>
      <div class="item"><span class="name">Taco</span><span class="price">$30</span></div>
      <div class="item"><span class="note">Pollo deshebrado, cilantro, salsa</span></div>
    </div>
  </div>
  <div class="col">
    <div class="section">
      <div class="section-title">Horno de Leña</div>
      <div class="item"><span class="name">Pizza Margarita</span><span class="price">$200</span></div>
      <div class="item"><span class="name">Pizza Pepperoni</span><span class="price">$240</span></div>
      <div class="item"><span class="name">Pizza Prosciutto</span><span class="price">$240</span></div>
      <div class="item"><span class="name">Pizza Champiñones</span><span class="price">$220</span></div>
      <div class="item"><span class="name">Pizza Tomate Deshidratado</span><span class="price">$240</span></div>
      <div class="item"><span class="name">Pizza Vegetariana</span><span class="price">$240</span></div>
    </div>
  </div>
</div>

<div class="ornament">&mdash; &loz; &mdash;</div>

<div class="section">
  <div class="section-title">Postres</div>
  <div class="two-col">
    <div class="col">
      <div class="item"><span class="name">Flan Napolitano</span><span class="price">$40</span></div>
      <div class="item"><span class="name">Panqué de Plátano</span><span class="price">$40</span></div>
    </div>
    <div class="col">
      <div class="item"><span class="name">Panqué de Queso</span><span class="price">$40</span></div>
      <div class="item"><span class="name">Pay de Queso</span><span class="price">$40</span></div>
      <div class="item"><span class="name">Pizza Nutella &amp; Plátano</span><span class="price">$200</span></div>
    </div>
  </div>
</div>

<div class="footer">
  Hangar 5 &middot; Peñón del Marqués &middot; Precios en MXN &middot; IVA incluido
</div>

</body>
</html>`;

export async function GET() {
  return new NextResponse(HTML, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
