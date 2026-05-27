// Production seed — runs against Render persistent DB
// Usage: node prisma/seed-prod.ts

const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const { PrismaClient } = require("@prisma/client");

// Render production DB path
const DB_PATH = process.env.DATABASE_URL?.replace("file:", "") || "/data/hangar5.db";

const adapter = new PrismaBetterSqlite3({ url: `file:${DB_PATH}` });
const prisma = new PrismaClient({ adapter });

async function clearAll() {
  console.log("🧹 Limpiando base de producción...");
  const tables = [
    "OrderStatusEvent", "OrderItemModifier", "OrderItem", "Payment", "Order",
    "ServiceSession", "Booking", "StockMovement", "StaffShift", "StaffClock",
    "CustomerLedgerEntry", "Customer", "FixedExpense",
  ];
  for (const table of tables) {
    try {
      // @ts-ignore
      await prisma[table.charAt(0).toLowerCase() + table.slice(1)].deleteMany();
    } catch (e) { /* table might not exist yet */ }
  }
  console.log("  ✅ Limpio");
}

async function main() {
  await clearAll();
  console.log("✅ Base de producción reiniciada. Ahora corre 'npx prisma db seed'.");
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
