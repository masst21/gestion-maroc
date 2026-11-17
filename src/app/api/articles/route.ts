import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

// Liste des articles
export async function GET() {
  const userId = cookies().get('gm_session')?.value;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const articles = await prisma.article.findMany({
    where: { storeId: user.storeId, isActive: true },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(articles);
}

// Créer un article
export async function POST(req: Request) {
  try {
    const userId = cookies().get('gm_session')?.value;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { reference, name, salePriceHt, vatRate, stockQty } = body;

    if (!reference || !name) {
      return NextResponse.json({ error: 'Référence et nom requis' }, { status: 400 });
    }

    const article = await prisma.article.create({
      data: {
        storeId: user.storeId,
        reference,
        name,
        salePriceHt: Number(salePriceHt) || 0,
        vatRate: Number(vatRate) || 20,
        stockQty: Number(stockQty) || 0,
      },
    });

    return NextResponse.json(article);
  } catch (e: any) {
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Cette référence existe déjà' }, { status: 400 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}