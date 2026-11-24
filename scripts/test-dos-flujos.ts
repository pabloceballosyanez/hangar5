/**
 * Prueba de los dos carriles: cocina y dinero.
 *
 * El caso real que la motivó: Pedro pidió $2.05, cocina lo marcó READY,
 * alguien cobró, la sesión se cerró... y la orden quedó trabada en READY
 * sin forma de entregarla. El pago estaba, la entrega no, y no había
 * camino para completarla.
 */
import {
  estaPagada, estaEntregada, estaTerminada,
  etiquetaPreparacion, etiquetaPago, enGrupo,
} from "@/lib/flujo-orden";

let ok = 0, mal = 0;
function check(nombre: string, real: unknown, esperado: unknown) {
  const bien = JSON.stringify(real) === JSON.stringify(esperado);
  if (bien) ok++;
  else { mal++; console.log(`  ✗ ${nombre}\n      esperaba ${JSON.stringify(esperado)}, dio ${JSON.stringify(real)}`); }
}

const f = (d: string) => new Date(d);

console.log("\n── 1. El caso de Pedro ─────────────────────────────────");
/* Pagada, lista, sin entregar: el estado que antes era imposible. */
const pedro = { status: "READY", paidAt: f("2026-11-23T20:36:51Z"), entregadoAt: null };

check("está pagada", estaPagada(pedro), true);
check("NO está entregada", estaEntregada(pedro), false);
check("NO está terminada", estaTerminada(pedro), false);
check("preparación dice Lista", etiquetaPreparacion(pedro), "Lista");
check("pago dice Cobrada", etiquetaPago(pedro), "Cobrada");
check("sigue en 'activas'", enGrupo(pedro, "activas"), true);
check("también en 'por-entregar'", enGrupo(pedro, "por-entregar"), true);
check("NO en 'cerradas'", enGrupo(pedro, "cerradas"), false);

console.log("\n── 2. Los dos carriles van por separado ────────────────");
const soloPagada = { status: "PLACED", paidAt: f("2026-11-23T10:00:00Z"), entregadoAt: null };
check("pagada pero no entregada", estaTerminada(soloPagada), false);
check("la cocina sigue en 'Recibida'", etiquetaPreparacion(soloPagada), "Recibida");

const soloEntregada = { status: "READY", paidAt: null, entregadoAt: f("2026-11-23T10:00:00Z") };
check("entregada pero no pagada", estaTerminada(soloEntregada), false);
check("preparación dice Entregada", etiquetaPreparacion(soloEntregada), "Entregada");
check("pago dice Por cobrar", etiquetaPago(soloEntregada), "Por cobrar");

console.log("\n── 3. Las dos cosas: cerrada ───────────────────────────");
const completa = { status: "READY", paidAt: f("2026-11-23T10:00:00Z"), entregadoAt: f("2026-11-23T10:05:00Z") };
check("está terminada", estaTerminada(completa), true);
check("en 'cerradas'", enGrupo(completa, "cerradas"), true);
check("NO en 'activas'", enGrupo(completa, "activas"), false);

console.log("\n── 4. Órdenes viejas (sin fechas, solo status) ─────────");
const viejaPaid = { status: "PAID", paidAt: null, entregadoAt: null };
check("PAID vieja cuenta como pagada", estaPagada(viejaPaid), true);
check("PAID vieja cuenta como entregada", estaEntregada(viejaPaid), true);
check("PAID vieja está cerrada", enGrupo(viejaPaid, "cerradas"), true);

const viejaServed = { status: "SERVED", paidAt: null, entregadoAt: null };
check("SERVED vieja entregada", estaEntregada(viejaServed), true);
check("SERVED vieja NO pagada", estaPagada(viejaServed), false);
check("SERVED vieja va a 'por cobrar'", enGrupo(viejaServed, "por-cobrar"), true);

console.log("\n── 5. Canceladas ───────────────────────────────────────");
const canc = { status: "CANCELLED", paidAt: null, entregadoAt: null };
check("en 'canceladas'", enGrupo(canc, "canceladas"), true);
check("NO en 'activas'", enGrupo(canc, "activas"), false);
check("etiqueta Cancelada", etiquetaPreparacion(canc), "Cancelada");

console.log("\n── 6. Los cuatro métodos de pago ───────────────────────");
const base = { status: "READY", paidAt: f("2026-11-23T10:00:00Z"), entregadoAt: null };
check("efectivo", etiquetaPago({ ...base, metodoPago: "CASH" }), "Cobrada");
check("tarjeta", etiquetaPago({ ...base, metodoPago: "CARD" }), "Tarjeta");
check("transferencia", etiquetaPago({ ...base, metodoPago: "TRANSFER" }), "Transferencia");
check("a cuenta", etiquetaPago({ ...base, metodoPago: "ON_ACCOUNT" }), "A cuenta");

console.log("\n── 7. Incompletas que deben seguir visibles ────────────");
const enCocina = { status: "IN_KITCHEN", paidAt: null, entregadoAt: null };
check("preparando", etiquetaPreparacion(enCocina), "Preparando");
check("en activas", enGrupo(enCocina, "activas"), true);
check("por cobrar: no (aún no salió)", enGrupo(enCocina, "por-cobrar"), false);

console.log(`\n  ✓ ${ok} correctos`);
console.log(`  ✗ ${mal} fallos\n`);
if (mal > 0) process.exit(1);
