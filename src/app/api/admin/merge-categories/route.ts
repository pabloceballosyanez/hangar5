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

  const results: string[] = [];

  // Merge pairs: [keepName, deleteName]
  // The "keep" category absorbs all items from "delete", then "delete" is removed
  const merges: [string, string][] = [
    ["Desayunos", "DESAYUNOS"],
    ["Ensaladas", "ENSALADAS"],
    ["Postres", "POSTRES"],
    ["Bebidas con Alcohol", "BEBIDAS ALCOHÓLICAS"],
    ["Bebidas sin Alcohol", "BEBIDAS NO ALCOHÓLICAS"],
    ["Entradas", "ENTRADAS"],
    ["Pizzas", "PIZZAS"],
  ];

  try {
    await prisma.$transaction(async (tx) => {
      for (const [keepName, deleteName] of merges) {
        // Find both categories
        const keep = await tx.category.findFirst({ where: { name: keepName } });
        const del = await tx.category.findFirst({ where: { name: deleteName } });

        if (!keep || !del) {
          results.push(`  ⚠️ ${keepName}←${deleteName}: no encontrado (keep=${!!keep}, del=${!!del})`);
          continue;
        }

        // Move all menu items from "delete" to "keep"
        const moved = await tx.menuItem.updateMany({
          where: { categoryId: del.id },
          data: { categoryId: keep.id },
        });

        // Delete the duplicate category
        await tx.category.delete({ where: { id: del.id } });

        // Rename "keep" to canonical casing if needed
        if (keep.name !== keepName) {
          await tx.category.update({
            where: { id: keep.id },
            data: { name: keepName },
          });
        }

        results.push(`  ✅ ${keepName} ← ${deleteName}: ${moved.count} items movidos`);
      }
    });

    // Final count
    const final = await prisma.category.count();
    results.push(`\n📊 Total final: ${final} categorías`);

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
