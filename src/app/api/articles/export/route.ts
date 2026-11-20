import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import * as XLSX from 'xlsx';

export async function GET() {
  const userId = cookies().get('gm_session')?.value;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const articles = await prisma.article.findMany({
    where: { storeId: user.storeId, isActive: true },
    orderBy: { name: 'asc' },
  });

  // Préparer les données pour Excel
  const data = articles.map(a => ({
    'Référence': a.reference,
    'Désignation': a.name,
    'Catégorie': a.category || '',
    'Prix Achat': a.purchasePrice,
    'Prix Vente HT': a.salePriceHt,
    'TVA (%)': a.vatRate,
    'Stock': a.stockQty,
    'Stock Min': a.stockMin,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Articles');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="export-articles-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}