import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { slugify, tieneHistoria } from '@/lib/carta-historias';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        menuItems: {
          where: { isActive: true },
          include: { variants: true },
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    // Anota cada platillo con su slug de ficha y si tiene reseña propia
    const annotated = categories.map((cat) => ({
      ...cat,
      menuItems: cat.menuItems.map((item) => ({
        ...item,
        slug: slugify(item.name),
        hasStory: tieneHistoria(item.name),
      })),
    }));

    return NextResponse.json(annotated);
  } catch (error) {
    console.error('Error fetching menu:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu' },
      { status: 500 }
    );
  }
}
