import {NextResponse} from 'next/server';
import {cityById,localParts,nextDate,parseSchedule,TZ,type DailyData} from '@/lib/dashboardDaily';
export const dynamic='force-dynamic';
async function json(url:string,seconds:number,headers?:Record<string,string>){
 const r=await fetch(url,{headers,next:{revalidate:seconds},signal:AbortSignal.timeout(7000)});
 if(!r.ok)throw new Error('UPSTREAM');return r.json();
}
async function schedule(city:NonNullable<ReturnType<typeof cityById>>,date:string){
 try{
  const [y,m,d]=date.split('-');
  const q=new URLSearchParams({latitude:String(city.lat),longitude:String(city.lon),method:'21',school:'0',timezonestring:TZ});
  const v=await json('https://api.aladhan.com/v1/timings/'+[d,m,y].join('-')+'?'+q,21600);
  return v?.data?.date?.gregorian?.date===[d,m,y].join('-')?parseSchedule(v.data.timings):null;
 }catch{return null;}
}
async function weather(city:NonNullable<ReturnType<typeof cityById>>):Promise<DailyData['weather']>{
 try{
  const q=new URLSearchParams({lat:String(city.lat),lon:String(city.lon)});
  const v=await json('https://api.met.no/weatherapi/locationforecast/2.0/compact?'+q,21600,{'User-Agent':'MonMagasin/1.0 github.com/masst21/gestion-maroc'});
  const rows=v?.properties?.timeseries;if(!Array.isArray(rows)||!rows.length)return null;
  const current=rows[0];const temperature=current?.data?.instant?.details?.air_temperature;
  if(typeof temperature!=='number'||!Number.isFinite(temperature)||typeof current.time!=='string')return null;
  const temps=rows.filter((x:any)=>Date.parse(x.time)<=Date.parse(current.time)+86400000).map((x:any)=>x.data?.instant?.details?.air_temperature).filter((n:unknown):n is number=>typeof n==='number'&&Number.isFinite(n));
  if(!temps.length)return null;
  const symbol=current.data?.next_1_hours?.summary?.symbol_code||current.data?.next_6_hours?.summary?.symbol_code||'';
  return {temperature,symbol:typeof symbol==='string'?symbol:'',min:Math.min(...temps),max:Math.max(...temps),time:current.time};
 }catch{return null;}
}
export async function GET(req:Request){
 const city=cityById(new URL(req.url).searchParams.get('city')||'agadir');
 if(!city)return NextResponse.json({error:'UNKNOWN_CITY'},{status:400});
 const date=localParts(new Date()).date;
 const enabled=process.env.DASHBOARD_MET_TERMS_ACCEPTED==='true';
 const [w,today,tomorrow]=await Promise.all([enabled?weather(city):Promise.resolve(null),schedule(city,date),schedule(city,nextDate(date))]);
 const data:DailyData={city:city.id,date,weather:w,weatherStatus:w?'ok':enabled?'unavailable':'disabled',today,tomorrow};
 return NextResponse.json(data,{headers:{'Cache-Control':'public, s-maxage=300, stale-while-revalidate=60'}});
}
