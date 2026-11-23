import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatMad } from '@/lib/utils';
import Link from 'next/link';
import DashboardCharts from '@/components/DashboardCharts';

export default async function DashboardPage() {
  const userId = cookies().get('gm_session')?.value;
  if (!userId) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { store: true },
  });
  if (!user) redirect('/login');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [salesToday, salesMonth, clientsWithDebt, openCashSession, recentSales] = await Promise.all([
    prisma.sale.aggregate({ where: { storeId: user.storeId, saleDate: { gte: today } }, _sum: { totalTtc: true }, _count: true }),
    prisma.sale.aggregate({ where: { storeId: user.storeId, saleDate: { gte: startOfMonth } }, _sum: { totalTtc: true } }),
    prisma.client.aggregate({ where: { storeId: user.storeId, balance: { gt: 0 } }, _sum: { balance: true } }),
    prisma.cashSession.findFirst({ where: { storeId: user.storeId, status: 'open' }, include: { movements: true } }),
    prisma.sale.findMany({ where: { storeId: user.storeId }, orderBy: { saleDate: 'desc' }, take: 5, include: { client: true } })
  ]);

  const caToday = Number(salesToday._sum.totalTtc || 0);
  const caMonth = Number(salesMonth._sum.totalTtc || 0);
  const dettesClients = Number(clientsWithDebt._sum.balance || 0);

  let cashBalance = 0;
  if (openCashSession) {
    const inFlow = openCashSession.movements.filter(m => m.type === 'in').reduce((s, m) => s + m.amount, 0);
    const outFlow = openCashSession.movements.filter(m => m.type === 'out').reduce((s, m) => s + m.amount, 0);
    cashBalance = openCashSession.openingBalance + inFlow - outFlow;
  }

  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    last7Days.push({
      date: d.toLocaleDateString('fr-MA', { weekday: 'short', day: 'numeric' }),
      dateObj: d,
    });
  }

  const weekSales = await prisma.sale.findMany({
    where: { storeId: user.storeId, saleDate: { gte: last7Days[0].dateObj } },
    include: { items: { include: { article: { select: { purchasePrice: true } } } } }
  });

  const chartData = last7Days.map(day => {
    const daySales = weekSales.filter(s => s.saleDate.getDate() === day.dateObj.getDate() && s.saleDate.getMonth() === day.dateObj.getMonth());
    const ca = daySales.reduce((sum, s) => sum + Number(s.totalTtc), 0);
    
    let cost = 0;
    daySales.forEach(sale => {
      sale.items.forEach(item => {
        cost += (item.quantity * (item.article?.purchasePrice || 0));
      });
    });
    
    const profit = ca - cost;
    const nbVentes = daySales.length;

    return { name: day.date, ca, profit, nbVentes };
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-sm text-gray-500">Bienvenue, {user.fullName}</p>
        </div>
        <Link href="/pos" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          + Nouvelle vente
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <p className="text-xs text-blue-600 font-semibold mb-1 uppercase tracking-wider">CA du jour</p>
          <p className="text-2xl font-bold text-blue-900">{formatMad(caToday)}</p>
          <p className="text-xs text-blue-500 mt-2">{salesToday._count} vente(s)</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <p className="text-xs text-emerald-600 font-semibold mb-1 uppercase tracking-wider">CA du mois</p>
          <p className="text-2xl font-bold text-emerald-900">{formatMad(caMonth)}</p>
          <p className="text-xs text-emerald-500 mt-2">Depuis le 1er</p>
        </div>
        <div className="bg-white border rounded-xl p-5">
          <p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Caisse actuelle</p>
          <p className="text-2xl font-bold text-gray-900">{formatMad(cashBalance)}</p>
          <p className="text-xs text-gray-500 mt-2">{openCashSession ? 'Session ouverte' : 'Caisse fermée'}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
          <p className="text-xs text-orange-600 font-semibold mb-1 uppercase tracking-wider">Dettes Clients</p>
          <p className="text-2xl font-bold text-orange-900">{formatMad(dettesClients)}</p>
          <p className="text-xs text-orange-500 mt-2">Argent à récupérer</p>
        </div>
      </div>

      <DashboardCharts data={chartData} />

      <div className="bg-white rounded-xl border p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-900">Dernières ventes</h2>
          <Link href="/sales" className="text-sm text-blue-600 hover:underline">Voir tout l'historique →</Link>
        </div>
        <div className="space-y-3">
          {recentSales.map(sale => (
            <div key={sale.id} className="flex justify-between items-center text-sm border-b last:border-0 pb-2">
              <div>
                <p className="font-medium text-gray-900">{sale.client?.name || 'Client de passage'}</p>
                <p className="text-xs text-gray-500">{new Date(sale.saleDate).toLocaleString('fr-MA', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <span className="font-semibold">{formatMad(sale.totalTtc)}</span>
            </div>
          ))}
          {recentSales.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Aucune vente récente</p>}
        </div>
      </div>
    </div>
  );
}