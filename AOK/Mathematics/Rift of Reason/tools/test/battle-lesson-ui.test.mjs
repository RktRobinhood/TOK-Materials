import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {loadRift} from './harness.mjs';
import {Node} from './dom-adapter.mjs';
function setup(){
 const Rift=loadRift(['js/core/rift.js','data/creatures.js','data/axioms.js','js/battle/abilities.js','js/battle/engine.js','js/battle/lesson.js']);
 let screen,helpClosed=0;const timers=new Map();let tick=0;
 Rift.data.speakers={granny:{art:'npc/granny'}};
 Rift.el=(...args)=>new Node(...args);Rift.Assets={img:()=>new Node()};Rift.Screens={register:(_,def)=>{screen=def;}};
 Rift.Battles={rules:onClose=>({close(){helpClosed++;onClose();}})};
 vm.runInNewContext(fs.readFileSync(new URL('../../js/screens/battle-lesson.js',import.meta.url),'utf8'),{window:{Rift,setTimeout:fn=>{timers.set(++tick,fn);return tick;},clearTimeout:id=>timers.delete(id)}});
 const root=new Node();let won=null;const handle=screen.mount(root,{onEnd:value=>{won=value;}});
 const nodes=()=>walk(root);function walk(n){return [n,...n.children.filter(x=>x instanceof Node).flatMap(walk)];}
 function flush(){let safety=30;while(timers.size&&safety--){const [id,fn]=timers.entries().next().value;timers.delete(id);fn();}assert.ok(safety>0);}
 return {Rift,root,handle,nodes,flush,timers,won:()=>won,helpClosed:()=>helpClosed};
}
test('guided lesson requires the actual card or life target and shows legal replies one at a time',()=>{
 const g=setup();
 for(let i=0;i<g.Rift.Battle.Lesson.steps.length;i++){
  if(i===9){const comparison=g.root.querySelector('.lesson-comparison');assert.ok(comparison);const text=comparison.children.map(n=>n.textContent).join(' ');assert.match(text,/Normal rules: Astrophysicat 4 vs Lobstorian 6 → Lobstorian wins/);assert.match(text,/Underdog: Astrophysicat 4 vs Lobstorian 6 → Astrophysicat wins/);}
  const target=g.root.querySelector('.lesson-target');assert.ok(target);
  assert.equal(target['aria-label']||target.textContent,g.Rift.Battle.Lesson.steps[i].label);
  const stepBefore=g.handle.state.step;target.onclick();
  if(g.Rift.Battle.Lesson.steps[i].actions.length>0){assert.equal(g.handle.state.step,stepBefore+1,'one move immediately, replies wait');const after=g.handle.state;target.onclick();assert.equal(g.handle.state,after,'double clicks do not repeat moves');}
  g.flush();
 }
 assert.equal(g.Rift.Battle.Engine.winner(g.handle.state),0);
 g.nodes().find(n=>n.textContent==='Finish lesson').onclick();assert.equal(g.won(),true);
});
test('leaving mid-animation cancels scripted replies and cannot complete the lesson',()=>{
 const g=setup();g.root.querySelector('.lesson-target').onclick();g.flush();g.root.querySelector('.lesson-target').onclick();assert.equal(g.timers.size,1);
 const state=g.handle.state;g.handle.destroy();g.flush();assert.equal(g.handle.state,state);assert.equal(g.won(),null);
});
test('teardown removes the rules modal',()=>{
 const g=setup();g.nodes().find(n=>n.textContent==='How to play').onclick();g.handle.destroy();assert.equal(g.helpClosed(),1);
});
