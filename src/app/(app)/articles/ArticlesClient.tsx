'use client';
import { useEffect, useState } from 'react';

type Article = {
  id: string; reference: string; name: string; imageUrl: string | null;
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
  const [importing, setImporting] = useState(false);
  
  const [form, setForm] = useState({ 
    reference: '', name: '', salePriceHt: '', vatRate: '20', stockQty: '', imageUrl: '' 
  });
  const [error, setError] = useState('');

  function loadArticles() {
    setLoading(true);
    fetch('/api/articles').then(res => res.json()).then(data => { setArticles(data); setLoading(false); });
  }
  useEffect(() => { loadArticles(); }, []);

  // Fonction pour compresser l'image en Base64 (pour ne pas surcharger la base de données)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
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
        setForm({ ...form, imageUrl: dataUrl });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('');
    const res = await fetch('/api/articles', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); return; }
    setForm({ reference: '', name: '', salePriceHt: '', vatRate: '20', stockQty: '', imageUrl: '' });
    setShowForm(false); loadArticles();
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/articles/import', { method: 'POST', body: formData });
    const data = await res.json();
    if (res.ok) {
      alert(tr(`✅ Importation réussie !\n${data.imported} articles traités.`, `✅ تم الاستيراد بنجاح!\nتمت معالجة ${data.imported} منتج.`));
      loadArticles();
    } else { alert(tr("Erreur lors de l'importation", 'حدث خطأ أثناء الاستيراد')); }
    setImporting(false); e.target.value = '';
  }

  return (
    <div className="min-w-0 p-2 sm:p-4 max-w-6xl mx-auto">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">{tr("Catalogue d'Articles", "كتالوج المنتجات")}</h1>
        <div className="flex gap-2">
          <a href="/api/articles/export" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-sm">
            ⬇️ Exporter Excel
          </a>
          <label className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-sm cursor-pointer">
            {importing ? tr("Importation...", "جار الاستيراد...") : tr("⬆️ Importer Excel", "⬆️ استيراد Excel")}
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImport} disabled={importing} />
          </label>
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium text-sm">
            {showForm ? tr("Annuler", "إلغاء") : tr("+ Nouvel article", "+ منتج جديد")}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">{tr("Ajouter un article", "إضافة منتج")}</h2>
          {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm mb-1">{tr("Référence *", "المرجع *")}</label><input required value={form.reference} onChange={e => setForm({...form, reference: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
            <div><label className="block text-sm mb-1">{tr("Désignation *", "التسمية *")}</label><input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
            <div><label className="block text-sm mb-1">{tr("Prix de vente HT (MAD)", "سعر البيع دون ضريبة (MAD)")}</label><input type="number" step="0.01" required value={form.salePriceHt} onChange={e => setForm({...form, salePriceHt: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
            <div><label className="block text-sm mb-1">{tr("TVA (%)", "الضريبة (%)")}</label><select value={form.vatRate} onChange={e => setForm({...form, vatRate: e.target.value})} className="w-full border rounded px-3 py-2"><option value="20">20 %</option><option value="10">10 %</option><option value="7">7 %</option><option value="0">0 %</option></select></div>
            <div><label className="block text-sm mb-1">{tr("Stock initial", "المخزون الأولي")}</label><input type="number" required value={form.stockQty} onChange={e => setForm({...form, stockQty: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
            
            {/* CHAMP IMAGE */}
            <div>
              <label className="block text-sm mb-1">{tr("Image de l'article", "صورة المنتج")}</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full border rounded px-3 py-1.5 text-sm" />
              {form.imageUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={form.imageUrl} alt={tr("Aperçu", "معاينة")} className="w-12 h-12 object-cover rounded border" />
                  <button type="button" onClick={() => setForm({...form, imageUrl: ''})} className="text-red-500 text-xs hover:underline">{tr("Supprimer", "حذف")}</button>
                </div>
              )}
            </div>

            <div className="md:col-span-2 flex justify-end mt-2"><button type="submit" className="bg-blue-700 text-white px-6 py-2 rounded-lg">{tr("Enregistrer", "حفظ")}</button></div>
          </form>
        </div>
      )}

      <div className="store-table-scroll bg-white rounded-xl shadow-sm border overflow-x-auto" role="region" aria-label={lang === 'ar' ? "كتالوج المنتجات" : "Catalogue des articles"} tabIndex={0}>
        <table className="store-data-table w-full min-w-[480px] text-sm">
          <thead className="bg-gray-50 text-start">
            <tr><th scope="col" className="p-3">{tr("Image", "الصورة")}</th><th scope="col" className="p-3">{tr("Référence", "المرجع")}</th><th scope="col" className="p-3">{tr("Désignation", "التسمية")}</th><th scope="col" className="p-3 text-end">{tr("Prix HT", "السعر دون ضريبة")}</th><th scope="col" className="p-3 text-end">{tr("TVA", "الضريبة على القيمة المضافة")}</th><th scope="col" className="p-3 text-end">{tr("Stock", "المخزون")}</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-6 text-center text-gray-500">{tr("Chargement...", "جار التحميل...")}</td></tr>
            ) : articles.map(a => (
              <tr key={a.id} className="border-t hover:bg-gray-50 text-gray-900 items-center">
                <td className="p-3">
                  {a.imageUrl ? (
                    <img src={a.imageUrl} alt={a.name} className="w-10 h-10 object-cover rounded border shadow-sm" />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded border flex items-center justify-center text-gray-400 text-xs">{tr("N/A", "غير متاح")}</div>
                  )}
                </td>
                <td className="p-3 font-mono text-xs text-gray-600">{a.reference}</td>
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