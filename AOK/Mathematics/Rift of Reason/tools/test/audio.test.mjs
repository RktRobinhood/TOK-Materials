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
test('cancelled or muted recorded playback cannot restart speech through a late rejection',async()=>{
 const state={settings:{music:.5,sfx:.8,voice:1}},events={},rejects=[],spoken=[];
 class Audio {play(){return new Promise((_,reject)=>rejects.push(reject));}pause(){}}
 class Utterance {constructor(text){this.text=text;}}
 const Rift={data:{voices:{line:'line.mp3'}},State:{get:()=>state},clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),bus:{on:(n,fn)=>{events[n]=fn;}}};
 const synth={cancel(){},getVoices:()=>[],speak:u=>spoken.push(u)};
 vm.runInNewContext(fs.readFileSync(GAME_DIR+'/js/core/audio.js','utf8'),{window:{Rift,speechSynthesis:synth,SpeechSynthesisUtterance:Utterance},Audio,Math,Date,Set});
 const muted=Rift.Audio.speak({speaker:'narrator',text:'Old instruction',voice:'line'});
 state.settings.voice=0;events['state:changed']();rejects.shift()(new Error('paused'));await muted;await Promise.resolve();
 assert.equal(spoken.length,0);
 state.settings.voice=1;events['state:changed']();
 const stale=Rift.Audio.speak({speaker:'narrator',text:'Stale instruction',voice:'line'});
 const current=Rift.Audio.speak({speaker:'narrator',text:'Current instruction'});
 rejects.shift()(new Error('superseded'));await stale;await Promise.resolve();
 assert.deepEqual(spoken.map(u=>u.text),['Current instruction']);
 Rift.Audio.stopVoice();await current;
 const failed=Rift.Audio.speak({speaker:'narrator',text:'Fallback instruction',voice:'line'});
 state.settings.voice=.4;events['state:changed']();rejects.shift()(new Error('missing file'));await Promise.resolve();
 assert.equal(spoken.at(-1).volume,.4);assert.equal(spoken.at(-1).text,'Fallback instruction');
 spoken.at(-1).onend();await failed;
});
