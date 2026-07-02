import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Format date as iCal DATE value (YYYYMMDD) — Airbnb/Booking expect date-only, no time
function formatICALDate(date: Date): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

// Format as iCal DATE-TIME UTC (YYYYMMDDTHHMMSSZ)
function formatICALDateTime(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeICAL(text: string): string {
  return text.replace(/[\\;,]/g, '\\$&').replace(/\n/g, '\\n');
}

function generateICalFeed(itemName: string, events: { uid: string; start: Date; end: Date; summary: string }[]): string {
  const now = formatICALDateTime(new Date());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Hangar5//Reservas//ES',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:Hangar5 - ' + escapeICAL(itemName),
    'X-WR-TIMEZONE:America/Mexico_City',
  ];

  for (const ev of events) {
    lines.push(
      'BEGIN:VEVENT',
      `DTSTAMP:${now}`,
      `UID:${ev.uid}`,
      `DTSTART;VALUE=DATE:${formatICALDate(ev.start)}`,
      `DTEND;VALUE=DATE:${formatICALDate(ev.end)}`,
      `SUMMARY:${escapeICAL(ev.summary)}`,
      'TRANSP:OPAQUE',
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  const { slug } = await params;
  const raw = slug?.[0] || '';
  const itemId = raw.endsWith('.ics') ? raw.slice(0, -4) : raw;

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { id: true, name: true, slug: true },
  });

  if (!item || !item.id) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  // Get confirmed bookings for this item
  const bookings = await prisma.booking.findMany({
    where: {
      itemId: item.id,
      status: { notIn: ['cancelled', 'pending'] },
    },
    select: { id: true, startDate: true, endDate: true, customerName: true },
    orderBy: { startDate: 'asc' },
  });

  // Get external blocks
  const externalBlocks = await prisma.externalBlock.findMany({
    where: { calendar: { itemId: item.id } },
    select: { uid: true, startDate: true, endDate: true },
  });

  const events = [
    ...bookings.map(b => ({
      uid: `hangar5-booking-${b.id}@hangar5`,
      start: b.startDate,
      end: b.endDate,
      summary: `Reservado - ${b.customerName || 'Cliente'}`,
    })),
    ...externalBlocks.map(b => ({
      uid: b.uid || `ext-${b.startDate.toISOString()}`,
      start: b.startDate,
      end: b.endDate,
      summary: 'No disponible',
    })),
  ];

  const ical = generateICalFeed(item.name, events);

  return new NextResponse(ical, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `inline; filename="${item.slug}.ics"`,
    },
  });
}
