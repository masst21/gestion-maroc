const assert=require('node:assert/strict');
const {normalizeServer}=require('../electron/remote/url.cjs');
assert.equal(normalizeServer('https://magasin.example.ma/'),'https://magasin.example.ma');
assert.equal(normalizeServer('http://127.0.0.1:3010'),'http://127.0.0.1:3010');
for(const u of ['http://192.168.1.2:3010','file:///etc/passwd','javascript:alert(1)','https://user:pass@example.com','https://example.com/path','https://example.com/?x=1','https://example.com/#a'])assert.throws(()=>normalizeServer(u));
console.log('Remote URL validation passed');
