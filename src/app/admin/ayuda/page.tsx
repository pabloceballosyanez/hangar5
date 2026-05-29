'use client';

import { useState } from 'react';

interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
}

export default function AyudaPage() {
  const [activeSection, setActiveSection] = useState('acceso');
  const [search, setSearch] = useState('');

  const sections: Section[] = [
    {
      id: 'acceso',
      title: '1. Acceso al Sistema',
      content: <>
        <p className="mb-4">La URL de acceso es: <code className="bg-[#b88364]/10 px-2 py-0.5 rounded text-[#b88364]">/login</code></p>
        
        <h4 className="text-[#b88364] font-medium mt-6 mb-2">Pantalla de Login</h4>
        <ol className="list-decimal pl-5 space-y-1 mb-4">
          <li>Seleccioná tu nombre de la lista</li>
          <li>Ingresá tu PIN de 4 dígitos</li>
          <li>El sistema te redirige automáticamente según tu rol</li>
        </ol>

        <h4 className="text-[#b88364] font-medium mt-6 mb-2">Roles y Permisos</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#b88364]/10 text-left">
                <th className="py-2 pr-4 text-[#b88364]">Rol</th>
                <th className="py-2 pr-4 text-[#b88364]">Acceso</th>
                <th className="py-2 text-[#b88364]">Destino</th>
              </tr>
            </thead>
            <tbody className="text-[#f0ebe3]/80">
              <tr className="border-b border-[#b88364]/5"><td className="py-2 pr-4">👑 Super Admin</td><td className="py-2 pr-4">Todo. Gestiona usuarios, precios, menú.</td><td className="py-2">Admin Dashboard</td></tr>
              <tr className="border-b border-[#b88364]/5"><td className="py-2 pr-4">💼 Gerente</td><td className="py-2 pr-4">Operación completa. Cambia menú y precios.</td><td className="py-2">Admin Dashboard</td></tr>
              <tr className="border-b border-[#b88364]/5"><td className="py-2 pr-4">🕐 Gerente Turno</td><td className="py-2 pr-4">Supervisa en tiempo real.</td><td className="py-2">Admin Restaurante</td></tr>
              <tr className="border-b border-[#b88364]/5"><td className="py-2 pr-4">🤵 Mesero</td><td className="py-2 pr-4">Toma órdenes, abre mesas, cobra.</td><td className="py-2">App de Mesero</td></tr>
              <tr className="border-b border-[#b88364]/5"><td className="py-2 pr-4">👨‍🍳 Cocinero</td><td className="py-2 pr-4">Ve órdenes en cocina. Marca listo.</td><td className="py-2">KDS Cocina</td></tr>
              <tr className="border-b border-[#b88364]/5"><td className="py-2 pr-4">🍸 Bartender</td><td className="py-2 pr-4">Ve órdenes de bar. Marca listo.</td><td className="py-2">KDS Bar</td></tr>
              <tr className="border-b border-[#b88364]/5"><td className="py-2 pr-4">🛎️ Recepción</td><td className="py-2 pr-4">Reservas, check-in/out.</td><td className="py-2">Admin Dashboard</td></tr>
              <tr><td className="py-2 pr-4">💰 Caja</td><td className="py-2 pr-4">Cierres, cobros, reportes.</td><td className="py-2">Reportes</td></tr>
            </tbody>
          </table>
        </div>

        <h4 className="text-[#b88364] font-medium mt-6 mb-2">Cerrar Sesión</h4>
        <p>Click en <strong>Salir</strong> (esquina superior derecha) → vuelve al login.</p>
      </>
    },
    {
      id: 'dashboard',
      title: '2. Admin Dashboard',
      content: <>
        <p className="mb-4">El Dashboard muestra un resumen de la operación con 4 tarjetas principales:</p>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li><strong>Reservas este mes</strong> — total de reservas de cabañas, glampings y actividades</li>
          <li><strong>Ingresos este mes</strong> — ingresos totales</li>
          <li><strong>Items activos</strong> — número de platillos y productos en el menú</li>
          <li><strong>Próximos check-ins</strong> — llegadas programadas</li>
        </ul>
        <h4 className="text-[#b88364] font-medium mt-6 mb-2">Pestañas principales</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>📊 Dashboard</strong> — resumen general</li>
          <li><strong>📋 Reservas</strong> — gestión de reservas</li>
          <li><strong>🏷️ Items</strong> — cabañas, glampings, actividades, rentas</li>
          <li><strong>🍽️ Restaurante</strong> — módulo completo de restauración</li>
          <li><strong>📋 Recetario</strong> — vista pública del recetario</li>
        </ul>
      </>
    },
    {
      id: 'menu',
      title: '3. Gestión del Menú',
      content: <>
        <p className="mb-4">Para acceder: <strong>Admin → 🍽️ Restaurante → Menú</strong> (sidebar izquierdo)</p>
        
        <h4 className="text-[#b88364] font-medium mt-6 mb-2">Crear un item del menú</h4>
        <ol className="list-decimal pl-5 space-y-1 mb-4">
          <li>Ir a <strong>Menú</strong> en el sidebar</li>
          <li>Click en <strong>+ Nuevo item</strong></li>
          <li>Llenar: nombre, precio, categoría, estación de preparación</li>
          <li>Click en <strong>Crear</strong></li>
        </ol>

        <div className="bg-[#b88364]/5 border border-[#b88364]/20 rounded-lg p-3 mb-4">
          <p className="text-xs text-[#b88364] font-medium mb-1">💡 Tip</p>
          <p className="text-xs text-[#f0ebe3]/70">El precio se ingresa en pesos. Ej: $200.00 se ingresa como <code className="bg-[#b88364]/10 px-1 rounded">200</code>.</p>
        </div>

        <h4 className="text-[#b88364] font-medium mt-6 mb-2">Estaciones de preparación</h4>
        <p className="mb-2">Cada item debe tener una estación que determina en qué pantalla del KDS aparece:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>KITCHEN</strong> — cocina caliente (pizzas, parrilla, desayunos)</li>
          <li><strong>BAR</strong> — bebidas y cocteles</li>
          <li><strong>COLD_STATION</strong> — ensaladas, postres, bebidas sin alcohol</li>
        </ul>

        <h4 className="text-[#b88364] font-medium mt-6 mb-2">Modificadores</h4>
        <p className="mb-2">Permiten personalizar un platillo (ej: "término de carne", "sin cebolla").</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Ir a <strong>Modificadores</strong> en el sidebar</li>
          <li>Crear un grupo (ej: "Término de carne")</li>
          <li>Agregar opciones (ej: "Rojo", "Medio", "Tres cuartos")</li>
          <li>Asignar el grupo a los items del menú</li>
        </ol>
      </>
    },
    {
      id: 'recetas',
      title: '4. Recetas e Inventario',
      content: <>
        <h4 className="text-[#b88364] font-medium mb-2">Inventario (Ingredientes)</h4>
        <p className="mb-4">Para acceder: <strong>Admin → 🍽️ Restaurante → Inventario</strong></p>
        
        <p className="mb-2">Cada ingrediente tiene: nombre, unidad, stock actual, stock mínimo, costo.</p>

        <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 mb-4">
          <p className="text-xs text-amber-400 font-medium mb-1">⚠️ Importante</p>
          <p className="text-xs text-[#f0ebe3]/70">Los productos simples (refrescos, cervezas, aguas) necesitan un ingrediente con <strong>exactamente el mismo nombre</strong> que el item del menú. Ej: "Coca Cola 335ml" como item → "Coca Cola 335ml" como ingrediente con stock.</p>
        </div>

        <h4 className="text-[#b88364] font-medium mt-6 mb-2">Recetas</h4>
        <ol className="list-decimal pl-5 space-y-1 mb-4">
          <li>Ir a <strong>Recetas</strong> → <strong>+ Nueva receta</strong></li>
          <li>Seleccionar el platillo del menú</li>
          <li>Establecer cuánto rinde (normalmente 1 porción)</li>
          <li>En la pantalla de detalle, agregar ingredientes uno por uno</li>
        </ol>

        <h4 className="text-[#b88364] font-medium mt-6 mb-2">Recetas Base (Templates)</h4>
        <p className="mb-2">Permiten reutilizar ingredientes comunes. Ej: una "Base de Pizza" que usan todas las pizzas.</p>
        <ol className="list-decimal pl-5 space-y-1 mb-4">
          <li>Crear receta nueva <strong>sin seleccionar item del menú</strong></li>
          <li>Marcar <strong>"Es plantilla"</strong></li>
          <li>Agregar ingredientes base</li>
          <li>Al crear variaciones, seleccionar la receta base en "Extiende de"</li>
        </ol>

        <div className="bg-[#b88364]/5 border border-[#b88364]/20 rounded-lg p-3">
          <p className="text-xs text-[#b88364] font-medium mb-1">💡 Ventaja</p>
          <p className="text-xs text-[#f0ebe3]/70">Si cambiás la receta base, TODAS las variaciones se actualizan automáticamente.</p>
        </div>
      </>
    },
    {
      id: 'staff',
      title: '5. Gestión de Personal',
      content: <>
        <p className="mb-4">Para acceder: <strong>Admin → 🍽️ Restaurante → Staff</strong></p>
        
        <h4 className="text-[#b88364] font-medium mb-2">Agregar personal</h4>
        <ol className="list-decimal pl-5 space-y-1 mb-4">
          <li>Click en <strong>+ Nuevo staff</strong></li>
          <li>Llenar: nombre, PIN (4 dígitos), rol, teléfono, email, pago/hr</li>
          <li>Click en <strong>Crear staff</strong></li>
        </ol>

        <h4 className="text-[#b88364] font-medium mb-2">Desactivar (no eliminar)</h4>
        <p className="mb-2">Click en el nombre → destildar <strong>Activo</strong> → Guardar. La persona no podrá ingresar pero su historial se conserva.</p>

        <h4 className="text-[#b88364] font-medium mb-2">Cambiar PIN</h4>
        <p>Entrar a la ficha del staff → campo PIN → nuevo código → Guardar.</p>
      </>
    },
    {
      id: 'mesero',
      title: '6. App de Mesero',
      content: <>
        <p className="mb-4">Al ingresar como <strong>Mesero</strong>, vas directo a la app.</p>

        <h4 className="text-[#b88364] font-medium mb-2">Pantalla Principal</h4>
        <p className="mb-2">Muestra todas las sesiones activas con indicadores de color:</p>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>🟢 <strong>Vacío</strong> — sesión abierta sin órdenes</li>
          <li>🟠 <strong>Activo</strong> — con órdenes en preparación</li>
          <li>🟢 <strong>¡Listo!</strong> — órdenes listas para entregar</li>
          <li>🔴 <strong>Cobrar</strong> — órdenes entregadas, pendiente de pago</li>
        </ul>

        <h4 className="text-[#b88364] font-medium mb-2">Tomar una orden</h4>
        <ol className="list-decimal pl-5 space-y-1 mb-4">
          <li>Seleccionar la sesión (mesa/tab)</li>
          <li>Click en <strong>➕ Nueva orden</strong></li>
          <li>Navegar por categorías o buscar por nombre</li>
          <li>Click en el platillo para agregar al carrito</li>
          <li>Ajustar cantidad, variantes y modificadores</li>
          <li>Click en <strong>🛒 Carrito</strong> para revisar</li>
          <li>Click en <strong>Enviar a cocina</strong></li>
        </ol>

        <h4 className="text-[#b88364] font-medium mb-2">Seguimiento y cobro</h4>
        <p className="mb-2">Cada orden muestra su estado en tiempo real. Al entregar, marcarla como <strong>Entregado</strong>. Para cobrar, click en <strong>Cobrar</strong> → seleccionar método de pago → confirmar.</p>
      </>
    },
    {
      id: 'kds',
      title: '7. KDS — Cocina y Bar',
      content: <>
        <p className="mb-4">Al ingresar como <strong>Cocinero</strong> o <strong>Bartender</strong>, vas directo al KDS.</p>

        <h4 className="text-[#b88364] font-medium mb-2">Flujo en cocina</h4>
        <ol className="list-decimal pl-5 space-y-1 mb-4">
          <li>El mesero envía la orden → aparece en KDS como <strong>NUEVA</strong></li>
          <li>Cocinero la ve y empieza a preparar</li>
          <li>Cuando está lista → click en <strong>✅ LISTO</strong></li>
          <li>El mesero ve el cambio y recoge el platillo</li>
        </ol>

        <h4 className="text-[#b88364] font-medium mb-2">Separación por estación</h4>
        <p className="mb-2">Los items se filtran automáticamente según su estación de preparación. Un cocinero solo ve items de KITCHEN. Un bartender solo ve BAR. COLD_STATION aparece en ambas.</p>
      </>
    },
    {
      id: 'recetario',
      title: '8. Recetario Público',
      content: <>
        <p className="mb-4">Acceso: <code className="bg-[#b88364]/10 px-2 py-0.5 rounded text-[#b88364]">/recetario</code> o desde el botón <strong>📋 Recetario</strong> en el admin.</p>

        <h4 className="text-[#b88364] font-medium mb-2">Funcionalidades</h4>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li><strong>Grid visual</strong> — cada receta con foto, nombre, categoría, costo</li>
          <li><strong>Búsqueda</strong> — por nombre de platillo o ingrediente</li>
          <li><strong>Filtro por categoría</strong></li>
          <li><strong>Click para detalle</strong> — ingredientes, cantidades, costo total, notas</li>
          <li><strong>🖨 Imprimir</strong> — botón de impresión en cada receta</li>
        </ul>
      </>
    },
    {
      id: 'cartas',
      title: '9. Cartas Imprimibles',
      content: <>
        <p className="mb-4">Tres versiones del menú listas para imprimir en tamaño carta:</p>
        
        <div className="space-y-3 mb-4">
          <div className="bg-white/5 rounded-lg p-3 border border-[#b88364]/10">
            <p className="text-[#b88364] font-medium">🎬 Épico</p>
            <p className="text-xs text-[#f0ebe3]/60">Fondo cinematográfico con parapente, moto, bici y montañas</p>
            <code className="text-xs text-[#b88364]/60">/carta</code>
          </div>
          <div className="bg-white/5 rounded-lg p-3 border border-[#b88364]/10">
            <p className="text-[#b88364] font-medium">🔷 Geométrico</p>
            <p className="text-xs text-[#f0ebe3]/60">Diseño Bauhaus con formas geométricas</p>
            <code className="text-xs text-[#b88364]/60">/carta/sobria</code>
          </div>
          <div className="bg-white/5 rounded-lg p-3 border border-[#b88364]/10">
            <p className="text-[#b88364] font-medium">📖 Wanderlust</p>
            <p className="text-xs text-[#f0ebe3]/60">Estilo diario de viaje con acuarelas</p>
            <code className="text-xs text-[#b88364]/60">/carta/aventura</code>
          </div>
        </div>

        <p>Para imprimir: abrir la URL → <strong>Ctrl+P</strong> (o Cmd+P) → ajustar a tamaño carta.</p>
      </>
    },
    {
      id: 'import',
      title: '10. Importación Masiva (CSV)',
      content: <>
        <h4 className="text-[#b88364] font-medium mb-2">Template de Inventario</h4>
        <p className="mb-2">Descargar: <code className="bg-[#b88364]/10 px-2 py-0.5 rounded text-[#b88364]">/inventario-template.csv</code></p>
        <p className="mb-2">Columnas: <code>name</code>, <code>unit</code>, <code>currentStock</code>, <code>minStock</code>, <code>cost</code></p>
        <p className="mb-4 text-xs text-[#f0ebe3]/40">El costo va en pesos. Si un ingrediente ya existe, se actualiza. Si no, se crea.</p>

        <h4 className="text-[#b88364] font-medium mb-2">Template de Recetas</h4>
        <p className="mb-2">Descargar: <code className="bg-[#b88364]/10 px-2 py-0.5 rounded text-[#b88364]">/recetas-template.csv</code></p>
        <p className="mb-2">Columnas: <code>menuItemName</code>, <code>ingredientName</code>, <code>quantity</code>, <code>yieldQuantity</code>, <code>notes</code></p>
        <p className="text-xs text-[#f0ebe3]/40">Una fila por ingrediente. Mismo menuItemName en varias filas = misma receta.</p>
      </>
    },
    {
      id: 'inventario',
      title: '11. Descuento de Inventario',
      content: <>
        <p className="mb-4">El sistema descuenta automáticamente el inventario cada vez que se crea una orden.</p>

        <h4 className="text-[#b88364] font-medium mb-2">¿Cómo funciona?</h4>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li><strong>Items con receta:</strong> Descuenta cada ingrediente según las cantidades de la receta (incluye ingredientes heredados de recetas base)</li>
          <li><strong>Items sin receta:</strong> Busca un ingrediente con el <strong>mismo nombre</strong> que el item del menú y descuenta 1 unidad</li>
        </ul>

        <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 mb-4">
          <p className="text-xs text-amber-400 font-medium mb-1">⚠️ Para productos simples</p>
          <p className="text-xs text-[#f0ebe3]/70">El ingrediente debe llamarse <strong>EXACTAMENTE igual</strong> que el item. Ej: "Coca Cola 335ml" en el menú → "Coca Cola 335ml" en inventario.</p>
        </div>

        <p className="text-xs text-[#f0ebe3]/40">Cada descuento queda registrado en StockMovement con el motivo "Venta".</p>
      </>
    },
    {
      id: 'backup',
      title: '12. Respaldo y Restauración',
      content: <>
        <h4 className="text-[#b88364] font-medium mb-2">Versión actual</h4>
        <p className="mb-4"><strong>v1.0-beta</strong> — Mayo 2026</p>

        <h4 className="text-[#b88364] font-medium mb-2">Respaldos existentes</h4>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Código:</strong> Tag <code>v1.0-beta</code> en GitHub</li>
          <li><strong>Datos:</strong> JSON exportable desde <code>/api/admin/backup</code></li>
          <li><strong>DB:</strong> Snapshots automáticos en Render (disco persistente)</li>
        </ul>

        <div className="bg-[#b88364]/5 border border-[#b88364]/20 rounded-lg p-3 mt-4">
          <p className="text-xs text-[#f0ebe3]/70">Para restaurar a esta versión, contactar al administrador del sistema.</p>
        </div>
      </>
    },
  ];

  const filtered = sections.filter(s => 
    !search || s.title.toLowerCase().includes(search.toLowerCase())
  );

  const active = sections.find(s => s.id === activeSection);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f0ebe3]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur border-b border-[#b88364]/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-serif">📖 Manual de Uso</h1>
            <p className="text-xs text-[#b88364] tracking-widest uppercase mt-1">Hangar 5 v1.0-beta</p>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Buscar en el manual..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white/5 border border-[#b88364]/20 text-sm text-[#f0ebe3] placeholder:text-[#f0ebe3]/30 focus:outline-none focus:border-[#b88364] w-56"
            />
            <a href="/admin" className="text-xs text-[#b88364] hover:text-[#f0ebe3] transition-colors">
              ← Admin
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex gap-8 px-6 py-8">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 hidden lg:block">
          <nav className="sticky top-24 space-y-1">
            {filtered.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeSection === s.id
                    ? 'bg-[#b88364]/10 text-[#b88364] border border-[#b88364]/20'
                    : 'text-[#f0ebe3]/50 hover:text-[#f0ebe3]/80 hover:bg-white/5'
                }`}
              >
                {s.title}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          {/* Mobile nav */}
          <div className="lg:hidden mb-6">
            <select
              value={activeSection}
              onChange={e => setActiveSection(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-[#b88364]/20 text-sm text-[#f0ebe3] focus:outline-none focus:border-[#b88364]"
            >
              {filtered.map(s => (
                <option key={s.id} value={s.id} className="bg-[#1a1a1a]">{s.title}</option>
              ))}
            </select>
          </div>

          {active ? (
            <div className="prose prose-invert max-w-none">
              <h2 className="text-2xl font-serif mb-6 text-[#f0ebe3]">{active.title}</h2>
              <div className="text-[#f0ebe3]/80 leading-relaxed">
                {active.content}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-[#f0ebe3]/30">
              No se encontraron resultados para "{search}"
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
