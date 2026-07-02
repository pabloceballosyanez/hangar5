import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

async function isAdmin() {
  const c = await cookies();
  return c.get('hangar5_admin_session')?.value === 'true';
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
    include: { item: { select: { id: true, name: true, slug: true } } },
  });

  return NextResponse.json(calendar, { status: 201 });
}
