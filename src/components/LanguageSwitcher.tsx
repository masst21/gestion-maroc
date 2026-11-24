'use client';
import { useRouter } from 'next/navigation';

export default function LanguageSwitcher({ currentLang }: { currentLang: string }) {
  const router = useRouter();

  const changeLang = (lang: string) => {
    document.cookie = `lang=${lang}; path=/; max-age=31536000`; // 1 an
    router.refresh();
  };

  return (
    <div className="flex bg-gray-100 p-1 rounded-lg">
      <button 
        onClick={() => changeLang('fr')} 
        className={`px-3 py-1 rounded text-sm font-medium ${currentLang === 'fr' ? 'bg-white shadow text-blue-900' : 'text-gray-500'}`}
      >
        FR
      </button>
      <button 
        onClick={() => changeLang('ar')} 
        className={`px-3 py-1 rounded text-sm font-medium ${currentLang === 'ar' ? 'bg-white shadow text-blue-900' : 'text-gray-500'}`}
      >
        عربية
      </button>
    </div>
  );
}