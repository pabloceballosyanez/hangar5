import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, slug, type, description, price, capacity, image } = body;

  if (!name || !slug || !type || !price) {
    return NextResponse.json({ error: "Faltan campos: name, slug, type, price requeridos" }, { status: 400 });
  }

  // Check if slug already exists
  const existing = await prisma.item.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Ya existe un item con ese slug" }, { status: 409 });
  }

  const item = await prisma.item.create({
    data: {
      name,
      slug,
      type,
      description: description || "",
      price,
      capacity: capacity || "",
      image: image || `/img/items/${slug}/01.jpg`,
      active: true,
      featured: false,
    },
  });

  return NextResponse.json(item);
}
