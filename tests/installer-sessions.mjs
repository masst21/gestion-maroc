import assert from 'node:assert/strict';
const base='http://127.0.0.1:3100';
async function login(){
 const r=await fetch(base+'/api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:'installer@example.invalid',password:'Synthetic-test-password-123!'})});
 assert.equal(r.status,200);
 const token=r.headers.get('set-cookie')?.match(/gm_session=([a-f0-9]{64})/)?.[1];
 assert.ok(token);return token;
}
const [one,two]=await Promise.all([login(),login()]);
assert.notEqual(one,two);
const req=(p,token,method='GET',body)=>fetch(base+p,{method,headers:{cookie:'gm_session='+token,...(body?{'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
const created=await req('/api/articles',one,'POST',{reference:'INSTALL-TEST',name:'Article fictif',salePriceHt:5,vatRate:0,stockQty:1});
assert.equal(created.status,201);
const list=await req('/api/articles',two);
assert.equal(list.status,200);
assert.ok((await list.json()).some(x=>x.reference==='INSTALL-TEST'));
assert.equal((await req('/api/logout',one,'POST')).status,200);
assert.equal((await req('/api/articles',one)).status,401);
assert.equal((await req('/api/articles',two)).status,200);
console.log('Two independent sessions on restored database: passed');
