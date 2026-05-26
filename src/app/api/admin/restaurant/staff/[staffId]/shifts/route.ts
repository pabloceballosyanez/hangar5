import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ staffId: string }> };

// POST: create a shift for a staff member
const createShiftSchema = z.object({
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
});

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { staffId } = await params;
    const body = await req.json();
    const parsed = createShiftSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const staff = await prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) return NextResponse.json({ error: "Staff no encontrado" }, { status: 404 });

    const shift = await prisma.staffShift.create({
      data: {
        staffId,
        date: new Date(parsed.data.date),
        startTime: new Date(parsed.data.startTime),
        endTime: new Date(parsed.data.endTime),
      },
    });

    return NextResponse.json(shift, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/restaurant/staff/[staffId]/shifts]", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
