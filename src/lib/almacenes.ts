import { prisma } from "@/lib/prisma";

/**
 * Inventario por almacén.
 *
 * ── El problema que resuelve ────────────────────────────────────────
 * Ingredient tenía un solo `currentStock` para todo el Hangar. El café y
 * el restaurante se pisaban: si el barista contaba leche, la cocina veía
 * ese número. Ahora cada almacén lleva su cuenta.
 *
 * ── Regla de oro ────────────────────────────────────────────────────
 * Un traspaso NO crea ni destruye mercancía: sale de uno y entra en otro.
 * Si se pudiera transferir más de lo que hay, el inventario mentiría, así
 * que se rechaza.
 */

export const CLAVE_COCINA = "cocina";
export const CLAVE_CAFE = "barra-cafe";

/** Crea los almacenes que falten, ligados a su ubicación cuando exista. */
export async function asegurarAlmacenes(): Promise<void> {
  const [cocina, cafe] = await Promise.all([
    prisma.ubicacion.findFirst({ where: { clave: "restaurante" }, select: { id: true } }),
    prisma.ubicacion.findFirst({ where: { clave: "cafe" }, select: { id: true } }),
  ]);

  const deseado = [
    { clave: CLAVE_COCINA, nombre: "Cocina del restaurante", ubicacionId: cocina?.id ?? null },
    { clave: CLAVE_CAFE, nombre: "Barra del Despegue", ubicacionId: cafe?.id ?? null },
  ];

  for (const a of deseado) {
    const existe = await prisma.almacen.findUnique({ where: { clave: a.clave } });
    if (existe) {
      // Si el almacén ya estaba pero sin ubicación, se liga ahora
      if (!existe.ubicacionId && a.ubicacionId) {
        await prisma.almacen.update({ where: { id: existe.id }, data: { ubicacionId: a.ubicacionId } });
      }
      continue;
    }
    await prisma.almacen.create({ data: a });
  }
}

/**
 * Migra el stock que hoy vive en Ingredient.currentStock al almacén de
 * cocina. Se corre una sola vez: si ya hay registros por almacén, no toca
 * nada. El café arranca en cero y se surte por traspaso.
 */
export async function migrarStockACocina(): Promise<number> {
  const almacen = await prisma.almacen.findUnique({ where: { clave: CLAVE_COCINA } });
  if (!almacen) throw new Error("No existe el almacén de cocina");

  const yaMigrado = await prisma.stockAlmacen.count({ where: { almacenId: almacen.id } });
  if (yaMigrado > 0) return 0;

  const ingredientes = await prisma.ingredient.findMany({
    select: { id: true, currentStock: true, minStock: true },
  });

  let creados = 0;
  for (const ing of ingredientes) {
    await prisma.stockAlmacen.create({
      data: {
        almacenId: almacen.id,
        ingredientId: ing.id,
        cantidad: ing.currentStock,
        minimo: ing.minStock,
      },
    });
    creados++;
  }
  return creados;
}

/** Cuánto hay de un insumo en un almacén (0 si nunca se registró). */
export async function stockEn(almacenId: string, ingredientId: string): Promise<number> {
  const s = await prisma.stockAlmacen.findUnique({
    where: { almacenId_ingredientId: { almacenId, ingredientId } },
    select: { cantidad: true },
  });
  return s?.cantidad ?? 0;
}

/**
 * Mueve mercancía de un almacén a otro.
 *
 * Rechaza si no hay suficiente en el origen: un traspaso no puede sacar
 * de donde no hay, o el inventario dejaría de cuadrar.
 */
export async function traspasar(params: {
  ingredientId: string;
  origenClave: string;
  destinoClave: string;
  cantidad: number;
  actorName?: string;
  notas?: string;
}): Promise<{ ok: true; folio: string } | { ok: false; error: string }> {
  const { ingredientId, origenClave, destinoClave, cantidad, actorName, notas } = params;

  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    return { ok: false, error: "La cantidad tiene que ser mayor que cero" };
  }
  if (origenClave === destinoClave) {
    return { ok: false, error: "El origen y el destino son el mismo almacén" };
  }

  const [origen, destino] = await Promise.all([
    prisma.almacen.findUnique({ where: { clave: origenClave } }),
    prisma.almacen.findUnique({ where: { clave: destinoClave } }),
  ]);
  if (!origen) return { ok: false, error: "El almacén de origen no existe" };
  if (!destino) return { ok: false, error: "El almacén de destino no existe" };

  const hay = await stockEn(origen.id, ingredientId);
  if (hay < cantidad) {
    return { ok: false, error: `Solo hay ${hay} en ${origen.nombre}` };
  }

  const ingrediente = await prisma.ingredient.findUnique({
    where: { id: ingredientId },
    select: { name: true, unit: true },
  });
  if (!ingrediente) return { ok: false, error: "El insumo no existe" };

  const folio = `TR-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  await prisma.$transaction(async (tx) => {
    // Sale del origen
    await tx.stockAlmacen.update({
      where: { almacenId_ingredientId: { almacenId: origen.id, ingredientId } },
      data: { cantidad: { decrement: cantidad } },
    });

    // Entra en el destino (puede no existir todavía)
    await tx.stockAlmacen.upsert({
      where: { almacenId_ingredientId: { almacenId: destino.id, ingredientId } },
      create: { almacenId: destino.id, ingredientId, cantidad },
      update: { cantidad: { increment: cantidad } },
    });

    await tx.traspaso.create({
      data: {
        folio,
        ingredientId,
        origenId: origen.id,
        destinoId: destino.id,
        cantidad,
        actorName: actorName ?? null,
        notas: notas ?? null,
      },
    });

    /* El movimiento queda en la bitácora de stock con el nombre del
       almacén, para que se pueda seguir la pista de dónde estuvo. */
    await tx.stockMovement.create({
      data: {
        ingredientId,
        delta: -cantidad,
        reason: `traspaso_salida:${destino.clave}`,
        actorName: actorName ?? null,
        notes: `${cantidad} ${ingrediente.unit} de ${ingrediente.name} → ${destino.nombre}`,
      },
    });
    await tx.stockMovement.create({
      data: {
        ingredientId,
        delta: cantidad,
        reason: `traspaso_entrada:${origen.clave}`,
        actorName: actorName ?? null,
        notes: `${cantidad} ${ingrediente.unit} de ${ingrediente.name} ← ${origen.nombre}`,
      },
    });
  });

  return { ok: true, folio };
}

/** Insumos con su existencia en cada almacén. */
export async function inventarioPorAlmacen() {
  const almacenes = await prisma.almacen.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
    select: { id: true, clave: true, nombre: true },
  });

  const ingredientes = await prisma.ingredient.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      unit: true,
      minStock: true,
      stocks: { select: { almacenId: true, cantidad: true, minimo: true } },
    },
  });

  return {
    almacenes,
    filas: ingredientes.map((i) => ({
      id: i.id,
      nombre: i.name,
      unidad: i.unit,
      porAlmacen: Object.fromEntries(
        almacenes.map((a) => {
          const s = i.stocks.find((x) => x.almacenId === a.id);
          const cantidad = s?.cantidad ?? 0;
          const minimo = s?.minimo ?? i.minStock;
          return [a.clave, { cantidad, minimo, bajo: cantidad <= minimo }];
        })
      ),
    })),
  };
}
