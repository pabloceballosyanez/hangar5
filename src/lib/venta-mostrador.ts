import { prisma } from "@/lib/prisma";
import { calcularCarrito } from "@/lib/calcular-carrito";
import { generarCodigoUnico } from "@/lib/codigo-recogida";

/**
 * Venta directa en la barra del Despegue.
 *
 * ── REGLA DE NEGOCIO: nada se prepara sin cobrar ────────────────────
 * Un pedido solo entra a preparación si hay responsable del dinero.
 * Hay dos formas de que lo haya:
 *
 *   1. Contado (efectivo, tarjeta, transferencia) → se cobra en el acto
 *   2. A su cuenta → el huésped duerme aquí, se le fía
 *
 * Cualquier otra cosa NO entra a la barra. Sin esto, el barista podía
 * mandar un latte a preparar sin que nadie pagara, y después el pedido
 * quedaba colgado en el panel como "pendiente" para siempre. En una
 * barra eso es desorden y dinero perdido.
 *
 * ── Los modificadores ───────────────────────────────────────────────
 * Se guardan con su nombre y precio congelados, igual que la línea del
 * platillo: si mañana la leche de almendra sube, la venta de ayer sigue
 * diciendo lo que costaba ayer.
 */

export interface LineaInput {
  menuItemId: string;
  cantidad: number;
  variantId?: string | null;
  modifierIds?: string[];
  notas?: string | null;
}

export interface VentaInput {
  items: LineaInput[];
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
        clienteNombre: string | null;
        preparando: boolean;
      };
    }
  | { ok: false; error: string };

export async function crearVentaMostrador(input: VentaInput): Promise<ResultadoVenta> {
  const ubicacion = await prisma.ubicacion.findUnique({ where: { clave: "cafe" } });
  if (!ubicacion) return { ok: false, error: "El café no está configurado" };

  /* El nombre es obligatorio: en una barra el nombre ES el identificador
     del pedido. Sin él, dos lattes no se distinguen. */
  if (!input.clienteNombre?.trim()) {
    return { ok: false, error: "Escribe el nombre de quien pide" };
  }

  // El mismo cálculo que usa el pedido en línea: una sola fuente de verdad
  let carrito;
  try {
    carrito = await calcularCarrito(
      input.items.map((i) => ({
        menuItemId: i.menuItemId,
        quantity: i.cantidad,
        variantId: i.variantId ?? undefined,
        modifierIds: i.modifierIds ?? [],
      }))
    );
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo calcular la venta" };
  }

  /* Los productos tienen que estar marcados para el café. Sin esto el
     barista podría vender una pizza que la barra no sabe preparar. */
  const marcados = await prisma.menuItemUbicacion.findMany({
    where: {
      ubicacionId: ubicacion.id,
      disponible: true,
      menuItemId: { in: carrito.lineas.map((l) => l.menuItem.id) },
    },
    select: { menuItemId: true },
  });
  const permitidos = new Set(marcados.map((m) => m.menuItemId));
  const fuera = carrito.lineas.find((l) => !permitidos.has(l.menuItem.id));
  if (fuera) {
    return { ok: false, error: `"${fuera.menuItem.name}" no se vende en el café` };
  }

  /* ── Cargar a cuenta: hay que saber de quién ──────────────────────
     Es la excepción a "cobra primero": al huésped se le fía porque está
     alojado y su cuenta se liquida al final. Pero hace falta saber a
     quién, o el cargo queda en el aire. */
  let customerId: string | null = null;

  if (input.metodoPago === "CUENTA") {
    const nombre = input.clienteNombre.trim();
    const email = input.clienteEmail?.trim();

    if (email) {
      const existente = await prisma.customer.findUnique({ where: { email } });
      if (existente) {
        customerId = existente.id;
      } else {
        const creado = await prisma.customer.create({
          data: { name: nombre, email, hasCredit: true },
        });
        customerId = creado.id;
      }
    } else {
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

  const esCuenta = input.metodoPago === "CUENTA";

  /* ── LA REGLA ─────────────────────────────────────────────────────
     Solo entra a preparación si hay responsable del dinero. Como el
     método ya está validado arriba (si no es CUENTA, es contado y se
     cobra al instante), aquí siempre es true. Se deja explícito para
     que la regla se vea y no se rompa sin querer al tocar el código. */
  const puedePrepararse = input.metodoPago !== "CUENTA" ? true : customerId !== null;
  if (!puedePrepararse) {
    return {
      ok: false,
      error: "No se puede mandar a preparación sin cobrar o cargar a una cuenta",
    };
  }

  const codigo = await generarCodigoUnico().catch(() => null);

  const venta = await prisma.$transaction(async (tx) => {
    const orden = await tx.order.create({
      data: {
        tableId: null,
        ubicacionId: ubicacion.id,
        source: "MOSTRADOR",
        // Siempre entra a preparación: la regla de arriba ya garantizó
        // que hay pago o cuenta responsable.
        status: "IN_KITCHEN",
        customerName: input.clienteNombre!.trim(),
        customerEmail: input.clienteEmail?.trim() || null,
        notes: input.notas?.trim() || null,
        subtotal: carrito.subtotal,
        tax: carrito.tax,
        total: carrito.total,
        codigoRecogida: codigo,
      },
    });

    for (const linea of carrito.lineas) {
      const item = await tx.orderItem.create({
        data: {
          orderId: orden.id,
          menuItemId: linea.menuItem.id,
          quantity: linea.item.quantity,
          unitPrice: linea.precioUnitario,
          variantId: linea.variant?.id ?? null,
          specialInstructions:
            input.items.find((i) => i.menuItemId === linea.menuItem.id)?.notas ?? null,
        },
      });

      // Modificadores con nombre y precio congelados
      for (const mod of linea.modificadores) {
        await tx.orderItemModifier.create({
          data: {
            orderItemId: item.id,
            modifierId: mod.id,
            modifierName: mod.name,
            priceDelta: mod.priceDelta,
          },
        });
      }
    }

    await tx.orderStatusEvent.create({
      data: { orderId: orden.id, fromStatus: "DRAFT", toStatus: "IN_KITCHEN" },
    });

    await tx.payment.create({
      data: {
        orderId: orden.id,
        amount: carrito.total,
        method: esCuenta ? "ON_ACCOUNT" : input.metodoPago,
        /* A cuenta: la orden ya está pagada.
           El cobro se hizo al fiar — el huésped asumió la deuda y esa
           deuda pasa al LIBRO del cliente (customerLedgerEntry), que es
           donde se lleva el saldo y donde se liquida al cerrar su
           cuenta. La orden en sí quedó saldada en el momento.
           Antes se marcaba PENDING, y el panel de órdenes mostraba
           "pendiente de pago" algo que ya estaba pagado: la deuda
           aparecía dos veces y en el lugar equivocado. */
        status: "COMPLETED",
        paidAt: new Date(),
        ...(customerId ? { customerId } : {}),
      },
    });

    if (esCuenta && customerId) {
      await tx.customerLedgerEntry.create({
        data: {
          customerId,
          amount: carrito.total,
          type: "CHARGE",
          note: `Despegue #${orden.id.slice(-6)}`,
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
      preparando: true,
    },
  };
}
