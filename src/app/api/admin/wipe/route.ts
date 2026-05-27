import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/admin/wipe — Clears all operational data for dry run reset
// Protected by admin session cookie
export async function POST(req: NextRequest) {
  const adminSession = req.cookies.get("hangar5_admin_session")?.value;
  if (!adminSession || adminSession !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    // Clear operational data (keep reference data: items, menu, tables, staff, modifiers, categories, ingredients, recipes)
    await prisma.orderStatusEvent.deleteMany();
    await prisma.orderItemModifier.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.order.deleteMany();
    await prisma.serviceSession.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.stockMovement.deleteMany();
    await prisma.staffShift.deleteMany();
    await prisma.staffClock.deleteMany();
    await prisma.customerLedgerEntry.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.fixedExpense.deleteMany();

    return NextResponse.json({
      success: true,
      message: "Base de datos reiniciada para dry run. Datos de referencia preservados.",
    });
  } catch (err) {
    console.error("[POST /api/admin/wipe]", err);
    return NextResponse.json({ error: "Error al reiniciar" }, { status: 500 });
  }
}
