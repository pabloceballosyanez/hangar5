import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { itemId, startDate, endDate, reason } = body;

  if (!itemId || !startDate || !endDate) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end <= start) {
    return NextResponse.json({ error: "La fecha de fin debe ser posterior a la de inicio" }, { status: 400 });
  }

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) {
    return NextResponse.json({ error: "Item no encontrado" }, { status: 404 });
  }

  const booking = await prisma.booking.create({
    data: {
      itemId,
      customerName: "🔧 Mantenimiento",
      customerEmail: "admin@hangar5.mx",
      startDate: start,
      endDate: end,
      guests: 0,
      totalPrice: 0,
      notes: reason || "Bloqueado por mantenimiento",
      status: "maintenance",
    },
  });

  return NextResponse.json(booking);
}
