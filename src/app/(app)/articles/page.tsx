'use client';
import { useEffect, useState } from 'react';

type Article = {
  id: string;
  reference: string;
  name: string;
  salePriceHt: number;
  vatRate: number;
  stockQty: number;
};

function formatMad(value: number): string {
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(value);
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Formulaire
  const [form, setForm] = useState({
    reference: '', name: '', salePriceHt: '', vatRate: '20', stockQty: ''
  });
  const [error, setError] = useState('');

  function loadArticles() {
    setLoading(true);
    fetch('/api/articles')
      .then(res => res.json())
      .then(data => { setArticles(data); setLoading(false); });
  }

  useEffect(() => {
    loadArticles();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      return;
    }

    // Réinitialiser et recharger
    setForm({ reference: '', name: '', salePriceHt: '', vatRate: '20', stockQty: '' });
    setShowForm(false);
    loadArticles();
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Catalogue d'Articles</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium"
        >
          {showForm ? 'Annuler' : '+ Nouvel article'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Ajouter un article</h2>
          {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Référence *</label>
              <input required value={form.reference} onChange={e => setForm({...form, reference: e.target.value})} className="w-full border rounded px-3 py-2" placeholder="EX: EP-001" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Désignation *</label>
              <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border rounded px-3 py-2" placeholder="Huile de table 5L" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Prix de vente HT (MAD)</label>
              <input type="number" step="0.01" required value={form.salePriceHt} onChange={e => setForm({...form, salePriceHt: e.target.value})} className="w-full border rounded px-3 py-2" placeholder="65.00" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">TVA (%)</label>
              <select value={form.vatRate} onChange={e => setForm({...form, vatRate: e.target.value})} className="w-full border rounded px-3 py-2">
                <option value="20">20 %</option>
                <option value="10">10 %</option>
                <option value="7">7 %</option>
                <option value="0">0 % (Exonéré)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stock initial</label>
              <input type="number" step="1" required value={form.stockQty} onChange={e => setForm({...form, stockQty: e.target.value})} className="w-full border rounded px-3 py-2" placeholder="40" />
            </div>
            <div className="md:col-span-2 flex justify-end mt-2">
              <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium">
                Enregistrer l'article
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Référence</th>
              <th className="p-3">Désignation</th>
              <th className="p-3 text-right">Prix HT</th>
              <th className="p-3 text-right">TVA</th>
              <th className="p-3 text-right">Stock</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-6 text-center text-gray-500">Chargement...</td></tr>
            ) : articles.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-gray-500">Aucun article dans le catalogue</td></tr>
            ) : (
              articles.map(a => (
                <tr key={a.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs">{a.reference}</td>
                  <td className="p-3 font-medium">{a.name}</td>
                  <td className="p-3 text-right">{formatMad(a.salePriceHt)}</td>
                  <td className="p-3 text-right text-gray-500">{a.vatRate}%</td>
                  <td className="p-3 text-right font-semibold">
                    <span className={a.stockQty > 0 ? 'text-green-700' : 'text-red-700'}>
                      {a.stockQty}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}