import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET() {
  const userId = cookies().get('gm_session')?.value;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sales = await prisma.sale.findMany({
    where: { storeId: user.storeId },
    orderBy: { saleDate: 'desc' },
    take: 100,
  });

  // Calcul des totaux
  const totals = sales.reduce((acc, s) => ({
    ht: acc.ht + s.subtotalHt,
    vat: acc.vat + s.vatTotal,
    ttc: acc.ttc + s.totalTtc,
  }), { ht: 0, vat: 0, ttc: 0 });

  return NextResponse.json({ sales, totals });
}