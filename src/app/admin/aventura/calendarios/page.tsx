import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { validateAdminSession } from '@/lib/auth';
import CalendarsClient from './CalendarsClient';

export const dynamic = 'force-dynamic';

export default async function CalendarsPage() {
  const c = await cookies();
  const session = c.get('hangar5_admin_session')?.value;
  if (!session || (session !== 'true' && !validateAdminSession(session))) redirect('/admin/login');

  const items = await prisma.item.findMany({
    where: { active: true, type: { in: ['cabana', 'glamping'] } },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  });

  const calendars = await prisma.externalCalendar.findMany({
    include: {
      item: { select: { id: true, name: true, slug: true, type: true } },
      _count: { select: { blocks: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return <CalendarsClient
    items={JSON.parse(JSON.stringify(items))}
    calendars={JSON.parse(JSON.stringify(calendars))}
  />;
}
