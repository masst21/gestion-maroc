// Download pinned, public OCR assets during the build, never client identity data.
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'mon-magasin-ocr-'));
const dest=path.resolve(__dirname,'../public/ocr');
const npm=process.platform==='win32'?'npm.cmd':'npm';
function pack(spec,folder){
  const cwd=path.join(tmp,folder);fs.mkdirSync(cwd);
  const info=JSON.parse(execFileSync(npm,['pack','--ignore-scripts','--json',spec],{cwd,encoding:'utf8',shell:process.platform==='win32'}));
  execFileSync('tar',['-xf',path.join(cwd,info[0].filename),'-C',cwd]);
  return path.join(cwd,'package');
}
try{
  const js=pack('tesseract.js@6.0.1','js'),core=pack('tesseract.js-core@6.0.0','core');
  const out=path.join(tmp,'assets');fs.mkdirSync(out);
  const copy=(src,name)=>fs.copyFileSync(src,path.join(out,name));
  for(const file of ['tesseract.min.js','worker.min.js'])copy(path.join(js,'dist',file),file);
  for(const file of fs.readdirSync(core).filter(x=>/\.wasm(\.js)?$/.test(x)))copy(path.join(core,file),file);
  for(const lang of ['fra','ara']){
    const data=pack('@tesseract.js-data/'+lang+'@1.0.0',lang);
    copy(path.join(data,'4.0.0_best_int',lang+'.traineddata.gz'),lang+'.traineddata.gz');
  }
  fs.mkdirSync(dest,{recursive:true});for(const file of fs.readdirSync(out))fs.copyFileSync(path.join(out,file),path.join(dest,file));
  console.log('Local OCR assets ready.');
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
