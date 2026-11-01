/**
 * Prueba del flujo del café: código de recogida y entrega.
 *
 * Ejecutar:
 *   DATABASE_URL="file:$PWD/prisma/hangar5-prod.db" npx tsx scripts/test-cafe.ts
 */
import { prisma } from "../src/lib/prisma";
import { generarCodigoUnico, buscarPorCodigo, marcarEntregado, normalizarCodigo, generarCodigo } from "../src/lib/codigo-recogida";

let fallos = 0;
const ok = (cond: boolean, etiqueta: string, detalle = "") => {
  console.log(`  ${cond ? "✓" : "✗"} ${etiqueta}${detalle ? `: ${detalle}` : ""}`);
  if (!cond) fallos++;
};

async function main() {
  console.log("=== PRUEBA: flujo del café ===\n");

  // ── 1. Formato del código ─────────────────────────────────────
  console.log("── Código de recogida ──");
  const muestras = Array.from({ length: 200 }, () => generarCodigo());
  const todos4 = muestras.every((c) => c.length === 4);
  ok(todos4, "siempre 4 caracteres");

  const sinConfusas = muestras.every((c) => !/[OI01L]/.test(c));
  ok(sinConfusas, "sin letras que se confunden (O, I, 0, 1, L)", "200 muestras");

  const soloValidos = muestras.every((c) => /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/.test(c));
  ok(soloValidos, "solo caracteres del alfabeto permitido");

  const distintos = new Set(muestras).size;
  ok(distintos > 180, "los códigos no se repiten", `${distintos} únicos de 200`);

  ok(normalizarCodigo(" a3f2 ") === "A3F2", "normaliza lo que teclea el barista", '" a3f2 " → "A3F2"');

  // ── 2. Pedido real con código ─────────────────────────────────
  console.log("\n── Pedido y entrega ──");
  const ubicacion = await prisma.ubicacion.findUnique({ where: { clave: "cafe" } });
  const mesa = await prisma.table.findFirst({ where: { isActive: true } });
  const platillo = await prisma.menuItem.findFirst({ where: { isActive: true, basePrice: { gt: 0 } } });

  if (!ubicacion || !mesa || !platillo) {
    console.log("  Faltan datos base.");
    return;
  }

  const codigo = await generarCodigoUnico();
  const orden = await prisma.order.create({
    data: {
      ubicacionId: ubicacion.id,
      tableId: mesa.id,
      source: "TEST",
      status: "IN_KITCHEN",
      customerName: "Cliente Café Prueba",
      subtotal: 9000,
      tax: 1241,
      total: 9000,
      codigoRecogida: codigo,
    },
  });
  await prisma.orderItem.create({
    data: { orderId: orden.id, menuItemId: platillo.id, quantity: 2, unitPrice: platillo.basePrice },
  });

  ok(!!codigo, "código generado", codigo);

  // Buscar por código (lo que hace el barista)
  const encontrado = await buscarPorCodigo(codigo.toLowerCase());
  ok(encontrado?.id === orden.id, "se encuentra minúsculas", "el barista no debería pelear con mayúsculas");

  const noExiste = await buscarPorCodigo("ZZZZ");
  ok(noExiste === null, "código inexistente devuelve null");

  const corto = await buscarPorCodigo("AB");
  ok(corto === null, "código demasiado corto se rechaza");

  // Entregar
  await marcarEntregado(orden.id);
  const despues = await prisma.order.findUnique({ where: { id: orden.id } });
  ok(!!despues?.entregadoAt, "queda marcado como entregado");
  ok(despues?.status === "SERVED", "estado pasa a SERVED", despues?.status ?? "");

  // Doble entrega
  try {
    await marcarEntregado(orden.id);
    ok(false, "no se puede entregar dos veces", "debió fallar");
  } catch (e) {
    ok((e as Error).message === "YA_ENTREGADO", "no se puede entregar dos veces");
  }

  // El código sigue apuntando al pedido entregado
  const yaEntregado = await buscarPorCodigo(codigo);
  ok(!!yaEntregado?.entregadoAt, "buscar un código entregado lo informa", "para no entregarlo de nuevo");

  // ── Limpieza ─────────────────────────────────────────────────
  await prisma.orderItem.deleteMany({ where: { orderId: orden.id } });
  await prisma.orderStatusEvent.deleteMany({ where: { orderId: orden.id } });
  await prisma.order.delete({ where: { id: orden.id } });
  console.log("\n  (datos de prueba borrados)");

  console.log(`\n${fallos === 0 ? "✓ TODAS LAS PRUEBAS PASARON" : `✗ ${fallos} prueba(s) fallaron`}`);
  if (fallos > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error("ERROR:", e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
