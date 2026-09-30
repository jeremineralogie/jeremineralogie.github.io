document.querySelectorAll('[data-search]').forEach(input=>input.addEventListener('keydown',e=>{if(e.key==='Enter'&&input.value.trim())location.href='recherche.html?q='+encodeURIComponent(input.value.trim())}));
document.querySelectorAll('[data-demo-form]').forEach(f=>f.addEventListener('submit',e=>{e.preventDefault();let s=f.querySelector('[data-success]');if(s)s.hidden=false}));
(()=>{const ref=new URLSearchParams(location.search).get('reference');if(!ref||!/contact\.html$/.test(location.pathname))return;const form=document.querySelector('form[data-demo-form]');if(!form)return;const motif=form.querySelector('select');if(motif)motif.value='Boutique';const message=form.querySelector('textarea');if(message&&!message.value)message.value='Bonjour, je souhaite des informations sur la pièce '+ref+'.\n'})();
(()=>{
const BP=[['base',''],['tablet','(max-width:850px)'],['mobile','(max-width:620px)']];
const layer=(a,scope,bp,page)=>{if(!a)return{};if(scope==='global')return(a.global&&a.global[bp])||{};return bp==='base'?((a.pages&&a.pages[page])||{}):((a[bp]&&a[bp][page])||{})};
const decl=(r,edit)=>Object.entries(r).filter(([k])=>k.slice(0,2)!=='__').map(([k,v])=>(edit&&k==='display'&&v==='none')?'opacity:.25':k+':'+v).join(';');
const build=(a,page,edit)=>{let css='';for(const [bp,mq] of BP){let part='';for(const scope of['global','page']){const r=layer(a,scope,bp,page);for(const s in r){const d=decl(r[s],edit);if(d)part+=s+'{'+d+'}\n'}}if(part)css+=mq?'@media'+mq+'{'+part+'}\n':part}return css};
const texts=(a,page)=>{const r=layer(a,'page','base',page);for(const s in r){const t=r[s].__text;if(t==null)continue;try{const el=document.querySelector(s);if(el&&!el.children.length&&el.textContent!==t)el.textContent=t}catch(e){}}};
window.__layoutEngine={layer,build,texts};
if(/[?&]ed=1/.test(location.search))return;
const page=(location.pathname.split('/').pop()||'index.html'),cfg=window.JEREMINERALOGIE_SUPABASE,K='layout_overrides_cache';
const apply=v=>{try{const css=build(v,page,false);let st=document.getElementById('layout-overrides');if(!st){st=document.createElement('style');st.id='layout-overrides';document.head.appendChild(st)}st.textContent=css;if(/font-family/.test(css)&&!document.getElementById('layout-fonts')){const l=document.createElement('link');l.id='layout-fonts';l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Playfair+Display&family=Cormorant+Garamond&family=Lora&family=Montserrat&family=Poppins&family=Oswald&display=swap';document.head.appendChild(l)}const t=()=>texts(v,page);t();setTimeout(t,1200);setTimeout(t,3500)}catch(e){}};
try{apply(JSON.parse(localStorage.getItem(K)))}catch(e){}
if(!cfg||!cfg.url||String(cfg.url).includes('PLACEHOLDER'))return;
fetch(cfg.url+'/rest/v1/site_settings?key=eq.layout_overrides&is_public=eq.true&select=value',{headers:{apikey:cfg.publishableKey},cache:'no-store'}).then(r=>r.ok?r.json():[]).then(rows=>{const v=rows[0]&&rows[0].value||{};apply(v);try{localStorage.setItem(K,JSON.stringify(v))}catch(e){}}).catch(()=>{})})();
