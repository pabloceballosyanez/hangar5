import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST — add images to all menu items using category-based defaults
export async function POST(req: NextRequest) {
  const adminSession = req.cookies.get("hangar5_admin_session")?.value;
  if (!adminSession || (adminSession !== "true" && !validateAdminSession(adminSession))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Category → default image mapping
  const categoryImages: Record<string, string> = {
    "Cafetería Bebidas": "/img/menu/cafe.jpg",
    "Cafetería Comida": "/img/menu/sandwich.jpg",
    "Bebidas sin Alcohol": "/img/menu/bebidas.jpg",
    "Bebidas con Alcohol": "/img/menu/bar.jpg",
    "Desayunos": "/img/menu/desayuno.jpg",
    "Ensaladas": "/img/menu/ensalada.jpg",
    "Horno": "/img/menu/pizza.jpg",
    "Parrilla": "/img/menu/parrilla.jpg",
    "Postres": "/img/menu/postre.jpg",
  };

  const categories = await prisma.category.findMany();
  const catMap: Record<string, string> = {};
  for (const c of categories) catMap[c.id] = c.name;

  const menuItems = await prisma.menuItem.findMany({ include: { category: true } });
  let updated = 0;

  for (const mi of menuItems) {
    const catName = mi.category?.name;
    const image = categoryImages[catName] || null;
    if (image) {
      await prisma.menuItem.update({
        where: { id: mi.id },
        data: { imageUrl: image },
      });
      updated++;
    }
  }

  return NextResponse.json({ success: true, message: `Imágenes asignadas a ${updated}/${menuItems.length} ítems del menú` });
}
