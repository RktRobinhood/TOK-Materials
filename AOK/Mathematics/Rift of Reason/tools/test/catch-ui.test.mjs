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
 return {Rift,root,state,handle,results,timers,advance:seconds=>{now=seconds*1000;[...timers].forEach(fn=>fn());}};
}
for(const item of ['charm','greatcharm']){
 test(item+': throw costs one charm, emits once and clears timer',()=>{
  const g=game('throw',item);g.root.querySelector('.catch-play').onclick();const target=g.root.querySelector('.catch-target');target.getBoundingClientRect=()=>({left:0,top:0,width:230,height:230});
  target.onclick({detail:0});assert.equal(g.state.items[item],7);assert.equal(g.results.length,1);assert.ok(g.results[0].bonus>0);assert.equal(g.timers.size,0);
  target.onclick({detail:0});assert.equal(g.state.items[item],7);assert.equal(g.results.length,1);
 });
 test(item+': box spends one charm per try, not per placement; deadline gives no bonus and clears timer',()=>{
  const g=game('box',item);g.root.querySelector('.catch-play').onclick();const grid=()=>g.root.querySelector('.catch-grid');
  grid().children[0].onclick();assert.equal(g.state.items[item],7);
  grid().children[35].onclick();assert.equal(g.state.items[item],7);
  const all=n=>[n,...n.children.filter(x=>x instanceof Node).flatMap(all)];
  const budget=g.Rift.Catching.config(item,g.Rift.data.creatures.swiftlet.rarity,false).placements;
  assert.ok(all(g.root).some(n=>n.textContent==='Placements left: '+(budget-2)+'. Trap it for +15 points.'));
  assert.ok(all(g.root).some(n=>n.textContent.startsWith('One charm per try. Place up to '+budget+' charms')));
  g.advance(29);assert.equal(g.results.length,1);assert.equal(g.results[0].spent,1);assert.equal(g.results[0].bonus,0);assert.equal(g.timers.size,0);
 });
 test(item+': box with one charm left still gets the whole placement budget (#125)',()=>{
  const g=game('box',item);g.state.items[item]=1;const cfg=g.Rift.Catching.config(item,g.Rift.data.creatures.swiftlet.rarity,false);
  g.root.querySelector('.catch-play').onclick();
  // Charm the far corners and edges: valid placements that cannot trap, until the budget runs out.
  let placed=0;for(const cell of [0,5,30,35,1,4,31,34,6,11]){if(g.results.length)break;const btn=g.root.querySelector('.catch-grid').children[cell];if(!btn.disabled){btn.onclick();placed++;}}
  assert.equal(g.results.length,1);assert.equal(g.results[0].spent,1);assert.equal(g.state.items[item],0);
  assert.equal(g.results[0].label,'It still has an exit.');
  assert.equal(placed,cfg.placements);
 });
 test(item+': timeout throw is one rushed charm; leaving destroys timer without a catch',()=>{
  const g=game('throw',item,true);g.root.querySelector('.catch-play').onclick();g.advance(29);assert.equal(g.results[0].spent,1);assert.equal(g.results[0].bonus,0);
  const left=game('box',item);left.handle.destroy();left.advance(29);assert.equal(left.timers.size,0);assert.equal(left.results.length,0);assert.equal(left.state.items[item],8);
 });
}
