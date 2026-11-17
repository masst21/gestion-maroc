
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
export async function GET() {
  const userId = cookies().get('gm_session')?.value;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sales = await prisma.sale.findMany({
    where: { storeId: user.storeId },
    include: { 
      client: true,
      items: { include: { article: true } } 
    },
    orderBy: { saleDate: 'desc' },
    take: 50,
  });
  return NextResponse.json(sales);
}
export async function POST(req: Request) {
  try {
    const userId = cookies().get('gm_session')?.value;
    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });

    const body = await req.json();
    const { items, totalTtc, totalHt, totalVat, clientId, paidAmount } = body;
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Panier vide' }, { status: 400 });
    }

    // Générer un numéro de facture unique
    const count = await prisma.sale.count({ where: { storeId: user.storeId } });
    const invoiceNo = `V-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Enregistrer la vente et les articles (Transaction)
    const sale = await prisma.$transaction(async (tx) => {
      // 1. Créer la vente
           const newSale = await tx.sale.create({
        data: {
          storeId: user.storeId,
          invoiceNo,
          subtotalHt: totalHt,
          vatTotal: totalVat,
          totalTtc: totalTtc,
          clientId: clientId || null,
          paidAmount: Number(paidAmount) || totalTtc,
          dueAmount: totalTtc - (Number(paidAmount) || totalTtc),
          paymentStatus: (Number(paidAmount) || totalTtc) >= totalTtc ? 'paid' : 'credit',
          saleType: 'cash',
          userId: user.id,
          items: {
            // ... gardez le bloc items existant
          },
        },
      });

      // 2. Mettre à jour le stock de chaque article
      for (const item of items) {
        await tx.article.update({
          where: { id: item.articleId },
          data: { stockQty: { decrement: item.quantity } },
        });
      }
if (clientId && (Number(paidAmount) || totalTtc) < totalTtc) {
  await tx.client.update({
    where: { id: clientId },
    data: { balance: { increment: totalTtc - (Number(paidAmount) || totalTtc) } }
  });
}
      return newSale;
    });

    return NextResponse.json({ ok: true, sale });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}