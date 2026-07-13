import { NextRequest, NextResponse } from "next/server";
import { validateAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const DB_PATH = process.env.DATABASE_URL?.replace("file:", "") || "/data/hangar5.db";

function requireAdmin(req: NextRequest): boolean {
  const token = req.cookies.get("hangar5_admin_session")?.value;
  if (!token || token === "true") return false;
  return validateAdminSession(token);
}

// GET /api/admin/backup
//   ?format=json  → export JSON (legacy, parcial)
//   sin params    → descarga binaria del archivo SQLite completo (restaurable)
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format");

  if (format === "json") {
    try {
      const [
        categories,
        menuItems,
        ingredients,
        recipes,
        staff,
        tables,
        orders,
        customers,
        fixedExpenses,
        modifierGroups,
        stockMovements,
      ] = await Promise.all([
        prisma.category.findMany({ include: { menuItems: { include: { variants: true } } } }),
        prisma.menuItem.findMany(),
        prisma.ingredient.findMany(),
        prisma.recipe.findMany({ include: { recipeItems: true } }),
        prisma.staff.findMany({ select: { id: true, name: true, role: true, pin: true, isActive: true } }),
        prisma.table.findMany(),
        (prisma as any).order?.findMany({ include: { items: true } }) ?? [],
        (prisma as any).customer?.findMany({ select: { id: true, name: true, email: true, hasCredit: true } }) ?? [],
        (prisma as any).fixedExpense?.findMany() ?? [],
        (prisma as any).modifierGroup?.findMany({ include: { modifiers: true } }) ?? [],
        (prisma as any).stockMovement?.findMany() ?? [],
      ]);

      return NextResponse.json({
        version: "v1.0",
        exportedAt: new Date().toISOString(),
        categories,
        menuItems,
        ingredients,
        recipes,
        staff,
        tables,
        orders,
        customers,
        fixedExpenses,
        modifierGroups,
        stockMovements,
      });
    } catch (err) {
      console.error("Backup JSON error:", err);
      return NextResponse.json({ error: "Backup failed" }, { status: 500 });
    }
  }

  // Binary DB download (full restore)
  try {
    if (!fs.existsSync(DB_PATH)) {
      return NextResponse.json({ error: "Database file not found" }, { status: 404 });
    }

    const stat = fs.statSync(DB_PATH);
    const fileBuffer = fs.readFileSync(DB_PATH);
    const filename = `hangar5-${new Date().toISOString().replace(/[:.]/g, "-")}.db`;

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(stat.size),
        "X-Backup-Date": new Date().toISOString(),
        "X-Backup-Size": String(stat.size),
      },
    });
  } catch (err) {
    console.error("Backup binary error:", err);
    return NextResponse.json({ error: "Backup failed" }, { status: 500 });
  }
}
