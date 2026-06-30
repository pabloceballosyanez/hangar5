import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

async function isAdmin() {
  const c = await cookies();
  return c.get('hangar5_admin_session')?.value === 'authenticated';
}

interface ParsedEvent {
  uid: string;
  start: Date;
  end: Date;
}

function parseICalDate(icalStr: string): Date {
  // Convert iCal DTSTART/DTEND format to Date
  // 20260630T140000Z or 20260630T140000 or 20260630
  const cleaned = icalStr.replace(/[^0-9TZ]/g, '');
  const year = parseInt(cleaned.substring(0, 4));
  const month = parseInt(cleaned.substring(4, 6)) - 1;
  const day = parseInt(cleaned.substring(6, 8));
  if (cleaned.length >= 15 && cleaned.includes('T')) {
    const hour = parseInt(cleaned.substring(9, 11));
    const min = parseInt(cleaned.substring(11, 13));
    const sec = parseInt(cleaned.substring(13, 15) || '0');
    return cleaned.endsWith('Z')
      ? new Date(Date.UTC(year, month, day, hour, min, sec))
      : new Date(year, month, day, hour, min, sec);
  }
  return new Date(year, month, day);
}

function parseICalFeed(raw: string): ParsedEvent[] {
  const events: ParsedEvent[] = [];
  const lines = raw.split(/\r?\n/);
  let inEvent = false;
  let uid = '';
  let start = '';
  let end = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === 'BEGIN:VEVENT') {
      inEvent = true;
      uid = '';
      start = '';
      end = '';
    } else if (trimmed === 'END:VEVENT') {
      inEvent = false;
      if (uid && start && end) {
        try {
          events.push({ uid, start: parseICalDate(start), end: parseICalDate(end) });
        } catch { /* skip malformed */ }
      }
    } else if (inEvent) {
      if (trimmed.startsWith('UID:')) {
        uid = trimmed.substring(4);
      } else if (trimmed.startsWith('DTSTART')) {
        start = trimmed.split(':')[1] || trimmed.split(';')[1]?.split(':')[1] || '';
      } else if (trimmed.startsWith('DTEND')) {
        end = trimmed.split(':')[1] || trimmed.split(';')[1]?.split(':')[1] || '';
      }
    }
  }

  return events;
}

async function syncCalendar(calendar: { id: string; url: string }) {
  const now = new Date();
  // Fetch the external iCal feed
  const response = await fetch(calendar.url, {
    headers: { 'User-Agent': 'Hangar5-iCal-Sync/1.0' },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${calendar.url}`);
  }

  const raw = await response.text();
  const events = parseICalFeed(raw);

  // Delete old blocks for this calendar
  await prisma.externalBlock.deleteMany({ where: { calendarId: calendar.id } });

  // Insert new blocks (only future ones to save space)
  const futureEvents = events.filter(e => e.end > now);
  if (futureEvents.length > 0) {
    await prisma.externalBlock.createMany({
      data: futureEvents.map(e => ({
        calendarId: calendar.id,
        uid: e.uid,
        startDate: e.start,
        endDate: e.end,
      })),
    });
  }

  // Update lastSync
  await prisma.externalCalendar.update({
    where: { id: calendar.id },
    data: { lastSync: new Date() },
  });

  return { eventsFound: events.length, futureBlocks: futureEvents.length };
}

async function isAdminOrSync(req: NextRequest) {
  // Sync secret for cron jobs
  const auth = req.headers.get('authorization');
  if (auth === `Bearer ${process.env.ICAL_SYNC_SECRET || 'hangar5-ical-sync-2026'}`) return true;
  // Or admin session
  const c = await cookies();
  return c.get('hangar5_admin_session')?.value === 'authenticated';
}

export async function POST(req: NextRequest) {
  if (!(await isAdminOrSync(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const calendarId = body.calendarId as string | undefined;

  const calendars = calendarId
    ? await prisma.externalCalendar.findMany({ where: { id: calendarId } })
    : await prisma.externalCalendar.findMany();

  if (calendars.length === 0) {
    return NextResponse.json({ message: 'No calendars configured', results: [] });
  }

  const results: { name: string; status: string; eventsFound?: number; futureBlocks?: number; error?: string }[] = [];

  for (const cal of calendars) {
    try {
      const r = await syncCalendar(cal);
      results.push({ name: cal.name, status: 'ok', ...r });
    } catch (err) {
      results.push({ name: cal.name, status: 'error', error: (err as Error).message });
    }
  }

  const errors = results.filter(r => r.status === 'error');
  return NextResponse.json({
    message: `Synced ${results.length - errors.length}/${results.length} calendars`,
    results,
  }, { status: errors.length > 0 ? 207 : 200 });
}
