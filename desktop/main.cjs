const {app,BrowserWindow,session,ipcMain,dialog,Menu}=require('electron');
const path=require('node:path');
const fs=require('node:fs/promises');
const os=require('node:os');
let win;
app.commandLine.appendSwitch('disable-background-networking');
app.commandLine.appendSwitch('disable-component-update');
app.commandLine.appendSwitch('disable-domain-reliability');
app.commandLine.appendSwitch('no-proxy-server');
const tempProfile=path.join(os.tmpdir(),'fuel-atlas-'+process.pid);
app.setPath('userData',tempProfile);
app.whenReady().then(()=>{
  session.defaultSession.webRequest.onBeforeRequest((details,callback)=>{
    callback({cancel:!['file:','data:','blob:','devtools:'].some(s=>details.url.startsWith(s))});
  });
  session.defaultSession.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));
  Menu.setApplicationMenu(null);
  win=new BrowserWindow({width:1440,height:960,minWidth:900,minHeight:650,title:'지역 주유정보',backgroundColor:'#f3f6f8',show:false,webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,spellcheck:false}});
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',event=>event.preventDefault());
  win.once('ready-to-show',()=>win.show());
  win.loadFile(path.join(__dirname,'../지역주유정보.html'));
});
ipcMain.handle('save-csv',async(event,payload)=>{
  if(event.sender!==win?.webContents || !payload || typeof payload.filename!=='string' || typeof payload.content!=='string')return {error:'잘못된 저장 요청'};
  const name=path.basename(payload.filename).replace(/[<>:"/\\|?*\x00-\x1f]/g,'');
  try{
    const chosen=await dialog.showSaveDialog(win,{title:'지역 CSV 저장',defaultPath:name,filters:[{name:'CSV 파일',extensions:['csv']}]});
    if(chosen.canceled || !chosen.filePath)return {canceled:true};
    await fs.writeFile(chosen.filePath,payload.content,'utf8');
    return {path:chosen.filePath};
  }catch(error){return {error:error.message};}
});
app.on('window-all-closed',()=>app.quit());
app.on('will-quit',()=>{require('node:fs').rmSync(tempProfile,{recursive:true,force:true});});
