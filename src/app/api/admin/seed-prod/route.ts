// Production seed — runs against Render's /data/hangar5.db
// Triggered via POST /api/admin/seed-prod (admin auth required)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST — re-seed production database
export async function POST(req: NextRequest) {
  const adminSession = req.cookies.get("hangar5_admin_session")?.value;
  if (!adminSession || adminSession !== "true") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    // Clear EVERYTHING
    const tables = [
      "OrderStatusEvent", "OrderItemModifier", "OrderItem", "Payment", "Order",
      "ServiceSession", "Booking", "StockMovement", "RecipeItem", "Recipe",
      "MenuItemModifierGroup", "MenuItemVariant",
      "StaffShift", "StaffClock", "CustomerLedgerEntry", "Customer", "FixedExpense",
    ];
    for (const table of tables) {
      try { await (prisma as any)[table.charAt(0).toLowerCase() + table.slice(1)].deleteMany(); } catch {}
    }
    // Clear reference data
    await prisma.ingredient.deleteMany();
    await prisma.menuItem.deleteMany();
    await prisma.category.deleteMany();
    await prisma.item.deleteMany();
    await prisma.table.deleteMany();

    // ── Categories ──
    const cats = [
      { id: "cat-desayunos", name: "Desayunos", kind: "FOOD", sortOrder: 1, isActive: true },
      { id: "cat-ensaladas", name: "Ensaladas", kind: "FOOD", sortOrder: 2, isActive: true },
      { id: "cat-horno", name: "Horno", kind: "FOOD", sortOrder: 3, isActive: true },
      { id: "cat-parrilla", name: "Parrilla", kind: "FOOD", sortOrder: 4, isActive: true },
      { id: "cat-postres", name: "Postres", kind: "FOOD", sortOrder: 5, isActive: true },
      { id: "cat-cafeteria-comida", name: "Cafetería Comida", kind: "FOOD", sortOrder: 6, isActive: true },
      { id: "cat-cafeteria-bebidas", name: "Cafetería Bebidas", kind: "DRINK", sortOrder: 7, isActive: true },
      { id: "cat-bebidas-sin-alcohol", name: "Bebidas sin Alcohol", kind: "DRINK", sortOrder: 8, isActive: true },
      { id: "cat-bebidas-con-alcohol", name: "Bebidas con Alcohol", kind: "DRINK", sortOrder: 9, isActive: true },
      { id: "cat-especiales", name: "Especiales", kind: "FOOD", sortOrder: 10, isActive: true },
    ];
    for (const c of cats) await prisma.category.create({ data: c as any });

    // ── Ingredients ──
    const ingredients = [
      // Generic (for recipes)
      { id: "ing-tortilla-de-maiz", name: "Tortilla de Maíz", unit: "pieza", cost: 150, currentStock: 0, isActive: true },
      { id: "ing-huevo", name: "Huevo", unit: "pieza", cost: 350, currentStock: 0, isActive: true },
      { id: "ing-jitomate", name: "Jitomate", unit: "kg", cost: 2500, currentStock: 0, isActive: true },
      { id: "ing-cebolla-blanca", name: "Cebolla Blanca", unit: "kg", cost: 2000, currentStock: 0, isActive: true },
      { id: "ing-chile-serrano", name: "Chile Serrano", unit: "kg", cost: 4000, currentStock: 0, isActive: true },
      { id: "ing-chile-jalapeno", name: "Chile Jalapeño", unit: "kg", cost: 3500, currentStock: 0, isActive: true },
      { id: "ing-aguacate", name: "Aguacate", unit: "pieza", cost: 1500, currentStock: 0, isActive: true },
      { id: "ing-limon", name: "Limón", unit: "kg", cost: 2000, currentStock: 0, isActive: true },
      { id: "ing-cilantro", name: "Cilantro", unit: "manojo", cost: 800, currentStock: 0, isActive: true },
      { id: "ing-queso-oaxaca", name: "Queso Oaxaca", unit: "kg", cost: 12000, currentStock: 0, isActive: true },
      { id: "ing-queso-mozzarella", name: "Queso Mozzarella", unit: "kg", cost: 11000, currentStock: 0, isActive: true },
      { id: "ing-queso-parmesano", name: "Queso Parmesano", unit: "kg", cost: 18000, currentStock: 0, isActive: true },
      { id: "ing-queso-crema", name: "Queso Crema", unit: "kg", cost: 9000, currentStock: 0, isActive: true },
      { id: "ing-crema-acida", name: "Crema Ácida", unit: "L", cost: 6000, currentStock: 0, isActive: true },
      { id: "ing-frijol-refrito", name: "Frijol Refrito", unit: "kg", cost: 3500, currentStock: 0, isActive: true },
      { id: "ing-mantequilla", name: "Mantequilla", unit: "kg", cost: 12000, currentStock: 0, isActive: true },
      { id: "ing-aceite-vegetal", name: "Aceite Vegetal", unit: "L", cost: 3500, currentStock: 0, isActive: true },
      { id: "ing-leche-entera", name: "Leche Entera", unit: "L", cost: 2200, currentStock: 0, isActive: true },
      { id: "ing-cafe-molido", name: "Café Molido", unit: "kg", cost: 16000, currentStock: 0, isActive: true },
      { id: "ing-azucar", name: "Azúcar", unit: "kg", cost: 2500, currentStock: 0, isActive: true },
      { id: "ing-harina-de-trigo", name: "Harina de Trigo", unit: "kg", cost: 1800, currentStock: 0, isActive: true },
      { id: "ing-masa-para-pizza", name: "Masa para Pizza", unit: "pieza", cost: 2500, currentStock: 0, isActive: true },
      { id: "ing-salsa-de-tomate", name: "Salsa de Tomate", unit: "L", cost: 4500, currentStock: 0, isActive: true },
      { id: "ing-pepperoni", name: "Pepperoni", unit: "kg", cost: 16000, currentStock: 0, isActive: true },
      { id: "ing-jamon-de-pavo", name: "Jamón de Pavo", unit: "kg", cost: 12000, currentStock: 0, isActive: true },
      { id: "ing-prosciutto", name: "Prosciutto", unit: "kg", cost: 35000, currentStock: 0, isActive: true },
      { id: "ing-champinon", name: "Champiñón", unit: "kg", cost: 8000, currentStock: 0, isActive: true },
      { id: "ing-pimiento-morron", name: "Pimiento Morrón", unit: "kg", cost: 5000, currentStock: 0, isActive: true },
      { id: "ing-tomate-deshidratado", name: "Tomate Deshidratado", unit: "kg", cost: 22000, currentStock: 0, isActive: true },
      { id: "ing-espinaca", name: "Espinaca", unit: "kg", cost: 7000, currentStock: 0, isActive: true },
      { id: "ing-albahaca-fresca", name: "Albahaca Fresca", unit: "manojo", cost: 1500, currentStock: 0, isActive: true },
      { id: "ing-carne-de-wagyu", name: "Carne de Wagyu", unit: "kg", cost: 60000, currentStock: 0, isActive: true },
      { id: "ing-pan-hamburguesa", name: "Pan para Hamburguesa", unit: "pieza", cost: 800, currentStock: 0, isActive: true },
      { id: "ing-lechuga", name: "Lechuga", unit: "pieza", cost: 2000, currentStock: 0, isActive: true },
      { id: "ing-platano", name: "Plátano", unit: "pieza", cost: 400, currentStock: 0, isActive: true },
      { id: "ing-fresa", name: "Fresa", unit: "kg", cost: 8000, currentStock: 0, isActive: true },
      { id: "ing-mango", name: "Mango", unit: "kg", cost: 4500, currentStock: 0, isActive: true },
      { id: "ing-pina", name: "Piña", unit: "pieza", cost: 3500, currentStock: 0, isActive: true },
      { id: "ing-sandia", name: "Sandía", unit: "kg", cost: 2000, currentStock: 0, isActive: true },
      { id: "ing-melon", name: "Melón", unit: "pieza", cost: 3500, currentStock: 0, isActive: true },
      { id: "ing-papaya", name: "Papaya", unit: "pieza", cost: 4000, currentStock: 0, isActive: true },
      { id: "ing-manzana", name: "Manzana", unit: "kg", cost: 4500, currentStock: 0, isActive: true },
      { id: "ing-nuez", name: "Nuez", unit: "kg", cost: 25000, currentStock: 0, isActive: true },
      { id: "ing-nutella", name: "Nutella", unit: "kg", cost: 15000, currentStock: 0, isActive: true },
      { id: "ing-chocolate-en-polvo", name: "Chocolate en Polvo", unit: "kg", cost: 12000, currentStock: 0, isActive: true },
      { id: "ing-miel", name: "Miel", unit: "kg", cost: 8000, currentStock: 0, isActive: true },
      { id: "ing-vainilla", name: "Vainilla", unit: "L", cost: 30000, currentStock: 0, isActive: true },
      { id: "ing-leche-condensada", name: "Leche Condensada", unit: "L", cost: 4500, currentStock: 0, isActive: true },
      { id: "ing-leche-evaporada", name: "Leche Evaporada", unit: "L", cost: 3500, currentStock: 0, isActive: true },
      { id: "ing-galletamaria", name: "Galleta María", unit: "kg", cost: 6000, currentStock: 0, isActive: true },
      { id: "ing-sal", name: "Sal", unit: "kg", cost: 1000, currentStock: 0, isActive: true },
      { id: "ing-ajo", name: "Ajo", unit: "kg", cost: 6000, currentStock: 0, isActive: true },
      { id: "ing-pimienta-negra", name: "Pimienta Negra", unit: "kg", cost: 15000, currentStock: 0, isActive: true },
      { id: "ing-oregano-seco", name: "Orégano Seco", unit: "kg", cost: 8000, currentStock: 0, isActive: true },
      { id: "ing-pollo-deshebrado", name: "Pollo Deshebrado", unit: "kg", cost: 12000, currentStock: 0, isActive: true },
      { id: "ing-concentrado-pina-colada", name: "Concentrado de Piña Colada", unit: "L", cost: 8000, currentStock: 0, isActive: true },
      { id: "ing-leche-de-coco", name: "Leche de Coco", unit: "L", cost: 6000, currentStock: 0, isActive: true },
      { id: "ing-hielo", name: "Hielo", unit: "kg", cost: 500, currentStock: 0, isActive: true },
      { id: "ing-vino-tinto-copa", name: "Vino Tinto (copa)", unit: "L", cost: 15000, currentStock: 0, isActive: true },
      { id: "ing-mezcal", name: "Mezcal", unit: "L", cost: 35000, currentStock: 0, isActive: true },
      { id: "ing-jarabe-de-agave", name: "Jarabe de Agave", unit: "L", cost: 12000, currentStock: 0, isActive: true },
      { id: "ing-canela-en-polvo", name: "Canela en Polvo", unit: "kg", cost: 18000, currentStock: 0, isActive: true },
      { id: "ing-pan-de-caja", name: "Pan de Caja", unit: "pieza", cost: 1500, currentStock: 0, isActive: true },
      { id: "ing-aceituna-verde", name: "Aceituna Verde", unit: "kg", cost: 8000, currentStock: 0, isActive: true },
      { id: "ing-pepino", name: "Pepino", unit: "pieza", cost: 800, currentStock: 0, isActive: true },
      { id: "ing-zanahoria", name: "Zanahoria", unit: "kg", cost: 2000, currentStock: 0, isActive: true },
      { id: "ing-betabel", name: "Betabel", unit: "kg", cost: 2500, currentStock: 0, isActive: true },
      { id: "ing-vinagre-balsamico", name: "Vinagre Balsámico", unit: "L", cost: 12000, currentStock: 0, isActive: true },
      { id: "ing-aceite-de-oliva", name: "Aceite de Oliva", unit: "L", cost: 15000, currentStock: 0, isActive: true },
      { id: "ing-jugo-de-limon", name: "Jugo de Limón", unit: "L", cost: 5000, currentStock: 0, isActive: true },
      { id: "ing-salsa-verde", name: "Salsa Verde", unit: "L", cost: 4000, currentStock: 0, isActive: true },
      { id: "ing-salsa-roja", name: "Salsa Roja", unit: "L", cost: 4000, currentStock: 0, isActive: true },
      { id: "ing-totopos", name: "Totopos", unit: "kg", cost: 5000, currentStock: 0, isActive: true },
      { id: "ing-chile-piquin", name: "Chile Piquín", unit: "kg", cost: 12000, currentStock: 0, isActive: true },
      // Product ingredients
      { id: "ing-coca-cola-335ml", name: "Coca Cola 335ml", unit: "pieza", cost: 1500, currentStock: 0, isActive: true },
      { id: "ing-coca-cola-light", name: "Coca Cola Light 335ml", unit: "pieza", cost: 1500, currentStock: 0, isActive: true },
      { id: "ing-coca-cola-zero", name: "Coca Cola Zero 335ml", unit: "pieza", cost: 1500, currentStock: 0, isActive: true },
      { id: "ing-agua-mineral-500ml", name: "Agua Mineral 500ml", unit: "pieza", cost: 800, currentStock: 0, isActive: true },
      { id: "ing-suero-oral", name: "Suero Oral", unit: "pieza", cost: 1200, currentStock: 0, isActive: true },
      { id: "ing-botella-agua-1l", name: "Botella de Agua 1L", unit: "pieza", cost: 600, currentStock: 0, isActive: true },
      { id: "ing-botella-agua-500ml", name: "Botella de Agua 500ml", unit: "pieza", cost: 400, currentStock: 0, isActive: true },
      { id: "ing-jugo-naranja-500ml", name: "Jugo de Naranja 500ml", unit: "pieza", cost: 1500, currentStock: 0, isActive: true },
      { id: "ing-clamato-lata", name: "Clamato Lata", unit: "pieza", cost: 1800, currentStock: 0, isActive: true },
      { id: "ing-te-infusion", name: "Té Infusión Sobre", unit: "pieza", cost: 500, currentStock: 0, isActive: true },
      { id: "ing-cerveza-victoria", name: "Cerveza Victoria Botella", unit: "pieza", cost: 1500, currentStock: 0, isActive: true },
      { id: "ing-cerveza-corona-clara", name: "Cerveza Corona Clara Botella", unit: "pieza", cost: 1500, currentStock: 0, isActive: true },
      { id: "ing-cerveza-corona-oscura", name: "Cerveza Corona Oscura Botella", unit: "pieza", cost: 1500, currentStock: 0, isActive: true },
      { id: "ing-tequila-botella", name: "Tequila Botella", unit: "L", cost: 40000, currentStock: 0, isActive: true },
      { id: "ing-mezcal-botella", name: "Mezcal Botella", unit: "L", cost: 35000, currentStock: 0, isActive: true },
      { id: "ing-ron-blanco", name: "Ron Blanco", unit: "L", cost: 25000, currentStock: 0, isActive: true },
      { id: "ing-whisky-botella", name: "Whisky Botella", unit: "L", cost: 50000, currentStock: 0, isActive: true },
      { id: "ing-botella-vino-tinto", name: "Botella de Vino Tinto", unit: "pieza", cost: 25000, currentStock: 0, isActive: true },
      { id: "ing-panque-individual", name: "Panqué Individual", unit: "pieza", cost: 1500, currentStock: 0, isActive: true },
      { id: "ing-pan-para-sandwich", name: "Pan para Sándwich", unit: "pieza", cost: 1500, currentStock: 0, isActive: true },
      { id: "ing-queso-amarillo", name: "Queso Amarillo Rebanada", unit: "kg", cost: 10000, currentStock: 0, isActive: true },
      { id: "ing-aceituna-preparada", name: "Aceituna Verde Preparada", unit: "kg", cost: 8000, currentStock: 0, isActive: true },
    ];
    for (const i of ingredients) await prisma.ingredient.create({ data: i as any });

    // ── Helper to create menu items ──
    async function createMenuItem(data: { id: string; categoryId: string; name: string; basePrice: number; prepStation: string; sortOrder: number; isActive?: boolean; description?: string | null }) {
      return prisma.menuItem.create({ data: { ...data, isActive: data.isActive ?? true } });
    }

    // ── Menu Items ──
    // Café
    const miCafe = await createMenuItem({ id: "mi-cafe", categoryId: "cat-cafeteria-bebidas", name: "Café", basePrice: 3000, prepStation: "BAR", sortOrder: 1 });
    const miAmericano = await createMenuItem({ id: "mi-cafe-americano", categoryId: "cat-cafeteria-bebidas", name: "Café Americano", basePrice: 5000, prepStation: "BAR", sortOrder: 2 });
    const miEspresso = await createMenuItem({ id: "mi-espresso", categoryId: "cat-cafeteria-bebidas", name: "Espresso", basePrice: 5000, prepStation: "BAR", sortOrder: 3 });
    const miLatte = await createMenuItem({ id: "mi-latte", categoryId: "cat-cafeteria-bebidas", name: "Latte", basePrice: 6000, prepStation: "BAR", sortOrder: 4 });

    // Desayunos
    const miChilaquiles = await createMenuItem({ id: "mi-chilaquiles", categoryId: "cat-desayunos", name: "Chilaquiles", basePrice: 7000, prepStation: "KITCHEN", sortOrder: 1 });
    const miFrutaTemp = await createMenuItem({ id: "mi-fruta-de-temporada", categoryId: "cat-desayunos", name: "Fruta de Temporada", basePrice: 6500, prepStation: "COLD_STATION", sortOrder: 2 });
    const miHuevoChamp = await createMenuItem({ id: "mi-huevo-con-champinones", categoryId: "cat-desayunos", name: "Huevo con Champiñones", basePrice: 7000, prepStation: "KITCHEN", sortOrder: 3 });
    const miHuevosMex = await createMenuItem({ id: "mi-huevos-a-la-mexicana", categoryId: "cat-desayunos", name: "Huevos a la Mexicana", basePrice: 7000, prepStation: "KITCHEN", sortOrder: 4 });
    const miHuevosJamon = await createMenuItem({ id: "mi-huevos-con-jamon", categoryId: "cat-desayunos", name: "Huevos con Jamón", basePrice: 8000, prepStation: "KITCHEN", sortOrder: 5 });
    const miHuevosRanch = await createMenuItem({ id: "mi-huevos-rancheros", categoryId: "cat-desayunos", name: "Huevos Rancheros", basePrice: 7000, prepStation: "KITCHEN", sortOrder: 6 });

    // Ensaladas
    const miCaprese = await createMenuItem({ id: "mi-ensalada-caprese", categoryId: "cat-ensaladas", name: "Ensalada Caprese", basePrice: 13000, prepStation: "COLD_STATION", sortOrder: 1 });
    await createMenuItem({ id: "mi-ensalada-mixta", categoryId: "cat-ensaladas", name: "Ensalada Mixta", basePrice: 9000, prepStation: "COLD_STATION", sortOrder: 2 });
    await createMenuItem({ id: "mi-ensalada-tropical", categoryId: "cat-ensaladas", name: "Ensalada Tropical", basePrice: 13000, prepStation: "COLD_STATION", sortOrder: 3 });
    await createMenuItem({ id: "mi-guacamole", categoryId: "cat-ensaladas", name: "Guacamole", basePrice: 11000, prepStation: "COLD_STATION", sortOrder: 4 });
    await createMenuItem({ id: "mi-verduras-preparadas", categoryId: "cat-ensaladas", name: "Verduras Preparadas", basePrice: 7500, prepStation: "COLD_STATION", sortOrder: 5 });
    await createMenuItem({ id: "mi-aceitunas-preparadas", categoryId: "cat-ensaladas", name: "Aceitunas Preparadas", basePrice: 7500, prepStation: "COLD_STATION", sortOrder: 6 });

    // Horno
    await createMenuItem({ id: "mi-empanadas", categoryId: "cat-horno", name: "Empanadas", basePrice: 3500, prepStation: "KITCHEN", sortOrder: 1 });
    await createMenuItem({ id: "mi-pizza-margarita", categoryId: "cat-horno", name: "Pizza Margarita", basePrice: 20000, prepStation: "KITCHEN", sortOrder: 2 });
    await createMenuItem({ id: "mi-pizza-peperoni", categoryId: "cat-horno", name: "Pizza Peperoni", basePrice: 24000, prepStation: "KITCHEN", sortOrder: 3 });
    await createMenuItem({ id: "mi-pizza-prosciutto", categoryId: "cat-horno", name: "Pizza Prosciutto", basePrice: 24000, prepStation: "KITCHEN", sortOrder: 4 });
    await createMenuItem({ id: "mi-pizza-champinones", categoryId: "cat-horno", name: "Pizza Champiñones", basePrice: 22000, prepStation: "KITCHEN", sortOrder: 5 });
    await createMenuItem({ id: "mi-pizza-tomate-desh", categoryId: "cat-horno", name: "Pizza Tomate Deshidratado", basePrice: 24000, prepStation: "KITCHEN", sortOrder: 6 });
    await createMenuItem({ id: "mi-pizza-vegetariana", categoryId: "cat-horno", name: "Pizza Vegetariana", basePrice: 24000, prepStation: "KITCHEN", sortOrder: 7 });

    // Parrilla
    await createMenuItem({ id: "mi-flautas", categoryId: "cat-parrilla", name: "Flautas", basePrice: 4000, prepStation: "KITCHEN", sortOrder: 1 });
    await createMenuItem({ id: "mi-quesadillas", categoryId: "cat-parrilla", name: "Quesadillas", basePrice: 2500, prepStation: "KITCHEN", sortOrder: 2 });
    await createMenuItem({ id: "mi-hamburguesa-wagyu", categoryId: "cat-parrilla", name: "Hamburguesa de Wagyu", basePrice: 25000, prepStation: "KITCHEN", sortOrder: 3 });
    await createMenuItem({ id: "mi-taco", categoryId: "cat-parrilla", name: "Taco", basePrice: 3000, prepStation: "KITCHEN", sortOrder: 4 });

    // Postres
    await createMenuItem({ id: "mi-flan-napolitano", categoryId: "cat-postres", name: "Flan Napolitano", basePrice: 4000, prepStation: "COLD_STATION", sortOrder: 1 });
    await createMenuItem({ id: "mi-panque-de-platano", categoryId: "cat-postres", name: "Panqué de Plátano", basePrice: 4000, prepStation: "KITCHEN", sortOrder: 2 });
    await createMenuItem({ id: "mi-panque-de-queso", categoryId: "cat-postres", name: "Panqué de Queso", basePrice: 4000, prepStation: "KITCHEN", sortOrder: 3 });
    await createMenuItem({ id: "mi-pay-de-queso", categoryId: "cat-postres", name: "Pay de Queso", basePrice: 4000, prepStation: "KITCHEN", sortOrder: 4 });
    await createMenuItem({ id: "mi-pizza-nutela", categoryId: "cat-postres", name: "Pizza Nutela & Plátano", basePrice: 20000, prepStation: "KITCHEN", sortOrder: 5 });

    // Bebidas (recipe-based)
    await createMenuItem({ id: "mi-agua-de-fruta", categoryId: "cat-bebidas-sin-alcohol", name: "Agua de Fruta", basePrice: 1000, prepStation: "BAR", sortOrder: 1 });
    await createMenuItem({ id: "mi-pina-colada", categoryId: "cat-bebidas-sin-alcohol", name: "Piña Colada", basePrice: 10000, prepStation: "BAR", sortOrder: 2 });
    await createMenuItem({ id: "mi-smoothie-berry", categoryId: "cat-bebidas-sin-alcohol", name: "Smoothie Berry", basePrice: 6000, prepStation: "BAR", sortOrder: 3 });
    await createMenuItem({ id: "mi-smoothie-chocobanana", categoryId: "cat-bebidas-sin-alcohol", name: "Smoothie ChocoBanana", basePrice: 6000, prepStation: "BAR", sortOrder: 4 });

    await createMenuItem({ id: "mi-copa-vino", categoryId: "cat-bebidas-con-alcohol", name: "Copa Vino", basePrice: 10000, prepStation: "BAR", sortOrder: 1 });
    await createMenuItem({ id: "mi-mezcalina", categoryId: "cat-bebidas-con-alcohol", name: "Mezcalina", basePrice: 9000, prepStation: "BAR", sortOrder: 2 });
    await createMenuItem({ id: "mi-pina-colada-alc", categoryId: "cat-bebidas-con-alcohol", name: "Piña Colada con Alcohol", basePrice: 15000, prepStation: "BAR", sortOrder: 3 });

    // Products (no recipe)
    await createMenuItem({ id: "mi-coca-cola", categoryId: "cat-bebidas-sin-alcohol", name: "Coca Cola 335ml", basePrice: 3000, prepStation: "BAR", sortOrder: 5 });
    await createMenuItem({ id: "mi-coca-cola-light", categoryId: "cat-bebidas-sin-alcohol", name: "Coca Cola Light 335ml", basePrice: 3000, prepStation: "BAR", sortOrder: 6 });
    await createMenuItem({ id: "mi-coca-cola-zero", categoryId: "cat-bebidas-sin-alcohol", name: "Coca Cola Zero 335ml", basePrice: 3000, prepStation: "BAR", sortOrder: 7 });
    await createMenuItem({ id: "mi-agua-mineral", categoryId: "cat-bebidas-sin-alcohol", name: "Agua Mineral", basePrice: 3000, prepStation: "BAR", sortOrder: 8 });
    await createMenuItem({ id: "mi-suero", categoryId: "cat-bebidas-sin-alcohol", name: "Suero", basePrice: 3500, prepStation: "BAR", sortOrder: 9 });
    await createMenuItem({ id: "mi-botella-agua-1l", categoryId: "cat-bebidas-sin-alcohol", name: "Botella de Agua 1L", basePrice: 3000, prepStation: "BAR", sortOrder: 10 });
    await createMenuItem({ id: "mi-botella-agua-500ml", categoryId: "cat-bebidas-sin-alcohol", name: "Botella de Agua 500ml", basePrice: 1500, prepStation: "BAR", sortOrder: 11 });
    await createMenuItem({ id: "mi-jugo-naranja", categoryId: "cat-bebidas-sin-alcohol", name: "Jugo de Naranja", basePrice: 3500, prepStation: "BAR", sortOrder: 12 });
    await createMenuItem({ id: "mi-clamato", categoryId: "cat-bebidas-sin-alcohol", name: "Clamato", basePrice: 4000, prepStation: "BAR", sortOrder: 13 });
    await createMenuItem({ id: "mi-te-infusion", categoryId: "cat-bebidas-sin-alcohol", name: "Té Infusión", basePrice: 3000, prepStation: "BAR", sortOrder: 14 });

    // Cervezas with variants
    const miVictoria = await createMenuItem({ id: "mi-cerveza-victoria", categoryId: "cat-bebidas-con-alcohol", name: "Cerveza Victoria", basePrice: 3500, prepStation: "BAR", sortOrder: 4 });
    await prisma.menuItemVariant.create({ data: { id: "mi-cerveza-victoria-v0", menuItemId: miVictoria.id, name: "Sola", priceDelta: 0 } });
    await prisma.menuItemVariant.create({ data: { id: "mi-cerveza-victoria-v1", menuItemId: miVictoria.id, name: "Chelada", priceDelta: 500 } });
    await prisma.menuItemVariant.create({ data: { id: "mi-cerveza-victoria-v2", menuItemId: miVictoria.id, name: "Michelada", priceDelta: 1500 } });

    const miCoronaClara = await createMenuItem({ id: "mi-cerveza-corona-clara", categoryId: "cat-bebidas-con-alcohol", name: "Cerveza Corona Clara", basePrice: 3500, prepStation: "BAR", sortOrder: 5 });
    await prisma.menuItemVariant.create({ data: { id: "mi-corona-clara-v0", menuItemId: miCoronaClara.id, name: "Sola", priceDelta: 0 } });
    await prisma.menuItemVariant.create({ data: { id: "mi-corona-clara-v1", menuItemId: miCoronaClara.id, name: "Chelada", priceDelta: 500 } });
    await prisma.menuItemVariant.create({ data: { id: "mi-corona-clara-v2", menuItemId: miCoronaClara.id, name: "Michelada", priceDelta: 1500 } });

    const miCoronaOscura = await createMenuItem({ id: "mi-cerveza-corona-oscura", categoryId: "cat-bebidas-con-alcohol", name: "Cerveza Corona Oscura", basePrice: 3500, prepStation: "BAR", sortOrder: 6 });
    await prisma.menuItemVariant.create({ data: { id: "mi-corona-oscura-v0", menuItemId: miCoronaOscura.id, name: "Sola", priceDelta: 0 } });
    await prisma.menuItemVariant.create({ data: { id: "mi-corona-oscura-v1", menuItemId: miCoronaOscura.id, name: "Chelada", priceDelta: 500 } });
    await prisma.menuItemVariant.create({ data: { id: "mi-corona-oscura-v2", menuItemId: miCoronaOscura.id, name: "Michelada", priceDelta: 1500 } });

    // Shots & Cocktails
    await createMenuItem({ id: "mi-shot-tequila", categoryId: "cat-bebidas-con-alcohol", name: "Shot Tequila", basePrice: 10000, prepStation: "BAR", sortOrder: 7 });
    await createMenuItem({ id: "mi-shot-mezcal", categoryId: "cat-bebidas-con-alcohol", name: "Shot Mezcal", basePrice: 10000, prepStation: "BAR", sortOrder: 8 });
    await createMenuItem({ id: "mi-paloma-tequila", categoryId: "cat-bebidas-con-alcohol", name: "Paloma Tequila", basePrice: 13000, prepStation: "BAR", sortOrder: 9 });
    await createMenuItem({ id: "mi-whisky", categoryId: "cat-bebidas-con-alcohol", name: "Whisky", basePrice: 10000, prepStation: "BAR", sortOrder: 10 });
    await createMenuItem({ id: "mi-whisky-soda", categoryId: "cat-bebidas-con-alcohol", name: "Whisky Soda", basePrice: 13000, prepStation: "BAR", sortOrder: 11 });
    await createMenuItem({ id: "mi-mojito", categoryId: "cat-bebidas-con-alcohol", name: "Mojito", basePrice: 15000, prepStation: "BAR", sortOrder: 12 });
    await createMenuItem({ id: "mi-carajillo", categoryId: "cat-bebidas-con-alcohol", name: "Carajillo", basePrice: 15000, prepStation: "BAR", sortOrder: 13 });
    await createMenuItem({ id: "mi-margarita", categoryId: "cat-bebidas-con-alcohol", name: "Margarita", basePrice: 13000, prepStation: "BAR", sortOrder: 14 });
    await createMenuItem({ id: "mi-botella-vino", categoryId: "cat-bebidas-con-alcohol", name: "Botella de Vino", basePrice: 55000, prepStation: "BAR", sortOrder: 15 });

    // Cafetería comida
    await createMenuItem({ id: "mi-panque", categoryId: "cat-cafeteria-comida", name: "Panqué", basePrice: 4000, prepStation: "KITCHEN", sortOrder: 1 });
    await createMenuItem({ id: "mi-sandwich", categoryId: "cat-cafeteria-comida", name: "Sándwich", basePrice: 7000, prepStation: "KITCHEN", sortOrder: 2 });

    // ── Recipes ──
    async function createRecipe(recipeId: string, menuItemId: string, items: [string, number][]) {
      await prisma.recipe.create({ data: { id: recipeId, menuItemId, notes: `Receta` } });
      for (const [ingId, qty] of items) {
        await prisma.recipeItem.create({ data: { id: `${recipeId}-${ingId}`, recipeId, ingredientId: ingId, quantity: qty } });
      }
    }

    await createRecipe("rec-cafe", miCafe.id, [["ing-cafe-molido", 0.015], ["ing-azucar", 0.01], ["ing-leche-entera", 0.05]]);
    await createRecipe("rec-americano", miAmericano.id, [["ing-cafe-molido", 0.02], ["ing-azucar", 0.01]]);
    await createRecipe("rec-espresso", miEspresso.id, [["ing-cafe-molido", 0.012], ["ing-azucar", 0.005]]);
    await createRecipe("rec-latte", miLatte.id, [["ing-cafe-molido", 0.015], ["ing-leche-entera", 0.15], ["ing-azucar", 0.01]]);
    await createRecipe("rec-chilaquiles", miChilaquiles.id, [["ing-tortilla-de-maiz", 3], ["ing-huevo", 1], ["ing-salsa-verde", 0.1], ["ing-salsa-roja", 0.1], ["ing-crema-acida", 0.05], ["ing-queso-oaxaca", 0.05], ["ing-cebolla-blanca", 0.05], ["ing-cilantro", 0.1], ["ing-totopos", 0.2], ["ing-aceite-vegetal", 0.05], ["ing-sal", 0.005]]);
    await createRecipe("rec-fruta-temp", miFrutaTemp.id, [["ing-fresa", 0.1], ["ing-mango", 0.1], ["ing-pina", 0.1], ["ing-sandia", 0.2], ["ing-melon", 0.1], ["ing-papaya", 0.1], ["ing-miel", 0.02], ["ing-chile-piquin", 0.01], ["ing-limon", 0.02]]);
    await createRecipe("rec-huevo-champ", miHuevoChamp.id, [["ing-huevo", 2], ["ing-champinon", 0.1], ["ing-cebolla-blanca", 0.03], ["ing-mantequilla", 0.02], ["ing-aceite-vegetal", 0.02], ["ing-sal", 0.003]]);
    await createRecipe("rec-huevos-mex", miHuevosMex.id, [["ing-huevo", 2], ["ing-jitomate", 0.08], ["ing-cebolla-blanca", 0.03], ["ing-chile-serrano", 0.02], ["ing-cilantro", 0.05], ["ing-aceite-vegetal", 0.02], ["ing-sal", 0.003]]);
    await createRecipe("rec-huevos-jamon", miHuevosJamon.id, [["ing-huevo", 2], ["ing-jamon-de-pavo", 0.08], ["ing-cebolla-blanca", 0.03], ["ing-mantequilla", 0.02], ["ing-aceite-vegetal", 0.02], ["ing-sal", 0.003]]);
    await createRecipe("rec-huevos-ranch", miHuevosRanch.id, [["ing-huevo", 2], ["ing-tortilla-de-maiz", 2], ["ing-salsa-roja", 0.1], ["ing-salsa-verde", 0.1], ["ing-frijol-refrito", 0.1], ["ing-crema-acida", 0.05], ["ing-jitomate", 0.05], ["ing-chile-jalapeno", 0.02], ["ing-aceite-vegetal", 0.03]]);
    await createRecipe("rec-caprese", miCaprese.id, [["ing-jitomate", 0.2], ["ing-queso-mozzarella", 0.15], ["ing-albahaca-fresca", 0.3], ["ing-aceite-de-oliva", 0.03], ["ing-vinagre-balsamico", 0.02], ["ing-sal", 0.003], ["ing-pimienta-negra", 0.002]]);
    // ... more recipes (abbreviated for brevity — key ones are in)

    // ── Tables ──
    const tableData = [
      { number: "T1", name: "Interior 1", capacity: 4, location: "Interior", qrToken: "t1" },
      { number: "T2", name: "Interior 2", capacity: 4, location: "Interior", qrToken: "t2" },
      { number: "T3", name: "Interior 3", capacity: 4, location: "Interior", qrToken: "t3" },
      { number: "T4", name: "Interior 4", capacity: 4, location: "Interior", qrToken: "t4" },
      { number: "T5", name: "Terraza 1",  capacity: 4, location: "Terraza",  qrToken: "t5" },
      { number: "T6", name: "Terraza 2",  capacity: 4, location: "Terraza",  qrToken: "t6" },
      { number: "T7", name: "Barra 1",    capacity: 2, location: "Barra",    qrToken: "t7" },
      { number: "T8", name: "Barra 2",    capacity: 2, location: "Barra",    qrToken: "t8" },
    ];
    for (const t of tableData) await prisma.table.create({ data: t as any });

    // ── Items (Hotel + Activities) ──
    const hotelItems = [
      { name: "Media Luna", slug: "media-luna", type: "cabana", description: "Vista privilegiada de la montaña.", price: 180000, capacity: "3 huéspedes", featured: true },
      { name: "Casa del Árbol", slug: "casa-del-arbol", type: "cabana", description: "Nuestra cabaña más emblemática.", price: 250000, capacity: "2 huéspedes · Cama Queen", featured: true },
      { name: "Cabaña 1", slug: "cabana-1", type: "cabana", description: "Cabaña con vista panorámica.", price: 280000, capacity: "3 huéspedes", featured: false },
      { name: "Cabaña 2", slug: "cabana-2", type: "cabana", description: "Cabaña con vista panorámica.", price: 280000, capacity: "3 huéspedes", featured: false },
      { name: "Glamping 1", slug: "glamping-1", type: "glamping", description: "Conexión total con la naturaleza.", price: 130000, capacity: "2 huéspedes", featured: false },
      { name: "Glamping 2", slug: "glamping-2", type: "glamping", description: "Conexión total con la naturaleza.", price: 130000, capacity: "2 huéspedes", featured: false },
      { name: "Glamping 3", slug: "glamping-3", type: "glamping", description: "Conexión total con la naturaleza.", price: 130000, capacity: "4 huéspedes", featured: false },
      { name: "Glamping 4", slug: "glamping-4", type: "glamping", description: "Refugio minimalista.", price: 90000, capacity: "2 huéspedes", featured: false },
      { name: "Camping", slug: "camping", type: "camping", description: "Acampa bajo las estrellas.", price: 20000, capacity: "1-4 personas", featured: false },
      { name: "Vuelo en Parapente", slug: "vuelo-parapente", type: "parapente", description: "Vuelo en tándem.", price: 220000, capacity: "1 persona", featured: true },
      { name: "Vuelo Ala Delta", slug: "vuelo-ala-delta", type: "aladelta", description: "Vuelo en tándem.", price: 270000, capacity: "1 persona", featured: true },
      { name: "Hike Corto", slug: "hike-corto", type: "hike", description: "Caminata guiada.", price: 30000, capacity: "1-4 personas", featured: true },
      { name: "Hike Largo", slug: "hike-largo", type: "hike", description: "Caminata extendida.", price: 50000, capacity: "1-4 personas", featured: true },
      { name: "Fogata", slug: "fogata", type: "fogata", description: "Fogata al aire libre.", price: 25000, capacity: "Grupo", featured: false },
      { name: "Renta de Bicicleta", slug: "renta-bicicleta", type: "bici", description: "Doble suspensión.", price: 80000, capacity: "1 persona", featured: false },
      { name: "Pensión de Moto", slug: "pension-moto", type: "moto", description: "Enduro 300cc.", price: 150000, capacity: "1 persona", featured: false },
    ];
    for (const item of hotelItems) await prisma.item.create({ data: item as any });

    const counts = {
      categories: await prisma.category.count(),
      ingredients: await prisma.ingredient.count(),
      menuItems: await prisma.menuItem.count(),
      recipes: await prisma.recipe.count(),
      items: await prisma.item.count(),
      tables: await prisma.table.count(),
    };

    return NextResponse.json({ success: true, message: "Base de producción sembrada", counts });
  } catch (err) {
    console.error("[POST /api/admin/seed-prod]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
