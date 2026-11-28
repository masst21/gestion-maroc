const fs=require('node:fs');
const path=require('node:path');
const {spawn}=require('node:child_process');
const config=process.argv[2];
if(!config||!path.isAbsolute(config)||!fs.existsSync(config)){console.error('Provide the absolute path to your private server.env.');process.exit(1);}
if(typeof process.loadEnvFile!=='function'){console.error('Node.js 22 is required.');process.exit(1);}
try{
 // Do not silently inherit a different database or port.
 for(const k of ['DATABASE_URL','PORT','HOSTNAME','DASHBOARD_MET_TERMS_ACCEPTED'])delete process.env[k];
 process.loadEnvFile(config);
 const u=new URL(process.env.DATABASE_URL||'');
 if(!['postgresql:','postgres:'].includes(u.protocol)||!u.username||!u.password||!u.pathname.slice(1)||['USER','PASSWORD','DATABASE'].some(x=>[u.username,u.password,u.pathname.slice(1)].includes(x)))throw Error('invalid configuration');
 const port=Number(process.env.PORT||3010);
 if(!Number.isInteger(port)||port<1024||port>65535||!['127.0.0.1','localhost'].includes(process.env.HOSTNAME||'127.0.0.1'))throw Error('invalid bind');
 process.env.PORT=String(port);process.env.HOSTNAME='127.0.0.1';process.env.NODE_ENV='production';
 const cwd=path.join(__dirname,'app'),entry=path.join(cwd,'server.js');
 if(!fs.existsSync(entry))throw Error('missing server');
 const child=spawn(process.execPath,[entry],{cwd,stdio:'inherit',env:process.env});
 child.on('error',()=>{console.error('Server startup failed.');process.exitCode=1;});
 child.on('exit',code=>{process.exitCode=code??1;});
 for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>child.kill(signal));
}catch{console.error('Invalid server configuration or missing application. No migration was run.');process.exit(1);}
