'use client';
import { useEffect, useState } from 'react';
import { formatMad } from '@/lib/utils';
import type { Language } from '@/lib/dictionaries';

const categories = ['Loyer', 'Salaires', 'Électricité/Eau', 'Transport', 'Fournitures', 'Divers'];
const arCategories = ['الإيجار', 'الأجور', 'الكهرباء والماء', 'النقل', 'اللوازم', 'متفرقات'];
const labels = {
  fr: { title: 'Gestion des Dépenses', total: 'Total Dépenses', category: 'Catégorie', description: 'Description', example: 'Ex : Facture Lydec', amount: 'Montant', add: 'Ajouter', date: 'Date', empty: 'Aucune dépense enregistrée', error: 'Une erreur est survenue. Réessayez.', loading: 'Chargement…' },
  ar: { title: 'إدارة المصروفات', total: 'إجمالي المصروفات', category: 'الفئة', description: 'الوصف', example: 'مثال: فاتورة الماء والكهرباء', amount: 'المبلغ', add: 'إضافة', date: 'التاريخ', empty: 'لا توجد مصروفات مسجلة', error: 'حدث خطأ. يرجى إعادة المحاولة.', loading: 'جار التحميل…' },
};
type Expense = { id: string; category: string; description: string; amount: number; date: string };
const initialForm = { category: 'Loyer', description: '', amount: '', paymentMethod: 'cash' };

export default function ExpensesClient({ lang }: { lang: Language }) {
  const t = labels[lang];
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const categoryLabel = (value: string) => lang === 'ar' ? arCategories[categories.indexOf(value)] || value : value;

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch('/api/expenses');
      if (!response.ok) throw new Error('load');
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('data');
      setExpenses(data);
    } catch { setError(true); } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(false);
    try {
      const response = await fetch('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!response.ok) throw new Error('save');
      setForm(initialForm);
      await load();
    } catch { setError(true); } finally { setSaving(false); }
  }
  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  return (
    <div className="max-w-4xl mx-auto space-y-4 min-w-0">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">{t.title}</h1>
        <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm">
          <span className="text-gray-600">{t.total} : </span>
          <span className="font-bold text-red-700" dir="ltr">{formatMad(total)}</span>
        </div>
      </div>
      {error && <p role="alert" className="text-red-700 text-sm">{t.error}</p>}
      <form onSubmit={submit} className="bg-white p-3 sm:p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 items-end">
        <label className="min-w-0 text-sm">{t.category}
          <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="block w-full border p-2 rounded text-base">
            {categories.map(category => <option key={category} value={category}>{categoryLabel(category)}</option>)}
          </select>
        </label>
        <label className="min-w-0 text-sm xl:col-span-2">{t.description}
          <input required placeholder={t.example} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="block w-full border p-2 rounded text-base" />
        </label>
        <label className="min-w-0 text-sm">{t.amount} (MAD)
          <input required type="number" step="0.01" inputMode="decimal" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="block w-full border p-2 rounded text-base" />
        </label>
        <button disabled={saving} className="bg-red-600 disabled:opacity-50 text-white px-4 py-2 rounded text-sm min-h-10 hover:bg-red-700">{saving ? t.loading : t.add}</button>
      </form>
      <div className="store-table-scroll bg-white rounded-xl border overflow-x-auto" role="region" aria-label={lang === 'ar' ? "قائمة المصروفات" : "Liste des dépenses"} tabIndex={0}>
        <table className="store-data-table w-full min-w-[460px] text-sm">
          <thead className="bg-gray-50 text-start">
            <tr><th scope="col" className="p-3 text-start">{t.date}</th><th scope="col" className="p-3 text-start">{t.category}</th><th scope="col" className="p-3 text-start">{t.description}</th><th scope="col" className="p-3 text-end">{t.amount}</th></tr>
          </thead>
          <tbody>
            {expenses.map(e => (
              <tr key={e.id} className="border-t hover:bg-gray-50">
                <td className="p-3 text-xs whitespace-nowrap">{new Date(e.date).toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-MA')}</td>
                <td className="p-3 font-medium">{categoryLabel(e.category)}</td>
                <td className="p-3 break-words">{e.description}</td>
                <td className="p-3 text-end font-semibold text-red-600 whitespace-nowrap"><span dir="ltr">-{formatMad(Number(e.amount))}</span></td>
              </tr>
            ))}
            {expenses.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-500">{loading ? t.loading : error ? t.error : t.empty}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
