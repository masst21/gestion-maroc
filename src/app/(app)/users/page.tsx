'use client';
import { useEffect, useState } from 'react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'cashier' });
  const [error, setError] = useState('');

  function load() { fetch('/api/users').then(r => r.json()).then(setUsers); }
  useEffect(() => { load(); }, []);

  async function submit(e: any) {
    e.preventDefault(); setError('');
    const res = await fetch('/api/users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
    });
    if (!res.ok) { const d = await res.json(); setError(d.error); return; }
    setForm({ fullName: '', email: '', password: '', role: 'cashier' });
    load();
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Gestion des Utilisateurs</h1>

      <form onSubmit={submit} className="bg-white p-4 rounded-xl border flex flex-wrap gap-2">
        <input required placeholder="Nom complet" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} className="border p-2 rounded flex-1" />
        <input required type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="border p-2 rounded flex-1" />
        <input required type="password" placeholder="Mot de passe" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="border p-2 rounded flex-1" />
        <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="border p-2 rounded">
          <option value="admin">Administrateur</option>
          <option value="manager">Gérant</option>
          <option value="cashier">Caissier / Vendeur</option>
          <option value="accountant">Comptable</option>
        </select>
        <button className="bg-blue-700 text-white px-4 py-2 rounded">Ajouter</button>
      </form>
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr><th className="p-3">Nom</th><th className="p-3">Email</th><th className="p-3">Rôle</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t">
                <td className="p-3 font-medium">{u.fullName}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {u.role === 'admin' ? 'Administrateur' : 'Caissier'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}