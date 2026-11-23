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

      /* ── Regla de Pablo: la cuenta cierra solo si está pagada Y entregada ─
         "La orden se cierra cuando está pagado y entregado... sino está
         bien que esté incompleto." Si falta entregar algo, no se cierra:
         se avisa qué falta para que alguien lo entregue primero. Antes se
         cerraba igual y la orden quedaba huérfana (el caso de Pedro):
         pagada, trabada en READY y sin forma de entregarla. */
      const sinEntregar = session.orders.filter(
        (o) =>
          o.status !== "CANCELLED" &&
          !o.entregadoAt &&
          o.status !== "SERVED" &&
          o.status !== "PAID"
      );
      if (sinEntregar.length > 0) {
        throw new Error(`FALTA_ENTREGAR:${sinEntregar.length}`);
      }

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

      for (const p of paymentInputs) {
        const cents = Math.round(p.amount * 100);
        if (cents <= 0) continue;
        await tx.payment.create({
          data: {
            serviceSessionId: sessionId,
            customerId: session.customerId,
            amount: cents,
            method: p.method,
            status: "COMPLETED",
            paidAt: new Date(),
          },
        });
      }

      /* Registrar el pago TAMBIÉN en cada orden.
         Antes el pago quedaba solo a nivel sesión, y las órdenes se
         marcaban PAID sin ninguna fila en Payment. En el panel de
         Órdenes eso se ve como "Pagada / —": el cajero no sabe con qué
         se cobró. Ahora cada orden guarda su parte con el método real. */
      for (const order of unpaidOrders) {
        await tx.payment.create({
          data: {
            orderId: order.id,
            serviceSessionId: sessionId,
            customerId: session.customerId,
            amount: order.total,
            method: paymentInputs[0]?.method ?? "CASH",
            status: "COMPLETED",
            paidAt: new Date(),
          },
        });
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

      const closed = await tx.serviceSession.update({
        where: { id: sessionId },
        data: { status: "CLOSED", closedAt: new Date() },
        include: { customer: true },
      });

      return {
        session: closed,
        totalOwed,
        totalPaid,
        balance,
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
    console.error("[PUT /api/admin/restaurant/sessions/[sessionId]]", err);
    return NextResponse.json({ error: "Error al cerrar sesión" }, { status: 500 });
  }
}
