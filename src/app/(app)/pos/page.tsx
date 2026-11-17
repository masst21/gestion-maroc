'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatMad } from '@/lib/utils';

type Article = { id: string; reference: string; name: string; salePriceHt: number; vatRate: number; stockQty: number; };
type CartItem = Article & { quantity: number };

export default function PosPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [clientId, setClientId] = useState('');
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/articles').then(res => res.json()).then(setArticles);
    fetch('/api/clients').then(res => res.json()).then(setClients);
  }, []);

  const filteredArticles = search ? articles.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.reference.includes(search)) : [];

  function addToCart(article: Article) {
    setCart(prev => {
      const exists = prev.find(item => item.id === article.id);
      if (exists) return prev.map(item => item.id === article.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...article, quantity: 1 }];
    });
    setSearch('');
  }

  function updateQty(id: string, qty: number) {
    if (qty <= 0) return setCart(prev => prev.filter(item => item.id !== id));
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: qty } : item));
  }

  const totalHt = cart.reduce((sum, item) => sum + (item.salePriceHt * item.quantity), 0);
  const totalVat = cart.reduce((sum, item) => sum + ((item.salePriceHt * (item.vatRate / 100)) * item.quantity), 0);
  const totalTtc = totalHt + totalVat;

  async function handleCheckout() {
    if (cart.length === 0) return;
    setLoading(true);
    
    const finalPaid = paidAmount === '' ? totalTtc : Number(paidAmount);

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({
            articleId: item.id,
            quantity: item.quantity,
            salePriceHt: item.salePriceHt,
            vatRate: item.vatRate,
            lineTotalHt: item.salePriceHt * item.quantity,
            lineTotalTtc: (item.salePriceHt * (1 + item.vatRate / 100)) * item.quantity
          })),
          totalHt, totalVat, totalTtc,
          clientId: clientId || null,
          paidAmount: finalPaid,
        }),
      });

      if (!res.ok) throw new Error('Erreur');
      
      alert('Vente enregistrée !');
      setCart([]);
      setClientId('');
      setPaidAmount('');
      router.push('/sales');
      router.refresh();
    } catch (e) {
      alert('Erreur lors de la validation');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-4">Point de Vente</h1>
        
        <div className="relative mb-6">
          <input
            type="text" placeholder="Rechercher un article..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-lg focus:border-blue-500 outline-none"
          />
          {filteredArticles.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border rounded-xl mt-1 shadow-lg z-10 max-h-64 overflow-y-auto">
              {filteredArticles.map(a => (
                <button key={a.id} onClick={() => addToCart(a)} className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b flex justify-between items-center">
                  <div>
                    <div className="font-bold">{a.name}</div>
                    <div className="text-xs text-gray-500">{a.reference} - Stock: {a.stockQty}</div>
                  </div>
                  <div className="font-semibold text-blue-700">{formatMad(a.salePriceHt)}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border flex-1 flex flex-col overflow-hidden">
          <div className="p-4 bg-gray-50 border-b font-semibold grid grid-cols-12 gap-2 text-sm">
            <div className="col-span-5">Article</div>
            <div className="col-span-2 text-center">Qté</div>
            <div className="col-span-2 text-right">Prix HT</div>
            <div className="col-span-3 text-right">Total</div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {cart.map(item => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-center p-2 border-b last:border-0">
                <div className="col-span-5"><p className="font-medium">{item.name}</p></div>
                <div className="col-span-2 flex justify-center">
                  <input type="number" value={item.quantity} onChange={(e) => updateQty(item.id, Number(e.target.value))} className="w-16 border rounded text-center py-1" min="1" />
                </div>
                <div className="col-span-2 text-right text-gray-600">{formatMad(item.salePriceHt)}</div>
                <div className="col-span-3 text-right font-semibold">{formatMad(item.salePriceHt * item.quantity)}</div>
              </div>
            ))}
            {cart.length === 0 && <div className="text-center text-gray-400 py-10">Le panier est vide</div>}
          </div>
        </div>
      </div>

      <div className="w-96 bg-white border-l shadow-lg p-6 flex flex-col">
        <h2 className="text-xl font-bold mb-6 border-b pb-4">Résumé</h2>
        
        <div className="space-y-3 mb-6 flex-1">
          <div className="flex justify-between text-gray-600"><span>Total HT</span><span>{formatMad(totalHt)}</span></div>
          <div className="flex justify-between text-gray-600"><span>TVA</span><span>{formatMad(totalVat)}</span></div>
          <div className="flex justify-between text-2xl font-bold text-blue-900 pt-3 border-t"><span>Total TTC</span><span>{formatMad(totalTtc)}</span></div>
        </div>

        <div className="space-y-3 mb-4">
          <select value={clientId} onChange={e => setClientId(e.target.value)} className="w-full border p-2 rounded-lg text-sm">
            <option value="">Client de passage</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          
          <input 
            type="number" 
            placeholder={`Montant payé (défaut: ${formatMad(totalTtc)})`} 
            value={paidAmount} 
            onChange={e => setPaidAmount(e.target.value === '' ? '' : Number(e.target.value))} 
            className="w-full border p-2 rounded-lg text-sm" 
          />
        </div>

        <button onClick={handleCheckout} disabled={cart.length === 0 || loading} className="w-full bg-green-600 hover:bg-green-700 text-white text-lg font-bold py-4 rounded-xl disabled:bg-gray-300">
          {loading ? 'Traitement...' : 'VALIDER LA VENTE'}
        </button>
      </div>
    </div>
  );
}