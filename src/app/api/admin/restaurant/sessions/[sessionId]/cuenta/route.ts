import { NextRequest, NextResponse } from "next/server";
import { leerCuentaUnificada, reservasCandidatas } from "@/lib/cuenta-unificada";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/restaurant/sessions/[sessionId]/cuenta
 *
 * Devuelve la cuenta completa: consumo del restaurante, alojamiento
 * vinculado (si lo hay) y el total que se cobraría hoy.
 *
 * Con ?candidatas=1 además devuelve las reservas que se podrían
 * vincular, ordenadas por relevancia para esta cuenta.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const cuenta = await leerCuentaUnificada(sessionId);
  if (!cuenta) {
    return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
  }

  const url = new URL(req.url);
  if (url.searchParams.get("candidatas") === "1") {
    const busqueda = url.searchParams.get("q") ?? undefined;
    return NextResponse.json({
      cuenta,
      candidatas: await reservasCandidatas({ sessionId, busqueda }),
    });
  }

  return NextResponse.json({ cuenta });
}
