import assert from 'node:assert/strict';
import {cityById,localParts,nextDate,nextPrayer,parseSchedule,TZ} from '../src/lib/dashboardDaily';
assert.equal(cityById('agadir')?.fr,'Agadir');
assert.equal(cityById('invalid'),undefined);
assert.equal(nextDate('2026-12-31'),'2027-01-01');
// Morocco changes its UTC offset; test against the runner's IANA time-zone data.
const late=new Date('2026-11-28T23:30:00Z');
const expectedDate=new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(late);
assert.equal(localParts(late).date,expectedDate);
const today=parseSchedule({Fajr:'06:20',Sunrise:'07:50',Dhuhr:'13:20',Asr:'16:10',Maghrib:'18:40',Isha:'20:00'});
assert.ok(today);
assert.equal(parseSchedule({...today,Isha:'99:99'}),null);
// Noon UTC is before Dhuhr for either UTC or UTC+1 in Morocco.
const noon=new Date('2026-11-28T12:00:00Z');
assert.equal(nextPrayer(noon,today,today)?.key,'Dhuhr');
assert.equal(nextPrayer(noon,today,today)?.seconds,13*3600+20*60-localParts(noon).seconds);
// Check the next day's Fajr using absolute elapsed time, not a fixed UTC offset.
const evening=new Date('2026-11-28T22:00:00Z');
const next=nextPrayer(evening,today,today);
assert.equal(next?.key,'Fajr');
assert.ok(next&&next.seconds>0);
const target=localParts(new Date(evening.getTime()+next.seconds*1000));
assert.equal(target.date,nextDate(localParts(evening).date));
assert.equal(target.seconds,6*3600+20*60);
assert.equal(nextPrayer(evening,null,null),null);
console.log('Daily widget date and prayer tests passed');
