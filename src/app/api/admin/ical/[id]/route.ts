import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

async function isAdmin() {
  const c = await cookies();
  return c.get('hangar5_admin_session')?.value === 'true';
}

// GET /api/admin/ical/[id] — get single calendar
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const calendar = await prisma.externalCalendar.findUnique({
    where: { id },
    include: { item: { select: { id: true, name: true, slug: true } } },
  });
  if (!calendar) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(calendar);
}

// PUT /api/admin/ical/[id] — update calendar
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const calendar = await prisma.externalCalendar.update({
    where: { id },
    data: {
      name: body.name,
      url: body.url,
      itemId: body.itemId,
    },
  });
  return NextResponse.json(calendar);
}

// DELETE /api/admin/ical/[id] — delete calendar and its blocks
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  await prisma.externalBlock.deleteMany({ where: { calendarId: id } });
  await prisma.externalCalendar.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
