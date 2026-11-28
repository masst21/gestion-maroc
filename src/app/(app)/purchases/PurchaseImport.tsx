'use client';
import { useState } from 'react';
import { fields, validMapping, type Mapping } from '@/lib/purchaseImport';
type Inspection={headers:string[];mapping:Mapping;count:number;sample:string[][]};
type Preview={count:number;valid:number;total:number;issues:{line:number;reason:string}[];rows:{line:number;supplier:string;reference:string;quantity:number;unitCost:number;total:number}[]};
export default function PurchaseImport({lang,onImported}:{lang:'fr'|'ar';onImported:()=>Promise<void>}) {
  const tr=(fr:string,ar:string)=>lang==='ar'?ar:fr;
  const [file,setFile]=useState<File|null>(null);
  const [inspect,setInspect]=useState<Inspection|null>(null);
  const [mapping,setMapping]=useState<Mapping>({supplier:-1,reference:-1,quantity:-1,unitCost:-1});
  const [preview,setPreview]=useState<Preview|null>(null);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const labels={supplier:tr('Fournisseur','المورد'),reference:tr('Référence article','مرجع المنتج'),quantity:tr('Quantité','الكمية'),unitCost:tr('Prix unitaire (MAD)','سعر الوحدة بالدرهم')};
  const explanations:Record<string,string>={
    INVALID_FILE:tr('Fichier Excel ou CSV de 3 Mo maximum requis.','ملف إكسل أو CSV بحجم 3 ميغابايت كحد أقصى.'),
    FILE_LIMIT:tr('Maximum 500 lignes et 100 colonnes par fichier.','الحد الأقصى 500 سطر و100 عمود.'),
    EMPTY_FILE:tr('Aucune donnée trouvée sur la première feuille.','لا توجد بيانات في الورقة الأولى.'),
    UNREADABLE_FILE:tr('Fichier illisible. Pour CSV, utilisez UTF-8.','ملف غير قابل للقراءة. استخدم UTF-8.'),
    INVALID_MAPPING:tr('Associez quatre colonnes distinctes.','حدد أربعة أعمدة مختلفة.'),
    INVALID_ROWS:tr('Des lignes sont invalides. Aucun achat enregistré.','توجد أسطر غير صالحة. لم يسجل أي شراء.'),
    AMBIGUOUS_SUPPLIER:tr('Plusieurs fournisseurs portent le même nom. Aucun achat enregistré.','يوجد عدة موردين بالاسم نفسه. لم يسجل أي شراء.'),
    SUPPLIER:tr('Nom du fournisseur manquant ou trop long','اسم المورد مفقود أو طويل'),
    REFERENCE:tr('Référence article absente ou inconnue','مرجع المنتج مفقود أو غير معروف'),
    QUANTITY:tr('Quantité invalide','كمية غير صالحة'),
    PRICE:tr('Prix invalide','سعر غير صالح'),
  };
  const explain=(code:string)=>explanations[code]||tr('Opération impossible. Vérifiez le fichier et les achats avant de réessayer.','تعذرت العملية. تحقق من الملف والمشتريات قبل إعادة المحاولة.');
  async function request(f:File,mode:'inspect'|'preview'|'commit',m?:Mapping) {
    const data=new FormData();data.append('file',f);data.append('mode',mode);
    if(m)data.append('mapping',JSON.stringify(m));
    const res=await fetch('/api/purchases/import',{method:'POST',body:data});
    const body=await res.json();
    if(!res.ok)throw new Error(body.error||'IMPORT_FAILED');
    return body;
  }
  async function choose(f:File) {
    setFile(f);setInspect(null);setPreview(null);setError('');setMessage('');setBusy(true);
    try{const data=await request(f,'inspect');setInspect(data);setMapping(data.mapping);}
    catch(e){setError(explain(e instanceof Error?e.message:''));}
    finally{setBusy(false);}
  }
  async function verify() {
    if(!file||!inspect||!validMapping(mapping,inspect.headers.length))return;
    setBusy(true);setPreview(null);setError('');
    try{setPreview(await request(file,'preview',mapping));}
    catch(e){setError(explain(e instanceof Error?e.message:''));}
    finally{setBusy(false);}
  }
  async function commit() {
    if(!file||!preview||preview.issues.length||preview.valid===0||busy)return;
    setBusy(true);setError('');
    try{const result=await request(file,'commit',mapping);setMessage(tr('Achats importés : ','المشتريات المستوردة: ')+result.imported);setFile(null);setInspect(null);setPreview(null);await onImported();}
    catch(e){setError(explain(e instanceof Error?e.message:''));setPreview(null);}
    finally{setBusy(false);}
  }
  const money=(n:number)=>new Intl.NumberFormat(lang==='ar'?'ar-MA':'fr-MA',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
  return <section className="bg-white border rounded-xl p-4 space-y-3">
    <h2 className="font-semibold">{tr('Importer des achats (Excel / CSV)','استيراد المشتريات (إكسل / CSV)')}</h2>
    <p className="text-sm text-gray-600">{tr('Ordre libre des colonnes. La première ligne non vide de la première feuille doit contenir les titres. Associez les champs, vérifiez puis confirmez. Prix en MAD ; références existantes.','ترتيب الأعمدة حر. يجب أن يحتوي أول سطر غير فارغ في الورقة الأولى على العناوين. اربط الحقول وتحقق ثم أكد. الأسعار بالدرهم والمراجع موجودة.')}</p>
    <label className="inline-flex bg-gray-700 text-white rounded px-4 py-2 cursor-pointer text-sm">
      {busy?tr('Traitement…','جار المعالجة…'):tr('Choisir un fichier Excel / CSV','اختر ملف إكسل / CSV')}
      <input type="file" accept=".xlsx,.xls,.csv" disabled={busy} className="sr-only" onChange={e=>{const f=e.currentTarget.files?.[0];e.currentTarget.value='';if(f)void choose(f);}} />
    </label>
    {file&&<p className="text-sm break-all">{file.name}</p>}
    {error&&<p role="alert" className="bg-red-50 text-red-800 p-3 rounded text-sm">{error}</p>}
    {message&&<p role="status" className="bg-green-50 text-green-800 p-3 rounded text-sm">{message}</p>}
    {inspect&&<>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{fields.map(f=><label key={f} className="text-sm font-medium min-w-0">{labels[f]}
        <select disabled={busy} value={mapping[f]} onChange={e=>{setMapping(m=>({...m,[f]:Number(e.target.value)}));setPreview(null);setError('');}} className="block w-full border rounded p-2 mt-1">
          <option value={-1}>{tr('Choisir une colonne','اختر عموداً')}</option>
          {inspect.headers.map((h,i)=><option value={i} key={i}>{i+1} — {h||tr('Sans titre','بدون عنوان')}</option>)}
        </select>
      </label>)}</div>
      <div className="store-table-scroll overflow-auto" tabIndex={0}><table className="store-data-table w-full text-sm"><thead><tr>{inspect.headers.map((h,i)=><th key={i} className="p-2 whitespace-nowrap">{i+1} — {h}</th>)}</tr></thead><tbody>{inspect.sample.map((r,i)=><tr key={i}>{r.map((v,j)=><td key={j} className="p-2 whitespace-nowrap">{v}</td>)}</tr>)}</tbody></table></div>
      <button type="button" disabled={busy||!validMapping(mapping,inspect.headers.length)} onClick={verify} className="bg-blue-700 text-white rounded px-4 py-2 disabled:opacity-50">{tr('Vérifier les lignes','تحقق من الأسطر')}</button>
    </>}
    {preview&&<div className="border rounded p-3 space-y-2">
      <p className="font-medium">{tr('Lignes valides','الأسطر الصالحة')}: {preview.valid}/{preview.count} · {money(preview.total)} MAD</p>
      {preview.issues.length>0&&<div role="alert" className="bg-red-50 rounded p-3 text-red-800 text-sm max-h-48 overflow-auto">{tr('Corrigez ces lignes avant importation.','صحح هذه الأسطر قبل الاستيراد.')}{preview.issues.map(i=><p key={i.line}>{tr('Ligne','السطر')} {i.line}: {explain(i.reason)}</p>)}</div>}
      <div className="store-table-scroll overflow-auto" tabIndex={0}><table className="store-data-table w-full min-w-[480px] text-sm"><thead><tr>{[tr('Ligne','السطر'),labels.supplier,labels.reference,labels.quantity,labels.unitCost,tr('Total MAD','الإجمالي بالدرهم')].map(h=><th key={h} className="p-2">{h}</th>)}</tr></thead><tbody>{preview.rows.map(r=><tr key={r.line}><td className="p-2">{r.line}</td><td className="p-2">{r.supplier}</td><td className="p-2">{r.reference}</td><td className="p-2">{r.quantity}</td><td className="p-2">{money(r.unitCost)}</td><td className="p-2">{money(r.total)}</td></tr>)}</tbody></table></div>
      <p className="text-sm text-amber-800">{tr('La confirmation crée les achats, les fournisseurs manquants et augmente le stock. Ne réimportez pas un fichier déjà traité.','التأكيد ينشئ المشتريات والموردين الناقصين ويزيد المخزون. لا تستورد الملف نفسه مرتين.')}</p>
      <button type="button" disabled={busy||preview.issues.length>0||preview.valid===0} onClick={commit} className="bg-green-600 text-white rounded px-4 py-2 disabled:opacity-50">{tr('Confirmer l’importation','تأكيد الاستيراد')}</button>
    </div>}
  </section>;
}
