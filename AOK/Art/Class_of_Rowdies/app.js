/* =====================================================================
   THE CLASS OF ROWDIES — engine
   Film gate (carried over) > sound > scenes > the room > the wall >
   choices > shocks > atmosphere > enlistment. The words live in story.js.
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
   Recorded classroom sound (public domain / CC0, see footer) layered with
   a little live synthesis. Every channel is mixed per scene. The room's
   noise shares a bus that can be driven into distortion when it boils over.
   ===================================================================== */
const AUDIO='assets/audio/';
// file -> channel; a file listed as [primary, fallback] uses the fallback if the primary is missing
const LOOPS={classroom:['classroom','chatter'],drum:['desk-drum'],pencil:['pencil-tap'],crackle:['crackle'],heart:['heartbeat'],clock:['clock'],hum:['fluorescent'],birds:['birds'],march:['march']};
const SHOTS=['school-bell','zap','chair-scrape','reveille','stamp'];
const BASE={classroom:.85,drum:.7,pencil:.6,crackle:.8,heart:1,clock:.95,hum:.35,drone:.55,birds:1.1,room:.55,march:.85};
const FROM_START=['march'];            // these begin at the top when first heard

const Sound={ctx:null,master:null,ch:{},buf:{},src:{},els:{},real:{},started:false,loading:null,mix:{},fileMode:location.protocol==='file:',armed:{},
  init(){
    if(this.ctx)return;
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    const c=this.ctx=new AC();
    this.comp=c.createDynamicsCompressor();this.comp.threshold.value=-16;this.comp.knee.value=8;this.comp.ratio.value=4;this.comp.attack.value=.004;this.comp.release.value=.25;this.comp.connect(c.destination);
    this.master=c.createGain();this.master.gain.value=0;this.master.connect(this.comp);
    this.bus=c.createGain();this.dry=c.createGain();this.wet=c.createGain();this.wet.gain.value=0;
    this.shaper=c.createWaveShaper();this.shaper.curve=curve(80);this.shaper.oversample='2x';
    this.bus.connect(this.dry).connect(this.master);this.bus.connect(this.shaper).connect(this.wet).connect(this.master);
    const mk=(name,dest,filt)=>{const g=c.createGain();g.gain.value=0;g.connect(dest||this.master);let input=g,f=null;if(filt){f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=16000;f.Q.value=.8;f.connect(g);input=f}this.ch[name]={g,f,input}};
    mk('classroom',this.bus,true);mk('drum',this.bus);mk('march',null,true);['pencil','crackle','heart','clock','hum','drone','birds','room'].forEach(n=>mk(n));
    this.fx=c.createGain();this.fx.connect(this.master);
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
    // dread drone: detuned stack with a slow breathing filter and a beating pair
    const dl=c.createBiquadFilter();dl.type='lowpass';dl.frequency.value=520;dl.Q.value=4;
    const sweep=c.createOscillator();sweep.frequency.value=.055;const sg=c.createGain();sg.gain.value=330;sweep.connect(sg).connect(dl.frequency);sweep.start(t);
    [55,110.4,164.2,221.3,329.1].forEach((f,i)=>{const o=c.createOscillator();o.type=i%2?'sawtooth':'triangle';o.frequency.value=f;const g=c.createGain();g.gain.value=i<2?.2:.09;o.connect(g).connect(dl);o.start(t)});
    dl.connect(this.ch.drone.input);
    [440,443.2].forEach(f=>{const o=c.createOscillator();o.frequency.value=f;const g=c.createGain();g.gain.value=.022;o.connect(g).connect(this.ch.drone.input);o.start(t)});
    // room tone
    const rn=c.createBufferSource();rn.buffer=this.noise;rn.loop=true;const rl=c.createBiquadFilter();rl.type='lowpass';rl.frequency.value=700;const rg=c.createGain();rg.gain.value=.3;rn.connect(rl).connect(rg).connect(this.ch.room.input);rn.start(t);
  },
  unlock(){this.init();if(this.ctx&&this.ctx.state==='suspended')this.ctx.resume();this.load();},
  async fetchBuf(name){const r=await fetch(AUDIO+name+'.mp3');if(!r.ok)throw new Error(r.status);return this.ctx.decodeAudioData(await r.arrayBuffer())},
  load(){
    if(this.loading||!this.ctx)return this.loading;
    const jobs=[];
    Object.entries(LOOPS).forEach(([ch,files])=>jobs.push((async()=>{
      for(const f of files){
        if(this.fileMode){const el=new Audio(AUDIO+f+'.mp3');el.preload='auto';el.loop=true;this.els[ch]=el;return}
        try{this.buf[ch]=await this.fetchBuf(f);this.real[ch]=1;if(this.started)this.attach(ch);return}catch(e){/* try the fallback file */}
      }
      // nothing recorded: heart/clock/crackle keep their synthesized loops
    })()));
    SHOTS.forEach(n=>jobs.push((async()=>{
      if(this.fileMode){const el=new Audio(AUDIO+n+'.mp3');el.preload='auto';this.els[n]=el;return}
      try{this.buf[n]=await this.fetchBuf(n);this.real[n]=1}catch(e){}
    })()));
    this.loading=Promise.all(jobs);return this.loading;
  },
  attach(ch){
    const c=this.ctx;if(!c||!this.buf[ch])return;
    if(FROM_START.includes(ch)&&!this.armed[ch])return;
    const old=this.src[ch];if(old){try{old.stop()}catch(e){}}
    const s=c.createBufferSource();s.buffer=this.buf[ch];s.loop=true;s.connect(this.ch[ch].input);
    s.start(0,FROM_START.includes(ch)?0:Math.random()*Math.max(0,s.buffer.duration-1));this.src[ch]=s;
    if(ch==='clock')s.playbackRate.value=this.mix.clockRate||1;
  },
  startJourney(){
    if(this.started)return;this.started=true;
    if(this.fileMode){Object.entries(this.els).forEach(([k,el])=>{if(LOOPS[k]&&!FROM_START.includes(k)){el.volume=0;el.play().catch(()=>{})}});return}
    Object.keys(LOOPS).forEach(k=>{if(this.buf[k]||!this.fileMode)this.attach(k)});
  },
  set(m){
    this.mix=m||{};if(!this.ctx)return;
    const c=this.ctx,now=c.currentTime,mm=this.mix,lv=k=>soundWanted?(mm[k]||0):0;
    Object.entries(this.ch).forEach(([k,ch])=>{hold(ch.g.gain,now);ch.g.gain.setTargetAtTime(lv(k)*BASE[k],now,.55)});
    this.ch.classroom.f.frequency.setTargetAtTime(mm.classroomCut||16000,now,.35);
    this.ch.march.f.frequency.setTargetAtTime(mm.marchCut||16000,now,.35);
    const dirt=mm.dirt||0;this.wet.gain.setTargetAtTime(dirt*.9,now,.4);this.dry.gain.setTargetAtTime(1-dirt*.45,now,.4);
    if(this.src.clock)this.src.clock.playbackRate.setTargetAtTime(mm.clockRate||1,now,.5);
    FROM_START.forEach(k=>{if((mm[k]||0)>0&&!this.armed[k]){this.armed[k]=1;this.attach(k);if(this.els[k]){this.els[k].currentTime=0;this.els[k].play().catch(()=>{})}}});
  },
  mute(v){if(!this.ctx)return;const now=this.ctx.currentTime;hold(this.master.gain,now);this.master.gain.setTargetAtTime(v?0:.95,now,.08);if(!v)this.set(this.mix)},
  tick(){
    if(this.fileMode&&this.started){Object.entries(this.els).forEach(([k,el])=>{if(!LOOPS[k])return;const target=soundWanted?clamp((this.mix[k]||0)*BASE[k]):0;el.volume=clamp(el.volume+(target-el.volume)*.05)})}
  },
  humFlick(on){if(!this.ctx)return;const now=this.ctx.currentTime;this.humGate.gain.setTargetAtTime(on?1:.18,now,.012);this.click(on?.35:.2)},
  /* ---- one-shots ---- */
  one(name,{rate=1,gain=1,cut=0}={}){
    if(!this.ctx||!soundWanted)return false;
    if(this.fileMode&&this.els[name]){try{const el=this.els[name].cloneNode();el.volume=clamp(gain*.9);el.playbackRate=rate;el.play().catch(()=>{})}catch(e){}return true}
    const b=this.real[name]?this.buf[name]:null;if(!b)return false;
    const c=this.ctx,s=c.createBufferSource(),g=c.createGain();s.buffer=b;s.playbackRate.value=rate;g.gain.value=gain;
    if(cut){const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=cut;s.connect(f).connect(g)}else s.connect(g);
    g.connect(this.fx);s.start();return true;
  },
  osc(type,f1,f2,dur,vol,when=0){const c=this.ctx;if(!c||!soundWanted)return;const t=c.currentTime+when,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f1,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f2),t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0008,t+dur);o.connect(g).connect(this.fx);o.start(t);o.stop(t+dur+.05)},
  burst(dur,vol,{type='bandpass',f=3000,f2=0,q=1,when=0,shape=0}={}){const c=this.ctx;if(!c||!soundWanted)return;const t=c.currentTime+when,s=c.createBufferSource(),fl=c.createBiquadFilter(),g=c.createGain();s.buffer=this.noise;fl.type=type;fl.frequency.setValueAtTime(f,t);if(f2)fl.frequency.exponentialRampToValueAtTime(f2,t+dur);fl.Q.value=q;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0008,t+dur);let n=s.connect(fl);if(shape){const w=c.createWaveShaper();w.curve=curve(shape);n=n.connect(w)}n.connect(g).connect(this.fx);s.start(t,Math.random());s.stop(t+dur+.05)},
  click(v=.3){this.burst(.025,v*.5,{type:'highpass',f:2500})},
  hit(){this.osc('triangle',310,62,.28,.35)},
  thud(v=1){this.osc('sine',120,38,.5,.9*v);this.burst(.22,.5*v,{type:'lowpass',f:500})},
  clack(v=1){this.burst(.07,.55*v,{f:1400,q:3});this.osc('triangle',240,120,.09,.25*v)},
  zap(level=1){
    if(!this.ctx||!soundWanted)return;const c=this.ctx,t=c.currentTime,dur=.22+.3*level;
    this.one('zap',{gain:Math.min(1.2,.7+level*.4)});
    const s=c.createBufferSource(),hp=c.createBiquadFilter(),w=c.createWaveShaper(),g=c.createGain(),gate=c.createGain(),lf=c.createOscillator(),lg=c.createGain();
    s.buffer=this.noise;hp.type='highpass';hp.frequency.value=900;w.curve=curve(120);lf.type='square';lf.frequency.value=38+Math.random()*30;lg.gain.value=.5;gate.gain.value=.5;lf.connect(lg).connect(gate.gain);
    g.gain.setValueAtTime(.55*level,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
    s.connect(hp).connect(w).connect(gate).connect(g).connect(this.fx);s.start(t,Math.random());s.stop(t+dur+.05);lf.start(t);lf.stop(t+dur+.05);
    this.osc('sawtooth',2400,180,.12,.25*level);this.thud(.6*level);
  },
  bell(rate=1,cut=0){if(this.one('school-bell',{rate,gain:rate<1?1:.9,cut}))return;const c=this.ctx;if(!c||!soundWanted)return;const t=c.currentTime,g=c.createGain(),trem=c.createOscillator(),tg=c.createGain();trem.frequency.value=22;tg.gain.value=.5;g.gain.value=.5;trem.connect(tg).connect(g.gain);const env=c.createGain();env.gain.setValueAtTime(.35,t);env.gain.setValueAtTime(.35,t+2.2);env.gain.exponentialRampToValueAtTime(.001,t+3);[1,2.76,5.4,8.93].forEach((m,i)=>{const o=c.createOscillator();o.frequency.value=720*rate*m;const og=c.createGain();og.gain.value=[.4,.2,.1,.05][i];o.connect(og).connect(g);o.start(t);o.stop(t+3.1)});g.connect(env).connect(this.fx);trem.start(t);trem.stop(t+3.1)},
  chair(){if(this.one('chair-scrape',{gain:.8,rate:.9+Math.random()*.25}))return;this.burst(.7,.25,{f:900,f2:1800,q:6,shape:20})},
  bugle(){if(this.real.reveille&&this.ctx&&soundWanted){const c=this.ctx,t=c.currentTime,s=c.createBufferSource(),g=c.createGain();s.buffer=this.buf.reveille;g.gain.setValueAtTime(1,t);g.gain.setValueAtTime(1,t+3.2);g.gain.exponentialRampToValueAtTime(.001,t+4.4);s.connect(g).connect(this.fx);s.start(t);s.stop(t+4.5);return}if(this.fileMode&&this.one('reveille',{gain:1}))return;[[392,0],[523.3,.18],[659.3,.36],[784,.54],[659.3,.9],[784,1.1]].forEach(([f,w])=>{this.osc('sawtooth',f,f,.22,.12,w);this.osc('square',f*2,f*2,.2,.03,w)})},
  stamp(){if(this.one('stamp',{gain:1.2}))return;this.thud(1.2);this.burst(.12,.6,{type:'lowpass',f:1200})},
  key(){this.burst(.03,.35,{f:2200+Math.random()*800,q:4});this.osc('square',180,90,.03,.05)},
  laugh(rate=1){this.burst(1.6,.35,{f:1100,q:.5});if(this.buf.classroom&&this.ctx&&soundWanted){const c=this.ctx,t=c.currentTime,s=c.createBufferSource(),g=c.createGain();s.buffer=this.buf.classroom;s.playbackRate.value=1.15*rate;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(1.2,t+.12);g.gain.exponentialRampToValueAtTime(.01,t+2.4);s.connect(g).connect(this.fx);s.start(t,Math.random()*5);s.stop(t+2.5)}},
  silence(sec){if(!this.ctx||!soundWanted)return;const now=this.ctx.currentTime,g=this.master.gain;hold(g,now);g.setTargetAtTime(0,now,.012);g.setTargetAtTime(.95,now+sec,.25)},
  rubble(){this.burst(1.8,.6,{type:'lowpass',f:400});this.burst(1.2,.35,{type:'lowpass',f:1200,f2:300,when:.1});this.thud(1.4);[.15,.35,.6,.8,1.05].forEach(w=>this.osc('triangle',140+Math.random()*80,50,.18,.3,w))},
  warm(){[261.6,329.6,392,523.3].forEach((f,i)=>this.osc('sine',f,f*.998,1.6,.12,i*.09))},
  chime(){this.osc('sine',1760,1750,1.4,.16);this.osc('sine',2637,2630,1.1,.08,.02)},
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
const state={forks:{},bricks:[],open:0,timeouts:0,enlist:null};
const journey=$('#journey');
const scenes=[];
let rngSeed=7;const rng=()=>{rngSeed=(rngSeed*16807)%2147483647;return(rngSeed-1)/2147483646};
const el=(tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e};
const SEATS=28, YOU=17;

STORY.forEach((sc,idx)=>{
  const sec=el('section','scene look-'+(sc.look||'plain'));sec.id='s-'+sc.id;sec.hidden=true;
  sec.style.setProperty('--h',sc.h);sec.style.setProperty('--sc',sc.chaos);sec.dataset.chapter=sc.label;
  const stage=el('div','stage');sec.appendChild(stage);
  const S={sc,sec,stage,idx,beats:[],fired:{},p:0,gateShown:false,resolved:false};
  const look=sc.look||'';
  if(sc.art){
    const art=el('div','art');
    ['main','ghost'].forEach(k=>{const im=el('img',k);im.alt=k==='main'?(sc.credit||'').replace(/<[^>]+>/g,''):'';if(k!=='main')im.setAttribute('aria-hidden','true');im.dataset.src='assets/art/'+sc.art;art.appendChild(im)});
    const mosh=el('canvas','mosh');mosh.setAttribute('aria-hidden','true');art.appendChild(mosh);S.mosh=mosh;
    const main=$('.main',art);main.addEventListener('error',()=>{if(sc.artAlt&&!main.dataset.alt){main.dataset.alt=1;$$('img',art).forEach(im=>im.src='assets/art/'+sc.artAlt)}else art.remove()});
    stage.appendChild(art);S.art=art;
    if(sc.credit)stage.appendChild(el('div','credit',sc.credit));
  }
  if(sc.lampAt){sec.style.setProperty('--lx',sc.lampAt[0]*100+'%');sec.style.setProperty('--ly',sc.lampAt[1]*100+'%')}
  if(look==='tube'){S.tube=el('div','tube');stage.appendChild(S.tube);S.tubeOn=false;S.nextFlick=0}
  if(look==='frame'){stage.appendChild(el('i','deco-rule top'));stage.appendChild(el('i','deco-rule bot'))}
  if(look==='lamp')stage.appendChild(el('div','flame'));
  if(look==='room'||sc.room)S.room=buildRoom(stage);
  // beats
  const flow=sc.chaos<.3||['recruit','wall','room'].includes(look);S.flow=flow;const bx=el('div','beats'+(flow?' flow':''));stage.appendChild(bx);
  const n=sc.beats.length,top=sc.gate?7:10,span=sc.gate?32:62;let prevLeft=false;
  sc.beats.forEach((b,i)=>{
    const k=b.k||'line',d=el('div','beat b-'+k),t=el('span','t');d.appendChild(t);
    if(!flow){
      let x;
      const txt=typeof b.t==='string'?b.t:'';
      if(look==='room'){x=3+rng()*5}
      else if(k==='slam'){x=look==='tube'&&txt.length<18?-1.5-rng()*1.5:2+rng()*10;prevLeft=true}
      else if(k==='whisper'){x=i===0?3:6+rng()*30}
      else{x=prevLeft?46+rng()*12:4+rng()*14;prevLeft=!prevLeft}
      const y=k==='whisper'&&i===0?(sc.gate?4:90):top+(n>1?i*(span/(n-1)):span/2)+(rng()-.5)*5;
      d.style.setProperty('--x',x.toFixed(1)+'%');if(y>48){d.classList.add('low');d.style.setProperty('--yb',(100-y-(k==='slam'?4:0)).toFixed(1)+'%')}else d.style.setProperty('--y',y.toFixed(1)+'%');
      d.style.setProperty('--r',((rng()-.5)*2*6*sc.chaos).toFixed(2)+'deg');
      if(k==='line'&&sc.chaos>=.8){const j=()=>(rng()*7).toFixed(1)+'px';d.style.clipPath=`polygon(${j()} 0,48% ${j()},100% 0,calc(100% - ${j()}) 52%,100% 100%,52% calc(100% - ${j()}),0 100%,${j()} 46%)`}
    }else d.style.setProperty('--r','0deg');
    t.setAttribute('aria-hidden','true');bx.appendChild(d);S.beats.push({b,d,t,on:false,shown:false,parts:[]});
  });
  // choices
  if(sc.gate&&typeof sc.gate==='object'){
    const g=sc.gate,gate=el('div','gate');
    if(g.timer){gate.appendChild(el('div','fuse-label','choose before the fuse burns out'));const fz=el('div','fuse','<i class="burn"></i><i class="spark"></i>');fz.style.setProperty('--t',g.timer+'s');gate.appendChild(fz);S.fuse=fz}
    const opts=el('div','options');opts.style.setProperty('--n',g.options.length);if(g.options.length>2)opts.classList.add('many');
    g.options.forEach(o=>{const btn=el('button','opt');btn.type='button';btn.dataset.id=o.id;btn.dataset.wire=o.wire;btn.appendChild(el('b',null)).textContent=o.label;btn.appendChild(el('span',null)).textContent=o.sub;btn.addEventListener('click',()=>choose(S,o,false));opts.appendChild(btn)});
    gate.appendChild(opts);stage.appendChild(gate);S.gateEl=gate;
  }
  if(sc.gate==='enlist')S.enlist=buildEnlist(stage,S);
  S.cue=el('div','cue-down','scroll ↓');stage.appendChild(S.cue);
  journey.appendChild(sec);scenes.push(S);
});

function isGate(S){return !!S.sc.gate&&S.sc.gate!=='enlist'}
function setText(x,text){
  x.text=text||'';x.t.textContent='';x.parts=[];x.d.hidden=!x.text;x.d.setAttribute('aria-label',x.text);x.d.setAttribute('role','text');
  if(x.b.k==='slam'){x.text.split(' ').forEach((w,i)=>{if(i)x.t.appendChild(document.createTextNode(' '));const sp=el('span','w');sp.textContent=w;sp.style.setProperty('--dy',((rng()-.5)*34).toFixed(0)+'px');sp.style.setProperty('--dr',((rng()-.5)*14).toFixed(1)+'deg');sp.style.setProperty('--ds',((rng()-.3)*.22).toFixed(2));x.t.appendChild(sp);x.parts.push({el:sp,text:w})})}
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
      if(S.room)paintRoom(S);
    }else if(!show&&!S.sec.hidden)S.sec.hidden=true;
    if(show&&isGate(S)&&!S.resolved)blocked=true;
  });
}

/* =====================================================================
   THE ROOM — what the teacher sees: twenty-eight seats, facing the front
   ===================================================================== */
function buildRoom(stage){
  const wrap=el('div','roommap'),grid=el('div','seats');
  for(let i=0;i<SEATS;i++){const s=el('i','seat'+(i===YOU?' you':''));s.style.setProperty('--i',i);s.style.setProperty('--d',(rng()*1.6).toFixed(2)+'s');grid.appendChild(s)}
  wrap.appendChild(grid);wrap.appendChild(el('div','desk'));stage.appendChild(wrap);return wrap;
}
function roomMode(S){const r=S.sc.room;return typeof r==='function'?r(state):r||'noise'}
function paintRoom(S){
  const mode=roomMode(S),seats=$$('.seat',S.room);S.room.dataset.mode=mode;
  const pick=(n,exclude=[])=>{const pool=[...Array(SEATS).keys()].filter(i=>!exclude.includes(i));const out=[];let seed=S.idx*31+7;while(out.length<n&&pool.length){seed=(seed*16807)%2147483647;out.push(pool.splice(seed%pool.length,1)[0])}return out};
  seats.forEach(s=>s.className='seat'+(s.style.getPropertyValue('--i')==YOU?' you':''));
  const add=(ids,c)=>ids.forEach(i=>seats[i].classList.add(c));
  const youTalk=state.forks.friend==='say',youHand=state.forks.offer==='hand';
  if(mode==='noise'){const look=pick(3,[YOU]);add(look,'look');add([...Array(SEATS).keys()].filter(i=>!look.includes(i)),'talk');if(!youTalk&&state.forks.friend)seats[YOU].className='seat you look'}
  else if(mode==='split'){const talk=pick(12,[YOU]);add(talk,'talk');add([...Array(SEATS).keys()].filter(i=>!talk.includes(i)),'look');seats[YOU].className='seat you '+(youTalk?'talk':'look')}
  else if(mode==='quiet'){add([...Array(SEATS).keys()],'look')}
  else if(mode==='waiting'){add([...Array(SEATS).keys()],'turn');if(youHand)seats[YOU].className='seat you hand'}
  else if(mode==='teaching'){add([...Array(SEATS).keys()],'look');const up=pick(4,[YOU,3]);add(up,'hand');seats[3].className='seat presenter'}
}
function multiply(S){
  // "Now let everyone do what you did": it starts at your seat and spreads outward, ring by ring
  const said=state.forks.friend==='say',label=said?(state.bricks[0]||'ONE MORE JOKE'):'…',seats=$$('.seat',S.room);
  const yr=(YOU/7)|0,yc=YOU%7,dist=i=>Math.max(Math.abs(((i/7)|0)-yr),Math.abs(i%7-yc));
  seats.forEach((s,i)=>{s.className='seat'+(i===YOU?' you':'');$$('.bubble',s).forEach(b=>b.remove())});
  const light=i=>{const s=seats[i];s.className='seat'+(i===YOU?' you':'')+(said?' talk':' look');const b=el('b','bubble'+(said?'':' quiet'));b.textContent=label;s.appendChild(b)};
  light(YOU);if(said)Sound.click(.4);
  let maxD=0;seats.forEach((s,i)=>{if(i===YOU)return;const d=dist(i);maxD=Math.max(maxD,d);setTimeout(()=>light(i),reduced?0:700+d*160)});
  for(let d=1;d<=maxD;d++)setTimeout(()=>{if(said)Sound.laugh(1+d*.08);else Sound.click(.15)},reduced?0:700+d*160);
  // then the room goes dead: hard silence for 1.2 s, both ways
  setTimeout(()=>Sound.silence(1.2),reduced?200:700+maxD*160+500);
}
function drawPeers(S){
  // the orderly room isn't silent: arcs of people teaching each other
  const map=S.room,old=$('.peers',map);if(old)old.remove();
  const seats=$$('.seat',map),mb=map.getBoundingClientRect(),ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
  svg.setAttribute('class','peers');svg.setAttribute('viewBox',`0 0 ${mb.width} ${mb.height}`);
  [[8,16],[11,19],[22,24],[1,9],[26,20],[13,5]].forEach(([a,b],k)=>{
    const ra=seats[a].getBoundingClientRect(),rb=seats[b].getBoundingClientRect(),ax=ra.left+ra.width/2-mb.left,ay=ra.top+ra.height/2-mb.top,bx=rb.left+rb.width/2-mb.left,by=rb.top+rb.height/2-mb.top;
    const p=document.createElementNS(ns,'path');p.setAttribute('d',`M${ax} ${ay} Q${(ax+bx)/2} ${Math.min(ay,by)-40-k*6} ${bx} ${by}`);p.style.animationDelay=(k*.25)+'s';svg.appendChild(p);
    seats[a].classList.add('peer');seats[b].classList.add('peer');
  });
  map.appendChild(svg);
}
function handprints(){
  // "Check whose hands": a faint hand on every brick, not just yours
  bricks.forEach((b,i)=>setTimeout(()=>b.classList.add('printed'),reduced?0:i*6));
}

/* =====================================================================
   THE WALL — built one brick at a time along the bottom of the screen
   ===================================================================== */
const wall=$('#wall');let bricks=[];
const ROOM_BRICKS=['IS THIS ON THE TEST','5 MORE MIN','NOT ME','CAN I GO TOILET','LATER','WHATEVER','DO WE HAVE TO','WHAT PAGE','ARE WE DOING ANYTHING','I FORGOT IT','SOMEONE ELSE WILL','BORING'];
const roomLabel=()=>Math.random()<.34?ROOM_BRICKS[(Math.random()*ROOM_BRICKS.length)|0]:'';
function addBrick(label,mine,animate=true){
  if(wall.dataset.down||(wall.dataset.cap&&!mine&&bricks.length>=+wall.dataset.cap))return null;
  const b=el('div','brick'+(mine?' mine':''));const l=el('span');l.textContent=label||'';b.appendChild(l);
  wall.appendChild(b);bricks.push(b);layoutWall();
  if(animate&&!reduced)b.animate([{transform:'translateY(-60vh) rotate(-8deg)',opacity:0},{transform:'translateY(4px)',opacity:1,offset:.85},{transform:'none',opacity:1}],{duration:520,easing:'cubic-bezier(.5,0,.7,1)'});
  if(animate)setTimeout(()=>Sound.clack(mine?1:.5),420);
  return b;
}
function layoutWall(){
  const bw=Math.max(92,Math.min(170,innerWidth/9)),bh=Math.max(24,bw*.3),cols=Math.ceil(innerWidth/bw)+1;
  // your bricks sit in the middle of the lowest rows so they're easy to find
  const mine=bricks.filter(b=>b.classList.contains('mine')),rest=bricks.filter(b=>!b.classList.contains('mine'));
  const order=[];let mi=0,ri=0;
  for(let i=0;i<bricks.length;i++){const col=i%cols,row=(i/cols)|0;const centre=Math.abs(col-cols/2)<1.2&&row>=1;if(centre&&mi<mine.length)order.push(mine[mi++]);else if(ri<rest.length)order.push(rest[ri++]);else order.push(mine[mi++])}
  order.forEach((b,i)=>{const col=i%cols,row=(i/cols)|0;b.style.width=(bw-4)+'px';b.style.height=(bh-4)+'px';b.style.left=((col-(row%2?.5:0))*bw)+'px';b.style.bottom=(row*bh)+'px'});
  // outside its own scene the wall sinks so only its top few rows show
  const total=Math.ceil(bricks.length/cols)*bh,cap=Math.min(total,3*bh);
  wall.style.setProperty('--sink',Math.max(0,total-cap)+'px');root.style.setProperty('--wallH',(wall.classList.contains('show')?0:cap)+'px');
}
addEventListener('resize',layoutWall);
function roomBricks(n,labels){for(let i=0;i<n;i++)setTimeout(()=>addBrick(labels&&labels[i]!=null?labels[i]:roomLabel(),false,true),i*160)}
const TEACHER_BRICKS={battle:['SIT THERE','WORKSHEET','','','']};
function wallShow(){
  const bw=Math.max(92,Math.min(170,innerWidth/9)),bh=Math.max(24,bw*.3),cols=Math.ceil(innerWidth/bw)+1,target=cols*Math.ceil(innerHeight*.4/bh);
  wall.dataset.cap=target;const need=Math.max(0,target-bricks.length);
  wall.classList.add('show');layoutWall();for(let i=0;i<need;i++)setTimeout(()=>addBrick(roomLabel(),false,i%4===0),reduced?0:i*28);
}
function wallDown(){
  if(wall.dataset.down||!bricks.length)return;
  wall.classList.remove('show');wall.classList.add('falling');root.style.setProperty('--wallH','0px');
  Sound.rubble();setTimeout(()=>Sound.silence(1.5),1300);
  [...bricks].reverse().forEach((b,i)=>setTimeout(()=>{if(!reduced)b.animate([{transform:'none',opacity:1},{transform:`translate(${((Math.random()-.5)*8).toFixed(1)}vw,60vh) rotate(${((Math.random()-.5)*50).toFixed(0)}deg)`,opacity:0}],{duration:800,easing:'cubic-bezier(.55,0,1,.45)',fill:'forwards'});if(i%8===0)Sound.clack(.35)},reduced?0:i*14));
  setTimeout(()=>{bricks.forEach(b=>b.remove());bricks=[];wall.classList.remove('falling');wall.dataset.down=1},reduced?50:bricks.length*22+1000);
}

/* ---- forks */
function startFuse(S){
  const g=S.sc.gate;if(!g.timer||S.fuseLit||S.resolved)return;S.fuseLit=true;
  const total=g.timer*1000*(gentle?2:1);S.fuse.style.setProperty('--t',total/1000+'s');S.left=total;
  S.fuse.classList.add('lit');Sound.sizzle(true);
  const fire=()=>{const o=g.options.find(x=>x.id===g.timeout)||g.options[0];choose(S,o,true)};
  const run=()=>{S.started=performance.now();S.timer=setTimeout(fire,S.left)};
  const pause=()=>{if(S.resolved||!S.timer)return;clearTimeout(S.timer);S.timer=null;S.left-=performance.now()-S.started;S.gateEl.classList.add('held');Sound.sizzle(false)};
  const resume=()=>{if(S.resolved||S.timer)return;S.gateEl.classList.remove('held');Sound.sizzle(true);run()};
  S.gateEl.addEventListener('pointerenter',pause);S.gateEl.addEventListener('pointerleave',resume);
  S.gateEl.addEventListener('focusin',pause);S.gateEl.addEventListener('focusout',resume);
  run();
}
function choose(S,o,timedOut){
  if(S.resolved)return;S.resolved=true;clearTimeout(S.timer);Sound.sizzle(false);
  const g=S.sc.gate;state.forks[g.fork]=o.id;
  if(S.fuse)S.fuse.classList.add('out');S.gateEl.classList.add('done');
  $$('.opt',S.gateEl).forEach(b=>{const me=b.dataset.id===o.id;b.classList.add(me?'picked':'dead');b.disabled=!me;b.tabIndex=-1});
  if(timedOut)state.timeouts++;
  if(o.wire==='brick'){state.bricks.push(o.brick);if(timedOut){Sound.thud(.7);nudge(2)}else{Sound.laugh();flare()}setTimeout(()=>addBrick(o.brick,true),timedOut?300:600)}
  else if(o.wire==='open'){state.open++;Sound.warm()}
  else Sound.chime();
  if(g.fork==='bring')setTimeout(()=>wallDown(),700);
  const msg=timedOut?(g.timeoutToast||'You didn’t choose. Something else did.'):o.toast;
  if(msg)setTimeout(()=>toast(msg),timedOut?350:160);
  reveal();setTimeout(()=>goNext(S),timedOut?1900:1300);
}
function goNext(S){
  const next=scenes.slice(S.idx+1).find(x=>!x.sec.hidden);
  if(next)next.sec.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});
}

/* =====================================================================
   SHOCKS — they land on moments of recognition every reader reaches,
   never on a choice. They escalate in kind:
     scare  idling: sound, a nudge, one flash
     full   the wall: + shake, lightning, colour jolt, reveille, "WAKE UP." for 120 ms
   Never strobing: >= 1.1 s apart, at most two luminance swings per hit.
   ===================================================================== */
const flash=$('#flash'),boltSvg=$('#bolt'),wake=$('#wake'),mainEl=$('main');
let lastShock=0;
function shock(kind='full',level=1){
  const now=performance.now();if(now-lastShock<1100)return;lastShock=now;
  const k=gentle?.3:1,full=kind==='full',scare=kind==='scare';
  Sound.zap(level*(gentle?.55:1)*(scare?.7:1));
  try{navigator.vibrate&&navigator.vibrate(gentle?[30]:scare?[50]:[60,40,140])}catch(e){}
  flash.animate([{opacity:(scare?.5:Math.min(.85,.7*level))*k},{opacity:0}],{duration:scare?160:260,easing:'ease-out'});
  if(scare){nudge(4);return}
  if(!gentle&&!reduced){
    drawBolt();boltSvg.animate([{opacity:1},{opacity:0}],{duration:240,easing:'ease-out'});
    const amp=20*level,frames=[];for(let i=0;i<=12;i++){const d=1-i/12;frames.push({transform:`translate(${((Math.random()*2-1)*amp*d).toFixed(1)}px,${((Math.random()*2-1)*amp*.7*d).toFixed(1)}px) rotate(${((Math.random()*2-1)*.8*d).toFixed(2)}deg)`})}
    frames[12]={transform:'none'};const dur=420+260*level;
    [mainEl,wall,$('#atmos'),$('#murk')].forEach(n=>n&&n.animate(frames,{duration:dur,easing:'linear'}));
    body.classList.add('jolt');setTimeout(()=>body.classList.remove('jolt'),80);
    pushSmoke();
  }
  if(full){wake.classList.add('on');setTimeout(()=>wake.classList.remove('on'),120)}
}
/* a brick choice feels good: a warm bloom, one smooth swing */
function flare(){flash.style.background='#ffb35c';flash.animate([{opacity:0},{opacity:gentle?.1:.24},{opacity:0}],{duration:700,easing:'ease-out'}).onfinish=()=>{flash.style.background=''}}
function drawBolt(){
  const w=innerWidth,h=innerHeight;boltSvg.setAttribute('viewBox',`0 0 ${w} ${h}`);
  const path=(x,y,tx,ty,steps,jag)=>{let d=`M${x.toFixed(0)} ${y.toFixed(0)}`;for(let i=1;i<=steps;i++){const f=i/steps;d+=` L${(x+(tx-x)*f+(Math.random()-.5)*jag).toFixed(0)} ${(y+(ty-y)*f+(Math.random()-.5)*jag*.5).toFixed(0)}`}return d};
  const x=w*(.2+Math.random()*.6),tx=w*(.15+Math.random()*.7),ty=h*(.6+Math.random()*.4),bx=x+(tx-x)*.45,by=ty*.45;
  boltSvg.innerHTML=`<path d="${path(x,0,tx,ty,14,90)}"/><path class="thin" d="${path(bx,by,bx+(Math.random()-.5)*w*.4,by+h*.3,8,60)}"/><path class="thin" d="${path(x,0,x+(Math.random()-.5)*w*.3,h*.35,7,50)}"/>`;
}
function nudge(px){if(reduced)return;mainEl.animate([{transform:'none'},{transform:`translate(${px}px,0)`},{transform:`translate(${-px}px,1px)`},{transform:'none'}],{duration:180})}

/* ---- telltale notices */
const toastEl=$('#toast');let toastT=null;
function toast(text){toastEl.querySelector('span').textContent=text;toastEl.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>toastEl.classList.remove('on'),3400)}

/* ---- cues fired by scroll position */
const CUES={
  bellLow:()=>Sound.bell(.6,1600),
  bellHigh:()=>Sound.bell(1,0),
  chair:()=>{Sound.chair();nudge(2)},
  multiply:S=>multiply(S),
  wallShow:()=>wallShow(),
  wake:()=>{Sound.bugle();shock('full',1.2);setTimeout(handprints,160)},
  peers:S=>drawPeers(S),
  none:()=>{}
};
// a few bricks of the room's own go down while the class is loud
const AUTO_BRICKS={riot:4,'all-noise':6,battle:5,dream:2,'fork-offer':2};

/* ---- text that has to assemble itself */
const GLYPHS='ｱｳｴｶｷｸｺｻｼｽﾀﾁﾂﾃﾅﾆﾇﾈﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾙﾚﾛﾜ01#%&$@<>/\\|=+*';
const G=()=>GLYPHS[(Math.random()*GLYPHS.length)|0];
function scramble(x,dur){
  const parts=x.parts,total=parts.reduce((a,q)=>a+q.text.length,0),start=performance.now(),pool=x.text.replace(/\s/g,'')||GLYPHS,A=()=>Math.random()<.85?pool[(Math.random()*pool.length)|0]:G();x.d.classList.add('scrambling');let last=0;
  const step=now=>{
    if(now-last<33){requestAnimationFrame(step);return}last=now;
    const k=(now-start)/dur;if(k>=1){parts.forEach(q=>q.el.textContent=q.text);x.d.classList.remove('scrambling');return}
    let idx=0;parts.forEach(q=>{let str='';for(const ch of q.text){str+=(ch===' '||idx<k*total*1.15-2)?ch:A();idx++}q.el.textContent=str});
    requestAnimationFrame(step);
  };requestAnimationFrame(step);
}
function microGlitch(x){
  if(!x.parts.length||x.d.classList.contains('scrambling'))return;const q=x.parts[(Math.random()*x.parts.length)|0],a=[...q.text];
  for(let i=0,n=1+(Math.random()*2|0);i<n;i++){const j=(Math.random()*a.length)|0;if(a[j]!==' ')a[j]=G()}
  q.el.textContent=a.join('');setTimeout(()=>{q.el.textContent=q.text},70+Math.random()*90);
}

/* =====================================================================
   THE ENLISTMENT — the class needs you
   Answers never leave the page. The private one is never printed.
   ===================================================================== */
function buildEnlist(stage,S){
  const box=el('div','enlist');
  const form=el('form','enlist-form');form.setAttribute('autocomplete','off');
  form.appendChild(el('div','enlist-head','<b>Enlistment</b><span>Service no. 17 / 28 · seat 17</span>'));
  (window.ENLIST||[]).forEach((f,i)=>{
    const lab=el('label','field'+(f.private?' private':''));
    lab.appendChild(el('span','q')).textContent=(i+1)+'. '+f.q;
    const ta=el('textarea');ta.name=f.id;ta.rows=2;ta.maxLength=240;ta.placeholder=f.hint;ta.addEventListener('keydown',()=>Sound.key());lab.appendChild(ta);
    form.appendChild(lab);
  });
  const go=el('button','sign');go.type='submit';go.textContent='Sign up';form.appendChild(go);
  box.appendChild(form);
  const out=el('div','enlist-out');out.hidden=true;box.appendChild(out);
  form.addEventListener('submit',e=>{e.preventDefault();enlist(S,form,out)});
  stage.appendChild(box);return box;
}
function enlist(S,form,out){
  const answers={};(window.ENLIST||[]).forEach(f=>{answers[f.id]=(form.elements[f.id].value||'').trim()});
  state.enlist=answers;Sound.stamp();shock('scare');
  const canvas=drawCard(answers);
  out.innerHTML='';const img=el('img','card');img.alt='Your enlistment card';img.src=canvas.toDataURL('image/png');out.appendChild(img);
  const row=el('div','card-actions');
  const dl=el('a','sign');dl.textContent='Save your card';dl.download='class-of-rowdies-enlistment.png';dl.href=img.src;row.appendChild(dl);
  const again=el('button','again');again.type='button';again.textContent='walk it again ↺';again.addEventListener('click',()=>location.reload());row.appendChild(again);
  out.appendChild(row);
  out.appendChild(el('p','kept',answers.weekly?'The last answer isn’t on the card. It stays with you.':'Tuesday. The door’s open.'));
  form.hidden=true;out.hidden=false;
  const tube=el('div','tube on steady');S.stage.prepend(tube);Sound.set({hum:.25,march:.5,crackle:.2});
  setTimeout(()=>Sound.bell(1,0),900);
}
function drawCard(a){
  const W=1080,H=1350,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  x.fillStyle='#efe6d2';x.fillRect(0,0,W,H);
  for(let i=0;i<9000;i++){x.fillStyle=`rgba(80,60,40,${Math.random()*.06})`;x.fillRect(Math.random()*W,Math.random()*H,1.5,1.5)}
  x.strokeStyle='#2a2119';x.lineWidth=6;x.strokeRect(40,40,W-80,H-80);x.lineWidth=2;x.strokeRect(56,56,W-112,H-112);
  x.fillStyle='#b3261e';x.fillRect(56,56,W-112,150);
  x.fillStyle='#fff6e6';x.textAlign='center';x.font='bold 64px Anton, Impact, sans-serif';x.fillText('THE CLASS NEEDS YOU',W/2,150);
  x.fillStyle='#2a2119';x.font='600 22px "IBM Plex Mono", monospace';x.fillText('CLASS OF ROWDIES · SERVICE NO. 17 / 28 · SEAT 17 · '+new Date().toLocaleDateString('en-GB'),W/2,244);x.font='600 18px "IBM Plex Mono", monospace';x.fillStyle='#b3261e';x.fillText('AUTHORSHIP · CITIZENSHIP · AGENCY',W/2,276);
  const rows=[['I CAN GIVE',a.give],['I WANT TO GET',a.get],['I WANT TO LEARN',a.learn],['BUCKET LIST → COURSE',a.bucket]];
  let y=320;x.textAlign='left';
  rows.forEach(([h,v])=>{x.fillStyle='#b3261e';x.font='600 22px "IBM Plex Mono", monospace';x.fillText(h,100,y);y+=14;
    x.fillStyle='#1d1812';x.font='600 28px "IBM Plex Mono", monospace';
    const lines=wrap(x,(v||'—').toUpperCase(),W-200);lines.slice(0,4).forEach(l=>{y+=46;x.fillText(l,100,y)});y+=52;
    x.strokeStyle='rgba(42,33,25,.3)';x.lineWidth=1;x.beginPath();x.moveTo(100,y-24);x.lineTo(W-100,y-24);x.stroke();});
  x.save();x.translate(W-300,H-260);x.rotate(-.22);x.strokeStyle='rgba(179,38,30,.85)';x.lineWidth=8;x.strokeRect(-190,-62,380,124);x.fillStyle='rgba(179,38,30,.85)';x.textAlign='center';x.font='bold 84px Anton, Impact, sans-serif';x.fillText('ENLISTED',0,30);x.restore();
  x.fillStyle='#2a2119';x.textAlign='left';x.font='italic 500 34px "Cormorant Garamond", Georgia, serif';x.fillText('Tuesday. The door’s open.',100,H-120);
  return c;
}
function wrap(x,text,max){const words=String(text).split(/\s+/),lines=[];let line='';words.forEach(w=>{const t=line?line+' '+w:w;if(x.measureText(t).width>max&&line){lines.push(line);line=w}else line=t});if(line)lines.push(line);return lines}

/* =====================================================================
   ATMOSPHERE — two layers of haze (one that glows, one that hides the
   words until it drifts on) and the room's chatter falling like broken code
   ===================================================================== */
const cv=$('#atmos'),cx=cv.getContext('2d'),mv=$('#murk'),mx=mv.getContext('2d');
let W=0,H=0,puffs=[],murk=[],cols=[],frags=[],sprite=null,dark=null;
const mkSprite=(a,b,c)=>{const cn=document.createElement('canvas');cn.width=cn.height=256;const g2=cn.getContext('2d'),g=g2.createRadialGradient(128,128,0,128,128,128);g.addColorStop(0,a);g.addColorStop(.45,b);g.addColorStop(1,c);g2.fillStyle=g;g2.fillRect(0,0,256,256);return cn};
const CHAT=()=>{const c=window.CHATTER||['...'];return c[(Math.random()*c.length)|0]};
function sizeAtmos(){
  const dpr=Math.min(1.25,devicePixelRatio||1);W=innerWidth;H=innerHeight;[[cv,cx],[mv,mx]].forEach(([c,x])=>{c.width=W*dpr;c.height=H*dpr;x.setTransform(dpr,0,0,dpr,0,0)});
  if(!sprite){sprite=mkSprite('rgba(210,200,185,.55)','rgba(170,160,150,.26)','rgba(120,110,105,0)');dark=mkSprite('rgba(12,10,9,.75)','rgba(18,15,13,.4)','rgba(18,15,13,0)')}
  const puff=()=>({x:Math.random()*W,y:Math.random()*H,r:120+Math.random()*260,vx:(Math.random()-.5)*.25,vy:-.12-Math.random()*.35,kx:0,ky:0,a:.4+Math.random()*.6,ph:Math.random()*6});
  puffs=Array.from({length:26},puff);murk=Array.from({length:40},()=>{const p=puff();p.r*=.8;p.vy*=.6;return p});
  const cw=Math.max(40,W/22);cols=Array.from({length:Math.ceil(W/cw)},(_,i)=>({x:i*cw+cw/2,y:Math.random()*H*1.5-H,v:1+Math.random()*2.4,w:CHAT(),pink:Math.random()<.3,freeze:0}));
}
sizeAtmos();addEventListener('resize',()=>{sizeAtmos();update()});
function pushSmoke(){[...puffs,...murk].forEach(p=>{p.kx=(p.x-W/2)/W*16;p.ky=(p.y-H/2)/H*12})}
let smokeNow=0,rainNow=0;
function drift(p,t){p.x+=p.vx+p.kx+Math.sin(t/4000+p.ph)*.25;p.y+=p.vy*(reduced?.2:1)+p.ky;p.kx*=.93;p.ky*=.93;if(p.y<-p.r)p.y=H+p.r;if(p.y>H+p.r)p.y=-p.r;if(p.x<-p.r)p.x=W+p.r;if(p.x>W+p.r)p.x=-p.r}
function drawAtmos(t,smoke,rain,chaos){
  cx.clearRect(0,0,W,H);mx.clearRect(0,0,W,H);
  if(smoke>.01){
    puffs.forEach(p=>{drift(p,t);cx.globalAlpha=smoke*p.a*.38;cx.drawImage(sprite,p.x-p.r,p.y-p.r,p.r*2,p.r*2)});
    const n=Math.round(12+28*chaos);for(let i=0;i<n;i++){const p=murk[i];drift(p,t);mx.globalAlpha=smoke*p.a*.32*chaos;mx.drawImage(dark,p.x-p.r,p.y-p.r,p.r*2,p.r*2)}
  }
  if(rain>.01&&!reduced){
    cols.forEach(c=>{
      if(t<c.freeze)return drawCol(c,rain);
      if(Math.random()<.002){c.freeze=t+200;c.y+=c.v*14}
      c.y+=c.v;const len=c.w.length*18;
      if(c.y>H+20){c.y=-len-Math.random()*H*.5;c.w=CHAT();c.pink=Math.random()<.3}
      drawCol(c,rain);
    });
    if(frags.length<7&&Math.random()<rain*.025){const f=[['italic 500 30px "Cormorant Garamond",serif','#f3e2c4'],['600 24px "IBM Plex Mono",monospace','#ffb3c8'],['600 13px "IBM Plex Mono",monospace','#e9b872']][(Math.random()*3)|0];frags.push({t:CHAT(),x:W*(.08+Math.random()*.7),y:H*(.12+Math.random()*.7),font:f[0],col:f[1],born:t,life:1800+Math.random()*1600})}
    frags=frags.filter(f=>t-f.born<f.life);frags.forEach(f=>{cx.font=f.font;cx.textAlign='left';cx.fillStyle=f.col;cx.globalAlpha=rain*.75*Math.sin(Math.PI*(t-f.born)/f.life);cx.fillText(f.t,f.x,f.y)});
    if(Math.random()<rain*.04){cx.globalAlpha=.06+rain*.08;cx.fillStyle=Math.random()<.5?'#ff2d78':'#e9b872';cx.fillRect(0,Math.random()*H,W,2+Math.random()*14)}
  }
  cx.globalAlpha=1;mx.globalAlpha=1;
}
function drawCol(c,rain){
  const chars=[...c.w.toUpperCase()],n=chars.length;cx.textAlign='center';cx.font='600 14px "IBM Plex Mono",monospace';
  chars.forEach((ch,i)=>{const y=c.y+i*18;if(y<-20||y>H+20)return;const head=i===n-1,glitch=Math.random()<.015;
    cx.globalAlpha=rain*(head?.9:.3+.4*(i/n));cx.fillStyle=glitch?'#7dffa8':c.pink?(head?'#ffe0ea':'#d9728f'):(head?'#fff1d6':'#d9a55e');cx.fillText(glitch?G():ch,c.x,y)});
}

/* =====================================================================
   THE LOOP — scroll position drives everything
   ===================================================================== */
let activeScene=null,prevScene=null,chaosNow=.5,lastInput=performance.now(),idleNudged=false;
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
    let lastOn=-1;
    S.beats.forEach((x,i)=>{
      if(!x.text)return;
      const want=p>=x.b.at-.001||(sc.look==='recruit'&&r.top<innerHeight*.6);
      if(want!==x.on){x.on=want;x.d.classList.toggle('on',want);if(want&&!x.shown){x.shown=true;const c=sc.chaos;if(c>.5&&!reduced)scramble(x,220+c*820)}}
      if(want)lastOn=i;
    });
    const flowing=S.flow,slamTop=lastOn>=0&&S.beats[lastOn].b.k==='slam';
    S.beats.forEach((x,i)=>{const age=lastOn-i;x.d.classList.toggle('under',!flowing&&slamTop&&x.on&&age>=1&&x.b.k!=='whisper');x.d.classList.toggle('old',x.on&&age>=1&&x.b.k!=='whisper');x.d.classList.toggle('gone',x.on&&x.b.k!=='whisper'&&age>=(flowing?(sc.keep||5):3))});
    (sc.cue||[]).forEach((q,i)=>{if(p>=q.at&&!S.fired[i]&&r.top<=innerHeight*.2){S.fired[i]=1;CUES[q.fx]&&CUES[q.fx](S)}});
    if(S.gateEl){const g=sc.gate;if(p>=g.at-.001&&!S.gateShown){S.gateShown=true;S.gateEl.classList.add('show');setTimeout(()=>startFuse(S),900)}}
    if(sc.look==='lamp')S.sec.style.setProperty('--reveal',(clamp(p/.55)*62).toFixed(1)+'%');
    const waiting=isGate(S)&&!S.resolved;S.cue.classList.toggle('show',!waiting&&S===act&&p>.9&&!sc.end);
  });
  if(act&&act!==activeScene){
    prevScene=activeScene;activeScene=act;const sc=act.sc;
    chapter.textContent=sc.label;body.dataset.act=sc.act;body.dataset.look=sc.look;
    Sound.set(sc.mix);
    if(sc.look==='recruit'&&!act.pasted){act.pasted=1;[['THE CLASS','p1'],['NEEDS YOU.','p2']].forEach(([t,c],i)=>setTimeout(()=>{const p=el('div','paste '+c);p.textContent=t;act.art&&act.art.appendChild(p);Sound.stamp();nudge(3)},500+i*700))}
    if(sc.look!=='wall'&&wall.classList.contains('show')){wall.classList.remove('show');layoutWall()}
    if(AUTO_BRICKS[sc.id]&&!act.bricked){act.bricked=1;roomBricks(AUTO_BRICKS[sc.id],TEACHER_BRICKS[sc.id])}
    if(!reduced&&prevScene&&prevScene.art&&sc.act<=2&&prevScene.sc.act<=2&&prevScene.sc.art!==sc.art&&sc.chaos>=.5)holdBand(prevScene.sc.art);
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
  // the reader's own bricks make the loud scenes louder; holding back steadies them
  const bias=sc.act<=2&&sc.chaos>=.5?.12*state.bricks.length-.12*state.open:0;
  chaosNow+=(clamp(sc.chaos+bias)-chaosNow)*.05;root.style.setProperty('--chaos',chaosNow.toFixed(3));
  const g=chaosNow<.5?0:Math.pow((chaosNow-.5)/.5,1.5);
  if(t-rgbT>70){rgbT=t;root.style.setProperty('--rgb',((1+Math.random()*4)*g).toFixed(1)+'px')}
  smokeNow+=((sc.smoke||0)-smokeNow)*.03;rainNow+=((sc.rain||0)-rainNow)*.04;
  drawAtmos(t,smokeNow,rainNow,chaosNow);
  Sound.tick();
  // fluorescent tube: >= 340 ms between toggles (never past ~3 flashes/s), calmer when gentle, quiet around a shock
  scenes.forEach(T=>{if(!T.tube||T.sec.hidden||t<T.nextFlick||performance.now()-lastShock<1000)return;
    T.tubeOn=!T.tubeOn;T.tube.classList.toggle('on',T.tubeOn);T.sec.style.setProperty('--lit',T.tubeOn?(gentle?'.45':'1'):(gentle?'.2':'.08'));T.sec.style.setProperty('--wlit',T.tubeOn?'1':(gentle?'.6':'.12'));if(T===S)Sound.humFlick(T.tubeOn);
    const minGap=gentle?700:340;
    if(T.stutter>0&&!gentle){T.stutter--;T.nextFlick=t+minGap+Math.random()*80}else if(T.tubeOn){T.nextFlick=t+700+Math.random()*2600;if(!gentle&&Math.random()<.45)T.stutter=2+((Math.random()*2)|0)*2}else T.nextFlick=t+Math.max(minGap,250+Math.random()*(T.sc.id==='bell'&&T.p<.1?1600:700))});
  // glitches only exist where the room is actually loud
  if(!reduced&&S.art&&Math.random()<g*.05)burst(S);
  if(!reduced&&Math.random()<g*.025){const on=S.beats.filter(x=>x.on&&x.text);if(on.length)microGlitch(on[(Math.random()*on.length)|0])}
  // idle too long while the room is loud
  if(!idleNudged&&sc.act===1&&!isGate(S)&&t-lastInput>16000){idleNudged=true;shock('scare');toast('Still there?')}
}
requestAnimationFrame(loop);
reveal();

/* local testing only: http://localhost:PORT/?dev skips the film (inert on GitHub Pages) */
if(/^(localhost|127\.0\.0\.1)$/.test(location.hostname)&&/[?&]dev\b/.test(location.search)){armExit('dev',false);window.__dev={state,scenes,Sound,go:(id,p)=>{const s=$('#s-'+id);scrollTo(0,s.offsetTop+(s.offsetHeight-innerHeight)*p)}};addEventListener('pointerdown',()=>{if(!journeyUnlocked){Sound.unlock();soundWanted=true;paintSoundBtn();Sound.mute(false);bypass.click()}},{once:true})}

$('#fullBtn').addEventListener('click',async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen()}catch(e){}});

/* credits: art list comes straight from the story */
const artList=$('#artCredits');if(artList){const seen=new Set();STORY.forEach(s=>{if(s.credit&&!seen.has(s.art)){seen.add(s.art);artList.appendChild(el('li',null,s.credit))}})}
})();
