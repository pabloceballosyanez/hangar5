import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/admin/restaurant/recipes/import
// Body: { csv: "menuItemName,ingredientName,quantity,yieldQuantity,notes\n..." }
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
    const nameIdx = headers.indexOf("menuItemName");
    const ingIdx = headers.indexOf("ingredientName");
    const qtyIdx = headers.indexOf("quantity");
    const yieldIdx = headers.indexOf("yieldQuantity");
    const notesIdx = headers.indexOf("notes");

    if (nameIdx === -1 || ingIdx === -1) {
      return NextResponse.json({ error: "Columnas 'menuItemName' e 'ingredientName' requeridas" }, { status: 400 });
    }

    // Agrupar filas por menuItemName
    const groups = new Map<string, { ingredientName: string; quantity: number; yieldQuantity: number; notes: string }[]>();
    
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map(c => c.trim());
      const name = cols[nameIdx];
      const ing = cols[ingIdx];
      if (!name || !ing) continue;
      
      const qty = parseFloat(cols[qtyIdx]) || 0;
      const yq = parseFloat(cols[yieldIdx]) || 1;
      const notes = notesIdx >= 0 ? cols[notesIdx] || "" : "";
      
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name)!.push({ ingredientName: ing, quantity: qty, yieldQuantity: yq, notes });
    }

    let created = 0, updated = 0, errors = 0;
    const errorDetails: string[] = [];

    for (const [recipeName, items] of groups) {
      try {
        // Buscar MenuItem por nombre
        const menuItem = await prisma.menuItem.findFirst({ where: { name: recipeName } });
        if (!menuItem) {
          errors++;
          errorDetails.push(`${recipeName}: MenuItem no encontrado`);
          continue;
        }

        // Buscar o crear receta
        let recipe = await prisma.recipe.findUnique({ where: { menuItemId: menuItem.id } });
        const yq = items[0]?.yieldQuantity || 1;
        const notes = items[0]?.notes || null;

        if (recipe) {
          await prisma.recipe.update({ where: { id: recipe.id }, data: { yieldQuantity: yq, notes } });
          // Eliminar recipeItems existentes y reemplazar
          await prisma.recipeItem.deleteMany({ where: { recipeId: recipe.id } });
          updated++;
        } else {
          recipe = await prisma.recipe.create({
            data: { menuItemId: menuItem.id, yieldQuantity: yq, notes },
          });
          created++;
        }

        // Agregar ingredientes
        for (const item of items) {
          const ingredient = await prisma.ingredient.findFirst({ where: { name: item.ingredientName } });
          if (!ingredient) {
            errors++;
            errorDetails.push(`${recipeName}: Ingrediente "${item.ingredientName}" no encontrado`);
            continue;
          }

          await prisma.recipeItem.create({
            data: {
              recipeId: recipe.id,
              ingredientId: ingredient.id,
              quantity: item.quantity,
            },
          });
        }
      } catch (e: any) {
        errors++;
        errorDetails.push(`${recipeName}: ${e.message?.slice(0, 80)}`);
      }
    }

    return NextResponse.json({
      success: true,
      created,
      updated,
      errors,
      errorDetails: errorDetails.slice(0, 15),
      message: `${created} recetas creadas, ${updated} actualizadas, ${errors} errores`,
    });
  } catch (err) {
    console.error("[POST /api/admin/restaurant/recipes/import]", err);
    return NextResponse.json({ error: "Error al importar recetas" }, { status: 500 });
  }
}
