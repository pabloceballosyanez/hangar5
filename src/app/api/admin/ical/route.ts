import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { validateAdminSession } from '@/lib/auth';

async function isAdmin() {
  const c = await cookies();
  const token = c.get('hangar5_admin_session')?.value;
  return !!token && validateAdminSession(token);
}

// GET /api/admin/ical — list all calendars
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const calendars = await prisma.externalCalendar.findMany({
    include: {
      item: { select: { id: true, name: true, slug: true, type: true } },
      _count: { select: { blocks: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(calendars);
}

// POST /api/admin/ical — add a calendar
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { itemId, name, url } = body;

  if (!itemId || !name || !url) {
    return NextResponse.json({ error: 'itemId, name, and url are required' }, { status: 400 });
  }

  const calendar = await prisma.externalCalendar.create({
    data: { itemId, name, url },
    include: { item: { select: { id: true, name: true, slug: true, type: true } } },
  });

  return NextResponse.json({ ...calendar, _count: { blocks: 0 } }, { status: 201 });
}
