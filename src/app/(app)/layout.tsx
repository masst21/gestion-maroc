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
    { href: '/help', label: 'Aide', icon: '❓', roles: ['admin', 'manager', 'cashier', 'accountant'] },
    { href: '/quotes', label: 'Devis', icon: '📝', roles: ['admin', 'manager', 'cashier'] },
    { href: '/expenses', label: 'Dépenses', icon: '💸', roles: ['admin', 'manager', 'accountant'] },
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      
      <MobileSidebar 
        storeName={user.store.name} 
        userName={user.fullName} 
        navItems={navItems} 
        logoUrl={user.store.logoUrl}
      />
      
      {/* 
        Le contenu principal :
        pt-16 (padding-top) sur mobile pour ne pas cacher sous la barre du haut.
        md:ml-64 (margin-left) sur PC pour laisser la place au menu latéral.
      */}
      <main className="flex-1 w-full md:ml-64 pt-16 md:pt-0 h-screen overflow-y-auto">
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>

    </div>
  );
}