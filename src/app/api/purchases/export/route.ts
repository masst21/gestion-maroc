import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import * as XLSX from 'xlsx';

export async function GET() {
  const userId = cookies().get('gm_session')?.value;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const purchases = await prisma.purchase.findMany({
    where: { storeId: user.storeId },
    include: { supplier: true, items: { include: { article: true } } },
    orderBy: { createdAt: 'desc' },
  });

  // On aplatit les données pour Excel (1 ligne par article acheté)
  const data: any[] = [];
  purchases.forEach(p => {
    p.items.forEach(item => {
      data.push({
        'Date': new Date(p.createdAt).toLocaleDateString('fr-MA'),
        'Fournisseur': p.supplier?.name || '',
        'Référence Article': item.article?.reference || '',
        'Désignation': item.article?.name || '',
        'Quantité': item.quantity,
        'Prix Unitaire': item.unitCost,
        'Total': item.quantity * item.unitCost
      });
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Achats');
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="export-achats-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}