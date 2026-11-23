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
    const rows = XLSX.utils.sheet_to_json(worksheet) as any[];

    let imported = 0;
    let errors = 0;

    for (const row of rows) {
      try {
        const supplierName = row['Fournisseur'] || row['Nom Fournisseur'];
        const articleRef = row['Référence Article'] || row['Référence'] || row['Ref'];
        const quantity = Number(row['Quantité'] || row['Qte'] || row['Qty'] || 0);
        const unitCost = Number(row['Prix Unitaire'] || row['Prix Achat'] || row['Prix'] || 0);

        if (!supplierName || !articleRef || quantity <= 0) {
          continue; // On ignore les lignes vides ou invalides
        }

        // 1. Trouver ou créer le fournisseur
        let supplier = await prisma.supplier.findFirst({
          where: { storeId: user.storeId, name: supplierName }
        });
        if (!supplier) {
          supplier = await prisma.supplier.create({
            data: { storeId: user.storeId, name: supplierName }
          });
        }

        // 2. Trouver l'article
        const article = await prisma.article.findFirst({
          where: { storeId: user.storeId, reference: String(articleRef) }
        });
        
        if (!article) {
          errors++;
          continue; // Article introuvable
        }

        // 3. Créer l'achat et mettre à jour le stock (Transaction)
        await prisma.$transaction(async (tx) => {
          const totalAmount = quantity * unitCost;
          
          await tx.purchase.create({
            data: {
              storeId: user.storeId,
              supplierId: supplier!.id,
              totalAmount: totalAmount,
              items: {
                create: [{
                  articleId: article.id,
                  quantity: quantity,
                  unitCost: unitCost
                }]
              }
            }
          });

          await tx.article.update({
            where: { id: article.id },
            data: { 
              stockQty: { increment: quantity },
              purchasePrice: unitCost // Optionnel: on met à jour le dernier prix d'achat
            }
          });
        });

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