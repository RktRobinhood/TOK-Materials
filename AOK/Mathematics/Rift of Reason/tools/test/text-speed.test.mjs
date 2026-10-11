import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {Node} from './dom-adapter.mjs';
import {GAME_DIR,loadRift} from './harness.mjs';

async function rendered(speed,instant=false){
 class Element extends Node{appendChild(n){this.append(n);return n;}addEventListener(){}remove(){}}
 const overlay=new Element(),listeners=new Map(),delays=[];
 const document={getElementById:()=>overlay,addEventListener:(k,fn)=>listeners.set(fn,k),removeEventListener:(k,fn)=>listeners.delete(fn)};
 const Rift={el:(...a)=>new Element(...a),data:{speakers:{narrator:{name:'Host',art:'host'}}},State:{get:()=>({settings:{textSpeed:speed,textInstant:instant}})},Assets:{img:()=>new Element()},Audio:{sfx(){},speak(){},stopVoice(){}},voiceId:()=>''};
 const ctx={window:{Rift,document},setTimeout:(fn,delay)=>{delays.push(delay);return 1;},clearTimeout(){}};
 for(const f of ['js/core/story.js','js/core/cast.js','js/ui/dialogue.js'])vm.runInNewContext(fs.readFileSync(GAME_DIR+'/'+f,'utf8'),ctx);
 const done=Rift.Dialogue.play([{s:'narrator',t:'Read this line.'}]);
 const press=()=>[...listeners.keys()].forEach(fn=>fn({key:'Enter',preventDefault(){},stopPropagation(){}}));
 const full=()=>{function all(n){return [n,...n.children.filter(x=>x instanceof Node).flatMap(all)];}return all(overlay).some(n=>n.textContent==='Read this line.');};
 assert.equal(full(),instant);
 press();if(!instant){assert.equal(full(),true);assert.equal(listeners.size,1,'reveal does not advance');press();}
 await done;assert.equal(listeners.size,0);return delays[0]||0;
}
test('Slow, midpoint, Fast and Instant have monotonic delays and safe single-input reveal',async()=>{
 const slow=await rendered(0),middle=await rendered(.5),fast=await rendered(1),instant=await rendered(.5,true);
 assert.ok(slow>middle&&middle>fast&&fast>instant);assert.equal(instant,0);
});
test('new saves have forgiving story consequences, and imported choices and text settings are preserved',()=>{
 const R=loadRift(['js/core/rift.js','js/core/state.js']);
 assert.equal(R.State.freshState().settings.charactersCanDie,false);
 const saved=R.State.freshState();saved.settings.charactersCanDie=true;saved.settings.textSpeed=0;saved.settings.textInstant=true;
 const restored=R.State.migrate(R.State.decode('save',R.State.encode('save',saved)));
 assert.equal(restored.settings.charactersCanDie,true);assert.equal(restored.settings.textSpeed,0);assert.equal(restored.settings.textInstant,true);
});
