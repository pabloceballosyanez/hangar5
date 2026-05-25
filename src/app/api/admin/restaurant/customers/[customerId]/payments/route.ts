import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ customerId: string }> };

const paymentSchema = z.object({
  amount: z.number().positive("El monto debe ser positivo"),
  method: z.enum(["CASH", "CARD", "TRANSFER", "MP"]),
  note: z.string().optional().nullable(),
});

// POST: registrar un pago contra el saldo del cliente
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { customerId } = await params;
    const body = await req.json();
    const parsed = paymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { amount, method, note } = parsed.data;

    // Verificar que el cliente existe
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    // amount viene en pesos, guardamos en centavos
    const amountCents = Math.round(amount * 100);

    // Crear entrada en el libro contable (PAYMENT = negativo porque reduce la deuda)
    const entry = await prisma.customerLedgerEntry.create({
      data: {
        customerId,
        amount: -amountCents, // negativo = pago que reduce la deuda
        type: "PAYMENT",
        note: note || `Pago en ${method}`,
      },
    });

    // También crear registro en Payment para trazabilidad
    await prisma.payment.create({
      data: {
        customerId,
        amount: amountCents,
        method,
        status: "COMPLETED",
        note: note || `Pago manual desde admin`,
        paidAt: new Date(),
      },
    });

    return NextResponse.json({
      ...entry,
      amount: entry.amount / 100,
    }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/restaurant/customers/[customerId]/payments]", err);
    return NextResponse.json({ error: "Error al registrar pago" }, { status: 500 });
  }
}
