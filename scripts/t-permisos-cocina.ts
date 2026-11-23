import { puede } from "@/lib/permisos";

const casos: Array<[string, string, boolean]> = [
  // rol, zona, ¿debe poder?
  ["COCINERO", "operacion", true],
  ["COCINERO", "preparacion", true],
  ["COCINERO", "inventario", true],
  ["COCINERO", "menu", false],
  ["COCINERO", "reportes", false],
  ["COCINERO", "configuracion", false],
  ["BAR", "operacion", true],
  ["BAR", "menu", false],
  ["BAR", "configuracion", false],
  // los demás no cambian
  ["MESERO", "operacion", true],
  ["MESERO", "menu", false],
  ["CAJA", "operacion", true],
  ["CAJA", "preparacion", false],
  ["GERENTE", "menu", true],
  ["SUPER_ADMIN", "admin", true],
];

let ok = 0, mal = 0;
for (const [rol, zona, esperado] of casos) {
  const real = puede(rol, zona as any);
  if (real === esperado) { ok++; }
  else { mal++; console.log(`  ✗ ${rol} / ${zona}: esperaba ${esperado}, dio ${real}`); }
}
console.log(`\n  ✓ ${ok} correctos`);
console.log(`  ✗ ${mal} fallos`);
