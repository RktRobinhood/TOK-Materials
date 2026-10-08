import test from 'node:test';
import assert from 'node:assert/strict';
import {loadRift} from './harness.mjs';
import {loadWithDom} from './fake-dom.mjs';
const Rift=loadRift(['js/core/rift.js','js/puzzles/registry.js','js/puzzles/river-crossing.js']);
const p=Rift.Puzzles.get('river-crossing');

for(const d of [1,2,3])test('River crossing '+d+': every generated crossing is solvable by BFS; debugSolve passes',()=>{
 for(let seed=0;seed<60;seed++){
  const data=p.generate(Rift.makeRng('rc'+seed),d);
  assert.equal(data.cast.length,[0,3,4,5][d]);
  assert.equal(data.seats,d===1?1:2);
  assert.ok(data.rivals.length>=1);
  const found=p._search(data);
  assert.ok(found.plan,'solvable');assert.equal(found.plan.length,data.shortest);
  assert.equal(p.check(data,p.solve(data)).solved,true);
  if(d===3)assert.equal(data.toll,data.shortest);
  assert.equal(p.hints(data).length,3);
 }
});

test('River crossing: d1 is a 7-crossing chain whose middle is never the second creature; wrong plans fail',()=>{
 for(let seed=0;seed<40;seed++){const x=p.generate(Rift.makeRng('mid'+seed),1);const m=x.rivals[0].find(i=>x.rivals[1].includes(i));assert.notEqual(m,1);assert.equal(x.rivals.length,2);}
 const data=p.generate(Rift.makeRng('wrong'),1);assert.equal(data.shortest,7);
 const [a,b]=data.cast.map(x=>x.id);
 const mi=data.rivals[0].find(i=>data.rivals[1].includes(i));
 const middle=data.cast[mi].id, ends=data.cast.filter((_,i)=>i!==mi).map(x=>x.id);
 // Taking an end first leaves the middle with its other rival.
 const r=p.check(data,{trips:[[ends[0]]]});assert.equal(r.solved,false);assert.match(r.feedback,/fought/);
 assert.equal(p.check(data,{trips:[[middle]]}).solved,false,'not everyone across');
 assert.equal(p.check(data,{trips:[[a,b]]}).solved,false,'too many seats');
 const hard=p.generate(Rift.makeRng('toll'),3);
 const long=p.solve(hard).trips;long.push([],[]);
 assert.equal(p.check(hard,{trips:long}).solved,false,'over the toll');
});

test('River crossing: uses caught creatures, topped up from the fixed cast',()=>{
 const data=p.generate(Rift.makeRng('own'),2,{creatures:['muskrat','gargoyle']});
 const ids=data.cast.map(c=>c.id);
 assert.ok(ids.includes('muskrat')&&ids.includes('gargoyle'));assert.equal(new Set(ids).size,4);
});

test('River crossing: the mounted boat plays the plan by clicks',()=>{
 const g=loadWithDom(['js/core/rift.js','js/puzzles/registry.js','js/puzzles/river-crossing.js']);
 const R=g.Rift,def=R.Puzzles.get('river-crossing'),data=def.generate(R.makeRng('mount'),2);
 const sent=[];const box=g.document.createElement('div');
 def.mount(box,data,{submit:a=>{sent.push(a);return def.check(data,a);},sfx(){},say(){},rng:R.makeRng('ui'),difficulty:2,el:R.el});
 const name=id=>data.cast.find(c=>c.id===id).name;
 for(const trip of data.plan){
  for(const id of trip)box.querySelectorAll('.rc-token').find(t=>t.title===name(id)).click();
  box.querySelector('.rc-row').click();
 }
 assert.equal(sent.length,1);assert.equal(def.check(data,sent[0]).solved,true);
});
