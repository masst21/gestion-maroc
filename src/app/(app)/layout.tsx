import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import LogoutButton from '@/components/LogoutButton'; // <-- IMPORT AJOUTÉ

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const userId = cookies().get('gm_session')?.value;
  if (!userId) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { store: true },
  });
  if (!user) redirect('/login');

  const navItems = [
    { href: '/dashboard', label: 'Tableau de bord', icon: '📊' },
    { href: '/pos', label: 'Nouvelle Vente (POS)', icon: '🛒' },
    { href: '/articles', label: 'Articles', icon: '📦' },
{ href: '/sales', label: 'Historique Ventes', icon: '🧾' },
{ href: '/clients', label: 'Clients', icon: '👥' },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-blue-900 text-white flex flex-col hidden md:flex">
        <div className="p-4 border-b border-blue-800">
          <h1 className="font-bold text-lg">Gestion Commerciale</h1>
          <p className="text-xs text-blue-300">{user.store.name}</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-blue-800 transition text-sm"
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-blue-800">
          <div className="text-xs text-blue-300 mb-2">{user.fullName}</div>
          {/* REMPLACÉ PAR LE COMPOSANT CLIENT */}
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}