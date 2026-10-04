import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {loadRift} from './harness.mjs';
import {Node} from './dom-adapter.mjs';
function setup(){
 const Rift=loadRift(['js/core/rift.js','data/creatures.js','data/axioms.js','js/battle/abilities.js','js/battle/engine.js','js/battle/lesson.js']);
 let screen,tourClosed=0,helpClosed=0;const tours=[];
 Rift.el=(...args)=>new Node(...args);Rift.Assets={img:()=>new Node()};Rift.Screens={register:(_,def)=>{screen=def;}};
 Rift.Tutorial={play:(container,steps)=>{assert.ok(container.querySelector(steps[0].highlight));tours.push(steps[0]);return {close(){tourClosed++;}};}};
 Rift.Battles={rules:onClose=>({close(){helpClosed++;onClose();}})};
 vm.runInNewContext(fs.readFileSync(new URL('../../js/screens/battle-lesson.js',import.meta.url),'utf8'),{window:{Rift}});
 const root=new Node();let won=null;const handle=screen.mount(root,{onEnd:value=>{won=value;}});
 const nodes=()=>walk(root);function walk(n){return [n,...n.children.filter(x=>x instanceof Node).flatMap(walk)];}
 return {Rift,root,handle,tours,nodes,won:()=>won,tourClosed:()=>tourClosed,helpClosed:()=>helpClosed};
}
test('mounted lesson renders actual fight comparisons and finishes through all eight prompts',()=>{
 const g=setup();
 for(let i=0;i<8;i++){
  assert.equal(g.tours.at(-1).progress,(i+1)+'/8');
  if(i===4){const comparison=g.root.querySelector('.lesson-comparison');assert.ok(comparison);const text=comparison.children.map(n=>n.textContent).join(' ');assert.match(text,/Normal rules: Astrophysicat 6 vs Speedcheeta 4 → Astrophysicat wins/);assert.match(text,/Underdog: Astrophysicat 6 vs Speedcheeta 4 → Speedcheeta wins/);}
  g.nodes().find(n=>n.textContent===g.Rift.Battle.Lesson.steps[i].label).onclick();
 }
 assert.equal(g.Rift.Battle.Engine.winner(g.handle.state),0);
 g.nodes().find(n=>n.textContent==='Finish lesson').onclick();assert.equal(g.won(),true);
});
test('rules replace the active tour and teardown removes the open rules modal',()=>{
 const g=setup();g.nodes().find(n=>n.textContent==='How to play').onclick();
 assert.equal(g.tourClosed(),1);g.handle.destroy();assert.equal(g.helpClosed(),1);
});
