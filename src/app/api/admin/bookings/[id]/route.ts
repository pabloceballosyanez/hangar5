import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { status } = body;

  if (!["pending", "paid", "confirmed", "cancelled", "maintenance"].includes(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const booking = await prisma.booking.update({
    where: { id },
    data: { status },
    include: { item: true },
  });

  return NextResponse.json(booking);
}
