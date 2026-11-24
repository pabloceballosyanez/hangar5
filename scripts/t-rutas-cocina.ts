import { puede, zonaDeRuta } from "@/lib/permisos";

const rutas = ["/solo", "/admin/restaurant/orders", "/admin/restaurant/menu-items",
               "/admin/restaurant/reports", "/admin/restaurant/staff",
               "/admin/restaurant/ingredients", "/kds", "/waiter"];

console.log("  COCINERO — qué abre cada ruta:");
for (const r of rutas) {
  const z = zonaDeRuta(r);
  const abre = z === null ? "solo identificarse" : (puede("COCINERO", z) ? "SÍ" : "NO");
  console.log(`    ${r.padEnd(34)} zona=${String(z).padEnd(14)} ${abre}`);
}
console.log();
console.log("  /solo exige 'operacion':", puede("COCINERO", "operacion") ? "✓ pasa" : "✗ bloqueado");
