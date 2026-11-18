'use client';
import { useEffect, useState } from 'react';
import { formatMad } from '@/lib/utils';

export default function CashPage() {
  const [data, setData] = useState<{ session: any, history: any[] }>({ session: null, history: [] });
  const [loading, setLoading] = useState(true);
  
  // Formulaires
  const [openAmount, setOpenAmount] = useState('');
  const [closeAmount, setCloseAmount] = useState('');
  const [movement, setMovement] = useState({ type: 'in', amount: '', reason: '' });

  function loadData() {
    fetch('/api/cash').then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }
  useEffect(() => { loadData(); }, []);

  async function handleAction(action: string, payload: any) {
    await fetch('/api/cash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
    });
    loadData();
  }

  if (loading) return <div className="p-6">Chargement...</div>;

  const { session, history } = data;

  // Calculs pour l'affichage
  const inTotal = session?.movements.filter((m: any) => m.type === 'in').reduce((s: number, m: any) => s + m.amount, 0) || 0;
  const outTotal = session?.movements.filter((m: any) => m.type === 'out').reduce((s: number, m: any) => s + m.amount, 0) || 0;
  const expected = session ? session.openingBalance + inTotal - outTotal : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Caisse</h1>

      {/* Si aucune session n'est ouverte */}
      {!session && (
        <div className="bg-white p-6 rounded-xl border max-w-md">
          <h2 className="font-semibold mb-4">Ouvrir la caisse</h2>
          <p className="text-sm text-gray-500 mb-4">Saisissez le fond de caisse initial (espèces dans le tiroir).</p>
          <div className="flex gap-2">
            <input type="number" placeholder="Ex: 500" value={openAmount} onChange={e => setOpenAmount(e.target.value)} className="border p-2 rounded flex-1" />
            <button onClick={() => handleAction('open', { amount: openAmount })} className="bg-green-600 text-white px-4 py-2 rounded">Ouvrir</button>
          </div>
        </div>
      )}

      {/* Si une session est ouverte */}
      {session && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Colonne gauche : Résumé */}
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-xl border">
              <h2 className="font-semibold mb-4 text-blue-900">Session en cours</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Fond initial</span><span>{formatMad(session.openingBalance)}</span></div>
                <div className="flex justify-between text-green-600"><span>Entrées (+) </span><span>+{formatMad(inTotal)}</span></div>
                <div className="flex justify-between text-red-600"><span>Sorties (-)</span><span>-{formatMad(outTotal)}</span></div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2"><span>Solde théorique</span><span>{formatMad(expected)}</span></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border max-w-md">
              <h2 className="font-semibold mb-4">Clôturer la caisse</h2>
              <p className="text-sm text-gray-500 mb-4">Comptez l'argent réellement présent dans le tiroir.</p>
              <div className="flex gap-2">
                <input type="number" placeholder="Montant compté" value={closeAmount} onChange={e => setCloseAmount(e.target.value)} className="border p-2 rounded flex-1" />
                <button onClick={() => handleAction('close', { amount: closeAmount })} className="bg-red-600 text-white px-4 py-2 rounded">Clôturer</button>
              </div>
            </div>
          </div>

          {/* Colonne droite : Mouvements */}
          <div className="bg-white p-6 rounded-xl border">
            <h2 className="font-semibold mb-4">Mouvements manuels</h2>
            <div className="flex gap-2 mb-4">
              <select value={movement.type} onChange={e => setMovement({...movement, type: e.target.value})} className="border p-2 rounded text-sm">
                <option value="in">Entrée (+)</option>
                <option value="out">Sortie (-)</option>
              </select>
              <input type="number" placeholder="Montant" value={movement.amount} onChange={e => setMovement({...movement, amount: e.target.value})} className="border p-2 rounded w-24 text-sm" />
              <input placeholder="Motif (ex: achat sacs)" value={movement.reason} onChange={e => setMovement({...movement, reason: e.target.value})} className="border p-2 rounded flex-1 text-sm" />
              <button onClick={() => { handleAction('movement', movement); setMovement({ type: 'in', amount: '', reason: '' }); }} className="bg-blue-700 text-white px-3 py-2 rounded text-sm">Ajouter</button>
            </div>

            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <tbody>
                  {session.movements.map((m: any) => (
                    <tr key={m.id} className="border-b last:border-0">
                      <td className="py-2 text-gray-500 text-xs">{new Date(m.createdAt).toLocaleTimeString('fr-MA')}</td>
                      <td className={`py-2 font-semibold ${m.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>{m.type === 'in' ? '+' : '-'}{formatMad(m.amount)}</td>
                      <td className="py-2 text-gray-600">{m.reason}</td>
                    </tr>
                  ))}
                  {session.movements.length === 0 && <tr><td className="py-4 text-center text-gray-400">Aucun mouvement</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Historique */}
      <div>
        <h2 className="font-semibold mb-3">Historique des clôtures</h2>
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr><th className="p-3">Date</th><th className="p-3">Fond</th><th className="p-3">Attendu</th><th className="p-3">Compté</th><th className="p-3">Écart</th></tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id} className="border-t">
                  <td className="p-3 text-xs">{new Date(h.closedAt).toLocaleString('fr-MA')}</td>
                  <td className="p-3">{formatMad(h.openingBalance)}</td>
                  <td className="p-3">{formatMad(h.expectedBalance)}</td>
                  <td className="p-3">{formatMad(h.closingBalance)}</td>
                  <td className={`p-3 font-bold ${h.difference !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {h.difference > 0 ? '+' : ''}{formatMad(h.difference)}
                  </td>
                </tr>
              ))}
              {history.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-gray-500">Aucune session clôturée</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}