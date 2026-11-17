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

  const navItems = [
    { href: '/dashboard', label: 'Tableau de bord', icon: '📊' },
    { href: '/pos', label: 'Nouvelle Vente (POS)', icon: '🛒' },
    { href: '/articles', label: 'Articles', icon: '📦' },
    { href: '/sales', label: 'Historique Ventes', icon: '🧾' },
    { href: '/clients', label: 'Clients', icon: '👥' },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Notre nouveau menu (gère automatiquement mobile et PC) */}
      <MobileSidebar 
        storeName={user.store.name} 
        userName={user.fullName} 
        navItems={navItems} 
      />

      {/* Contenu principal (on ajoute un padding-top sur mobile pour ne pas cacher sous le bouton hamburger) */}
      <main className="flex-1 overflow-auto pt-16 md:pt-0 md:ml-64">
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}