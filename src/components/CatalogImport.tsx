'use client';
import { useState } from 'react';
import { columns, validCatalogMapping, type Catalog, type CatalogMapping } from '@/lib/catalogImport';
type Inspection={headers:string[];mapping:CatalogMapping;count:number;sample:string[][]};
type Preview={count:number;valid:number;creates:number;updates:number;issues:{line:number;reason:string;field?:string}[];rows:{line:number;values:Record<string,string|number>;action:'create'|'update'}[]};
export default function CatalogImport({kind,lang,onImported}:{kind:Catalog;lang:'fr'|'ar';onImported:()=>void|Promise<void>}){
  const tr=(fr:string,ar:string)=>lang==='ar'?ar:fr;
  const specs=columns[kind], title=kind==='articles'?tr('Articles','المنتجات'):kind==='clients'?tr('Clients','العملاء'):tr('Fournisseurs','الموردون');
  const [file,setFile]=useState<File|null>(null);
  const [inspection,setInspection]=useState<Inspection|null>(null);
  const [mapping,setMapping]=useState<CatalogMapping>({});
  const [preview,setPreview]=useState<Preview|null>(null);
  const [update,setUpdate]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const messages:Record<string,string>={
    INVALID_FILE:tr('Format XLSX, XLS ou CSV, maximum 3 Mo.','ملف XLSX أو XLS أو CSV حتى 3 ميغابايت.'),
    UNREADABLE_FILE:tr('Fichier illisible. Utilisez CSV UTF-8.','ملف غير قابل للقراءة. استخدم CSV UTF-8.'),
    EMPTY_FILE:tr('Première feuille vide.','الورقة الأولى فارغة.'),
    FILE_LIMIT:tr('Maximum 500 lignes et 100 colonnes.','500 سطر و100 عمود كحد أقصى.'),
    FORBIDDEN:tr('Import réservé aux administrateurs et responsables.','الاستيراد للمديرين والمسؤولين فقط.'),
    INVALID_MAPPING:tr('Associez les champs obligatoires à des colonnes distinctes.','اربط الحقول المطلوبة بأعمدة مختلفة.'),
    INVALID_ROWS:tr('Lignes invalides ou données modifiées depuis la vérification. Aucun import confirmé.','أسطر غير صالحة أو بيانات تغيرت. لم يؤكد الاستيراد.'),
    REQUIRED:tr('Champ obligatoire manquant','حقل مطلوب مفقود'),
    NUMBER:tr('Nombre invalide','عدد غير صالح'),
    FORMAT:tr('Format invalide','صيغة غير صالحة'),
    DUPLICATE:tr('Enregistrement déjà présent','السجل موجود بالفعل'),
    DUPLICATE_FILE:tr('Doublon dans le fichier','تكرار في الملف'),
  };
  const explain=(c:string)=>messages[c]||tr('Opération impossible. Vérifiez les données avant de réessayer.','تعذرت العملية. تحقق من البيانات قبل إعادة المحاولة.');
  async function request(f:File,mode:'inspect'|'preview'|'commit',m?:CatalogMapping){
    const body=new FormData();body.append('file',f);body.append('mode',mode);body.append('update',String(update));if(m)body.append('mapping',JSON.stringify(m));
    const res=await fetch('/api/'+kind+'/import',{method:'POST',body});const data=await res.json();if(!res.ok)throw new Error(data.error||'IMPORT_FAILED');return data;
  }
  async function choose(f:File){setFile(f);setInspection(null);setPreview(null);setMessage('');setError('');setBusy(true);try{const data=await request(f,'inspect');setInspection(data);setMapping(data.mapping);}catch(e){setError(explain(e instanceof Error?e.message:''));}finally{setBusy(false);}}
  async function verify(){if(!file||!inspection||!validCatalogMapping(kind,mapping,inspection.headers.length)||busy)return;setBusy(true);setPreview(null);setError('');try{setPreview(await request(file,'preview',mapping));}catch(e){setError(explain(e instanceof Error?e.message:''));}finally{setBusy(false);}}
  async function commit(){if(!file||!preview||preview.issues.length||!preview.valid||busy)return;setBusy(true);setError('');try{const data=await request(file,'commit',mapping);setMessage(tr('Import réussi : ','تم الاستيراد: ')+data.imported);setFile(null);setInspection(null);setPreview(null);await onImported();}catch(e){setError(explain(e instanceof Error?e.message:''));setPreview(null);}finally{setBusy(false);}}
  const fieldName=(k:string)=>{const c=specs.find(s=>s.key===k);return c?(lang==='ar'?c.ar:c.fr):k;};
  return <section className="bg-white border rounded-xl p-4 space-y-3 mb-4">
    <h2 className="font-semibold">{tr('Importer Excel / CSV — ','استيراد إكسل / CSV — ')}{title}</h2>
    <p className="text-sm text-gray-600">{tr('Colonnes dans n’importe quel ordre. Titres sur la première ligne non vide. Les champs facultatifs non associés sont ignorés.','ترتيب الأعمدة حر. العناوين في أول سطر غير فارغ. الحقول الاختيارية غير المرتبطة يتم تجاهلها.')}</p>
    <label className="inline-flex bg-gray-700 text-white rounded px-4 py-2 cursor-pointer text-sm">{busy?tr('Traitement…','جار المعالجة…'):tr('Choisir un fichier Excel / CSV','اختر ملف إكسل / CSV')}<input type="file" accept=".xlsx,.xls,.csv" disabled={busy} className="sr-only" onChange={e=>{const f=e.currentTarget.files?.[0];e.currentTarget.value='';if(f)void choose(f);}}/></label>
    {file&&<p className="text-sm break-all">{file.name}</p>}
    {error&&<p role="alert" className="bg-red-50 text-red-800 rounded p-3">{error}</p>}
    {message&&<p role="status" className="bg-green-50 text-green-800 rounded p-3">{message}</p>}
    {inspection&&<>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{specs.map(c=><label key={c.key} className="text-sm font-medium min-w-0">{fieldName(c.key)}{c.required?' *':''}<select disabled={busy} className="block w-full border rounded p-2 mt-1" value={mapping[c.key]??-1} onChange={e=>{setMapping(m=>({...m,[c.key]:Number(e.target.value)}));setPreview(null);}}><option value={-1}>{c.required?tr('Choisir une colonne','اختر عموداً'):tr('Ignorer','تجاهل')}</option>{inspection.headers.map((h,i)=><option key={i} value={i}>{i+1} — {h||tr('Sans titre','بدون عنوان')}</option>)}</select></label>)}</div>
      {kind==='articles'&&<label className="flex items-start gap-2 text-sm text-amber-900"><input type="checkbox" checked={update} disabled={busy} onChange={e=>{setUpdate(e.target.checked);setPreview(null);}}/>{tr('Autoriser la mise à jour des références existantes (les stocks et prix renseignés seront remplacés, non additionnés).','السماح بتحديث المراجع الموجودة (تستبدل قيم المخزون والأسعار المدخلة ولا تجمع).')}</label>}
      <div className="store-table-scroll overflow-auto" tabIndex={0}><table className="store-data-table w-full text-sm"><thead><tr>{inspection.headers.map((h,i)=><th className="p-2 whitespace-nowrap" key={i}>{i+1} — {h}</th>)}</tr></thead><tbody>{inspection.sample.map((r,i)=><tr key={i}>{r.map((v,j)=><td className="p-2 whitespace-nowrap" key={j}>{v}</td>)}</tr>)}</tbody></table></div>
      <button type="button" className="bg-blue-700 text-white rounded px-4 py-2 disabled:opacity-50" disabled={busy||!validCatalogMapping(kind,mapping,inspection.headers.length)} onClick={verify}>{tr('Vérifier les lignes','تحقق من الأسطر')}</button>
    </>}
    {preview&&<div className="border rounded p-3 space-y-2">
      <p className="font-medium">{tr('Valides','صالحة')} : {preview.valid}/{preview.count} · {tr('Créations','إنشاء')} : {preview.creates} · {tr('Mises à jour','تحديث')} : {preview.updates}</p>
      {preview.issues.length>0&&<div role="alert" className="bg-red-50 rounded p-3 text-red-800 max-h-48 overflow-auto text-sm">{preview.issues.map((i,j)=><p key={j}>{tr('Ligne','السطر')} {i.line}: {explain(i.reason)} {i.field?'— '+fieldName(i.field):''}</p>)}</div>}
      <div className="store-table-scroll overflow-auto" tabIndex={0}><table className="store-data-table w-full text-sm"><thead><tr><th className="p-2">{tr('Ligne','السطر')}</th><th className="p-2">{tr('Action','الإجراء')}</th>{specs.filter(c=>mapping[c.key]>=0).map(c=><th key={c.key} className="p-2 whitespace-nowrap">{fieldName(c.key)}</th>)}</tr></thead><tbody>{preview.rows.map(r=><tr key={r.line}><td className="p-2">{r.line}</td><td className="p-2">{r.action==='create'?tr('Créer','إنشاء'):tr('Modifier','تعديل')}</td>{specs.filter(c=>mapping[c.key]>=0).map(c=><td key={c.key} className="p-2 whitespace-nowrap">{r.values[c.key]??'—'}</td>)}</tr>)}</tbody></table></div>
      <p className="text-sm text-amber-900">{tr('Aucun enregistrement avant confirmation. Les erreurs bloquent tout le fichier.','لا يتم الحفظ قبل التأكيد. الأخطاء تمنع استيراد الملف بأكمله.')}</p>
      <button type="button" disabled={busy||preview.issues.length>0||!preview.valid} onClick={commit} className="bg-green-600 text-white rounded px-4 py-2 disabled:opacity-50">{tr('Confirmer l’importation','تأكيد الاستيراد')}</button>
    </div>}
  </section>;
}
