import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import MobileSidebar from '@/components/MobileSidebar';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { dictionaries, Language } from '@/lib/dictionaries';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const userId = cookies().get('gm_session')?.value;
  if (!userId) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { store: true },
  });
  if (!user) redirect('/login');

  const lang = (cookies().get('lang')?.value || 'fr') as Language;
  const t = dictionaries[lang];

  const allNavItems = [
    { href: '/dashboard', label: t.dashboard, icon: '📊', roles: ['admin', 'manager', 'accountant'] },
    { href: '/pos', label: t.pos, icon: '🛒', roles: ['admin', 'manager', 'cashier'] },
    { href: '/sales', label: t.sales, icon: '🧾', roles: ['admin', 'manager', 'cashier', 'accountant'] },
    { href: '/articles', label: t.articles, icon: '📦', roles: ['admin', 'manager'] },
    { href: '/purchases', label: t.purchases, icon: '🚚', roles: ['admin', 'manager'] },
    { href: '/quotes', label: t.quotes, icon: '📝', roles: ['admin', 'manager', 'cashier'] },
    { href: '/expenses', label: t.expenses, icon: '💸', roles: ['admin', 'manager', 'accountant'] },
    { href: '/clients', label: t.clients, icon: '👥', roles: ['admin', 'manager', 'cashier'] },
    { href: '/cash', label: t.cashPage, icon: '💰', roles: ['admin', 'manager', 'cashier'] },
    { href: '/accounting', label: t.accounting, icon: '📚', roles: ['admin', 'accountant'] },
    { href: '/zakat', label: t.zakat, icon: '🕌', roles: ['admin', 'accountant'] },
    { href: '/users', label: t.users, icon: '🔐', roles: ['admin'] },
    { href: '/settings', label: t.settings, icon: '⚙️', roles: ['admin'] },
    { href: '/settings/currencies', label: t.currencies, icon: '💱', roles: ['admin'] },
    { href: '/help', label: t.help, icon: '❓', roles: ['admin', 'manager', 'cashier', 'accountant'] },
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
      
      <main className="flex-1 w-full md:ml-64 pt-16 md:pt-0 h-screen overflow-y-auto relative">
        <div className="absolute top-4 right-4 z-50">
          <LanguageSwitcher currentLang={lang} />
        </div>
        <div className="p-4 md:p-6 pt-16 md:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}