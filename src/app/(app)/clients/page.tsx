'use client';
import { useEffect, useState } from 'react';
import { formatMad } from '@/lib/utils';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', phone: '', creditLimit: '' });

  function load() { fetch('/api/clients').then(r => r.json()).then(setClients); }
  useEffect(() => { load(); }, []);

  async function submit(e: any) {
    e.preventDefault();
    await fetch('/api/clients', { method: 'POST', body: JSON.stringify(form), headers: {'Content-Type': 'application/json'} });
    setForm({ name: '', phone: '', creditLimit: '' });
    load();
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Clients</h1>
      
      <form onSubmit={submit} className="bg-white p-4 rounded-xl border mb-6 flex gap-2 flex-wrap">
        <input required placeholder="Nom du client" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="border p-2 rounded flex-1" />
        <input placeholder="Téléphone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="border p-2 rounded" />
        <input type="number" placeholder="Plafond crédit (MAD)" value={form.creditLimit} onChange={e => setForm({...form, creditLimit: e.target.value})} className="border p-2 rounded" />
        <button className="bg-blue-700 text-white px-4 py-2 rounded">Ajouter</button>
      </form>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr><th className="p-3">Nom</th><th className="p-3">Téléphone</th><th className="p-3 text-right">Solde dû</th><th className="p-3 text-right">Plafond</th></tr>
          </thead>
          <tbody>
            {clients.map(c => (
              <tr key={c.id} className="border-t">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3">{c.phone}</td>
                <td className={`p-3 text-right font-semibold ${c.balance > 0 ? 'text-red-600' : ''}`}>{formatMad(c.balance)}</td>
                <td className="p-3 text-right text-gray-500">{formatMad(c.creditLimit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}