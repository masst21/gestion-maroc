import { sessionUserId } from '@/lib/session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AgedBalancePage() {
  const id = await sessionUserId();
  if (!id) redirect('/login');
  const user = await prisma.user.findFirst({ where: { id, isActive: true } });
  if (!user || !['admin', 'manager', 'accountant'].includes(user.role)) redirect('/dashboard');
  const lang = cookies().get('lang')?.value === 'ar' ? 'ar' : 'fr';
  const tr = (fr: string, ar: string) => lang === 'ar' ? ar : fr;
  const now = new Date();
  const day = (date: Date) => {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Casablanca', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
    const part = (type: string) => Number(parts.find(p => p.type === type)?.value);
    return Date.UTC(part('year'), part('month') - 1, part('day')) / 86400000;
  };
  const today = day(now);
  const sales = await prisma.sale.findMany({
    where: { storeId: user.storeId, dueAmount: { gt: 0 } },
    select: { clientId: true, saleDate: true, dueAmount: true, client: { select: { id: true, name: true, storeId: true } } },
  });
  type Row = { name: string; buckets: number[]; total: number };
  const rows = new Map<string, Row>();
  const totals = [0, 0, 0, 0];
  let unassigned = 0;
  for (const sale of sales) {
    const amount = Math.round(sale.dueAmount * 100);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    if (!sale.client || sale.client.storeId !== user.storeId) { unassigned += amount; continue; }
    const age = Math.max(0, today - day(sale.saleDate));
    const bucket = age <= 30 ? 0 : age <= 60 ? 1 : age <= 90 ? 2 : 3;
    const row = rows.get(sale.client.id) || { name: sale.client.name, buckets: [0,0,0,0], total: 0 };
    row.buckets[bucket] += amount;
    row.total += amount;
    totals[bucket] += amount;
    rows.set(sale.client.id, row);
  }
  const sorted = [...rows.values()].sort((a,b) => b.total - a.total || a.name.localeCompare(b.name));
  const money = (cents: number) => new Intl.NumberFormat(lang === 'ar' ? 'ar-MA' : 'fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100) + ' MAD';
  const total = totals.reduce((a,b) => a+b, 0);
  const headings = [tr('0–30 jours','0–30 يوماً'),tr('31–60 jours','31–60 يوماً'),tr('61–90 jours','61–90 يوماً'),tr('Plus de 90 jours','أكثر من 90 يوماً')];
  return (
    <div className="min-w-0 max-w-6xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">{tr('Balance âgée — Clients', 'أعمار ديون العملاء')}</h1>
      <p className="text-sm text-gray-600">{tr('Situation au ', 'الوضع بتاريخ ')}{now.toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-MA', { timeZone: 'Africa/Casablanca' })}</p>
      <div className="border border-amber-300 bg-amber-50 text-amber-900 rounded p-3 text-sm">
        {tr('Ancienneté calculée depuis la date de vente (pas depuis une échéance contractuelle). Le rapport utilise les restes dus enregistrés, sans limite de 50 ventes. Il ne remplace pas un rapprochement comptable.', 'يحسب عمر الدين من تاريخ البيع وليس من تاريخ الاستحقاق. يعتمد التقرير على المبالغ المتبقية المسجلة دون حد 50 عملية بيع، ولا يغني عن المطابقة المحاسبية.')}
      </div>
      <div className="bg-white rounded-xl border p-4">
        <p className="text-sm text-gray-600">{tr('Total des créances clients identifiées','إجمالي مستحقات العملاء المحددين')}</p>
        <p className="text-2xl font-bold text-blue-900" dir="ltr">{money(total)}</p>
      </div>
      <div className="store-table-scroll bg-white rounded-xl border overflow-auto" tabIndex={0} role="region" aria-label={tr('Créances par client','مستحقات حسب العميل')}>
        <table className="store-data-table w-full min-w-[700px] text-sm">
          <thead><tr><th className="p-3" scope="col">{tr('Client','العميل')}</th>{headings.map(h => <th className="p-3" scope="col" key={h}>{h}</th>)}<th className="p-3" scope="col">{tr('Total','الإجمالي')}</th></tr></thead>
          <tbody>{sorted.map(r => <tr key={r.name + ':' + r.total + ':' + sorted.indexOf(r)}><td className="p-3">{r.name}</td>{r.buckets.map((v,i) => <td className="p-3 text-end" key={i} dir="ltr">{money(v)}</td>)}<td className="p-3 font-semibold text-end" dir="ltr">{money(r.total)}</td></tr>)}
          {sorted.length === 0 && <tr><td className="p-4 text-center" colSpan={6}>{tr('Aucune créance client enregistrée','لا توجد مستحقات عملاء مسجلة')}</td></tr>}</tbody>
          <tfoot><tr className="font-bold bg-blue-50"><th className="p-3" scope="row">{tr('Total','الإجمالي')}</th>{totals.map((v,i) => <td key={i} className="p-3 text-end" dir="ltr">{money(v)}</td>)}<td className="p-3 text-end" dir="ltr">{money(total)}</td></tr></tfoot>
        </table>
      </div>
      {unassigned > 0 && <p className="text-amber-900 text-sm">{tr('Restes dus sans client identifié, non répartis :','مبالغ متبقية دون عميل محدد وغير موزعة:')} <span dir="ltr">{money(unassigned)}</span></p>}
      <section className="bg-white border rounded-xl p-4 space-y-2">
        <h2 className="font-semibold">{tr('Dettes fournisseurs','ديون الموردين')}</h2>
        <p className="text-sm text-gray-700">{tr('Non calculables avec les données actuelles : les achats ne comportent pas encore de montants réglés ni d’échéances. Aucun solde fictif n’est affiché.', 'لا يمكن حسابها بالبيانات الحالية: لا تتضمن المشتريات مبالغ مدفوعة أو تواريخ استحقاق. لا يتم عرض رصيد افتراضي.')}</p>
      </section>
    </div>
  );
}
