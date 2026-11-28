import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET() {
  const userId = cookies().get('gm_session')?.value;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const quotes = await prisma.quote.findMany({
    where: { storeId: user.storeId },
    include: { client: { select: { id: true, name: true, phone: true, email: true, ice: true, creditLimit: true, balance: true } }, items: true },
    orderBy: { date: 'desc' },
  });
  return NextResponse.json(quotes);
}

export async function POST(req: Request) {
  const userId = cookies().get('gm_session')?.value;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { clientId, items, totalTtc } = await req.json();
  
  const count = await prisma.quote.count({ where: { storeId: user.storeId } });
  const quoteNo = `D-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

  const quote = await prisma.quote.create({
    data: {
      storeId: user.storeId,
      clientId: clientId || null,
      quoteNo,
      totalTtc,
      items: {
        create: items.map((i: any) => ({
          description: i.description, quantity: i.quantity, unitPriceHt: i.unitPriceHt, vatRate: i.vatRate, lineTotalTtc: i.lineTotalTtc
        }))
      }
    }
  });
  return NextResponse.json(quote);
}