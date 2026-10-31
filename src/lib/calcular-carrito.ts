import { prisma } from "@/lib/prisma";

/**
 * Calculadora de precios del carrito — UNA sola fuente de verdad.
 *
 * ── Por qué existe ───────────────────────────────────────────────────
 * El checkout de MercadoPago cobraba el precio BASE de cada platillo,
 * mientras que la orden guardada sí sumaba las variantes y los
 * modificadores. Resultado: si alguien pedía una pizza grande con
 * extra de queso, se le cobraba de menos. Dinero perdido en cada venta
 * con extras.
 *
 * Teniendo el cálculo en un solo lugar, lo que se cobra y lo que se
 * guarda no pueden volver a separarse.
 */

export interface CartItemInput {
  menuItemId: string;
  variantId?: string | null;
  quantity: number;
  specialInstructions?: string | null;
  modifierIds?: string[];
}

export interface LineaCalculada {
  item: CartItemInput;
  menuItem: { id: string; name: string; basePrice: number; isActive: boolean };
  variant: { id: string; name: string; priceDelta: number } | null;
  modificadores: Array<{ id: string; name: string; priceDelta: number }>;
  precioUnitario: number;   // base + variante + modificadores
  totalLinea: number;       // precioUnitario × cantidad
}

export interface CarritoCalculado {
  lineas: LineaCalculada[];
  subtotal: number;
  tax: number;
  total: number;
}

/**
 * Calcula el carrito completo a partir de lo que mandó el cliente.
 * Lanza un error con mensaje legible si algo no cuadra —
 * nunca deja pasar un platillo inexistente o inactivo.
 */
export async function calcularCarrito(items: CartItemInput[]): Promise<CarritoCalculado> {
  if (!items.length) throw new Error("El carrito está vacío");

  const menuItemIds = [...new Set(items.map((i) => i.menuItemId))];
  const variantIds = [...new Set(items.map((i) => i.variantId).filter(Boolean))] as string[];
  const modifierIds = [...new Set(items.flatMap((i) => i.modifierIds || []))];

  const [menuItems, variantes, modificadores] = await Promise.all([
    prisma.menuItem.findMany({ where: { id: { in: menuItemIds } } }),
    variantIds.length
      ? prisma.menuItemVariant.findMany({ where: { id: { in: variantIds } } })
      : Promise.resolve([]),
    modifierIds.length
      ? prisma.modifier.findMany({ where: { id: { in: modifierIds } } })
      : Promise.resolve([]),
  ]);

  const mapaItems = new Map(menuItems.map((m) => [m.id, m]));
  const mapaVariantes = new Map(variantes.map((v) => [v.id, v]));
  const mapaMods = new Map(modificadores.map((m) => [m.id, m]));

  let subtotal = 0;

  const lineas = items.map((item) => {
    const menuItem = mapaItems.get(item.menuItemId);

    // Antes esto era `mapa.get(id)!` y un id inválido reventaba con 500.
    if (!menuItem) {
      throw new Error(`El platillo ya no existe. Actualiza el menú e intenta de nuevo.`);
    }
    if (!menuItem.isActive) {
      throw new Error(`"${menuItem.name}" no está disponible en este momento.`);
    }
    if (!Number.isFinite(item.quantity) || item.quantity < 1) {
      throw new Error(`Cantidad inválida para "${menuItem.name}".`);
    }

    const variant = item.variantId ? mapaVariantes.get(item.variantId) ?? null : null;
    if (item.variantId && !variant) {
      throw new Error(`La presentación elegida para "${menuItem.name}" ya no está disponible.`);
    }

    const modificadoresLinea = (item.modifierIds || [])
      .map((id) => mapaMods.get(id))
      .filter((m): m is NonNullable<typeof m> => Boolean(m));

    if (modificadoresLinea.length !== (item.modifierIds || []).length) {
      throw new Error(`Uno de los extras de "${menuItem.name}" ya no está disponible.`);
    }

    const precioUnitario =
      menuItem.basePrice +
      (variant?.priceDelta ?? 0) +
      modificadoresLinea.reduce((suma, m) => suma + m.priceDelta, 0);

    const totalLinea = precioUnitario * item.quantity;
    subtotal += totalLinea;

    return {
      item,
      menuItem: {
        id: menuItem.id,
        name: menuItem.name,
        basePrice: menuItem.basePrice,
        isActive: menuItem.isActive,
      },
      variant: variant ? { id: variant.id, name: variant.name, priceDelta: variant.priceDelta } : null,
      modificadores: modificadoresLinea.map((m) => ({
        id: m.id,
        name: m.name,
        priceDelta: m.priceDelta,
      })),
      precioUnitario,
      totalLinea,
    };
  });

  // Los precios se guardan en centavos. El IVA va incluido en el total,
  // así que solo se desglosa: no se suma aparte.
  const tax = Math.round(subtotal - subtotal / 1.16);

  return { lineas, subtotal, tax, total: subtotal };
}

/**
 * Convierte las líneas calculadas al formato que espera MercadoPago.
 * Cada extra y cada variante van como concepto propio, para que el
 * cliente vea exactamente lo que está pagando.
 */
export function aItemsMercadoPago(carrito: CarritoCalculado) {
  return carrito.lineas.map((l) => {
    const detalles: string[] = [];
    if (l.variant) detalles.push(l.variant.name);
    if (l.modificadores.length) detalles.push(`+ ${l.modificadores.map((m) => m.name).join(", ")}`);

    return {
      id: l.menuItem.id,
      title: detalles.length ? `${l.menuItem.name} (${detalles.join("; ")})` : l.menuItem.name,
      quantity: l.item.quantity,
      // El precio YA incluye variante y modificadores
      unit_price: l.precioUnitario / 100,
      currency_id: "MXN",
    };
  });
}
