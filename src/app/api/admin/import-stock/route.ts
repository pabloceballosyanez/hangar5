import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

function requireAdmin(req: NextRequest): boolean {
  const token = req.cookies.get("hangar5_admin_session")?.value;
  if (!token || token === "true") return false;
  return validateAdminSession(token);
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action, stock } = await req.json().catch(() => ({}));

    if (action === "import-stock" && Array.isArray(stock)) {
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
    }

    return NextResponse.json({ error: "Usá: import-stock" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
