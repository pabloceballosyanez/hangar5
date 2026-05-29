import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/admin/restaurant/ingredients/import
// Body: { csv: "name,unit,currentStock,minStock,cost\n..." }
export async function POST(req: NextRequest) {
  try {
    const { csv } = await req.json();
    if (!csv || typeof csv !== "string") {
      return NextResponse.json({ error: "CSV requerido en body.csv" }, { status: 400 });
    }

    const lines = csv.trim().split("\n");
    if (lines.length < 2) {
      return NextResponse.json({ error: "CSV debe tener header + al menos 1 fila" }, { status: 400 });
    }

    const headers = lines[0].split(",").map(h => h.trim());
    const nameIdx = headers.indexOf("name");
    const unitIdx = headers.indexOf("unit");
    const stockIdx = headers.indexOf("currentStock");
    const minIdx = headers.indexOf("minStock");
    const costIdx = headers.indexOf("cost");

    if (nameIdx === -1) {
      return NextResponse.json({ error: "Columna 'name' requerida" }, { status: 400 });
    }

    let created = 0, updated = 0, errors = 0;
    const errorDetails: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map(c => c.trim());
      const name = cols[nameIdx];
      if (!name) { errors++; continue; }

      try {
        const data: any = { name };
        if (unitIdx >= 0 && cols[unitIdx]) data.unit = cols[unitIdx];
        if (stockIdx >= 0 && cols[stockIdx]) data.currentStock = parseFloat(cols[stockIdx]) || 0;
        if (minIdx >= 0 && cols[minIdx]) data.minStock = parseFloat(cols[minIdx]) || 0;
        // cost viene en pesos, guardar en centavos
        if (costIdx >= 0 && cols[costIdx]) data.cost = Math.round((parseFloat(cols[costIdx]) || 0) * 100);

        const existing = await prisma.ingredient.findFirst({ where: { name } });
        if (existing) {
          await prisma.ingredient.update({ where: { id: existing.id }, data });
          updated++;
        } else {
          await prisma.ingredient.create({ data });
          created++;
        }
      } catch (e: any) {
        errors++;
        errorDetails.push(`${name}: ${e.message?.slice(0, 50)}`);
      }
    }

    return NextResponse.json({
      success: true,
      created,
      updated,
      errors,
      errorDetails: errorDetails.slice(0, 10),
      message: `${created} creados, ${updated} actualizados, ${errors} errores`,
    });
  } catch (err) {
    console.error("[POST /api/admin/restaurant/ingredients/import]", err);
    return NextResponse.json({ error: "Error al importar" }, { status: 500 });
  }
}
