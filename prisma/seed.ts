import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const store = await prisma.store.create({
    data: {
      name: 'Mon Magasin',
      address: 'Casablanca, Maroc',
      phone: '0522334455',
      ice: '001234567000012',
      ifNumber: '12345678',
      currency: 'MAD',
      vatRate: 20,
    },
  });

  await prisma.user.create({
    data: {
      storeId: store.id,
      email: 'admin@demo.ma',
      password: await bcrypt.hash('Admin123!', 12),
      fullName: 'Administrateur',
      role: 'admin',
    },
  });

  const articles = [
    { reference: 'EP-001', name: 'Huile de table 5L', nameAr: 'زيت المائدة', category: 'Épicerie', purchasePrice: 55, salePriceHt: 65, vatRate: 20, stockQty: 40, stockMin: 10 },
    { reference: 'EP-002', name: 'Sucre 1kg', nameAr: 'سكر', category: 'Épicerie', purchasePrice: 6, salePriceHt: 7.5, vatRate: 20, stockQty: 120, stockMin: 20 },
    { reference: 'BO-001', name: 'Eau minérale 1.5L', nameAr: 'ماء معدني', category: 'Boissons', purchasePrice: 2.5, salePriceHt: 3.5, vatRate: 10, stockQty: 200, stockMin: 50 },
    { reference: 'BO-002', name: 'Jus d\'orange 1L', nameAr: 'عصير برتقال', category: 'Boissons', purchasePrice: 8, salePriceHt: 11, vatRate: 10, stockQty: 30, stockMin: 15 },
    { reference: 'HY-001', name: 'Savon de Marseille', nameAr: 'صابون مرسيليا', category: 'Hygiène', purchasePrice: 4, salePriceHt: 6, vatRate: 20, stockQty: 5, stockMin: 10 },
  ];

  for (const a of articles) {
    await prisma.article.create({ data: { ...a, storeId: store.id } });
  }

  await prisma.client.create({
    data: { storeId: store.id, name: 'Ahmed Benali', phone: '0661111111', creditLimit: 5000 },
  });
  await prisma.client.create({
    data: { storeId: store.id, name: 'Fatima Zahra', phone: '0662222222', creditLimit: 3000 },
  });

  console.log('✅ Données créées avec succès !');
  console.log('📧 Email : admin@demo.ma');
  console.log('🔑 Mot de passe : Admin123!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());