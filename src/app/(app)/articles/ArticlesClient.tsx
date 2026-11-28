'use client';
import { useEffect, useState } from 'react';
import CatalogImport from '@/components/CatalogImport';
import CameraScanner from '@/components/CameraScanner';

type Article = {
  id: string; reference: string; barcode: string | null; name: string; imageUrl: string | null;
  salePriceHt: number; vatRate: number; stockQty: number;
};

function formatMad(value: number): string {
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(value);
}

export default function ArticlesClient({ lang }: { lang: 'fr' | 'ar' }) {
  const tr = (fr: string, ar: string) => lang === 'ar' ? ar : fr;
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  
  const [form, setForm] = useState({ 
    reference: '', barcode: '', name: '', salePriceHt: '', vatRate: '20', stockQty: '', imageUrl: '' 
  });
  const [error, setError] = useState('');

  function loadArticles() {
    setLoading(true);
    fetch('/api/articles', { cache: 'no-store' }).then(async res => { const data = await res.json(); if (!res.ok || !Array.isArray(data)) throw new Error(); setArticles(data); }).catch(() => setError(tr('Chargement des articles impossible.', 'تعذر تحميل المنتجات.'))).finally(() => setLoading(false));
  }
  useEffect(() => { loadArticles(); }, []);

  // Fonction pour compresser l'image en Base64 (pour ne pas surcharger la base de données)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setPhotoLoading(true);
    const fail = () => { setPhotoLoading(false); setError(tr('Image illisible. Essayez une image JPEG ou PNG.', 'تعذرت قراءة الصورة. جرب JPEG أو PNG.')); };
    const reader = new FileReader();
    reader.onerror = fail;
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = fail;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 250; // On redimensionne pour le web
        const MAX_HEIGHT = 250;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compression JPEG à 70% de qualité
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setForm(f => ({ ...f, imageUrl: dataUrl }));
        setPhotoLoading(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); if (saving || photoLoading) return; setError(''); setSaving(true);
    try {
    const res = await fetch('/api/articles', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); return; }
    setForm({ reference: '', barcode: '', name: '', salePriceHt: '', vatRate: '20', stockQty: '', imageUrl: '' });
    setShowForm(false); loadArticles();
    } catch { setError(tr('Enregistrement impossible. Réessayez.', 'تعذر الحفظ. حاول مرة أخرى.')); }
    finally { setSaving(false); }
  }


  return (
    <div className="min-w-0 p-2 sm:p-4 max-w-6xl mx-auto">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">{tr("Catalogue d'Articles", "كتالوج المنتجات")}</h1>
        <div className="flex gap-2">
          <a href="/api/articles/export" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-sm">
            ⬇️ Exporter Excel
          </a>

          <button onClick={() => setShowForm(!showForm)} className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium text-sm">
            {showForm ? tr("Annuler", "إلغاء") : tr("+ Nouvel article", "+ منتج جديد")}
          </button>
        </div>
      </div>

      <CatalogImport kind="articles" lang={lang} onImported={loadArticles} />

      {!showForm && error && <p role="alert" className="bg-red-50 text-red-800 p-3 rounded">{error}</p>}
      {showScanner && <CameraScanner lang={lang} onScan={code => { setForm(f => ({...f, barcode: code, reference: f.reference.trim() || code})); setShowScanner(false); }} onClose={() => setShowScanner(false)}/>}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">{tr("Ajouter un article", "إضافة منتج")}</h2>
          {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm mb-1">{tr("Référence *", "المرجع *")}</label><input required value={form.reference} onChange={e => setForm({...form, reference: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
            <div><label className="block text-sm mb-1">{tr('Code-barres / QR', 'الباركود / QR')}</label><div className="flex flex-wrap gap-2"><input aria-label={tr('Code-barres', 'الباركود')} maxLength={100} value={form.barcode} onChange={e=>setForm(f=>({...f,barcode:e.target.value}))} className="flex-1 min-w-0 border rounded px-3 py-2"/><button type="button" onClick={()=>setShowScanner(true)} className="bg-blue-700 text-white px-3 py-2 rounded">{tr('Scanner', 'مسح')}</button></div></div>
            <div><label className="block text-sm mb-1">{tr("Désignation *", "التسمية *")}</label><input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
            <div><label className="block text-sm mb-1">{tr("Prix de vente HT (MAD)", "سعر البيع دون ضريبة (MAD)")}</label><input type="number" step="0.01" required value={form.salePriceHt} onChange={e => setForm({...form, salePriceHt: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
            <div><label className="block text-sm mb-1">{tr("TVA (%)", "الضريبة (%)")}</label><select value={form.vatRate} onChange={e => setForm({...form, vatRate: e.target.value})} className="w-full border rounded px-3 py-2"><option value="20">20 %</option><option value="10">10 %</option><option value="7">7 %</option><option value="0">0 %</option></select></div>
            <div><label className="block text-sm mb-1">{tr("Stock initial", "المخزون الأولي")}</label><input type="number" required value={form.stockQty} onChange={e => setForm({...form, stockQty: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
            
            {/* CHAMP IMAGE */}
            <div>
              <label className="block text-sm mb-1">{tr("Image de l'article", "صورة المنتج")}</label>
              <label className="block text-sm mb-1">{tr('Choisir une photo', 'اختر صورة')}<input disabled={photoLoading||saving} type="file" accept="image/*" onChange={handleImageUpload} className="w-full border rounded px-3 py-1.5 text-sm" /></label>
              <label className="block text-sm mt-2">{tr('Prendre une photo', 'التقاط صورة')}<input disabled={photoLoading||saving} type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="w-full border rounded px-3 py-1.5 text-sm" /></label>
              {form.imageUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={form.imageUrl} alt={tr("Aperçu", "معاينة")} className="w-12 h-12 object-cover rounded border" />
                  <button type="button" onClick={() => setForm(f=>({...f, imageUrl: ''}))} className="text-red-500 text-xs hover:underline">{tr("Supprimer", "حذف")}</button>
                </div>
              )}
            </div>

            <div className="md:col-span-2 flex justify-end mt-2"><button type="submit" disabled={saving||photoLoading} className="bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50">{tr("Enregistrer", "حفظ")}</button></div>
          </form>
        </div>
      )}

      <input aria-label={tr('Rechercher un article','البحث عن منتج')} placeholder={tr('Nom, référence ou code-barres','الاسم أو المرجع أو الباركود')} value={search} onChange={e=>setSearch(e.target.value)} className="w-full border rounded p-2 mb-3"/>
      <div className="store-table-scroll bg-white rounded-xl shadow-sm border overflow-x-auto" role="region" aria-label={lang === 'ar' ? "كتالوج المنتجات" : "Catalogue des articles"} tabIndex={0}>
        <table className="store-data-table w-full min-w-[480px] text-sm">
          <thead className="bg-gray-50 text-start">
            <tr><th scope="col" className="p-3">{tr("Image", "الصورة")}</th><th scope="col" className="p-3">{tr("Référence", "المرجع")}</th><th scope="col" className="p-3">{tr("Désignation", "التسمية")}</th><th scope="col" className="p-3 text-end">{tr("Prix HT", "السعر دون ضريبة")}</th><th scope="col" className="p-3 text-end">{tr("TVA", "الضريبة على القيمة المضافة")}</th><th scope="col" className="p-3 text-end">{tr("Stock", "المخزون")}</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-6 text-center text-gray-500">{tr("Chargement...", "جار التحميل...")}</td></tr>
            ) : articles.filter(a=>[a.name,a.reference,a.barcode].some(v=>v?.toLowerCase().includes(search.trim().toLowerCase()))).map(a => (
              <tr key={a.id} className="border-t hover:bg-gray-50 text-gray-900 items-center">
                <td className="p-3">
                  {a.imageUrl ? (
                    <img src={a.imageUrl} alt={a.name} className="w-10 h-10 object-cover rounded border shadow-sm" />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded border flex items-center justify-center text-gray-400 text-xs">{tr("N/A", "غير متاح")}</div>
                  )}
                </td>
                <td className="p-3 font-mono text-xs text-gray-600">{a.reference}{a.barcode&&a.barcode!==a.reference&&<div>{a.barcode}</div>}</td>
                <td className="p-3 font-medium">{a.name}</td>
                <td className="p-3 text-end">{formatMad(a.salePriceHt)}</td>
                <td className="p-3 text-end">{a.vatRate}%</td>
                <td className="p-3 text-end font-semibold"><span className={a.stockQty > 0 ? 'text-green-700' : 'text-red-700'}>{a.stockQty}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}