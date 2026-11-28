import { sessionUserId } from '@/lib/session';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET() {
  const userId = await sessionUserId();
  if (!userId) return NextResponse.json({error:'Unauthorized'},{status:401});
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sales = await prisma.sale.findMany({
    where: { storeId: user.storeId },
    include: { client: true, items: { include: { article: true } } },
    orderBy: { saleDate: 'desc' },
    take: 50,
  });
  return NextResponse.json(sales);
}

export async function POST(req: Request) {
  try {
    const userId = await sessionUserId();
  if (!userId) return NextResponse.json({error:'Unauthorized'},{status:401});
    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });

    const body = await req.json();
    const { items, totalTtc, totalHt, totalVat, clientId, paidAmount, paymentMethod } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Panier vide' }, { status: 400 });
    }

    // Générer un numéro de facture unique
    const count = await prisma.sale.count({ where: { storeId: user.storeId } });
    const invoiceNo = `V-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // CORRECTION : On plafonne le montant payé au Total TTC. 
    // Si on paie 4 pour un total de 3.85, la base de données enregistre 3.85.
    const requestedPaid = paidAmount !== undefined && paidAmount !== null && paidAmount !== '' ? Number(paidAmount) : totalTtc;
    const finalPaidAmount = Math.min(requestedPaid, totalTtc);
    const dueAmount = totalTtc - finalPaidAmount;

    // Transaction
    const sale = await prisma.$transaction(async (tx) => {
      const newSale = await tx.sale.create({
        data: {
          storeId: user.storeId,
          invoiceNo,
          subtotalHt: totalHt,
          vatTotal: totalVat,
          totalTtc: totalTtc,
          clientId: clientId || null,
          paidAmount: finalPaidAmount,
          dueAmount: dueAmount,
          paymentStatus: finalPaidAmount >= totalTtc ? 'paid' : (finalPaidAmount === 0 ? 'credit' : 'partial'),
 paymentMethod: paymentMethod || 'cash',
          saleType: clientId ? 'credit' : 'cash',
          userId: user.id,
          items: {
            create: items.map((item: any) => ({
              articleId: item.articleId,
              quantity: item.quantity,
              unitPriceHt: item.salePriceHt,
              vatRate: item.vatRate,
              lineTotalHt: item.lineTotalHt,
              lineTotalTtc: item.lineTotalTtc,
            })),
          },
        },
      });

      // Mise à jour du stock
      for (const item of items) {
        const article = await tx.article.findUnique({ where: { id: item.articleId } });
        if (!article) throw new Error(`Article introuvable (ID: ${item.articleId})`);
        if (article.stockQty < item.quantity) {
          throw new Error(`Stock insuffisant pour ${article.name} (Reste: ${article.stockQty})`);
        }
        
        await tx.article.update({
          where: { id: item.articleId },
          data: { stockQty: { decrement: item.quantity } },
        });
      }

      // Mise à jour du solde client si crédit
      if (clientId && dueAmount > 0) {
        await tx.client.update({
          where: { id: clientId },
          data: { balance: { increment: dueAmount } },
        });
      }

      return newSale;
    });

    return NextResponse.json({ ok: true, sale });
  } catch (e: any) {
    console.error("Erreur API Vente:", e);
    return NextResponse.json({ error: e.message || 'Erreur inconnue' }, { status: 500 });
  }
}