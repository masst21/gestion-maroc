import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import * as XLSX from 'xlsx';

export async function POST(req: Request) {
  try {
    const userId = cookies().get('gm_session')?.value;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet) as any[];

    let imported = 0;
    let errors = 0;

    for (const row of data) {
      try {
        if (!row['Référence'] || !row['Désignation']) continue;

        // Vérifier si l'article existe déjà (même référence)
        const existing = await prisma.article.findFirst({
          where: { storeId: user.storeId, reference: String(row['Référence']) }
        });

        if (existing) {
          // Mettre à jour le stock et le prix
          await prisma.article.update({
            where: { id: existing.id },
            data: {
              stockQty: Number(row['Stock']) || 0,
              salePriceHt: Number(row['Prix Vente HT']) || 0,
            }
          });
        } else {
          // Créer le nouvel article
          await prisma.article.create({
            data: {
              storeId: user.storeId,
              reference: String(row['Référence']),
              name: String(row['Désignation']),
              category: row['Catégorie'] ? String(row['Catégorie']) : null,
              purchasePrice: Number(row['Prix Achat']) || 0,
              salePriceHt: Number(row['Prix Vente HT']) || 0,
              vatRate: Number(row['TVA (%)']) || 20,
              stockQty: Number(row['Stock']) || 0,
              stockMin: Number(row['Stock Min']) || 0,
            }
          });
        }
        imported++;
      } catch (e) {
        errors++;
      }
    }

    return NextResponse.json({ ok: true, imported, errors });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}