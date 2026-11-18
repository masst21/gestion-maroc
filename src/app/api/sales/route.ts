
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const userId = cookies().get('gm_session')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sales = await prisma.sale.findMany({
      where: { storeId: user.storeId },
      include: {
        client: true,
        items: { include: { article: true } },
      },
      orderBy: { saleDate: 'desc' },
      take: 50,
    });

    return NextResponse.json(sales);
  } catch {
    return NextResponse.json(
      { error: 'Erreur lors du chargement des ventes' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const userId = cookies().get('gm_session')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 401 }
      );
    }

    const body = await req.json();

    const { items, clientId, paidAmount } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Panier vide' },
        { status: 400 }
      );
    }

    if (
      items.some((item: any) =>
        !item.articleId ||
        !Number.isFinite(Number(item.quantity)) ||
        Number(item.quantity) <= 0
      )
    ) {
      return NextResponse.json(
        { error: 'Articles ou quantités invalides' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      let subtotalHt = 0;
      let vatTotal = 0;
      let totalTtc = 0;

      const saleItems = [];

      for (const item of items) {
        const article = await tx.article.findFirst({
          where: {
            id: item.articleId,
            storeId: user.storeId,
            isActive: true,
          },
        });

        if (!article) {
          throw new Error(`Article introuvable : ${item.articleId}`);
        }

        const quantity = Number(item.quantity);
        const unitPriceHt = Number(article.salePriceHt);
        const vatRate = Number(article.vatRate);

        if (
          !Number.isFinite(quantity) ||
          quantity <= 0 ||
          !Number.isFinite(unitPriceHt) ||
          unitPriceHt < 0 ||
          !Number.isFinite(vatRate) ||
          vatRate < 0
        ) {
          throw new Error(`Données invalides pour ${article.name}`);
        }

        const lineTotalHt = Number(
          (unitPriceHt * quantity).toFixed(2)
        );

        const lineTotalTtc = Number(
          (lineTotalHt * (1 + vatRate / 100)).toFixed(2)
        );

        const lineVat = Number(
          (lineTotalTtc - lineTotalHt).toFixed(2)
        );

        const updated = await tx.article.updateMany({
          where: {
            id: article.id,
            storeId: user.storeId,
            stockQty: { gte: quantity },
          },
          data: {
            stockQty: { decrement: quantity },
          },
        });

        if (updated.count !== 1) {
          throw new Error(
            `Stock insuffisant pour ${article.name}`
          );
        }

        saleItems.push({
          articleId: article.id,
          quantity,
          unitPriceHt,
          vatRate,
          lineTotalHt,
          lineTotalTtc,
        });

        subtotalHt += lineTotalHt;
        vatTotal += lineVat;
        totalTtc += lineTotalTtc;
      }

      subtotalHt = Number(subtotalHt.toFixed(2));
      vatTotal = Number(vatTotal.toFixed(2));
      totalTtc = Number(totalTtc.toFixed(2));

      const paid = paidAmount === undefined || paidAmount === null || paidAmount === ''
        ? totalTtc
        : Number(paidAmount);

      if (!Number.isFinite(paid) || paid < 0 || paid > totalTtc) {
        throw new Error('Montant payé invalide');
      }

      if (clientId) {
        const client = await tx.client.findFirst({
          where: {
            id: clientId,
            storeId: user.storeId,
            isActive: true,
          },
        });

        if (!client) {
          throw new Error('Client introuvable');
        }
      }

      // Génération provisoire du numéro de facture.
      // Une séquence dédiée sera ajoutée pour le mode multi-appareils.
      const count = await tx.sale.count({
        where: { storeId: user.storeId },
      });

      const invoiceNo =
        `V-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      const dueAmount = Number((totalTtc - paid).toFixed(2));

      const sale = await tx.sale.create({
        data: {
          storeId: user.storeId,
          invoiceNo,
          subtotalHt,
          vatTotal,
          totalTtc,
          clientId: clientId || null,
          paidAmount: paid,
          dueAmount,
          paymentStatus: dueAmount === 0 ? 'paid' : 'credit',
          saleType: 'cash',
          userId: user.id,
          items: {
            create: saleItems,
          },
        },
        include: {
          items: { include: { article: true } },
          client: true,
        },
      });

      if (clientId && dueAmount > 0) {
        await tx.client.update({
          where: { id: clientId },
          data: {
            balance: { increment: dueAmount },
          },
        });
      }

      return sale;
    });

    return NextResponse.json({
      ok: true,
      sale: result,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la vente' },
      { status: 400 }
    );
  }
}
