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

  const ingredients = await prisma.ingredient.findMany({
    select: { name: true, currentStock: true },
    orderBy: { name: "asc" },
  });

  const nonZero = ingredients.filter(i => i.currentStock !== 0);
  return NextResponse.json({
    total: ingredients.length,
    nonZero: nonZero.length,
    nonZeroItems: nonZero,
  });
}
