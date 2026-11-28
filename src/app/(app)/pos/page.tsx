'use client';
import { useEffect, useState } from 'react';
import { formatMad } from '@/lib/utils';
import CameraScanner from '@/components/CameraScanner';
import { dictionaries, Language } from '@/lib/dictionaries';

type Article = { id: string; reference: string; name: string; barcode: string | null; salePriceHt: number; vatRate: number; stockQty: number; imageUrl: string | null; };
type CartItem = Article & { quantity: number };

export default function PosPage() {
  const [lang, setLang] = useState<Language>('fr');
  const [articles, setArticles] = useState<Article[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [clientId, setClientId] = useState('');
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    const cookieLang = document.cookie.split('; ').find(row => row.startsWith('lang='))?.split('=')[1];
    setLang((cookieLang as Language) || 'fr');

    loadArticles();
    fetch('/api/clients')
      .then(res => res.ok ? res.json() : [])
      .then(data => setClients(Array.isArray(data) ? data : []))
      .catch(() => setClients([]));
  }, []);

  const t = dictionaries[lang];

  function loadArticles() {
    fetch('/api/articles')
      .then(res => res.ok ? res.json() : [])
      .then(data => setArticles(Array.isArray(data) ? data : []))
      .catch(() => setArticles([]));
  }

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
      alert(lang === 'ar' ? "الرمز الشريطي " + code + " غير معروف!" : "Code-barres " + code + " non reconnu !");
    }
  }

  function updateQty(id: string, qty: number) {
    if (qty <= 0) return setCart(prev => prev.filter(item => item.id !== id));
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: qty } : item));
  }

  const totalHt = cart.reduce((sum, item) => sum + (item.salePriceHt * item.quantity), 0);
  const totalVat = cart.reduce((sum, item) => sum + ((item.salePriceHt * (item.vatRate / 100)) * item.quantity), 0);
  const totalTtc = totalHt + totalVat;
  const numericPaid = paidAmount === '' ? totalTtc : Number(paidAmount);
  const changeToReturn = numericPaid > totalTtc ? numericPaid - totalTtc : 0;

  async function handleCheckout() {
    if (cart.length === 0 || loading) return;
    setLoading(true); setSuccessMessage(''); setErrorMessage('');

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({
            articleId: item.id, quantity: item.quantity, salePriceHt: item.salePriceHt, vatRate: item.vatRate,
            lineTotalHt: item.salePriceHt * item.quantity, lineTotalTtc: (item.salePriceHt * (1 + item.vatRate / 100)) * item.quantity
          })),
          totalHt, totalVat, totalTtc, clientId: clientId || null, paidAmount: numericPaid, paymentMethod: paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur inconnue');
      
      setCart([]); setClientId(''); setPaidAmount(''); loadArticles(); 
      const changeMsg = changeToReturn > 0 ? ` - ${lang === 'ar' ? 'الباقي' : 'Monnaie'} : ${formatMad(changeToReturn)}` : '';
      setSuccessMessage(lang === 'ar' ? `✅ تم تسجيل البيع بنجاح! ${changeMsg}` : `✅ Vente enregistrée ! ${changeMsg}`);
      setTimeout(() => setSuccessMessage(''), 5000);

    } catch (e: any) {
      setErrorMessage(`❌ ${e.message}`);
      setTimeout(() => setErrorMessage(''), 6000);
    } finally { setLoading(false); }
  }

  return (
    <div className="flex flex-col xl:flex-row gap-3 bg-slate-100 rounded-xl min-w-0">
      {showCamera && <CameraScanner onScan={(code) => { setShowCamera(false); handleScan(code); }} onClose={() => setShowCamera(false)} />}

      <div className="flex-1 min-w-0 p-3 sm:p-4 flex flex-col relative">
        <h1 className="text-xl md:text-2xl font-bold mb-4">{lang === 'ar' ? 'نقطة البيع' : 'Point de Vente'}</h1>
        
        {successMessage && <div className="bg-green-100 text-green-800 p-3 rounded-lg mb-4 text-sm font-medium">{successMessage}</div>}
        {errorMessage && <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-4 text-sm font-medium">{errorMessage}</div>}

        <div className="relative mb-6 flex gap-2 z-20">
          <input
            type="text" placeholder={lang === 'ar' ? "امسح أو ابحث عن منتج..." : "Scanner ou rechercher un article..."}
            value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (search) handleScan(search); } }}
            className="flex-1 min-w-0 border-2 border-gray-300 rounded-xl px-4 py-3 text-lg focus:border-blue-500 outline-none bg-white text-gray-900"
          />
          <button onClick={() => setShowCamera(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 rounded-xl text-2xl shadow transition-colors">📷</button>
        </div>

        {/* Résultats de recherche avec Image */}
        {filteredArticles.length > 0 && !search.includes(' ') && (
          <div className="relative -mt-4 mb-3 bg-white border rounded-xl shadow-lg z-20 max-h-80 overflow-y-auto">
            {filteredArticles.map(a => (
              <button key={a.id} onClick={() => addToCart(a)} className="w-full text-left rtl:text-right px-4 py-3 hover:bg-blue-50 border-b flex justify-between items-center gap-3">
                <div className="flex items-center gap-3">
                  {a.imageUrl ? (
                    <img src={a.imageUrl} alt={a.name} className="w-10 h-10 object-cover rounded border shadow-sm" />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded border flex items-center justify-center text-gray-400 text-xs">N/A</div>
                  )}
                  <div>
                    <div className="font-bold text-gray-900">{a.name}</div>
                    <div className="text-xs text-gray-500">{a.reference} | {lang === 'ar' ? 'المخزون' : 'Stock'}: {a.stockQty}</div>
                  </div>
                </div>
                <div className="font-semibold text-blue-700">{formatMad(a.salePriceHt)}</div>
              </button>
            ))}
          </div>
        )}

        <div className="store-table-scroll store-cart bg-white rounded-xl shadow-sm border flex-1 flex flex-col overflow-x-auto" role="region" aria-label={lang === 'ar' ? 'سلة المشتريات' : 'Panier des articles'} tabIndex={0}>
          <div className="store-cart-head p-3 md:p-4 font-semibold grid grid-cols-12 gap-2 min-w-[310px] text-xs md:text-sm">
            <div className="col-span-6">{lang === 'ar' ? 'المنتج' : 'Article'}</div>
            <div className="col-span-2 text-center">{lang === 'ar' ? 'الكمية' : 'Qté'}</div>
            <div className="col-span-4 text-end">{lang === 'ar' ? 'المجموع' : 'Total HT'}</div>
          </div>
          
          <div className="store-cart-body flex-1 min-w-[310px] max-h-[60dvh] overflow-y-auto">
            {cart.map(item => (
              <div key={item.id} className="store-cart-row grid grid-cols-12 gap-2 items-center p-3 text-gray-900">
                <div className="col-span-6 min-w-0 flex items-center gap-2">
                  {/* Image dans le panier */}
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-8 h-8 object-cover rounded" />
                  ) : (
                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-[10px]">N/A</div>
                  )}
                  <p className="font-medium text-sm break-words min-w-0">{item.name}</p>
                </div>
                <div className="col-span-2 flex justify-center">
                  <input type="number" value={item.quantity} onChange={(e) => updateQty(item.id, Number(e.target.value))} className="w-full max-w-16 border rounded text-center py-1 text-sm" min="1" />
                </div>
                <div className="col-span-4 text-end font-semibold text-sm">{formatMad(item.salePriceHt * item.quantity)}</div>
              </div>
            ))}
            {cart.length === 0 && <div className="text-center text-gray-400 py-10 text-sm">{lang === 'ar' ? 'سلة المشتريات فارغة' : 'Le panier est vide'}</div>}
          </div>
        </div>
      </div>

      <div className="w-full xl:w-80 2xl:w-96 shrink-0 bg-white border rounded-xl shadow-sm p-3 sm:p-4 flex flex-col z-10">
        <h2 className="text-lg md:text-xl font-bold mb-4 border-b pb-4 text-gray-900">{lang === 'ar' ? 'الملخص' : 'Résumé'}</h2>
        
        <div className="space-y-2 mb-4 flex-1 text-sm">
          <div className="flex justify-between text-gray-600"><span>{lang === 'ar' ? 'المجموع بدون ضريبة' : 'Total HT'}</span><span>{formatMad(totalHt)}</span></div>
          <div className="flex justify-between text-gray-600"><span>{lang === 'ar' ? 'الضريبة' : 'TVA'}</span><span>{formatMad(totalVat)}</span></div>
          <div className="flex flex-wrap gap-2 justify-between text-xl font-bold text-blue-900 pt-3 border-t"><span>{lang === 'ar' ? 'المجموع مع الضريبة' : 'Total TTC'}</span><span>{formatMad(totalTtc)}</span></div>
        </div>

        <div className="space-y-3 mb-4">
          <select value={clientId} onChange={e => setClientId(e.target.value)} className="w-full border p-3 rounded-lg text-sm bg-gray-50 text-gray-900">
            <option value="">{lang === 'ar' ? 'عميل عابر' : 'Client de passage'}</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          
          <div>
            <input 
              type="number" placeholder={lang === 'ar' ? 'المبلغ المدفوع' : `Payé (défaut: ${formatMad(totalTtc)})`}
              value={paidAmount} onChange={e => setPaidAmount(e.target.value === '' ? '' : Number(e.target.value))} 
              className="w-full border p-3 rounded-lg text-sm text-gray-900" 
            />
            {changeToReturn > 0 && (
              <div className="mt-2 text-end text-sm font-bold text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200">
                💰 {lang === 'ar' ? 'الباقي للإرجاع' : 'Monnaie à rendre'} : {formatMad(changeToReturn)}
              </div>
            )}
          </div>

          <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full border p-3 rounded-lg text-sm bg-gray-50 font-medium text-gray-900">
            <option value="cash">💵 {lang === 'ar' ? 'نقدا' : 'Espèces'}</option>
            <option value="card">💳 {lang === 'ar' ? 'بطاقة بنكية' : 'Carte Bancaire (TPE)'}</option>
            <option value="bank">🏦 {lang === 'ar' ? 'تحويل بنكي' : 'Virement'}</option>
          </select>
        </div>

        <button 
          onClick={handleCheckout} disabled={cart.length === 0 || loading} 
          className={`w-full text-white text-lg font-bold py-4 rounded-xl transition-colors ${loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {loading ? (lang === 'ar' ? 'جاري المعالجة...' : 'Traitement...') : (lang === 'ar' ? 'تأكيد البيع' : 'VALIDER LA VENTE')}
        </button>
      </div>
    </div>
  );
}