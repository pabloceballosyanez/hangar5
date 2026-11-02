import { prisma } from "@/lib/prisma";

/**
 * Tipos de producto y sus modificadores heredados.
 *
 * ── El problema que resuelve ────────────────────────────────────────
 * Las categorías agrupan el menú PARA EL CLIENTE. "Horno" junta las
 * pizzas con las empanadas porque se hornean, y "Bebidas sin Alcohol"
 * junta aguas, Cocas y smoothies. Eso está bien en la carta, pero no
 * sirve como regla: heredar "Extras Pizza" a la categoría Horno le
 * pondría pepperoni a las empanadas.
 *
 * El TIPO dice qué ES el producto. Sobre el tipo se heredan los
 * modificadores, y así:
 *
 *   · Pizza    → hereda "Extras Pizza"       (6 platillos)
 *   · Empanada → no hereda nada              (aunque esté en Horno)
 *   · Refresco → no hereda nada              (aunque esté con los smoothies)
 *   · Smoothie → hereda "Extras Smothies"    (2 platillos)
 *
 * ── Cómo se clasifica ───────────────────────────────────────────────
 * Por nombre, con reglas explícitas. Es simple y predecible; si algún
 * día hay 300 platillos, esto se reemplaza por un campo en el admin.
 */

/** Reglas de clasificación: del nombre del platillo al tipo. */
const REGLAS: Array<{ patron: RegExp; tipo: string }> = [
  /* Postres que se llaman "pizza" pero no lo son: la de Nutela y
     Plátano no lleva queso ni pepperoni. Van antes para que no caigan
     en el tipo Pizza. */
  { patron: /^pizza nutela|^pizza de nutela|^pizza (dulce|chocolate)/i, tipo: "Pizza Dulce" },
  { patron: /^pizza /i, tipo: "Pizza" },
  { patron: /^empanada/i, tipo: "Empanada" },

  // Desayunos
  { patron: /^huevo/i, tipo: "Huevo" },
  { patron: /^chilaquil/i, tipo: "Chilaquiles" },
  { patron: /^fruta/i, tipo: "Fruta" },

  // Parrilla
  { patron: /^quesadilla/i, tipo: "Quesadilla" },
  { patron: /^taco$/i, tipo: "Taco" },
  { patron: /^flauta/i, tipo: "Flauta" },
  { patron: /hamburguesa/i, tipo: "Hamburguesa" },

  // Ensaladas
  { patron: /^ensalada/i, tipo: "Ensalada" },
  { patron: /^guacamole/i, tipo: "Guacamole" },
  { patron: /^verduras/i, tipo: "Verduras" },
  { patron: /^aceitunas/i, tipo: "Aceitunas" },

  // Postres
  { patron: /^flan/i, tipo: "Flan" },
  { patron: /^panqué/i, tipo: "Panqué" },
  { patron: /^pay /i, tipo: "Pay" },

  // Cafetería
  { patron: /^café|^cafe|^latte|^espresso|^capuchino/i, tipo: "Café" },
  { patron: /^sándwich|^sandwich/i, tipo: "Sándwich" },

  // Bebidas sin alcohol
  { patron: /^smoothie/i, tipo: "Smoothie" },
  { patron: /^coca cola|^coca/i, tipo: "Refresco" },
  { patron: /^agua |^botella de agua/i, tipo: "Agua" },
  { patron: /^jugo|de naranja$/i, tipo: "Jugo" },
  { patron: /^té |^te /i, tipo: "Té" },
  { patron: /^suero/i, tipo: "Suero" },
  { patron: /^clamato/i, tipo: "Clamato" },
  { patron: /^piña colada$/i, tipo: "Piña Colada" },

  // Bebidas con alcohol
  { patron: /^cerveza/i, tipo: "Cerveza" },
  { patron: /^shot /i, tipo: "Shot" },
  { patron: /^whisky/i, tipo: "Whisky" },
  { patron: /^vino|copa vino|botella de vino/i, tipo: "Vino" },
  { patron: /^margarita$/i, tipo: "Margarita" },
  { patron: /^mojito$/i, tipo: "Mojito" },
  { patron: /^mezcalina$/i, tipo: "Mezcalina" },
  { patron: /^paloma/i, tipo: "Paloma" },
  { patron: /^carajillo$/i, tipo: "Carajillo" },
  { patron: /^piña colada con/i, tipo: "Piña Colada" },
];

/** Deduce el tipo de un platillo por su nombre. */
export function tipoPorNombre(nombre: string): string {
  const limpio = nombre.trim();
  for (const { patron, tipo } of REGLAS) {
    if (patron.test(limpio)) return tipo;
  }
  return "Otro";
}

/**
 * Qué modificadores hereda cada tipo.
 * Un tipo que no aparece aquí no hereda nada.
 */
const HERENCIA: Record<string, string[]> = {
  Pizza: ["Extras Pizza"],
  Café: ["Extras cafe"],
  Smoothie: ["Extras Smothies"],
  Cerveza: ["Extras Cerveza"],
  Chilaquiles: ["Extras Chilaquiles"],
  Fruta: ["Extras Fruta"],
  Huevo: ["Cocción huevos"],
  Ensalada: ["Aderezo"],
  Quesadilla: ["Extra Quesadillas"],
};

/** Crea los tipos que falten y clasifica los platillos. */
export async function asegurarTipos(): Promise<{
  tiposCreados: number;
  clasificados: number;
}> {
  const items = await prisma.menuItem.findMany({
    select: { id: true, name: true, tipoId: true },
  });

  const existentes = await prisma.tipoProducto.findMany({ select: { id: true, nombre: true } });
  const porNombre = new Map(existentes.map((t) => [t.nombre, t.id]));

  let tiposCreados = 0;
  let clasificados = 0;
  let orden = existentes.length;

  for (const item of items) {
    const nombreTipo = tipoPorNombre(item.name);

    let tipoId = porNombre.get(nombreTipo);
    if (!tipoId) {
      const creado = await prisma.tipoProducto.create({
        data: { nombre: nombreTipo, orden: orden++ },
      });
      tipoId = creado.id;
      porNombre.set(nombreTipo, tipoId);
      tiposCreados++;
    }

    if (item.tipoId !== tipoId) {
      await prisma.menuItem.update({ where: { id: item.id }, data: { tipoId } });
      clasificados++;
    }
  }

  return { tiposCreados, clasificados };
}

/** Aplica la herencia: liga cada grupo al tipo que lo hereda. */
export async function aplicarHerencia(): Promise<number> {
  let aplicados = 0;

  for (const [nombreTipo, grupos] of Object.entries(HERENCIA)) {
    const tipo = await prisma.tipoProducto.findUnique({ where: { nombre: nombreTipo } });
    if (!tipo) continue;

    for (const nombreGrupo of grupos) {
      const grupo = await prisma.modifierGroup.findFirst({ where: { name: nombreGrupo } });
      if (!grupo) {
        console.log(`    (falta el grupo "${nombreGrupo}")`);
        continue;
      }

      const ya = await prisma.tipoProductoModifierGroup.findFirst({
        where: { tipoId: tipo.id, modifierGroupId: grupo.id },
      });
      if (ya) continue;

      await prisma.tipoProductoModifierGroup.create({
        data: { tipoId: tipo.id, modifierGroupId: grupo.id },
      });
      aplicados++;
    }
  }

  return aplicados;
}

/** Resumen de tipos para revisar antes de aplicar. */
export async function resumenTipos() {
  const tipos = await prisma.tipoProducto.findMany({
    orderBy: { orden: "asc" },
    include: {
      menuItems: { select: { name: true }, orderBy: { name: "asc" } },
      modifierGroups: { include: { modifierGroup: { select: { name: true } } } },
    },
  });

  return tipos.map((t) => ({
    tipo: t.nombre,
    platillos: t.menuItems.map((m) => m.name),
    hereda: t.modifierGroups.map((g) => g.modifierGroup.name),
    sugerido: HERENCIA[t.nombre] ?? [],
  }));
}
