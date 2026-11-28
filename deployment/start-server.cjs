const fs=require('node:fs');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {config}=require('./config.cjs');
try{
 const c=config(process.argv[2]),cwd=path.join(__dirname,'app'),entry=path.join(cwd,'server.js');
 if(!fs.existsSync(entry))throw Error('Serveur introuvable.');
 const child=spawn(process.execPath,[entry],{cwd,stdio:'inherit',env:{...process.env,DATABASE_URL:c.databaseUrl,PORT:String(c.port),HOSTNAME:'127.0.0.1',NODE_ENV:'production',DASHBOARD_MET_TERMS_ACCEPTED:c.weather}});
 child.on('error',()=>{console.error('Démarrage impossible.');process.exitCode=1;});
 child.on('exit',code=>{process.exitCode=code??1;});
 for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>child.kill(signal));
}catch{console.error('Configuration serveur invalide ou application absente. Aucune migration lancée.');process.exit(1);}
