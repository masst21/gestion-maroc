import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

function formatMad(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? parseFloat(value) : Number(value ?? 0);
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(isNaN(n) ? 0 : n);
}

export default async function DashboardPage() {
  const userId = cookies().get('gm_session')?.value;
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { store: true } });
  if (!user) redirect('/login');

  const [articlesCount, clientsCount, salesToday] = await Promise.all([
    prisma.article.count({ where: { storeId: user.storeId } }),
    prisma.client.count({ where: { storeId: user.storeId } }),
    prisma.sale.aggregate({
      where: { storeId: user.storeId, saleDate: { gte: new Date(new Date().setHours(0,0,0,0)) } },
      _sum: { totalTtc: true }
    }),
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Tableau de bord</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-500">
          <p className="text-gray-500 text-sm">CA du jour</p>
          <p className="text-2xl font-bold">{formatMad(salesToday._sum.totalTtc || 0)}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-green-500">
          <p className="text-gray-500 text-sm">Articles en stock</p>
          <p className="text-2xl font-bold">{articlesCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-orange-500">
          <p className="text-gray-500 text-sm">Clients enregistrés</p>
          <p className="text-2xl font-bold">{clientsCount}</p>
        </div>
      </div>
    </div>
  );
}