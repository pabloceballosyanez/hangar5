// Run schema migrations before app start
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const { PrismaClient } = require('@prisma/client');

const dbPath = process.argv[2] || '/data/hangar5.db';
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

prisma.$executeRawUnsafe('ALTER TABLE Booking ADD COLUMN paymentMethod TEXT')
  .then(() => console.log('[migrate] OK'))
  .catch(e => {
    if (e.message.includes('duplicate')) {
      console.log('[migrate] already exists');
    } else {
      console.error('[migrate]', e.message);
    }
  })
  .finally(() => prisma.$disconnect());
