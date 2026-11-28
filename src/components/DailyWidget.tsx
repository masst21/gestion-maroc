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
 const clock=now?new Intl.DateTimeFormat(locale,{timeZone:TZ,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now):'—';
 const greg=now?new Intl.DateTimeFormat(locale,{timeZone:TZ,weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(now):'—';
 const hijri=now?new Intl.DateTimeFormat(locale+'-u-ca-islamic-civil',{timeZone:TZ,day:'numeric',month:'long',year:'numeric'}).format(now):'—';
 const w=current?.weather;
 const symbol=w?.symbol||'';
 const condition=symbol.includes('thunder')?['⛈️',tr('Orage','عواصف')]:symbol.includes('rain')||symbol.includes('sleet')?['🌧️',tr('Pluie','أمطار')]:symbol.includes('snow')?['❄️',tr('Neige','ثلوج')]:symbol.includes('fog')?['🌫️',tr('Brouillard','ضباب')]:symbol.includes('partly')||symbol.includes('fair')?['⛅',tr('Éclaircies','غائم جزئيا')]:symbol.includes('cloud')?['☁️',tr('Nuageux','غائم')]:symbol.includes('clear')?['☀️',tr('Ciel dégagé','سماء صافية')]:['🌡️',tr('Prévision','توقعات')];
 const prayer=next?prayers.find(p=>p.key===next.key):null;
 const prayerDate=now&&next?localParts(new Date(now.getTime()+next.seconds*1000)).date:null;
 const prayerTime=next?(prayerDate===date?current?.today:current?.tomorrow)?.[next.key]:null;
 return <section data-testid="daily-widget" aria-label={tr('Informations du jour','معلومات اليوم')} className="relative inline-flex max-w-full min-w-0 items-center gap-2 sm:gap-3 rounded-lg border bg-white px-2.5 py-1.5 text-sm shadow-sm">
  <time data-testid="daily-clock" dir="ltr" className="font-semibold tabular-nums whitespace-nowrap text-gray-900">{clock}</time>
  <span aria-hidden="true" className="h-5 w-px shrink-0 bg-gray-200"/>
  <details className="relative shrink-0">
   <summary data-testid="daily-details" aria-label={tr('Météo et choix de ville','الطقس واختيار المدينة')} className="flex cursor-pointer list-none items-center gap-1 whitespace-nowrap rounded px-0.5 text-sky-900 focus-visible:outline focus-visible:outline-2 [&::-webkit-details-marker]:hidden">
    <span aria-hidden="true">{w?condition[0]:'🌡️'}</span>
    <span data-testid="daily-temperature" dir="ltr" className="font-semibold tabular-nums">{w?Math.round(w.temperature)+' °C':'— °C'}</span>
   </summary>
   <div className="absolute top-full left-1/2 z-20 mt-2 w-56 -translate-x-1/2 rounded-lg border bg-white p-3 text-xs text-gray-700 shadow-lg space-y-2">
    <label className="flex flex-col gap-1">{tr('Ville','المدينة')}<select data-testid="daily-city" value={city} onChange={e=>{setCity(e.target.value);setData(null);setError(false);try{localStorage.setItem('gm-dashboard-city',e.target.value);}catch{}}} className="w-full rounded border bg-white p-1.5 text-sm">{cities.map(c=><option key={c.id} value={c.id}>{c[lang]}</option>)}</select></label>
    <p>{greg}<br/>{hijri} · {tr('Hégirien estimé','هجري تقريبي')}</p>
    <p>{w?condition[1]:current?.weatherStatus==='disabled'?tr('Météo à activer','يلزم تفعيل الطقس'):tr('Météo indisponible','الطقس غير متاح')}{error?' · '+tr('Actualisation impossible','تعذر التحديث'):''}</p>
    <p><a className="underline" href="https://api.met.no/" target="_blank" rel="noreferrer">MET Norway</a> · <a className="underline" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a> · {tr('prévision arrondie','توقعات مقربة')}</p>
    <p>{tr('Prières calculées : AlAdhan, méthode Maroc (21).','مواقيت محسوبة: الأذان، طريقة المغرب (21).')} <a className="underline" href="https://www.habous.gov.ma/" target="_blank" rel="noreferrer">{tr('Habous','وزارة الأوقاف')}</a></p>
   </div>
  </details>
  <span aria-hidden="true" className="h-5 w-px shrink-0 bg-gray-200"/>
  <span data-testid="daily-next-prayer" aria-label={tr('Prochaine prière (horaire calculé)','الصلاة القادمة (وقت محسوب)')} className="flex min-w-0 flex-wrap items-center gap-x-1 text-xs sm:text-sm font-semibold text-emerald-800">
   <span>{prayer?.[lang]||'—'}</span><span dir="ltr" className="tabular-nums whitespace-nowrap">{prayerTime||'—'}</span>
  </span>
 </section>;
}
