'use client';
import { useRouter } from 'next/navigation';

export default function LanguageSwitcher({ currentLang }: { currentLang: string }) {
  const router = useRouter();

  const changeLang = (lang: string) => {
    document.cookie = `lang=${lang}; path=/; max-age=31536000`; // 1 an
    router.refresh();
  };

  return (
    <div className="store-lang flex bg-slate-100 border border-slate-200 p-1 rounded-lg" dir="ltr">
      <button 
        type="button" aria-pressed={currentLang === 'fr'} onClick={() => changeLang('fr')} 
        className={`px-3 py-2 min-h-10 rounded text-sm font-medium ${currentLang === 'fr' ? 'bg-white shadow text-blue-900' : 'text-gray-500'}`}
      >
        FR
      </button>
      <button 
        type="button" aria-pressed={currentLang === 'ar'} onClick={() => changeLang('ar')} 
        className={`px-3 py-2 min-h-10 rounded text-sm font-medium ${currentLang === 'ar' ? 'bg-white shadow text-blue-900' : 'text-gray-500'}`}
      >
        عربية
      </button>
    </div>
  );
}