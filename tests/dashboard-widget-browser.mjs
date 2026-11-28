import {chromium,webkit,devices} from '@playwright/test';
import assert from 'node:assert/strict';
const schedule={Fajr:'06:20',Sunrise:'07:50',Dhuhr:'13:20',Asr:'16:10',Maghrib:'18:40',Isha:'20:00'};
const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Casablanca',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
for(const [engine,options,label] of [[chromium,{viewport:{width:1366,height:768}},'Desktop Chromium'],[webkit,devices['iPhone 13'],'iPhone WebKit']]){
 const browser=await engine.launch({headless:true});
 try{
  const context=await browser.newContext(options);
  await context.addCookies([{name:'gm_session',value:'test-admin',url:'http://127.0.0.1:3100'}]);
  await context.route('**/api/dashboard/daily?*',route=>{const city=new URL(route.request().url()).searchParams.get('city');return route.fulfill({json:{city,date,today:schedule,tomorrow:schedule,weather:{temperature:22,min:15,max:24,symbol:'fair_day',time:new Date().toISOString()},weatherStatus:'ok'}});});
  const page=await context.newPage();
  await page.goto('http://127.0.0.1:3100/dashboard');
  const widget=page.getByTestId('daily-widget');
  await widget.waitFor();
  await widget.getByText('22 °C',{exact:false}).waitFor();
  assert.equal(await page.getByTestId('daily-city').inputValue(),'agadir');
  await page.getByTestId('daily-city').selectOption('rabat');
  await page.reload();
  await widget.getByText('22 °C',{exact:false}).waitFor();
  assert.equal(await page.getByTestId('daily-city').inputValue(),'rabat');
  assert.ok(await widget.evaluate(el=>el.scrollWidth<=el.clientWidth+1));
  await context.addCookies([{name:'lang',value:'ar',url:'http://127.0.0.1:3100'}]);
  await page.reload();
  await widget.getByText('معلومات اليوم').waitFor();
  assert.ok(await widget.evaluate(el=>el.scrollWidth<=el.clientWidth+1));
  console.log(label+' FR/AR, weather fixture, city persistence and layout passed');
 }finally{await browser.close();}
}
