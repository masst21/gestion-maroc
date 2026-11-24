'use client';
import { useEffect, useState } from 'react';
import { formatMad } from '@/lib/utils';

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  
  const [clientId, setClientId] = useState('');
  const [items, setItems] = useState([{ description: '', quantity: 1, unitPriceHt: 0, vatRate: 20 }]);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);

  function load() {
    fetch('/api/quotes').then(r => r.json()).then(setQuotes);
    fetch('/api/clients').then(r => r.json()).then(setClients);
  }
  useEffect(() => { load(); }, []);

  const calculateTotals = () => {
    let total = 0;
    items.forEach(i => {
      const ht = i.quantity * i.unitPriceHt;
      total += ht * (1 + i.vatRate / 100);
    });
    return total;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formattedItems = items.map(i => {
      const lineTotalTtc = i.quantity * i.unitPriceHt * (1 + i.vatRate / 100);
      return { ...i, lineTotalTtc };
    });
    
    await fetch('/api/quotes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: clientId || null, items: formattedItems, totalTtc: calculateTotals() }),
    });
    setShowForm(false); setItems([{ description: '', quantity: 1, unitPriceHt: 0, vatRate: 20 }]); setClientId('');
    load();
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Devis</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm">
          {showForm ? 'Annuler' : '+ Nouveau Devis'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl border space-y-4">
          <select value={clientId} onChange={e => setClientId(e.target.value)} className="border p-2 rounded w-full max-w-sm">
            <option value="">Client de passage (optionnel)</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          
          {items.map((item, index) => (
            <div key={index} className="flex gap-2 items-end border-b pb-2">
              <div className="flex-1"><label className="text-xs">Description</label><input required value={item.description} onChange={e => { const newItems = [...items]; newItems[index].description = e.target.value; setItems(newItems); }} className="w-full border p-2 rounded" /></div>
              <div className="w-20"><label className="text-xs">Qté</label><input type="number" required value={item.quantity} onChange={e => { const newItems = [...items]; newItems[index].quantity = Number(e.target.value); setItems(newItems); }} className="w-full border p-2 rounded" /></div>
              <div className="w-32"><label className="text-xs">Prix HT</label><input type="number" required value={item.unitPriceHt} onChange={e => { const newItems = [...items]; newItems[index].unitPriceHt = Number(e.target.value); setItems(newItems); }} className="w-full border p-2 rounded" /></div>
              <div className="w-20"><label className="text-xs">TVA %</label><input type="number" value={item.vatRate} onChange={e => { const newItems = [...items]; newItems[index].vatRate = Number(e.target.value); setItems(newItems); }} className="w-full border p-2 rounded" /></div>
              <button type="button" onClick={() => setItems(items.filter((_, i) => i !== index))} className="text-red-500 p-2">✕</button>
            </div>
          ))}
          
          <div className="flex justify-between items-center">
            <button type="button" onClick={() => setItems([...items, { description: '', quantity: 1, unitPriceHt: 0, vatRate: 20 }])} className="text-blue-600 text-sm font-medium">+ Ajouter une ligne</button>
            <div className="text-lg font-bold">Total TTC : {formatMad(calculateTotals())}</div>
          </div>
          <button className="w-full bg-green-600 text-white py-2 rounded-lg">Enregistrer le Devis</button>
        </form>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr><th className="p-3">N° Devis</th><th className="p-3">Date</th><th className="p-3">Client</th><th className="p-3 text-right">Total TTC</th><th className="p-3">Action</th></tr>
          </thead>
          <tbody>
            {quotes.map(q => (
              <tr key={q.id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-mono text-xs">{q.quoteNo}</td>
                <td className="p-3 text-xs">{new Date(q.date).toLocaleDateString('fr-MA')}</td>
                <td className="p-3">{q.client?.name || 'Client de passage'}</td>
                <td className="p-3 text-right font-semibold">{formatMad(q.totalTtc)}</td>
                <td className="p-3"><button onClick={() => setSelectedQuote(q)} className="text-blue-700 text-xs font-medium hover:underline">Voir</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal d'impression du devis */}
      {selectedQuote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 print:bg-white print:p-0 print:block">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl print:shadow-none print:w-[80mm] print:p-2 print:mx-auto">
            <div className="text-center mb-4">
              <h2 className="font-bold text-lg">MON MAGASIN</h2>
              <p className="text-sm">DEVIS N° {selectedQuote.quoteNo}</p>
              <p className="text-xs text-gray-500">{new Date(selectedQuote.date).toLocaleDateString('fr-MA')}</p>
            </div>
            <div className="border-t border-b py-2 my-2 space-y-2">
              {selectedQuote.items.map((i: any) => (
                <div key={i.id} className="flex justify-between text-sm"><span>{i.quantity}x {i.description}</span><span>{formatMad(i.lineTotalTtc)}</span></div>
              ))}
            </div>
            <div className="text-right font-bold text-lg mt-2">Total : {formatMad(selectedQuote.totalTtc)}</div>
            <div className="mt-6 flex gap-2 print:hidden">
              <button onClick={() => window.print()} className="flex-1 bg-blue-700 text-white py-2 rounded-lg">🖨️ Imprimer</button>
              <button onClick={() => setSelectedQuote(null)} className="flex-1 bg-gray-200 py-2 rounded-lg">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}