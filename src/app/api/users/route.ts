import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function GET() {
  const userId = cookies().get('gm_session')?.value;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  // Seul un admin peut voir les utilisateurs
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const users = await prisma.user.findMany({
    where: { storeId: user.storeId },
    select: { id: true, fullName: true, email: true, role: true, isActive: true },
    orderBy: { fullName: 'asc' },
  });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const userId = cookies().get('gm_session')?.value;
  const admin = await prisma.user.findUnique({ where: { id: userId } });
  if (!admin || admin.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { fullName, email, password, role } = await req.json();
  
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: 'Cet email existe déjà' }, { status: 400 });

  const newUser = await prisma.user.create({
    data: {
      storeId: admin.storeId,
      fullName,
      email,
      password: await bcrypt.hash(password, 10),
      role,
    },
  });
  return NextResponse.json(newUser);
}