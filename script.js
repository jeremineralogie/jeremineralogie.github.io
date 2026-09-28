document.querySelectorAll('[data-search]').forEach(input=>input.addEventListener('keydown',e=>{if(e.key==='Enter'&&input.value.trim())location.href='recherche.html?q='+encodeURIComponent(input.value.trim())}));
document.querySelectorAll('[data-demo-form]').forEach(f=>f.addEventListener('submit',e=>{e.preventDefault();let s=f.querySelector('[data-success]');if(s)s.hidden=false}));
