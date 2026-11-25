import { prisma } from "@/lib/prisma";

/* Simula los filtros con las 3 formas de "pagada". */
const pagadaOR = [
  { paidAt: { not: null } },
  { status: "PAID" },
  { payments: { some: { status: "COMPLETED" } } },
];
const entregadaOR = [
  { entregadoAt: { not: null } },
  { status: { in: ["SERVED", "PAID"] } },
];
const noCancelada = { status: { not: "CANCELLED" } };

async function grupo(nombre: string, AND: any[]) {
  const n = await prisma.order.count({ where: { AND } });
  console.log(`  ${nombre.padEnd(16)} ${n}`);
  return n;
}

(async () => {
  const total = await prisma.order.count();
  console.log(`\n  total de órdenes: ${total}\n`);
  const act = await grupo("activas", [noCancelada, { NOT: { OR: entregadaOR } }]);
  const ent = await grupo("por-entregar", [noCancelada, { OR: pagadaOR }, { NOT: { OR: entregadaOR } }]);
  const cob = await grupo("por-cobrar", [noCancelada, { OR: entregadaOR }, { NOT: { OR: pagadaOR } }]);
  const cer = await grupo("cerradas", [noCancelada, { OR: pagadaOR }, { OR: entregadaOR }]);
  const can = await grupo("canceladas", [{ status: "CANCELLED" }]);
  /* Los tabs son VISTAS, no una partición: una orden pagada que sigue en
     la cocina aparece en "activas" y en "por-entregar" a la vez. Pablo:
     "una orden puede estar en dos tabs, son vistas distintas". Por eso la
     suma puede pasar del total; lo que importa es que ninguna orden quede
     fuera de todos los tabs. */
  const ids = new Map<string, string[]>();
  const grupos: Array<[string, any]> = [
    ["activas", { AND: [noCancelada, { NOT: { OR: entregadaOR } }] }],
    ["por-entregar", { AND: [noCancelada, { OR: pagadaOR }, { NOT: { OR: entregadaOR } }] }],
    ["por-cobrar", { AND: [noCancelada, { OR: entregadaOR }, { NOT: { OR: pagadaOR } }] }],
    ["cerradas", { AND: [noCancelada, { OR: pagadaOR }, { OR: entregadaOR }] }],
    ["canceladas", { status: "CANCELLED" }],
  ];
  for (const [n, w] of grupos) {
    const o = await prisma.order.findMany({ where: w as any, select: { id: true } });
    for (const x of o) ids.set(x.id, [...(ids.get(x.id) ?? []), n]);
  }
  const sinTab = total - ids.size;
  const enDos = [...ids.values()].filter((g) => g.length > 1).length;
  console.log(`\n  órdenes sin ningún tab: ${sinTab}`);
  console.log(`  órdenes en dos tabs:    ${enDos}  (normal, son vistas)`);
  if (sinTab !== 0) {
    console.log("  ✗ hay órdenes invisibles");
    process.exit(1);
  }
  console.log("  ✓ todas las órdenes caen en al menos un tab");
})();
