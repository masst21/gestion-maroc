'use client';
import { useState } from 'react';
import Link from 'next/link';
import LogoutButton from './LogoutButton';

export default function MobileSidebar({ storeName, userName, navItems, logoUrl }: { storeName: string, userName: string, navItems: any[], logoUrl?: string | null }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Barre du haut sur mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b flex items-center px-4 z-40 shadow-sm">
        <button onClick={() => setIsOpen(true)} className="text-2xl text-blue-900 p-2">
          ☰
        </button>
        <span className="ml-2 font-bold text-blue-900">{storeName}</span>
      </div>

      {/* Fond sombre quand le menu est ouvert */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Le menu latéral (Sidebar) */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-blue-900 text-white flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-4 border-b border-blue-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {logoUrl && <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded object-cover" />}
            <div>
              <h1 className="font-bold text-sm leading-tight text-white">Mon Magasin</h1>
              <p className="text-xs text-blue-300">{storeName}</p>
            </div>
          </div>
          {/* Bouton pour fermer le menu sur mobile */}
          <button onClick={() => setIsOpen(false)} className="md:hidden text-2xl text-blue-300 hover:text-white">
            ✕
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-blue-800 transition text-sm text-white"
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-blue-800">
          <div className="text-xs text-blue-300 mb-2">{userName}</div>
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}