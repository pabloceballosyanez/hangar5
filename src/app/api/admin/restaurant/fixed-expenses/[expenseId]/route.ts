import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ expenseId: string }> };

// PUT: update fixed expense
const updateExpenseSchema = z.object({
  description: z.string().min(1).optional(),
  amount: z.number().int().positive().optional(),
  category: z.enum(["RENT", "UTILITIES", "SERVICES", "OTHER"]).optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { expenseId } = await params;
    const body = await req.json();
    const parsed = updateExpenseSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const existing = await prisma.fixedExpense.findUnique({ where: { id: expenseId } });
    if (!existing) return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 });

    const updated = await prisma.fixedExpense.update({ where: { id: expenseId }, data: parsed.data });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PUT /api/admin/restaurant/fixed-expenses/[expenseId]]", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

// DELETE: remove fixed expense
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { expenseId } = await params;
    const existing = await prisma.fixedExpense.findUnique({ where: { id: expenseId } });
    if (!existing) return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 });

    await prisma.fixedExpense.delete({ where: { id: expenseId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/admin/restaurant/fixed-expenses/[expenseId]]", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
