import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DB_PATH = process.env.DATABASE_URL?.replace("file:", "") || "/data/hangar5.db";

/**
 * POST /api/import-db — temporal para copiar DB de producción al preview.
 * SE BORRA antes del merge. No va a producción.
 */
export async function POST(req: NextRequest) {
  try {
    const buffer = Buffer.from(await req.arrayBuffer());
    if (buffer.length < 10000) {
      return NextResponse.json({ error: "Archivo muy pequeño, ¿es una DB válida?" }, { status: 400 });
    }
    const fs = await import("fs");
    fs.writeFileSync(DB_PATH, buffer);
    return NextResponse.json({ ok: true, size: buffer.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
