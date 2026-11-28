const fs=require('node:fs');
const path=require('node:path');
const {parseEnv}=require('node:util');
function config(file){
 if(!file||!path.isAbsolute(file)||!fs.statSync(file).isFile())throw Error('Configuration privée introuvable.');
 const v=parseEnv(fs.readFileSync(file,'utf8'));
 const u=new URL(v.DATABASE_URL||'');
 if(!['postgresql:','postgres:'].includes(u.protocol)||!u.username||!u.password||!u.pathname.slice(1)||u.hash||['USER','PASSWORD','DATABASE'].some(x=>[u.username,u.password,u.pathname.slice(1)].includes(x)))throw Error('Configuration PostgreSQL invalide.');
 const db=decodeURIComponent(u.pathname.slice(1)),host=u.hostname.replace(/^\[|\]$/g,'');
 const port=Number(v.PORT||3010);
 if(!Number.isInteger(port)||port<1024||port>65535||!['127.0.0.1','localhost'].includes(v.HOSTNAME||'127.0.0.1'))throw Error('Port ou adresse locale invalide.');
 const ssl=u.searchParams.get('sslmode')||'disable';
 if(!['127.0.0.1','localhost','::1'].includes(host)&&ssl!=='verify-full')throw Error('Base distante : sslmode=verify-full obligatoire pour cette distribution.');
 if(!['disable','require','verify-ca','verify-full'].includes(ssl))throw Error('Mode SSL invalide.');
 for(const key of u.searchParams.keys())if(!['sslmode','schema','sslrootcert'].includes(key))throw Error('Paramètre PostgreSQL non pris en charge par cet assistant.');
 if((u.searchParams.get('schema')||'public')!=='public')throw Error('Seul le schéma public est pris en charge.');
 const pg={PGHOST:host,PGPORT:u.port||'5432',PGDATABASE:db,PGUSER:decodeURIComponent(u.username),PGPASSWORD:decodeURIComponent(u.password),PGSSLMODE:ssl,PGCONNECT_TIMEOUT:'10'};
 if(u.searchParams.has('sslrootcert'))pg.PGSSLROOTCERT=u.searchParams.get('sslrootcert');
 return {databaseUrl:v.DATABASE_URL,port,weather:v.DASHBOARD_MET_TERMS_ACCEPTED==='true'?'true':'false',pg,identity:host+':'+pg.PGPORT+'/'+db};
}
module.exports={config};
