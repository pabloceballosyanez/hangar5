import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { agregarServicio, quitarServicio, serviciosDeCuenta, catalogoServicios } from "@/lib/servicios";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/restaurant/sessions/[sessionId]/servicios
 *
 * Servicios de la cuenta. Con ?catalogo=1 devuelve además qué se puede
 * vender, agrupado por tipo, para el selector.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const cuenta = await serviciosDeCuenta(sessionId);

  const url = new URL(req.url);
  if (url.searchParams.get("catalogo") === "1") {
    return NextResponse.json({ ...cuenta, catalogo: await catalogoServicios() });
  }

  return NextResponse.json(cuenta);
}

const agregarSchema = z.object({
  itemId: z.string().min(1, "Falta el servicio"),
  cantidad: z.number().int().min(1).optional(),
  fechaServicio: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
});

/**
 * POST /api/admin/restaurant/sessions/[sessionId]/servicios
 *
 * Agrega un servicio (moto, bici, vuelo) a la cuenta.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const parseo = agregarSchema.safeParse(body);
  if (!parseo.success) {
    const primerError = parseo.error.issues[0]?.message ?? "Datos incompletos";
    return NextResponse.json({ error: primerError }, { status: 400 });
  }

  const resultado = await agregarServicio(sessionId, parseo.data);
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    servicio: resultado.servicio,
    ...(await serviciosDeCuenta(sessionId)),
  });
}

/**
 * DELETE /api/admin/restaurant/sessions/[sessionId]/servicios?servicioId=...
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const servicioId = new URL(req.url).searchParams.get("servicioId");

  if (!servicioId) {
    return NextResponse.json({ error: "Falta servicioId" }, { status: 400 });
  }

  const resultado = await quitarServicio(sessionId, servicioId);
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, ...(await serviciosDeCuenta(sessionId)) });
}
