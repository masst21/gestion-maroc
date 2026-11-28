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

  const lang: Language = cookies().get('lang')?.value === 'ar' ? 'ar' : 'fr';
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
    <div className="store-shell min-h-screen bg-gray-50">
      <MobileSidebar 
        storeName={user.store.name} 
        userName={user.fullName} 
        navItems={navItems} 
        logoUrl={user.store.logoUrl}
        lang={lang}
        version={process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local'}
      />
      
      <main className={`store-main min-w-0 lg:pt-0 ${lang === 'ar' ? 'lg:mr-64' : 'lg:ml-64'}`}>
        <div className="flex justify-end px-3 pt-3 sm:px-6">
          <LanguageSwitcher currentLang={lang} />
        </div>
        <div className="store-content min-w-0 p-3 sm:px-6 sm:pb-6 sm:pt-2">
          {children}
        </div>
      </main>
    </div>
  );
}