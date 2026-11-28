const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {randomUUID}=require('node:crypto');
const {createInterface}=require('node:readline/promises');
const {Writable}=require('node:stream');
const {config}=require('./config.cjs');
const {createRequire}=require('node:module');
const appRequire=createRequire(path.join(__dirname,'app','server.js'));
const literal=s=>"'"+String(s).replaceAll("'","''")+"'";
function runPsql(c,sql){
 const env={...process.env};
 for(const k of Object.keys(env))if(k.startsWith('PG'))delete env[k];
 Object.assign(env,c.pg);
 const r=spawnSync('psql',['-X','-w','-qAt','-v','ON_ERROR_STOP=1'],{env,input:sql,encoding:'utf8',maxBuffer:1024*1024,timeout:120000});
 if(r.error||r.status!==0)throw Error('Opération PostgreSQL refusée. Vérifiez la connexion, les droits et le schéma. Aucun détail secret affiché.');
 return r.stdout.trim();
}
async function setup(file,mode,input){
 const c=config(file);
 const identity=runPsql(c,'SELECT current_database();');
 if(identity!==c.pg.PGDATABASE)throw Error('Base inattendue.');
 if(input.confirm!==c.identity)throw Error('Confirmation de la cible incorrecte.');
 if(mode==='existing'){
  const ready=runPsql(c,`SELECT (to_regclass('public."AuthSession"') IS NOT NULL AND to_regclass('public."SupplierInvoice"') IS NOT NULL AND to_regclass('public."SupplierPayment"') IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Client' AND column_name='cin') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Client' AND column_name='address'))::text;`);
  if(ready!=='true')throw Error('Base existante : migrations contrôlées requises. Aucune modification effectuée.');
  const admins=runPsql(c,`SELECT count(*) FROM public."User" WHERE role='admin' AND "isActive";`);
  if(Number(admins)<1)throw Error('Aucun administrateur actif : intervention contrôlée requise.');
  return 'Base existante compatible ; aucune écriture effectuée.';
 }
 if(mode!=='new')throw Error('Mode invalide.');
 const name=String(input.store||'').trim(),fullName=String(input.fullName||'').trim(),email=String(input.email||'').trim().toLowerCase(),password=String(input.password||'');
 if(!name||name.length>200||!fullName||fullName.length>200||email.length>254||!/^\S+@\S+\.\S+$/.test(email)||password.length<12||Buffer.byteLength(password,'utf8')>72||!/[a-z]/.test(password)||!/[A-Z]/.test(password)||!/[0-9]/.test(password)||!/[\W_]/.test(password))throw Error('Informations administrateur invalides (12 caractères, majuscule, minuscule, chiffre, symbole).');
 const schema=fs.readFileSync(path.join(__dirname,'schema-fresh.sql'),'utf8');
 const checks=fs.readFileSync(path.join(__dirname,'schema-checks.sql'),'utf8');
 const bcrypt=appRequire('bcryptjs'),hash=await bcrypt.hash(password,12),store=randomUUID(),user=randomUUID();
 runPsql(c,`BEGIN;
 SELECT pg_advisory_xact_lock(673901234);
 SET LOCAL search_path TO public;
 SET LOCAL standard_conforming_strings=on;
 DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','f','S')) THEN RAISE EXCEPTION 'Database not empty'; END IF;
 END $$;
 ${schema}
 ${checks}
 INSERT INTO "Store" (id,name,currency,"vatRate") VALUES (${literal(store)},${literal(name)},'MAD',20);
 INSERT INTO "User" (id,"storeId",email,password,"fullName",role,"isActive") VALUES (${literal(user)},${literal(store)},${literal(email)},${literal(hash)},${literal(fullName)},'admin',true);
 COMMIT;`);
 return 'Magasin et administrateur créés dans une base vide.';
}
async function main(){
 const file=process.argv[2],mode=process.argv[3];
 if(!['new','existing'].includes(mode))throw Error('Utilisation : node setup-server.cjs chemin-absolu-server.env new|existing');
 const c=config(file);
 let input;
 if(process.argv[4]==='--input-stdin'&&!process.stdin.isTTY){
  // Automation: secrets supplied on stdin, never command-line arguments.
  input=JSON.parse(fs.readFileSync(0,'utf8'));
 }else{
  if(!process.stdin.isTTY)throw Error('Terminal interactif requis.');
  let mute=false;
  const out=new Writable({write(chunk,_enc,cb){if(!mute)process.stdout.write(chunk);cb();}});
  const rl=createInterface({input:process.stdin,output:out,terminal:true});
  try{
   console.log('Cible : '+c.identity);
   input={confirm:await rl.question('Retapez exactement cette cible : ')};
   if(mode==='new'){
    input.store=await rl.question('Nom du magasin : ');
    input.fullName=await rl.question('Nom complet de l’administrateur : ');
    input.email=await rl.question('E-mail : ');
    process.stdout.write('Mot de passe (masqué) : ');mute=true;input.password=await rl.question('');mute=false;process.stdout.write('\n');
    process.stdout.write('Confirmez le mot de passe : ');mute=true;const confirmation=await rl.question('');mute=false;process.stdout.write('\n');
    if(confirmation!==input.password)throw Error('Les mots de passe ne correspondent pas.');
   }
  }finally{rl.close();}
 }
 console.log(await setup(file,mode,input));
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={setup};
