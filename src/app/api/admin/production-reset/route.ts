import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateAdminSession } from "@/lib/auth";
import fs from "fs";

export const dynamic = "force-dynamic";

const DB_PATH = process.env.DATABASE_URL?.replace("file:", "") || "/data/hangar5.db";
const BACKUP_DIR = "/data/backups";

/**
 * POST /api/admin/production-reset
 *
 * One-shot endpoint para puesta en producción.
 * Solo funciona si el admin está autenticado vía cookie de sesión.
 *
 * Body: { action: "backup" | "cleanup" | "export-ingredients" | "import-stock" }
 */

function requireAdmin(req: NextRequest): boolean {
  const token = req.cookies.get("hangar5_admin_session")?.value;
  if (!token || token === "true") return false;
  return validateAdminSession(token);
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, stock } = await req.json().catch(() => ({}));

  switch (action) {

    // ─── BACKUP ──────────────────────────────────────────────────────────────
    case "backup": {
      try {
        if (!fs.existsSync(DB_PATH)) {
          return NextResponse.json({ error: "DB not found" }, { status: 404 });
        }
        if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
        const ts = new Date().toISOString().replace(/[:.]/g, "-");
        const dest = `${BACKUP_DIR}/pre-prod-${ts}.db`;
        fs.copyFileSync(DB_PATH, dest);
        const size = fs.statSync(dest).size;
        return NextResponse.json({ ok: true, backup: dest, size });
      } catch (err) {
        console.error("[production-reset] backup error:", err);
        return NextResponse.json({ error: "Backup failed" }, { status: 500 });
      }
    }

    // ─── CLEANUP ─────────────────────────────────────────────────────────────
    case "cleanup": {
      const result: Record<string, number> = {};
      try {
        await prisma.$transaction(async (tx) => {
          // Order of deletion matters (FK constraints with SQLite)
          result.orderItemModifiers = await tx.orderItemModifier.deleteMany().then(r => r.count);
          result.orderStatusEvents = await tx.orderStatusEvent.deleteMany().then(r => r.count);
          result.orderItems = await tx.orderItem.deleteMany().then(r => r.count);
          result.payments = await (tx as any).payment.deleteMany().then((r: any) => r.count);
          result.customerLedgerEntries = await (tx as any).customerLedgerEntry.deleteMany().then((r: any) => r.count);
          result.orders = await (tx as any).order.deleteMany().then((r: any) => r.count);
          result.stockMovements = await (tx as any).stockMovement.deleteMany().then((r: any) => r.count);
          result.serviceSessions = await (tx as any).serviceSession.deleteMany().then((r: any) => r.count);
          result.staffShifts = await (tx as any).staffShift.deleteMany().then((r: any) => r.count);
          result.staffClocks = await (tx as any).staffClock.deleteMany().then((r: any) => r.count);
          result.customers = await (tx as any).customer.deleteMany().then((r: any) => r.count);
          result.tables = await (tx as any).table.deleteMany().then((r: any) => r.count);
        });
        return NextResponse.json({ ok: true, deleted: result });
      } catch (err) {
        console.error("[production-reset] cleanup error:", err);
        return NextResponse.json({ error: "Cleanup failed", detail: String(err) }, { status: 500 });
      }
    }

    // ─── EXPORT INVENTARIO ───────────────────────────────────────────────────
    case "export-ingredients": {
      try {
        const ingredients = await prisma.ingredient.findMany({
          select: {
            id: true,
            name: true,
            unit: true,
            currentStock: true,
            minStock: true,
            cost: true,
          },
          orderBy: { name: "asc" },
        });
        return NextResponse.json({ ok: true, ingredients });
      } catch (err) {
        return NextResponse.json({ error: "Export failed" }, { status: 500 });
      }
    }

    // ─── IMPORT STOCK ────────────────────────────────────────────────────────
    case "import-stock": {
      if (!Array.isArray(stock) || stock.length === 0) {
        return NextResponse.json({ error: "stock array required" }, { status: 400 });
      }
      try {
        let updated = 0;
        await prisma.$transaction(async (tx) => {
          for (const { id, currentStock } of stock) {
            await tx.ingredient.update({
              where: { id },
              data: { currentStock: Number(currentStock) || 0 },
            });
            updated++;
          }
        });
        return NextResponse.json({ ok: true, updated });
      } catch (err) {
        return NextResponse.json({ error: "Import failed", detail: String(err) }, { status: 500 });
      }
    }

    default:
      return NextResponse.json(
        { error: "Unknown action. Use: backup | cleanup | export-ingredients | import-stock" },
        { status: 400 }
      );
  }
}
