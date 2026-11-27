'use client';
import { useEffect, useState } from 'react';
import { formatMad } from '@/lib/utils';

const labels = {
  fr: { title: 'Calcul de la Zakat', intro: 'Calcul estimatif basé sur la valeur du stock, la caisse et les créances.', wealth: '1. Patrimoine soumis à la Zakat', stock: 'Valeur du stock (prix de vente HT)', cash: 'Liquidités en caisse ouverte', receivables: 'Créances clients', payables: 'Dettes fournisseurs (non calculées actuellement)', net: 'Patrimoine net estimé', result: '2. Résultat', nisab: 'Seuil du Nisab (argent, forfait indicatif)', due: 'Zakat estimée due', notDue: 'Zakat estimée non due', above: 'Votre patrimoine atteint ou dépasse le Nisab.', below: 'Votre patrimoine est inférieur au Nisab.', rate: 'Taux : 2,5 %', warning: 'Le seuil est fixé à 7 500 MAD et les dettes fournisseurs ne sont pas encore calculées. Ce résultat est indicatif ; faites valider le calcul par un expert religieux.', loading: 'Chargement…', error: 'Impossible de charger le calcul.', retry: 'Réessayer' },
  ar: { title: 'حساب الزكاة', intro: 'حساب تقديري يعتمد على قيمة المخزون والسيولة والمستحقات.', wealth: '١. الأموال الخاضعة للزكاة', stock: 'قيمة المخزون (سعر البيع دون الضريبة)', cash: 'السيولة في الصندوق المفتوح', receivables: 'مستحقات العملاء', payables: 'ديون الموردين (غير محسوبة حالياً)', net: 'صافي الأموال التقديري', result: '٢. النتيجة', nisab: 'نصاب الفضة (قيمة تقديرية ثابتة)', due: 'الزكاة المستحقة تقديرياً', notDue: 'الزكاة غير مستحقة تقديرياً', above: 'بلغت أموالك النصاب أو تجاوزته.', below: 'أموالك أقل من النصاب.', rate: 'النسبة: ٢٫٥٪', warning: 'تم تحديد النصاب بقيمة ثابتة قدرها ٧٥٠٠ درهم، ولم تُحسب ديون الموردين بعد. هذه النتيجة تقديرية، ويرجى مراجعة مختص شرعي للتحقق من الحساب.', loading: 'جار التحميل…', error: 'تعذر تحميل حساب الزكاة.', retry: 'إعادة المحاولة' },
};

export default function ZakatClient({ lang }: { lang: 'fr' | 'ar' }) {
  const t = labels[lang];
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    fetch('/api/zakat', { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error('load'); return r.json(); })
      .then(result => { if (typeof result.netWealth !== 'number') throw new Error('data'); setData(result); })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [attempt]);

  if (error) return <div className="p-3 space-y-3"><p role="alert" className="text-red-700">{t.error}</p><button onClick={() => setAttempt(n => n + 1)} className="border rounded px-3 py-2">{t.retry}</button></div>;
  if (!data) return <div role="status" className="p-3">{t.loading}</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-4 min-w-0">
      <div className="text-center mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t.title}</h1>
        <p className="text-sm text-gray-500 mt-2">
          {t.intro}
        </p>
      </div>

      <div className="bg-white rounded-xl border p-3 sm:p-6 shadow-sm">
        <h2 className="font-semibold text-lg mb-4 border-b pb-2">{t.wealth}</h2>
        
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap justify-between items-center gap-2 py-1">
            <span className="text-gray-600">{t.stock}</span>
            <span className="font-medium whitespace-nowrap" dir="ltr">{formatMad(data.stockValue)}</span>
          </div>
          <div className="flex flex-wrap justify-between items-center gap-2 py-1">
            <span className="text-gray-600">{t.cash}</span>
            <span className="font-medium whitespace-nowrap" dir="ltr">{formatMad(data.cashValue)}</span>
          </div>
          <div className="flex flex-wrap justify-between items-center gap-2 py-1">
            <span className="text-gray-600">{t.receivables}</span>
            <span className="font-medium whitespace-nowrap" dir="ltr">{formatMad(data.receivables)}</span>
          </div>
          <div className="flex flex-wrap justify-between items-center gap-2 py-1 text-red-600">
            <span>{t.payables}</span>
            <span dir="ltr">- {formatMad(data.payables)}</span>
          </div>
          
          <div className="flex flex-wrap justify-between items-center gap-2 py-3 border-t mt-2 font-bold text-lg">
            <span>{t.net}</span>
            <span className="text-blue-900 whitespace-nowrap" dir="ltr">{formatMad(data.netWealth)}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-3 sm:p-6 shadow-sm">
        <h2 className="font-semibold text-lg mb-4 border-b pb-2">{t.result}</h2>
        
        <div className="space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-2 text-sm">
            <span className="text-gray-600">{t.nisab}</span>
            <span className="font-medium whitespace-nowrap" dir="ltr">{formatMad(data.nisabValue)}</span>
          </div>
          
          <div className={`p-4 rounded-lg flex flex-wrap items-center justify-between gap-3 ${data.isSubject ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
            <div>
              <p className={`font-bold ${data.isSubject ? 'text-amber-800' : 'text-green-800'}`}>
                {data.isSubject ? t.due : t.notDue}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {data.isSubject ? t.above : t.below}
              </p>
            </div>
            <div className="text-end">
              <p className="text-xs text-gray-500">{t.rate}</p>
              <p dir="ltr" className={`text-2xl font-bold ${data.isSubject ? 'text-amber-700' : 'text-green-700'}`}>
                {formatMad(data.zakatDue)}
              </p>
            </div>
          </div>
          
          <p className="text-xs text-gray-400 text-center pt-4">
            ⚠️ {t.warning}
          </p>
        </div>
      </div>
    </div>
  );
}