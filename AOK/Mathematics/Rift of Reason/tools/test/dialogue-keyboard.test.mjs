import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {Node} from './dom-adapter.mjs';
import {GAME_DIR} from './harness.mjs';
test('dialogue captures Enter and Space before a focused map marker and releases the handler on completion',async()=>{
 class Element extends Node {
  appendChild(n){this.append(n);return n;}
  addEventListener(){}
  remove(){this.removed=true;}
 }
 const overlay=new Element(),listeners=new Map();let markerActivations=0;
 const document={getElementById:()=>overlay,addEventListener:(key,fn,capture)=>listeners.set(fn,{key,capture}),removeEventListener:(key,fn,capture)=>{assert.equal(listeners.get(fn).capture,capture);listeners.delete(fn);}};
 const Rift={el:(...a)=>new Element(...a),data:{speakers:{narrator:{name:'Narrator',art:'host'}}},State:{get:()=>({settings:{textSpeed:1}})},Assets:{img:()=>new Element()},Audio:{sfx(){},speak(){},stopVoice(){}},voiceId:()=>''};
 vm.runInNewContext(fs.readFileSync(GAME_DIR+'/js/ui/dialogue.js','utf8'),{window:{Rift,document},setTimeout:()=>1,clearTimeout(){}});
 const completed=Rift.Dialogue.play([{s:'narrator',t:'Read this.'}]);
 function press(key){
  let stopped=false,prevented=false;
  const event={key,preventDefault(){prevented=true;},stopPropagation(){stopped=true;}};
  for(const [fn,entry] of [...listeners])if(entry.capture)fn(event);
  if(!stopped)markerActivations++;
  assert.ok(stopped);assert.ok(prevented);
 }
 press('Enter');press(' ');await completed;
 assert.equal(markerActivations,0);assert.equal(listeners.size,0);assert.equal(overlay.children[0].removed,true);
});
