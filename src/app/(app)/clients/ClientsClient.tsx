'use client';
import { useEffect, useState } from 'react';
import { formatMad } from '@/lib/utils';

export default function ClientsClient({ lang }: { lang: 'fr' | 'ar' }) {
  const tr = (fr: string, ar: string) => lang === 'ar' ? ar : fr;
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
    <div className="min-w-0 p-2 sm:p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{tr("Clients", "العملاء")}</h1>
      
      <form onSubmit={submit} className="bg-white p-4 rounded-xl border mb-6 flex gap-2 flex-wrap">
        <input required placeholder={tr("Nom du client", "اسم العميل")} value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="border p-2 rounded flex-1" />
        <input placeholder={tr("Téléphone", "الهاتف")} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="border p-2 rounded" />
        <input type="number" placeholder={tr("Plafond crédit (MAD)", "سقف الائتمان (MAD)")} value={form.creditLimit} onChange={e => setForm({...form, creditLimit: e.target.value})} className="border p-2 rounded" />
        <button className="bg-blue-700 text-white px-4 py-2 rounded">{tr("Ajouter", "إضافة")}</button>
      </form>

      <div className="store-table-scroll bg-white rounded-xl border overflow-x-auto" role="region" aria-label={lang === 'ar' ? "قائمة العملاء" : "Liste des clients"} tabIndex={0}>
        <table className="store-data-table w-full min-w-[480px] text-sm">
          <thead className="bg-gray-50 text-start">
            <tr><th scope="col" className="p-3">{tr("Nom", "الاسم")}</th><th scope="col" className="p-3">{tr("Téléphone", "الهاتف")}</th><th scope="col" className="p-3 text-end">{tr("Solde dû", "الرصيد المستحق")}</th><th scope="col" className="p-3 text-end">{tr("Plafond", "السقف")}</th></tr>
          </thead>
          <tbody>
                       {clients.map(c => (
              <tr key={c.id} className="border-t">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3">{c.phone}</td>
                <td className={`p-3 text-end font-semibold ${c.balance > 0 ? 'text-red-600' : ''}`}>{formatMad(c.balance)}</td>
                <td className="p-3 text-end text-gray-500">{formatMad(c.creditLimit)}</td>
                <td className="p-3">
                  {c.balance > 0 && c.phone && (
                    <a 
                      href={`https://wa.me/212${c.phone.replace(/^0/, '')}?text=${encodeURIComponent(`Bonjour ${c.name}, nous vous rappelons que votre solde dû est de ${formatMad(c.balance)}. Merci de passer régler. Cordialement.`)}`}
                      target="_blank"
                      className="text-green-600 hover:underline font-medium text-sm"
                    >
                      {tr("💬 Rappel WhatsApp", "💬 تذكير عبر واتساب")}
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}