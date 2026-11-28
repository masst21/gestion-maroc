'use client';
import { useEffect, useState } from 'react';
import { formatMad } from '@/lib/utils';
import { dictionaries, Language } from '@/lib/dictionaries';
import PurchaseImport from './PurchaseImport';
import CatalogImport from '@/components/CatalogImport';

export default function PurchasesPage() {
  const [lang, setLang] = useState<Language>('fr');
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  
  const [form, setForm] = useState({ supplierId: '', articleId: '', quantity: 1, unitCost: 0 });
  const [newSupplier, setNewSupplier] = useState({ name: '', phone: '', ice: '' });
  const [error, setError] = useState('');
  const [savingSupplier, setSavingSupplier] = useState(false);
  const [savingPurchase, setSavingPurchase] = useState(false);
  const [notice, setNotice] = useState('');
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    // Lecture de la langue depuis le cookie
    const cookieLang = document.cookie.split('; ').find(row => row.startsWith('lang='))?.split('=')[1];
    setLang((cookieLang as Language) || 'fr');
    
    loadData();
  }, []);

  const t = dictionaries[lang];

  async function loadData() {
    const results = await Promise.allSettled(['/api/suppliers', '/api/articles', '/api/purchases'].map(async url => {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('load');
      const rows = await res.json();
      if (!Array.isArray(rows)) throw new Error('data');
      return rows;
    }));
    if (results[0].status === 'fulfilled') setSuppliers(results[0].value);
    if (results[1].status === 'fulfilled') setArticles(results[1].value);
    if (results[2].status === 'fulfilled') setPurchases(results[2].value);
    setLoadError(results.some(r => r.status === 'rejected'));
  }

  async function addSupplier(e: React.FormEvent) {
    e.preventDefault();
    if (savingSupplier || !newSupplier.name.trim()) return;
    setError(''); setNotice(''); setSavingSupplier(true);
    try {
      const res = await fetch('/api/suppliers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newSupplier) });
      const supplier = await res.json();
      if (!res.ok || !supplier.id) {
        setError(res.status === 409 ? (lang === 'ar' ? 'المورد موجود بالفعل' : 'Ce fournisseur existe déjà') : (lang === 'ar' ? 'تعذر إضافة المورد' : 'Impossible d’ajouter le fournisseur'));
        return;
      }
      setSuppliers(rows => [...rows.filter(s => s.id !== supplier.id), supplier].sort((a,b) => a.name.localeCompare(b.name)));
      setForm(f => ({ ...f, supplierId: supplier.id }));
      setNewSupplier({ name: '', phone: '', ice: '' });
      setNotice(lang === 'ar' ? 'تمت إضافة المورد واختياره' : 'Fournisseur ajouté et sélectionné.');
    } catch {
      setError(lang === 'ar' ? 'خطأ في الاتصال' : 'Erreur de connexion');
    } finally { setSavingSupplier(false); }
  }

  async function handlePurchase(e: React.FormEvent) {
    e.preventDefault();
    if (savingPurchase) return;
    setError(''); setNotice('');
    if (!form.supplierId || !form.articleId) return setError(lang === 'ar' ? 'يرجى اختيار مورد ومنتج' : 'Sélectionnez un fournisseur et un article');
    if (!Number.isFinite(form.quantity) || form.quantity <= 0 || !Number.isFinite(form.unitCost) || form.unitCost < 0) return setError(lang === 'ar' ? 'كمية أو سعر غير صالح' : 'Quantité ou prix invalide');
    setSavingPurchase(true);
    try {
      const res = await fetch('/api/purchases', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId: form.supplierId, items: [{ articleId: form.articleId, quantity: form.quantity, unitCost: form.unitCost }] }),
      });
      if (!res.ok) { setError(lang === 'ar' ? 'خطأ في الحفظ' : 'Erreur lors de l’enregistrement'); return; }
      setForm(f => ({ ...f, articleId: '', quantity: 1, unitCost: 0 }));
      setNotice(lang === 'ar' ? 'تم حفظ المشتريات وتحديث المخزون' : 'Achat enregistré, stock mis à jour.');
      await loadData();
    } catch { setError(lang === 'ar' ? 'خطأ في الاتصال' : 'Erreur de connexion'); }
    finally { setSavingPurchase(false); }
  }


  return (
    <div className="min-w-0 p-2 sm:p-4 max-w-5xl mx-auto space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-bold">{t.purchasesTitle}</h1>
        <div className="flex flex-wrap gap-2">
          <a href="/api/purchases/export" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-sm">
            ⬇️ {t.exportExcel}
          </a>

        </div>
      </div>

      {error && <div role="alert" className="bg-red-50 text-red-600 p-3 rounded">{error}</div>}
      {notice && <div role="status" className="bg-green-50 text-green-800 p-3 rounded">{notice}</div>}
      {loadError && <div role="alert" className="bg-amber-50 text-amber-900 p-3 rounded">{lang === 'ar' ? 'تعذر تحميل بعض البيانات' : 'Certaines données n’ont pas pu être chargées.'} <button type="button" onClick={loadData} className="underline">{lang === 'ar' ? 'إعادة المحاولة' : 'Réessayer'}</button></div>}

      <PurchaseImport lang={lang} onImported={loadData} />
      <CatalogImport kind="suppliers" lang={lang} onImported={loadData} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Formulaire Nouveau Fournisseur */}
        <div className="bg-white p-4 rounded-xl border">
          <h2 className="font-semibold mb-3">{t.addSupplier}</h2>
          <form onSubmit={addSupplier} className="flex flex-col gap-2">
            <input required placeholder={t.supplierName} value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} className="border p-2 rounded" />
            <div className="flex flex-wrap gap-2">
              <input placeholder={t.phone} value={newSupplier.phone} onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} className="border p-2 rounded flex-1 min-w-0" />
              <input placeholder={t.ice} value={newSupplier.ice} onChange={e => setNewSupplier({...newSupplier, ice: e.target.value})} className="border p-2 rounded flex-1 min-w-0" />
            </div>
            <button disabled={savingSupplier || !newSupplier.name.trim()} className="bg-blue-700 text-white px-4 py-2 rounded mt-2 disabled:opacity-50">{savingSupplier ? '…' : t.addBtn}</button>
          </form>
        </div>

        {/* Formulaire Nouvel Achat */}
        <div className="bg-white p-4 rounded-xl border">
          <h2 className="font-semibold mb-3">{t.recordPurchase}</h2>
          <form onSubmit={handlePurchase} className="flex flex-col gap-2">
            <select required value={form.supplierId} onChange={e => setForm({...form, supplierId: e.target.value})} className="border p-2 rounded text-sm">
              <option value="">{t.chooseSupplier}</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select required value={form.articleId} onChange={e => setForm({...form, articleId: e.target.value})} className="border p-2 rounded text-sm">
              <option value="">{t.chooseArticle}</option>
              {articles.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <div className="flex flex-wrap gap-2">
              <input type="number" required min="1" placeholder={t.qty} value={form.quantity} onChange={e => setForm({...form, quantity: Number(e.target.value)})} className="border p-2 rounded w-24 text-sm" />
              <input type="number" required min="0" step="0.01" placeholder={t.purchasePrice} value={form.unitCost} onChange={e => setForm({...form, unitCost: Number(e.target.value)})} className="border p-2 rounded flex-1 min-w-0 text-sm" />
            </div>
            <button disabled={savingPurchase || !form.supplierId || !form.articleId} className="bg-green-600 text-white px-4 py-2 rounded text-sm mt-2 disabled:opacity-50">{savingPurchase ? '…' : t.savePurchase}</button>
          </form>
        </div>
      </div>

      {/* Historique des Achats */}
      <div>
        <h2 className="font-semibold mb-3">{t.history}</h2>
        <div className="store-table-scroll bg-white rounded-xl border overflow-x-auto" role="region" aria-label={lang === 'ar' ? "سجل المشتريات" : "Historique des achats"} tabIndex={0}>
          <table className="store-data-table w-full min-w-[480px] text-sm">
            <thead className="bg-gray-50 text-start">
              <tr>
                <th scope="col" className="p-3">{t.date}</th>
                <th scope="col" className="p-3">{t.supplier}</th>
                <th scope="col" className="p-3">{t.articles}</th>
                <th scope="col" className="p-3 text-end">{t.total}</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map(p => (
                <tr key={p.id} className="border-t hover:bg-gray-50 text-gray-900">
                  <td className="p-3 text-xs">{new Date(p.createdAt).toLocaleDateString('fr-MA')}</td>
                  <td className="p-3 font-medium">{p.supplier?.name || '-'}</td>
                  <td className="p-3 text-xs">
                    {p.items.map((i: any) => `${i.quantity}x ${i.article?.name || '-'}`).join(', ')}
                  </td>
                  <td className="p-3 text-end font-semibold">{formatMad(p.totalAmount)}</td>
                </tr>
              ))}
              {purchases.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-500">{t.noPurchases}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}