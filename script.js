document.querySelectorAll('[data-search]').forEach(input=>input.addEventListener('keydown',e=>{if(e.key==='Enter'&&input.value.trim())location.href='recherche.html?q='+encodeURIComponent(input.value.trim())}));
(()=>{const ref=new URLSearchParams(location.search).get('reference');if(!ref||!/contact\.html$/.test(location.pathname))return;const form=document.querySelector('form[data-message-form]');if(!form)return;const motif=form.querySelector('select');if(motif)motif.value='Boutique';const message=form.querySelector('textarea');if(message&&!message.value)message.value='Bonjour, je souhaite des informations sur la pièce '+ref+'.\n'})();
(()=>{
const BP=[['base',''],['tablet','(max-width:850px)'],['mobile','(max-width:620px)']];
const layer=(a,scope,bp,page)=>{if(!a)return{};if(scope==='global')return(a.global&&a.global[bp])||{};return bp==='base'?((a.pages&&a.pages[page])||{}):((a[bp]&&a[bp][page])||{})};
const decl=(r,edit)=>Object.entries(r).filter(([k])=>k.slice(0,2)!=='__').map(([k,v])=>(edit&&k==='display'&&v==='none')?'opacity:.25':k+':'+v).join(';');
const build=(a,page,edit)=>{let css='';for(const [bp,mq] of BP){let part='';for(const scope of['global','page']){const r=layer(a,scope,bp,page);for(const s in r){const d=decl(r[s],edit);if(d)part+=s+'{'+d+'}\n'}}if(part)css+=mq?'@media'+mq+'{'+part+'}\n':part}return css};
const texts=(a,page)=>{const r=layer(a,'page','base',page);for(const s in r){const t=r[s].__text;if(t==null)continue;try{const el=document.querySelector(s);if(el&&!el.children.length&&el.textContent!==t)el.textContent=t}catch(e){}}};
window.__layoutEngine={layer,build,texts};
if(/[?&]ed=1/.test(location.search))return;
const page=window.JM_PAGE?window.JM_PAGE+'.html':(location.pathname.split('/').pop()||'index.html'),cfg=window.JEREMINERALOGIE_SUPABASE,K='layout_overrides_cache';
const apply=v=>{try{const css=build(v,page,false);let st=document.getElementById('layout-overrides');if(!st){st=document.createElement('style');st.id='layout-overrides';document.head.appendChild(st)}st.textContent=css;if(/font-family/.test(css)&&!document.getElementById('layout-fonts')){const l=document.createElement('link');l.id='layout-fonts';l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Playfair+Display&family=Cormorant+Garamond&family=Lora&family=Montserrat&family=Poppins&family=Oswald&display=swap';document.head.appendChild(l)}const t=()=>texts(v,page);t();setTimeout(t,1200);setTimeout(t,3500)}catch(e){}};
try{apply(JSON.parse(localStorage.getItem(K)))}catch(e){}
if(!cfg||!cfg.url||String(cfg.url).includes('PLACEHOLDER'))return;
fetch(cfg.url+'/rest/v1/site_settings?key=eq.layout_overrides&is_public=eq.true&select=value',{headers:{apikey:cfg.publishableKey},cache:'no-store'}).then(r=>r.ok?r.json():[]).then(rows=>{const v=rows[0]&&rows[0].value||{};apply(v);try{localStorage.setItem(K,JSON.stringify(v))}catch(e){}}).catch(()=>{})})();
(()=>{
const pick=img=>img&&img.tagName==='IMG'&&img.closest('main')&&!img.closest('a.card')&&!img.closest('.thumbs')&&!img.closest('.lb')&&!img.closest('.leaflet-container');
let box,imgEl,cnt,list=[],i=0,sx=null;
const show=()=>{imgEl.src=list[i].src;imgEl.alt=list[i].alt||'';cnt.textContent=list.length>1?(i+1)+' / '+list.length:'';box.querySelectorAll('.lb-nav').forEach(b=>b.hidden=list.length<2)};
const go=d=>{if(list.length<2)return;i=(i+d+list.length)%list.length;show()};
const close=()=>{box.hidden=true;document.documentElement.style.overflow='';imgEl.removeAttribute('src')};
const build=()=>{box=document.createElement('div');box.className='lb';box.hidden=true;box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','Photo en plein écran');
 box.innerHTML='<img class="lb-img" alt=""><button type="button" class="lb-close" aria-label="Fermer">✕</button><button type="button" class="lb-nav lb-prev" aria-label="Photo précédente">‹</button><button type="button" class="lb-nav lb-next" aria-label="Photo suivante">›</button><div class="lb-count"></div>';
 document.body.append(box);imgEl=box.querySelector('.lb-img');cnt=box.querySelector('.lb-count');
 box.querySelector('.lb-close').addEventListener('click',close);box.querySelector('.lb-prev').addEventListener('click',e=>{e.stopPropagation();go(-1)});box.querySelector('.lb-next').addEventListener('click',e=>{e.stopPropagation();go(1)});
 box.addEventListener('click',e=>{if(e.target===box)close()});
 box.addEventListener('touchstart',e=>{if(e.touches.length===1)sx=e.touches[0].clientX},{passive:true});
 box.addEventListener('touchend',e=>{if(sx==null)return;const dx=e.changedTouches[0].clientX-sx;sx=null;if(Math.abs(dx)>50)go(dx<0?1:-1)});
 document.addEventListener('keydown',e=>{if(box.hidden)return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')go(-1);if(e.key==='ArrowRight')go(1)})};
document.addEventListener('click',e=>{
 const img=e.target;if(!pick(img))return;
 e.preventDefault();if(!box)build();
 const gal=img.closest('.gallery-main');const thumbs=gal&&(gal.parentElement.querySelector('.thumbs')||document.querySelector('[data-thumbnails]'));
 const tl=thumbs?[...thumbs.querySelectorAll('img')]:[];
 list=tl.length?tl.map(t=>({src:t.src,alt:t.alt})):[...document.querySelectorAll('main img')].filter(pick).map(t=>({src:t.src,alt:t.alt}));
 i=Math.max(0,list.findIndex(x=>x.src===img.src));if(!list.length)list=[{src:img.src,alt:img.alt}];
 show();box.hidden=false;document.documentElement.style.overflow='hidden';box.querySelector('.lb-close').focus();
});
})();
