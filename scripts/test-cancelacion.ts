import { repartirCancelacion } from "../src/lib/cancelacion";

/**
 * Prueba: cancelación parcial de una orden.
 *
 * El caso real que motivó esto: se quemó el último insumo o se cayó la
 * última cerveza, con parte del pedido ya entregado. Cancelar la orden
 * entera hacía que el sistema dijera "no se cobra" sobre lo que el
 * cliente ya se comió.
 *
 * Regla: lo entregado se cobra, lo pendiente se cancela.
 */

let ok = 0;
let fail = 0;

function check(nombre: string, cond: boolean, detalle?: string) {
  if (cond) {
    ok++;
    console.log(`  ✓ ${nombre}`);
  } else {
    fail++;
    console.log(`  ✗ ${nombre}${detalle ? " — " + detalle : ""}`);
  }
}

const item = (id: string, status: string, quantity = 1, unitPrice = 10000) => ({
  id,
  status,
  quantity,
  unitPrice,
});

console.log("\n=== 1. TODO PENDIENTE: se cancela completo ===");
{
  const r = repartirCancelacion([
    item("a", "PENDING"),
    item("b", "PENDING"),
  ]);
  check("los 2 se cancelan", r.seCancelan.length === 2);
  check("nada se cobra", r.seCobran.length === 0);
  check("monto cobrable = 0", r.montoCobrable === 0);
  check("todoCancelado = true", r.todoCancelado === true);
}

console.log("\n=== 2. UNO SERVIDO, UNO PENDIENTE ===");
{
  const r = repartirCancelacion([
    item("a", "SERVED", 1, 10000),   // ya se comió
    item("b", "PENDING", 1, 5000),   // no salió
  ]);
  check("solo el pendiente se cancela", r.seCancelan.length === 1);
  check("el pendiente es 'b'", r.seCancelan[0].id === "b");
  check("el servido se cobra", r.seCobran.length === 1);
  check("el servido es 'a'", r.seCobran[0].id === "a");
  check("monto cobrable = $100", r.montoCobrable === 10000, `fue ${r.montoCobrable}`);
  check("monto cancelado = $50", r.montoCancelado === 5000, `fue ${r.montoCancelado}`);
  check("todoCancelado = false", r.todoCancelado === false);
}

console.log("\n=== 3. LISTO PERO NO ENTREGADO (ya se cocinó) ===");
{
  const r = repartirCancelacion([
    item("a", "READY", 2, 10000),
    item("b", "PENDING", 1, 3000),
  ]);
  check("el READY se cobra: el insumo ya se gastó", r.seCobran.length === 1);
  check("cantidad 2 respetada", r.montoCobrable === 20000, `fue ${r.montoCobrable}`);
  check("el pendiente se cancela", r.seCancelan[0].id === "b");
}

console.log("\n=== 4. TODO SERVIDO: no se cancela nada ===");
{
  const r = repartirCancelacion([
    item("a", "SERVED", 1, 10000),
    item("b", "SERVED", 1, 7000),
  ]);
  check("nada se cancela", r.seCancelan.length === 0);
  check("todo se cobra", r.seCobran.length === 2);
  check("monto = $170", r.montoCobrable === 17000, `fue ${r.montoCobrable}`);
  check("todoCancelado = false", r.todoCancelado === false);
}

console.log("\n=== 5. ÍTEM YA CANCELADO ANTES: no cuenta ===");
{
  const r = repartirCancelacion([
    item("a", "CANCELLED"),
    item("b", "PENDING"),
  ]);
  check("el ya cancelado no se re-cancela", r.seCancelan.length === 1);
  check("tampoco se cobra", r.seCobran.length === 0);
  check("todoCancelado = true", r.todoCancelado === true);
}

console.log("\n=== 6. ORDEN VACÍA: no rompe ===");
{
  const r = repartirCancelacion([]);
  check("sin ítems, todoCancelado = true", r.todoCancelado === true);
  check("monto 0", r.montoCobrable === 0);
}

console.log(`\n${ok} pasaron, ${fail} fallaron`);
if (fail > 0) process.exitCode = 1;

console.log("\n=== 7. EL TOTAL NO DEBE INCLUIR LO CANCELADO ===");
{
  // Caso real de producción: orden de $470 con una pizza de $280 que se
  // canceló. El total se quedaba en $470 y el cliente pagaba la pizza
  // que nunca recibió.
  const items = [
    item("pizza", "CANCELLED", 1, 28000),
    item("fruta", "SERVED", 1, 8000),
    item("huevo", "SERVED", 1, 11000),
  ];
  const r = repartirCancelacion(items);
  check("lo cobrable es $190, no $470", r.montoCobrable === 19000, `fue $${r.montoCobrable / 100}`);
  check("la pizza no entra al cobro", r.seCobran.every(i => i.id !== "pizza"));
  check("se cobran 2 ítems", r.seCobran.length === 2);
}
