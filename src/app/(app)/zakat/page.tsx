'use client';
import { useEffect, useState } from 'react';
import { formatMad } from '@/lib/utils';

export default function ZakatPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/zakat').then(r => r.json()).then(setData);
  }, []);

  if (!data) return <div className="p-6">Chargement...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Calcul de la Zakat</h1>
        <p className="text-sm text-gray-500 mt-2">
          Calcul basé sur la valeur marchande du stock, la caisse et les créances (Fatwa CSO 2025).
        </p>
      </div>

      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <h2 className="font-semibold text-lg mb-4 border-b pb-2">1. Patrimoine soumis à la Zakat</h2>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center py-1">
            <span className="text-gray-600">Valeur du stock (Prix de vente HT)</span>
            <span className="font-medium">{formatMad(data.stockValue)}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-gray-600">Liquidités en caisse</span>
            <span className="font-medium">{formatMad(data.cashValue)}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-gray-600">Créances clients (recouvrables)</span>
            <span className="font-medium">{formatMad(data.receivables)}</span>
          </div>
          <div className="flex justify-between items-center py-1 text-red-600">
            <span>Dettes fournisseurs (déductibles)</span>
            <span>- {formatMad(data.payables)}</span>
          </div>
          
          <div className="flex justify-between items-center py-3 border-t mt-2 font-bold text-lg">
            <span>Patrimoine Net</span>
            <span className="text-blue-900">{formatMad(data.netWealth)}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <h2 className="font-semibold text-lg mb-4 border-b pb-2">2. Résultat</h2>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Seuil du Nisab (Argent)</span>
            <span className="font-medium">{formatMad(data.nisabValue)}</span>
          </div>
          
          <div className={`p-4 rounded-lg flex items-center justify-between ${data.isSubject ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
            <div>
              <p className={`font-bold ${data.isSubject ? 'text-amber-800' : 'text-green-800'}`}>
                {data.isSubject ? 'Zakat Due' : 'Zakat Non Due'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {data.isSubject ? 'Votre patrimoine dépasse le Nisab.' : 'Votre patrimoine est inférieur au Nisab.'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Taux : 2,5 %</p>
              <p className={`text-2xl font-bold ${data.isSubject ? 'text-amber-700' : 'text-green-700'}`}>
                {formatMad(data.zakatDue)}
              </p>
            </div>
          </div>
          
          <p className="text-xs text-gray-400 text-center pt-4">
            ⚠️ Ce calcul est une estimation. Pour une validation finale, veuillez consulter un expert religieux.
          </p>
        </div>
      </div>
    </div>
  );
}