'use client';
import { useEffect, useState } from 'react';
import { formatMad } from '@/lib/utils';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [form, setForm] = useState({ category: 'Loyer', description: '', amount: '', paymentMethod: 'cash' });

  function load() { fetch('/api/expenses').then(r => r.json()).then(setExpenses); }
  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setForm({ category: 'Loyer', description: '', amount: '', paymentMethod: 'cash' });
    load();
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestion des Dépenses</h1>
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-sm">
          <span className="text-gray-600">Total Dépenses : </span>
          <span className="font-bold text-red-700">{formatMad(total)}</span>
        </div>
      </div>

      <form onSubmit={submit} className="bg-white p-4 rounded-xl border grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
        <div>
          <label className="text-xs">Catégorie</label>
          <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full border p-2 rounded text-sm">
            <option>Loyer</option><option>Salaires</option><option>Électricité/Eau</option>
            <option>Transport</option><option>Fournitures</option><option>Divers</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="text-xs">Description</label>
          <input required placeholder="Ex: Facture Lydec" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border p-2 rounded text-sm" />
        </div>
        <div>
          <label className="text-xs">Montant (MAD)</label>
          <input required type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full border p-2 rounded text-sm" />
        </div>
        <button className="bg-red-600 text-white px-4 py-2 rounded text-sm h-10 hover:bg-red-700">Ajouter</button>
      </form>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr><th className="p-3">Date</th><th className="p-3">Catégorie</th><th className="p-3">Description</th><th className="p-3 text-right">Montant</th></tr>
          </thead>
          <tbody>
            {expenses.map(e => (
              <tr key={e.id} className="border-t hover:bg-gray-50">
                <td className="p-3 text-xs">{new Date(e.date).toLocaleDateString('fr-MA')}</td>
                <td className="p-3 font-medium">{e.category}</td>
                <td className="p-3">{e.description}</td>
                <td className="p-3 text-right font-semibold text-red-600">-{formatMad(e.amount)}</td>
              </tr>
            ))}
            {expenses.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-500">Aucune dépense enregistrée</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}