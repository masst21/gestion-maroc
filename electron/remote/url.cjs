const net=require('node:net');
function normalizeServer(value){
 if(typeof value!=='string'||value.length>2048)throw Error('Adresse invalide.');
 let u;try{u=new URL(value.trim());}catch{throw Error('Adresse invalide. Exemple : https://magasin.exemple.ma');}
 if(u.username||u.password||u.search||u.hash||u.pathname!=='/')throw Error('Indiquez uniquement l’adresse du serveur, sans chemin ni identifiants.');
 const loopback=['localhost','127.0.0.1','[::1]'].includes(u.hostname);
 if(u.protocol!=='https:'&&!(u.protocol==='http:'&&loopback))throw Error('HTTPS est obligatoire hors de cet ordinateur.');
 return u.origin;
}
module.exports={normalizeServer};
