import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ sessionId: string }> };

function serialize(s: Record<string, unknown>) {
  const r = { ...s };
  if (r.orders && Array.isArray(r.orders)) {
    r.orders = (r.orders as Record<string, unknown>[]).map(o => ({
      ...o, total: (o.total as number) / 100, subtotal: (o.subtotal as number) / 100, tax: (o.tax as number) / 100,
    }));
  }
  if (r.payments && Array.isArray(r.payments)) {
    r.payments = (r.payments as Record<string, unknown>[]).map(p => ({
      ...p, amount: (p.amount as number) / 100,
    }));
  }
  return r;
}

// ─── GET: session detail ─────────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { sessionId } = await params;
    const session = await prisma.serviceSession.findUnique({
      where: { id: sessionId },
      include: {
        table: true,
        customer: true,
        orders: {
          include: {
            orderItems: {
              include: {
                menuItem: { select: { name: true } },
                variant: { select: { name: true } },
                modifiers: { select: { modifierName: true, priceDelta: true } },
              },
            },
          },
        },
        payments: true,
        _count: { select: { orders: true } },
      },
    });
    if (!session) return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
    return NextResponse.json(serialize(session as unknown as Record<string, unknown>));
  } catch (err) {
    console.error("[GET /api/admin/restaurant/sessions/[sessionId]]", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

// ─── PUT: close session with payment ─────────────────────────────────────────
const closeSessionSchema = z.object({
  payments: z.array(z.object({
    /* ON_ACCOUNT incluido: el Modo Solo lo ofrece para clientes con
       crédito. Sin esto, cobrar a cuenta devolvía 400 aunque los otros
       dos métodos funcionaran. */
    method: z.enum(["CASH", "CARD", "TRANSFER", "ON_ACCOUNT"]),
    amount: z.number().min(0),
  })).optional().default([]),
  /** Cobrar también el alojamiento vinculado, si queda saldo. */
  cobrarAlojamiento: z.boolean().optional().default(false),
});

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { sessionId } = await params;

    /* Quién cierra la cuenta. Antes no se guardaba en ningún lado: los
       eventos de estado quedaban con actorName null y después no había
       forma de saber si fue la cocinera, el mesero o el admin. */
    const sesion = getStaffSession(req);
    const quien = sesion?.name ?? "Admin";

    const body = await req.json();
    const parsed = closeSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const paymentInputs = parsed.data.payments;
    const cobrarAlojamiento = parsed.data.cobrarAlojamiento;
    /* Lo que entra a la caja de verdad. "A su cuenta" NO es dinero que
       entra: es deuda que se anota en el libro del cliente.
       Antes esta suma incluía el ON_ACCOUNT, así que al cobrar a cuenta
       el balance daba cero, no se escribía el cargo en el libro y las
       órdenes quedaban sin cobrar: el producto se regalaba. */
    const totalPaid = paymentInputs
      .filter((p) => p.method !== "ON_ACCOUNT")
      .reduce((sum, p) => sum + Math.round(p.amount * 100), 0);

    /* Lo que se va a la cuenta del cliente. */
    const totalAlaCuenta = paymentInputs
      .filter((p) => p.method === "ON_ACCOUNT")
      .reduce((sum, p) => sum + Math.round(p.amount * 100), 0);

    // Run entire close operation inside a transaction to prevent race conditions.
    // Session read + status check + close happen atomically.
    const result = await prisma.$transaction(async (tx) => {
      const session = await tx.serviceSession.findUnique({
        where: { id: sessionId },
        include: { orders: true, customer: true, booking: true },
      });

      if (!session) throw new Error("NOT_FOUND");
      if (session.status === "CLOSED") throw new Error("ALREADY_CLOSED");

      /* ── El cobro NO se detiene por falta de entrega ─────────────────
         Pablo: "si pagan antes de entregar el producto está perfecto. No
         hay que detenerse."

         El dinero y la entrega son carriles distintos. Se cobra siempre
         que se pida cobrar: el cliente puede pagar y esperar su producto.
         Lo que no puede pasar es CERRAR la cuenta con algo sin entregar.
         Ese bloqueo va más abajo, justo antes de cerrar.

         Antes estaba aquí arriba y mataba la llamada completa, así que
         cobrar una coca cola sin entregarla devolvía un error que ni
         siquiera explicaba qué pasaba. */
      const sinEntregar = session.orders.filter(
        (o) =>
          o.status !== "CANCELLED" &&
          !o.entregadoAt &&
          o.status !== "SERVED" &&
          o.status !== "PAID"
      );

      /* Órdenes con dinero pendiente. Ahora la verdad del pago vive en
         paidAt, no en status: status es el carril de la cocina. */
      const unpaidOrders = session.orders.filter(
        (o) => o.status !== "CANCELLED" && !o.paidAt && o.status !== "PAID"
      );
      const consumo = unpaidOrders.reduce((sum, o) => sum + o.total, 0);

      /* Servicios vendidos en la cuenta: motos, bicis, vuelos. Se cobran
         junto con la comida, en el mismo ticket. Antes no existían y la
         renta no tenía dónde cobrarse. */
      const serviciosDeLaCuenta = await tx.servicioCuenta.findMany({
        where: { serviceSessionId: sessionId },
      });
      const totalServicios = serviciosDeLaCuenta.reduce((sum, s) => sum + s.total, 0);

      /* Cuenta unificada: si esta cuenta está vinculada a una reserva y
         se pidió cobrar el alojamiento, se suma lo que falte pagar de la
         reserva. Si la reserva ya está pagada, su saldo es 0 y no se
         vuelve a cobrar — eso es justo lo que hay que evitar. */
      let saldoAlojamiento = 0;
      if (session.booking && cobrarAlojamiento) {
        const b = session.booking;
        saldoAlojamiento = b.paymentStatus === "paid"
          ? 0
          : Math.max(0, b.totalPrice - b.amountPaid);

        if (saldoAlojamiento > 0) {
          const pagadoAhora = b.amountPaid + saldoAlojamiento;
          await tx.booking.update({
            where: { id: b.id },
            data: {
              amountPaid: pagadoAhora,
              paymentStatus: pagadoAhora >= b.totalPrice ? "paid" : "unpaid",
              status: b.status === "pending" ? "confirmed" : b.status,
            },
          });
        }
      }

      const totalOwed = consumo + totalServicios + saldoAlojamiento;

      const isCustomer = session.customerId && (session.type === "TAB" || session.type === "QR");
      if (!isCustomer && totalPaid < totalOwed) {
        throw new Error("UNPAID_ORDERS");
      }

      /* ── UN SOLO Payment por cobro ────────────────────────────────────
         Antes se creaba uno a nivel sesión Y otro por cada orden con el
         mismo dinero: el cliente aparecía pagando el doble de lo que
         consumió. Pablo lo vio en el historial ("pagos de 180 y 1300
         pesos... pareciera que pagaron el doble de lo que consumieron").

         Ahora el cobro se cuelga de CADA ORDEN (un Payment por orden, por
         su monto real), y la sesión suma de sus órdenes. Así la columna
         PAGO del panel de Órdenes sigue sabiendo con qué se cobró, y el
         historial del cliente no ve el dinero dos veces.

         Lo que quedó de un pago mayor que el consumo (a cuenta, o por el
         alojamiento) se registra aparte, sin orden asociada. */
      const pagosCreados: Array<{ id: string; amount: number; method: string }> = [];

      /* 1. Un pago por orden, por su total, con el primer método que
            cubra ese monto (el caso normal es un solo método). */
      let restanteAMarcar = paymentInputs.reduce((s, p) => s + Math.round(p.amount * 100), 0);
      for (const order of unpaidOrders) {
        const montoOrden = order.total;
        if (montoOrden <= 0) continue;

        const cubierto = Math.min(montoOrden, restanteAMarcar);
        restanteAMarcar -= cubierto;

        const creado = await tx.payment.create({
          data: {
            orderId: order.id,
            serviceSessionId: sessionId,
            customerId: session.customerId,
            amount: montoOrden,
            method: paymentInputs[0]?.method ?? "CASH",
            status: "COMPLETED",
            paidAt: new Date(),
          },
        });
        pagosCreados.push({ id: creado.id, amount: montoOrden, method: creado.method });
      }

      /* 2. Lo que sobró del pago (a cuenta, o cubriendo el alojamiento)
            va como pago de la cuenta, sin orden. */
      const marcadoPorOrdenes = pagosCreados.reduce((s, p) => s + p.amount, 0);
      const sobrante = totalPaid - marcadoPorOrdenes;
      if (sobrante > 0) {
        const creado = await tx.payment.create({
          data: {
            serviceSessionId: sessionId,
            customerId: session.customerId,
            amount: sobrante,
            method: paymentInputs[0]?.method ?? "CASH",
            status: "COMPLETED",
            paidAt: new Date(),
          },
        });
        pagosCreados.push({ id: creado.id, amount: sobrante, method: creado.method });
      }

      const balance = totalOwed - totalPaid - totalAlaCuenta;

      /* El libro del cliente recibe un cargo cuando queda algo a deber:
         lo que se pagó a cuenta MÁS lo que quedó sin cubrir. Antes solo
         miraba el balance, y como el pago a cuenta ya lo dejaba en cero,
         nunca se anotaba nada: el cliente comía gratis y su cuenta
         seguía diciendo que no debía. */
      const deuda = totalAlaCuenta + (balance > 0 ? balance : 0);

      if (session.customerId && deuda > 0) {
        await tx.customerLedgerEntry.create({
          data: {
            customerId: session.customerId,
            amount: deuda,
            type: "CHARGE",
            serviceSessionId: sessionId,
            note: `Saldo de sesión: ${session.label}`,
          },
        });

        /* ── EL CAMBIO DE FONDO ───────────────────────────────────────────
           Antes aquí se hacía `status: "PAID"`, que PISABA el carril de la
           cocina con el del dinero: una orden READY se volvía PAID y se
           perdía el hecho de que estaba lista.
           Ahora el pago se anota en su propio campo (paidAt) y el estado de
           preparación se queda como está. Los dos carriles avanzan por
           separado, como en la tabla de Órdenes. */
        for (const order of unpaidOrders) {
          await tx.order.update({
            where: { id: order.id },
            data: { paidAt: new Date() },
          });
          await tx.orderStatusEvent.create({
            data: {
              orderId: order.id,
              fromStatus: order.status,
              toStatus: order.status, // la cocina no se mueve
              actorName: quien,
              reason: "Cobro registrado",
            },
          });
        }
      }

      /* ── Si falta entregar: se cobra, pero la cuenta NO se cierra ────
         Pablo: "si pagan antes de entregar el producto está perfecto. No
         hay que detenerse. La orden se cierra cuando está pagado y
         entregado; si no, está bien que esté incompleto."

         Antes se lanzaba un error aquí y, como todo va en una transacción,
         se revertía también el cobro: el dinero entraba en la mano del
         cajero pero no quedaba registrado. Ahora la transacción vuelve
         con una marca de "cobrada, sigue abierta" y la sesión se queda
         OPEN con su pago anotado. */
      const faltan = sinEntregar.length;

      const closed =
        faltan === 0
          ? await tx.serviceSession.update({
              where: { id: sessionId },
              data: { status: "CLOSED", closedAt: new Date() },
              include: { customer: true },
            })
          : await tx.serviceSession.findUnique({
              where: { id: sessionId },
              include: { customer: true },
            });

      return {
        session: closed,
        totalOwed,
        totalPaid,
        balance,
        /* true = se cobró pero la cuenta sigue abierta esperando entrega */
        sigueAbierta: faltan > 0,
        faltanPorEntregar: faltan,
        desglose: {
          consumoRestaurante: consumo / 100,
          servicios: totalServicios / 100,
          alojamiento: saldoAlojamiento / 100,
        },
      };
    });


      return NextResponse.json(result);
  } catch (err) {
    const message = (err as Error).message;
    if (message === "NOT_FOUND") {
      return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
    }
    if (message === "ALREADY_CLOSED") {
      return NextResponse.json({ error: "Sesión ya cerrada" }, { status: 409 });
    }
    if (message === "UNPAID_ORDERS") {
      return NextResponse.json(
        { error: "Hay órdenes sin pagar. Usa 'Pagar' antes de cerrar la sesión." },
        { status: 409 }
      );
    }

    /* La cuenta solo cierra cuando todo está pagado Y entregado. Si falta
       entregar, se dice CUÁNTAS y QUÉ hacer, no un "error al cerrar" que no
       explica nada. Pablo lo vivió: cobró una coca cola sin entregarla y
       solo vio un mensaje genérico. */
    if (message.startsWith("FALTA_ENTREGAR:")) {
      const cuantas = Number(message.split(":")[1] ?? 0);
      return NextResponse.json(
        {
          error:
            cuantas === 1
              ? "Falta entregar 1 orden. Entrégala antes de cobrar: la cuenta cierra cuando todo está pagado y entregado."
              : `Faltan entregar ${cuantas} órdenes. Entrégalas antes de cobrar: la cuenta cierra cuando todo está pagado y entregado.`,
          faltanPorEntregar: cuantas,
          codigo: "FALTA_ENTREGAR",
        },
        { status: 409 }
      );
    }

    console.error("[PUT /api/admin/restaurant/sessions/[sessionId]]", err);
    return NextResponse.json({ error: "Error al cerrar sesión" }, { status: 500 });
  }
}
