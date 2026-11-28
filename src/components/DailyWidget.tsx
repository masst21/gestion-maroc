'use client';
import {useEffect,useState} from 'react';
import {cities,cityById,localParts,nextPrayer,prayers,TZ,type DailyData} from '@/lib/dashboardDaily';
export default function DailyWidget({lang}:{lang:'fr'|'ar'}){
 const tr=(fr:string,ar:string)=>lang==='ar'?ar:fr;
 const [city,setCity]=useState('agadir'),[now,setNow]=useState<Date|null>(null),[data,setData]=useState<DailyData|null>(null),[error,setError]=useState(false);
 useEffect(()=>{setNow(new Date());try{const saved=localStorage.getItem('gm-dashboard-city');if(saved&&cityById(saved))setCity(saved);}catch{}const timer=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(timer);},[]);
 const date=now?localParts(now).date:'';
 useEffect(()=>{
  if(!date)return;let active=true;let controller:AbortController|undefined;
  async function load(){
   controller?.abort();controller=new AbortController();const signal=controller.signal;
   try{const r=await fetch('/api/dashboard/daily?city='+encodeURIComponent(city),{signal,cache:'no-store'});if(!r.ok)throw Error();const v:DailyData=await r.json();if(active&&!signal.aborted){setData(v);setError(false);}}
   catch{if(active&&!signal.aborted)setError(true);}
  }
  void load();const timer=setInterval(load,300000);
  return()=>{active=false;controller?.abort();clearInterval(timer);};
 },[city,date]);
 const current=data?.city===city&&data.date===date?data:null;
 const next=now&&current?nextPrayer(now,current.today,current.tomorrow):null;
 const locale=lang==='ar'?'ar-MA':'fr-MA';
 const clock=now?new Intl.DateTimeFormat(locale,{timeZone:TZ,hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(now):'—';
 const greg=now?new Intl.DateTimeFormat(locale,{timeZone:TZ,weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(now):'—';
 const hijri=now?new Intl.DateTimeFormat(locale+'-u-ca-islamic-civil',{timeZone:TZ,day:'numeric',month:'long',year:'numeric'}).format(now):'—';
 const w=current?.weather;
 const symbol=w?.symbol||'';
 const condition=symbol.includes('thunder')?['⛈️',tr('Orage','عواصف')]:symbol.includes('rain')||symbol.includes('sleet')?['🌧️',tr('Pluie','أمطار')]:symbol.includes('snow')?['❄️',tr('Neige','ثلوج')]:symbol.includes('fog')?['🌫️',tr('Brouillard','ضباب')]:symbol.includes('partly')||symbol.includes('fair')?['⛅',tr('Éclaircies','غائم جزئيا')]:symbol.includes('cloud')?['☁️',tr('Nuageux','غائم')]:symbol.includes('clear')?['☀️',tr('Ciel dégagé','سماء صافية')]:['🌡️',tr('Prévision','توقعات')];
 const duration=next?[Math.floor(next.seconds/3600),Math.floor(next.seconds%3600/60),next.seconds%60].map(x=>String(x).padStart(2,'0')).join(':'):'—';
 return <section data-testid="daily-widget" aria-label={tr('Informations du jour','معلومات اليوم')} className="min-w-0 bg-white rounded-xl border shadow-sm p-3 sm:p-4 space-y-3">
  <div className="flex flex-wrap items-center justify-between gap-2">
   <h2 className="text-sm font-semibold text-gray-800">{tr('Informations du jour','معلومات اليوم')}</h2>
   <label className="flex items-center gap-2 text-xs text-gray-600">{tr('Ville','المدينة')}<select data-testid="daily-city" value={city} onChange={e=>{setCity(e.target.value);setData(null);setError(false);try{localStorage.setItem('gm-dashboard-city',e.target.value);}catch{}}} className="max-w-[150px] border rounded px-2 py-1.5 text-sm bg-white text-gray-900">{cities.map(c=><option key={c.id} value={c.id}>{c[lang]}</option>)}</select></label>
  </div>
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
   <div className="min-w-0 rounded-lg bg-gray-50 p-3">
    <p className="text-xs text-gray-600 capitalize">{greg}</p>
    <p data-testid="daily-clock" dir="ltr" className="text-2xl font-bold tabular-nums text-start text-gray-900">{clock}</p>
    <p className="text-xs text-gray-600">{hijri} · {tr('Hégirien estimé','هجري تقريبي')}</p>
   </div>
   <div className="min-w-0 rounded-lg bg-sky-50 p-3">
    <p className="text-xs text-sky-800 font-semibold">{tr('Météo','الطقس')}</p>
    {w?<><p className="text-xl font-bold text-sky-900">{condition[0]} {Math.round(w.temperature)} °C</p><p className="text-xs text-sky-800">{condition[1]} · {tr('24 h','٢٤ ساعة')} {Math.round(w.min)}° / {Math.round(w.max)}°</p></>:<p className="text-sm text-gray-600">{current?.weatherStatus==='disabled'?tr('Activation météo requise','يلزم تفعيل الطقس'):tr('Météo indisponible','الطقس غير متاح')}</p>}
    <p className="text-[11px] text-gray-600"><a className="underline" href="https://api.met.no/" target="_blank" rel="noreferrer">MET Norway</a> · <a className="underline" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a> · {tr('prévision arrondie','توقعات مقربة')}</p>
   </div>
   <div className="min-w-0 rounded-lg bg-emerald-50 p-3">
    <p className="text-xs font-semibold text-emerald-800">{tr('Prochaine prière','الصلاة القادمة')}</p>
    <p className="font-bold text-emerald-900">{next?prayers.find(p=>p.key===next.key)?.[lang]:'—'}</p>
    <p data-testid="daily-countdown" dir="ltr" className="text-xl font-bold tabular-nums text-start text-emerald-900">{duration}</p>
   </div>
  </div>
  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
   {prayers.map(p=><div key={p.key} className={'min-w-0 text-center rounded-md p-2 '+(next?.key===p.key?'bg-emerald-100 text-emerald-900':'bg-gray-50 text-gray-800')}><p className="text-xs truncate">{p[lang]}</p><p dir="ltr" className="text-sm font-semibold tabular-nums">{current?.today?.[p.key]||'—'}</p></div>)}
  </div>
  <p className="text-[11px] text-gray-600">{tr('Horaires calculés : AlAdhan, méthode Maroc (21). Date hégirienne estimée. Vérifier auprès des','مواقيت محسوبة: الأذان، طريقة المغرب (21). التاريخ الهجري تقريبي. المرجع الرسمي:')} <a className="underline" href="https://www.habous.gov.ma/" target="_blank" rel="noreferrer">{tr('Habous (référence officielle)','وزارة الأوقاف')}</a>. {error&&tr('Actualisation impossible.','تعذر التحديث.')}</p>
 </section>;
}
