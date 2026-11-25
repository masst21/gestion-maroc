'use client';
import { useEffect, useState } from 'react';

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [form, setForm] = useState({ code: 'EUR', name: 'Euro', rate: '' });

  function load() { fetch('/api/currencies').then(r => r.json()).then(setCurrencies); }
  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/currencies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setForm({ code: 'EUR', name: 'Euro', rate: '' });
    load();
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Taux de change (Devises)</h1>
      <p className="text-sm text-gray-500">Définissez combien vaut 1 unité de devise en Dirhams (MAD).</p>

      <form onSubmit={submit} className="bg-white p-4 rounded-xl border flex gap-2 flex-wrap">
        <select value={form.code} onChange={e => setForm({...form, code: e.target.value, name: e.target.value === 'EUR' ? 'Euro' : 'Dollar US'})} className="border p-2 rounded">
          <option value="EUR">EUR (€)</option>
          <option value="USD">USD ($)</option>
        </select>
        <input required type="number" step="0.01" placeholder="Taux (ex: 10.85)" value={form.rate} onChange={e => setForm({...form, rate: e.target.value})} className="border p-2 rounded flex-1" />
        <button className="bg-blue-700 text-white px-4 py-2 rounded">Ajouter</button>
      </form>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr><th className="p-3">Devise</th><th className="p-3">Code</th><th className="p-3 text-right">1 Devise = (MAD)</th></tr>
          </thead>
          <tbody>
            {currencies.map(c => (
              <tr key={c.id} className="border-t">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3">{c.code}</td>
                <td className="p-3 text-right font-bold">{c.rate} MAD</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}