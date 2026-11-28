'use client';
import { useEffect,useState } from 'react';
import CatalogImport from '@/components/CatalogImport';
type Basic={id:string;name:string;phone:string|null;ice:string|null};
type Payment={id:string;amount:string;currency:string;rate:string;rateDate:string;amountMad:string;paidAt:string;method:string;reference:string|null};
type Invoice={id:string;invoiceNo:string;invoiceDate:string;dueDate:string;currency:string;amount:string;amountMad:string;rate:string;rateDate:string;payments:Payment[]};
type Detail=Basic & {profile:Record<string,string|number|null>|null;invoices:Invoice[];purchases:{id:string;totalAmount:number;createdAt:string}[]};
type Rate={code:string;rate:number;date:string};
const emptyProfile={name:'',phone:'',ice:'',contactName:'',email:'',address:'',city:'',country:'Maroc',taxId:'',tradeRegister:'',bankName:'',bankAccount:'',swift:'',paymentTermDays:'30',preferredCurrency:'MAD',notes:''};
const toDay=(s:string)=>s.slice(0,10);
const units=(s:string)=>{const [whole,frac='']=s.split('.');return BigInt(whole)*BigInt(10000)+BigInt(frac.padEnd(4,'0').slice(0,4));};
const invoiceRemaining=(i:Invoice)=>Math.max(0,Number(units(i.amount)-i.payments.reduce((n,p)=>n+units(p.amount),BigInt(0)))/10000);
export default function SupplierClient({lang,canEdit,today}:{lang:'fr'|'ar';canEdit:boolean;today:string}){
  const tr=(fr:string,ar:string)=>lang==='ar'?ar:fr;
  const [list,setList]=useState<Basic[]>([]);
  const [selected,setSelected]=useState('');
  const [detail,setDetail]=useState<Detail|null>(null);
  const [search,setSearch]=useState('');
  const [profile,setProfile]=useState(emptyProfile);
  const [rates,setRates]=useState<Rate[]>([]);
  const [rateError,setRateError]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [invoice,setInvoice]=useState({invoiceNo:'',invoiceDate:today,dueDate:today,currency:'MAD',amount:''});
  const [pay,setPay]=useState({invoiceId:'',amount:'',paidAt:today,method:'bank',reference:'',requestId:''});
  const [loading,setLoading]=useState(false);
  const money=(v:number|string,c='MAD')=>new Intl.NumberFormat(lang==='ar'?'ar-MA':'fr-MA',{maximumFractionDigits:4,minimumFractionDigits:2}).format(Number(v))+' '+c;
  const messages:Record<string,string>={LEDGER_UNAVAILABLE:tr('Module indisponible : vérifiez la mise à niveau de la base.','الوحدة غير متاحة. تحقق من ترقية قاعدة البيانات.'),DUPLICATE:tr('Fournisseur ou référence déjà enregistré.','المورد أو المرجع موجود بالفعل.'),CONFLICT:tr('Conflit : rechargez les données et vérifiez les doublons.','تعارض: أعد تحميل البيانات وتحقق من التكرار.'),INVALID_PROFILE:tr('Coordonnées invalides. ICE : 15 chiffres ; délai : 0 à 365 jours.','بيانات غير صالحة.'),INVALID_DATE:tr('Dates invalides.','تواريخ غير صالحة.'),INVALID_AMOUNT:tr('Montant positif invalide.','المبلغ غير صالح.'),OVERPAYMENT:tr('Le règlement dépasse le reste dû.','المبلغ يتجاوز المتبقي.'),RATE_CHANGED:tr('Le cours a changé : actualisez puis confirmez de nouveau.','تغير السعر: حدث ثم أكد مجددا.'),RATE_UNAVAILABLE:tr('Cours de référence indisponible ou trop ancien.','سعر الصرف غير متاح أو قديم.'),INVALID_CURRENCY:tr('Devise invalide.','عملة غير صالحة.')};
  const explain=(code:string)=>messages[code]||tr('Opération impossible. Vérifiez les données puis réessayez.','تعذرت العملية. تحقق من البيانات.');
  async function request(body?:Record<string,unknown>,id?:string){
    const res=await fetch('/api/suppliers/ledger'+(id?'?supplierId='+encodeURIComponent(id):''),body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{cache:'no-store'});
    const data=await res.json();if(!res.ok)throw new Error(data.error||'ERROR');return data;
  }
  async function loadList(){try{setList(await request());}catch(e){setError(explain(e instanceof Error?e.message:''));}}
  async function loadRates(){try{const r=await fetch('/api/currencies/reference',{cache:'no-store'});if(!r.ok)throw new Error();const d=await r.json();setRates(Array.isArray(d.rates)?d.rates:[]);setRateError(false);}catch{setRates([]);setRateError(true);}}
  useEffect(()=>{void loadList();void loadRates();const timer=setInterval(loadRates,15*60*1000);return()=>clearInterval(timer);},[]);
  useEffect(()=>{
    let active=true;setDetail(null);setPay({invoiceId:'',amount:'',paidAt:today,method:'bank',reference:'',requestId:''});
    if(!selected){setProfile(emptyProfile);setLoading(false);return;}
    setLoading(true);
    request(undefined,selected).then((d:Detail)=>{
      if(!active)return;setDetail(d);
      setProfile(Object.fromEntries(Object.entries(emptyProfile).map(([k,v])=>[k,String(k in d?(d as unknown as Record<string,unknown>)[k]??'':d.profile?.[k]??v)])) as typeof emptyProfile);
      const term=Number(d.profile?.paymentTermDays??30),due=new Date(today+'T00:00:00Z');due.setUTCDate(due.getUTCDate()+term);
      setInvoice({invoiceNo:'',invoiceDate:today,dueDate:due.toISOString().slice(0,10),currency:String(d.profile?.preferredCurrency||'MAD'),amount:''});
    }).catch(e=>{if(active)setError(explain(e instanceof Error?e.message:''));}).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[selected,today]);
  async function refreshDetail(id:string){const d:Detail=await request(undefined,id);setDetail(d);}
  const quote=(currency:string)=>currency==='MAD'?{code:'MAD',rate:1,date:today}:rates.find(r=>r.code===currency);
  const fx=(currency:string,amount:string)=>{
    const q=quote(currency),n=Number(amount.replace(',','.'));return q&&Number.isFinite(n)&&n>0?money(n*q.rate):'—';
  };
  const fxBody=(currency:string)=>{const q=quote(currency);return {expectedRate:q?.rate.toFixed(10),expectedDate:q?.date};};
  async function run(work:()=>Promise<void>){if(busy)return;setBusy(true);setError('');setNotice('');try{await work();}catch(e){setError(explain(e instanceof Error?e.message:''));}finally{setBusy(false);}}
  const fields:[keyof typeof emptyProfile,string,string][]=[
    ['name','Raison sociale *','الاسم التجاري *'],['contactName','Contact','جهة الاتصال'],['phone','Téléphone','الهاتف'],['email','E-mail','البريد الإلكتروني'],['ice','ICE (15 chiffres)','المعرف الموحد'],['taxId','Identifiant fiscal','المعرف الضريبي'],['tradeRegister','Registre de commerce','السجل التجاري'],['address','Adresse','العنوان'],['city','Ville','المدينة'],['country','Pays *','البلد *'],['bankName','Banque','البنك'],['bankAccount','RIB / IBAN','الحساب البنكي'],['swift','SWIFT / BIC','رمز سويفت'],['paymentTermDays','Délai de paiement (jours)','أجل الدفع (أيام)'],['preferredCurrency','Devise habituelle (code ISO)','العملة المعتادة'],['notes','Notes','ملاحظات']
  ];
  const inputClass='w-full border rounded p-2 mt-1';
  const activeInvoice=detail?.invoices.find(i=>i.id===pay.invoiceId);
  const currencyOptions=[...new Set(['MAD',...rates.map(r=>r.code),invoice.currency])];
  const disabled=busy||loading;
  const totalByCurrency=new Map<string,number>();for(const i of detail?.invoices||[])totalByCurrency.set(i.currency,(totalByCurrency.get(i.currency)||0)+invoiceRemaining(i));
  return <div className="min-w-0 max-w-6xl mx-auto space-y-4">
    <h1 className="text-2xl font-bold">{tr('Gestion des fournisseurs','إدارة الموردين')}</h1>
    {canEdit&&<CatalogImport kind="suppliers" lang={lang} onImported={loadList}/>}
    {error&&<p role="alert" className="bg-red-50 text-red-800 rounded p-3">{error}</p>}
    {notice&&<p role="status" className="bg-green-50 text-green-800 rounded p-3">{notice}</p>}
    <section className="bg-white rounded-xl border p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold flex-1">{tr('Répertoire fournisseurs','دليل الموردين')}</h2>{canEdit&&<button type="button" disabled={disabled} onClick={()=>{setSelected('');setProfile(emptyProfile);setDetail(null);}} className="bg-blue-700 text-white rounded px-3 py-2">{tr('+ Nouveau fournisseur','+ مورد جديد')}</button>}</div>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={tr('Rechercher nom, ICE ou téléphone','البحث بالاسم أو الرقم')} className="w-full border rounded p-2"/>
      <div className="store-table-scroll overflow-auto max-h-64" tabIndex={0}><table className="store-data-table w-full min-w-[400px] text-sm"><thead><tr>{[tr('Fournisseur','المورد'),tr('Téléphone','الهاتف'),'ICE'].map(h=><th className="p-2" key={h}>{h}</th>)}</tr></thead><tbody>{list.filter(s=>[s.name,s.ice,s.phone].some(v=>v?.toLowerCase().includes(search.toLowerCase()))).map(s=><tr key={s.id}><td className="p-2"><button type="button" disabled={disabled} className="text-blue-800 underline text-start font-medium" onClick={()=>setSelected(s.id)}>{s.name}</button></td><td className="p-2">{s.phone||'—'}</td><td className="p-2" dir="ltr">{s.ice||'—'}</td></tr>)}</tbody></table></div>
    </section>
    {(canEdit||detail)&&<form className="bg-white rounded-xl border p-4 space-y-3" onSubmit={e=>{e.preventDefault();void run(async()=>{const data=await request({action:'profile',supplierId:selected||undefined,...profile});await loadList();if(selected===data.id)await refreshDetail(data.id);else setSelected(data.id);setNotice(tr('Fiche enregistrée.','تم حفظ الملف.'));});}}>
      <h2 className="font-semibold">{selected?tr('Fiche fournisseur','ملف المورد'):tr('Nouveau fournisseur','مورد جديد')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{fields.map(([key,fr,ar])=><label key={key} className="text-sm min-w-0">{tr(fr,ar)}<input className={inputClass} disabled={disabled||!canEdit} required={key==='name'||key==='country'||key==='paymentTermDays'||key==='preferredCurrency'} value={profile[key]} onChange={e=>setProfile(p=>({...p,[key]:e.target.value}))} type={key==='paymentTermDays'?'number':key==='email'?'email':'text'} min={key==='paymentTermDays'?0:undefined} max={key==='paymentTermDays'?365:undefined}/></label>)}</div>
      {canEdit&&<button disabled={disabled} className="bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50">{tr('Enregistrer la fiche','حفظ الملف')}</button>}
    </form>}
    {detail&&<>
      <section className="bg-white border rounded-xl p-4 space-y-2"><h2 className="font-semibold">{tr('Restes dus par devise','المبالغ المتبقية حسب العملة')}</h2><div className="flex flex-wrap gap-4">{[...totalByCurrency].map(([c,v])=><div key={c} className="text-lg font-bold text-blue-900" dir="ltr">{money(v,c)}</div>)}</div><p className="text-sm text-gray-600">{tr('Les anciens achats ne deviennent pas automatiquement des dettes. Seules les factures saisies ici sont suivies.','لا تتحول المشتريات القديمة تلقائيا إلى ديون. تتم متابعة الفواتير المسجلة هنا فقط.')}</p></section>
      <section className="bg-white border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap"><h2 className="font-semibold flex-1">{tr('Factures fournisseurs','فواتير الموردين')}</h2><button type="button" disabled={busy} onClick={()=>void loadRates()} className="underline text-blue-800 text-sm">{tr('Actualiser les cours','تحديث الأسعار')}</button></div>
        {rateError&&<p className="text-sm text-amber-900">{tr('Cours étrangers indisponibles. Les opérations MAD restent possibles.','أسعار العملات غير متاحة. عمليات الدرهم ممكنة.')}</p>}
        <form className="space-y-3" onSubmit={e=>{e.preventDefault();void run(async()=>{await request({action:'invoice',supplierId:detail.id,...invoice,amount:invoice.amount.replace(',','.'),...fxBody(invoice.currency)});await refreshDetail(detail.id);setInvoice(v=>({...v,invoiceNo:'',amount:''}));setNotice(tr('Facture enregistrée.','تم تسجيل الفاتورة.'));});}}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <label className="text-sm">{tr('Numéro de facture','رقم الفاتورة')}<input required className={inputClass} value={invoice.invoiceNo} onChange={e=>setInvoice(v=>({...v,invoiceNo:e.target.value}))}/></label>
            <label className="text-sm">{tr('Date de facture','تاريخ الفاتورة')}<input required type="date" max={today} className={inputClass} value={invoice.invoiceDate} onChange={e=>setInvoice(v=>({...v,invoiceDate:e.target.value}))}/></label>
            <label className="text-sm">{tr('Échéance','تاريخ الاستحقاق')}<input required type="date" min={invoice.invoiceDate} className={inputClass} value={invoice.dueDate} onChange={e=>setInvoice(v=>({...v,dueDate:e.target.value}))}/></label>
            <label className="text-sm">{tr('Devise','العملة')}<select className={inputClass} value={invoice.currency} onChange={e=>setInvoice(v=>({...v,currency:e.target.value}))}>{currencyOptions.map(c=><option key={c}>{c}</option>)}</select></label>
            <label className="text-sm">{tr('Montant TTC en devise','المبلغ بالعملة')}<input required inputMode="decimal" className={inputClass} value={invoice.amount} onChange={e=>setInvoice(v=>({...v,amount:e.target.value}))}/></label>
            <div className="bg-blue-50 p-2 rounded"><p className="text-sm">{tr('Contre-valeur indicative','القيمة التقريبية')}</p><strong dir="ltr">{fx(invoice.currency,invoice.amount)}</strong><p className="text-xs" dir="ltr">{quote(invoice.currency)?.date||'—'}</p></div>
          </div>
          <p className="text-xs text-gray-600">{tr('Cours de référence actuel BAM via Frankfurter, non historique et hors frais bancaires. La date du cours est conservée. Aucun mouvement de stock.','السعر المرجعي الحالي لبنك المغرب دون الرسوم البنكية وليس سعرا تاريخيا. يحفظ تاريخ السعر دون تعديل المخزون.')}</p>
          <button disabled={disabled||!quote(invoice.currency)} className="bg-blue-700 text-white rounded px-4 py-2 disabled:opacity-50">{tr('Enregistrer la facture','تسجيل الفاتورة')}</button>
        </form>
        <div className="store-table-scroll overflow-auto" tabIndex={0}><table className="store-data-table w-full min-w-[820px] text-sm"><thead><tr>{[tr('Facture','الفاتورة'),tr('Date','التاريخ'),tr('Échéance','الاستحقاق'),tr('Montant','المبلغ'),tr('Reste dû','المتبقي'),tr('Équivalent initial MAD','المقابل الأولي'),tr('État','الحالة')].map(h=><th key={h} className="p-2">{h}</th>)}</tr></thead><tbody>{detail.invoices.map(i=>{const remaining=invoiceRemaining(i);return <tr key={i.id}><td className="p-2">{i.invoiceNo}</td><td className="p-2">{toDay(i.invoiceDate)}</td><td className="p-2">{toDay(i.dueDate)}</td><td className="p-2" dir="ltr">{money(i.amount,i.currency)}</td><td className="p-2" dir="ltr">{money(remaining,i.currency)}</td><td className="p-2" dir="ltr">{money(i.amountMad)}</td><td className="p-2">{remaining===0?tr('Réglée','مدفوعة'):toDay(i.dueDate)<today?tr('En retard','متأخرة'):tr('À payer','للدفع')}</td></tr>})}</tbody></table></div>
      </section>
      <section className="bg-white border rounded-xl p-4 space-y-3"><h2 className="font-semibold">{tr('Règlements fournisseurs','دفعات الموردين')}</h2>
        <form className="space-y-3" onSubmit={e=>{e.preventDefault();if(!activeInvoice)return;void run(async()=>{await request({action:'payment',...pay,currency:activeInvoice.currency,amount:pay.amount.replace(',','.'),...fxBody(activeInvoice.currency)});await refreshDetail(detail.id);setPay(v=>({...v,amount:'',reference:'',requestId:(globalThis.crypto?.randomUUID?.()||Array.from(crypto.getRandomValues(new Uint32Array(4)),n=>n.toString(16).padStart(8,'0')).join(''))}));setNotice(tr('Règlement enregistré.','تم تسجيل الدفعة.'));});}}>
          <label className="text-sm block">{tr('Facture à régler','الفاتورة المطلوب دفعها')}<select required className={inputClass} value={pay.invoiceId} onChange={e=>setPay(v=>({...v,invoiceId:e.target.value,amount:'',requestId:(globalThis.crypto?.randomUUID?.()||Array.from(crypto.getRandomValues(new Uint32Array(4)),n=>n.toString(16).padStart(8,'0')).join(''))}))}><option value="">{tr('Choisir une facture','اختر فاتورة')}</option>{detail.invoices.filter(i=>invoiceRemaining(i)>0).map(i=><option key={i.id} value={i.id}>{i.invoiceNo} — {money(invoiceRemaining(i),i.currency)}</option>)}</select></label>
          {activeInvoice&&<><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-sm">{tr('Montant à payer','المبلغ المدفوع')} ({activeInvoice.currency})<input required inputMode="decimal" className={inputClass} value={pay.amount} onChange={e=>setPay(v=>({...v,amount:e.target.value}))}/></label>
            <label className="text-sm">{tr('Date du règlement','تاريخ الدفع')}<input required type="date" max={today} min={toDay(activeInvoice.invoiceDate)} className={inputClass} value={pay.paidAt} onChange={e=>setPay(v=>({...v,paidAt:e.target.value}))}/></label>
            <label className="text-sm">{tr('Mode de paiement','طريقة الدفع')}<select className={inputClass} value={pay.method} onChange={e=>setPay(v=>({...v,method:e.target.value}))}>{[['bank',tr('Virement','تحويل')],['cash',tr('Espèces','نقدا')],['card',tr('Carte','بطاقة')],['cheque',tr('Chèque','شيك')],['other',tr('Autre','أخرى')]].map(([k,v])=><option value={k} key={k}>{v}</option>)}</select></label>
            <label className="text-sm">{tr('Référence du règlement','مرجع الدفع')}<input className={inputClass} value={pay.reference} onChange={e=>setPay(v=>({...v,reference:e.target.value}))}/></label>
          </div><div className="bg-blue-50 rounded p-3"><p>{tr('Contre-valeur indicative en MAD','القيمة التقريبية بالدرهم')}</p><strong className="text-xl" dir="ltr">{fx(activeInvoice.currency,pay.amount)}</strong><p className="text-xs" dir="ltr">{quote(activeInvoice.currency)?.date||'—'}</p></div><p className="text-xs text-gray-600">{tr('Règlement dans la devise de la facture. Ce journal ne déclenche aucun virement ni mouvement de caisse.','الدفع بعملة الفاتورة. هذا السجل لا ينفذ تحويلا أو حركة صندوق.')}</p><button disabled={disabled||!quote(activeInvoice.currency)||invoiceRemaining(activeInvoice)<=0} className="bg-green-600 text-white rounded px-4 py-2 disabled:opacity-50">{tr('Enregistrer le règlement','تسجيل الدفعة')}</button></>}
        </form>
        <div className="store-table-scroll overflow-auto" tabIndex={0}><table className="store-data-table w-full min-w-[650px] text-sm"><thead><tr>{[tr('Facture','الفاتورة'),tr('Date','التاريخ'),tr('Montant','المبلغ'),tr('Équivalent MAD','المقابل بالدرهم'),tr('Cours / date','السعر / التاريخ'),tr('Référence','المرجع')].map(h=><th key={h} className="p-2">{h}</th>)}</tr></thead><tbody>{detail.invoices.flatMap(i=>i.payments.map(p=><tr key={p.id}><td className="p-2">{i.invoiceNo}</td><td className="p-2">{toDay(p.paidAt)}</td><td className="p-2" dir="ltr">{money(p.amount,p.currency)}</td><td className="p-2" dir="ltr">{money(p.amountMad)}</td><td className="p-2" dir="ltr">{p.rate} / {toDay(p.rateDate)}</td><td className="p-2">{p.reference||'—'}</td></tr>))}</tbody></table></div>
      </section>
      <section className="bg-white border rounded-xl p-4"><h2 className="font-semibold mb-2">{tr('50 derniers achats (stock)','آخر 50 عملية شراء')}</h2><div className="store-table-scroll overflow-auto"><table className="store-data-table w-full text-sm"><thead><tr><th className="p-2">{tr('Date','التاريخ')}</th><th className="p-2">{tr('Montant MAD','المبلغ بالدرهم')}</th></tr></thead><tbody>{detail.purchases.map(p=><tr key={p.id}><td className="p-2">{toDay(p.createdAt)}</td><td className="p-2" dir="ltr">{money(p.totalAmount)}</td></tr>)}</tbody></table></div></section>
    </>}
  </div>;
}
