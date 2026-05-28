import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ROLE_MAP: Record<string, string> = {
  ADMIN: "SUPER_ADMIN", WAITER: "MESERO", COOK: "COCINERO", BARTENDER: "BAR", MANAGER: "GERENTE",
};
function fix(r: string): string { return ROLE_MAP[r] || r; }

export async function GET() {
  try {
    const staff = await prisma.staff.findMany({
      where: { isActive: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(staff.map(s => ({ ...s, role: fix(s.role) })));
  } catch { return NextResponse.json({ error: "Error" }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, role, pin, phone, email, hourlyRate, isActive } = body;
    if (id) {
      const u = await prisma.staff.update({ where: { id }, data: { name, role, pin, phone, email, hourlyRate, isActive } });
      return NextResponse.json(u);
    }
    const c = await prisma.staff.create({ data: { name, role: role || 'MESERO', pin: pin || '0000', phone, email, hourlyRate: hourlyRate || 0 } });
    return NextResponse.json(c, { status: 201 });
  } catch { return NextResponse.json({ error: "Error" }, { status: 500 }); }
}
