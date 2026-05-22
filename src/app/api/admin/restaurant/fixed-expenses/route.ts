import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── GET: all fixed expenses ─────────────────────────────────────────────────
export async function GET() {
  try {
    const expenses = await prisma.fixedExpense.findMany({
      orderBy: { createdAt: "desc" },
    });

    const result = expenses.map((e) => ({
      ...e,
      amountDisplay: Math.round(e.amount / 100),
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/admin/restaurant/fixed-expenses]", err);
    return NextResponse.json(
      { error: "Error al obtener gastos fijos" },
      { status: 500 }
    );
  }
}

// ─── POST: create fixed expense ──────────────────────────────────────────────
const createExpenseSchema = z.object({
  description: z.string().min(1, "Descripción requerida"),
  amount: z.number().int().positive("Monto debe ser positivo"),
  category: z.enum(["RENT", "UTILITIES", "SERVICES", "OTHER"]),
  isActive: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const expense = await prisma.fixedExpense.create({ data: parsed.data });
    return NextResponse.json(expense, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/restaurant/fixed-expenses]", err);
    return NextResponse.json(
      { error: "Error al crear gasto fijo" },
      { status: 500 }
    );
  }
}
