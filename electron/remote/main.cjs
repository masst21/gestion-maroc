const {app,BrowserWindow,Menu,ipcMain,dialog,session}=require('electron');
const path=require('node:path');
const fs=require('node:fs');
const {normalizeServer}=require('./url.cjs');
let win,settings,origin='';
const configFile=()=>path.join(app.getPath('userData'),'server.json');
function load(){
 try{return normalizeServer(JSON.parse(fs.readFileSync(configFile(),'utf8')).server);}catch{return '';}
}
function sameOrigin(url){try{return new URL(url).origin===origin&&!!origin;}catch{return false;}}
function openServer(){
 if(!win||win.isDestroyed()){
  win=new BrowserWindow({width:1400,height:900,show:false,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});
  win.webContents.on('will-navigate',(e,url)=>{if(!sameOrigin(url))e.preventDefault();});
  win.webContents.on('will-redirect',(e,url)=>{if(!sameOrigin(url))e.preventDefault();});
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('did-fail-load',(_e,code,_description,_url,mainFrame)=>{if(mainFrame&&code!==-3&&!settings)dialog.showErrorBox('Connexion impossible','Vérifiez le réseau, le certificat HTTPS et l’adresse dans Serveur > Configuration.');});
  win.on('closed',()=>{win=null;});
 }
 win.loadURL(origin).catch(()=>{});
 win.show();
}
function configure(){
 if(settings){settings.focus();return;}
 settings=new BrowserWindow({width:570,height:300,resizable:false,parent:win||undefined,modal:!!win,webPreferences:{preload:path.join(__dirname,'preload.cjs'),sandbox:true,contextIsolation:true,nodeIntegration:false}});
 settings.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 settings.webContents.on('will-navigate',e=>e.preventDefault());
 settings.loadFile(path.join(__dirname,'setup.html'));
 settings.on('closed',()=>{settings=null;if(!win&&!origin)app.quit();});
}
function settingsOnly(event){if(!settings||event.sender!==settings.webContents)throw Error('Accès refusé.');}
ipcMain.handle('remote-config:read',event=>{settingsOnly(event);return origin;});
ipcMain.handle('remote-config:save',async(event,value)=>{
 settingsOnly(event);
 try{
  const next=normalizeServer(value);
  fs.mkdirSync(app.getPath('userData'),{recursive:true});
  const file=configFile(),tmp=file+'.tmp';
  fs.writeFileSync(tmp,JSON.stringify({server:next}),{mode:0o600});
  fs.renameSync(tmp,file);
  if(win&&next!==origin){win.destroy();win=null;}
  origin=next;openServer();setImmediate(()=>settings?.close());
  return {ok:true};
 }catch(e){return {ok:false,error:e.message};}
});
if(!app.requestSingleInstanceLock())app.quit();
else app.whenReady().then(()=>{
 origin=load();
 const s=session.defaultSession;
 s.setPermissionCheckHandler((_wc,permission,requestingOrigin,details)=>permission==='media'&&sameOrigin(requestingOrigin)&&details?.mediaType==='video');
 s.setPermissionRequestHandler((wc,permission,callback,details)=>callback(wc===win?.webContents&&permission==='media'&&sameOrigin(details.requestingUrl)&&details.mediaTypes?.length===1&&details.mediaTypes[0]==='video'));
 Menu.setApplicationMenu(Menu.buildFromTemplate([{label:'Serveur',submenu:[{label:'Configuration',click:configure},{role:'reload',label:'Actualiser'},{role:'quit',label:'Quitter'}]},{label:'Affichage',submenu:[{role:'resetZoom'},{role:'zoomIn'},{role:'zoomOut'},{role:'togglefullscreen'}]}]));
 if(origin)openServer();else configure();
});
app.on('second-instance',()=>{(settings||win)?.focus();});
app.on('window-all-closed',()=>{if(!settings)app.quit();});
