'use client';
import { useEffect, useState } from 'react';
import { formatMad } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';

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
              <th className="p-3">Paiement</th>
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
                <td className="p-3 text-xs">
                  <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                    {sale.paymentMethod === 'card' ? '💳 TPE' : sale.paymentMethod === 'bank' ? '🏦 Virement' : '💵 Espèces'}
                  </span>
                </td>
                <td className="p-3 text-right font-semibold">{formatMad(sale.totalTtc)}</td>
                <td className="p-3">
                  <button onClick={() => setSelectedSale(sale)} className="text-blue-700 hover:underline text-xs font-medium">
                    Voir le ticket
                  </button>
                </td>
              </tr>
            ))}
            {sales.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-gray-500">Aucune vente enregistrée</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Modal Ticket de Caisse */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 print:bg-white print:p-0 print:block">
          
          {/* Le Ticket avec styles d'impression (80mm) */}
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl print:shadow-none print:rounded-none print:w-[80mm] print:p-2 print:mx-auto print:mt-4">
            
            {/* En-tête du Ticket */}
            <div className="text-center mb-4">
              <h2 className="font-bold text-lg">MON MAGASIN</h2>
              <p className="text-xs text-gray-600">Votre partenaire de confiance</p>
              <p className="text-xs text-gray-600">Tél : 05 22 00 00 00</p>
              <div className="border-b border-gray-300 my-2"></div>
              <p className="text-xs font-semibold">Ticket N° : {selectedSale.invoiceNo}</p>
              <p className="text-xs text-gray-500">{new Date(selectedSale.saleDate).toLocaleString('fr-MA')}</p>
            </div>
            
            {/* Détail des Articles (Nom, Ref, Prix) */}
            <div className="border-t border-b border-gray-300 py-2 my-2 space-y-2">
              {selectedSale.items.map((item: any) => (
                <div key={item.id} className="text-xs">
                  <div className="flex justify-between font-semibold">
                    <span>{item.article?.name || 'Article supprimé'}</span>
                    <span>{formatMad(item.lineTotalTtc)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 mt-0.5">
                    <span>Réf: {item.article?.reference || 'N/A'} | Qté: {item.quantity}</span>
                    <span>PU: {formatMad(item.unitPriceHt * (1 + item.vatRate / 100))}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totaux */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-600 text-xs"><span>Total HT</span><span>{formatMad(selectedSale.subtotalHt)}</span></div>
              <div className="flex justify-between text-gray-600 text-xs"><span>TVA</span><span>{formatMad(selectedSale.vatTotal)}</span></div>
              <div className="flex justify-between font-bold text-lg mt-1 pt-1 border-t border-gray-300">
                <span>Total TTC</span>
                <span>{formatMad(selectedSale.totalTtc)}</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span>Mode : {selectedSale.paymentMethod === 'card' ? 'TPE' : selectedSale.paymentMethod === 'bank' ? 'Virement' : 'Espèces'}</span>
              </div>
            </div>

            {/* QR Code et Message de fin */}
            <div className="text-center mt-6 flex flex-col items-center justify-center">
              <QRCodeSVG 
                value={`Facture: ${selectedSale.invoiceNo} | Total: ${selectedSale.totalTtc} MAD | Date: ${new Date(selectedSale.saleDate).toLocaleDateString('fr-MA')}`} 
                size={80} 
              />
              <p className="text-[10px] text-gray-500 mt-2">Scannez pour vérifier le ticket</p>
              <p className="text-xs font-medium text-gray-700 mt-4">Merci de votre visite !</p>
            </div>

            {/* Boutons masqués à l'impression */}
            <div className="mt-6 flex gap-2 print:hidden">
              <button onClick={() => window.print()} className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                🖨️ Imprimer
              </button>
              <button onClick={() => setSelectedSale(null)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg text-sm font-medium transition-colors">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}