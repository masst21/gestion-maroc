'use client';
import { useEffect, useState } from 'react';

type Article = {
  id: string; reference: string; name: string;
  salePriceHt: number; vatRate: number; stockQty: number;
};

function formatMad(value: number): string {
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(value);
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [importing, setImporting] = useState(false);
  
  const [form, setForm] = useState({ reference: '', name: '', salePriceHt: '', vatRate: '20', stockQty: '' });
  const [error, setError] = useState('');

  function loadArticles() {
    setLoading(true);
    fetch('/api/articles').then(res => res.json()).then(data => { setArticles(data); setLoading(false); });
  }
  useEffect(() => { loadArticles(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('');
    const res = await fetch('/api/articles', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); return; }
    setForm({ reference: '', name: '', salePriceHt: '', vatRate: '20', stockQty: '' });
    setShowForm(false); loadArticles();
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/articles/import', { method: 'POST', body: formData });
    const data = await res.json();

    if (res.ok) {
      alert(`✅ Importation réussie !\n${data.imported} articles traités.\n${data.errors} erreurs.`);
      loadArticles();
    } else {
      alert('Erreur lors de l\'importation');
    }
    setImporting(false);
    e.target.value = ''; // Reset input
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Catalogue d'Articles</h1>
        <div className="flex gap-2">
          {/* Bouton Export */}
          <a href="/api/articles/export" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-sm">
            ⬇️ Exporter Excel
          </a>
          
          {/* Bouton Import */}
          <label className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-sm cursor-pointer">
            {importing ? 'Importation...' : '⬆️ Importer Excel'}
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImport} disabled={importing} />
          </label>

          <button onClick={() => setShowForm(!showForm)} className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium text-sm">
            {showForm ? 'Annuler' : '+ Nouvel article'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Ajouter un article</h2>
          {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm mb-1">Référence *</label><input required value={form.reference} onChange={e => setForm({...form, reference: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
            <div><label className="block text-sm mb-1">Désignation *</label><input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
            <div><label className="block text-sm mb-1">Prix de vente HT (MAD)</label><input type="number" step="0.01" required value={form.salePriceHt} onChange={e => setForm({...form, salePriceHt: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
            <div><label className="block text-sm mb-1">TVA (%)</label><select value={form.vatRate} onChange={e => setForm({...form, vatRate: e.target.value})} className="w-full border rounded px-3 py-2"><option value="20">20 %</option><option value="10">10 %</option><option value="7">7 %</option><option value="0">0 %</option></select></div>
            <div><label className="block text-sm mb-1">Stock initial</label><input type="number" required value={form.stockQty} onChange={e => setForm({...form, stockQty: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
            <div className="md:col-span-2 flex justify-end mt-2"><button type="submit" className="bg-blue-700 text-white px-6 py-2 rounded-lg">Enregistrer</button></div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr><th className="p-3">Référence</th><th className="p-3">Désignation</th><th className="p-3 text-right">Prix HT</th><th className="p-3 text-right">TVA</th><th className="p-3 text-right">Stock</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-6 text-center text-gray-500">Chargement...</td></tr>
            ) : articles.map(a => (
              <tr key={a.id} className="border-t hover:bg-gray-50 text-gray-900">
                <td className="p-3 font-mono text-xs text-gray-600">{a.reference}</td>
                <td className="p-3 font-medium">{a.name}</td>
                <td className="p-3 text-right">{formatMad(a.salePriceHt)}</td>
                <td className="p-3 text-right">{a.vatRate}%</td>
                <td className="p-3 text-right font-semibold"><span className={a.stockQty > 0 ? 'text-green-700' : 'text-red-700'}>{a.stockQty}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}