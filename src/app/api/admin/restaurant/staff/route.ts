import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generarPin, hashearPin, pinEsValido } from "@/lib/pines";

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

const staffSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "El nombre es requerido"),
  role: z.string().min(1, "El rol es requerido"),
  pin: z.string().min(4, "El PIN debe tener al menos 4 caracteres").default("0000"),
  phone: z.string().optional().nullable(),
  email: z.string().email("Email inválido").optional().nullable().or(z.literal("")),
  hourlyRate: z.number().min(0).default(0),
  isActive: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = staffSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { id, name, role, pin, phone, email, hourlyRate, isActive } = parsed.data;

    if (id) {
      const u = await prisma.staff.update({
        where: { id },
        data: { name, role, pin, phone: phone ?? null, email: email || null, hourlyRate, isActive },
      });
      return NextResponse.json(u);
    }

    /* Alta nueva. Si no viene PIN, se genera uno único y se devuelve en
       claro UNA vez para que se lo des. La persona tendrá que elegir el
       suyo al entrar. Antes se guardaba '0000' para todos. */
    const otros = await prisma.staff.findMany({
      where: { pin: { not: null } },
      select: { pin: true },
    });
    const hashes = otros.map((o) => o.pin!).filter(Boolean);

    const pinFinal = pin && pinEsValido(pin).ok ? pin : generarPin(hashes);

    const c = await prisma.staff.create({
      data: {
        name,
        role,
        pin: hashearPin(pinFinal),
        debeCambiarPin: !pin, // si no lo eligió el admin, que lo elija quien lo use
        pinActualizadoAt: new Date(),
        phone: phone ?? null,
        email: email || null,
        hourlyRate,
      },
    });

    /* El PIN en claro solo viaja aquí. No se guarda ni se puede volver a
       consultar. */
    return NextResponse.json({ ...c, pinTemporal: pin ? undefined : pinFinal }, { status: 201 });
    } catch { return NextResponse.json({ error: "Error" }, { status: 500 }); }
    }
