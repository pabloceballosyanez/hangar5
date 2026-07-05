import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST — actualizar imageUrl por nombre de MenuItem
const ADMIN_PW = process.env.ADMIN_PASSWORD;

export async function POST(req: NextRequest) {
  const adminSession = req.cookies.get("hangar5_admin_session")?.value;
  const adminHeader = req.headers.get("x-admin-password");
  if ((!adminSession || (adminSession !== "true" && !validateAdminSession(adminSession))) && adminHeader !== ADMIN_PW) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { updates } = await req.json();
    
    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: "updates debe ser un array" }, { status: 400 });
    }

    let updated = 0;
    let notFound = 0;

    for (const { name, imageUrl } of updates) {
      const item = await prisma.menuItem.findFirst({ where: { name } });
      if (item) {
        await prisma.menuItem.update({
          where: { id: item.id },
          data: { imageUrl },
        });
        updated++;
      } else {
        notFound++;
      }
    }

    return NextResponse.json({
      success: true,
      updated,
      notFound,
      message: `${updated} items actualizados, ${notFound} no encontrados`,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
