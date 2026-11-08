/**
 * Prueba: la matriz de permisos.
 *
 * El punto de todo esto es que el ROL decida, no la cookie. Esta prueba
 * fija el contrato: si alguien cambia permisos.ts sin pensar, aquí se ve.
 *
 * Ejecutar:
 *   npx tsx scripts/test-permisos.ts
 */
import { puede, zonaDeRuta, inicioDe, ROLES, type Zona } from "../src/lib/permisos";

let fallos = 0;
const ok = (cond: boolean, etiqueta: string) => {
  console.log(`  ${cond ? "✓" : "✗"} ${etiqueta}`);
  if (!cond) fallos++;
};

const PUEDE: Array<[string, Zona, boolean]> = [
  // Super admin: todo
  ["SUPER_ADMIN", "operacion", true],
  ["SUPER_ADMIN", "menu", true],
  ["SUPER_ADMIN", "configuracion", true],
  ["SUPER_ADMIN", "reportes", true],
  ["SUPER_ADMIN", "inventario", true],
  ["SUPER_ADMIN", "preparacion", true],
  ["SUPER_ADMIN", "admin", true],

  // Gerente: el restaurante, pero no reparte accesos
  ["GERENTE", "operacion", true],
  ["GERENTE", "menu", true],
  ["GERENTE", "reportes", true],
  ["GERENTE", "inventario", true],
  ["GERENTE", "admin", true],
  ["GERENTE", "configuracion", false],

  // Caja: cobra y cuadra
  ["CAJA", "operacion", true],
  ["CAJA", "reportes", true],
  ["CAJA", "menu", false],
  ["CAJA", "configuracion", false],
  ["CAJA", "inventario", false],

  // Mesero: toma y sirve. Nada de precios ni configuración
  ["MESERO", "operacion", true],
  ["MESERO", "preparacion", true],
  ["MESERO", "menu", false],
  ["MESERO", "reportes", false],
  ["MESERO", "configuracion", false],
  ["MESERO", "admin", false],

  // Cocina: prepara
  ["COCINERO", "preparacion", true],
  ["COCINERO", "inventario", true],
  ["COCINERO", "operacion", false],
  ["COCINERO", "menu", false],
  ["COCINERO", "admin", false],

  // Barra igual que cocina
  ["BAR", "preparacion", true],
  ["BAR", "inventario", true],
  ["BAR", "menu", false],
];

const RUTAS: Array<[string, Zona | null]> = [
  ["/admin/restaurant", "admin"],
  ["/admin", "admin"],
  ["/admin/restaurant/staff", "configuracion"],
  ["/admin/restaurant/ubicaciones", "configuracion"],
  ["/admin/restaurant/tables", "configuracion"],
  ["/admin/restaurant/reports", "reportes"],
  ["/admin/restaurant/reports/pl", "reportes"],
  ["/admin/restaurant/audit", "reportes"],
  ["/admin/restaurant/fixed-expenses", "reportes"],
  ["/admin/restaurant/ingredients", "inventario"],
  ["/admin/restaurant/inventory/scan", "inventario"],
  ["/admin/restaurant/recipes", "inventario"],
  ["/admin/restaurant/menu-items", "menu"],
  ["/admin/restaurant/categories", "menu"],
  ["/admin/restaurant/tipos", "menu"],
  ["/admin/restaurant/modifier-groups", "menu"],
  ["/admin/restaurant/orders", "operacion"],
  ["/admin/restaurant/customers", "operacion"],
  ["/admin/restaurant/sessions", "operacion"],
  ["/waiter", "operacion"],
  ["/waiter/session/abc", "operacion"],
  ["/kds", "preparacion"],
  ["/cafe/caja", "preparacion"],
];

async function main() {
  console.log("=== PRUEBA: matriz de permisos ===\n");

  console.log("── Zonas por rol ──");
  for (const [rol, zona, esperado] of PUEDE) {
    ok(puede(rol, zona) === esperado, `${rol.padEnd(12)} ${zona.padEnd(14)} → ${esperado ? "sí" : "no"}`);
  }

  console.log("\n── Rutas → zona ──");
  for (const [ruta, esperado] of RUTAS) {
    const real = zonaDeRuta(ruta);
    ok(real === esperado, `${ruta.padEnd(36)} → ${real ?? "null"}`);
  }

  console.log("\n── A dónde entra cada rol ──");
  ok(inicioDe("SUPER_ADMIN").startsWith("/admin"), "SUPER_ADMIN → admin");
  ok(inicioDe("GERENTE").startsWith("/admin"), "GERENTE → admin");
  ok(inicioDe("MESERO") === "/waiter", "MESERO → mesero");
  ok(inicioDe("COCINERO") === "/kds", "COCINERO → KDS");
  ok(inicioDe("BAR") === "/kds", "BAR → KDS");
  ok(inicioDe(null) === "/login", "sin rol → login");
  ok(inicioDe("INVENTADO") === "/login", "rol inventado → login");

  console.log("\n── Casos que antes fallaban ──");
  // El mesero podía tocar endpoints de admin porque cualquier cookie servía
  ok(!puede("MESERO", "admin"), "un mesero NO entra al panel de admin");
  ok(!puede("MESERO", "menu"), "un mesero NO toca el menú ni los precios");
  ok(!puede("COCINERO", "reportes"), "cocina NO ve reportes de dinero");
  ok(!puede("MESERO", "configuracion"), "un mesero NO toca staff");
  // Cheny ya no necesita la contraseña maestra
  ok(puede("GERENTE", "admin"), "Cheny (gerente) entra al admin con su PIN");

  console.log("\n── Todos los roles declarados son válidos ──");
  const zonasValidas: Zona[] = ["operacion", "preparacion", "menu", "inventario", "reportes", "configuracion", "admin"];
  for (const r of ROLES) {
    const zonas = zonasValidas.filter((z) => puede(r.valor, z));
    ok(zonas.length > 0, `${r.valor} tiene al menos una zona (${zonas.length})`);
  }

  console.log(`\n${fallos === 0 ? "✓ TODAS LAS PRUEBAS PASARON" : `✗ ${fallos} prueba(s) fallaron`}`);
  if (fallos > 0) process.exitCode = 1;
}

main();
