'use client';
import { useEffect, useState } from 'react';

export default function CurrenciesClient({ lang }: { lang: 'fr' | 'ar' }) {
  const tr = (fr: string, ar: string) => lang === 'ar' ? ar : fr;
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [form, setForm] = useState({ code: 'EUR', name: 'Euro', rate: '' });

  function load() { fetch('/api/currencies').then(r => r.json()).then(setCurrencies); }
  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/currencies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setForm({ code: 'EUR', name: 'Euro', rate: '' });
    load();
  }

  return (
    <div className="min-w-0 p-2 sm:p-4 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{tr("Taux de change (Devises)", "أسعار الصرف (العملات)")}</h1>
      <p className="text-sm text-gray-500">{tr("Définissez combien vaut 1 unité de devise en Dirhams (MAD).", "حدد قيمة وحدة واحدة من العملة بالدرهم المغربي (MAD).")}</p>

      <form onSubmit={submit} className="bg-white p-4 rounded-xl border flex gap-2 flex-wrap">
        <select value={form.code} onChange={e => setForm({...form, code: e.target.value, name: e.target.value === 'EUR' ? 'Euro' : 'Dollar US'})} className="border p-2 rounded">
          <option value="EUR">EUR (€)</option>
          <option value="USD">USD ($)</option>
        </select>
        <input required type="number" step="0.01" placeholder={tr("Taux (ex: 10.85)", "سعر الصرف (مثال: 10.85)")} value={form.rate} onChange={e => setForm({...form, rate: e.target.value})} className="border p-2 rounded flex-1" />
        <button className="bg-blue-700 text-white px-4 py-2 rounded">{tr("Ajouter", "إضافة")}</button>
      </form>

      <p className="text-xs text-gray-600">{tr("Faites défiler le tableau pour consulter tous les cours.", "مرر الجدول للاطلاع على جميع أسعار الصرف.")}</p>
      <div className="store-table-scroll store-currencies-scroll bg-white rounded-xl border overflow-auto" role="region" aria-label={lang === 'ar' ? "أسعار الصرف" : "Taux de change"} tabIndex={0}>
        <table className="store-data-table w-full min-w-[480px] text-sm">
          <thead className="bg-gray-50 text-start">
            <tr><th scope="col" className="p-3">{tr("Devise", "العملة")}</th><th scope="col" className="p-3">{tr("Code", "الرمز")}</th><th scope="col" className="p-3 text-end">{tr("1 Devise = (MAD)", "وحدة عملة واحدة = (MAD)")}</th></tr>
          </thead>
          <tbody>
            {currencies.map(c => (
              <tr key={c.id} className="border-t">
                <td className="p-3 font-medium">{lang === 'ar' ? (c.code === 'EUR' ? 'يورو' : c.code === 'USD' ? 'دولار أمريكي' : c.name) : c.name}</td>
                <td className="p-3">{c.code}</td>
                <td className="p-3 text-end font-bold">{c.rate} MAD</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}