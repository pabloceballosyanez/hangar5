import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signCustomerSession, CUSTOMER_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { email, password } = parsed.data;

    const customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer || !customer.password) {
      return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
    }

    if (!verifyPassword(password, customer.password)) {
      return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
    }

    const session = { customerId: customer.id, name: customer.name, email: customer.email! };
    const token = signCustomerSession(session);

    const res = NextResponse.json({ customer: { id: customer.id, name: customer.name, email: customer.email } });
    res.cookies.set(CUSTOMER_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("[POST /api/auth/customer/login]", err);
    return NextResponse.json({ error: "Error al iniciar sesión" }, { status: 500 });
  }
}
