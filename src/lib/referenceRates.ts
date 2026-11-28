import { Prisma } from '@prisma/client';
export type ReferenceRate = {code:string;rate:number;date:string};
export async function getReferenceRates():Promise<ReferenceRate[]> {
  const response=await fetch('https://api.frankfurter.dev/v2/providers/bam/rates?base=MAD',{next:{revalidate:900},signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw new Error('RATE_UNAVAILABLE');
  const data:unknown=await response.json();
  if(!Array.isArray(data))throw new Error('RATE_UNAVAILABLE');
  const rates=new Map<string,ReferenceRate>();
  for(const row of data){
    if(!row||row.base!=='MAD'||typeof row.quote!=='string'||! /^[A-Z]{3}$/.test(row.quote)||row.quote==='MAD'||typeof row.rate!=='number'||!Number.isFinite(row.rate)||row.rate<=0||typeof row.date!=='string'||! /^\d{4}-\d{2}-\d{2}$/.test(row.date))continue;
    const rate=1/row.rate;
    if(!Number.isFinite(rate)||rate<=0)continue;
    const previous=rates.get(row.quote);
    if(!previous||previous.date<row.date)rates.set(row.quote,{code:row.quote,rate,date:row.date});
  }
  if(!rates.has('EUR')||!rates.has('USD'))throw new Error('RATE_UNAVAILABLE');
  return [...rates.values()];
}
export function localDay() {
  return new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Casablanca',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).filter(p=>['year','month','day'].includes(p.type)).reduce((o,p)=>({...o,[p.type]:p.value}),{} as Record<string,string>);
}
export function todayISO(){const d=localDay();return d.year+'-'+d.month+'-'+d.day;}
export async function checkedRate(currency:string, expected:unknown, expectedDate:unknown){
  if(!/^[A-Z]{3}$/.test(currency))throw new Error('INVALID_CURRENCY');
  const today=todayISO();
  if(currency==='MAD')return {rate:new Prisma.Decimal(1),date:new Date(today+'T00:00:00Z')};
  const row=(await getReferenceRates()).find(r=>r.code===currency);
  if(!row)throw new Error('RATE_UNAVAILABLE');
  const rate=new Prisma.Decimal(row.rate.toFixed(10));
  const age=(Date.parse(today)-Date.parse(row.date))/86400000;
  if(!Number.isFinite(age)||age<0||age>7||rate.lte(0)||rate.gte(1e10))throw new Error('RATE_UNAVAILABLE');
  if(typeof expected!=='string'||expected!==rate.toFixed(10)||expectedDate!==row.date)throw new Error('RATE_CHANGED');
  return {rate,date:new Date(row.date+'T00:00:00Z')};
}
