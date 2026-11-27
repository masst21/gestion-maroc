'use client';
import { useEffect, useState } from 'react';

type Rate = { code: string; rate: number; date: string };
const priority = ['EUR','USD','CAD','GBP','GIP','CHF','DKK','SEK','NOK','SAR','KWD','AED'];
const referenceUrl = 'https://www.bkam.ma/Marches/Principaux-indicateurs/Marche-des-changes/Cours-de-change/Cours-de-reference';

export default function CurrenciesClient({ lang }: { lang: 'fr' | 'ar' }) {
  const tr = (fr: string, ar: string) => lang === 'ar' ? ar : fr;
  const locale = lang === 'ar' ? 'ar-MA' : 'fr-MA';
  const [rates, setRates] = useState<Rate[]>([]);
  const [amount, setAmount] = useState('');
  const [code, setCode] = useState('MAD');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [checkedAt, setCheckedAt] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [legacy, setLegacy] = useState<any[]>([]);
  useEffect(() => {
    let active = true;
    let controller: AbortController | undefined;
    async function load() {
      if (controller) controller.abort();
      const request = new AbortController();
      controller = request;
      setLoading(true);
      try {
        const res = await fetch('/api/currencies/reference', { cache: 'no-store', signal: request.signal });
        if (!res.ok) throw new Error('rates');
        const data = await res.json();
        if (!Array.isArray(data.rates) || !data.rates.length) throw new Error('data');
        if (!active || request.signal.aborted) return;
        setRates(data.rates);
        setCheckedAt(new Date().toISOString());
        setError(false);
      } catch {
        if (active && !request.signal.aborted) setError(true);
      } finally {
        if (active && !request.signal.aborted) setLoading(false);
      }
    }
    void load();
    const timer = window.setInterval(load, 15 * 60 * 1000);
    return () => { active = false; controller?.abort(); window.clearInterval(timer); };
  }, [refresh]);

  useEffect(() => {
    let active = true;
    fetch('/api/currencies').then(r => r.ok ? r.json() : []).then(rows => {
      if (active && Array.isArray(rows)) setLegacy(rows);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  const ordered = [...rates].sort((a,b) => {
    const rank = (s: string) => priority.includes(s) ? priority.indexOf(s) : priority.length;
    return rank(a.code) - rank(b.code) || a.code.localeCompare(b.code);
  });
  const selected = code === 'MAD' ? 1 : rates.find(r => r.code === code)?.rate;
  const value = amount.trim() === '' ? NaN : Number(amount.replace(',', '.'));
  const converted = selected !== undefined && Number.isFinite(value) && value >= 0 ? value * selected : NaN;
  const names = new Intl.DisplayNames([locale], { type: 'currency' });
  const name = (c: string) => names.of(c) || c;
  const fmt = (n: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 8 }).format(n);
  const money = (n: number) => new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  const date = (s: string) => new Date(s + 'T12:00:00Z').toLocaleDateString(locale, { dateStyle: 'long', timeZone: 'UTC' });
  const dates = [...new Set(rates.map(r => r.date))].sort();

  return (
    <div className="min-w-0 p-2 sm:p-4 max-w-5xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">{tr('Taux de change (Devises)', 'أسعار الصرف (العملات)')}</h1>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <a className="text-blue-700 underline" href={referenceUrl} target="_blank" rel="noreferrer">{tr('Bank Al-Maghrib · Cours de référence', 'بنك المغرب · أسعار الصرف المرجعية')}</a>
        {dates.length > 0 && <span>{dates.length === 1 ? date(dates[0]) : tr('Dates variables selon la devise', 'تختلف التواريخ حسب العملة')}</span>}
        <button type="button" disabled={loading} onClick={() => setRefresh(n => n+1)} className="border rounded px-3 py-2 disabled:opacity-50">{loading ? tr('Chargement…', 'جار التحميل…') : tr('Actualiser', 'تحديث')}</button>
      </div>
      <p className="text-xs text-gray-600">{tr('Cours de référence indicatifs via Frankfurter (source BAM), vérifiés toutes les 15 minutes lorsque cette page est ouverte. La publication est quotidienne, et non en temps réel.', 'أسعار مرجعية استرشادية عبر Frankfurter (المصدر بنك المغرب)، يتم التحقق منها كل 15 دقيقة عند فتح الصفحة. النشر يومي وليس لحظياً.')}</p>
      {checkedAt && <p className="text-xs text-gray-600">{tr('Dernière vérification : ', 'آخر تحقق: ')}{new Date(checkedAt).toLocaleString(locale)}</p>}
      {error && <p role="alert" className="bg-amber-50 border border-amber-300 rounded p-3 text-amber-900">{rates.length ? tr('Actualisation impossible : derniers cours reçus affichés. Vérifiez leur date.', 'تعذر التحديث: يتم عرض آخر أسعار مستلمة. تحقق من تاريخها.') : tr('Cours de référence indisponibles. Aucun taux non vérifié ne sera utilisé.', 'الأسعار المرجعية غير متاحة. لن يتم استخدام سعر غير موثوق.')}</p>}
      <div className="bg-white p-4 border rounded-xl space-y-3">
        <label className="block font-medium text-sm">{tr('Montant à convertir', 'المبلغ المراد تحويله')}
          <input inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0,00" className="block mt-1 w-full sm:max-w-xs border rounded p-2" />
        </label>
        <div className="flex flex-wrap items-end gap-3 bg-blue-50 rounded p-3">
          <label className="text-sm">{tr('Devise', 'العملة')}
            <select value={code} onChange={e=>setCode(e.target.value)} className="block border rounded p-2 bg-white max-w-full">
              <option value="MAD">MAD</option>
              {ordered.map(r=><option key={r.code} value={r.code}>{r.code} — {name(r.code)}</option>)}
            </select>
          </label>
          <div className="flex-1 min-w-[140px]" aria-live="polite">
            <p className="text-sm text-gray-600">{tr('Contre-valeur indicative en MAD', 'القيمة التقريبية بالدرهم')}</p>
            <p className="text-xl font-bold text-blue-900" dir="ltr">{Number.isFinite(converted) ? money(converted) + ' MAD' : '—'}</p>
            {selected !== undefined && <p className="text-xs text-gray-600" dir="ltr">1 {code} = {fmt(selected)} MAD</p>}
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-600">{tr('Faites défiler le tableau pour consulter tous les cours.', 'مرر الجدول للاطلاع على جميع أسعار الصرف.')}</p>
      <div className="store-table-scroll store-currencies-scroll bg-white rounded-xl border overflow-auto" role="region" aria-label={tr('Cours de référence', 'الأسعار المرجعية')} tabIndex={0}>
        <table className="store-data-table w-full min-w-[620px] text-sm">
          <thead><tr>{[tr('Devise','العملة'),tr('Code','الرمز'),tr('MAD pour 1 unité','درهم لكل وحدة'),tr('Date du cours','تاريخ السعر'),tr('Source','المصدر')].map(h=><th scope="col" key={h} className="p-3">{h}</th>)}</tr></thead>
          <tbody>
            {ordered.map(r=><tr key={r.code}><td className="p-3">{name(r.code)}</td><td className="p-3" dir="ltr">{r.code}</td><td className="p-3 text-end font-semibold" dir="ltr">{fmt(r.rate)}</td><td className="p-3 whitespace-nowrap">{date(r.date)}</td><td className="p-3">Bank Al-Maghrib / Frankfurter</td></tr>)}
            {!ordered.length && <tr><td colSpan={5} className="p-4 text-center text-gray-600">{loading ? tr('Chargement…','جار التحميل…') : tr('Aucun cours disponible','لا توجد أسعار متاحة')}</td></tr>}
          </tbody>
        </table>
      </div>
      {legacy.length > 0 && <details className="bg-white border rounded-lg p-3"><summary className="cursor-pointer text-sm">{tr('Anciens taux saisis manuellement (non utilisés dans le convertisseur)', 'الأسعار اليدوية القديمة (لا تستخدم في التحويل)')}</summary>
        <div className="store-table-scroll overflow-auto mt-3" tabIndex={0}><table className="store-data-table w-full min-w-[300px] text-sm"><thead><tr><th className="p-2">{tr('Devise','العملة')}</th><th className="p-2">MAD</th></tr></thead><tbody>{legacy.map(c=><tr key={c.id}><td className="p-2">{c.code}</td><td className="p-2">{c.rate}</td></tr>)}</tbody></table></div>
      </details>}
    </div>
  );
}
