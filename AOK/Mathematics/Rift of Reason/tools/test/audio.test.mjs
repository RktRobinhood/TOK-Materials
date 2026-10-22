import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {GAME_DIR,loadRift} from './harness.mjs';
function setup(){
 let now=0;
 const state={settings:{music:0.4,sfx:0.8,voice:1}};
 const instances=[],events={};
 class Audio {
  constructor(file){this.file=file;this.paused=true;instances.push(this);}
  cloneNode(){return new Audio(this.file);}
  play(){this.paused=false;return Promise.resolve();}
  pause(){this.paused=true;}
 }
 const Rift={data:{sfx:{click:['tap.wav'],open:['open.wav'],step:['step.wav'],hit:['hit.wav'],win:['win.wav'],caught:['win.wav']}},
  State:{get:()=>state},clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),bus:{on:(name,fn)=>{events[name]=fn;}}};
 vm.runInNewContext(fs.readFileSync(GAME_DIR+'/js/core/audio.js','utf8'),{window:{Rift},Audio,Date:{now:()=>now},Math,Set});
 return {Rift,state,instances,events,advance:n=>{now+=n;},active:()=>instances.filter(a=>!a.paused)};
}
test('audio throttles from time zero, replaces same-bus cues and caps the mix at four voices',()=>{
 const g=setup();g.Rift.Audio.sfx('click');g.Rift.Audio.sfx('click');assert.equal(g.active().length,1);
 g.advance(100);g.Rift.Audio.sfx('click');assert.equal(g.active().length,1);
 g.Rift.Audio.sfx('open');assert.equal(g.active().length,1);
 for(const name of ['step','hit','win'])g.Rift.Audio.sfx(name);
 assert.equal(g.active().length,4);
 g.Rift.Audio.sfx('caught');assert.equal(g.active().length,4);
 g.Rift.Audio.stopSounds();assert.equal(g.active().length,0);
});
test('music and SFX mute independently, zero options stay silent and setting changes stop current cues',()=>{
 const g=setup();g.state.settings.music=0;
 g.Rift.Audio.sfx('win');g.Rift.Audio.sfx('click',{volume:0});assert.equal(g.active().length,0);
 g.Rift.Audio.sfx('hit');assert.equal(g.active()[0].volume,0.8);
 g.events['state:changed']();assert.equal(g.active().length,0);
 g.state.settings.sfx=0;g.state.settings.music=0.6;
 g.Rift.Audio.sfx('click');g.Rift.Audio.sfx('win');assert.equal(g.active().length,1);assert.equal(g.active()[0].volume,0.6);
 g.events['state:changed']();assert.equal(g.active().length,0);
 g.advance(100);g.Rift.Audio.sfx('win');g.events['state:changed']();assert.equal(g.active().length,1,'unrelated state updates must not cut a jingle');
});
test('all mapped effects are short mono PCM WAV with mix headroom and complete lesson-loop cues',()=>{
 const Rift=loadRift(['js/core/rift.js','data/sfx.js']);
 for(const name of ['step','throw','wobble','caught','escape','block','rift','reveal','fate-fine','fate-scarred','fate-injured','fate-warp','fate-death','win','lose'])assert.ok(Rift.data.sfx[name],name);
 for(const file of new Set(Object.values(Rift.data.sfx).flat())){
  const wav=fs.readFileSync(GAME_DIR+'/assets/sfx/'+file);
  assert.equal(wav.toString('ascii',0,4),'RIFF',file);assert.equal(wav.toString('ascii',8,12),'WAVE');
  assert.equal(wav.readUInt16LE(20),1);assert.equal(wav.readUInt16LE(22),1);assert.equal(wav.readUInt16LE(34),16);
  assert.equal(wav.readUInt32LE(24),22050);assert.equal(wav.toString('ascii',36,40),'data');
  const size=wav.readUInt32LE(40);assert.equal(size,wav.length-44);assert.ok(size/44100<4,file);
  let peak=0;for(let i=44;i<wav.length;i+=2)peak=Math.max(peak,Math.abs(wav.readInt16LE(i))/32767);
  assert.ok(peak>0.2&&peak<=0.224,file+' peak '+peak);assert.ok(peak*4<1,'four-voice headroom');
 }
});

test('wins and catches share a dedicated upbeat cue, distinct from defeat', () => {
 const Rift = loadRift(['js/core/rift.js', 'data/sfx.js', 'data/sfx-el.js']);
 assert.deepEqual([...Rift.data.sfx.win], ['victory-bright.wav']);
 assert.deepEqual([...Rift.data.sfx.caught], [...Rift.data.sfx.win]);
 const positive = fs.readFileSync(GAME_DIR + '/assets/sfx/' + Rift.data.sfx.win[0]);
 const negative = fs.readFileSync(GAME_DIR + '/assets/sfx/' + Rift.data.sfx.lose[0]);
 assert.ok(!positive.equals(negative));
 const source = JSON.parse(fs.readFileSync(GAME_DIR + '/design/source-audio/victory-feedback-160/sources.json', 'utf8'));
 assert.equal(source.license, 'CC0-1.0');
 assert.ok(source.seconds >= .6 && source.seconds < 2, 'a short celebration, not a wait');
});
test('the browser voice is never used: unrecorded or failed lines are text only',async()=>{
 const state={settings:{music:.5,sfx:.8,voice:1}},events={},plays=[],spoken=[];
 class Audio {constructor(file){this.file=file;}play(){return new Promise((_,reject)=>plays.push({audio:this,reject}));}pause(){}}
 class Utterance {constructor(text){this.text=text;}}
 const Rift={data:{voices:{line:'line.mp3'}},State:{get:()=>state},clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),bus:{on:(n,fn)=>{events[n]=fn;}}};
 const synth={cancel(){},getVoices:()=>[{lang:'en-GB',name:'English'}],speak:u=>spoken.push(u),speaking:false};
 vm.runInNewContext(fs.readFileSync(GAME_DIR+'/js/core/audio.js','utf8'),{window:{Rift,speechSynthesis:synth,SpeechSynthesisUtterance:Utterance},Audio,Math,Date,Set});
 await Rift.Audio.speak({speaker:'narrator',text:'Not recorded yet'});
 assert.equal(plays.length,0);assert.equal(Rift.Audio.speaking(),false);
 const failed=Rift.Audio.speak({speaker:'narrator',text:'Recorded',voice:'line'});
 assert.equal(plays[0].audio.file,'assets/voice/line.mp3');assert.equal(Rift.Audio.speaking(),true);
 plays[0].reject(new Error('missing file'));await failed;
 assert.equal(Rift.Audio.speaking(),false);
 const stopped=Rift.Audio.speak({speaker:'narrator',text:'Recorded',voice:'line'});Rift.Audio.stopVoice();await stopped;
 assert.equal(spoken.length,0,'speechSynthesis must never speak');
});
test('a new line or a click past cuts the recording that is playing, so voices never overlap',async()=>{
 const state={settings:{music:.5,sfx:.8,voice:1}},instances=[];
 class Audio {constructor(file){this.file=file;this.paused=true;instances.push(this);}play(){this.paused=false;return new Promise(()=>{});}pause(){this.paused=true;}}
 const Rift={data:{voices:{a:'a.mp3',b:'b.mp3'}},State:{get:()=>state},clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),bus:{on(){}}};
 vm.runInNewContext(fs.readFileSync(GAME_DIR+'/js/core/audio.js','utf8'),{window:{Rift},Audio,Math,Date,Set});
 const playing=()=>instances.filter(a=>!a.paused).map(a=>a.file);
 const first=Rift.Audio.speak({speaker:'granny',text:'One',voice:'a'});
 assert.deepEqual(playing(),['assets/voice/a.mp3']);
 const second=Rift.Audio.speak({speaker:'granny',text:'Two',voice:'b'});
 await first;
 assert.deepEqual(playing(),['assets/voice/b.mp3'],'the first line stops when the next starts');
 Rift.Audio.speak({speaker:'granny',text:'Unrecorded'});
 assert.deepEqual(playing(),[],'a line without a recording still silences the one before');
 await second;
 Rift.Audio.speak({speaker:'granny',text:'Three',voice:'a'});Rift.Audio.stopVoice();
 assert.deepEqual(playing(),[]);assert.equal(Rift.Audio.speaking(),false);
});
