/* =====================================================================
   THE CLASS OF ROWDIES / AFTER HOURS — engine
   Film gate (carried over) > sound > scenes > choices > shocks > atmosphere
   The words live in story.js.
   ===================================================================== */
(() => {
'use strict';
const root=document.documentElement, body=document.body;
const $=(s,el=document)=>el.querySelector(s), $$=(s,el=document)=>[...el.querySelectorAll(s)];
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const chapter=$('#chapter'), progress=$('#progress');
let journeyUnlocked=false, soundWanted=false, gentle=reduced;

/* =====================================================================
   SOUND
   Recorded ambience from assets/audio (public domain / CC0, see footer)
   layered with a little live synthesis. Every channel is mixed per
   scene; jazz and chatter share a "club" bus that can be driven into
   distortion, filtered behind walls, and warped like a sick record.
   ===================================================================== */
const AUDIO='assets/audio/';
const LOOPS={jazz:'jazz',chatter:'chatter',crackle:'crackle',heartbeat:'heart',clock:'clock',fluorescent:'hum',birds:'birds'};
const SHOTS=['school-bell','zap','zap-long','match','knock'];
const BASE={jazz:.85,chatter:.75,crackle:.8,heart:1,clock:.95,hum:.35,drone:.55,birds:1.1,tinnitus:.09,room:.55};

const Sound={ctx:null,master:null,ch:{},buf:{},src:{},els:{},started:false,loading:null,mix:{},override:null,fileMode:location.protocol==='file:',
  init(){
    if(this.ctx)return;
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    const c=this.ctx=new AC();
    this.comp=c.createDynamicsCompressor();this.comp.threshold.value=-16;this.comp.knee.value=8;this.comp.ratio.value=4;this.comp.attack.value=.004;this.comp.release.value=.25;this.comp.connect(c.destination);
    this.master=c.createGain();this.master.gain.value=0;this.master.connect(this.comp);
    this.club=c.createGain();this.dry=c.createGain();this.wet=c.createGain();this.wet.gain.value=0;
    this.shaper=c.createWaveShaper();this.shaper.curve=curve(80);this.shaper.oversample='2x';
    this.club.connect(this.dry).connect(this.master);this.club.connect(this.shaper).connect(this.wet).connect(this.master);
    const mk=(name,dest,filt)=>{const g=c.createGain();g.gain.value=0;g.connect(dest||this.master);let input=g,f=null;if(filt){f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=16000;f.Q.value=.8;f.connect(g);input=f}this.ch[name]={g,f,input}};
    mk('jazz',this.club,true);mk('chatter',this.club,true);['crackle','heart','clock','hum','drone','birds','tinnitus','room'].forEach(n=>mk(n));
    this.fx=c.createGain();this.fx.connect(this.master);
    // record warp: one slow LFO bends the jazz pitch
    this.lfo=c.createOscillator();this.lfo.frequency.value=.21;this.lfoGain=c.createGain();this.lfoGain.gain.value=0;this.lfo.connect(this.lfoGain);this.lfo.start();
    this.noise=noiseBuffer(c,2);
    this.buf.heartbeat=genHeart(c);this.buf.clock=genClock(c);this.buf.crackle=genCrackle(c);
    this.synth();
  },
  synth(){
    const c=this.ctx,t=c.currentTime;
    // fluorescent hum: mains harmonics pitched where small speakers can actually play them
    this.humGate=c.createGain();this.humGate.gain.value=1;
    const hp=c.createBiquadFilter();hp.type='highpass';hp.frequency.value=140;const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2600;
    [[100,0],[150,6],[300,-4]].forEach(([f,d],i)=>{const o=c.createOscillator();o.type='sawtooth';o.frequency.value=f;o.detune.value=d;const g=c.createGain();g.gain.value=[.16,.07,.035][i];o.connect(g).connect(hp);o.start(t)});
    hp.connect(lp).connect(this.humGate).connect(this.ch.hum.input);
    // horror drone: detuned stack with a slow breathing filter and a beating pair
    const dl=c.createBiquadFilter();dl.type='lowpass';dl.frequency.value=520;dl.Q.value=4;
    const sweep=c.createOscillator();sweep.frequency.value=.055;const sg=c.createGain();sg.gain.value=330;sweep.connect(sg).connect(dl.frequency);sweep.start(t);
    [55,110.4,164.2,221.3,329.1].forEach((f,i)=>{const o=c.createOscillator();o.type=i%2?'sawtooth':'triangle';o.frequency.value=f;const g=c.createGain();g.gain.value=i<2?.2:.09;o.connect(g).connect(dl);o.start(t)});
    dl.connect(this.ch.drone.input);
    [440,443.2].forEach(f=>{const o=c.createOscillator();o.frequency.value=f;const g=c.createGain();g.gain.value=.022;o.connect(g).connect(this.ch.drone.input);o.start(t)});
    // tinnitus after the blowout
    const ti=c.createOscillator();ti.frequency.value=5600;ti.connect(this.ch.tinnitus.input);ti.start(t);
    // room tone
    const rn=c.createBufferSource();rn.buffer=this.noise;rn.loop=true;const rl=c.createBiquadFilter();rl.type='lowpass';rl.frequency.value=700;const rg=c.createGain();rg.gain.value=.3;rn.connect(rl).connect(rg).connect(this.ch.room.input);rn.start(t);
  },
  unlock(){this.init();if(this.ctx&&this.ctx.state==='suspended')this.ctx.resume();this.load();},
  load(){
    if(this.loading||!this.ctx)return this.loading;
    const names=[...Object.keys(LOOPS),...SHOTS];
    this.loading=Promise.all(names.map(async n=>{
      if(this.fileMode){const el=new Audio(AUDIO+n+'.mp3');el.preload='auto';el.loop=!!LOOPS[n];this.els[n]=el;return}
      try{const r=await fetch(AUDIO+n+'.mp3');if(!r.ok)throw new Error(r.status);const b=await this.ctx.decodeAudioData(await r.arrayBuffer());this.buf[n]=b;this.real=this.real||{};this.real[n]=1;if(this.started&&LOOPS[n])this.attach(n)}catch(e){/* missing file: synthesized fallback (if any) stays */}
    }));
    return this.loading;
  },
  attach(n){
    const c=this.ctx,chName=LOOPS[n];if(!c||!this.buf[n])return;
        const old=this.src[n];if(old){try{old.stop()}catch(e){}}
    const s=c.createBufferSource();s.buffer=this.buf[n];s.loop=true;
    if(n==='jazz'){this.lfoGain.connect(s.playbackRate)}
    s.connect(this.ch[chName].input);
    const off=Math.random()*Math.max(0,s.buffer.duration-1);
    s.start(0,off);this.src[n]=s;if(n==='jazz'){this.jazzAt=c.currentTime;this.jazzOff=off}
    if(n==='clock')s.playbackRate.value=this.mix.clockRate||1;
  },
  startJourney(){
    if(this.started)return;this.started=true;
    if(this.fileMode){Object.entries(this.els).forEach(([n,el])=>{if(LOOPS[n]){el.volume=0;el.play().catch(()=>{})}});return}
    Object.keys(LOOPS).forEach(n=>this.attach(n));
  },
  set(m){
    this.mix=m||{};if(!this.ctx)return;
    const c=this.ctx,now=c.currentTime,mm=this.override||this.mix,lv=k=>soundWanted?(mm[k]||0):0;
    Object.entries(this.ch).forEach(([k,ch])=>{hold(ch.g.gain,now);ch.g.gain.setTargetAtTime(lv(k)*BASE[k],now,.55)});
    this.ch.jazz.f.frequency.setTargetAtTime(mm.jazzCut||16000,now,.35);
    this.ch.chatter.f.frequency.setTargetAtTime(mm.chatterCut||16000,now,.35);
    const dirt=mm.dirt||0;this.wet.gain.setTargetAtTime(dirt*.9,now,.4);this.dry.gain.setTargetAtTime(1-dirt*.45,now,.4);
    this.lfoGain.gain.setTargetAtTime((mm.warp||0)*.05,now,.6);
    if(this.src.clock)this.src.clock.playbackRate.setTargetAtTime(mm.clockRate||1,now,.5);
    this.skipOn=!!mm.skip;
  },
  /* the needle lifts: named channels stop dead instead of fading */
  hardSet(m,cut){this.set(m);if(!this.ctx)return;const now=this.ctx.currentTime;cut.forEach(k=>{const g=this.ch[k].g.gain;hold(g,now);g.setValueAtTime(soundWanted?(m[k]||0)*BASE[k]:0,now)});this.burst(.05,.7,{f:1600,q:2});this.osc('sine',95,38,.14,.5)},
  level(k,v){if(!this.ctx)return;const g=this.ch[k].g.gain;g.setTargetAtTime(soundWanted?v*BASE[k]:0,this.ctx.currentTime,.08)},
  breath(){[0,2.6].forEach(w=>{this.burst(1.3,.16,{f:700,q:.6,when:w});this.burst(1.6,.12,{f:1100,f2:500,q:.5,when:w+1.3})})},
  cheer(){this.roar();this.osc('sawtooth',220,440,.35,.08);this.osc('square',330,660,.35,.05,.05)},
  blackout(){
    this.override={tinnitus:.85};if(!this.ctx)return;const now=this.ctx.currentTime;
    Object.entries(this.ch).forEach(([k,ch])=>{ch.g.gain.cancelScheduledValues(now);ch.g.gain.setValueAtTime(k==='tinnitus'&&soundWanted?BASE.tinnitus*.85:0,now)});
    this.wet.gain.setValueAtTime(0,now);
  },
  mute(v){if(!this.ctx)return;const now=this.ctx.currentTime;hold(this.master.gain,now);this.master.gain.setTargetAtTime(v?0:.95,now,.08);if(!v)this.set(this.mix)},
  tick(){
    if(this.fileMode&&this.started){const mm=this.override||this.mix;Object.entries(this.els).forEach(([n,el])=>{const k=LOOPS[n];if(!k)return;const target=soundWanted?clamp((mm[k]||0)*BASE[k]):0;el.volume=clamp(el.volume+(target-el.volume)*.05)})}
    if(this.skipOn&&this.src.jazz&&this.ctx){const now=this.ctx.currentTime;if(!this.nextSkip||now>this.nextSkip){if(this.nextSkip){const d=this.buf.jazz.duration,pos=(this.jazzOff+(now-this.jazzAt))%d;this.src.jazz.stop();const s=this.ctx.createBufferSource();s.buffer=this.buf.jazz;s.loop=true;this.lfoGain.connect(s.playbackRate);s.connect(this.ch.jazz.input);const o=Math.max(0,pos-1.1);s.start(0,o);this.src.jazz=s;this.jazzAt=now;this.jazzOff=o;this.click(.5)}this.nextSkip=now+2.6+Math.random()*2.2}}
  },
  humFlick(on){if(!this.ctx)return;const now=this.ctx.currentTime;this.humGate.gain.setTargetAtTime(on?1:.18,now,.012);this.click(on?.35:.2)},
  /* ---- one-shots ---- */
  one(name,{rate=1,gain=1,cut=0}={}){
    if(!this.ctx||!soundWanted)return false;
    if(this.fileMode&&this.els[name]){try{const el=this.els[name].cloneNode();el.volume=clamp(gain*.9);el.playbackRate=rate;el.play().catch(()=>{})}catch(e){}return true}
    const b=this.real&&this.real[name]?this.buf[name]:null;if(!b)return false;
    const c=this.ctx,s=c.createBufferSource(),g=c.createGain();s.buffer=b;s.playbackRate.value=rate;g.gain.value=gain;
    if(cut){const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=cut;s.connect(f).connect(g)}else s.connect(g);
    g.connect(this.fx);s.start();return true;
  },
  osc(type,f1,f2,dur,vol,when=0){const c=this.ctx;if(!c||!soundWanted)return;const t=c.currentTime+when,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f1,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f2),t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0008,t+dur);o.connect(g).connect(this.fx);o.start(t);o.stop(t+dur+.05)},
  burst(dur,vol,{type='bandpass',f=3000,f2=0,q=1,when=0,shape=0}={}){const c=this.ctx;if(!c||!soundWanted)return;const t=c.currentTime+when,s=c.createBufferSource(),fl=c.createBiquadFilter(),g=c.createGain();s.buffer=this.noise;fl.type=type;fl.frequency.setValueAtTime(f,t);if(f2)fl.frequency.exponentialRampToValueAtTime(f2,t+dur);fl.Q.value=q;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0008,t+dur);let n=s.connect(fl);if(shape){const w=c.createWaveShaper();w.curve=curve(shape);n=n.connect(w)}n.connect(g).connect(this.fx);s.start(t,Math.random());s.stop(t+dur+.05)},
  click(v=.3){this.burst(.025,v*.5,{type:'highpass',f:2500})},
  hit(){this.osc('triangle',310,62,.28,.35)},
  thud(v=1){this.osc('sine',120,38,.5,.9*v);this.burst(.22,.5*v,{type:'lowpass',f:500})},
  zap(level=1){
    if(!this.ctx||!soundWanted)return;const c=this.ctx,t=c.currentTime,dur=.22+.3*level;
    this.one('zap',{gain:Math.min(1.2,.7+level*.4)});
    // stuttering arc: gated distorted noise
    const s=c.createBufferSource(),hp=c.createBiquadFilter(),w=c.createWaveShaper(),g=c.createGain(),gate=c.createGain(),lf=c.createOscillator(),lg=c.createGain();
    s.buffer=this.noise;hp.type='highpass';hp.frequency.value=900;w.curve=curve(120);lf.type='square';lf.frequency.value=38+Math.random()*30;lg.gain.value=.5;gate.gain.value=.5;lf.connect(lg).connect(gate.gain);
    g.gain.setValueAtTime(.55*level,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
    s.connect(hp).connect(w).connect(gate).connect(g).connect(this.fx);s.start(t,Math.random());s.stop(t+dur+.05);lf.start(t);lf.stop(t+dur+.05);
    this.osc('sawtooth',2400,180,.12,.25*level);this.thud(.6*level);
  },
  bell(rate=1,cut=0){if(this.one('school-bell',{rate,gain:rate<1?1:.9,cut}))return;const c=this.ctx;if(!c||!soundWanted)return;const t=c.currentTime,g=c.createGain(),trem=c.createOscillator(),tg=c.createGain();trem.frequency.value=22;tg.gain.value=.5;g.gain.value=.5;trem.connect(tg).connect(g.gain);const env=c.createGain();env.gain.setValueAtTime(.35,t);env.gain.setValueAtTime(.35,t+2.2);env.gain.exponentialRampToValueAtTime(.001,t+3);[1,2.76,5.4,8.93].forEach((m,i)=>{const o=c.createOscillator();o.frequency.value=720*rate*m;const og=c.createGain();og.gain.value=[.4,.2,.1,.05][i];o.connect(og).connect(g);o.start(t);o.stop(t+3.1)});g.connect(env).connect(this.fx);trem.start(t);trem.stop(t+3.1)},
  knock(){if(this.one('knock',{gain:1.1}))return;[0,.27,.5].forEach(w=>{this.osc('sine',160,70,.18,.8,w);this.burst(.08,.6,{type:'lowpass',f:900,when:w})})},
  match(){if(this.one('match',{gain:1.9}))return;this.burst(.14,.6,{f:3500,f2:1500,q:.8});this.burst(.9,.35,{type:'lowpass',f:900,f2:300,when:.1})},
  roar(){this.burst(2.4,.5,{f:900,q:.5});if(this.buf.chatter&&this.ctx&&soundWanted){const c=this.ctx,t=c.currentTime,s=c.createBufferSource(),g=c.createGain();s.buffer=this.buf.chatter;s.playbackRate.value=1.12;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(1.3,t+.15);g.gain.exponentialRampToValueAtTime(.01,t+3);s.connect(g).connect(this.fx);s.start(t,Math.random()*5);s.stop(t+3.1)}},
  buzz(){for(let i=0;i<2;i++){this.osc('square',170,165,.18,.18,i*.24);this.burst(.18,.12,{type:'lowpass',f:300,when:i*.24})}},
  warm(){[261.6,329.6,392,523.3].forEach((f,i)=>this.osc('sine',f,f*.998,1.6,.12,i*.09))},
  neon(){this.osc('sawtooth',120,118,.5,.18);this.burst(.5,.2,{f:3000,shape:40})},
  sizzle(on){if(!this.ctx)return;if(on){if(this.fz||!soundWanted)return;const c=this.ctx,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=this.noise;s.loop=true;f.type='bandpass';f.frequency.value=4200;f.Q.value=1.4;g.gain.value=.07;s.connect(f).connect(g).connect(this.fx);s.start();this.fz=s}else if(this.fz){try{this.fz.stop()}catch(e){}this.fz=null}}
};
function hold(param,t){if(param.cancelAndHoldAtTime)param.cancelAndHoldAtTime(t);else{param.cancelScheduledValues(t);param.setValueAtTime(param.value,t)}}
function curve(k){const n=2048,a=new Float32Array(n);for(let i=0;i<n;i++){const x=i*2/n-1;a[i]=(3+k)*x*20*Math.PI/180/(Math.PI+k*Math.abs(x))}return a}
function noiseBuffer(c,sec){const b=c.createBuffer(1,c.sampleRate*sec,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;return b}
function genHeart(c){const sr=c.sampleRate,len=Math.floor(sr*.92),b=c.createBuffer(1,len,sr),d=b.getChannelData(0);const beat=(t0,amp)=>{for(let i=0;i<sr*.2;i++){const t=i/sr,f=95-200*t,e=Math.exp(-t*24);d[Math.floor(t0*sr)+i]+=amp*e*(Math.sin(2*Math.PI*f*t)+.45*Math.sin(4*Math.PI*f*t)+.2*(Math.random()*2-1)*Math.exp(-t*80))}};beat(0,.9);beat(.26,.55);return b}
function genClock(c){const sr=c.sampleRate,b=c.createBuffer(1,sr*2,sr),d=b.getChannelData(0);[[0,2600],[1,1900]].forEach(([t0,f])=>{for(let i=0;i<sr*.04;i++){const t=i/sr;d[Math.floor(t0*sr)+i]=.8*Math.exp(-t*160)*Math.sin(2*Math.PI*f*t)*(0.6+.4*Math.random())}});return b}
function genCrackle(c){const sr=c.sampleRate,b=c.createBuffer(1,sr*4,sr),d=b.getChannelData(0);for(let i=0;i<d.length;i++){d[i]=(Math.random()*2-1)*.012;if(Math.random()<.0009){const a=(Math.random()*.8+.2)*(Math.random()<.5?-1:1);for(let j=0;j<40&&i+j<d.length;j++)d[i+j]+=a*Math.exp(-j/6)}}return b}

const soundBtn=$('#soundBtn');
function paintSoundBtn(){soundBtn.setAttribute('aria-pressed',String(soundWanted));soundBtn.textContent=soundWanted?'sound on':'sound off'}
soundBtn.addEventListener('click',()=>{Sound.unlock();soundWanted=!soundWanted;paintSoundBtn();Sound.mute(!soundWanted);if(journeyUnlocked)Sound.startJourney()});
const shockBtn=$('#shockBtn');
function paintShockBtn(){shockBtn.textContent=gentle?'shocks: gentle':'shocks: full';shockBtn.dataset.on=gentle?'gentle':'full';shockBtn.setAttribute('aria-pressed',String(gentle))}
shockBtn.addEventListener('click',()=>{gentle=!gentle;paintShockBtn()});paintShockBtn();

/* =====================================================================
   FILM GATE (carried over from the original build)
   ===================================================================== */
let player=null,ytReady=false,watchTimer=null,bypassTimer=null,secondsToBypass=30,furthest=0,duration=0,lastTime=0,startedFilm=false,gateReady=false;
const filmControl=$('#filmControl'),beginFilm=$('#beginFilm'),watchFill=$('#watchFill'),watchStatus=$('#watchStatus'),watchPct=$('#watchPct'),bypass=$('#bypass'),bypassTitle=$('#bypassTitle'),bypassCount=$('#bypassCount'),filmNote=$('#filmNote');

function buildPrivacyPlayer(){
  try{
    const holder=$('#ytPlayer'),iframe=document.createElement('iframe');
    iframe.id='ytPrivacyFrame';iframe.title='Short Film - Class of Rowdies';iframe.setAttribute('allow','autoplay; encrypted-media; picture-in-picture; fullscreen');iframe.setAttribute('referrerpolicy','strict-origin-when-cross-origin');iframe.setAttribute('allowfullscreen','');
    const params=new URLSearchParams({enablejsapi:'1',controls:'0',disablekb:'1',rel:'0',playsinline:'1',fs:'0',cc_load_policy:'0'});
    if(location.protocol==='http:'||location.protocol==='https:')params.set('origin',location.origin);
    iframe.src='https://www.youtube-nocookie.com/embed/vsApwK9khRo?'+params.toString();holder.replaceChildren(iframe);
    player=new YT.Player('ytPrivacyFrame',{events:{onReady:()=>{ytReady=true;watchStatus.textContent=startedFilm?'watching':'ready';if(startedFilm){try{player.playVideo()}catch(e){}}},onStateChange:(e)=>{if(window.YT&&e.data===YT.PlayerState.ENDED)armExit('screening complete',true)},onError:()=>{watchStatus.textContent='embed blocked - timer still works';}}});
  }catch(e){watchStatus.textContent='embed unavailable - timer still works';filmNote.textContent='YouTube could not initialize here. Open the original video if needed; the leaking-glass exit still unlocks after 30 seconds.';}
}
window.onYouTubeIframeAPIReady=buildPrivacyPlayer;
const api=document.createElement('script');api.src='https://www.youtube.com/iframe_api';document.head.appendChild(api);

beginFilm.addEventListener('click',async()=>{
  Sound.unlock();soundWanted=true;paintSoundBtn();Sound.mute(false);startedFilm=true;body.classList.add('screening-active');filmControl.classList.add('gone');watchStatus.textContent=ytReady?'watching':'loading player';startBypassCountdown();
  try{if(!document.fullscreenElement&&document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen()}catch(e){}
  if(ytReady){try{player.playVideo()}catch(e){}}
  if(!watchTimer)watchTimer=setInterval(trackWatch,500);
});
function paintGlass(){
  const remaining=Math.max(0,secondsToBypass)/30;bypass.style.setProperty('--remaining',remaining.toFixed(3));bypassCount.textContent='00:'+String(secondsToBypass).padStart(2,'0');bypass.setAttribute('aria-label',secondsToBypass>0?'Minimum viewing time: '+secondsToBypass+' seconds':'Continue to the next screen');
}
paintGlass();
function startBypassCountdown(){
  if(bypassTimer||secondsToBypass<=0)return;
  bypassTimer=setInterval(()=>{secondsToBypass=Math.max(0,secondsToBypass-1);paintGlass();if(secondsToBypass===0){clearInterval(bypassTimer);bypassTimer=null;armExit('minimum elapsed',false)}},1000);
}
function armExit(reason,watched){
  gateReady=true;bypass.disabled=false;bypass.classList.add('ready');bypassTitle.textContent=watched?'screening complete':'continue anyway';bypassCount.textContent='NEXT';watchStatus.textContent=watched?reason:'continue unlocked';
  if(watched){watchFill.style.width='100%';watchPct.textContent='passed'}
}
function trackWatch(){
  if(!player||!ytReady)return;
  try{
    duration=player.getDuration()||duration;const state=player.getPlayerState(),t=player.getCurrentTime()||0;
    if(window.YT&&state===YT.PlayerState.PLAYING){
      if(lastTime>0&&t>furthest+2.6){player.seekTo(Math.max(0,furthest-.25),true);watchStatus.textContent='fast-forward blocked';Sound.hit()}
      else if(t>=furthest-.6&&t<=furthest+2.6){furthest=Math.max(furthest,t);watchStatus.textContent='watching'}
    }
    lastTime=t;const pct=duration?Math.min(100,furthest/duration*100):0;watchFill.style.width=pct.toFixed(1)+'%';watchPct.textContent=Math.floor(pct)+'%';if(pct>=90)armExit('90% watched',true);
  }catch(e){}
}
bypass.addEventListener('click',async()=>{
  if(!gateReady)return;
  journeyUnlocked=true;clearInterval(watchTimer);watchTimer=null;clearInterval(bypassTimer);bypassTimer=null;
  try{if(player&&ytReady)player.pauseVideo()}catch(e){}
  Sound.unlock();Sound.startJourney();
  body.classList.remove('screening-active','film-locked');body.classList.add('journey-live');
  try{if(document.fullscreenElement)await document.exitFullscreen()}catch(e){}
  // hard cut: the film is gone, not scrolled past
  $('#screening').hidden=true;scrollTo(0,0);lastInput=performance.now();activeScene=null;
});

/* =====================================================================
   SCENES
   ===================================================================== */
const STORY=window.STORY||[];
const state={forks:{},pw:'',neon:[],lamp:0,timeouts:0};
const journey=$('#journey');
const scenes=[];
let rngSeed=7;const rng=()=>{rngSeed=(rngSeed*16807)%2147483647;return(rngSeed-1)/2147483646};
const el=(tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e};

STORY.forEach((sc,idx)=>{
  const sec=el('section','scene look-'+(sc.look||'plain'));sec.id='s-'+sc.id;sec.hidden=true;
  sec.style.setProperty('--h',sc.h);sec.style.setProperty('--sc',sc.chaos);sec.dataset.chapter=sc.label;
  const stage=el('div','stage');sec.appendChild(stage);
  const S={sc,sec,stage,idx,beats:[],fired:{},p:0,gateShown:false,resolved:false};
  if(sc.art){
    const art=el('div','art');
    ['main','ghost g1'].forEach(k=>{const im=el('img',k);im.alt=k==='main'?(sc.credit||'').replace(/<[^>]+>/g,''):'';if(k!=='main')im.setAttribute('aria-hidden','true');im.dataset.src='assets/art/'+sc.art;art.appendChild(im)});
    const mosh=el('canvas','mosh');mosh.setAttribute('aria-hidden','true');art.appendChild(mosh);S.mosh=mosh;
    art.querySelector('.main').addEventListener('error',()=>art.remove());
    stage.appendChild(art);S.art=art;
    if(sc.credit)stage.appendChild(el('div','credit',sc.credit));
  }
  if(sc.lampAt){sec.style.setProperty('--lx',sc.lampAt[0]*100+'%');sec.style.setProperty('--ly',sc.lampAt[1]*100+'%')}
  const look=sc.look||'';
  if(look==='tube'){S.tube=el('div','tube');stage.appendChild(S.tube);S.tubeOn=false;S.nextFlick=0}
  if(look==='neon'||look==='overload'){stage.appendChild(el('i','deco-rule top'));stage.appendChild(el('i','deco-rule bot'));(sc.signs||[]).forEach((t,i)=>{const n=el('div','neon-sign '+['','c','a'][i%3]);const die=[...t].map((c,j)=>c===' '?-1:j).filter(j=>j>=0);const dj=die[(rng()*die.length)|0];[...t].forEach((c,j)=>{const l=el('span',j===dj?'die':null);l.textContent=c;n.appendChild(l)});n.style.left=(i%2?54:58)+'vw';n.style.top=(i%2?80:5)+'vh';n.style.transform='rotate('+(i%2?4:-5)+'deg)';stage.appendChild(n)})}
  if(look==='lamp')stage.appendChild(el('div','flame'));
  if(look==='door'){
    const door=el('div','door','<div class="slot"><div class="eyes"></div><div class="cover"></div></div><div class="knob"></div>');
    stage.appendChild(door);stage.appendChild(el('div','door-light'));
    const pw=el('div','password','<div class="ask">What’s the word?</div><form><input maxlength="18" autocomplete="off" spellcheck="false" aria-label="The word at the door"><button type="submit">say it</button></form><div class="hint">any word. or none.</div>');
    stage.appendChild(pw);S.door=door;S.pwBox=pw;
    pw.querySelector('form').addEventListener('submit',e=>{e.preventDefault();submitPassword(S,pw.querySelector('input').value)});
  }
  // beats
  const flow=sc.chaos<.3;const bx=el('div','beats'+(flow?' flow':''));stage.appendChild(bx);
  const n=sc.beats.length,top=sc.gate?7:10,span=sc.gate?44:64;
  sc.beats.forEach((b,i)=>{
    const k=b.k||'line',d=el('div','beat b-'+k),t=el('span','t');d.appendChild(t);
    if(!flow){
      const x=k==='slam'?(look==='tube'?-1.5-rng()*1.5:3+rng()*14):k==='whisper'?(i===0?3:6+rng()*40):(i%2?44+rng()*14:4+rng()*16);
      const y=k==='whisper'&&i===0?(sc.gate?4:90):top+(n>1?i*(span/(n-1)):span/2)+(rng()-.5)*5;
      d.style.setProperty('--x',x.toFixed(1)+'%');if(y>48){d.classList.add('low');d.style.setProperty('--yb',(100-y-(k==='slam'?4:0)).toFixed(1)+'%')}else d.style.setProperty('--y',y.toFixed(1)+'%');
      d.style.setProperty('--r',((rng()-.5)*2*6*sc.chaos).toFixed(2)+'deg');
      if(k==='line'&&sc.chaos>=.8){const j=()=>(rng()*7).toFixed(1)+'px';d.style.clipPath=`polygon(${j()} 0,48% ${j()},100% 0,calc(100% - ${j()}) 52%,100% 100%,52% calc(100% - ${j()}),0 100%,${j()} 46%)`}
    }else d.style.setProperty('--r','0deg');
    bx.appendChild(d);S.beats.push({b,d,t,on:false,shown:false,parts:[]});
  });
  // choices
  if(sc.gate&&typeof sc.gate==='object'){
    const g=sc.gate,gate=el('div','gate');
    if(g.timer){gate.appendChild(el('div','fuse-label','choose before the fuse burns out'));const fz=el('div','fuse','<i class="burn"></i><i class="spark"></i>');fz.style.setProperty('--t',g.timer+'s');gate.appendChild(fz);S.fuse=fz}
    const opts=el('div','options');opts.style.setProperty('--n',g.options.length);
    g.options.forEach(o=>{const btn=el('button','opt');btn.type='button';btn.dataset.id=o.id;btn.dataset.wire=o.wire;btn.appendChild(el('b',null)).textContent=o.label;btn.appendChild(el('span',null)).textContent=o.sub;btn.addEventListener('click',()=>choose(S,o,false));opts.appendChild(btn)});
    gate.appendChild(opts);stage.appendChild(gate);S.gateEl=gate;
  }
  if(sc.end){const again=el('button','again');again.type='button';again.textContent='walk it again ↺';again.addEventListener('click',()=>location.reload());stage.appendChild(again);S.again=again}
  S.cue=el('div','cue-down','scroll ↓');stage.appendChild(S.cue);
  journey.appendChild(sec);scenes.push(S);
});

function isGate(S){return !!S.sc.gate}
function setText(x,text){
  x.text=text||'';x.t.textContent='';x.parts=[];x.d.hidden=!x.text;
  if(x.b.k==='slam'){x.text.split(' ').forEach((w,i)=>{if(i)x.t.appendChild(document.createTextNode(' '));const sp=el('span','w');sp.textContent=w;sp.style.setProperty('--dy',((rng()-.5)*70).toFixed(0)+'px');sp.style.setProperty('--dr',((rng()-.5)*22).toFixed(1)+'deg');sp.style.setProperty('--ds',((rng()-.3)*.4).toFixed(2));x.t.appendChild(sp);x.parts.push({el:sp,text:w})})}
  else{x.t.textContent=x.text;x.parts.push({el:x.t,text:x.text})}
}
function reveal(){
  let blocked=false;
  scenes.forEach(S=>{
    const show=!blocked&&(!S.sc.when||S.sc.when(state));
    if(show&&S.sec.hidden){
      S.sec.hidden=false;
      if(S.art)$$('img',S.art).forEach(im=>{if(!im.src)im.src=im.dataset.src});
      S.beats.forEach(x=>setText(x,typeof x.b.t==='function'?x.b.t(state):x.b.t));
    }else if(!show&&!S.sec.hidden)S.sec.hidden=true;
    if(show&&isGate(S)&&!S.resolved)blocked=true;
  });
}
reveal();

/* ---- the door */
function submitPassword(S,raw){
  if(S.resolved)return;
  const w=(raw||'').replace(/[\u0000-\u001f<>]/g,'').trim().slice(0,18).toUpperCase();
  state.pw=w;S.resolved=true;S.pwBox.classList.remove('show');S.door.classList.remove('open-slot');
  Sound.thud(.8);toast(w?'The door will remember that.':'Nobody checks. The door opens anyway.');
  setTimeout(()=>{S.door.classList.add('swing');Sound.burst(1.2,.25,{type:'lowpass',f:500,f2:2400})},450);
  reveal();setTimeout(()=>goNext(S),1500);
}

/* ---- forks */
function startFuse(S){
  const g=S.sc.gate;if(!g.timer||S.fuseLit||S.resolved)return;S.fuseLit=true;
  S.fuse.classList.add('lit');Sound.sizzle(true);
  S.timer=setTimeout(()=>{const o=g.options.find(x=>x.id===g.timeout)||g.options[0];choose(S,o,true)},g.timer*1000);
}
function choose(S,o,timedOut){
  if(S.resolved)return;S.resolved=true;clearTimeout(S.timer);Sound.sizzle(false);
  const g=S.sc.gate;state.forks[g.fork]=o.id;
  if(S.fuse)S.fuse.classList.add('out');S.gateEl.classList.add('done');
  $$('.opt',S.gateEl).forEach(b=>{const me=b.dataset.id===o.id;b.classList.add(me?'picked':'dead');b.disabled=!me;b.tabIndex=-1});
  if(timedOut)state.timeouts++;
  if(o.wire==='neon'){state.neon.push(o.sign);addBar(o.sign,state.neon.length-1,true);if(timedOut){Sound.thud(.7);nudge(2)}else{Sound.neon();Sound.cheer();flare()}}
  else if(o.wire==='lamp'){state.lamp++;setGlow();Sound.warm();pulseBulb()}
  else Sound.hit();
  const msg=timedOut?(g.timeoutToast||'You didn’t choose. Something else did.'):o.toast;
  if(msg)setTimeout(()=>toast(msg),timedOut?350:120);
  reveal();setTimeout(()=>goNext(S),timedOut?1900:1300);
}
function goNext(S){
  const next=scenes.slice(S.idx+1).find(x=>!x.sec.hidden);
  if(next)next.sec.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});
}

/* ---- the cage and the bulb */
const cage=$('#cage'),bulb=$('#bulb');
const BAR_X=['4vw','calc(100vw - 4vw)','8.5vw'],BAR_CENTER=['58vw','68vw','78vw'],OTHERS=['NO CLOCKS','OPEN ALL NIGHT','TONIGHT ONLY','ONE MORE'];
function addBar(label,i,mine){
  const b=el('div','bar'+(mine?'':' a'));b.dataset.center=mine?BAR_CENTER[i%3]:(i%2?'82vw':'18vw');b.style.setProperty('--bx',mine?BAR_X[i%3]:b.dataset.center);
  if(!mine){b.style.opacity='0'}
  const l=el('label');l.textContent=label;b.appendChild(l);cage.appendChild(b);return b;
}
function setGlow(){root.style.setProperty('--glow',(.12+Math.min(1,state.lamp/3)*.88).toFixed(3))}
function pulseBulb(){bulb.animate([{filter:'brightness(1)'},{filter:'brightness(2.4)'},{filter:'brightness(1)'}],{duration:900,easing:'ease-out'})}
setGlow();

/* =====================================================================
   SHOCKS — they land on moments of recognition every reader reaches,
   never on a choice. They escalate in kind:
     scare  the slot, idling: sound, a nudge, one flash
     jolt   "since September", "Look up": + shake, colour jolt, smoke blown out
     full   the blowout: + lightning, "WAKE UP." felt for 120 ms
   Never strobing: >= 1.1 s apart, at most two luminance swings per hit.
   ===================================================================== */
const flash=$('#flash'),boltSvg=$('#bolt'),wake=$('#wake'),mainEl=$('main');
let lastShock=0;
function shock(kind='jolt',level=1){
  const now=performance.now();if(now-lastShock<1100)return;lastShock=now;
  const k=gentle?.3:1,full=kind==='full',scare=kind==='scare';
  if(kind==='clear'){Sound.osc('sine',1760,1750,1.4,.16);Sound.osc('sine',2637,2630,1.1,.08,.02)}else Sound.zap(level*(gentle?.55:1)*(scare?.7:1));
  try{navigator.vibrate&&navigator.vibrate(gentle?[30]:scare?[50]:[60,40,140])}catch(e){}
  flash.animate(scare||kind==='clear'?[{opacity:(kind==='clear'?.5:.55)*k},{opacity:0}]:[{opacity:Math.min(.92,.7*level)*k},{opacity:.08},{opacity:Math.min(.6,.45*level)*k},{opacity:0}],{duration:scare?160:280,easing:'linear'});
  if(scare){nudge(4);return}
  if(kind==='clear'){cage.animate([{filter:'brightness(2.6)'},{filter:'brightness(1)'}],{duration:300,easing:'ease-out'});return}
  if(!gentle&&!reduced){
    if(full){drawBolt();boltSvg.animate([{opacity:1},{opacity:.2},{opacity:1},{opacity:0}],{duration:230,easing:'steps(4,end)'})}
    const amp=(full?22:14)*level,frames=[];for(let i=0;i<=12;i++){const d=1-i/12;frames.push({transform:`translate(${((Math.random()*2-1)*amp*d).toFixed(1)}px,${((Math.random()*2-1)*amp*.7*d).toFixed(1)}px) rotate(${((Math.random()*2-1)*.8*d).toFixed(2)}deg)`})}
    frames[12]={transform:'none'};const dur=420+260*level;
    [mainEl,cage,bulb,$('#atmos'),$('#murk')].forEach(n=>n&&n.animate(frames,{duration:dur,easing:'linear'}));
    body.classList.add('jolt');setTimeout(()=>body.classList.remove('jolt'),110);
    pushSmoke();
  }
  if(full){wake.classList.add('on');setTimeout(()=>wake.classList.remove('on'),120)}
}
/* a neon choice feels good: a warm pink bloom, one smooth swing */
function flare(){flash.style.background='#ff2d78';flash.animate([{opacity:0},{opacity:gentle?.12:.3},{opacity:0}],{duration:700,easing:'ease-out'}).onfinish=()=>{flash.style.background=''}}
function drawBolt(){
  const w=innerWidth,h=innerHeight;boltSvg.setAttribute('viewBox',`0 0 ${w} ${h}`);
  const path=(x,y,tx,ty,steps,jag)=>{let d=`M${x.toFixed(0)} ${y.toFixed(0)}`;for(let i=1;i<=steps;i++){const f=i/steps;d+=` L${(x+(tx-x)*f+(Math.random()-.5)*jag).toFixed(0)} ${(y+(ty-y)*f+(Math.random()-.5)*jag*.5).toFixed(0)}`}return d};
  const x=w*(.2+Math.random()*.6),tx=w*(.15+Math.random()*.7),ty=h*(.6+Math.random()*.4),bx=x+(tx-x)*.45,by=ty*.45;
  boltSvg.innerHTML=`<path d="${path(x,0,tx,ty,14,90)}"/><path class="thin" d="${path(bx,by,bx+(Math.random()-.5)*w*.4,by+h*.3,8,60)}"/><path class="thin" d="${path(x,0,x+(Math.random()-.5)*w*.3,h*.35,7,50)}"/>`;
}

/* ---- telltale notices */
const toastEl=$('#toast');let toastT=null;
function toast(text){
  toastEl.querySelector('span').textContent=text;toastEl.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>toastEl.classList.remove('on'),3400);
}

/* ---- cues fired by scroll position */
const CUES={
  bellLow:()=>Sound.bell(.6,1600),
  bellHigh:()=>Sound.bell(1,0),
  knock:()=>{Sound.knock();nudge(3)},
  slot:S=>{S.door.classList.add('open-slot');shock('scare');setTimeout(()=>{S.pwBox.classList.add('show');const i=S.pwBox.querySelector('input');try{i.focus({preventScroll:true})}catch(e){}},260)},
  bulbOn:()=>{bulb.classList.add('on');Sound.neon()},
  roar:()=>Sound.roar(),
  buzz:()=>{Sound.buzz();nudge(4)},
  blowout:S=>{Sound.one('zap-long',{gain:1.2});shock('full',1.4);if(!reduced)S.stage.classList.add('drop');setTimeout(()=>{S.stage.classList.add('blown');S.blown=true;Sound.blackout();bulb.classList.add('dead');cage.classList.add('faded');chaosNow=0;root.style.setProperty('--chaos','0')},reduced?60:280)},
  jolt:()=>shock('jolt',1),
  silence:S=>{frozenUntil=performance.now()+1800;S.after=true;Sound.hardSet(S.sc.mixAfter,['jazz','chatter'])},
  salon:S=>{if(reduced)return;const pics=['lautrec-moulin-rouge.jpg','ensor-intrigue.jpg','degas-absinthe.jpg','munch-karl-johan.jpg','goya-saturn.jpg','piranesi-carceri.jpg','degas-star.jpg'];for(let i=0;i<3;i++){const f=el('div','salon');const im=el('img');im.alt='';im.src='assets/art/'+pics[(Math.random()*pics.length)|0];f.appendChild(im);const w=14+Math.random()*12;f.style.cssText=`width:${w}vw;left:${(Math.random()*(96-w)).toFixed(1)}vw;top:${(4+Math.random()*62).toFixed(1)}vh;--rot:${((Math.random()-.5)*36).toFixed(1)}deg`;S.stage.appendChild(f)}Sound.thud(.5)},
  breath:()=>Sound.breath(),
  match:()=>Sound.match(),
  lampOn:()=>{bulb.classList.remove('dead');bulb.classList.add('on');setGlow()},
  cheer:()=>Sound.cheer(),
  cageShow:()=>{
    const narrow=innerWidth<760,mine=narrow?['76vw','84vw','92vw']:BAR_CENTER,theirs=narrow?['70vw','97vw','80vw','88vw']:['53vw','93vw','63vw','86vw'];
    $$('.bar:not(.a)',cage).forEach((b,i)=>b.dataset.center=mine[i%3]);shock('clear',.8);
    if(!cage.dataset.others){cage.dataset.others=1;OTHERS.forEach((t,i)=>{const b=addBar(t,i,false);b.dataset.center=theirs[i];b.style.setProperty('--bx',b.dataset.center);setTimeout(()=>{b.style.opacity='.35'},300+i*260)})}
    cage.classList.remove('faded');cage.classList.add('showcase');$$('.bar',cage).forEach(b=>b.style.setProperty('--bx',b.dataset.center));Sound.neon();
  },
  bulbOff:()=>{bulb.classList.remove('on');cage.style.transition='opacity 2.4s ease';cage.style.opacity='0'}
};
function nudge(px){if(reduced)return;mainEl.animate([{transform:'none'},{transform:`translate(${px}px,0)`},{transform:`translate(${-px}px,1px)`},{transform:'none'}],{duration:180})}

/* ---- text that has to assemble itself */
const GLYPHS='ｱｳｴｶｷｸｺｻｼｽﾀﾁﾂﾃﾅﾆﾇﾈﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾙﾚﾛﾜ01#%&$@<>/\\|=+*';
const G=()=>GLYPHS[(Math.random()*GLYPHS.length)|0];
function scramble(x,dur){
  const parts=x.parts,total=parts.reduce((a,q)=>a+q.text.length,0),start=performance.now();x.d.classList.add('scrambling');let last=0;
  const step=now=>{
    if(now-last<33){requestAnimationFrame(step);return}last=now;
    const k=(now-start)/dur;if(k>=1){parts.forEach(q=>q.el.textContent=q.text);x.d.classList.remove('scrambling');return}
    let idx=0;parts.forEach(q=>{let str='';for(const ch of q.text){str+=(ch===' '||idx<k*total*1.15-2)?ch:G();idx++}q.el.textContent=str});
    requestAnimationFrame(step);
  };requestAnimationFrame(step);
}
function microGlitch(x){
  if(!x.parts.length||x.d.classList.contains('scrambling'))return;const q=x.parts[(Math.random()*x.parts.length)|0],a=[...q.text];
  for(let i=0,n=1+(Math.random()*2|0);i<n;i++){const j=(Math.random()*a.length)|0;if(a[j]!==' ')a[j]=G()}
  q.el.textContent=a.join('');setTimeout(()=>{q.el.textContent=q.text},70+Math.random()*90);
}

/* =====================================================================
   ATMOSPHERE — two layers of smoke (one that glows, one that hides the
   words until it drifts on) and overheard chatter falling like broken code
   ===================================================================== */
const cv=$('#atmos'),cx=cv.getContext('2d'),mv=$('#murk'),mx=mv.getContext('2d');
let W=0,H=0,puffs=[],murk=[],cols=[],frags=[],sprite=null,dark=null,frozenUntil=0;
const mkSprite=(a,b,c)=>{const cn=document.createElement('canvas');cn.width=cn.height=256;const g2=cn.getContext('2d'),g=g2.createRadialGradient(128,128,0,128,128,128);g.addColorStop(0,a);g.addColorStop(.45,b);g.addColorStop(1,c);g2.fillStyle=g;g2.fillRect(0,0,256,256);return cn};
const CHAT=()=>{const c=window.CHATTER||['...'];return c[(Math.random()*c.length)|0]};
function sizeAtmos(){
  const dpr=Math.min(1.25,devicePixelRatio||1);W=innerWidth;H=innerHeight;[[cv,cx],[mv,mx]].forEach(([c,x])=>{c.width=W*dpr;c.height=H*dpr;x.setTransform(dpr,0,0,dpr,0,0)});
  if(!sprite){sprite=mkSprite('rgba(225,190,150,.6)','rgba(180,150,125,.28)','rgba(120,100,90,0)');dark=mkSprite('rgba(14,9,7,.75)','rgba(20,13,10,.4)','rgba(20,13,10,0)')}
  const puff=()=>({x:Math.random()*W,y:Math.random()*H,r:120+Math.random()*260,vx:(Math.random()-.5)*.25,vy:-.12-Math.random()*.35,kx:0,ky:0,a:.4+Math.random()*.6,ph:Math.random()*6});
  puffs=Array.from({length:26},puff);murk=Array.from({length:40},()=>{const p=puff();p.r*=.8;p.vy*=.6;return p});
  const cw=Math.max(26,W/36);cols=Array.from({length:Math.ceil(W/cw)},(_,i)=>({x:i*cw+cw/2,y:Math.random()*H*1.5-H,v:1+Math.random()*2.4,w:CHAT(),pink:Math.random()<.3,freeze:0}));
}
sizeAtmos();addEventListener('resize',()=>{sizeAtmos();update()});
function pushSmoke(){[...puffs,...murk].forEach(p=>{p.kx=(p.x-W/2)/W*16;p.ky=(p.y-H/2)/H*12})}
let smokeNow=0,rainNow=0;
function drift(p,t){p.x+=p.vx+p.kx+Math.sin(t/4000+p.ph)*.25;p.y+=p.vy*(reduced?.2:1)+p.ky;p.kx*=.93;p.ky*=.93;if(p.y<-p.r)p.y=H+p.r;if(p.y>H+p.r)p.y=-p.r;if(p.x<-p.r)p.x=W+p.r;if(p.x>W+p.r)p.x=-p.r}
function drawAtmos(t,smoke,rain,chaos){
  if(t<frozenUntil)return;                       // "Silence." — everything hangs in the air
  cx.clearRect(0,0,W,H);mx.clearRect(0,0,W,H);
  if(smoke>.01){
    puffs.forEach(p=>{drift(p,t);cx.globalAlpha=smoke*p.a*.42;cx.drawImage(sprite,p.x-p.r,p.y-p.r,p.r*2,p.r*2)});
    const n=Math.round(12+28*chaos);for(let i=0;i<n;i++){const p=murk[i];drift(p,t);mx.globalAlpha=smoke*p.a*.34*chaos;mx.drawImage(dark,p.x-p.r,p.y-p.r,p.r*2,p.r*2)}
  }
  if(rain>.01&&!reduced){
    cols.forEach(c=>{
      if(t<c.freeze)return drawCol(c,rain);
      if(Math.random()<.002){c.freeze=t+200;c.y+=c.v*14}
      c.y+=c.v;const len=c.w.length*18;
      if(c.y>H+20){c.y=-len-Math.random()*H*.5;c.w=CHAT();c.pink=Math.random()<.3}
      drawCol(c,rain);
    });
    // now and then a whole phrase is overheard
    if(frags.length<4&&Math.random()<rain*.012){const f=[['italic 500 30px "Cormorant Garamond",serif','#f3e2c4'],['26px "Poiret One",sans-serif','#ffb3c8'],['600 13px "IBM Plex Mono",monospace','#e9b872']][(Math.random()*3)|0];frags.push({t:CHAT(),x:W*(.08+Math.random()*.7),y:H*(.12+Math.random()*.76),font:f[0],col:f[1],born:t,life:1800+Math.random()*1600})}
    frags=frags.filter(f=>t-f.born<f.life);frags.forEach(f=>{cx.font=f.font;cx.textAlign='left';cx.fillStyle=f.col;cx.globalAlpha=rain*.75*Math.sin(Math.PI*(t-f.born)/f.life);cx.fillText(f.t,f.x,f.y)});
    if(Math.random()<rain*.04){cx.globalAlpha=.06+rain*.08;cx.fillStyle=Math.random()<.5?'#ff2d78':'#e9b872';cx.fillRect(0,Math.random()*H,W,2+Math.random()*14)}
  }
  cx.globalAlpha=1;mx.globalAlpha=1;
}
function drawCol(c,rain){
  const chars=[...c.w.toUpperCase()],n=chars.length;cx.textAlign='center';cx.font='600 14px "IBM Plex Mono",monospace';
  chars.forEach((ch,i)=>{const y=c.y+i*18;if(y<-20||y>H+20)return;const head=i===n-1,glitch=Math.random()<.04;
    cx.globalAlpha=rain*(head?.9:.3+.4*(i/n));cx.fillStyle=glitch?'#7dffa8':c.pink?(head?'#ffe0ea':'#d9728f'):(head?'#fff1d6':'#d9a55e');cx.fillText(glitch?G():ch,c.x,y)});
}

/* =====================================================================
   THE LOOP — scroll position drives everything
   ===================================================================== */
let activeScene=null,prevScene=null,chaosNow=.4,lastInput=performance.now(),idleNudged=false;
['scroll','keydown','pointerdown','touchstart','wheel'].forEach(e=>addEventListener(e,()=>{lastInput=performance.now()},{passive:true}));
function update(){
  const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);progress.style.width=(scrollY/max*100).toFixed(2)+'%';
  if(!journeyUnlocked)return;
  const mid=innerHeight*.5;let act=null;
  scenes.forEach(S=>{
    if(S.sec.hidden)return;
    const r=S.sec.getBoundingClientRect();if(r.bottom<-innerHeight||r.top>innerHeight*2)return;
    const p=clamp(-r.top/Math.max(1,r.height-innerHeight));S.p=p;S.sec.style.setProperty('--p',p.toFixed(4));
    if(r.top<=mid&&r.bottom>mid)act=S;
    const sc=S.sc;
    // beats
    let lastOn=-1;
    S.beats.forEach((x,i)=>{
      if(!x.text)return;
      const want=p>=x.b.at-.001;
      if(want!==x.on){x.on=want;x.d.classList.toggle('on',want);if(want&&!x.shown){x.shown=true;const c=sc.chaos;if(c>.5&&!reduced)scramble(x,220+c*820)}}
      if(want)lastOn=i;
    });
    const flowing=sc.chaos<.3,slamTop=lastOn>=0&&S.beats[lastOn].b.k==='slam';S.beats.forEach((x,i)=>{const age=lastOn-i;x.d.classList.toggle('under',!flowing&&slamTop&&x.on&&age>=1&&x.b.k!=='whisper');x.d.classList.toggle('old',x.on&&age>=1&&x.b.k!=='whisper');x.d.classList.toggle('gone',x.on&&x.b.k!=='whisper'&&age>=(flowing?(sc.keep||5):3))});
    // cues
    (sc.cue||[]).forEach((q,i)=>{if(p>=q.at&&!S.fired[i]&&r.top<=innerHeight*.2){S.fired[i]=1;CUES[q.fx]&&CUES[q.fx](S)}});
    // choices
    if(S.gateEl){const g=sc.gate;if(p>=g.at-.001&&!S.gateShown){S.gateShown=true;S.gateEl.classList.add('show');setTimeout(()=>startFuse(S),900)}}
    if(sc.gate==='password'&&S.fired[1]&&!S.resolved)S.pwBox.classList.add('show');
    // lamplight grows from the flame
    if(sc.look==='lamp')S.sec.style.setProperty('--reveal',(sc.id==='lamp'?clamp(p/.55)*62:62).toFixed(1)+'%');
    // scroll hint once the scene's words are out and it isn't waiting on you
    const waiting=isGate(S)&&!S.resolved;S.cue.classList.toggle('show',!waiting&&S===act&&p>.9&&!sc.end);
    if(S.again)S.again.classList.toggle('show',p>.94);
  });
  if(act&&act!==activeScene){
    prevScene=activeScene;activeScene=act;const sc=act.sc;
    chapter.textContent=sc.label;body.dataset.act=sc.act;body.classList.toggle('in-tally',sc.look==='tally');body.classList.toggle('bulb-low',sc.look==='lamp');
    if(Sound.override&&!(sc.id==='overload'&&act.blown))Sound.override=null;
    if(sc.id==='overload'&&act.blown)Sound.override={tinnitus:.5,room:.2};
    Sound.set(act.after&&sc.mixAfter?sc.mixAfter:sc.mix);
    if(sc.act===2&&!act.blown)cage.classList.remove('faded');cage.classList.toggle('ghost',sc.act===4);
    // datamosh: a band of the last painting refuses to leave
    if(!reduced&&prevScene&&prevScene.art&&sc.act===2&&prevScene.sc.act===2&&prevScene.sc.art!==sc.art)holdBand(prevScene.sc.art);
  }
}
function holdBand(art){
  const h=el('div','hold');const y=10+Math.random()*60,hh=12+Math.random()*24;h.style.backgroundImage=`url(assets/art/${art})`;h.style.clipPath=`inset(${y}% 0 ${Math.max(0,100-y-hh)}% 0)`;h.style.transform=`translateX(${((Math.random()-.5)*6).toFixed(1)}vw)`;
  body.appendChild(h);setTimeout(()=>h.remove(),400+Math.random()*400);
}
function burst(S){
  const a=S.art,g=$('.ghost',a),m=S.mosh,img=$('.main',a),y=Math.random()*80,h=4+Math.random()*18;
  g.style.clipPath=`inset(${y}% 0 ${Math.max(0,100-y-h)}% 0)`;g.style.transform=`translateX(${((Math.random()-.5)*70*chaosNow).toFixed(0)}px)`;
  if(m&&img.complete&&img.naturalWidth){const cw=Math.max(8,(a.clientWidth/16)|0),chh=Math.max(6,(a.clientHeight/16)|0);if(m.width!==cw){m.width=cw;m.height=chh}const k=Math.max(cw/img.naturalWidth,chh/img.naturalHeight),dw=img.naturalWidth*k,dh=img.naturalHeight*k;const c=m.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(img,(cw-dw)/2,(chh-dh)/2,dw,dh);const y2=Math.random()*85,h2=5+Math.random()*14;m.style.clipPath=`inset(${y2}% 0 ${Math.max(0,100-y2-h2)}% 0)`}
  a.classList.add('burst');setTimeout(()=>a.classList.remove('burst'),60+Math.random()*140);
}

let rgbT=0;
function loop(t){
  requestAnimationFrame(loop);
  if(!journeyUnlocked)return;
  update();
  const S=activeScene;if(!S)return;const sc=S.sc;
  // the reader's own wiring bends the room: neon adds jank, lamps steady it
  const bias=sc.act===2?.07*state.neon.length-.07*state.lamp:0;
  const targetChaos=(S.blown||sc.id==='dark')?0:clamp(sc.chaos+bias);chaosNow+=(targetChaos-chaosNow)*.05;root.style.setProperty('--chaos',chaosNow.toFixed(3));
  const g=chaosNow<.5?0:Math.pow((chaosNow-.5)/.5,1.5);
  if(t-rgbT>70){rgbT=t;root.style.setProperty('--rgb',((2+Math.random()*7)*g).toFixed(1)+'px')}
  smokeNow+=((S.blown?0:sc.smoke||0)-smokeNow)*.03;rainNow+=((S.blown?0:sc.rain||0)-rainNow)*.04;
  drawAtmos(t,smokeNow,rainNow,chaosNow);
  Sound.tick();
  // silence arrives slowly in the dark: the ringing drains away before anyone breathes
  if(sc.id==='dark')Sound.level('tinnitus',.6*clamp(1-S.p/.3));
  // fluorescent tube: >= 340 ms between toggles (never past ~3 flashes/s), calmer when gentle, quiet around a shock
  scenes.forEach(T=>{if(!T.tube||T.sec.hidden||t<T.nextFlick||performance.now()-lastShock<1000)return;
    T.tubeOn=!T.tubeOn;T.tube.classList.toggle('on',T.tubeOn);T.sec.style.setProperty('--lit',T.tubeOn?(gentle?'.45':'1'):(gentle?'.2':'.08'));T.sec.style.setProperty('--wlit',T.tubeOn?'1':(gentle?'.6':'.12'));if(T===S)Sound.humFlick(T.tubeOn);
    const minGap=gentle?700:340;
    if(T.stutter>0&&!gentle){T.stutter--;T.nextFlick=t+minGap+Math.random()*80}else if(T.tubeOn){T.nextFlick=t+700+Math.random()*2600;if(!gentle&&Math.random()<.45)T.stutter=2+((Math.random()*2)|0)*2}else T.nextFlick=t+Math.max(minGap,250+Math.random()*(T.sc.id==='period5'&&T.p<.1?1600:700))});
  // glitches only exist where the room is actually loud
  if(!reduced&&S.art&&Math.random()<g*.03)burst(S);
  if(!reduced&&Math.random()<g*.025){const on=S.beats.filter(x=>x.on&&x.text);if(on.length)microGlitch(on[(Math.random()*on.length)|0])}
  // neon signs buzz, and you can hear them do it
  if(!reduced&&sc.act===2&&Math.random()<.012*chaosNow){const ns=$$('.neon-sign',S.stage);if(ns.length){const n=ns[(Math.random()*ns.length)|0];n.classList.add('off');Sound.click(.3);setTimeout(()=>n.classList.remove('off'),60+Math.random()*80)}}
  // the bulb flickers with the room; steadier with every lamp you fed
  if(bulb.classList.contains('on')){const unsteady=chaosNow*(1-Math.min(1,state.lamp/3)*.7);root.style.setProperty('--bulb-on',Math.random()<unsteady*.12?(.15+Math.random()*.3).toFixed(2):'1')}
  // idle in the corridor too long
  if(!idleNudged&&sc.act===1&&!isGate(S)&&t-lastInput>16000){idleNudged=true;shock('scare');toast('Still there?')}
}
requestAnimationFrame(loop);

/* local testing only: http://localhost:PORT/?dev skips the film (inert on GitHub Pages) */
if(/^(localhost|127\.0\.0\.1)$/.test(location.hostname)&&/[?&]dev\b/.test(location.search)){armExit('dev',false);window.__dev={state,scenes,Sound,go:(id,p)=>{const s=$('#s-'+id);scrollTo(0,s.offsetTop+(s.offsetHeight-innerHeight)*p)}};addEventListener('pointerdown',()=>{if(!journeyUnlocked){Sound.unlock();soundWanted=true;paintSoundBtn();Sound.mute(false);bypass.click()}},{once:true})}

$('#fullBtn').addEventListener('click',async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen()}catch(e){}});

/* credits: art list comes straight from the story */
const artList=$('#artCredits');if(artList){const seen=new Set();STORY.forEach(s=>{if(s.credit&&!seen.has(s.art)){seen.add(s.art);const li=el('li',null,s.credit);artList.appendChild(li)}})}
})();
