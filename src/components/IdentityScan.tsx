'use client';
import { useState,useRef } from 'react';
import { normalizeCin,validCin } from '@/lib/clientIdentity';
type Worker={recognize(file:Blob):Promise<{data:{text:string}}> ;terminate():Promise<unknown>};
type OCR={createWorker(langs:string[],oem:number,opts:Record<string,unknown>):Promise<Worker>};
let loader:Promise<OCR>|undefined;
function engine():Promise<OCR>{
  const w=window as unknown as {Tesseract?:OCR};
  if(w.Tesseract)return Promise.resolve(w.Tesseract);
  if(!loader)loader=new Promise<OCR>((resolve,reject)=>{
    const script=document.createElement('script');script.src='/ocr/tesseract.min.js';
    script.onload=()=>w.Tesseract?resolve(w.Tesseract):reject(new Error('OCR'));
    script.onerror=()=>reject(new Error('OCR'));document.head.appendChild(script);
  }).catch(e=>{loader=undefined;throw e;});
  return loader;
}
export default function IdentityScan({lang,onApply,disabled}:{lang:'fr'|'ar';onApply:(fields:{name?:string;cin?:string;address?:string})=>void;disabled?:boolean}){
  const tr=(fr:string,ar:string)=>lang==='ar'?ar:fr;
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[progress,setProgress]=useState(0),[raw,setRaw]=useState('');
  const [draft,setDraft]=useState({name:'',cin:'',address:''});
  const running=useRef(false);
  function extract(s:string){
    const lines=s.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
    const get=(re:RegExp)=>{for(let i=0;i<lines.length;i++){const m=lines[i].match(re);if(m){const tail=(m[1]||'').trim();return tail||lines[i+1]||'';}}return '';};
    const direct=get(/^(?:n[°ºo]?\s*(?:de\s+)?(?:cin|cnie)|cin|cnie|رقم البطاقة(?: الوطنية)?|رقم التعريف)\s*[:：-]?\s*(.*)$/i);
    const code=direct.match(/\b[A-Z]{1,3}[ -]?\d{1,10}\b/i)?.[0]||s.match(/\b[A-Z]{1,3}\s?\d{3,8}\b/g)?.filter((v,i,a)=>a.indexOf(v)===i).length===1&&s.match(/\b[A-Z]{1,3}\s?\d{3,8}\b/g)?.[0]||'';
    const first=get(/^(?:pr[ée]nom(?:s)?|first name|الاسم الشخصي)\s*[:：-]?\s*(.*)$/i);
    const last=get(/^(?:nom(?: de famille)?|surname|الاسم العائلي)\s*[:：-]?\s*(.*)$/i);
    const address=get(/^(?:adresse|address|العنوان)\s*[:：-]?\s*(.*)$/i);
    setDraft(d=>({name:[first,last].filter(Boolean).join(' ')||d.name,cin:code&&validCin(normalizeCin(code))?normalizeCin(code):d.cin,address:address||d.address}));
  }
  async function scan(file:File){
    if(running.current||disabled)return;
    if(file.size>15*1024*1024||!file.type.startsWith('image/')){setError(tr('Choisissez une image JPG/PNG lisible (15 Mo maximum).','اختر صورة واضحة حتى 15 ميغابايت.'));return;}
    running.current=true;setBusy(true);setError('');setProgress(0);
    let worker:Worker|undefined;
    try{
      const ocr=await engine();
      const base=window.location.origin+'/ocr';
      worker=await ocr.createWorker(['fra','ara'],1,{workerPath:base+'/worker.min.js',corePath:base,langPath:base,workerBlobURL:false,cacheMethod:'none',logger:(m:{status:string;progress:number})=>{if(m.status==='recognizing text')setProgress(Math.round(m.progress*100));}});
      const result=await worker.recognize(file);
      const text=result.data.text;
      setRaw(v=>[v,text].filter(Boolean).join('\n\n'));extract(text);
    }catch{setError(tr('Lecture impossible. Essayez une image nette, ou saisissez les informations manuellement.','تعذرت القراءة. حاول بصورة واضحة أو أدخل البيانات يدويا.'));}
    finally{try{await worker?.terminate();}catch{}running.current=false;setBusy(false);}
  }
  const fieldClass='block w-full border rounded p-2 mt-1';
  return <section className="border rounded-lg p-3 space-y-3">
    <h3 className="font-semibold">{tr('Scanner la CIN (recto / verso)','مسح البطاقة الوطنية (الوجه والظهر)')}</h3>
    <p className="text-xs text-gray-600">{tr('Lecture locale dans votre navigateur. Photographiez une face à la fois, vérifiez les propositions et corrigez-les. Aucune photo ni texte brut ne sont enregistrés.','تتم القراءة محليا في المتصفح. صور كل وجه على حدة وتحقق من البيانات. لا تحفظ الصورة أو النص الخام.')}</p>
    <div className="flex flex-wrap gap-2">
      <label className="bg-blue-700 text-white rounded px-3 py-2 cursor-pointer text-sm">{tr('📷 Prendre une photo','📷 التقاط صورة')}<input disabled={busy||disabled} type="file" accept="image/*" capture="environment" className="sr-only" onChange={e=>{const f=e.target.files?.[0];e.target.value='';if(f)void scan(f);}}/></label>
      <label className="bg-gray-700 text-white rounded px-3 py-2 cursor-pointer text-sm">{tr('Choisir une image','اختر صورة')}<input disabled={busy||disabled} type="file" accept="image/*" className="sr-only" onChange={e=>{const f=e.target.files?.[0];e.target.value='';if(f)void scan(f);}}/></label>
    </div>
    {busy&&<p role="status" className="text-sm">{tr('Lecture en cours','جار القراءة')}… {progress}%</p>}
    {error&&<p role="alert" className="text-red-800 text-sm">{error}</p>}
    {raw&&<div className="space-y-2">
      <label className="text-sm">{tr('Nom proposé','الاسم المقترح')}<input disabled={busy} className={fieldClass} value={draft.name} onChange={e=>setDraft(d=>({...d,name:e.target.value}))}/></label>
      <label className="text-sm">CIN<input disabled={busy} className={fieldClass} value={draft.cin} onChange={e=>setDraft(d=>({...d,cin:e.target.value}))}/></label>
      <label className="text-sm">{tr('Adresse proposée','العنوان المقترح')}<textarea disabled={busy} className={fieldClass} value={draft.address} onChange={e=>setDraft(d=>({...d,address:e.target.value}))}/></label>
      <details><summary className="text-sm underline cursor-pointer">{tr('Texte lu (pour vérification)','النص المقروء للتحقق')}</summary><textarea readOnly rows={6} className={fieldClass} value={raw}/></details>
      <p className="text-xs text-amber-900">{tr('Les résultats OCR peuvent être inexacts. Vérifiez sur le document original.','قد تكون النتائج غير دقيقة. تحقق من الوثيقة الأصلية.')}</p>
      <button type="button" disabled={busy||disabled||!!draft.cin&&!validCin(normalizeCin(draft.cin))} className="bg-green-600 text-white rounded px-3 py-2 disabled:opacity-50" onClick={()=>{onApply({...(draft.name.trim()?{name:draft.name.trim()}:{}),...(draft.cin?{cin:normalizeCin(draft.cin)}:{}),...(draft.address.trim()?{address:draft.address.trim()}:{})});setRaw('');setDraft({name:'',cin:'',address:''});}}>{tr('Utiliser les informations vérifiées','استخدام البيانات المتحقق منها')}</button>
      <button type="button" disabled={busy} className="px-3 py-2 underline text-sm" onClick={()=>{setRaw('');setDraft({name:'',cin:'',address:''});}}>{tr('Effacer le scan','مسح القراءة')}</button>
    </div>}
  </section>;
}
