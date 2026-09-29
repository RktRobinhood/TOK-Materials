(function(){
'use strict';
const S=window.TOKShared;
const Content=window.TOKContent||{caseCatalog:{},firstPools:{},secondPools:{},transferPool:[]};
const KEY='tok-art-teacher-scans-v1';
const JSQR_SOURCES=['https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js','https://unpkg.com/jsqr@1.4.0/dist/jsQR.js'];
let scans=load();
let stream=null;
let scanTimer=null;
let nativeDetector=null;
let jsQrPromise=null;
let cameraBusy=false;
let lastScanned='';
let lastScannedAt=0;

function q(s){return document.querySelector(s)}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function load(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){return[]}}
function save(){localStorage.setItem(KEY,JSON.stringify(scans))}
function showErr(msg){const el=q('#decode-error');el.textContent=msg||'';el.classList.toggle('show',!!msg)}
function showStatus(msg,kind=''){const el=q('#intake-status');el.textContent=msg||'';el.className='intake-status '+kind;}
function stance(n){return ({'-3':'Strongly no','-2':'No','-1':'Lean no','0':'Depends','1':'Lean yes','2':'Yes','3':'Strongly yes'})[String(n)]||n}

function extractTelemetryCode(raw){
  let s=String(raw||'').trim();
  if(!s)throw new Error('No QR or telemetry data was found.');
  try{
    const u=new URL(s,location.href);
    if(u.hash.startsWith('#q='))s=decodeURIComponent(u.hash.slice(3));
    else if(u.searchParams.get('q'))s=u.searchParams.get('q');
  }catch(e){}
  const i=s.indexOf(S.PREFIX);
  if(i>=0){
    const tail=s.slice(i);
    const m=tail.match(/^TOKART1:[A-Za-z0-9_-]+\.[0-9a-fA-F]{8}/);
    if(m)return m[0];
  }
  throw new Error('This QR does not contain a Boundary / Art teacher record.');
}

function addCode(raw,source='manual'){
  try{
    const code=extractTelemetryCode(raw);
    const d=S.decodeTelemetry(code);
    if(scans.some(x=>x.id===d.id)){
      showErr('That report is already in this review set.');
      showStatus('Already scanned: '+(d.sc||d.id),'warn');
      return false;
    }
    scans.unshift(d);save();
    if(q('#code-input'))q('#code-input').value='';
    showErr('');
    showStatus(`Loaded ${d.sc||'unlabelled report'} from ${source}.`,'ok');
    render();
    return true;
  }catch(e){showErr(e.message||'Could not decode the teacher record.');showStatus('Nothing was added.','warn');return false;}
}
function remove(id){scans=scans.filter(x=>x.id!==id);save();render()}

function validationAttempts(d){return (d.vf||[]).reduce((n,row)=>n+(row?.[1]||0),0)}
function validationFields(d){return (d.vf||[]).length}
function caseTitle(id){return Content.caseCatalog?.[id]?.title||id;}
function miniSpectrum(d){const rows=d.sp||[];if(!rows.length)return '';const line=rows.filter(r=>r[1]>=0),irrelevant=rows.filter(r=>r[1]<0);return `<div class="teacher-mini-spectrum"><div class="teacher-mini-line">${line.map((r,i)=>`<span class="teacher-mini-marker" style="left:${Math.max(2,Math.min(98,r[1]))}%" title="${esc(caseTitle(r[0]))}">${i+1}</span>`).join('')}</div><div class="teacher-mini-labels"><span>can be art</span><span>grey</span><span>not art</span></div>${irrelevant.length?`<div class="teacher-mini-discard">irrelevant: ${irrelevant.map(r=>esc(caseTitle(r[0]))).join(' · ')}</div>`:''}</div>`;}

function setTeacherView(view){const content=view==='content';document.querySelectorAll('.review-pane').forEach(el=>el.hidden=content);q('#content-preview').hidden=!content;document.querySelectorAll('[data-teacher-view]').forEach(b=>b.classList.toggle('active',b.dataset.teacherView===view));if(content)renderContentPreview();}
function contentCases(){return Object.values(Content.caseCatalog||{}).filter((c,i,arr)=>c&&c.id&&arr.findIndex(x=>x?.id===c.id)===i);}
function riskLabel(c){const r=c.sourceRisk||'green';return r==='red'?'MATURE SOURCE':r==='amber'?'INSPECT SOURCE':'PRIMARY SOURCE';}
function pushLabel(v){return ({toward_art:'pushes can-be-art',toward_not_art:'pushes not-art',anti_hedge:'anti-hedge',mixed:'mixed collision',definition:'definition test'})[v]||v||'mixed';}
function sourceButton(url,label,cls='ghost'){return url?`<a class="button ${cls}" href="${esc(url)}" target="_blank" rel="noopener">${esc(label)} ↗</a>`:'';}
function contentCaseCard(c){const thumb=c.remoteImage||c.image||'',fallback=c.remoteImage&&c.image?c.image:'';return `<article class="content-case-card visual-evidence-card" data-content-id="${esc(c.id)}" title="${esc(c.title)}"><div class="content-case-top"><span>${esc(c.eyebrow||'CASE FILE')}</span><b>${esc(c.year||'')} · ${esc(c.region||'')}</b></div><button type="button" class="visual-card-hit" data-preview-case="${esc(c.id)}" aria-label="Preview student dossier for ${esc(c.title)}">${thumb?`<img class="encounter-thumb" src="${esc(thumb)}" data-fallback="${esc(fallback)}" alt="${esc(c.imageAlt||c.title)}" loading="lazy" referrerpolicy="no-referrer" onerror="if(this.dataset.fallback&&this.src!==this.dataset.fallback){this.src=this.dataset.fallback}">`:`<div class="content-case-glyph ${esc(c.mediaClass||'file')}">${esc((c.medium||'FILE').slice(0,4).toUpperCase())}</div>`}<span class="visual-card-title">${esc(c.title)}</span></button><div class="visual-card-meta"><span class="risk-badge ${esc(c.sourceRisk||'green')}">${esc(riskLabel(c))}</span><span>${esc(c.medium||c.mediaClass||'case')}</span></div><div class="content-case-actions compact-actions"><button type="button" class="button ghost" data-preview-case="${esc(c.id)}">Open dossier</button>${sourceButton(c.studentSource||c.url,'Source')}</div></article>`;}
function renderContentPreview(){const cases=contentCases(),search=(q('#content-search')?.value||'').trim().toLowerCase(),medium=q('#content-medium')?.value||'all',risk=q('#content-risk')?.value||'all',push=q('#content-push')?.value||'all';const media=[...new Set(cases.map(c=>c.medium||c.mediaClass||'case'))].sort();const sel=q('#content-medium');if(sel&&sel.options.length<=1){media.forEach(m=>{const o=document.createElement('option');o.value=m;o.textContent=m;sel.appendChild(o);});if(medium!=='all')sel.value=medium;}const filtered=cases.filter(c=>{const hay=[c.title,c.medium,c.mediaClass,c.region,c.year,c.category,c.source,c.pressure,c.text,c.eyebrow,c.hover,c.push,...(c.challengeAxes||[]),...(c.branchMembership||[])].join(' ').toLowerCase();return (!search||hay.includes(search))&&(medium==='all'||(c.medium||c.mediaClass||'case')===medium)&&(risk==='all'||(c.sourceRisk||'green')===risk)&&(push==='all'||(c.push||'mixed')===push);});const risks=cases.reduce((m,c)=>(m[c.sourceRisk||'green']=(m[c.sourceRisk||'green']||0)+1,m),{});q('#content-count').textContent=`${filtered.length} / ${cases.length} live · ${risks.green||0} green · ${risks.amber||0} amber · ${risks.red||0} red`;q('#content-library').innerHTML=filtered.map(contentCaseCard).join('')||'<div class="empty-state">No cases match that filter.</div>';wireContentPreviewButtons();renderBranchPreview();renderFinalePreview();}
function openContentDialog(id){const c=Content.caseCatalog?.[id];if(!c)return;const facts=c.facts||{};const representative=c.remoteImage||c.image||'';const representativeFallback=representative===c.remoteImage&&c.image?c.image:'';q('#content-dialog-body').innerHTML=`<div class="eyebrow">${esc(c.eyebrow||'CASE FILE')}</div><h2>${esc(c.title)}</h2><p class="preview-intro">Student-facing dossier preview — clean briefing, evidence, question, and optional source links.</p><div class="preview-dossier-meta"><span>${esc(c.year||'')}</span><span>${esc(c.medium||c.fileType||'case')}</span><span>${esc(c.region||'')}</span><span class="risk-badge ${esc(c.sourceRisk||'green')}">${esc(riskLabel(c))}</span></div>${representative?`<img class="preview-dossier-image" src="${esc(representative)}" data-fallback="${esc(representativeFallback)}" alt="${esc(c.imageAlt||c.title)}" referrerpolicy="no-referrer" onerror="if(this.dataset.fallback&&this.src!==this.dataset.fallback){this.src=this.dataset.fallback}">`:''}<div class="preview-layout">${(c.evidence&&c.evidence.length)?`<div class="preview-section preview-evidence"><span>EVIDENCE IN THE FILE</span><ul>${c.evidence.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}<div class="preview-section"><span>CASE BRIEFING</span><p>${esc(c.text||'')}</p></div><div class="preview-tension"><span>WHY THIS FILE MATTERS</span><strong>${esc(c.pressure||'')}</strong></div><div class="preview-section"><span>YOUR TASK</span><p>${esc(c.task||'Classify this work using only the evidence in this file.')}</p></div>${Object.keys(facts).length?`<div class="preview-facts">${Object.entries(facts).map(([k,v])=>`<div><span>${esc(k)}</span><p>${esc(v)}</p></div>`).join('')}</div>`:''}<div class="preview-sources"><div><span>PRIMARY / OPTIONAL SOURCE</span><strong>${esc(c.studentSourceLabel||'Open the student source')}</strong><p>${esc(c.studentSource||c.url||'No source')}</p>${sourceButton(c.studentSource||c.url,'Open student source','primary')}</div>${c.contextSource?`<div><span>BACKGROUND / CONTEXT</span><strong>${esc(c.contextSourceLabel||'Open the context source')}</strong><p>${esc(c.contextSource)}</p>${sourceButton(c.contextSource,'Open background link')}</div>`:''}</div></div>`;q('#content-dialog').showModal();}
function wireContentPreviewButtons(){document.querySelectorAll('[data-preview-case]').forEach(b=>{if(b.dataset.boundPreview)return;b.dataset.boundPreview='1';b.addEventListener('click',()=>openContentDialog(b.dataset.previewCase));});}
function renderPool(title,ids){return `<div class="branch-pool"><strong>${esc(title)} <em>${(ids||[]).length}</em></strong><div>${(ids||[]).map(id=>{const c=Content.caseCatalog?.[id];return `<button type="button" class="branch-case-chip ${esc(c?.sourceRisk||'green')}" data-preview-case="${esc(id)}" title="Preview ${esc(caseTitle(id))}">${esc(caseTitle(id))}</button>`;}).join('')}</div></div>`;}
function renderBranchPreview(){const first=Content.firstPools||{},second=Content.secondPools||{};let html='<div class="branch-group"><h3>First challenge — based on the student’s strongest factor</h3>'+Object.entries(first).map(([k,ids])=>renderPool(k,ids)).join('')+'</div>';html+='<div class="branch-group"><h3>Second challenge — chosen pressure + first-case decision</h3>'+Object.entries(second).map(([k,sides])=>renderPool(`${k} / student leaned yes`,sides.yes)+renderPool(`${k} / student leaned no`,sides.no)).join('')+'</div>';html+='<div class="branch-group"><h3>Transfer test</h3>'+renderPool('transfer pool',Content.transferPool||[])+'</div>';q('#branch-preview').innerHTML=html;wireContentPreviewButtons();}
function renderFinalePreview(){const cases=contentCases().filter(c=>c.forceBinary||c.push==='anti_hedge').slice(0,4);const positions=[13,37,62,86];q('#teacher-spectrum-samples').innerHTML=cases.map((c,i)=>`<span class="teacher-spectrum-sample" style="left:${positions[i]}%" title="${esc(c.title)}">${i+1}</span>`).join('');}

function render(){
  q('#empty-state').style.display=scans.length?'none':'block';
  q('#cards').innerHTML=scans.map(d=>{
    const flags=S.reviewSummary(d);const shift=(d.sh?.[1]||0)-(d.sh?.[0]||0);const cshift=(d.sh?.[3]||0)-(d.sh?.[2]||0);
    return `<article class="teacher-card"><button class="remove-card" data-remove="${esc(d.id)}" title="Remove">×</button><h3>${esc(d.sc||'Unlabelled')}</h3><div class="meta">${esc(d.md||'')} · ${esc(d.id)} · ${new Date(d.tm?.[1]||0).toLocaleString()}</div>
      <div class="metric-row"><div class="mini-metric"><strong>${S.fmtDuration(d.tm?.[2]||0)}</strong><span>active</span></div><div class="mini-metric"><strong>${d.ty?.[1]||0}</strong><span>typed chars</span></div><div class="mini-metric"><strong>${d.ty?.[3]||0}</strong><span>pauses</span></div><div class="mini-metric"><strong>${d.cb?.[0]??d.p?.[0]??0}</strong><span>blocked pastes</span></div><div class="mini-metric"><strong>${d.e?.[2]||0}</strong><span>revisions</span></div><div class="mini-metric"><strong>${validationAttempts(d)}</strong><span>response retries</span></div><div class="mini-metric"><strong>${d.uc?.[0]?'yes':'no'}</strong><span>student dossier</span></div><div class="mini-metric"><strong>${shift>0?'+':''}${shift}</strong><span>stance shift</span></div><div class="mini-metric"><strong>${cshift>0?'+':''}${cshift}</strong><span>confidence</span></div></div>${miniSpectrum(d)}
      <div class="flag-list">${flags.map(f=>`<div class="flag ${f.level==='review'?'review':''}">${esc(f.text)}</div>`).join('')}</div><div class="route-line">route: ${(d.rt||[]).map(esc).join(' → ')||'--'}</div></article>`;
  }).join('');
  document.querySelectorAll('[data-remove]').forEach(b=>b.addEventListener('click',()=>remove(b.dataset.remove)));
  renderSimilarity();
}
function comparePair(a,b){
  const labels=['student rule','final answer','challenge 1 explanation','thinking-change reflection','challenge 2 explanation'];let best=null;
  for(let i=0;i<labels.length;i++){
    if(!a.h?.[i]||!b.h?.[i]||(a.l?.[i]||0)<140||(b.l?.[i]||0)<140)continue;
    const dist=S.hamming64(a.h[i],b.h[i]);if(best===null||dist<best.dist)best={dist,label:labels[i],i};
  }
  return best;
}
function renderSimilarity(){
  const rows=[];
  for(let i=0;i<scans.length;i++)for(let j=i+1;j<scans.length;j++){
    const c=comparePair(scans[i],scans[j]);if(c)rows.push({a:scans[i],b:scans[j],...c});
  }
  rows.sort((x,y)=>x.dist-y.dist);
  if(!rows.length){q('#similarity').innerHTML='<div class="empty-state">Add at least two reports with sufficiently long open responses to compare fingerprints.</div>';return}
  q('#similarity').innerHTML=`<table class="similarity-table"><thead><tr><th>Report A</th><th>Report B</th><th>Closest field</th><th>Distance / 64</th><th>Interpretation</th></tr></thead><tbody>${rows.map(r=>{
    let cls='',label='ordinary separation';if(r.dist<=6){cls='similarity-hit';label='inspect PDFs'}else if(r.dist<=10){cls='similarity-watch';label='possible proximity'}
    return `<tr class="${cls}"><td>${esc(r.a.sc||r.a.id)}</td><td>${esc(r.b.sc||r.b.id)}</td><td>${esc(r.label)}</td><td><strong>${r.dist}</strong></td><td><span class="badge">${label}</span></td></tr>`;
  }).join('')}</tbody></table><p class="microcopy">Thresholds are deliberately conservative. Similar fingerprints are a reason to compare the actual reports and process coherence, not a finding of misconduct.</p>`;
}

async function getNativeDetector(){
  if(nativeDetector)return nativeDetector;
  if(!('BarcodeDetector' in window)||!BarcodeDetector.getSupportedFormats)return null;
  try{const formats=await BarcodeDetector.getSupportedFormats();if(!formats.includes('qr_code'))return null;nativeDetector=new BarcodeDetector({formats:['qr_code']});return nativeDetector;}catch(e){return null;}
}
function ensureJsQR(){
  if(window.jsQR)return Promise.resolve(window.jsQR);
  if(jsQrPromise)return jsQrPromise;
  jsQrPromise=new Promise((resolve,reject)=>{
    let i=0;
    const tryNext=()=>{
      if(window.jsQR)return resolve(window.jsQR);
      if(i>=JSQR_SOURCES.length)return reject(new Error('Could not load a QR decoder. If you are offline, use a browser with built-in QR detection or paste the teacher record code text.'));
      const sc=document.createElement('script');sc.src=JSQR_SOURCES[i++];sc.async=true;
      sc.onload=()=>window.jsQR?resolve(window.jsQR):tryNext();
      sc.onerror=tryNext;document.head.appendChild(sc);
    };
    tryNext();
  });
  return jsQrPromise;
}
function drawToCanvas(source){
  const canvas=q('#scan-canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});
  const sw=source.videoWidth||source.naturalWidth||source.width,sh=source.videoHeight||source.naturalHeight||source.height;
  if(!sw||!sh)throw new Error('The image could not be read.');
  const max=1600,scale=Math.min(1,max/Math.max(sw,sh));canvas.width=Math.max(1,Math.round(sw*scale));canvas.height=Math.max(1,Math.round(sh*scale));
  ctx.drawImage(source,0,0,canvas.width,canvas.height);return canvas;
}
async function decodeCanvas(canvas){
  const native=await getNativeDetector();
  if(native){try{const codes=await native.detect(canvas);if(codes?.[0]?.rawValue)return codes[0].rawValue;}catch(e){}}
  const decoder=await ensureJsQR();
  const ctx=canvas.getContext('2d',{willReadFrequently:true});const data=ctx.getImageData(0,0,canvas.width,canvas.height);
  const found=decoder(data.data,data.width,data.height,{inversionAttempts:'attemptBoth'});return found?.data||null;
}
async function decodeImageBlob(blob){
  let bmp=null;
  try{bmp=await createImageBitmap(blob);const canvas=drawToCanvas(bmp);const raw=await decodeCanvas(canvas);if(!raw)throw new Error('No QR code was found in that image. Crop closer to the QR or use a sharper screenshot.');return raw;}finally{if(bmp?.close)bmp.close();}
}
async function scanImageFile(file,source='image'){
  if(!file)return;showErr('');showStatus('Reading QR from image…','busy');
  try{const raw=await decodeImageBlob(file);addCode(raw,source);}catch(e){showErr(e.message||'Could not scan image.');showStatus('Image scan did not find a usable report.','warn');}
}

async function startCamera(){
  showErr('');
  if(!navigator.mediaDevices?.getUserMedia){showStatus('This browser does not allow camera access here. Use a screenshot/image instead.','warn');return;}
  try{
    // Warm the fallback decoder before opening the camera when native detection is absent.
    if(!await getNativeDetector())await ensureJsQR();
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false});
    q('#camera').srcObject=stream;await q('#camera').play();q('#start-camera').disabled=true;q('#stop-camera').disabled=false;
    showStatus('Camera active. Hold a printed QR steady inside the frame.','ok');
    scanCameraFrame();
  }catch(e){showStatus('Camera unavailable: '+(e.message||e)+'. Screenshot/image scanning still works.','warn');}
}
function stopCamera(){
  if(scanTimer)cancelAnimationFrame(scanTimer);scanTimer=null;if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;
  q('#camera').srcObject=null;q('#start-camera').disabled=false;q('#stop-camera').disabled=true;cameraBusy=false;showStatus('Camera stopped.','');
}
async function scanCameraFrame(){
  if(!stream)return;const video=q('#camera');
  if(!cameraBusy&&video.readyState>=2&&video.videoWidth){
    cameraBusy=true;
    try{
      const raw=await decodeCanvas(drawToCanvas(video));
      if(raw){const now=Date.now();if(raw!==lastScanned||now-lastScannedAt>2500){lastScanned=raw;lastScannedAt=now;addCode(raw,'camera');}}
    }catch(e){}finally{cameraBusy=false;}
  }
  scanTimer=requestAnimationFrame(scanCameraFrame);
}

async function readClipboard(){
  showErr('');
  if(navigator.clipboard?.read){
    try{
      const items=await navigator.clipboard.read();
      for(const item of items){
        const imageType=item.types.find(t=>t.startsWith('image/'));
        if(imageType){return scanImageFile(await item.getType(imageType),'clipboard screenshot');}
        if(item.types.includes('text/plain')){const text=await (await item.getType('text/plain')).text();if(text)return addCode(text,'clipboard text');}
      }
      throw new Error('Clipboard did not contain an image or telemetry code.');
    }catch(e){showErr((e.message||e)+ ' You can also press Ctrl+V / Cmd+V anywhere on this page.');return;}
  }
  showStatus('Press Ctrl+V / Cmd+V anywhere on this page to paste a screenshot or code.','');
}
async function handlePaste(e){
  const items=[...(e.clipboardData?.items||[])];
  const img=items.find(i=>i.kind==='file'&&i.type.startsWith('image/'));
  if(img){e.preventDefault();return scanImageFile(img.getAsFile(),'pasted screenshot');}
  const text=e.clipboardData?.getData('text/plain');if(text&&(text.includes(S.PREFIX)||text.includes('#q='))){e.preventDefault();addCode(text,'pasted text');}
}
function setupDropZone(){
  const zone=q('#drop-zone');
  ['dragenter','dragover'].forEach(ev=>zone.addEventListener(ev,e=>{e.preventDefault();zone.classList.add('dragover');}));
  ['dragleave','drop'].forEach(ev=>zone.addEventListener(ev,e=>{e.preventDefault();zone.classList.remove('dragover');}));
  zone.addEventListener('drop',e=>{const file=[...(e.dataTransfer?.files||[])].find(f=>f.type.startsWith('image/'));if(file)scanImageFile(file,'dropped image');else showErr('Drop a PNG, JPG, or other image containing the QR code.');});
}

function exportCSV(){
  if(!scans.length)return;
  const rows=[['student_code','mode','session_id','active_seconds','typing_events','typed_chars','typing_deletes','typing_pauses','typing_bursts','largest_typing_burst','active_typing_seconds','typed_to_final_pct','blocked_paste_attempts','blocked_copy_attempts','blocked_cut_attempts','blocked_drop_attempts','major_revisions','focus_changes','response_gate_retries','response_fields_retried','initial_stance','final_stance','initial_confidence','final_confidence','source_selections','route','spectrum_placements','final_evidence','response_gate_detail','flags']];
  for(const d of scans){
    const cb=d.cb||[d.p?.[0]||0,0,0,0],ty=d.ty||[];
    const validationLabels=['First reason','Challenge 1 explanation','Challenge 2 explanation','Revision reflection','Student rule','Considered answer','Thinking-change reflection'];
    const vf=(d.vf||[]).map(r=>{const [i,a,l,v,c,rep,res]=r;const parts=[];if(l)parts.push('development '+l);if(v)parts.push('variety '+v);if(c)parts.push('unclear/non-word '+c);if(rep)parts.push('repetition '+rep);return `${validationLabels[i]||('Response '+(i+1))}: ${a} retry${a===1?'':'ies'}${parts.length?' ['+parts.join('; ')+']':''}${res?' resolved':' unresolved'}`}).join(' | ');
    rows.push([d.sc,d.md,d.id,d.tm?.[2]||0,ty[0]||0,ty[1]||0,ty[2]||0,ty[3]||0,ty[4]||0,ty[5]||0,ty[6]||0,ty[7]||0,cb[0]||0,cb[1]||0,cb[2]||0,cb[3]||0,d.e?.[2]||0,d.e?.[3]||0,validationAttempts(d),validationFields(d),d.sh?.[0]||0,d.sh?.[1]||0,d.sh?.[2]||0,d.sh?.[3]||0,d.so?.[0]||0,(d.rt||[]).join('>'),(d.sp||[]).map(r=>`${r[0]}:${r[1]}`).join('|'),(d.fe||[]).join('|'),vf,(d.fl||[]).join('|')]);
  }
  const csv=rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\n');const blob=new Blob([csv],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='tok-art-telemetry.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);
}

if(location.hash.startsWith('#q=')){try{addCode(decodeURIComponent(location.hash.slice(3)),'QR link');history.replaceState(null,'',location.pathname+location.search);}catch(e){showErr('Could not import the teacher record from the QR link.')}}
q('#add-code').addEventListener('click',()=>addCode(q('#code-input').value,'pasted code'));
q('#start-camera').addEventListener('click',startCamera);q('#stop-camera').addEventListener('click',stopCamera);
q('#image-input').addEventListener('change',e=>{scanImageFile(e.target.files?.[0],'chosen screenshot');e.target.value='';});
q('#clipboard-btn').addEventListener('click',readClipboard);
q('#export-csv').addEventListener('click',exportCSV);
q('#clear-scans').addEventListener('click',()=>{if(confirm('Clear all locally scanned teacher records?')){scans=[];save();render();}});
document.addEventListener('paste',handlePaste);setupDropZone();window.addEventListener('beforeunload',stopCamera);document.querySelectorAll('[data-teacher-view]').forEach(b=>b.addEventListener('click',()=>setTeacherView(b.dataset.teacherView)));q('#content-search')?.addEventListener('input',renderContentPreview);q('#content-medium')?.addEventListener('change',renderContentPreview);q('#content-risk')?.addEventListener('change',renderContentPreview);q('#content-push')?.addEventListener('change',renderContentPreview);render();setTeacherView('review');
})();
