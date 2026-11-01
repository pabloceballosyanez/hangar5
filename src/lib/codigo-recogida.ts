import { prisma } from "@/lib/prisma";

/**
 * Código de recogida.
 *
 * Es la forma de comprobar que quien recoge un pedido es quien lo pagó.
 * En el café, sin esto, cualquiera podría decir "vengo por el pedido de
 * Juan" y llevárselo.
 *
 * ── Por qué cuatro caracteres ────────────────────────────────────────
 * Tiene que poder dictarse por teléfono, leerse de una pantalla a un
 * metro, y teclearse con una mano. Un folio de base de datos
 * (cmvx0zjt00003) no cumple nada de eso.
 *
 * ── Por qué este alfabeto ────────────────────────────────────────────
 * Sin O, sin 0, sin I, sin 1, sin L. Esos pares se confunden al leer y
 * al escribir, y son la causa número uno de códigos que "no existen".
 * Quedan 30 caracteres: 30⁴ = 810,000 combinaciones, de sobra para que
 * nunca se repitan dentro de la misma temporada.
 */

const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generarCodigo(): string {
  let codigo = "";
  for (let i = 0; i < 4; i++) {
    codigo += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
  }
  return codigo;
}

/**
 * Genera un código que no esté en uso.
 *
 * Se reintenta unas cuantas veces: con 810 mil combinaciones, chocar
 * es rarísimo, pero si el local crece y hay muchos pedidos abiertos a
 * la vez, conviene no confiar en la suerte.
 */
export async function generarCodigoUnico(): Promise<string> {
  for (let intento = 0; intento < 12; intento++) {
    const codigo = generarCodigo();
    const existe = await prisma.order.findUnique({
      where: { codigoRecogida: codigo },
      select: { id: true },
    });
    if (!existe) return codigo;
  }
  throw new Error("No se pudo generar un código de recogida");
}

/** Normaliza lo que teclea el barista: mayúsculas y sin espacios. */
export function normalizarCodigo(entrada: string): string {
  return entrada.trim().toUpperCase().replace(/\s+/g, "");
}

/**
 * Busca el pedido por su código, listo para entregar.
 *
 * Devuelve null si no existe. El llamador decide qué mensaje dar:
 * "no existe" y "ya fue entregado" son casos distintos y conviene
 * decirlos distinto.
 */
export async function buscarPorCodigo(codigo: string) {
  const limpio = normalizarCodigo(codigo);
  if (limpio.length !== 4) return null;

  return prisma.order.findUnique({
    where: { codigoRecogida: limpio },
    include: {
      orderItems: { include: { menuItem: true, variant: true, modifiers: true } },
      ubicacion: true,
      table: true,
    },
  });
}

/** Marca el pedido como entregado. */
export async function marcarEntregado(orderId: string) {
  const ahora = new Date();

  return prisma.$transaction(async (tx) => {
    const orden = await tx.order.findUnique({ where: { id: orderId } });
    if (!orden) throw new Error("NO_EXISTE");
    if (orden.entregadoAt) throw new Error("YA_ENTREGADO");

    await tx.orderStatusEvent.create({
      data: { orderId, fromStatus: orden.status, toStatus: "SERVED" },
    });

    return tx.order.update({
      where: { id: orderId },
      data: { entregadoAt: ahora, status: "SERVED" },
    });
  });
}
