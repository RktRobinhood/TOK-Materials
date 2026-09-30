(function(global){
  'use strict';
  const VERSION = 1;
  const PREFIX = 'TOKART1:';
  const STORAGE_KEY = 'tok-art-boundary-lab-v1';

  function now(){ return Date.now(); }
  function clamp(n,min,max){ return Math.max(min,Math.min(max,n)); }
  function normalizeText(s){
    return (s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s']/g,' ').replace(/\s+/g,' ').trim();
  }
  function utf8ToB64Url(str){
    const bytes = new TextEncoder().encode(str);
    let binary='';
    for(const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }
  function b64UrlToUtf8(s){
    s=s.replace(/-/g,'+').replace(/_/g,'/');
    while(s.length%4) s+='=';
    const binary=atob(s); const bytes=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function fnv32(str){
    let h=0x811c9dc5;
    for(let i=0;i<str.length;i++){
      h ^= str.charCodeAt(i);
      h = Math.imul(h,0x01000193) >>> 0;
    }
    return h >>> 0;
  }
  function fnv64(str){
    let h=0xcbf29ce484222325n;
    const p=0x100000001b3n;
    const mask=0xffffffffffffffffn;
    for(const ch of str){
      h ^= BigInt(ch.codePointAt(0));
      h = (h*p)&mask;
    }
    return h;
  }
  function simHash64(text){
    const clean=normalizeText(text);
    if(!clean) return null;
    const words=clean.split(' ').filter(w=>w.length>2);
    if(words.length<8) return null;
    const grams=[];
    for(let i=0;i<words.length;i++){
      const one=words[i];
      grams.push(one);
      if(i<words.length-1) grams.push(one+' '+words[i+1]);
    }
    const acc=new Array(64).fill(0);
    for(const gram of grams){
      const h=fnv64(gram);
      const weight=gram.includes(' ')?2:1;
      for(let b=0;b<64;b++) acc[b]+= ((h>>BigInt(b))&1n)?weight:-weight;
    }
    let out=0n;
    for(let b=0;b<64;b++) if(acc[b]>=0) out|=(1n<<BigInt(b));
    return out.toString(16).padStart(16,'0');
  }
  function hamming64(a,b){
    if(!a||!b) return null;
    let x=BigInt('0x'+a)^BigInt('0x'+b), n=0;
    while(x){ n++; x&=x-1n; }
    return n;
  }
  function tokenizeWords(s){
    const n=normalizeText(String(s||'').replace(/[’]/g,"'"));
    return n.match(/[a-z]+(?:'[a-z]+)?/g)||[];
  }
  function countWords(s){ return tokenizeWords(s).length; }
  function responseStats(s){
    const words=tokenizeWords(s); const freq={}; let recognized=0;
    for(const w of words){freq[w]=(freq[w]||0)+1;if(global.TOKDictionary?.isWord?.(w))recognized++;}
    const unique=Object.keys(freq).length; const maxRepeat=words.length?Math.max(...Object.values(freq)):0;
    return {words:words.length,unique,recognized,recognizedPct:pct(recognized,words.length),maxRepeat,maxRepeatPct:pct(maxRepeat,words.length)};
  }
  function pct(n,d){ return d?Math.round((n/d)*100):0; }
  function seconds(ms){ return Math.round(ms/1000); }

  function createSession(){
    const seed=(crypto&&crypto.getRandomValues)?crypto.getRandomValues(new Uint32Array(1))[0]:(Math.random()*0xffffffff)>>>0;
    return {
      v:VERSION,
      seed,
      sessionId:fnv32(String(seed)+':'+now()).toString(16).padStart(8,'0'),
      startedAt:now(), lastActiveAt:now(), activeMs:0,
      stepIndex:0,
      route:[], answers:{},
      telemetry:{
        inputEvents:0, deleteEvents:0, pasteEvents:0, pasteChars:0, maxPaste:0,
        clipboard:{paste:0,copy:0,cut:0,drop:0},
        typing:{events:0,insertedChars:0,deleteEvents:0,pauses:0,bursts:0,maxBurstEvents:0,activeTypingMs:0,lastAt:0,currentBurstEvents:0},
        fieldTyping:{}, focusLosses:0, majorRevisions:0, fieldVisits:{}, sourceSelections:0,
        stepTimings:{}, currentStepStarted:now(), visibilityHiddenAt:null,
        checkpoints:{}, lastFieldSnapshots:{}, validation:{}
      }
    };
  }
  function loadState(){
    try{ const raw=localStorage.getItem(STORAGE_KEY); if(raw){const s=JSON.parse(raw); if(s&&s.v===VERSION) return s;} }catch(e){}
    return createSession();
  }
  function saveState(state){
    state.lastActiveAt=now();
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(e){}
  }
  function clearState(){ try{localStorage.removeItem(STORAGE_KEY);}catch(e){} }

  function compactTelemetry(state){
    const a=state.answers||{}; const t=state.telemetry||{};
    const textFields=['instinctWhy','challenge1Reflection','challenge2Reflection','sourceReflection','framework','finalReason','metacognition'];
    const finalChars=textFields.reduce((n,k)=>n+String(a[k]||'').length,0);
    const finalWords=textFields.reduce((n,k)=>n+countWords(a[k]||''),0);
    const pasteRatio=pct(t.pasteChars||0,Math.max(1,finalChars));
    const cb=t.clipboard||{}; const ty=t.typing||{};
    const typedToFinal=pct(ty.insertedChars||0,Math.max(1,finalChars));
    const elapsed=Math.max(0,(state.completedAt||now())-(state.startedAt||now()));
    const hashes={
      f:simHash64(a.framework||''),
      r:simHash64(a.finalReason||''),
      c:simHash64(a.challenge1Reflection||''),
      m:simHash64(a.metacognition||''),
      o:simHash64(a.challenge2Reflection||'')
    };
    const lengths=[String(a.framework||'').length,String(a.finalReason||'').length,String(a.challenge1Reflection||'').length,String(a.metacognition||'').length,String(a.challenge2Reflection||'').length];
    const flags=[];
    if((cb.paste||t.pasteEvents||0)>0) flags.push('blocked-paste-attempt');
    if((cb.copy||0)+(cb.cut||0)+(cb.drop||0)>0) flags.push('clipboard-attempt');
    if(finalWords>120 && (t.majorRevisions||0)===0) flags.push('low-revision');
    if((t.focusLosses||0)>=7) flags.push('many-focus-changes');
    if((t.sourceSelections||0)===0) flags.push('no-source-selection');
    if(elapsed>0 && finalWords>180 && seconds(elapsed)<300) flags.push('very-fast-completion');
    const validationOrder=['instinctWhy','challenge1Reflection','challenge2Reflection','sourceReflection','framework','finalReason','metacognition'];
    const validation=t.validation||{}; const vf=[];
    validationOrder.forEach((k,i)=>{const v=validation[k];if(v?.attempts)vf.push([i,v.attempts||0,v.length||0,v.variety||0,v.clarity||0,v.repetition||0,v.resolved?1:0]);});
    const initStance=Number(a.initialStance??0), finalStance=Number(a.finalStance??0);
    const initConf=Number(a.initialConfidence??0), finalConf=Number(a.finalConfidence??0);
    return {
      v:VERSION,
      id:state.sessionId,
      sc:String(a.studentCode||'').slice(0,32),
      md:String(a.workMode||'').slice(0,12),
      tm:[state.startedAt||0,state.completedAt||now(),seconds(state.activeMs||elapsed)],
      p:[t.pasteEvents||0,t.pasteChars||0,t.maxPaste||0,pasteRatio],
      cb:[cb.paste||t.pasteEvents||0,cb.copy||0,cb.cut||0,cb.drop||0],
      ty:[ty.events||0,ty.insertedChars||0,ty.deleteEvents||0,ty.pauses||0,ty.bursts||0,ty.maxBurstEvents||0,seconds(ty.activeTypingMs||0),typedToFinal,finalWords],
      e:[t.inputEvents||0,t.deleteEvents||0,t.majorRevisions||0,t.focusLosses||0],
      sh:[initStance,finalStance,initConf,finalConf],
      so:[t.sourceSelections||0],
      rt:(state.route||[]).map(x=>String(x).slice(0,16)),
      sp:Object.entries(a.spectrumPlacements||{}).map(([id,p])=>[String(id).slice(0,16),p?.bucket==='irrelevant'?-1:Math.max(0,Math.min(100,Math.round(Number(p?.position)||0)))]),
      fe:(a.finalEvidence||[]).map(id=>String(id).slice(0,16)),
      uc:a.customCase?[1,a.customCase.image?1:0,a.customCase.url?1:0,String(a.customCase.verdict||'').slice(0,8)]:[0,0,0,''],
      h:[hashes.f,hashes.r,hashes.c,hashes.m,hashes.o],
      l:lengths,
      vf,
      fl:flags
    };
  }
  function encodeTelemetry(state){
    const payload=JSON.stringify(compactTelemetry(state));
    const body=utf8ToB64Url(payload);
    const checksum=fnv32(payload).toString(16).padStart(8,'0');
    return PREFIX+body+'.'+checksum;
  }
  function decodeTelemetry(code){
    const s=String(code||'').trim();
    if(!s.startsWith(PREFIX)) throw new Error('Not a Boundary / Art telemetry code.');
    const rest=s.slice(PREFIX.length); const dot=rest.lastIndexOf('.');
    if(dot<0) throw new Error('Telemetry code is incomplete.');
    const body=rest.slice(0,dot), given=rest.slice(dot+1);
    const payload=b64UrlToUtf8(body); const expected=fnv32(payload).toString(16).padStart(8,'0');
    if(given!==expected) throw new Error('Telemetry checksum failed.');
    const data=JSON.parse(payload);
    if(data.v!==VERSION) throw new Error('Unsupported telemetry version.');
    return data;
  }
  function seeded(seed){
    let x=(seed>>>0)||0x9e3779b9;
    return function(){x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};
  }
  function shuffled(arr,seed){
    const out=arr.slice(), rnd=seeded(seed);
    for(let i=out.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[out[i],out[j]]=[out[j],out[i]];}
    return out;
  }
  function fmtDuration(sec){
    sec=Math.max(0,Number(sec)||0); const m=Math.floor(sec/60), s=sec%60;
    return m?`${m}m ${s}s`:`${s}s`;
  }
  function reviewSummary(data){
    const flags=[];
    const cb=data.cb||[data.p?.[0]||0,0,0,0];
    const ty=data.ty||[];
    if((cb[0]||0)>0) flags.push({level:'review',text:`${cb[0]} blocked paste attempt${cb[0]===1?'':'s'} recorded`});
    const otherClipboard=(cb[1]||0)+(cb[2]||0)+(cb[3]||0);
    if(otherClipboard>0) flags.push({level:'context',text:`${otherClipboard} blocked copy/cut/drop attempt${otherClipboard===1?'':'s'} recorded`});
    if((ty[1]||0)>0 && (ty[8]||0)>0) flags.push({level:'context',text:`${ty[1]} typed characters across ${ty[0]||0} text-edit events, with ${ty[3]||0} composition pauses`});
    if((data.e?.[2]||0)===0 && ((data.l||[]).reduce((a,b)=>a+b,0)>500)) flags.push({level:'review',text:'Substantial final writing with no recorded major revision after a saved checkpoint'});
    if((data.e?.[3]||0)>=7) flags.push({level:'context',text:`${data.e[3]} focus changes; could reflect source checking or task switching`});
    if((data.so?.[0]||0)===0) flags.push({level:'review',text:'No source-card selection recorded'});
    if((data.fl||[]).includes('very-fast-completion')) flags.push({level:'review',text:'Completion was unusually fast relative to the amount of final writing'});
    const validationLabels=['First reason','Challenge 1 explanation','Challenge 2 explanation','Revision reflection','Student rule','Considered answer','Thinking-change reflection'];
    for(const row of (data.vf||[])){
      const [idx,attempts,len,variety,clarity,repetition,resolved]=row;
      const reasons=[]; if(len)reasons.push(`development ${len}`); if(variety)reasons.push(`repetition/variety ${variety}`); if(clarity)reasons.push(`unclear/non-word text ${clarity}`); if(repetition)reasons.push(`heavy repetition ${repetition}`);
      flags.push({level:(attempts>=3||!resolved)?'review':'context',text:`${validationLabels[idx]||('Response '+(idx+1))}: response gate triggered ${attempts} time${attempts===1?'':'s'}${reasons.length?' ('+reasons.join(', ')+')':''}${resolved?' before the student revised successfully':''}`});
    }
    if(!flags.length) flags.push({level:'context',text:'No single process indicator exceeds the built-in review thresholds'});
    return flags;
  }

  global.TOKShared={VERSION,PREFIX,STORAGE_KEY,now,clamp,normalizeText,tokenizeWords,countWords,responseStats,simHash64,hamming64,pct,seconds,createSession,loadState,saveState,clearState,compactTelemetry,encodeTelemetry,decodeTelemetry,seeded,shuffled,fmtDuration,reviewSummary};
})(window);
