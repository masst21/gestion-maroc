const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('serverSetup',{read:()=>ipcRenderer.invoke('remote-config:read'),save:value=>ipcRenderer.invoke('remote-config:save',value)});
