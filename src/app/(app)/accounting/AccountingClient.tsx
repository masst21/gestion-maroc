'use client';
import { useEffect, useState } from 'react';
import { formatMad } from '@/lib/utils';

const labels = {
  fr: { title: 'Comptabilité - Journal des ventes', export: 'Exporter pour le comptable', ht: 'Total HT', vat: 'Total TVA', ttc: 'Total TTC', date: 'Date', invoice: 'Facture', net: 'HT', tax: 'TVA', gross: 'TTC', loading: 'Chargement…', error: 'Impossible de charger le journal.', retry: 'Réessayer', scope: 'Dernières ventes (100 maximum). Les totaux concernent les ventes affichées.' },
  ar: { title: 'المحاسبة - سجل المبيعات', export: 'تصدير للمحاسب', ht: 'الإجمالي دون ضريبة', vat: 'إجمالي الضريبة على القيمة المضافة', ttc: 'الإجمالي شامل الضريبة', date: 'التاريخ', invoice: 'الفاتورة', net: 'دون ضريبة', tax: 'الضريبة', gross: 'شامل الضريبة', loading: 'جار التحميل…', error: 'تعذر تحميل سجل المبيعات.', retry: 'إعادة المحاولة', scope: 'آخر المبيعات (100 كحد أقصى). الإجماليات تخص المبيعات المعروضة.' },
};

export default function AccountingClient({ lang }: { lang: 'fr' | 'ar' }) {
  const t = labels[lang];
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    fetch('/api/accounting', { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error('load'); return r.json(); })
      .then(result => { if (!Array.isArray(result.sales) || !result.totals) throw new Error('data'); setData(result); })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [attempt]);

  if (error) return <div className="p-3 space-y-3"><p role="alert" className="text-red-700">{t.error}</p><button onClick={() => setAttempt(n => n + 1)} className="border rounded px-3 py-2">{t.retry}</button></div>;
  if (!data) return <div role="status" className="p-3">{t.loading}</div>;

  function exportCSV() {
    const headers = ['Date', 'Facture', 'Total HT', 'TVA', 'Total TTC'];
    const rows = data.sales.map((s: any) => [
      new Date(s.saleDate).toLocaleDateString('fr-MA'),
      s.invoiceNo,
      s.subtotalHt,
      s.vatTotal,
      s.totalTtc
    ]);
    const csv = [headers.join(';'), ...rows.map((r: any) => r.join(';'))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'journal_ventes.csv';
    link.click();
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4 min-w-0">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">{t.title}</h1>
        <button onClick={exportCSV} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm">
          📥 {t.export}
        </button>
      </div>

      <p className="text-xs text-gray-600">{t.scope}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border"><p className="text-xs text-gray-500">{t.ht}</p><p className="text-lg font-bold" dir="ltr">{formatMad(data.totals.ht)}</p></div>
        <div className="bg-white p-4 rounded-xl border"><p className="text-xs text-gray-500">{t.vat}</p><p className="text-lg font-bold" dir="ltr">{formatMad(data.totals.vat)}</p></div>
        <div className="bg-white p-4 rounded-xl border"><p className="text-xs text-gray-500">{t.ttc}</p><p className="text-lg font-bold" dir="ltr">{formatMad(data.totals.ttc)}</p></div>
      </div>

      <div className="store-table-scroll bg-white rounded-xl border overflow-x-auto" role="region" aria-label={lang === 'ar' ? "سجل المبيعات" : "Journal des ventes"} tabIndex={0}>
        <table className="store-data-table w-full min-w-[580px] text-sm">
          <thead className="bg-gray-50 text-start">
            <tr><th scope="col" className="p-3">{t.date}</th><th scope="col" className="p-3">{t.invoice}</th><th scope="col" className="p-3 whitespace-nowrap text-end">{t.net}</th><th scope="col" className="p-3 whitespace-nowrap text-end">{t.tax}</th><th scope="col" className="p-3 whitespace-nowrap text-end">{t.gross}</th></tr>
          </thead>
          <tbody>
            {data.sales.map((s: any) => (
              <tr key={s.id} className="border-t">
                <td className="p-3 text-xs">{new Date(s.saleDate).toLocaleDateString('fr-MA')}</td>
                <td className="p-3 font-mono text-xs">{s.invoiceNo}</td>
                <td className="p-3 whitespace-nowrap text-end">{formatMad(s.subtotalHt)}</td>
                <td className="p-3 whitespace-nowrap text-end">{formatMad(s.vatTotal)}</td>
                <td className="p-3 whitespace-nowrap text-end font-semibold">{formatMad(s.totalTtc)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}