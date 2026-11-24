/**
 * Prueba: qué APIs puede tocar cada rol.
 *
 * El bug: el middleware pedía puede(rol, "admin") para TODO lo que
 * empezara con /api/admin. Cocina y barra tienen operación e inventario
 * pero no "admin", así que el Modo Solo les devolvía 403 al pedir mesas y
 * no podían abrir cuenta ni registrar nada.
 */
import { puede, zonaDeRuta } from "@/lib/permisos";

function zonaDeApi(pathname: string) {
  /* Las mesas son la excepción: la PANTALLA /admin/restaurant/tables es
     configuración, pero la API es solo lectura de la operación (sin la
     lista nadie puede abrir cuenta). Se resuelve como operación. */
  if (pathname === "/api/admin/restaurant/tables") return "operacion" as const;
  return zonaDeRuta(pathname.replace("/api/admin/restaurant", "/admin/restaurant"));
}

const RESTAURANT_API = "/api/admin/restaurant";

function permite(rol: string, pathname: string): boolean {
  const zona = zonaDeApi(pathname);
  if (zona && puede(rol, zona)) return true;
  if (!zona && pathname.startsWith(RESTAURANT_API) && puede(rol, "operacion")) return true;
  return false;
}

const casos: Array<[string, string, boolean]> = [
  // ── COCINERO: hace su turno completo ──
  ["COCINERO", "/api/admin/restaurant/tables", true],      // abrir cuenta
  ["COCINERO", "/api/admin/restaurant/sessions", true],    // crear cuenta
  ["COCINERO", "/api/admin/restaurant/orders", true],      // tomar pedido
  ["COCINERO", "/api/admin/restaurant/customers", true],   // cliente del Hangar
  ["COCINERO", "/api/admin/restaurant/almacenes", true],   // inventario
  ["COCINERO", "/api/admin/restaurant/ingredients", true], // insumos
  ["COCINERO", "/api/admin/restaurant/recipes", true],     // recetas
  // ── pero NO la configuración ──
  ["COCINERO", "/api/admin/restaurant/staff", false],
  ["COCINERO", "/api/admin/restaurant/menu-items", false],
  ["COCINERO", "/api/admin/restaurant/reports/daily", false],
  ["COCINERO", "/api/admin/restaurant/ubicaciones", false],

  // ── BAR: igual que cocina ──
  ["BAR", "/api/admin/restaurant/tables", true],
  ["BAR", "/api/admin/restaurant/orders", true],
  ["BAR", "/api/admin/restaurant/staff", false],

  // ── MESERO: opera, no inventario ni menú ──
  ["MESERO", "/api/admin/restaurant/tables", true],
  ["MESERO", "/api/admin/restaurant/orders", true],
  ["MESERO", "/api/admin/restaurant/ingredients", false],
  ["MESERO", "/api/admin/restaurant/staff", false],

  // ── GERENTE: casi todo ──
  ["GERENTE", "/api/admin/restaurant/staff", false],       // config sí lo ve, pero staff es configuracion
  ["GERENTE", "/api/admin/restaurant/menu-items", true],
  ["GERENTE", "/api/admin/restaurant/orders", true],

  // ── SUPER_ADMIN: todo ──
  ["SUPER_ADMIN", "/api/admin/restaurant/staff", true],
  ["SUPER_ADMIN", "/api/admin/restaurant/ubicaciones", true],
];

let ok = 0, mal = 0;
for (const [rol, ruta, esperado] of casos) {
  const real = permite(rol, ruta);
  if (real === esperado) ok++;
  else { mal++; console.log(`  ✗ ${rol} ${ruta}: esperaba ${esperado}, dio ${real}`); }
}

console.log(`\n  ✓ ${ok} correctos`);
console.log(`  ✗ ${mal} fallos\n`);
if (mal > 0) process.exit(1);
