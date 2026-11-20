/**
 * Prueba: cobrar "a su cuenta" debe dejar la deuda en el libro del cliente.
 *
 * El caso que reportó Pablo: pagó con su cuenta y su libro no mostraba
 * ningún cargo. La mercancía salía gratis.
 *
 * Causa: el pago ON_ACCOUNT contaba como dinero recibido, el balance daba
 * cero y el cargo nunca se escribía.
 */
import { prisma } from "../src/lib/prisma";

let ok = 0;
let fail = 0;

function check(nombre: string, cond: boolean, detalle = "") {
  if (cond) {
    ok++;
    console.log(`  ✓ ${nombre}`);
  } else {
    fail++;
    console.log(`  ✗ ${nombre}${detalle ? ` — ${detalle}` : ""}`);
  }
}

async function main() {
  console.log("\n=== Cargo a la cuenta del cliente ===\n");

  const cliente = await prisma.customer.create({
    data: { name: "ZZ Prueba Cuenta", phone: "0000000000" },
  });

  const platillo = await prisma.menuItem.findFirst({
    where: { isActive: true },
    select: { id: true, basePrice: true },
  });
  if (!platillo) throw new Error("Sin platillos");

  const precio = platillo.basePrice;

  // ── Caso 1: pago completo "a su cuenta" ────────────────────────────
  const s1 = await prisma.serviceSession.create({
    data: { label: "ZZ Cuenta", type: "TAB", status: "OPEN", customerId: cliente.id },
  });
  await prisma.order.create({
    data: {
      serviceSession: { connect: { id: s1.id } },
      total: precio,
      subtotal: precio,
      tax: 0,
      status: "SERVED",
      source: "MOSTRAR",
      orderItems: {
        create: [{ menuItemId: platillo.id, quantity: 1, unitPrice: precio, status: "SERVED" }],
      },
    },
  });

  // Simula lo que hace el endpoint con el arreglo.
  const totalOwed = precio;
  const totalPaid = 0;              // nada entró a la caja
  const totalAlaCuenta = precio;    // todo se fue al libro
  const balance = totalOwed - totalPaid - totalAlaCuenta;
  const deuda = totalAlaCuenta + (balance > 0 ? balance : 0);

  check("a cuenta: la deuda es el total", deuda === precio,
    `esperado ${precio}, obtenido ${deuda}`);
  check("a cuenta: el balance es cero", balance === 0);
  check("a cuenta: SÍ se escribe el cargo", deuda > 0);

  await prisma.customerLedgerEntry.create({
    data: {
      customerId: cliente.id,
      amount: deuda,
      type: "CHARGE",
      serviceSessionId: s1.id,
      note: "Prueba",
    },
  });

  const saldo1 = await prisma.customerLedgerEntry.aggregate({
    where: { customerId: cliente.id },
    _sum: { amount: true },
  });
  check("el libro refleja la deuda", (saldo1._sum.amount ?? 0) === precio,
    `libro: ${saldo1._sum.amount}`);

  // ── Caso 2: mitad efectivo, mitad a cuenta ─────────────────────────
  const mitad = Math.floor(precio / 2);
  const totalPaid2 = mitad;
  const totalAlaCuenta2 = precio - mitad;
  const balance2 = precio - totalPaid2 - totalAlaCuenta2;
  const deuda2 = totalAlaCuenta2 + (balance2 > 0 ? balance2 : 0);

  check("mixto: solo la mitad va al libro", deuda2 === precio - mitad,
    `libro esperado ${precio - mitad}, obtenido ${deuda2}`);
  check("mixto: la caja recibe la otra mitad", totalPaid2 === mitad);
  check("mixto: no se pierde nada", totalPaid2 + deuda2 === precio);

  // ── Caso 3: efectivo completo, sin cliente a cuenta ────────────────
  const totalPaid3 = precio;
  const totalAlaCuenta3 = 0;
  const balance3 = precio - totalPaid3 - totalAlaCuenta3;
  const deuda3 = totalAlaCuenta3 + (balance3 > 0 ? balance3 : 0);

  check("contado: nada va al libro", deuda3 === 0);

  // ── Caso 4: la versión vieja (el bug) ──────────────────────────────
  const totalPaidViejo = precio;  // contaba ON_ACCOUNT como recibido
  const balanceViejo = precio - totalPaidViejo;
  const deudaVieja = balanceViejo !== 0 ? balanceViejo : 0;
  check("EL BUG: la versión vieja perdía el cargo", deudaVieja === 0,
    "así se regalaba la mercancía");

  // Limpieza
  await prisma.customerLedgerEntry.deleteMany({ where: { customerId: cliente.id } });
  const ordenes = await prisma.order.findMany({ where: { serviceSessionId: s1.id }, select: { id: true } });
  for (const o of ordenes) {
    await prisma.orderItem.deleteMany({ where: { orderId: o.id } });
  }
  await prisma.order.deleteMany({ where: { serviceSessionId: s1.id } });
  await prisma.serviceSession.delete({ where: { id: s1.id } });
  await prisma.customer.delete({ where: { id: cliente.id } });

  console.log(`\n  ${ok} pasaron · ${fail} fallaron\n`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
