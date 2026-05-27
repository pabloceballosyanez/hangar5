// Hangar 5 — Seed Script (Dry Run)
// Población completa desde Excel: menú, recetas, inventario, hotel, actividades
// Basado en plan de Einstein — 2026-05-27

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

type PrepStation = "BAR" | "KITCHEN" | "COLD_STATION";

interface CategoryDef { name: string; kind: string; sortOrder: number; }
interface IngredientDef { name: string; unit: string; cost: number; currentStock: number; isActive: boolean; }
interface MenuItemDef { name: string; categoryName: string; basePrice: number; prepStation: PrepStation; sortOrder: number; description?: string; isActive?: boolean; }
interface RecipeItemDef { ingredientName: string; quantity: number; }
interface VariantDef { name: string; priceDelta: number; }

// ═══════════════════════════════════════════════════════════════════════════════
// 1. CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════

const categories: CategoryDef[] = [
  { name: "Desayunos",             kind: "FOOD",  sortOrder: 1 },
  { name: "Ensaladas",             kind: "FOOD",  sortOrder: 2 },
  { name: "Horno",                 kind: "FOOD",  sortOrder: 3 },
  { name: "Parrilla",              kind: "FOOD",  sortOrder: 4 },
  { name: "Postres",               kind: "FOOD",  sortOrder: 5 },
  { name: "Cafetería Comida",      kind: "FOOD",  sortOrder: 6 },
  { name: "Cafetería Bebidas",     kind: "DRINK", sortOrder: 7 },
  { name: "Bebidas sin Alcohol",   kind: "DRINK", sortOrder: 8 },
  { name: "Bebidas con Alcohol",   kind: "DRINK", sortOrder: 9 },
  { name: "Especiales",            kind: "FOOD",  sortOrder: 10 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 2. INGREDIENTS (113 total — 80 genéricos + 33 de producto)
// ═══════════════════════════════════════════════════════════════════════════════

// Generic ingredients (for recipes)
const genericIngredients: IngredientDef[] = [
  { name: "Tortilla de Maíz",            unit: "pieza",    cost: 150,   currentStock: 0, isActive: true },
  { name: "Tortilla de Harina",          unit: "pieza",    cost: 200,   currentStock: 0, isActive: true },
  { name: "Huevo",                       unit: "pieza",    cost: 350,   currentStock: 0, isActive: true },
  { name: "Jitomate",                    unit: "kg",       cost: 2500,  currentStock: 0, isActive: true },
  { name: "Cebolla Blanca",              unit: "kg",       cost: 2000,  currentStock: 0, isActive: true },
  { name: "Chile Serrano",               unit: "kg",       cost: 4000,  currentStock: 0, isActive: true },
  { name: "Chile Jalapeño",              unit: "kg",       cost: 3500,  currentStock: 0, isActive: true },
  { name: "Aguacate",                    unit: "pieza",    cost: 1500,  currentStock: 0, isActive: true },
  { name: "Limón",                       unit: "kg",       cost: 2000,  currentStock: 0, isActive: true },
  { name: "Cilantro",                    unit: "manojo",   cost: 800,   currentStock: 0, isActive: true },
  { name: "Queso Oaxaca",                unit: "kg",       cost: 12000, currentStock: 0, isActive: true },
  { name: "Queso Mozzarella",            unit: "kg",       cost: 11000, currentStock: 0, isActive: true },
  { name: "Queso Parmesano",             unit: "kg",       cost: 18000, currentStock: 0, isActive: true },
  { name: "Queso Crema",                 unit: "kg",       cost: 9000,  currentStock: 0, isActive: true },
  { name: "Queso Panela",                unit: "kg",       cost: 10000, currentStock: 0, isActive: true },
  { name: "Crema Ácida",                 unit: "L",        cost: 6000,  currentStock: 0, isActive: true },
  { name: "Frijol Refrito",             unit: "kg",       cost: 3500,  currentStock: 0, isActive: true },
  { name: "Mantequilla",                 unit: "kg",       cost: 12000, currentStock: 0, isActive: true },
  { name: "Aceite Vegetal",              unit: "L",        cost: 3500,  currentStock: 0, isActive: true },
  { name: "Leche Entera",                unit: "L",        cost: 2200,  currentStock: 0, isActive: true },
  { name: "Café Molido",                 unit: "kg",       cost: 16000, currentStock: 0, isActive: true },
  { name: "Azúcar",                      unit: "kg",       cost: 2500,  currentStock: 0, isActive: true },
  { name: "Harina de Trigo",             unit: "kg",       cost: 1800,  currentStock: 0, isActive: true },
  { name: "Masa para Pizza",             unit: "pieza",    cost: 2500,  currentStock: 0, isActive: true },
  { name: "Salsa de Tomate",             unit: "L",        cost: 4500,  currentStock: 0, isActive: true },
  { name: "Pepperoni",                   unit: "kg",       cost: 16000, currentStock: 0, isActive: true },
  { name: "Jamón de Pavo",               unit: "kg",       cost: 12000, currentStock: 0, isActive: true },
  { name: "Prosciutto",                  unit: "kg",       cost: 35000, currentStock: 0, isActive: true },
  { name: "Champiñón",                   unit: "kg",       cost: 8000,  currentStock: 0, isActive: true },
  { name: "Pimiento Morrón",             unit: "kg",       cost: 5000,  currentStock: 0, isActive: true },
  { name: "Tomate Deshidratado",         unit: "kg",       cost: 22000, currentStock: 0, isActive: true },
  { name: "Espinaca",                    unit: "kg",       cost: 7000,  currentStock: 0, isActive: true },
  { name: "Albahaca Fresca",             unit: "manojo",   cost: 1500,  currentStock: 0, isActive: true },
  { name: "Carne de Wagyu",              unit: "kg",       cost: 60000, currentStock: 0, isActive: true },
  { name: "Pan para Hamburguesa",        unit: "pieza",    cost: 800,   currentStock: 0, isActive: true },
  { name: "Lechuga",                     unit: "pieza",    cost: 2000,  currentStock: 0, isActive: true },
  { name: "Plátano",                     unit: "pieza",    cost: 400,   currentStock: 0, isActive: true },
  { name: "Fresa",                       unit: "kg",       cost: 8000,  currentStock: 0, isActive: true },
  { name: "Mango",                       unit: "kg",       cost: 4500,  currentStock: 0, isActive: true },
  { name: "Piña",                        unit: "pieza",    cost: 3500,  currentStock: 0, isActive: true },
  { name: "Sandía",                      unit: "kg",       cost: 2000,  currentStock: 0, isActive: true },
  { name: "Melón",                       unit: "pieza",    cost: 3500,  currentStock: 0, isActive: true },
  { name: "Papaya",                      unit: "pieza",    cost: 4000,  currentStock: 0, isActive: true },
  { name: "Manzana",                     unit: "kg",       cost: 4500,  currentStock: 0, isActive: true },
  { name: "Nuez",                        unit: "kg",       cost: 25000, currentStock: 0, isActive: true },
  { name: "Nutella",                     unit: "kg",       cost: 15000, currentStock: 0, isActive: true },
  { name: "Chocolate en Polvo",          unit: "kg",       cost: 12000, currentStock: 0, isActive: true },
  { name: "Miel",                        unit: "kg",       cost: 8000,  currentStock: 0, isActive: true },
  { name: "Vainilla",                    unit: "L",        cost: 30000, currentStock: 0, isActive: true },
  { name: "Leche Condensada",            unit: "L",        cost: 4500,  currentStock: 0, isActive: true },
  { name: "Leche Evaporada",             unit: "L",        cost: 3500,  currentStock: 0, isActive: true },
  { name: "Galleta María",               unit: "kg",       cost: 6000,  currentStock: 0, isActive: true },
  { name: "Sal",                         unit: "kg",       cost: 1000,  currentStock: 0, isActive: true },
  { name: "Ajo",                         unit: "kg",       cost: 6000,  currentStock: 0, isActive: true },
  { name: "Pimienta Negra",              unit: "kg",       cost: 15000, currentStock: 0, isActive: true },
  { name: "Orégano Seco",                unit: "kg",       cost: 8000,  currentStock: 0, isActive: true },
  { name: "Pollo Deshebrado",            unit: "kg",       cost: 12000, currentStock: 0, isActive: true },
  { name: "Concentrado de Piña Colada",  unit: "L",        cost: 8000,  currentStock: 0, isActive: true },
  { name: "Leche de Coco",               unit: "L",        cost: 6000,  currentStock: 0, isActive: true },
  { name: "Hielo",                       unit: "kg",       cost: 500,   currentStock: 0, isActive: true },
  { name: "Vino Tinto (copa)",           unit: "L",        cost: 15000, currentStock: 0, isActive: true },
  { name: "Mezcal",                      unit: "L",        cost: 35000, currentStock: 0, isActive: true },
  { name: "Jarabe de Agave",             unit: "L",        cost: 12000, currentStock: 0, isActive: true },
  { name: "Canela en Polvo",             unit: "kg",       cost: 18000, currentStock: 0, isActive: true },
  { name: "Pan de Caja",                 unit: "pieza",    cost: 1500,  currentStock: 0, isActive: true },
  { name: "Aceituna Verde",              unit: "kg",       cost: 8000,  currentStock: 0, isActive: true },
  { name: "Pepino",                      unit: "pieza",    cost: 800,   currentStock: 0, isActive: true },
  { name: "Zanahoria",                   unit: "kg",       cost: 2000,  currentStock: 0, isActive: true },
  { name: "Betabel",                     unit: "kg",       cost: 2500,  currentStock: 0, isActive: true },
  { name: "Vinagre Balsámico",           unit: "L",        cost: 12000, currentStock: 0, isActive: true },
  { name: "Aceite de Oliva",             unit: "L",        cost: 15000, currentStock: 0, isActive: true },
  { name: "Jugo de Limón",               unit: "L",        cost: 5000,  currentStock: 0, isActive: true },
  { name: "Salsa Verde",                 unit: "L",        cost: 4000,  currentStock: 0, isActive: true },
  { name: "Salsa Roja",                  unit: "L",        cost: 4000,  currentStock: 0, isActive: true },
  { name: "Totopos",                     unit: "kg",       cost: 5000,  currentStock: 0, isActive: true },
  { name: "Panqué Base",                 unit: "pieza",    cost: 2500,  currentStock: 0, isActive: true },
  { name: "Chile Piquín",                unit: "kg",       cost: 12000, currentStock: 0, isActive: true },
];

// Product ingredients (sold as-is — inventory tracking)
const productIngredients: IngredientDef[] = [
  { name: "Coca Cola 335ml",             unit: "pieza",    cost: 1500,  currentStock: 0, isActive: true },
  { name: "Coca Cola Light 335ml",       unit: "pieza",    cost: 1500,  currentStock: 0, isActive: true },
  { name: "Coca Cola Zero 335ml",        unit: "pieza",    cost: 1500,  currentStock: 0, isActive: true },
  { name: "Agua Mineral 500ml",          unit: "pieza",    cost: 800,   currentStock: 0, isActive: true },
  { name: "Suero Oral",                  unit: "pieza",    cost: 1200,  currentStock: 0, isActive: true },
  { name: "Botella de Agua 1L",          unit: "pieza",    cost: 600,   currentStock: 0, isActive: true },
  { name: "Botella de Agua 500ml",       unit: "pieza",    cost: 400,   currentStock: 0, isActive: true },
  { name: "Jugo de Naranja 500ml",       unit: "pieza",    cost: 1500,  currentStock: 0, isActive: true },
  { name: "Clamato Lata",                unit: "pieza",    cost: 1800,  currentStock: 0, isActive: true },
  { name: "Té Infusión Sobre",           unit: "pieza",    cost: 500,   currentStock: 0, isActive: true },
  { name: "Cerveza Victoria Botella",    unit: "pieza",    cost: 1500,  currentStock: 0, isActive: true },
  { name: "Cerveza Corona Clara Botella",unit: "pieza",    cost: 1500,  currentStock: 0, isActive: true },
  { name: "Cerveza Corona Oscura Botella", unit: "pieza",  cost: 1500,  currentStock: 0, isActive: true },
  { name: "Tequila Botella",             unit: "L",        cost: 40000, currentStock: 0, isActive: true },
  { name: "Mezcal Botella",              unit: "L",        cost: 35000, currentStock: 0, isActive: true },
  { name: "Ron Blanco",                  unit: "L",        cost: 25000, currentStock: 0, isActive: true },
  { name: "Whisky Botella",              unit: "L",        cost: 50000, currentStock: 0, isActive: true },
  { name: "Botella de Vino Tinto",       unit: "pieza",    cost: 25000, currentStock: 0, isActive: true },
  { name: "Panqué Individual",           unit: "pieza",    cost: 1500,  currentStock: 0, isActive: true },
  { name: "Pan para Sándwich",           unit: "pieza",    cost: 1500,  currentStock: 0, isActive: true },
  { name: "Queso Amarillo Rebanada",     unit: "kg",       cost: 10000, currentStock: 0, isActive: true },
  { name: "Aceituna Verde Preparada",    unit: "kg",       cost: 8000,  currentStock: 0, isActive: true },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 3. RECIPE MENU ITEMS
// ═══════════════════════════════════════════════════════════════════════════════

interface RecipeMenuItemDef extends MenuItemDef {
  recipeItems: RecipeItemDef[];
}

const recipeMenuItems: RecipeMenuItemDef[] = [
  // ── Cafetería Bebidas ──
  { name: "Café", categoryName: "Cafetería Bebidas", basePrice: 3000, prepStation: "BAR", sortOrder: 1, recipeItems: [{ingredientName:"Café Molido",quantity:0.015},{ingredientName:"Azúcar",quantity:0.01},{ingredientName:"Leche Entera",quantity:0.05}] },
  { name: "Café Americano", categoryName: "Cafetería Bebidas", basePrice: 5000, prepStation: "BAR", sortOrder: 2, recipeItems: [{ingredientName:"Café Molido",quantity:0.02},{ingredientName:"Azúcar",quantity:0.01}] },
  { name: "Espresso", categoryName: "Cafetería Bebidas", basePrice: 5000, prepStation: "BAR", sortOrder: 3, recipeItems: [{ingredientName:"Café Molido",quantity:0.012},{ingredientName:"Azúcar",quantity:0.005}] },
  { name: "Latte", categoryName: "Cafetería Bebidas", basePrice: 6000, prepStation: "BAR", sortOrder: 4, recipeItems: [{ingredientName:"Café Molido",quantity:0.015},{ingredientName:"Leche Entera",quantity:0.15},{ingredientName:"Azúcar",quantity:0.01}] },

  // ── Desayunos ──
  { name: "Chilaquiles", categoryName: "Desayunos", basePrice: 7000, prepStation: "KITCHEN", sortOrder: 1, recipeItems: [
    {ingredientName:"Tortilla de Maíz",quantity:3},{ingredientName:"Huevo",quantity:1},{ingredientName:"Salsa Verde",quantity:0.1},
    {ingredientName:"Salsa Roja",quantity:0.1},{ingredientName:"Crema Ácida",quantity:0.05},{ingredientName:"Queso Oaxaca",quantity:0.05},
    {ingredientName:"Cebolla Blanca",quantity:0.05},{ingredientName:"Cilantro",quantity:0.1},{ingredientName:"Totopos",quantity:0.2},
    {ingredientName:"Aceite Vegetal",quantity:0.05},{ingredientName:"Sal",quantity:0.005}
  ]},
  { name: "Fruta de Temporada", categoryName: "Desayunos", basePrice: 6500, prepStation: "COLD_STATION", sortOrder: 2, recipeItems: [
    {ingredientName:"Fresa",quantity:0.1},{ingredientName:"Mango",quantity:0.1},{ingredientName:"Piña",quantity:0.1},
    {ingredientName:"Sandía",quantity:0.2},{ingredientName:"Melón",quantity:0.1},{ingredientName:"Papaya",quantity:0.1},
    {ingredientName:"Miel",quantity:0.02},{ingredientName:"Chile Piquín",quantity:0.01},{ingredientName:"Limón",quantity:0.02}
  ]},
  { name: "Huevo con Champiñones", categoryName: "Desayunos", basePrice: 7000, prepStation: "KITCHEN", sortOrder: 3, recipeItems: [
    {ingredientName:"Huevo",quantity:2},{ingredientName:"Champiñón",quantity:0.1},{ingredientName:"Cebolla Blanca",quantity:0.03},
    {ingredientName:"Mantequilla",quantity:0.02},{ingredientName:"Aceite Vegetal",quantity:0.02},{ingredientName:"Sal",quantity:0.003}
  ]},
  { name: "Huevos a la Mexicana", categoryName: "Desayunos", basePrice: 7000, prepStation: "KITCHEN", sortOrder: 4, recipeItems: [
    {ingredientName:"Huevo",quantity:2},{ingredientName:"Jitomate",quantity:0.08},{ingredientName:"Cebolla Blanca",quantity:0.03},
    {ingredientName:"Chile Serrano",quantity:0.02},{ingredientName:"Cilantro",quantity:0.05},{ingredientName:"Aceite Vegetal",quantity:0.02},
    {ingredientName:"Sal",quantity:0.003}
  ]},
  { name: "Huevos con Jamón", categoryName: "Desayunos", basePrice: 8000, prepStation: "KITCHEN", sortOrder: 5, recipeItems: [
    {ingredientName:"Huevo",quantity:2},{ingredientName:"Jamón de Pavo",quantity:0.08},{ingredientName:"Cebolla Blanca",quantity:0.03},
    {ingredientName:"Mantequilla",quantity:0.02},{ingredientName:"Aceite Vegetal",quantity:0.02},{ingredientName:"Sal",quantity:0.003}
  ]},
  { name: "Huevos Rancheros", categoryName: "Desayunos", basePrice: 7000, prepStation: "KITCHEN", sortOrder: 6, recipeItems: [
    {ingredientName:"Huevo",quantity:2},{ingredientName:"Tortilla de Maíz",quantity:2},{ingredientName:"Salsa Roja",quantity:0.1},
    {ingredientName:"Salsa Verde",quantity:0.1},{ingredientName:"Frijol Refrito",quantity:0.1},{ingredientName:"Crema Ácida",quantity:0.05},
    {ingredientName:"Jitomate",quantity:0.05},{ingredientName:"Chile Jalapeño",quantity:0.02},{ingredientName:"Aceite Vegetal",quantity:0.03}
  ]},

  // ── Ensaladas ──
  { name: "Ensalada Caprese", categoryName: "Ensaladas", basePrice: 13000, prepStation: "COLD_STATION", sortOrder: 1, recipeItems: [
    {ingredientName:"Jitomate",quantity:0.2},{ingredientName:"Queso Mozzarella",quantity:0.15},{ingredientName:"Albahaca Fresca",quantity:0.3},
    {ingredientName:"Aceite de Oliva",quantity:0.03},{ingredientName:"Vinagre Balsámico",quantity:0.02},{ingredientName:"Sal",quantity:0.003},
    {ingredientName:"Pimienta Negra",quantity:0.002}
  ]},
  { name: "Ensalada Mixta", categoryName: "Ensaladas", basePrice: 9000, prepStation: "COLD_STATION", sortOrder: 2, recipeItems: [
    {ingredientName:"Lechuga",quantity:0.5},{ingredientName:"Jitomate",quantity:0.1},{ingredientName:"Pepino",quantity:0.5},
    {ingredientName:"Zanahoria",quantity:0.05},{ingredientName:"Betabel",quantity:0.05},{ingredientName:"Aguacate",quantity:0.5},
    {ingredientName:"Aceite de Oliva",quantity:0.02},{ingredientName:"Limón",quantity:0.02},{ingredientName:"Sal",quantity:0.003}
  ]},
  { name: "Ensalada Tropical", categoryName: "Ensaladas", basePrice: 13000, prepStation: "COLD_STATION", sortOrder: 3, recipeItems: [
    {ingredientName:"Lechuga",quantity:0.3},{ingredientName:"Mango",quantity:0.15},{ingredientName:"Fresa",quantity:0.1},
    {ingredientName:"Manzana",quantity:0.1},{ingredientName:"Nuez",quantity:0.03},{ingredientName:"Aguacate",quantity:0.5},
    {ingredientName:"Miel",quantity:0.02},{ingredientName:"Limón",quantity:0.02}
  ]},
  { name: "Guacamole", categoryName: "Ensaladas", basePrice: 11000, prepStation: "COLD_STATION", sortOrder: 4, recipeItems: [
    {ingredientName:"Aguacate",quantity:2},{ingredientName:"Jitomate",quantity:0.08},{ingredientName:"Cebolla Blanca",quantity:0.05},
    {ingredientName:"Cilantro",quantity:0.15},{ingredientName:"Chile Serrano",quantity:0.02},{ingredientName:"Limón",quantity:0.03},
    {ingredientName:"Jugo de Limón",quantity:0.01},{ingredientName:"Sal",quantity:0.003}
  ]},
  { name: "Verduras Preparadas", categoryName: "Ensaladas", basePrice: 7500, prepStation: "COLD_STATION", sortOrder: 5, recipeItems: [
    {ingredientName:"Zanahoria",quantity:0.15},{ingredientName:"Pepino",quantity:0.5},{ingredientName:"Jitomate",quantity:0.1},
    {ingredientName:"Limón",quantity:0.02},{ingredientName:"Sal",quantity:0.003}
  ]},

  // ── Horno ──
  { name: "Empanadas", categoryName: "Horno", basePrice: 3500, prepStation: "KITCHEN", sortOrder: 1, recipeItems: [
    {ingredientName:"Harina de Trigo",quantity:0.15},{ingredientName:"Pollo Deshebrado",quantity:0.08},{ingredientName:"Cebolla Blanca",quantity:0.03},
    {ingredientName:"Queso Oaxaca",quantity:0.03},{ingredientName:"Aceite Vegetal",quantity:0.02},{ingredientName:"Ajo",quantity:0.005},
    {ingredientName:"Sal",quantity:0.003}
  ]},
  { name: "Pizza Margarita", categoryName: "Horno", basePrice: 20000, prepStation: "KITCHEN", sortOrder: 2, recipeItems: [
    {ingredientName:"Masa para Pizza",quantity:1},{ingredientName:"Salsa de Tomate",quantity:0.12},{ingredientName:"Queso Mozzarella",quantity:0.2},
    {ingredientName:"Jitomate",quantity:0.1},{ingredientName:"Albahaca Fresca",quantity:0.2},{ingredientName:"Aceite de Oliva",quantity:0.02},
    {ingredientName:"Queso Parmesano",quantity:0.02}
  ]},
  { name: "Pizza Peperoni", categoryName: "Horno", basePrice: 24000, prepStation: "KITCHEN", sortOrder: 3, recipeItems: [
    {ingredientName:"Masa para Pizza",quantity:1},{ingredientName:"Salsa de Tomate",quantity:0.12},{ingredientName:"Queso Mozzarella",quantity:0.22},
    {ingredientName:"Pepperoni",quantity:0.12},{ingredientName:"Aceite de Oliva",quantity:0.02},{ingredientName:"Orégano Seco",quantity:0.005}
  ]},
  { name: "Pizza Prosciutto", categoryName: "Horno", basePrice: 24000, prepStation: "KITCHEN", sortOrder: 4, recipeItems: [
    {ingredientName:"Masa para Pizza",quantity:1},{ingredientName:"Salsa de Tomate",quantity:0.12},{ingredientName:"Queso Mozzarella",quantity:0.2},
    {ingredientName:"Prosciutto",quantity:0.08},{ingredientName:"Queso Parmesano",quantity:0.02},{ingredientName:"Aceite de Oliva",quantity:0.02}
  ]},
  { name: "Pizza Champiñones", categoryName: "Horno", basePrice: 22000, prepStation: "KITCHEN", sortOrder: 5, recipeItems: [
    {ingredientName:"Masa para Pizza",quantity:1},{ingredientName:"Salsa de Tomate",quantity:0.12},{ingredientName:"Queso Mozzarella",quantity:0.2},
    {ingredientName:"Champiñón",quantity:0.15},{ingredientName:"Aceite de Oliva",quantity:0.02},{ingredientName:"Orégano Seco",quantity:0.005}
  ]},
  { name: "Pizza Tomate Deshidratado", categoryName: "Horno", basePrice: 24000, prepStation: "KITCHEN", sortOrder: 6, recipeItems: [
    {ingredientName:"Masa para Pizza",quantity:1},{ingredientName:"Salsa de Tomate",quantity:0.12},{ingredientName:"Queso Mozzarella",quantity:0.18},
    {ingredientName:"Tomate Deshidratado",quantity:0.08},{ingredientName:"Aceite de Oliva",quantity:0.02},{ingredientName:"Albahaca Fresca",quantity:0.1}
  ]},
  { name: "Pizza Vegetariana", categoryName: "Horno", basePrice: 24000, prepStation: "KITCHEN", sortOrder: 7, recipeItems: [
    {ingredientName:"Masa para Pizza",quantity:1},{ingredientName:"Salsa de Tomate",quantity:0.12},{ingredientName:"Queso Mozzarella",quantity:0.2},
    {ingredientName:"Pimiento Morrón",quantity:0.08},{ingredientName:"Champiñón",quantity:0.08},{ingredientName:"Espinaca",quantity:0.06},
    {ingredientName:"Aceite de Oliva",quantity:0.02}
  ]},

  // ── Parrilla ──
  { name: "Flautas", categoryName: "Parrilla", basePrice: 4000, prepStation: "KITCHEN", sortOrder: 1, recipeItems: [
    {ingredientName:"Tortilla de Maíz",quantity:3},{ingredientName:"Pollo Deshebrado",quantity:0.1},{ingredientName:"Crema Ácida",quantity:0.03},
    {ingredientName:"Aceite Vegetal",quantity:0.08},{ingredientName:"Salsa Roja",quantity:0.05},{ingredientName:"Sal",quantity:0.003}
  ]},
  { name: "Quesadillas", categoryName: "Parrilla", basePrice: 2500, prepStation: "KITCHEN", sortOrder: 2, recipeItems: [
    {ingredientName:"Tortilla de Maíz",quantity:2},{ingredientName:"Queso Oaxaca",quantity:0.08},{ingredientName:"Aceite Vegetal",quantity:0.03},
    {ingredientName:"Sal",quantity:0.002}
  ]},
  { name: "Hamburguesa de Wagyu", categoryName: "Parrilla", basePrice: 25000, prepStation: "KITCHEN", sortOrder: 3, recipeItems: [
    {ingredientName:"Carne de Wagyu",quantity:0.2},{ingredientName:"Pan para Hamburguesa",quantity:1},{ingredientName:"Lechuga",quantity:0.1},
    {ingredientName:"Jitomate",quantity:0.05},{ingredientName:"Cebolla Blanca",quantity:0.03},{ingredientName:"Queso Amarillo Rebanada",quantity:0.05},
    {ingredientName:"Mantequilla",quantity:0.015},{ingredientName:"Sal",quantity:0.003},{ingredientName:"Pimienta Negra",quantity:0.002}
  ]},
  { name: "Taco", categoryName: "Parrilla", basePrice: 3000, prepStation: "KITCHEN", sortOrder: 4, recipeItems: [
    {ingredientName:"Tortilla de Maíz",quantity:1},{ingredientName:"Pollo Deshebrado",quantity:0.06},{ingredientName:"Cilantro",quantity:0.05},
    {ingredientName:"Salsa Roja",quantity:0.03},{ingredientName:"Salsa Verde",quantity:0.03},{ingredientName:"Limón",quantity:0.01}
  ]},

  // ── Postres ──
  { name: "Flan Napolitano", categoryName: "Postres", basePrice: 4000, prepStation: "COLD_STATION", sortOrder: 1, recipeItems: [
    {ingredientName:"Huevo",quantity:2},{ingredientName:"Leche Entera",quantity:0.12},{ingredientName:"Leche Condensada",quantity:0.08},
    {ingredientName:"Leche Evaporada",quantity:0.08},{ingredientName:"Azúcar",quantity:0.05},{ingredientName:"Vainilla",quantity:0.01}
  ]},
  { name: "Panqué de Plátano", categoryName: "Postres", basePrice: 4000, prepStation: "KITCHEN", sortOrder: 2, recipeItems: [
    {ingredientName:"Plátano",quantity:2},{ingredientName:"Harina de Trigo",quantity:0.12},{ingredientName:"Mantequilla",quantity:0.06},
    {ingredientName:"Azúcar",quantity:0.06},{ingredientName:"Huevo",quantity:1},{ingredientName:"Nuez",quantity:0.02},
    {ingredientName:"Vainilla",quantity:0.005}
  ]},
  { name: "Panqué de Queso", categoryName: "Postres", basePrice: 4000, prepStation: "KITCHEN", sortOrder: 3, recipeItems: [
    {ingredientName:"Queso Crema",quantity:0.15},{ingredientName:"Harina de Trigo",quantity:0.1},{ingredientName:"Mantequilla",quantity:0.06},
    {ingredientName:"Azúcar",quantity:0.06},{ingredientName:"Huevo",quantity:1},{ingredientName:"Vainilla",quantity:0.005}
  ]},
  { name: "Pay de Queso", categoryName: "Postres", basePrice: 4000, prepStation: "KITCHEN", sortOrder: 4, recipeItems: [
    {ingredientName:"Queso Crema",quantity:0.2},{ingredientName:"Galleta María",quantity:0.1},{ingredientName:"Mantequilla",quantity:0.06},
    {ingredientName:"Azúcar",quantity:0.08},{ingredientName:"Huevo",quantity:1},{ingredientName:"Vainilla",quantity:0.005}
  ]},
  { name: "Pizza Nutela & Plátano", categoryName: "Postres", basePrice: 20000, prepStation: "KITCHEN", sortOrder: 5, recipeItems: [
    {ingredientName:"Masa para Pizza",quantity:1},{ingredientName:"Nutella",quantity:0.1},{ingredientName:"Plátano",quantity:1.5},
    {ingredientName:"Azúcar",quantity:0.03}
  ]},

  // ── Bebidas sin Alcohol ──
  { name: "Agua de Fruta", categoryName: "Bebidas sin Alcohol", basePrice: 1000, prepStation: "BAR", sortOrder: 1, recipeItems: [
    {ingredientName:"Mango",quantity:0.15},{ingredientName:"Piña",quantity:0.15},{ingredientName:"Sandía",quantity:0.2},
    {ingredientName:"Azúcar",quantity:0.03},{ingredientName:"Limón",quantity:0.02},{ingredientName:"Hielo",quantity:0.2}
  ]},
  { name: "Piña Colada", categoryName: "Bebidas sin Alcohol", basePrice: 10000, prepStation: "BAR", sortOrder: 2, recipeItems: [
    {ingredientName:"Piña",quantity:0.2},{ingredientName:"Concentrado de Piña Colada",quantity:0.06},{ingredientName:"Leche de Coco",quantity:0.12},
    {ingredientName:"Hielo",quantity:0.3},{ingredientName:"Azúcar",quantity:0.02}
  ]},
  { name: "Smoothie Berry", categoryName: "Bebidas sin Alcohol", basePrice: 6000, prepStation: "BAR", sortOrder: 3, recipeItems: [
    {ingredientName:"Fresa",quantity:0.15},{ingredientName:"Mango",quantity:0.08},{ingredientName:"Plátano",quantity:0.5},
    {ingredientName:"Miel",quantity:0.02},{ingredientName:"Hielo",quantity:0.2},{ingredientName:"Leche Entera",quantity:0.08}
  ]},
  { name: "Smoothie ChocoBanana", categoryName: "Bebidas sin Alcohol", basePrice: 6000, prepStation: "BAR", sortOrder: 4, recipeItems: [
    {ingredientName:"Plátano",quantity:1},{ingredientName:"Chocolate en Polvo",quantity:0.03},{ingredientName:"Leche Entera",quantity:0.12},
    {ingredientName:"Miel",quantity:0.02},{ingredientName:"Hielo",quantity:0.2}
  ]},

  // ── Bebidas con Alcohol ──
  { name: "Copa Vino", categoryName: "Bebidas con Alcohol", basePrice: 10000, prepStation: "BAR", sortOrder: 1, recipeItems: [
    {ingredientName:"Vino Tinto (copa)",quantity:0.15}
  ]},
  { name: "Mezcalina", categoryName: "Bebidas con Alcohol", basePrice: 9000, prepStation: "BAR", sortOrder: 2, recipeItems: [
    {ingredientName:"Mezcal",quantity:0.045},{ingredientName:"Jarabe de Agave",quantity:0.015},{ingredientName:"Limón",quantity:0.03},
    {ingredientName:"Hielo",quantity:0.15}
  ]},
  { name: "Piña Colada con Alcohol", categoryName: "Bebidas con Alcohol", basePrice: 15000, prepStation: "BAR", sortOrder: 3, recipeItems: [
    {ingredientName:"Piña",quantity:0.2},{ingredientName:"Ron Blanco",quantity:0.06},{ingredientName:"Concentrado de Piña Colada",quantity:0.06},
    {ingredientName:"Leche de Coco",quantity:0.12},{ingredientName:"Hielo",quantity:0.3}
  ]},

  // ── Aceitunas Preparadas ──
  { name: "Aceitunas Preparadas", categoryName: "Ensaladas", basePrice: 7500, prepStation: "COLD_STATION", sortOrder: 6, recipeItems: [
    {ingredientName:"Aceituna Verde",quantity:0.1},{ingredientName:"Aceite de Oliva",quantity:0.02},{ingredientName:"Ajo",quantity:0.005},
    {ingredientName:"Orégano Seco",quantity:0.003}
  ]},
];

// ═══════════════════════════════════════════════════════════════════════════════
// 4. PRODUCT MENU ITEMS (sold as-is, no recipe)
// ═══════════════════════════════════════════════════════════════════════════════

// These are created as MenuItems with an associated Ingredient for stock tracking.
// The POS should decrement ingredient stock when sold.

interface ProductMenuItemDef extends MenuItemDef {
  ingredientName: string;
  variants?: VariantDef[];
}

const productMenuItems: ProductMenuItemDef[] = [
  // Bebidas sin Alcohol
  { name: "Coca Cola 335ml", categoryName: "Bebidas sin Alcohol", basePrice: 3000, prepStation: "BAR", sortOrder: 5, ingredientName: "Coca Cola 335ml" },
  { name: "Coca Cola Light 335ml", categoryName: "Bebidas sin Alcohol", basePrice: 3000, prepStation: "BAR", sortOrder: 6, ingredientName: "Coca Cola Light 335ml" },
  { name: "Coca Cola Zero 335ml", categoryName: "Bebidas sin Alcohol", basePrice: 3000, prepStation: "BAR", sortOrder: 7, ingredientName: "Coca Cola Zero 335ml" },
  { name: "Agua Mineral", categoryName: "Bebidas sin Alcohol", basePrice: 3000, prepStation: "BAR", sortOrder: 8, ingredientName: "Agua Mineral 500ml" },
  { name: "Suero", categoryName: "Bebidas sin Alcohol", basePrice: 3500, prepStation: "BAR", sortOrder: 9, ingredientName: "Suero Oral" },
  { name: "Botella de Agua 1L", categoryName: "Bebidas sin Alcohol", basePrice: 3000, prepStation: "BAR", sortOrder: 10, ingredientName: "Botella de Agua 1L" },
  { name: "Botella de Agua 500ml", categoryName: "Bebidas sin Alcohol", basePrice: 1500, prepStation: "BAR", sortOrder: 11, ingredientName: "Botella de Agua 500ml" },
  { name: "Jugo de Naranja", categoryName: "Bebidas sin Alcohol", basePrice: 3500, prepStation: "BAR", sortOrder: 12, ingredientName: "Jugo de Naranja 500ml" },
  { name: "Clamato", categoryName: "Bebidas sin Alcohol", basePrice: 4000, prepStation: "BAR", sortOrder: 13, ingredientName: "Clamato Lata" },
  { name: "Té Infusión", categoryName: "Bebidas sin Alcohol", basePrice: 3000, prepStation: "BAR", sortOrder: 14, ingredientName: "Té Infusión Sobre" },

  // Cervezas (with variants)
  { name: "Cerveza Victoria", categoryName: "Bebidas con Alcohol", basePrice: 3500, prepStation: "BAR", sortOrder: 4, ingredientName: "Cerveza Victoria Botella",
    variants: [{name:"Sola",priceDelta:0},{name:"Chelada",priceDelta:500},{name:"Michelada",priceDelta:1500}] },
  { name: "Cerveza Corona Clara", categoryName: "Bebidas con Alcohol", basePrice: 3500, prepStation: "BAR", sortOrder: 5, ingredientName: "Cerveza Corona Clara Botella",
    variants: [{name:"Sola",priceDelta:0},{name:"Chelada",priceDelta:500},{name:"Michelada",priceDelta:1500}] },
  { name: "Cerveza Corona Oscura", categoryName: "Bebidas con Alcohol", basePrice: 3500, prepStation: "BAR", sortOrder: 6, ingredientName: "Cerveza Corona Oscura Botella",
    variants: [{name:"Sola",priceDelta:0},{name:"Chelada",priceDelta:500},{name:"Michelada",priceDelta:1500}] },

  // Shots & Cocktails (no recipe, bartender prepares)
  { name: "Shot Tequila", categoryName: "Bebidas con Alcohol", basePrice: 10000, prepStation: "BAR", sortOrder: 7, ingredientName: "Tequila Botella" },
  { name: "Shot Mezcal", categoryName: "Bebidas con Alcohol", basePrice: 10000, prepStation: "BAR", sortOrder: 8, ingredientName: "Mezcal Botella" },
  { name: "Paloma Tequila", categoryName: "Bebidas con Alcohol", basePrice: 13000, prepStation: "BAR", sortOrder: 9, ingredientName: "Tequila Botella" },
  { name: "Whisky", categoryName: "Bebidas con Alcohol", basePrice: 10000, prepStation: "BAR", sortOrder: 10, ingredientName: "Whisky Botella" },
  { name: "Whisky Soda", categoryName: "Bebidas con Alcohol", basePrice: 13000, prepStation: "BAR", sortOrder: 11, ingredientName: "Whisky Botella" },
  { name: "Mojito", categoryName: "Bebidas con Alcohol", basePrice: 15000, prepStation: "BAR", sortOrder: 12, ingredientName: "Ron Blanco" },
  { name: "Carajillo", categoryName: "Bebidas con Alcohol", basePrice: 15000, prepStation: "BAR", sortOrder: 13, ingredientName: "Tequila Botella" },
  { name: "Margarita", categoryName: "Bebidas con Alcohol", basePrice: 13000, prepStation: "BAR", sortOrder: 14, ingredientName: "Tequila Botella" },
  { name: "Botella de Vino", categoryName: "Bebidas con Alcohol", basePrice: 55000, prepStation: "BAR", sortOrder: 15, ingredientName: "Botella de Vino Tinto" },

  // Cafetería Comida
  { name: "Panqué", categoryName: "Cafetería Comida", basePrice: 4000, prepStation: "KITCHEN", sortOrder: 1, ingredientName: "Panqué Individual" },
  { name: "Sándwich", categoryName: "Cafetería Comida", basePrice: 7000, prepStation: "KITCHEN", sortOrder: 2, ingredientName: "Pan para Sándwich" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 5. HOTEL & ACTIVITIES (Items table)
// ═══════════════════════════════════════════════════════════════════════════════

const hotelItems = [
  { name: "Media Luna", slug: "media-luna", type: "cabana", description: "Acogedora y tranquila con una vista privilegiada de la montaña.", price: 180000, capacity: "3 huéspedes", featured: true },
  { name: "Casa del Árbol", slug: "casa-del-arbol", type: "cabana", description: "Fundida en la naturaleza, nuestra cabaña más emblemática.", price: 250000, capacity: "2 huéspedes · Cama Queen", featured: true },
  { name: "Cabaña 1", slug: "cabana-1", type: "cabana", description: "Cabaña con vista panorámica.", price: 280000, capacity: "3 huéspedes", featured: false },
  { name: "Cabaña 2", slug: "cabana-2", type: "cabana", description: "Cabaña con vista panorámica.", price: 280000, capacity: "3 huéspedes", featured: false },
  { name: "Glamping 1", slug: "glamping-1", type: "glamping", description: "Conexión total con la naturaleza.", price: 130000, capacity: "2 huéspedes", featured: false },
  { name: "Glamping 2", slug: "glamping-2", type: "glamping", description: "Conexión total con la naturaleza.", price: 130000, capacity: "2 huéspedes", featured: false },
  { name: "Glamping 3", slug: "glamping-3", type: "glamping", description: "Conexión total con la naturaleza.", price: 130000, capacity: "4 huéspedes", featured: false },
  { name: "Glamping 4", slug: "glamping-4", type: "glamping", description: "Refugio minimalista entre los árboles.", price: 90000, capacity: "2 huéspedes", featured: false },
  { name: "Camping", slug: "camping", type: "camping", description: "Acampa bajo las estrellas en el Peñón.", price: 20000, capacity: "1-4 personas", featured: false },
  { name: "Cabaña Nueva (15% DESC)", slug: "cabana-nueva-desc", type: "cabana", description: "Cabaña nueva con descuento especial.", price: 180000, capacity: "2 huéspedes", featured: false },
  { name: "Combo Ceballos", slug: "combo-ceballos", type: "combo", description: "Paquete especial Ceballos.", price: 264771, capacity: "Variable", featured: false },
];

const activityItems = [
  { name: "Vuelo en Parapente", slug: "vuelo-parapente", type: "parapente", description: "Vuelo en tándem sobre los paisajes del Peñón.", price: 220000, capacity: "1 persona", featured: true },
  { name: "Vuelo Ala Delta", slug: "vuelo-ala-delta", type: "aladelta", description: "Vuelo en tándem con instructor.", price: 270000, capacity: "1 persona", featured: true },
  { name: "Hike Corto", slug: "hike-corto", type: "hike", description: "Caminata guiada corta por los bosques.", price: 30000, capacity: "1-4 personas", featured: true },
  { name: "Hike Largo", slug: "hike-largo", type: "hike", description: "Caminata guiada extendida.", price: 50000, capacity: "1-4 personas", featured: true },
  { name: "Fogata", slug: "fogata", type: "fogata", description: "Fogata al aire libre.", price: 25000, capacity: "Grupo", featured: false },
  { name: "Renta de Bicicleta", slug: "renta-bicicleta", type: "bici", description: "Bicicleta de doble suspensión.", price: 80000, capacity: "1 persona", featured: false },
  { name: "Pensión de Moto", slug: "pension-moto", type: "moto", description: "Motocicleta de enduro 300cc.", price: 150000, capacity: "1 persona", featured: false },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SEED FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

async function clearAll() {
  console.log("🧹 Limpiando base de datos...");
  const tables = [
    "OrderStatusEvent", "OrderItemModifier", "OrderItem", "Payment", "Order",
    "ServiceSession", "Booking", "StockMovement", "RecipeItem", "Recipe",
    "MenuItemModifierGroup", "MenuItemVariant", "Ingredient", "MenuItem",
    "MenuCategoryRelation", "Modifier", "ModifierGroup", "Category",
    "StaffShift", "StaffClock", "CustomerLedgerEntry", "Customer", "FixedExpense",
    "Item",
  ];
  for (const table of tables) {
    try { await (prisma as any)[table.charAt(0).toLowerCase() + table.slice(1)].deleteMany(); }
    catch { /* table might not exist */ }
  }
  console.log("  ✅ Base limpia");
}

async function seedCategories() {
  console.log("\n📋 Categorías...");
  for (const cat of categories) {
    const id = `cat-${cat.name.toLowerCase().replace(/\s+/g, "-").replace(/[áéíóú]/g, (c:string) => ({á:'a',é:'e',í:'i',ó:'o',ú:'u'})[c] || c)}`;
    await prisma.category.upsert({
      where: { id },
      update: { name: cat.name, kind: cat.kind as any, sortOrder: cat.sortOrder, isActive: true },
      create: { id, name: cat.name, kind: cat.kind as any, sortOrder: cat.sortOrder, isActive: true },
    });
  }
  console.log(`  ✅ ${categories.length} categorías`);
}

async function seedIngredients() {
  console.log("\n🥕 Ingredientes...");
  const all = [...genericIngredients, ...productIngredients];
  for (const ing of all) {
    const id = `ing-${ing.name.toLowerCase().replace(/\s+/g, "-").replace(/[áéíóúñü]/g, '')}`.slice(0, 64);
    await prisma.ingredient.upsert({
      where: { id },
      update: { name: ing.name, unit: ing.unit, cost: ing.cost, currentStock: 0, isActive: true },
      create: { id, name: ing.name, unit: ing.unit, cost: ing.cost, currentStock: 0, isActive: true },
    });
  }
  console.log(`  ✅ ${all.length} ingredientes`);
}

async function seedMenuItem(
  item: MenuItemDef,
  categoryMap: Record<string, string>,
  sortOrder: number
): Promise<string> {
  const catId = categoryMap[item.categoryName];
  const id = `mi-${item.name.toLowerCase().replace(/\s+/g, "-").replace(/[áéíóúñü]/g, '')}`.slice(0, 64);
  await prisma.menuItem.upsert({
    where: { id },
    update: {
      categoryId: catId,
      name: item.name,
      basePrice: item.basePrice,
      prepStation: item.prepStation,
      sortOrder,
      isActive: item.isActive ?? true,
      description: item.description ?? null,
    },
    create: {
      id,
      categoryId: catId,
      name: item.name,
      basePrice: item.basePrice,
      prepStation: item.prepStation,
      sortOrder,
      isActive: item.isActive ?? true,
      description: item.description ?? null,
    },
  });
  return id;
}

async function seedRecipes() {
  console.log("\n📖 Recetas...");
  // Build category and ingredient maps
  const cats = await prisma.category.findMany();
  const catMap: Record<string, string> = {};
  for (const c of cats) catMap[c.name] = c.id;

  const ings = await prisma.ingredient.findMany();
  const ingMap: Record<string, string> = {};
  for (const i of ings) ingMap[i.name] = i.id;

  let count = 0;
  for (const item of recipeMenuItems) {
    const menuItemId = await seedMenuItem(item, catMap, item.sortOrder);
    const recipeId = `rec-${menuItemId}`;
    await prisma.recipe.upsert({
      where: { id: recipeId },
      update: { menuItemId, notes: `Receta: ${item.name}` },
      create: { id: recipeId, menuItemId, notes: `Receta: ${item.name}` },
    });
    for (const ri of item.recipeItems) {
      const ingredientId = ingMap[ri.ingredientName];
      if (!ingredientId) {
        console.warn(`  ⚠️ Ingrediente no encontrado: ${ri.ingredientName} (para ${item.name})`);
        continue;
      }
      const riId = `${recipeId}-${ingredientId}`.slice(0, 64);
      await prisma.recipeItem.upsert({
        where: { id: riId },
        update: { recipeId, ingredientId, quantity: ri.quantity },
        create: { id: riId, recipeId, ingredientId, quantity: ri.quantity },
      });
    }
    count++;
  }
  console.log(`  ✅ ${count} recetas`);
}

async function seedProducts() {
  console.log("\n🥤 Productos (sin receta)...");
  const cats = await prisma.category.findMany();
  const catMap: Record<string, string> = {};
  for (const c of cats) catMap[c.name] = c.id;

  let count = 0;
  for (const item of productMenuItems) {
    const menuItemId = await seedMenuItem(item, catMap, item.sortOrder);
    // Create variants if any
    if (item.variants) {
      for (let v = 0; v < item.variants.length; v++) {
        const variant = item.variants[v];
        await prisma.menuItemVariant.upsert({
          where: { id: `${menuItemId}-v${v}` },
          update: { menuItemId, name: variant.name, priceDelta: variant.priceDelta },
          create: { id: `${menuItemId}-v${v}`, menuItemId, name: variant.name, priceDelta: variant.priceDelta },
        });
      }
    }
    count++;
  }
  console.log(`  ✅ ${count} productos`);
}

async function seedHotelAndActivities() {
  console.log("\n🏨 Hotel y Actividades...");
  let count = 0;
  for (const item of [...hotelItems, ...activityItems]) {
    await prisma.item.upsert({
      where: { slug: item.slug },
      update: { name: item.name, type: item.type, description: item.description, price: item.price, capacity: item.capacity, featured: item.featured },
      create: { name: item.name, slug: item.slug, type: item.type, description: item.description, price: item.price, capacity: item.capacity, featured: item.featured },
    });
    count++;
  }
  console.log(`  ✅ ${count} items de hotel/actividades`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log("🌱 Hangar 5 — Seed Dry Run\n" + "═".repeat(50));
  console.log("Plan de Einstein — 2026-05-27\n");

  await clearAll();
  await seedCategories();
  await seedIngredients();
  await seedRecipes();
  await seedProducts();
  await seedHotelAndActivities();

  // Count totals
  const totals = {
    categories: await prisma.category.count(),
    ingredients: await prisma.ingredient.count(),
    menuItems: await prisma.menuItem.count(),
    recipes: await prisma.recipe.count(),
    items: await prisma.item.count(),
  };

  console.log("\n" + "═".repeat(50));
  console.log("✅ Seed completo:");
  console.log(`  📋 ${totals.categories} categorías`);
  console.log(`  🥕 ${totals.ingredients} ingredientes (stock 0)`);
  console.log(`  🍽️ ${totals.menuItems} ítems de menú`);
  console.log(`  📖 ${totals.recipes} recetas`);
  console.log(`  🏨 ${totals.items} items de hotel/actividades`);
  console.log("\n💡 Para el dry run: todo en stock 0. Creen StockMovement IN para simular compras.");
  console.log("💡 Precios en DB ya incluyen IVA (México standard).");
}

main()
  .catch((e) => { console.error("❌", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
