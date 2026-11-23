'use client';
import { useEffect, useState } from 'react';
import { formatMad } from '@/lib/utils';

export default function PurchasesPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  
  const [form, setForm] = useState({ supplierId: '', articleId: '', quantity: 1, unitCost: 0 });
  const [newSupplier, setNewSupplier] = useState({ name: '', phone: '', ice: '' });
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);

  function loadData() {
    fetch('/api/suppliers').then(r => r.json()).then(setSuppliers);
    fetch('/api/articles').then(r => r.json()).then(setArticles);
    fetch('/api/purchases').then(r => r.json()).then(setPurchases);
  }

  useEffect(() => { loadData(); }, []);

  async function addSupplier(e: React.FormEvent) {
    e.preventDefault();
    if (!newSupplier.name) return;
    await fetch('/api/suppliers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newSupplier) });
    setNewSupplier({ name: '', phone: '', ice: '' });
    loadData();
  }

  async function handlePurchase(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.supplierId || !form.articleId) return setError('Sélectionnez un fournisseur et un article');
    
    const res = await fetch('/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supplierId: form.supplierId,
        items: [{ articleId: form.articleId, quantity: form.quantity, unitCost: form.unitCost }]
      }),
    });
    
    if (!res.ok) return setError('Erreur lors de l\'enregistrement');

    setForm({ ...form, articleId: '', quantity: 1, unitCost: 0 });
    loadData();
    alert('Achat enregistré, stock mis à jour !');
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/purchases/import', { method: 'POST', body: formData });
    const data = await res.json();

    if (res.ok) {
      alert(`✅ Importation réussie !\n${data.imported} lignes traitées.\n${data.errors} erreurs (article ou quantité invalide).`);
      loadData();
    } else {
      alert('Erreur lors de l\'importation');
    }
    setImporting(false);
    e.target.value = '';
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-bold">Gestion des Achats</h1>
        <div className="flex gap-2">
          <a href="/api/purchases/export" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-sm">
            ⬇️ Exporter Excel
          </a>
          <label className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-sm cursor-pointer">
            {importing ? 'Importation...' : '⬆️ Importer Excel'}
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImport} disabled={importing} />
          </label>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Formulaire Nouveau Fournisseur */}
        <div className="bg-white p-4 rounded-xl border">
          <h2 className="font-semibold mb-3">1. Ajouter un fournisseur</h2>
          <form onSubmit={addSupplier} className="flex flex-col gap-2">
            <input required placeholder="Nom du fournisseur" value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} className="border p-2 rounded" />
            <div className="flex gap-2">
              <input placeholder="Téléphone" value={newSupplier.phone} onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} className="border p-2 rounded flex-1" />
              <input placeholder="ICE" value={newSupplier.ice} onChange={e => setNewSupplier({...newSupplier, ice: e.target.value})} className="border p-2 rounded flex-1" />
            </div>
            <button className="bg-blue-700 text-white px-4 py-2 rounded mt-2">Ajouter</button>
          </form>
        </div>

        {/* Formulaire Nouvel Achat */}
        <div className="bg-white p-4 rounded-xl border">
          <h2 className="font-semibold mb-3">2. Enregistrer un achat</h2>
          <form onSubmit={handlePurchase} className="flex flex-col gap-2">
            <select required value={form.supplierId} onChange={e => setForm({...form, supplierId: e.target.value})} className="border p-2 rounded text-sm">
              <option value="">-- Choisir Fournisseur --</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select required value={form.articleId} onChange={e => setForm({...form, articleId: e.target.value})} className="border p-2 rounded text-sm">
              <option value="">-- Choisir Article --</option>
              {articles.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <div className="flex gap-2">
              <input type="number" required min="1" placeholder="Qté" value={form.quantity} onChange={e => setForm({...form, quantity: Number(e.target.value)})} className="border p-2 rounded w-24 text-sm" />
              <input type="number" required min="0" step="0.01" placeholder="Prix d'achat" value={form.unitCost} onChange={e => setForm({...form, unitCost: Number(e.target.value)})} className="border p-2 rounded flex-1 text-sm" />
            </div>
            <button className="bg-green-600 text-white px-4 py-2 rounded text-sm mt-2">Enregistrer l'achat</button>
          </form>
        </div>
      </div>

      {/* Historique des Achats */}
      <div>
        <h2 className="font-semibold mb-3">Historique des achats</h2>
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr><th className="p-3">Date</th><th className="p-3">Fournisseur</th><th className="p-3">Articles</th><th className="p-3 text-right">Total</th></tr>
            </thead>
            <tbody>
              {purchases.map(p => (
                <tr key={p.id} className="border-t hover:bg-gray-50 text-gray-900">
                  <td className="p-3 text-xs">{new Date(p.createdAt).toLocaleDateString('fr-MA')}</td>
                  <td className="p-3 font-medium">{p.supplier?.name || 'Fournisseur supprimé'}</td>
                  <td className="p-3 text-xs">
                    {p.items.map((i: any) => `${i.quantity}x ${i.article?.name || 'Article'}`).join(', ')}
                  </td>
                  <td className="p-3 text-right font-semibold">{formatMad(p.totalAmount)}</td>
                </tr>
              ))}
              {purchases.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-500">Aucun achat enregistré</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}