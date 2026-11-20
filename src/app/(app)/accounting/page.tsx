'use client';
import { useEffect, useState } from 'react';
import { formatMad } from '@/lib/utils';

export default function AccountingPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/accounting').then(r => r.json()).then(setData);
  }, []);

  if (!data) return <div className="p-6">Chargement...</div>;

  function exportCSV() {
    const headers = ['Date', 'Facture', 'Total HT', 'TVA', 'Total TTC'];
    const rows = data.sales.map((s: any) => [
      new Date(s.saleDate).toLocaleDateString(),
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
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Comptabilité - Journal des Ventes</h1>
        <button onClick={exportCSV} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm">
          📥 Exporter pour le comptable
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border"><p className="text-xs text-gray-500">Total HT</p><p className="text-lg font-bold">{formatMad(data.totals.ht)}</p></div>
        <div className="bg-white p-4 rounded-xl border"><p className="text-xs text-gray-500">Total TVA</p><p className="text-lg font-bold">{formatMad(data.totals.vat)}</p></div>
        <div className="bg-white p-4 rounded-xl border"><p className="text-xs text-gray-500">Total TTC</p><p className="text-lg font-bold">{formatMad(data.totals.ttc)}</p></div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr><th className="p-3">Date</th><th className="p-3">Facture</th><th className="p-3 text-right">HT</th><th className="p-3 text-right">TVA</th><th className="p-3 text-right">TTC</th></tr>
          </thead>
          <tbody>
            {data.sales.map((s: any) => (
              <tr key={s.id} className="border-t">
                <td className="p-3 text-xs">{new Date(s.saleDate).toLocaleDateString('fr-MA')}</td>
                <td className="p-3 font-mono text-xs">{s.invoiceNo}</td>
                <td className="p-3 text-right">{formatMad(s.subtotalHt)}</td>
                <td className="p-3 text-right">{formatMad(s.vatTotal)}</td>
                <td className="p-3 text-right font-semibold">{formatMad(s.totalTtc)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}