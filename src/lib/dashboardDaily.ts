export const TZ='Africa/Casablanca';
export const cities=[
 {id:'agadir',fr:'Agadir',ar:'أكادير',lat:30.4278,lon:-9.5981},
 {id:'casablanca',fr:'Casablanca',ar:'الدار البيضاء',lat:33.5731,lon:-7.5898},
 {id:'rabat',fr:'Rabat',ar:'الرباط',lat:34.0209,lon:-6.8416},
 {id:'marrakech',fr:'Marrakech',ar:'مراكش',lat:31.6295,lon:-7.9811},
 {id:'fes',fr:'Fès',ar:'فاس',lat:34.0331,lon:-5.0003},
 {id:'tanger',fr:'Tanger',ar:'طنجة',lat:35.7595,lon:-5.8340},
 {id:'meknes',fr:'Meknès',ar:'مكناس',lat:33.8935,lon:-5.5473},
 {id:'oujda',fr:'Oujda',ar:'وجدة',lat:34.6814,lon:-1.9086},
 {id:'kenitra',fr:'Kénitra',ar:'القنيطرة',lat:34.2610,lon:-6.5802},
 {id:'tetouan',fr:'Tétouan',ar:'تطوان',lat:35.5785,lon:-5.3684},
 {id:'safi',fr:'Safi',ar:'آسفي',lat:32.2994,lon:-9.2372},
 {id:'eljadida',fr:'El Jadida',ar:'الجديدة',lat:33.2316,lon:-8.5007},
 {id:'benimellal',fr:'Béni Mellal',ar:'بني ملال',lat:32.3373,lon:-6.3498},
 {id:'nador',fr:'Nador',ar:'الناظور',lat:35.1681,lon:-2.9335},
 {id:'taroudant',fr:'Taroudant',ar:'تارودانت',lat:30.4703,lon:-8.8770},
 {id:'tiznit',fr:'Tiznit',ar:'تيزنيت',lat:29.6974,lon:-9.7322},
 {id:'essaouira',fr:'Essaouira',ar:'الصويرة',lat:31.5085,lon:-9.7595}
] as const;
export const prayers=[{key:'Fajr',fr:'Fajr',ar:'الفجر'},{key:'Sunrise',fr:'Chourouq',ar:'الشروق'},{key:'Dhuhr',fr:'Dohr',ar:'الظهر'},{key:'Asr',fr:'Asr',ar:'العصر'},{key:'Maghrib',fr:'Maghrib',ar:'المغرب'},{key:'Isha',fr:'Icha',ar:'العشاء'}] as const;
export type PrayerKey=typeof prayers[number]['key'];
export type Schedule=Record<PrayerKey,string>;
export type DailyData={city:string;date:string;weather:{temperature:number;symbol:string;min:number;max:number;time:string}|null;weatherStatus:'ok'|'disabled'|'unavailable';today:Schedule|null;tomorrow:Schedule|null};
export function cityById(id:string){return cities.find(c=>c.id===id);}
export function localParts(now:Date){
 const p=new Intl.DateTimeFormat('en-GB',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(now);
 const g=(k:string)=>p.find(x=>x.type===k)?.value||'';
 return {date:g('year')+'-'+g('month')+'-'+g('day'),seconds:Number(g('hour'))*3600+Number(g('minute'))*60+Number(g('second'))};
}
export function nextDate(date:string){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10);}
export function parseSchedule(value:unknown):Schedule|null {
 if(!value||typeof value!=='object')return null;
 const v=value as Record<string,unknown>;const result={} as Schedule;
 for(const p of prayers){const raw=v[p.key];if(typeof raw!=='string')return null;const m=raw.match(/^(\d{2}:\d{2})(?:\s.*)?$/);if(!m||!/^([01]\d|2[0-3]):[0-5]\d$/.test(m[1]))return null;result[p.key]=m[1];}
 return result;
}
const seconds=(s:string)=>Number(s.slice(0,2))*3600+Number(s.slice(3))*60;
export function nextPrayer(now:Date,today:Schedule|null,tomorrow:Schedule|null){
 const local=localParts(now);if(!today)return null;
 for(const p of prayers){if(p.key==='Sunrise')continue;const delta=seconds(today[p.key])-local.seconds;if(delta>0)return {key:p.key,seconds:delta};}
 if(!tomorrow)return null;
 // Resolve tomorrow's Fajr in Casablanca even on clock-change days.
 const target=nextDate(local.date);
 const wall=Date.parse(target+'T'+tomorrow.Fajr+':00Z');
 for(let offset=-120;offset<=120;offset+=30){const candidate=new Date(wall+offset*60000);const p=localParts(candidate);if(p.date===target&&p.seconds===seconds(tomorrow.Fajr)&&candidate.getTime()>now.getTime())return {key:'Fajr' as const,seconds:Math.ceil((candidate.getTime()-now.getTime())/1000)};}
 return null;
}
