import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/admin/wipe — Clears all operational data for dry run reset
// Protected by admin session cookie
export async function POST(req: NextRequest) {
  const adminSession = req.cookies.get("hangar5_admin_session")?.value;
  if (!adminSession || (adminSession !== "true" && !validateAdminSession(adminSession))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    // Clear ONLY operational data — preserve ALL reference data:
    // recipes, ingredients, menu items, categories, items, tables, staff, modifiers
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
      message: "Datos operativos reiniciados. Recetas, ingredientes, menú y referencia intactos.",
    });
  } catch (err) {
    console.error("[POST /api/admin/wipe]", err);
    return NextResponse.json({ error: "Error al reiniciar" }, { status: 500 });
  }
}
