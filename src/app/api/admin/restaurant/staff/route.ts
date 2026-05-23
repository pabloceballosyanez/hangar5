import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── GET: all staff ──────────────────────────────────────────────────────────
export async function GET() {
  try {
    const staff = await prisma.staff.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(
      staff.map((s) => ({
        ...s,
        hourlyRate: s.hourlyRate / 100,
      }))
    );
  } catch (err) {
    console.error("[GET /api/admin/restaurant/staff]", err);
    return NextResponse.json({ error: "Error al obtener staff" }, { status: 500 });
  }
}

// ─── POST: create staff ──────────────────────────────────────────────────────
const createStaffSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  role: z.enum(["ADMIN", "WAITER", "COOK", "BARTENDER", "MANAGER"]),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  hourlyRate: z.number().nonnegative().default(0),
  isActive: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createStaffSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data = {
      ...parsed.data,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      hourlyRate: Math.round(parsed.data.hourlyRate * 100),
    };

    const staff = await prisma.staff.create({ data });
    return NextResponse.json(
      { ...staff, hourlyRate: staff.hourlyRate / 100 },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/admin/restaurant/staff]", err);
    return NextResponse.json({ error: "Error al crear staff" }, { status: 500 });
  }
}
