'use client';
import { useEffect, useState } from 'react';
import { formatMad } from '@/lib/utils';

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [selectedSale, setSelectedSale] = useState<any>(null);

  useEffect(() => {
    fetch('/api/sales').then(r => r.json()).then(setSales);
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Historique des Ventes</h1>
      
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">N° Facture</th>
              <th className="p-3">Date</th>
              <th className="p-3">Client</th>
              <th className="p-3 text-right">Total TTC</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-mono text-xs">{sale.invoiceNo}</td>
                <td className="p-3 text-xs">{new Date(sale.saleDate).toLocaleString('fr-MA')}</td>
                <td className="p-3">{sale.client?.name || 'Client de passage'}</td>
                <td className="p-3 text-right font-semibold">{formatMad(sale.totalTtc)}</td>
                <td className="p-3">
                  <button onClick={() => setSelectedSale(sale)} className="text-blue-700 hover:underline text-xs font-medium">
                    Voir le ticket
                  </button>
                </td>
              </tr>
            ))}
            {sales.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-gray-500">Aucune vente enregistrée</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Modal Ticket */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <div className="text-center mb-4">
              <h2 className="font-bold text-lg">TICKET DE CAISSE</h2>
              <p className="text-xs text-gray-500">{selectedSale.invoiceNo}</p>
              <p className="text-xs text-gray-500">{new Date(selectedSale.saleDate).toLocaleString('fr-MA')}</p>
            </div>
            
            <div className="border-t border-b py-2 my-2 space-y-1">
              {selectedSale.items.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.article?.name || 'Article supprimé'}</span>
                  <span>{formatMad(item.lineTotalTtc)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Total HT</span><span>{formatMad(selectedSale.subtotalHt)}</span></div>
              <div className="flex justify-between"><span>TVA</span><span>{formatMad(selectedSale.vatTotal)}</span></div>
              <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t"><span>Total TTC</span><span>{formatMad(selectedSale.totalTtc)}</span></div>
            </div>

            <div className="mt-6 flex gap-2">
              <button onClick={() => window.print()} className="flex-1 bg-blue-700 text-white py-2 rounded-lg text-sm">🖨️ Imprimer</button>
              <button onClick={() => setSelectedSale(null)} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg text-sm">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}