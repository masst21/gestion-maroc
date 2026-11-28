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
    return NextResponse.json(await prisma.purchase.findMany({
      where: { storeId: user.storeId }, include: { supplier: true, items: { include: { article: true } } }, orderBy: { createdAt: 'desc' },
    }));
  } catch { return fail('Impossible de charger les achats', 500); }
}

type Item = { articleId: string; quantity: number; unitCost: number };
function validItem(i: any): i is Item {
  return !!i && typeof i.articleId === 'string' && !!i.articleId &&
    typeof i.quantity === 'number' && Number.isFinite(i.quantity) && i.quantity > 0 &&
    typeof i.unitCost === 'number' && Number.isFinite(i.unitCost) && i.unitCost >= 0;
}
export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) return fail('Unauthorized', 401);
    const body = await req.json().catch(() => null);
    if (!body || typeof body.supplierId !== 'string' || !body.supplierId || !Array.isArray(body.items) ||
        body.items.length < 1 || body.items.length > 500 || !body.items.every(validItem)) return fail('Achat invalide', 400);
    const items: Item[] = body.items.map((i: Item) => ({ articleId: i.articleId, quantity: i.quantity, unitCost: i.unitCost }));
    const totalAmount = Math.round(items.reduce((n, i) => n + i.quantity * i.unitCost, 0) * 100) / 100;
    if (!Number.isFinite(totalAmount) || totalAmount > Number.MAX_SAFE_INTEGER / 100) return fail('Montant invalide', 400);
    const purchase = await prisma.$transaction(async tx => {
      const supplier = await tx.supplier.findFirst({ where: { id: body.supplierId, storeId: user.storeId } });
      if (!supplier) return null;
      const ids = [...new Set(items.map(i => i.articleId))];
      const articles = await tx.article.findMany({ where: { id: { in: ids }, storeId: user.storeId, isActive: true }, select: { id: true } });
      if (articles.length !== ids.length) return null;
      const result = await tx.purchase.create({ data: { storeId: user.storeId, supplierId: supplier.id, totalAmount, items: { create: items } }, include: { supplier: true, items: { include: { article: true } } } });
      for (const item of items) {
        await tx.article.update({ where: { id: item.articleId }, data: { stockQty: { increment: item.quantity }, purchasePrice: item.unitCost } });
      }
      return result;
    });
    if (!purchase) return fail('Fournisseur ou article introuvable', 400);
    return NextResponse.json(purchase, { status: 201 });
  } catch { return fail('Impossible de créer l’achat', 500); }
}
