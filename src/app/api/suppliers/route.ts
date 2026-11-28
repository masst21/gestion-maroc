import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

async function currentUser() {
  const id = cookies().get('gm_session')?.value;
  if (!id) return null;
  return prisma.user.findFirst({ where: { id, isActive: true } });
}
const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return fail('Unauthorized', 401);
    if (!['admin', 'manager'].includes(user.role)) return fail('Forbidden', 403);
    return NextResponse.json(await prisma.supplier.findMany({ where: { storeId: user.storeId }, orderBy: { name: 'asc' } }));
  } catch { return fail('Impossible de charger les fournisseurs', 500); }
}

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) return fail('Unauthorized', 401);
    if (!['admin', 'manager'].includes(user.role)) return fail('Forbidden', 403);
    const body = await req.json().catch(() => null);
    if (!body || typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 200) return fail('Nom invalide', 400);
    const name = body.name.trim();
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const ice = typeof body.ice === 'string' ? body.ice.trim() : '';
    if (phone.length > 50 || (ice && !/^\d{15}$/.test(ice))) return fail('Téléphone ou ICE invalide (15 chiffres)', 400);
    const existing = await prisma.supplier.findFirst({ where: { storeId: user.storeId, OR: [{ name: { equals: name, mode: 'insensitive' } }, ...(ice ? [{ ice }] : [])] } });
    if (existing) return fail('Fournisseur déjà existant', 409);
    const supplier = await prisma.supplier.create({ data: { storeId: user.storeId, name, phone: phone || null, ice: ice || null } });
    return NextResponse.json(supplier, { status: 201 });
  } catch { return fail('Impossible de créer le fournisseur', 500); }
}
