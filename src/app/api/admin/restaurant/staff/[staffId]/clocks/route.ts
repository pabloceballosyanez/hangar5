import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ staffId: string }> };

// POST: create a clock event for a staff member
const createClockSchema = z.object({
  type: z.enum(["IN", "OUT"]),
  timestamp: z.string(),
});

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { staffId } = await params;
    const body = await req.json();
    const parsed = createClockSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const staff = await prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) return NextResponse.json({ error: "Staff no encontrado" }, { status: 404 });

    const clock = await prisma.staffClock.create({
      data: {
        staffId,
        type: parsed.data.type,
        timestamp: new Date(parsed.data.timestamp),
      },
    });

    return NextResponse.json(clock, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/restaurant/staff/[staffId]/clocks]", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
