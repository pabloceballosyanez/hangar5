import { prisma } from "@/lib/prisma";
import { calcularCarrito } from "@/lib/calcular-carrito";
import { generarCodigoUnico } from "@/lib/codigo-recogida";

/**
 * Venta directa en el mostrador del café.
 *
 * ── La diferencia con el pedido en línea ────────────────────────────
 * En línea el cliente pide desde su celular y el pago pasa por
 * MercadoPago. Aquí el barista cobra en el momento: efectivo, tarjeta o
 * transferencia, y el pedido nace ya pagado y listo para preparar.
 *
 * ── Cargar a cuenta ─────────────────────────────────────────────────
 * El cliente puede no pagar ahora. Entonces la venta se apunta a su
 * cuenta abierta y se cobra cuando cierre. Para eso hace falta saber
 * quién es: por nombre o correo se busca al cliente; si no existe, se
 * crea. Es lo mismo que hace la reserva web, para que un cliente que
 * reservó por internet y luego pide un café quede en la misma cuenta.
 */

export interface VentaInput {
  items: Array<{ menuItemId: string; cantidad: number }>;
  metodoPago: "CASH" | "CARD" | "TRANSFER" | "CUENTA";
  clienteNombre?: string | null;
  clienteEmail?: string | null;
  notas?: string | null;
}

export type ResultadoVenta =
  | {
      ok: true;
      venta: {
        orderId: string;
        codigo: string | null;
        total: number;
        metodoPago: string;
        cambio?: number;
        clienteNombre: string | null;
      };
    }
  | { ok: false; error: string };

export async function crearVentaMostrador(input: VentaInput): Promise<ResultadoVenta> {
  const ubicacion = await prisma.ubicacion.findUnique({ where: { clave: "cafe" } });
  if (!ubicacion) return { ok: false, error: "El café no está configurado" };

  /* El café no tiene mesas: son todos walk-ins. La venta se apoya
     solo en la ubicación, sin mesa ni cuenta abierta. */

  // El mismo cálculo que usa el pedido en línea: una sola fuente de verdad
  let carrito;
  try {
    carrito = await calcularCarrito(
      input.items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.cantidad }))
    );
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo calcular la venta" };
  }

  /* Los productos tienen que estar marcados para el café. Sin esto,
     el barista podría vender una pizza que la barra no sabe preparar. */
  const marcados = await prisma.menuItemUbicacion.findMany({
    where: {
      ubicacionId: ubicacion.id,
      disponible: true,
      menuItemId: { in: carrito.lineas.map((l) => l.menuItem.id) },
    },
    select: { menuItemId: true },
  });
  const permitidos = new Set(marcados.map((m) => m.menuItemId));
  const fuera = carrito.lineas.filter((l) => !permitidos.has(l.menuItem.id));
  if (fuera.length > 0) {
    return {
      ok: false,
      error: `"${fuera[0].menuItem.name}" no se vende en el café`,
    };
  }

  /* El nombre es obligatorio. En una barra de café el nombre ES el
     identificador del pedido: si dos personas piden un latte, hay que
     saber cuál es cuál. Antes se podía cobrar sin nombre y salían
     pedidos "Sin nombre" que nadie sabía de quién eran. */
  if (!input.clienteNombre?.trim()) {
    return { ok: false, error: "Escribe el nombre de quien pide" };
  }

  // ── Cargar a cuenta: hay que saber de quién ──────────────────────
  let customerId: string | null = null;
  if (input.metodoPago === "CUENTA") {
    const nombre = input.clienteNombre?.trim();
    const email = input.clienteEmail?.trim();

    if (!nombre && !email) {
      return {
        ok: false,
        error: "Para cargar a cuenta hace falta el nombre o el correo del cliente",
      };
    }

    if (email) {
      const existente = await prisma.customer.findUnique({ where: { email } });
      if (existente) {
        customerId = existente.id;
      } else {
        const creado = await prisma.customer.create({
          data: { name: nombre || email, email, hasCredit: true },
        });
        customerId = creado.id;
      }
    } else if (nombre) {
      // Sin correo se busca por nombre exacto entre los que tienen crédito
      const existente = await prisma.customer.findFirst({
        where: { name: nombre, hasCredit: true },
      });
      if (!existente) {
        return {
          ok: false,
          error: `No encontré una cuenta a nombre de "${nombre}". Pide el correo.`,
        };
      }
      customerId = existente.id;
    }
  }

  const pagadoAhora = input.metodoPago !== "CUENTA";
  const codigo = await generarCodigoUnico().catch(() => null);

  const venta = await prisma.$transaction(async (tx) => {
    const orden = await tx.order.create({
      data: {
        tableId: null,
        ubicacionId: ubicacion.id,
        source: "MOSTRADOR",
        status: "IN_KITCHEN",
        customerName: input.clienteNombre?.trim() || null,
        customerEmail: input.clienteEmail?.trim() || null,
        notes: input.notas?.trim() || null,
        subtotal: carrito.subtotal,
        tax: carrito.tax,
        total: carrito.total,
        codigoRecogida: codigo,
      },
    });

    for (const linea of carrito.lineas) {
      await tx.orderItem.create({
        data: {
          orderId: orden.id,
          menuItemId: linea.menuItem.id,
          quantity: linea.item.quantity,
          unitPrice: linea.precioUnitario,
        },
      });
    }

    await tx.orderStatusEvent.create({
      data: {
        orderId: orden.id,
        fromStatus: "DRAFT",
        toStatus: "IN_KITCHEN",
      },
    });

    await tx.payment.create({
      data: {
        orderId: orden.id,
        amount: carrito.total,
        method: input.metodoPago === "CUENTA" ? "ON_ACCOUNT" : input.metodoPago,
        status: pagadoAhora ? "COMPLETED" : "PENDING",
        paidAt: pagadoAhora ? new Date() : null,
        ...(customerId ? { customerId } : {}),
      },
    });

    // Cargo a la cuenta del cliente
    if (input.metodoPago === "CUENTA" && customerId) {
      await tx.customerLedgerEntry.create({
        data: {
          customerId,
          amount: carrito.total,
          type: "CHARGE",
          note: `Venta en café #${orden.id.slice(-6)}`,
        },
      });
    }

    return orden;
  });

  return {
    ok: true,
    venta: {
      orderId: venta.id,
      codigo,
      total: carrito.total / 100,
      metodoPago: input.metodoPago,
      clienteNombre: venta.customerName,
    },
  };
}
