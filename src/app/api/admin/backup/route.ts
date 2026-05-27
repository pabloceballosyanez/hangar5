import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET — download production database backup (admin auth required)
export async function GET(req: NextRequest) {
  const adminSession = req.cookies.get("hangar5_admin_session")?.value;
  if (!adminSession || adminSession !== "true") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Export all tables as JSON backup
  const backup: Record<string, unknown[]> = {};

  const modelNames = [
    "item", "category", "menuItem", "menuItemVariant", "ingredient",
    "recipe", "recipeItem", "stockMovement", "table",
    "modifierGroup", "modifier", "menuItemModifierGroup",
    "booking", "serviceSession", "order", "orderItem", "payment",
    "customer", "customerLedgerEntry", "staff", "staffShift", "staffClock",
    "fixedExpense",
  ];

  for (const name of modelNames) {
    try {
      const data = await (prisma as any)[name].findMany();
      backup[name] = data;
    } catch { backup[name] = []; }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const json = JSON.stringify({ exportedAt: timestamp, data: backup }, null, 2);

  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="hangar5-backup-${timestamp}.json"`,
    },
  });
}
