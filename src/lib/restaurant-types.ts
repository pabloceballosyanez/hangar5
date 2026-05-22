// ──────────────────────────────────────────────────────────────
// Order Status
// ──────────────────────────────────────────────────────────────
export const ORDER_STATUSES = [
  'DRAFT',
  'PLACED',
  'IN_KITCHEN',
  'READY',
  'SERVED',
  'PAID',
  'CANCELLED',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

// ──────────────────────────────────────────────────────────────
// Order Item Status
// ──────────────────────────────────────────────────────────────
export const ORDER_ITEM_STATUSES = [
  'PENDING',
  'IN_PREP',
  'READY',
  'SERVED',
  'CANCELLED',
] as const;
export type OrderItemStatus = (typeof ORDER_ITEM_STATUSES)[number];

// ──────────────────────────────────────────────────────────────
// Order Source
// ──────────────────────────────────────────────────────────────
export const ORDER_SOURCES = ['WAITER', 'QR', 'ADMIN'] as const;
export type OrderSource = (typeof ORDER_SOURCES)[number];

// ──────────────────────────────────────────────────────────────
// Prep Station
// ──────────────────────────────────────────────────────────────
export const PREP_STATIONS = ['KITCHEN', 'BAR', 'COLD_STATION'] as const;
export type PrepStation = (typeof PREP_STATIONS)[number];

// ──────────────────────────────────────────────────────────────
// Payment Method
// ──────────────────────────────────────────────────────────────
export const PAYMENT_METHODS = ['MP', 'CASH', 'CARD', 'TRANSFER'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// ──────────────────────────────────────────────────────────────
// Payment Status
// ──────────────────────────────────────────────────────────────
export const PAYMENT_STATUSES = ['PENDING', 'COMPLETED', 'REFUNDED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

// ──────────────────────────────────────────────────────────────
// Staff Role
// ──────────────────────────────────────────────────────────────
export const STAFF_ROLES = [
  'ADMIN',
  'WAITER',
  'COOK',
  'BARTENDER',
  'MANAGER',
] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

// ──────────────────────────────────────────────────────────────
// Ingredient Unit
// ──────────────────────────────────────────────────────────────
export const INGREDIENT_UNITS = ['GRAM', 'ML', 'UNIT'] as const;
export type IngredientUnit = (typeof INGREDIENT_UNITS)[number];

// ──────────────────────────────────────────────────────────────
// Stock Reason
// ──────────────────────────────────────────────────────────────
export const STOCK_REASONS = [
  'PURCHASE',
  'WASTE',
  'PREP',
  'INVENTORY',
] as const;
export type StockReason = (typeof STOCK_REASONS)[number];

// ──────────────────────────────────────────────────────────────
// Table Session Status
// ──────────────────────────────────────────────────────────────
export const TABLE_SESSION_STATUSES = ['OPEN', 'CLOSED'] as const;
export type TableSessionStatus = (typeof TABLE_SESSION_STATUSES)[number];

// ──────────────────────────────────────────────────────────────
// Category Kind
// ──────────────────────────────────────────────────────────────
export const CATEGORY_KINDS = ['FOOD', 'DRINK'] as const;
export type CategoryKind = (typeof CATEGORY_KINDS)[number];

// ──────────────────────────────────────────────────────────────
// Clock Type
// ──────────────────────────────────────────────────────────────
export const CLOCK_TYPES = ['IN', 'OUT'] as const;
export type ClockType = (typeof CLOCK_TYPES)[number];
