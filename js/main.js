const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const sel=new Set();let last=null,cur=null;

/* ----- artwork (swap for real photos via img:) ----- */
function art(p){
  if(p.img)return `<img src="${p.img}" alt="${p.name}" loading="lazy" class="w-full h-full object-cover">`;
  const h=p.h;let b='';
  for(let i=0;i<9;i++){const w=30+((i*17+p.id*7)%24),ht=70+((i*37+p.id*23)%110),x=i*46-6;
    b+=`<rect x="${x}" y="${260-ht}" width="${w}" height="${ht}" fill="hsl(${h},35%,${10+i%3*4}%)"/>`;
    for(let r=0;r<Math.floor(ht/22);r++)b+=`<rect x="${x+6}" y="${260-ht+8+r*22}" width="${w-12}" height="4" fill="#e2c585" opacity="${(i+r)%3?.12:.55}"/>`}
  return `<svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" class="w-full h-full" role="img" aria-label="${p.name} artistic impression"><defs><linearGradient id="g${p.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${h},45%,18%)"/><stop offset="1" stop-color="hsl(${h+25},60%,42%)"/></linearGradient></defs><rect width="400" height="260" fill="url(#g${p.id})"/><circle cx="320" cy="70" r="26" fill="#e2c585" opacity=".7"/>${b}</svg>`;
}
$('#heroArt').innerHTML=art({id:0,h:215});

/* ----- filters & grid ----- */
const opt=(a,all)=>`<option value="">${all}</option>`+a.map(x=>`<option>${x}</option>`).join('');
$('#fLoc').innerHTML=opt([...new Set(P.map(p=>p.area))],'All locations');
$('#fType').innerHTML=opt([...new Set(P.map(p=>p.type))],'All property types');
const projOpts=P.map(p=>`<option value="${p.id}">${p.name}, ${p.area}</option>`).join('');
$('#qj').innerHTML=projOpts;$('#lj').innerHTML=projOpts;

function filtered(){
  const l=$('#fLoc').value,b=$('#fBud').value,t=$('#fType').value;
  return P.filter(p=>(!l||p.area===l)&&(!t||p.type===t)&&(!b||(b==='lt50'?p.lakh<50:b==='mid'?p.lakh>=50&&p.lakh<=100:p.lakh>100))&&[...sel].every(a=>p.am.includes(a)));
}
function render(){
  const L=filtered();
  $('#count').textContent=`${L.length} project${L.length===1?'':'s'} found`;
  $('#grid').innerHTML=L.length?L.map(p=>`
  <article class="card overflow-hidden flex flex-col">
    <div class="relative aspect-[3/2]">${art(p)}<span class="badge">${p.badge}</span></div>
    <div class="p-4 flex flex-col flex-1">
      <h3 class="fd text-xl font-bold">${p.name}</h3>
      <p class="mu text-sm">${p.loc}</p>
      <p class="gold fd text-2xl font-bold mt-2">Starting @ ${p.price}</p>
      <ul class="mt-3 mb-4 space-y-1 text-sm">${p.hl.map(x=>`<li><span class="gold">✓</span> ${x}</li>`).join('')}</ul>
      <div class="mt-auto grid grid-cols-2 gap-2">
        <button class="btn2 !px-2 text-sm" data-act="det" data-id="${p.id}">View details</button>
        <button class="btn !px-2 text-sm" data-act="lead" data-id="${p.id}" data-src="Card: Enquire / Brochure">Enquire / Brochure</button>
      </div>
    </div>
  </article>`).join(''):`<div class="card p-8 text-center col-span-full"><p class="mb-3">No project matches these filters.</p><button class="btn2" data-act="reset">Clear filters</button></div>`;
  $('#amenMsg').innerHTML=sel.size?`<span class="gold">${L.length}</span> project${L.length===1?'':'s'} have all selected amenities. <a href="#projects" class="gold underline">See projects</a>`:'';
}
['#fLoc','#fBud','#fType'].forEach(s=>$(s).addEventListener('change',render));
function resetAll(){['#fLoc','#fBud','#fType'].forEach(s=>$(s).value='');sel.clear();$$('#amen .chip').forEach(c=>c.setAttribute('aria-pressed','false'));render()}
$('#reset').onclick=resetAll;

$('#amen').innerHTML=AM.map(a=>`<button class="chip" aria-pressed="false">${a}</button>`).join('');
$('#amen').onclick=e=>{const c=e.target.closest('.chip');if(!c)return;const on=c.getAttribute('aria-pressed')!=='true';c.setAttribute('aria-pressed',on);on?sel.add(c.textContent):sel.delete(c.textContent);render()};

/* ----- modals ----- */
function openM(m){m.classList.add('open');document.body.style.overflow='hidden'}
function closeAll(){$$('.modal').forEach(m=>m.classList.remove('open'));document.body.style.overflow=''}
$$('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m||e.target.hasAttribute('data-close'))closeAll()}));
addEventListener('keydown',e=>{if(e.key==='Escape')closeAll()});

function openLead(id,src){
  closeAll();cur=src||'Website';
  $('#lf').classList.remove('hidden');$('#thanks').classList.add('hidden');
  if(id)$('#lj').value=id;
  const p=P.find(x=>x.id==id);
  $('#lt').textContent=p?`Get ${p.name} price sheet & brochure`:'Book your free site visit';
  openM($('#mLead'));setTimeout(()=>$('#ln').focus(),50);
}
function openDet(id){
  const p=P.find(x=>x.id==id);
  $('#det').innerHTML=`
  <div class="relative aspect-[16/8]">${art(p)}<span class="badge">${p.badge}</span></div>
  <div class="p-5 space-y-5">
    <div><h2 class="fd text-3xl font-bold">${p.name}</h2><p class="mu">${p.loc} · ${p.type} · ${p.poss}</p><p class="gold fd text-2xl font-bold mt-1">Starting @ ${p.price}</p></div>
    <div><h3 class="fd text-lg font-bold mb-2">Floor plans &amp; pricing</h3>
      <div class="grid gap-2">${p.fp.map(f=>`<div class="flex justify-between items-center rounded-lg p-3 text-sm" style="background:#0d1628;border:1px solid var(--ln)"><div><b>${f[0]}</b><span class="mu"> · ${f[1]}</span></div><span class="gold font-bold">${f[2]}*</span></div>`).join('')}</div>
      <button class="btn2 w-full mt-2 text-sm" data-act="lead" data-id="${p.id}" data-src="Details: Floor plan PDF">Get detailed floor plan PDF</button></div>
    <div><h3 class="fd text-lg font-bold mb-2">Amenities</h3><div class="flex flex-wrap gap-2">${p.am.map(a=>`<span class="chip !cursor-default !py-1 !text-xs">${a}</span>`).join('')}</div></div>
    <div><h3 class="fd text-lg font-bold mb-2">Location advantages</h3><ul class="space-y-1 text-sm">${p.adv.map(a=>`<li><span class="gold">✓</span> ${a}</li>`).join('')}</ul></div>
    <div><h3 class="fd text-lg font-bold mb-2">Virtual tour</h3>${playBox(p.tour,'Watch walkthrough',p.id)}</div>
    <div class="grid grid-cols-2 gap-2"><button class="btn" data-act="lead" data-id="${p.id}" data-src="Details: Schedule Site Visit">Schedule site visit</button><button class="btn2" data-act="lead" data-id="${p.id}" data-src="Details: Download Brochure">Download brochure</button></div>
  </div>`;
  openM($('#mDet'));$('#mDet .sheet').scrollTop=0;
}
function playBox(url,label,id){
  return `<div class="relative aspect-video rounded-lg overflow-hidden" data-play="${url||''}">${url?'':''}<div class="absolute inset-0" style="background:linear-gradient(135deg,#18243d,#0d1628)"></div><button class="absolute inset-0 flex flex-col items-center justify-center gap-2" data-act="play" aria-label="${label}"><span class="w-14 h-14 rounded-full flex items-center justify-center text-xl" style="background:var(--gold);color:#1a1305">▶</span><span class="text-sm">${label}</span></button></div>`;
}
function play(btn){
  const box=btn.closest('[data-play]'),u=box.dataset.play;
  if(u)box.innerHTML=`<iframe class="w-full h-full" src="${u}${u.includes('?')?'&':'?'}autoplay=1" allow="autoplay;fullscreen" allowfullscreen style="border:0"></iframe>`;
  else btn.querySelector('span:last-child').textContent='Add a tour URL (tour:) in the project data to enable this video';
}
$('#vid').innerHTML=playBox(CFG.VIDEO,'Watch client story');

/* ----- delegation ----- */
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b)return;
  const a=b.dataset.act;
  if(a==='lead')openLead(b.dataset.id,b.dataset.src);
  if(a==='det')openDet(b.dataset.id);
  if(a==='play')play(b);
  if(a==='reset')resetAll();
});

/* ----- phone + validation ----- */
function fmtPhone(el){let d=el.value.replace(/\D/g,'');if(d.length>10&&/^(91|0)/.test(d))d=d.replace(/^(91|0)/,'');d=d.slice(0,10);el.value=d.length>5?d.slice(0,5)+' '+d.slice(5):d}
['#qp','#lp'].forEach(s=>$(s).addEventListener('input',e=>fmtPhone(e.target)));
const okName=v=>v.trim().length>=2,okPhone=v=>/^[6-9]\d{9}$/.test(v.replace(/\s/g,'')),okMail=v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

/* ----- lead storage & sync ----- */
function getLeads(){try{return JSON.parse(localStorage.getItem('leads')||'[]')}catch(e){return[]}}
function saveLead(d){
  d.timestamp=new Date().toISOString();d.dateTime=new Date().toLocaleString('en-IN');d.page=location.href;d.utm=location.search.slice(1);
  const a=getLeads();a.push(d);try{localStorage.setItem('leads',JSON.stringify(a))}catch(e){}
  if(CFG.WEBHOOK)fetch(CFG.WEBHOOK,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify(d)}).catch(()=>{});
  try{window.fbq&&fbq('track','Lead',{content_name:d.project})}catch(e){}
  last=d;
}
window.exportLeads=function(){ // run exportLeads() in the console to download a CSV
  const a=getLeads();if(!a.length)return console.log('No leads yet');
  const k=Object.keys(a[0]);const csv=[k.join(',')].concat(a.map(r=>k.map(x=>JSON.stringify(r[x]??'')).join(','))).join('\n');
  dl(new Blob([csv],{type:'text/csv'}),'leads.csv');
};
function dl(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000)}

/* ----- brochure PDF (generated on the fly; set brochure:'url' on a project to use your own) ----- */
function pdf(lines){
  const e=s=>s.replace(/[^\x20-\x7e]/g,'').replace(/[\\()]/g,'\\$&');
  let c='BT /F1 12 Tf 50 790 Td 17 TL\n';lines.forEach(l=>c+='('+e(l)+') Tj T*\n');c+='ET';
  const o=['<</Type/Catalog/Pages 2 0 R>>','<</Type/Pages/Kids[3 0 R]/Count 1>>','<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>','<</Length '+c.length+'>>stream\n'+c+'\nendstream','<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>'];
  let s='%PDF-1.4\n',off=[];o.forEach((b,i)=>{off.push(s.length);s+=(i+1)+' 0 obj\n'+b+'\nendobj\n'});
  const x=s.length;s+='xref\n0 6\n0000000000 65535 f \n'+off.map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+'trailer<</Size 6/Root 1 0 R>>\nstartxref\n'+x+'\n%%EOF';
  return new Blob([s],{type:'application/pdf'});
}
function brochure(p){
  if(p.brochure){window.open(p.brochure,'_blank');return}
  const L=['ESTATES Artha - PROJECT BROCHURE','',p.name+' - '+p.loc,p.type+' | '+p.poss,'Starting @ '+p.price.replace('₹','Rs. '),'','Highlights:'].concat(p.hl.map(x=>' - '+x),['','Configurations:'],p.fp.map(f=>' - '+f[0]+', '+f[1]+', from '+f[2].replace('₹','Rs. ')),['','Amenities: '+p.am.join(', '),'','Location:'],p.adv.map(x=>' - '+x),['','Call +91 99999 99999 to book a free site visit.','RERA: UPRERAPRJ00000. Prices are indicative and subject to change.']);
  dl(pdf(L),p.name.replace(/\s+/g,'-')+'-brochure.pdf');
}

/* ----- thank-you ----- */
function wa(msg){return `https://wa.me/${CFG.WA}?text=${encodeURIComponent(msg)}`}
function showThanks(d){
  const p=P.find(x=>x.id==d.projectId);
  closeAll();$('#lf').classList.add('hidden');$('#thanks').classList.remove('hidden');
  $('#tn').textContent=d.name.split(' ')[0];$('#tp').textContent=p.name;
  $('#dl').onclick=()=>brochure(p);
  $('#twa').href=wa(`Hi, I'm ${d.name}. I'm interested in ${p.name} (${p.loc}), ${d.config}. Please share details.`);
  openM($('#mLead'));
}

/* ----- form handlers ----- */
$('#quick').addEventListener('submit',e=>{
  e.preventDefault();
  const n=$('#qn').value,ph=$('#qp').value;
  if(!okName(n))return $('#qe').textContent='Enter your full name.';
  if(!okPhone(ph))return $('#qe').textContent='Enter a valid 10-digit mobile number starting with 6 to 9.';
  $('#qe').textContent='';
  const p=P.find(x=>x.id==$('#qj').value);
  const d={name:n.trim(),phone:'+91'+ph.replace(/\s/g,''),email:'',project:p.name,projectId:p.id,config:'Not specified',source:'Hero: Book Site Visit'};
  saveLead(d);showThanks(d);e.target.reset();
});
$('#lf').addEventListener('submit',e=>{
  e.preventDefault();
  const v={n:$('#ln').value,p:$('#lp').value,e:$('#le').value};
  const m={n:okName(v.n)?'':'Enter your full name.',p:okPhone(v.p)?'':'Enter a valid 10-digit mobile number.',e:okMail(v.e)?'':'Enter a valid email address.'};
  $$('[data-e]').forEach(x=>x.textContent=m[x.dataset.e]);
  if(m.n||m.p||m.e)return;
  const p=P.find(x=>x.id==$('#lj').value);
  const d={name:v.n.trim(),phone:'+91'+v.p.replace(/\s/g,''),email:v.e.trim(),project:p.name,projectId:p.id,config:$('#lc').value,source:cur};
  saveLead(d);showThanks(d);e.target.reset();
});

/* ----- floating buttons ----- */
$('#fwa').href=wa('Hi, I saw your ad and want details on your new launch projects.');
$('#fcall').href='tel:'+CFG.PHONE;

render();
