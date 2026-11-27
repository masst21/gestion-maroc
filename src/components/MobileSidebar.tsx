'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from './LogoutButton';
import { dictionaries, Language } from '@/lib/dictionaries';

type NavItem = { href: string; label: string; icon: string };
export default function MobileSidebar({ storeName, userName, navItems, logoUrl, lang = 'fr', version }: {
  storeName: string; userName: string; navItems: NavItem[]; logoUrl?: string | null;
  lang?: Language; version?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const rtl = lang === 'ar';
  const t = dictionaries[lang];
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  return (
    <>
      <header className="store-mobile-header lg:hidden fixed top-0 inset-x-0 bg-blue-900 text-white flex items-center gap-2 px-3 z-40 shadow-sm">
        <button type="button" aria-label={rtl ? 'فتح القائمة' : 'Ouvrir le menu'} aria-expanded={isOpen}
          aria-controls="store-sidebar" onClick={() => setIsOpen(true)} className="text-2xl text-white min-w-11 min-h-11 p-2">☰</button>
        <span className="font-bold text-white truncate">{storeName}</span>
      </header>
      {isOpen && <button type="button" aria-label={rtl ? 'إغلاق القائمة' : 'Fermer le menu'}
        className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsOpen(false)} />}
      <aside id="store-sidebar" className={`fixed top-0 bottom-0 w-64 max-w-[85vw] bg-blue-900 text-white flex flex-col z-50 overflow-hidden transform transition-transform duration-200 ${rtl ? 'right-0' : 'left-0'} ${isOpen ? 'translate-x-0 visible' : rtl ? 'translate-x-full invisible' : '-translate-x-full invisible'} lg:visible lg:translate-x-0`}
        style={{ height: '100dvh', paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="shrink-0 px-3 py-2 border-b border-blue-800 flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {logoUrl && <img src={logoUrl} alt="" className="w-8 h-8 rounded object-cover shrink-0" />}
            <div className="min-w-0">
              <h1 className="font-bold text-sm truncate">{rtl ? 'متجري' : 'Mon Magasin'}</h1>
              <p className="text-xs text-blue-300 truncate">{storeName}</p>
            </div>
          </div>
          <button type="button" aria-label={rtl ? 'إغلاق القائمة' : 'Fermer le menu'} onClick={() => setIsOpen(false)}
            className="lg:hidden min-w-11 min-h-11 p-2 text-xl text-blue-100">✕</button>
        </div>
        <nav aria-label={rtl ? 'القائمة الرئيسية' : 'Menu principal'} className="store-nav flex-1 min-h-0 overflow-y-auto overscroll-contain p-2 space-y-2" style={{ WebkitOverflowScrolling: 'touch' }}>
          {navItems.map(item => (
            <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}
              aria-current={pathname === item.href ? 'page' : undefined}
              className={`flex items-center gap-2 px-3 py-2 min-h-11 rounded-lg transition text-sm ${pathname === item.href ? 'font-semibold' : 'hover:bg-blue-800'}`}>
              <span aria-hidden="true" className="text-base shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="shrink-0 px-3 py-1 text-[11px] text-blue-200 lg:hidden border-t border-blue-800">{rtl ? 'مرر القائمة للمزيد ↕' : 'Faites défiler le menu ↕'}</div>
        <footer className="shrink-0 px-3 py-2 border-t border-blue-800">
          <div className="text-xs text-blue-200 truncate">{userName}</div>
          <LogoutButton label={t.logout} />
          {version && <div className="text-[10px] text-blue-200" dir="ltr">Build {version}</div>}
        </footer>
      </aside>
    </>
  );
}
