import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/restaurant/checkout/cash
 * DEPRECATED — Pago en efectivo no disponible.
 */
export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { error: "Pago en efectivo no disponible" },
    { status: 410 }
  );
}
