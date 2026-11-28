import { sessionUserId } from '@/lib/session';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET() {
  const userId = await sessionUserId();
  if (!userId) return NextResponse.json({error:'Unauthorized'},{status:401});
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 1. Valeur du stock (prix de vente HT * quantité)
  const articles = await prisma.article.findMany({
    where: { storeId: user.storeId, isActive: true },
  });
  const stockValue = articles.reduce((sum, a) => sum + (a.stockQty * a.salePriceHt), 0);

  // 2. Solde de caisse (session ouverte)
  const openSession = await prisma.cashSession.findFirst({
    where: { storeId: user.storeId, status: 'open' },
    include: { movements: true },
  });
  let cashValue = 0;
  if (openSession) {
    const inFlow = openSession.movements.filter(m => m.type === 'in').reduce((s, m) => s + m.amount, 0);
    const outFlow = openSession.movements.filter(m => m.type === 'out').reduce((s, m) => s + m.amount, 0);
    cashValue = openSession.openingBalance + inFlow - outFlow;
  }

  // 3. Créances clients (ce qu'ils doivent)
  const clients = await prisma.client.aggregate({
    where: { storeId: user.storeId, balance: { gt: 0 } },
    _sum: { balance: true },
  });
  const receivables = Number(clients._sum.balance || 0);

  // 4. Dettes fournisseurs (ce que l'on doit)
  // (On calcule la somme des achats - ce qui a été payé. 
  // Pour simplifier, on va dire que le total des achats est une dette si non payée, 
  // mais ici on va juste prendre 0 pour l'instant car on n'a pas suivi les paiements fournisseurs)
  const payables = 0; 

  // 5. Calcul du patrimoine net
  const netWealth = stockValue + cashValue + receivables - payables;

  // 6. Nisab (Base sur l'argent : 595g * prix du gramme, ou forfaitaire 7500 MAD)
  const NISAB = 7500;
  const isSubject = netWealth >= NISAB;
  const zakatDue = isSubject ? netWealth * 0.025 : 0;

  return NextResponse.json({
    stockValue,
    cashValue,
    receivables,
    payables,
    netWealth,
    nisabValue: NISAB,
    isSubject,
    zakatDue,
  });
}