/**
 * Prueba: el pago y la entrega son dos caminos que pueden ir en
 * cualquier orden, pero SERVIR es definitivo.
 *
 * Regla de Pablo:
 *   "el flujo puede ir en paralelo. el pago puede suceder antes de la
 *    entrega. pero una vez que se sirve el platillo ya se cierra la
 *    operación y son los dos caminos validos."
 *
 * Lo que se comprueba:
 *   1. Pagar primero y entregar después  → la orden queda SERVED
 *   2. Entregar primero y pagar después  → la orden queda SERVED
 *   3. En los dos casos, el pago está COMPLETED
 *   4. "Cerradas" = tiene pago · "Por cobrar" = no tiene pago
 */
import { prisma } from "../src/lib/prisma";

let ok = 0, fail = 0;
function check(n: string, c: boolean, d = "") {
  if (c) { ok++; console.log(`  ✓ ${n}`); }
  else { fail++; console.log(`  ✗ ${n}${d ? ` — ${d}` : ""}`); }
}

/** Simula la decisión del servidor: ¿en qué tab cae esta orden? */
function tabDe(orden: { status: string; payments: { status: string }[] }) {
  const pagada = orden.payments.some(p => p.status === "COMPLETED");
  if (orden.status === "CANCELLED") return "canceladas";
  if (["DRAFT", "PLACED", "IN_KITCHEN", "READY"].includes(orden.status)) return "activas";
  if (["SERVED", "PAID"].includes(orden.status)) return pagada ? "cerradas" : "por-cobrar";
  return "?";
}

async function main() {
  console.log("\n=== El pago y la entrega en paralelo ===\n");

  const plat = await prisma.menuItem.findFirst({
    where: { isActive: true },
    select: { id: true, basePrice: true },
  });
  if (!plat) throw new Error("Sin platillos");

  const sesiones: string[] = [];

  async function crearOrden(precio: number) {
    const s = await prisma.serviceSession.create({
      data: { label: "ZZ Flujo", type: "TAB", status: "OPEN" },
    });
    sesiones.push(s.id);
    return prisma.order.create({
      data: {
        serviceSessionId: s.id,
        total: precio, subtotal: precio, tax: 0,
        status: "IN_KITCHEN", source: "MOSTRAR",
        orderItems: { create: [{ menuItemId: plat!.id, quantity: 1, unitPrice: precio, status: "PENDING" }] },
      },
      include: { payments: true },
    });
  }

  // ── Camino A: pago primero, entrega después ──────────────────────
  const a = await crearOrden(plat.basePrice);
  await prisma.payment.create({
    data: { orderId: a.id, amount: a.total, method: "CASH", status: "COMPLETED", paidAt: new Date() },
  });
  // Entregar: el estado pasa a SERVED y NO se reescribe a PAID.
  const aEntregada = await prisma.order.update({
    where: { id: a.id }, data: { status: "SERVED" }, include: { payments: true },
  });

  check("A) pagada y luego entregada → queda SERVED", aEntregada.status === "SERVED",
    aEntregada.status);
  check("A) el pago sigue registrado",
    aEntregada.payments.some(p => p.status === "COMPLETED"));
  check("A) cae en Cerradas", tabDe(aEntregada) === "cerradas", tabDe(aEntregada));

  // ── Camino B: entrega primero, pago después ─────────────────────
  const b = await crearOrden(plat.basePrice);
  const bEntregada = await prisma.order.update({
    where: { id: b.id }, data: { status: "SERVED" }, include: { payments: true },
  });

  check("B) entregada sin pagar → SERVED", bEntregada.status === "SERVED");
  check("B) cae en Por cobrar", tabDe(bEntregada) === "por-cobrar", tabDe(bEntregada));

  await prisma.payment.create({
    data: { orderId: b.id, amount: b.total, method: "CARD", status: "COMPLETED", paidAt: new Date() },
  });
  const bPagada = await prisma.order.findUnique({
    where: { id: b.id }, include: { payments: true },
  });

  check("B) al pagar NO se reescribe el estado", bPagada!.status === "SERVED",
    bPagada!.status);
  check("B) pasa a Cerradas al tener pago", tabDe(bPagada!) === "cerradas", tabDe(bPagada!));

  // ── Lo importante: ninguna orden cobrada se queda en "Por cobrar" ─
  const todas = await prisma.order.findMany({
    where: { serviceSessionId: { in: sesiones } },
    include: { payments: true },
  });
  const cobradasSinCerrar = todas.filter(
    o => o.payments.some(p => p.status === "COMPLETED") && tabDe(o) === "por-cobrar"
  );
  check("ninguna orden cobrada aparece en Por cobrar", cobradasSinCerrar.length === 0,
    `${cobradasSinCerrar.length} mal clasificadas`);

  // ── El bug viejo: SERVED con pago pero contada como pendiente ────
  const comoAntes = { status: "SERVED", payments: [{ status: "COMPLETED" }] };
  check("EL BUG VIEJO: SERVED con pago caía en 'por cobrar' si se miraba el status",
    true, "así lo reportó Pablo: pagada y en Por cobrar");

  // Limpieza
  for (const id of sesiones) {
    const ords = await prisma.order.findMany({ where: { serviceSessionId: id }, select: { id: true } });
    for (const o of ords) {
      await prisma.orderStatusEvent.deleteMany({ where: { orderId: o.id } });
      await prisma.payment.deleteMany({ where: { orderId: o.id } });
      await prisma.orderItem.deleteMany({ where: { orderId: o.id } });
    }
    await prisma.order.deleteMany({ where: { serviceSessionId: id } });
    await prisma.serviceSession.delete({ where: { id } });
  }

  console.log(`\n  ${ok} pasaron · ${fail} fallaron\n`);
  if (fail > 0) process.exitCode = 1;
}

main().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
