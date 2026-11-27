'use client';
import { useEffect, useState } from 'react';

export default function SettingsClient({ lang }: { lang: 'fr' | 'ar' }) {
  const tr = (fr: string, ar: string) => lang === 'ar' ? ar : fr;
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
    <div className="min-w-0 p-2 sm:p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{tr("Paramètres du Magasin", "إعدادات المتجر")}</h1>

      <form onSubmit={submit} className="bg-white p-6 rounded-xl border space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{tr("Nom du magasin", "اسم المتجر")}</label>
          <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{tr("Adresse", "العنوان")}</label>
          <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full border rounded px-3 py-2" placeholder={tr("123 Rue Mohammed V, Casablanca", "123 شارع محمد الخامس، الدار البيضاء")} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{tr("Téléphone", "الهاتف")}</label>
          <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full border rounded px-3 py-2" placeholder="0522000000" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{tr("URL du Logo (Image)", "رابط الشعار (الصورة)")}</label>
          <input value={form.logoUrl} onChange={e => setForm({...form, logoUrl: e.target.value})} className="w-full border rounded px-3 py-2" placeholder="https://exemple.com/logo.png" />
          <p className="text-xs text-gray-500 mt-1">{tr("Collez un lien direct vers votre image.", "ألصق رابطاً مباشراً لصورتك.")}</p>
        </div>

        {saved && <p className="text-green-600 text-sm font-medium">{tr("✅ Paramètres enregistrés !", "✅ تم حفظ الإعدادات!")}</p>}

        <button className="bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">{tr("Enregistrer", "حفظ")}</button>
      </form>
    </div>
  );
}