'use client';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [form, setForm] = useState({ name: '', address: '', phone: '', logoUrl: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => {
      setForm({ 
        name: data.name || '', 
        address: data.address || '', 
        phone: data.phone || '', 
        logoUrl: data.logoUrl || '' 
      });
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Paramètres du Magasin</h1>

      <form onSubmit={submit} className="bg-white p-6 rounded-xl border space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nom du magasin</label>
          <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Adresse</label>
          <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full border rounded px-3 py-2" placeholder="123 Rue Mohammed V, Casablanca" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Téléphone</label>
          <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full border rounded px-3 py-2" placeholder="0522000000" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">URL du Logo (Image)</label>
          <input value={form.logoUrl} onChange={e => setForm({...form, logoUrl: e.target.value})} className="w-full border rounded px-3 py-2" placeholder="https://exemple.com/logo.png" />
          <p className="text-xs text-gray-500 mt-1">Collez un lien direct vers votre image.</p>
        </div>

        {saved && <p className="text-green-600 text-sm font-medium">✅ Paramètres enregistrés !</p>}

        <button className="bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">Enregistrer</button>
      </form>
    </div>
  );
}