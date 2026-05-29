import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, signCustomerSession, CUSTOMER_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

const registerSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  phone: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { name, email, password, phone } = parsed.data;

    // Check if email already exists
    const existing = await prisma.customer.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Este email ya está registrado. ¿Quieres iniciar sesión?" }, { status: 409 });
    }

    const hashed = hashPassword(password);

    const customer = await prisma.customer.create({
      data: { name, email, password: hashed, phone: phone ?? null },
    });

    const session = { customerId: customer.id, name: customer.name, email: customer.email! };
    const token = signCustomerSession(session);

    const res = NextResponse.json({ customer: { id: customer.id, name: customer.name, email: customer.email } }, { status: 201 });
    res.cookies.set(CUSTOMER_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 días
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("[POST /api/auth/customer/register]", err);
    return NextResponse.json({ error: "Error al registrar" }, { status: 500 });
  }
}
