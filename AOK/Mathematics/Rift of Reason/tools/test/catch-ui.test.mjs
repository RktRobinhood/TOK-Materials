import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {loadRift} from './harness.mjs';
import {Node} from './dom-adapter.mjs';
function game(mode,item,lured=false){
 const Rift=loadRift(['js/core/rift.js','js/core/state.js','js/core/catching.js','data/creatures.js','data/items.js']);
 const state=Rift.State.freshState();state.items[item]=8;Rift.State.get=()=>state;
 Rift.el=(...a)=>new Node(...a);Rift.Assets={img:()=>new Node()};Rift.Audio={sfx:()=>{}};
 let now=0;const timers=new Set();const results=[];
 vm.runInNewContext(fs.readFileSync(new URL('../../js/ui/catching.js',import.meta.url),'utf8'),{window:{Rift},Date:{now:()=>now},setInterval:fn=>{timers.add(fn);return fn;},clearInterval:fn=>timers.delete(fn)});
 const root=new Node();const handle=Rift.CatchGame.mount(root,{mode,item,species:'swiftlet',lured,seed:12,base:.5,spend:id=>{if(!state.items[id])return false;state.items[id]--;return true;},available:id=>state.items[id],onFinish:r=>results.push(r)});
 return {root,state,handle,results,timers,advance:seconds=>{now=seconds*1000;[...timers].forEach(fn=>fn());}};
}
for(const item of ['charm','greatcharm']){
 test(item+': throw costs one charm, emits once and clears timer',()=>{
  const g=game('throw',item);const target=g.root.querySelector('.catch-target');target.getBoundingClientRect=()=>({left:0,top:0,width:230,height:230});
  target.onclick({detail:0});assert.equal(g.state.items[item],7);assert.equal(g.results.length,1);assert.ok(g.results[0].bonus>0);assert.equal(g.timers.size,0);
  target.onclick({detail:0});assert.equal(g.state.items[item],7);assert.equal(g.results.length,1);
 });
 test(item+': box spends per valid placement; deadline gives no bonus and clears timer',()=>{
  const g=game('box',item);const grid=g.root.querySelector('.catch-grid');grid.children[0].onclick();assert.equal(g.state.items[item],7);
  g.advance(29);assert.equal(g.results.length,1);assert.equal(g.results[0].spent,1);assert.equal(g.results[0].bonus,0);assert.equal(g.timers.size,0);
 });
 test(item+': timeout throw is one rushed charm; leaving destroys timer without a catch',()=>{
  const g=game('throw',item,true);g.advance(29);assert.equal(g.results[0].spent,1);assert.equal(g.results[0].bonus,0);
  const left=game('box',item);left.handle.destroy();left.advance(29);assert.equal(left.timers.size,0);assert.equal(left.results.length,0);assert.equal(left.state.items[item],8);
 });
}
