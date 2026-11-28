import { sessionUserId } from '@/lib/session';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

// Récupérer la session ouverte et ses mouvements
export async function GET() {
  const userId = await sessionUserId();
  if (!userId) return NextResponse.json({error:'Unauthorized'},{status:401});
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const session = await prisma.cashSession.findFirst({
    where: { storeId: user.storeId, status: 'open' },
    include: { movements: { orderBy: { createdAt: 'desc' } } },
  });

  // Récupérer l'historique des sessions fermées
  const history = await prisma.cashSession.findMany({
    where: { storeId: user.storeId, status: 'closed' },
    orderBy: { closedAt: 'desc' },
    take: 10,
  });

  return NextResponse.json({ session, history });
}

// Actions : Ouvrir, Fermer, Ajouter mouvement
export async function POST(req: Request) {
  const userId = await sessionUserId();
  if (!userId) return NextResponse.json({error:'Unauthorized'},{status:401});
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  if (action === 'open') {
    const session = await prisma.cashSession.create({
      data: { storeId: user.storeId, openingBalance: Number(body.amount) || 0 },
    });
    return NextResponse.json(session);
  }

  if (action === 'close') {
    const session = await prisma.cashSession.findFirst({
      where: { storeId: user.storeId, status: 'open' },
      include: { movements: true },
    });
    if (!session) return NextResponse.json({ error: 'Aucune session ouverte' }, { status: 400 });

    const inFlow = session.movements.filter(m => m.type === 'in').reduce((s, m) => s + m.amount, 0);
    const outFlow = session.movements.filter(m => m.type === 'out').reduce((s, m) => s + m.amount, 0);
    const expectedBalance = session.openingBalance + inFlow - outFlow;
    const closingBalance = Number(body.amount) || 0;
    
    const closed = await prisma.cashSession.update({
      where: { id: session.id },
      data: { 
        status: 'closed', 
        closingBalance, 
        expectedBalance, 
        difference: closingBalance - expectedBalance,
        closedAt: new Date()
      },
    });
    return NextResponse.json(closed);
  }

  if (action === 'movement') {
    const session = await prisma.cashSession.findFirst({ where: { storeId: user.storeId, status: 'open' } });
    if (!session) return NextResponse.json({ error: 'Aucune session ouverte' }, { status: 400 });

    const movement = await prisma.cashMovement.create({
      data: { sessionId: session.id, type: body.type, amount: Number(body.amount), reason: body.reason },
    });
    return NextResponse.json(movement);
  }

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
}