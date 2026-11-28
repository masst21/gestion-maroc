import { sessionUserId } from '@/lib/session';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET() {
  const userId = await sessionUserId();
  if (!userId) return NextResponse.json({error:'Unauthorized'},{status:401});
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currencies = await prisma.currency.findMany({ where: { storeId: user.storeId } });
  return NextResponse.json(currencies);
}

export async function POST(req: Request) {
  const userId = await sessionUserId();
  if (!userId) return NextResponse.json({error:'Unauthorized'},{status:401});
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { code, name, rate } = await req.json();
  const currency = await prisma.currency.create({
    data: { storeId: user.storeId, code, name, rate: Number(rate) },
  });
  return NextResponse.json(currency);
}