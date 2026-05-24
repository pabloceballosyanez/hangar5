import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';

async function main() {
  const adapter = new PrismaBetterSqlite3({ url: 'file:./prisma/dev.db' });
  const prisma = new PrismaClient({ adapter });

  const total = await prisma.booking.count();
  console.log('Total bookings:', total);

  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  console.log('\nLast 20 bookings:');
  for (const b of bookings) {
    console.log(`  id=${b.id.slice(-6)} status=${b.status} startDate=${b.startDate.toISOString().slice(0, 10)} totalPrice=${b.totalPrice} created=${b.createdAt.toISOString().slice(0, 10)}`);
  }

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  console.log(`\nServer time: ${now.toString()}`);
  console.log(`Month filter: month=${thisMonth} year=${thisYear}`);

  // Simulate the OLD query (take: 100)
  const oldQuery = bookings.filter(b => b.status !== 'cancelled' && b.status !== 'maintenance');
  const monthOld = oldQuery.filter(b => {
    const d = new Date(b.startDate);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });
  console.log(`\nOLD style (take only, no date filter):`);
  console.log(`  active: ${oldQuery.length}, this month: ${monthOld.length}`);

  // Simulate the NEW query (date filter + take 500)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  console.log(`\nSix months ago cutoff: ${sixMonthsAgo.toISOString().slice(0, 10)}`);
  const allBookings = await prisma.booking.findMany({
    where: { startDate: { gte: sixMonthsAgo } },
    orderBy: { createdAt: 'desc' },
    take: 500
  });
  console.log(`NEW query returned: ${allBookings.length} bookings`);
  const activeNew = allBookings.filter(b => b.status !== 'cancelled' && b.status !== 'maintenance');
  const monthNew = activeNew.filter(b => {
    const d = new Date(b.startDate);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });
  console.log(`  active: ${activeNew.length}, this month: ${monthNew.length}`);
  const revenue = monthNew.reduce((s, b) => s + b.totalPrice, 0);
  console.log(`  month revenue: ${revenue} (${(revenue / 100).toFixed(2)} pesos)`);
  
  if (monthNew.length > 0) {
    console.log('\n  This month bookings:');
    for (const b of monthNew) {
      const d = new Date(b.startDate);
      console.log(`    ${b.id.slice(-6)} | startDate=${d.toISOString().slice(0,10)} | status=${b.status} | totalPrice=${b.totalPrice}`);
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
