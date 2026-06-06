import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = getCustomerSession(req);
    if (!session) {
      return NextResponse.json({ customer: null });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: session.customerId },
      select: { id: true, name: true, email: true, phone: true, hasCredit: true },
    });

    if (!customer) {
      return NextResponse.json({ customer: null });
    }

    return NextResponse.json({ customer });
  } catch (err) {
    console.error("[GET /api/auth/customer/me]", err);
    return NextResponse.json({ error: "Error al obtener sesión" }, { status: 500 });
  }
}
