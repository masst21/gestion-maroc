'use client';
import { useEffect, useState } from 'react';
import { formatMad } from '@/lib/utils';

export default function CashClient({ lang }: { lang: 'fr' | 'ar' }) {
  const tr = (fr: string, ar: string) => lang === 'ar' ? ar : fr;
  const [data, setData] = useState<{ session: any, history: any[] }>({ session: null, history: [] });
  const [loading, setLoading] = useState(true);
  
  // Formulaires
  const [openAmount, setOpenAmount] = useState('');
  const [closeAmount, setCloseAmount] = useState('');
  const [movement, setMovement] = useState({ type: 'in', amount: '', reason: '' });

  function loadData() {
    fetch('/api/cash').then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }
  useEffect(() => { loadData(); }, []);

  async function handleAction(action: string, payload: any) {
    await fetch('/api/cash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
    });
    loadData();
  }

  if (loading) return <div className="p-6">{tr("Chargement...", "جار التحميل...")}</div>;

  const { session, history } = data;

  // Calculs pour l'affichage
  const inTotal = session?.movements.filter((m: any) => m.type === 'in').reduce((s: number, m: any) => s + m.amount, 0) || 0;
  const outTotal = session?.movements.filter((m: any) => m.type === 'out').reduce((s: number, m: any) => s + m.amount, 0) || 0;
  const expected = session ? session.openingBalance + inTotal - outTotal : 0;

  return (
    <div className="min-w-0 p-2 sm:p-4 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{tr("Caisse", "الصندوق")}</h1>

      {/* Si aucune session n'est ouverte */}
      {!session && (
        <div className="bg-white p-6 rounded-xl border max-w-md">
          <h2 className="font-semibold mb-4">{tr("Ouvrir la caisse", "فتح الصندوق")}</h2>
          <p className="text-sm text-gray-500 mb-4">{tr("Saisissez le fond de caisse initial (espèces dans le tiroir).", "أدخل الرصيد النقدي الأولي في الصندوق.")}</p>
          <div className="flex gap-2">
            <input type="number" placeholder={tr("Ex: 500", "مثال: 500")} value={openAmount} onChange={e => setOpenAmount(e.target.value)} className="border p-2 rounded flex-1" />
            <button onClick={() => handleAction('open', { amount: openAmount })} className="bg-green-600 text-white px-4 py-2 rounded">{tr("Ouvrir", "فتح")}</button>
          </div>
        </div>
      )}

      {/* Si une session est ouverte */}
      {session && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Colonne gauche : Résumé */}
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-xl border">
              <h2 className="font-semibold mb-4 text-blue-900">{tr("Session en cours", "الجلسة الحالية")}</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>{tr("Fond initial", "الرصيد الأولي")}</span><span>{formatMad(session.openingBalance)}</span></div>
                <div className="flex justify-between text-green-600"><span>{tr("Entrées (+)", "المداخيل (+)")}</span><span>+{formatMad(inTotal)}</span></div>
                <div className="flex justify-between text-red-600"><span>{tr("Sorties (-)", "المصروفات (-)")}</span><span>-{formatMad(outTotal)}</span></div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2"><span>{tr("Solde théorique", "الرصيد النظري")}</span><span>{formatMad(expected)}</span></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border max-w-md">
              <h2 className="font-semibold mb-4">{tr("Clôturer la caisse", "إغلاق الصندوق")}</h2>
              <p className="text-sm text-gray-500 mb-4">{tr("Comptez l'argent réellement présent dans le tiroir.", "احسب المبلغ النقدي الفعلي الموجود في الصندوق.")}</p>
              <div className="flex gap-2">
                <input type="number" placeholder={tr("Montant compté", "المبلغ المحسوب")} value={closeAmount} onChange={e => setCloseAmount(e.target.value)} className="border p-2 rounded flex-1" />
                <button onClick={() => handleAction('close', { amount: closeAmount })} className="bg-red-600 text-white px-4 py-2 rounded">{tr("Clôturer", "إغلاق")}</button>
              </div>
            </div>
          </div>

          {/* Colonne droite : Mouvements */}
          <div className="bg-white p-6 rounded-xl border">
            <h2 className="font-semibold mb-4">{tr("Mouvements manuels", "الحركات اليدوية")}</h2>
            <div className="flex gap-2 mb-4">
              <select value={movement.type} onChange={e => setMovement({...movement, type: e.target.value})} className="border p-2 rounded text-sm">
                <option value="in">{tr("Entrée (+)", "إيداع (+)")}</option>
                <option value="out">{tr("Sortie (-)", "سحب (-)")}</option>
              </select>
              <input type="number" placeholder={tr("Montant", "المبلغ")} value={movement.amount} onChange={e => setMovement({...movement, amount: e.target.value})} className="border p-2 rounded w-24 text-sm" />
              <input placeholder={tr("Motif (ex: achat sacs)", "السبب (مثال: شراء أكياس)")} value={movement.reason} onChange={e => setMovement({...movement, reason: e.target.value})} className="border p-2 rounded flex-1 text-sm" />
              <button onClick={() => { handleAction('movement', movement); setMovement({ type: 'in', amount: '', reason: '' }); }} className="bg-blue-700 text-white px-3 py-2 rounded text-sm">{tr("Ajouter", "إضافة")}</button>
            </div>

            <div className="store-table-scroll store-cash-movements max-h-64 overflow-auto rounded-lg border" role="region" aria-label={lang === 'ar' ? 'حركات الصندوق' : 'Mouvements de caisse'} tabIndex={0}>
              <table className="store-data-table w-full min-w-[360px] text-sm">
                <thead><tr>
                  <th scope="col" className="px-3 py-2">{tr("Heure", "الوقت")}</th>
                  <th scope="col" className="px-3 py-2 text-end">{tr("Montant", "المبلغ")}</th>
                  <th scope="col" className="px-3 py-2">{tr("Motif", "السبب")}</th>
                </tr></thead>
                <tbody>
                  {session.movements.map((m: any) => (
                    <tr key={m.id} className="border-b last:border-0">
                      <td className="px-3 py-2 text-gray-600 text-xs whitespace-nowrap">{new Date(m.createdAt).toLocaleTimeString('fr-MA')}</td>
                      <td className={`px-3 py-2 text-end whitespace-nowrap font-semibold ${m.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>{m.type === 'in' ? '+' : '-'}{formatMad(m.amount)}</td>
                      <td className="px-3 py-2 text-gray-700 break-words">{m.reason}</td>
                    </tr>
                  ))}
                  {session.movements.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-gray-600">{tr("Aucun mouvement", "لا توجد حركات")}</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Historique */}
      <div>
        <h2 className="font-semibold mb-3">{tr("Historique des clôtures", "سجل الإغلاقات")}</h2>
        <div className="store-table-scroll bg-white rounded-xl border overflow-x-auto" role="region" aria-label={lang === 'ar' ? "سجل الإغلاقات" : "Historique des clôtures"} tabIndex={0}>
          <table className="store-data-table w-full min-w-[480px] text-sm">
            <thead className="bg-gray-50 text-start">
              <tr><th scope="col" className="p-3">{tr("Date", "التاريخ")}</th><th scope="col" className="p-3">{tr("Fond", "الرصيد الأولي")}</th><th scope="col" className="p-3">{tr("Attendu", "المتوقع")}</th><th scope="col" className="p-3">{tr("Compté", "المبلغ المحسوب")}</th><th scope="col" className="p-3">{tr("Écart", "الفرق")}</th></tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id} className="border-t">
                  <td className="p-3 text-xs">{new Date(h.closedAt).toLocaleString('fr-MA')}</td>
                  <td className="p-3">{formatMad(h.openingBalance)}</td>
                  <td className="p-3">{formatMad(h.expectedBalance)}</td>
                  <td className="p-3">{formatMad(h.closingBalance)}</td>
                  <td className={`p-3 font-bold ${h.difference !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {h.difference > 0 ? '+' : ''}{formatMad(h.difference)}
                  </td>
                </tr>
              ))}
              {history.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-gray-500">{tr("Aucune session clôturée", "لا توجد جلسات مغلقة")}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}