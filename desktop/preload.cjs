const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('desktop',{saveCsv:payload=>ipcRenderer.invoke('save-csv',payload)});
