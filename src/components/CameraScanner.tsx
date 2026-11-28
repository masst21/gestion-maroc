'use client';
import {useEffect,useId,useRef,useState} from 'react';
import {Html5Qrcode} from 'html5-qrcode';

export default function CameraScanner({onScan,onClose,lang='fr'}:{onScan:(code:string)=>void;onClose:()=>void;lang?:'fr'|'ar'}) {
  const id='scanner-'+useId().replace(/[^a-zA-Z0-9_-]/g,'');
  const callback=useRef(onScan); callback.current=onScan;
  const fileReader=useRef<((file:File)=>Promise<void>)|null>(null);
  const [error,setError]=useState(false),[busy,setBusy]=useState(false);
  const tr=(fr:string,ar:string)=>lang==='ar'?ar:fr;
  useEffect(()=>{
    let active=true,delivered=false,fileMode=false;
    const scanner=new Html5Qrcode(id);
    let stopping:Promise<void>|undefined;
    function stop(){
      if(!stopping&&scanner.isScanning)stopping=scanner.stop().catch(()=>{}).then(()=>{stopping=undefined;});
      return stopping||Promise.resolve();
    }
    function deliver(code:string){
      if(!active||delivered||!code.trim())return;
      delivered=true;callback.current(code.trim());
    }
    const start=Promise.resolve().then(async()=>{
      if(!active)return;
      const config={fps:10,qrbox:(w:number,h:number)=>({width:Math.min(320,Math.floor(w*0.8)),height:Math.min(180,Math.floor(h*0.65))})};
      const success=(code:string)=>{if(active&&!fileMode&&!delivered){deliver(code);void stop();}};
      try{
        await scanner.start({facingMode:'environment'},config,success,()=>{});
      }catch{
        if(!active||fileMode)return;
        const cameras=await Html5Qrcode.getCameras();
        if(!active||fileMode)return;
        if(!cameras.length)throw new Error('CAMERA');
        await scanner.start(cameras[0].id,config,success,()=>{});
      }
      if(!active||delivered||fileMode)await stop();
    }).catch(()=>{if(active)setError(true);});
    fileReader.current=async file=>{
      if(!active||delivered||fileMode)return;
      fileMode=true;setBusy(true);setError(false);
      try{await start;await stop();if(!active)return;const code=await scanner.scanFile(file,true);deliver(code);}
      catch{if(active)setError(true);}
      finally{fileMode=false;if(active)setBusy(false);}
    };
    return ()=>{
      active=false;fileReader.current=null;
      void start.then(stop).then(()=>{try{scanner.clear();}catch{}});
    };
  },[id]);
  return <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-3" role="dialog" aria-modal="true" aria-label={tr('Scanner un code','مسح الرمز')}>
    <div className="bg-white rounded-xl w-full max-w-md overflow-y-auto max-h-[95vh]">
      <div className="bg-blue-900 text-white p-4 flex justify-between items-center"><h2 className="font-bold">{tr('Scanner un code-barres ou QR','مسح الباركود أو QR')}</h2><button type="button" aria-label={tr('Fermer','إغلاق')} onClick={onClose}>✕</button></div>
      <div className="p-4 space-y-3">
        <div id={id} className="w-full rounded overflow-hidden bg-black"/>
        {error&&<p role="alert" className="text-red-700 text-sm">{tr('Lecture impossible. Vérifiez les permissions caméra, choisissez une image nette ou saisissez le code manuellement.','تعذرت القراءة. تحقق من إذن الكاميرا أو اختر صورة واضحة أو أدخل الرمز يدويا.')}</p>}
        <p className="text-sm text-gray-600">{tr('Placez le code dans le cadre. Caméra : HTTPS ou localhost requis.','ضع الرمز داخل الإطار. تتطلب الكاميرا HTTPS أو localhost.')}</p>
        <label className="block text-sm">{tr('Lire le code depuis une image','قراءة الرمز من صورة')}<input type="file" accept="image/*" disabled={busy} className="block w-full border rounded p-2" onChange={e=>{const f=e.target.files?.[0];e.target.value='';if(f)void fileReader.current?.(f);}}/></label>
        {busy&&<p role="status">{tr('Lecture…','جار القراءة…')}</p>}
        <button type="button" className="w-full bg-gray-200 rounded p-3" onClick={onClose}>{tr('Annuler','إلغاء')}</button>
      </div>
    </div>
  </div>;
}
