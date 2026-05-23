// Migration script: TableSession → ServiceSession
// Run BEFORE prisma db push on production
// Usage: node prisma/migrate-sessions.js /data/hangar5.db

import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

const dbPath = process.argv[2] || 'prisma/dev.db';
console.log(`Migrating: ${dbPath}`);

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Check if migration is needed
const hasServiceSession = db.prepare(
  "SELECT name FROM sqlite_master WHERE type='table' AND name='ServiceSession'"
).get();

if (hasServiceSession) {
  const count = db.prepare('SELECT COUNT(*) as c FROM ServiceSession').get();
  console.log(`ServiceSession already exists with ${count.c} rows — skipping migration`);
  db.close();
  process.exit(0);
}

const hasTableSession = db.prepare(
  "SELECT name FROM sqlite_master WHERE type='table' AND name='TableSession'"
).get();

if (!hasTableSession) {
  console.log('No TableSession table — nothing to migrate');
  db.close();
  process.exit(0);
}

// Begin migration
const tsCount = db.prepare('SELECT COUNT(*) as c FROM TableSession').get();
console.log(`Migrating ${tsCount.c} TableSession rows → ServiceSession`);

// Create Customer table first (ServiceSession FK depends on it)
db.exec(`
  CREATE TABLE IF NOT EXISTS "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

// Create ServiceSession table
db.exec(`
  CREATE TABLE IF NOT EXISTS "ServiceSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'TABLE',
    "label" TEXT NOT NULL DEFAULT '',
    "tableId" TEXT,
    "customerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "openedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ServiceSession_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ServiceSession_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  );
  CREATE INDEX IF NOT EXISTS "ServiceSession_status_type_idx" ON "ServiceSession"("status", "type");
`);

// Copy data: TableSession → ServiceSession
// Join with Table to get the number for the label
db.exec(`
  INSERT INTO "ServiceSession" ("id", "type", "label", "tableId", "status", "openedAt", "closedAt", "createdAt", "updatedAt")
  SELECT 
    ts."id",
    'TABLE',
    COALESCE(t."name", 'Mesa ' || t."number"),
    ts."tableId",
    ts."status",
    ts."openedAt",
    ts."closedAt",
    ts."createdAt",
    ts."updatedAt"
  FROM "TableSession" ts
  JOIN "Table" t ON t."id" = ts."tableId";
`);

const ssCount = db.prepare('SELECT COUNT(*) as c FROM ServiceSession').get();
console.log(`Migrated ${ssCount.c} rows to ServiceSession`);

// Now we need to handle the Order table
// prisma db push will try to drop old TableSession and create ServiceSession
// But it will also try to add serviceSessionId to Order
// Let's add the serviceSessionId column to Order and populate it
// Then prisma db push can handle the rest

// Check if Order has serviceSessionId already
const orderColumns = db.prepare("PRAGMA table_info('Order')").all();
const hasServiceSessionId = orderColumns.some(c => c.name === 'serviceSessionId');

if (!hasServiceSessionId) {
  console.log('Adding serviceSessionId to Order...');
  db.exec(`
    ALTER TABLE "Order" ADD COLUMN "serviceSessionId" TEXT;
    -- Copy data: tableSessionId → serviceSessionId
    UPDATE "Order" SET "serviceSessionId" = "tableSessionId";
  `);
  const orderCount = db.prepare('SELECT COUNT(*) as c FROM "Order" WHERE "serviceSessionId" IS NOT NULL').get();
  console.log(`Updated ${orderCount.c} orders with serviceSessionId`);
}

// Create CustomerLedgerEntry table
db.exec(`
  CREATE TABLE IF NOT EXISTS "CustomerLedgerEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL DEFAULT 'CHARGE',
    "serviceSessionId" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomerLedgerEntry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  );
  CREATE INDEX IF NOT EXISTS "CustomerLedgerEntry_customerId_createdAt_idx" ON "CustomerLedgerEntry"("customerId", "createdAt");
`);

// Drop old TableSession table so prisma db push doesn't complain
db.exec('DROP TABLE IF EXISTS "TableSession";');

console.log('✅ Migration complete');
db.close();
