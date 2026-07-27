import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DB_PATH = process.env.DATABASE_URL?.replace("file:", "") || "/data/hangar5.db";

/**
 * POST /api/admin/import-db — temporal para copiar DB de producción al preview.
 * Recibe el archivo binario SQLite y reemplaza la DB actual.
 * SE BORRA después de usarlo.
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
