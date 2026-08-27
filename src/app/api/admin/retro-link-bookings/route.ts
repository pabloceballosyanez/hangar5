import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/retro-link-bookings
 *
 * Retro-vincula reservas (bookings) que quedaron con customerId=null
 * a clientes: busca/crea el Customer por email, vincula, y registra
 * el cargo en el ledger. Idempotente.
 */
export async function POST(req: NextRequest) {
  const token = req.cookies.get("hangar5_admin_session")?.value;
  if (token && token !== "true" && !validateAdminSession(token)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const bookings = await prisma.booking.findMany({
      where: { customerId: null },
      orderBy: { createdAt: "asc" },
    });

    let linked = 0;
    let skipped = 0;

    for (const b of bookings) {
      const email = b.customerEmail?.trim();
      // Omitir reservas de mantenimiento / sin email real
      if (!email || email === "admin@hangar5.mx") {
        skipped++;
        continue;
      }

      // Buscar o crear el cliente por email
      let customer = await prisma.customer.findUnique({ where: { email } });
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            name: b.customerName || email,
            email,
            phone: b.customerPhone || null,
          },
        });
      }

      // Vincular el booking al cliente
      await prisma.booking.update({
        where: { id: b.id },
        data: { customerId: customer.id },
      });

      // Registrar el cargo (solo si no existe ya)
      const existing = await prisma.customerLedgerEntry.findFirst({
        where: {
          customerId: customer.id,
          note: { contains: b.id },
        },
      });
      if (!existing && b.totalPrice > 0) {
        await prisma.customerLedgerEntry.create({
          data: {
            customerId: customer.id,
            amount: b.totalPrice,
            type: "CHARGE",
            note: `Reserva retro-vinculada: ${b.customerName} (${b.id.slice(-6)})`,
          },
        });
      }

      linked++;
    }

    return NextResponse.json({ ok: true, linked, skipped, total: bookings.length });
  } catch (err) {
    console.error("[retro-link-bookings]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
