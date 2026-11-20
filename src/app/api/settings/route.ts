import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET() {
  const userId = cookies().get('gm_session')?.value;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  return NextResponse.json(user.store);
}

export async function POST(req: Request) {
  const userId = cookies().get('gm_session')?.value;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, address, phone, logoUrl } = await req.json();
  const updated = await prisma.store.update({
    where: { id: user.storeId },
    data: { name, address, phone, logoUrl },
  });
  return NextResponse.json(updated);
}