const input=document.getElementById('server'),error=document.getElementById('error');
window.serverSetup.read().then(value=>{input.value=value;});
document.getElementById('form').addEventListener('submit',async e=>{e.preventDefault();error.textContent='';try{const r=await window.serverSetup.save(input.value);if(!r.ok)error.textContent=r.error;}catch{error.textContent='Configuration impossible.';}});
