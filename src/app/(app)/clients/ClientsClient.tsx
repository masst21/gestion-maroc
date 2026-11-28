'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {formatMad} from '@/lib/utils';
import CatalogImport from '@/components/CatalogImport';
import IdentityScan from '@/components/IdentityScan';
type Basic={id:string;name:string;phone:string|null;email:string|null;ice:string|null;creditLimit:number;balance:number};
type Detail=Basic & {address:string|null;cin:string|null;sales:{id:string;invoiceNo:string;saleDate:string;totalTtc:number;paidAmount:number;dueAmount:number;paymentStatus:string}[]};
const empty={name:'',phone:'',email:'',ice:'',creditLimit:'0',address:'',cin:''};
export default function ClientsClient({lang,clientId}:{lang:'fr'|'ar';clientId?:string}){
  const tr=(fr:string,ar:string)=>lang==='ar'?ar:fr;
  const [clients,setClients]=useState<Basic[]>([]),[detail,setDetail]=useState<Detail|null>(null);
  const [form,setForm]=useState(empty),[search,setSearch]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true);
  const msg=(code:string)=>code==='CIN_DUPLICATE'?tr('Cette CIN est déjà associée à un client.','رقم البطاقة مستخدم بالفعل.'):code==='CIN'?tr('Numéro CIN invalide.','رقم البطاقة غير صالح.'):code==='INVALID'?tr('Vérifiez les champs.','تحقق من الحقول.'):tr('Opération impossible. Vérifiez la connexion et la mise à niveau de la base.','تعذرت العملية. تحقق من الاتصال وقاعدة البيانات.');
  async function load(){
    setLoading(true);setError('');
    try{
      const r=await fetch('/api/clients'+(clientId?'?id='+encodeURIComponent(clientId):''),{cache:'no-store'});
      const d=await r.json();if(!r.ok)throw new Error(d.error);
      if(clientId){setDetail(d);setForm({name:d.name,phone:d.phone||'',email:d.email||'',ice:d.ice||'',creditLimit:String(d.creditLimit),address:d.address||'',cin:d.cin||''});}
      else if(Array.isArray(d))setClients(d);else throw new Error('INVALID');
    }catch(e){setError(msg(e instanceof Error?e.message:''));}finally{setLoading(false);}
  }
  useEffect(()=>{void load();},[clientId]);
  async function submit(e:React.FormEvent){
    e.preventDefault();if(busy)return;setBusy(true);setError('');setNotice('');
    try{const r=await fetch('/api/clients',{method:clientId?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,...(clientId?{id:clientId}:{})})});
      const d=await r.json();if(!r.ok)throw new Error(d.error);
      if(!clientId)setForm(empty);await load();setNotice(tr('Fiche enregistrée.','تم حفظ الملف.'));
    }catch(e){setError(msg(e instanceof Error?e.message:''));}finally{setBusy(false);}
  }
  const fields:[keyof typeof empty,string,string][]=[['name','Nom complet *','الاسم الكامل *'],['phone','Téléphone','الهاتف'],['email','E-mail','البريد الإلكتروني'],['ice','ICE (entreprise)','المعرف الموحد'],['cin','Numéro CIN / CNIE','رقم البطاقة الوطنية'],['creditLimit','Plafond crédit (MAD)','سقف الائتمان']];
  return <div className="min-w-0 p-2 sm:p-4 max-w-5xl mx-auto space-y-4">
    {clientId&&<Link href="/clients" className="text-blue-800 underline">{tr('← Retour aux clients','العودة إلى العملاء')}</Link>}
    <h1 className="text-2xl font-bold">{clientId?(detail?.name||tr('Fiche client','ملف العميل')):tr('Clients','العملاء')}</h1>
    {error&&<p role="alert" className="bg-red-50 text-red-800 rounded p-3">{error}</p>}
    {notice&&<p role="status" className="bg-green-50 text-green-800 rounded p-3">{notice}</p>}
    {!clientId&&<CatalogImport kind="clients" lang={lang} onImported={load}/>}
    {(!clientId||detail)&&<form className="bg-white p-4 rounded-xl border space-y-3" onSubmit={submit}>
      <h2 className="font-semibold">{clientId?tr('Informations du client','بيانات العميل'):tr('Ajouter un client','إضافة عميل')}</h2>
      <IdentityScan key={clientId||'new'} lang={lang} disabled={busy} onApply={v=>setForm(f=>({...f,...v}))}/>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{fields.map(([key,fr,ar])=><label key={key} className="text-sm">{tr(fr,ar)}<input required={key==='name'} type={key==='creditLimit'?'number':key==='email'?'email':'text'} min={key==='creditLimit'?0:undefined} step={key==='creditLimit'?'0.01':undefined} className="block w-full border p-2 rounded mt-1" value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} disabled={busy}/></label>)}</div>
      <label className="block text-sm">{tr('Adresse complète','العنوان الكامل')}<textarea rows={3} className="block w-full border rounded p-2 mt-1" value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} disabled={busy}/></label>
      <button disabled={busy||!form.name.trim()} className="bg-blue-700 text-white rounded px-4 py-2 disabled:opacity-50">{tr('Enregistrer','حفظ')}</button>
    </form>}
    {loading&&<p className="text-sm">{tr('Chargement…','جار التحميل…')}</p>}
    {!clientId&&<section className="space-y-2">
      <input className="w-full border rounded p-2" placeholder={tr('Rechercher par nom ou téléphone','البحث بالاسم أو الهاتف')} value={search} onChange={e=>setSearch(e.target.value)}/>
      <div className="store-table-scroll bg-white rounded-xl border overflow-auto" tabIndex={0}><table className="store-data-table w-full min-w-[480px] text-sm"><thead><tr>{[tr('Nom','الاسم'),tr('Téléphone','الهاتف'),tr('Solde dû','الرصيد المستحق'),tr('Plafond','السقف'),tr('Rappel','تذكير')].map(h=><th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{clients.filter(c=>[c.name,c.phone].some(v=>v?.toLowerCase().includes(search.toLowerCase()))).map(c=><tr key={c.id}><td className="p-3"><Link className="font-semibold text-blue-800 underline" href={'/clients/'+encodeURIComponent(c.id)}>{c.name}</Link></td><td className="p-3">{c.phone||'—'}</td><td className="p-3 text-end">{formatMad(c.balance)}</td><td className="p-3 text-end">{formatMad(c.creditLimit)}</td><td className="p-3">{c.balance>0&&c.phone&&<a href={'https://wa.me/'+(c.phone.replace(/\D/g,'').startsWith('0')?'212'+c.phone.replace(/\D/g,'').slice(1):c.phone.replace(/\D/g,''))+'?text='+encodeURIComponent('Bonjour '+c.name+', votre solde dû est de '+formatMad(c.balance)+'.')} target="_blank" rel="noreferrer" className="text-green-700 underline">WhatsApp</a>}</td></tr>)}</tbody></table></div>
    </section>}
    {detail&&<section className="space-y-3">
      <div className="grid grid-cols-2 gap-3"><div className="bg-white border rounded p-3"><p className="text-sm">{tr('Solde dû','الرصيد المستحق')}</p><strong>{formatMad(detail.balance)}</strong></div><div className="bg-white border rounded p-3"><p className="text-sm">{tr('Plafond de crédit','سقف الائتمان')}</p><strong>{formatMad(detail.creditLimit)}</strong></div></div>
      <h2 className="font-semibold">{tr('50 dernières ventes','آخر 50 عملية بيع')}</h2>
      <div className="store-table-scroll bg-white border rounded-xl overflow-auto" tabIndex={0}><table className="store-data-table w-full min-w-[620px] text-sm"><thead><tr>{[tr('Facture','الفاتورة'),tr('Date','التاريخ'),tr('Total','الإجمالي'),tr('Payé','المدفوع'),tr('Reste dû','المتبقي')].map(h=><th key={h} className="p-2">{h}</th>)}</tr></thead><tbody>{detail.sales.map(s=><tr key={s.id}><td className="p-2">{s.invoiceNo}</td><td className="p-2">{new Date(s.saleDate).toLocaleDateString('fr-MA')}</td><td className="p-2">{formatMad(s.totalTtc)}</td><td className="p-2">{formatMad(s.paidAmount)}</td><td className="p-2">{formatMad(s.dueAmount)}</td></tr>)}</tbody></table></div>
    </section>}
  </div>;
}
