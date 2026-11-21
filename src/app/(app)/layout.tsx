import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import MobileSidebar from '@/components/MobileSidebar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const userId = cookies().get('gm_session')?.value;
  if (!userId) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { store: true },
  });
  if (!user) redirect('/login');

  // On définit tous les menus possibles
  const allNavItems = [
    { href: '/dashboard', label: 'Tableau de bord', icon: '📊', roles: ['admin', 'manager', 'accountant'] },
    { href: '/pos', label: 'Nouvelle Vente (POS)', icon: '🛒', roles: ['admin', 'manager', 'cashier'] },
    { href: '/sales', label: 'Historique Ventes', icon: '🧾', roles: ['admin', 'manager', 'cashier', 'accountant'] },
    { href: '/articles', label: 'Articles', icon: '📦', roles: ['admin', 'manager'] },
    { href: '/purchases', label: 'Achats (Stock)', icon: '🚚', roles: ['admin', 'manager'] },
    { href: '/clients', label: 'Clients', icon: '👥', roles: ['admin', 'manager', 'cashier'] },
    { href: '/cash', label: 'Caisse', icon: '💰', roles: ['admin', 'manager', 'cashier'] },
    { href: '/accounting', label: 'Comptabilité', icon: '📚', roles: ['admin', 'accountant'] },
    { href: '/zakat', label: 'Zakat', icon: '🕌', roles: ['admin', 'accountant'] },
    { href: '/users', label: 'Utilisateurs', icon: '🔐', roles: ['admin'] },
    { href: '/settings', label: 'Paramètres', icon: '⚙️', roles: ['admin'] },
	{ href: '/help', label: 'Aide / Tutoriel', icon: '❓', roles: ['admin', 'manager', 'cashier', 'accountant'] },
  ];

  // On filtre selon le rôle de l'utilisateur connecté
  const navItems = allNavItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="min-h-screen flex bg-gray-50">
      <MobileSidebar 
        storeName={user.store.name} 
        userName={user.fullName} 
        navItems={navItems} 
        logoUrl={user.store.logoUrl}
      />
      <main className="flex-1 overflow-auto pt-16 md:pt-0 md:ml-64">
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}