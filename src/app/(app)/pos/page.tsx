'use client';
import { useEffect, useState } from 'react';
import { formatMad } from '@/lib/utils';
import CameraScanner from '@/components/CameraScanner';

type Article = { id: string; reference: string; name: string; barcode: string | null; salePriceHt: number; vatRate: number; stockQty: number; };
type CartItem = Article & { quantity: number };

export default function PosPage() {
  const [paymentMethod, setPaymentMethod] = useState('cash'); 
  const [paymentMethod, setPaymentMethod] = useState('card'); 
  const [paymentMethod, setPaymentMethod] = useState('bank');  
  const [articles, setArticles] = useState<Article[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [clientId, setClientId] = useState('');
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showCamera, setShowCamera] = useState(false);

  function loadArticles() {
    fetch('/api/articles')
      .then(res => res.ok ? res.json() : [])
      .then(data => setArticles(Array.isArray(data) ? data : []))
      .catch(() => setArticles([]));
  }

  useEffect(() => {
    loadArticles();
    fetch('/api/clients')
      .then(res => res.ok ? res.json() : [])
      .then(data => setClients(Array.isArray(data) ? data : []))
      .catch(() => setClients([]));
  }, []);

  const filteredArticles = search && Array.isArray(articles) 
    ? articles.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.reference.includes(search)) 
    : [];

  function addToCart(article: Article) {
    setCart(prev => {
      const exists = prev.find(item => item.id === article.id);
      if (exists) return prev.map(item => item.id === article.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...article, quantity: 1 }];
    });
    setSearch('');
  }

  function handleScan(code: string) {
    const exactMatch = articles.find(a => a.barcode === code || a.reference === code);
    if (exactMatch) {
      addToCart(exactMatch);
    } else {
      alert("Code-barres " + code + " non reconnu !");
    }
  }

  function updateQty(id: string, qty: number) {
    if (qty <= 0) return setCart(prev => prev.filter(item => item.id !== id));
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: qty } : item));
  }

  const totalHt = cart.reduce((sum, item) => sum + (item.salePriceHt * item.quantity), 0);
  const totalVat = cart.reduce((sum, item) => sum + ((item.salePriceHt * (item.vatRate / 100)) * item.quantity), 0);
  const totalTtc = totalHt + totalVat;

  // NOUVEAU : Calcul de la monnaie à rendre
  const numericPaid = paidAmount === '' ? totalTtc : Number(paidAmount);
  const changeToReturn = numericPaid > totalTtc ? numericPaid - totalTtc : 0;

  async function handleCheckout() {
    if (cart.length === 0 || loading) return;
    
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

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
          paidAmount: numericPaid,
          paymentMethod: paymentMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur inconnue');
      }
      
      setCart([]);
      setClientId('');
      setPaidAmount('');
      loadArticles(); 
      setSuccessMessage(`✅ Vente enregistrée ! ${changeToReturn > 0 ? `Monnaie à rendre : ${formatMad(changeToReturn)}` : ''}`);
      setTimeout(() => setSuccessMessage(''), 5000);

    } catch (e: any) {
      setErrorMessage(`❌ ${e.message}`);
      setTimeout(() => setErrorMessage(''), 6000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] md:h-screen bg-gray-100">
      {showCamera && (
        <CameraScanner 
          onScan={(code) => { setShowCamera(false); handleScan(code); }} 
          onClose={() => setShowCamera(false)} 
        />
      )}

      <div className="flex-1 p-4 md:p-6 flex flex-col overflow-hidden relative">
        <h1 className="text-xl md:text-2xl font-bold mb-4">Point de Vente</h1>
        
        {successMessage && <div className="bg-green-100 text-green-800 p-3 rounded-lg mb-4 text-sm font-medium">{successMessage}</div>}
        {errorMessage && <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-4 text-sm font-medium">{errorMessage}</div>}

        <div className="relative mb-6 flex gap-2 z-20">
          <input
            type="text" 
            placeholder="Scanner ou rechercher un article..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (search) handleScan(search);
              }
            }}
            className="flex-1 border-2 border-gray-300 rounded-xl px-4 py-3 text-lg focus:border-blue-500 outline-none bg-white"
          />
          <button 
            onClick={() => setShowCamera(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 rounded-xl text-2xl shadow transition-colors"
          >
            📷
          </button>
        </div>

        {filteredArticles.length > 0 && !search.includes(' ') && (
          <div className="absolute top-32 left-4 right-4 md:left-6 md:right-[400px] bg-white border rounded-xl shadow-lg z-10 max-h-64 overflow-y-auto">
            {filteredArticles.map(a => (
              <button key={a.id} onClick={() => addToCart(a)} className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b flex justify-between items-center">
                <div>
                  <div className="font-bold">{a.name}</div>
                  <div className="text-xs text-gray-500">{a.reference} | Stock: {a.stockQty}</div>
                </div>
                <div className="font-semibold text-blue-700">{formatMad(a.salePriceHt)}</div>
              </button>
            ))}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border flex-1 flex flex-col overflow-hidden">
          <div className="p-3 md:p-4 bg-gray-50 border-b font-semibold grid grid-cols-12 gap-2 text-xs md:text-sm">
            <div className="col-span-6">Article</div>
            <div className="col-span-2 text-center">Qté</div>
            <div className="col-span-4 text-right">Total HT</div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {cart.map(item => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-center p-2 border-b last:border-0 hover:bg-gray-50">
                <div className="col-span-6">
                  <p className="font-medium text-sm">{item.name}</p>
                </div>
                <div className="col-span-2 flex justify-center">
                  <input type="number" value={item.quantity} onChange={(e) => updateQty(item.id, Number(e.target.value))} className="w-14 md:w-16 border rounded text-center py-1 text-sm" min="1" />
                </div>
                <div className="col-span-4 text-right font-semibold text-sm">{formatMad(item.salePriceHt * item.quantity)}</div>
              </div>
            ))}
            {cart.length === 0 && <div className="text-center text-gray-400 py-10 text-sm">Le panier est vide</div>}
          </div>
        </div>
      </div>

      <div className="w-full md:w-96 bg-white border-t md:border-t-0 md:border-l shadow-lg p-4 md:p-6 flex flex-col z-10">
        <h2 className="text-lg md:text-xl font-bold mb-4 border-b pb-4">Résumé</h2>
        
        <div className="space-y-2 mb-4 flex-1 text-sm">
          <div className="flex justify-between text-gray-600"><span>Total HT</span><span>{formatMad(totalHt)}</span></div>
          <div className="flex justify-between text-gray-600"><span>TVA</span><span>{formatMad(totalVat)}</span></div>
          <div className="flex justify-between text-2xl font-bold text-blue-900 pt-3 border-t"><span>Total TTC</span><span>{formatMad(totalTtc)}</span></div>
        </div>

        <div className="space-y-3 mb-4">
          <select value={clientId} onChange={e => setClientId(e.target.value)} className="w-full border p-3 rounded-lg text-sm bg-gray-50">
            <option value="">Client de passage</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          
          <div>
            <input 
              type="number" 
              placeholder={`Payé (défaut: ${formatMad(totalTtc)})`} 
              value={paidAmount} 
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Mode de paiement</label>
            <select 
              value={paymentMethod} 
              onChange={e => setPaymentMethod(e.target.value)} 
              className="w-full border p-3 rounded-lg text-sm bg-gray-50 font-medium"
            >
              <option value="cash">💵 Espèces</option>
              <option value="card">💳 Carte Bancaire (TPE)</option>
              <option value="bank">🏦 Virement</option>
            </select>
          </div>
              onChange={e => setPaidAmount(e.target.value === '' ? '' : Number(e.target.value))} 
              className="w-full border p-3 rounded-lg text-sm" 
            />
            {/* NOUVEAU : Affichage de la monnaie à rendre */}
            {changeToReturn > 0 && (
              <div className="mt-2 text-right text-sm font-bold text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200">
                💰 Monnaie à rendre : {formatMad(changeToReturn)}
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={handleCheckout} 
          disabled={cart.length === 0 || loading} 
          className={`w-full text-white text-lg font-bold py-4 rounded-xl transition-colors ${loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {loading ? 'Traitement...' : 'VALIDER LA VENTE'}
        </button>
      </div>
    </div>
  );
}