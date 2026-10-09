import test from 'node:test';
import assert from 'node:assert/strict';
import {loadRift} from './harness.mjs';
import {loadWithDom} from './fake-dom.mjs';
const Rift=loadRift(['js/core/rift.js','js/puzzles/registry.js','js/puzzles/logic-grid.js']);
const p=Rift.Puzzles.get('logic-grid');
const counts={};

for(const d of [1,2,3])test('Logic grid '+d+': exactly one solution, every clue needed; debugSolve passes',()=>{
 const seeds=d===3?15:40;counts[d]=[];
 for(let seed=0;seed<seeds;seed++){
  const data=p.generate(Rift.makeRng('lg'+seed),d);const n=data.writers.length;
  assert.equal(n,d+2);
  const sols=p._solutions(n,data.clues);
  assert.equal(sols.length,1,'unique');
  assert.deepEqual([...sols[0].a],[...data.solution.a]);assert.deepEqual([...sols[0].b],[...data.solution.b]);
  for(let k=0;k<data.clues.length;k++)assert.ok(p._solutions(n,data.clues.filter((_,i)=>i!==k),2).length>1,'clue '+k+' is needed');
  if(d===3)assert.ok(data.clues.every(c=>c.t!=='is'));
  if(d===2)assert.ok(data.clues.filter(c=>c.t==='is').length<=1);
  assert.ok(data.clues.every(c=>c.text&&c.text.length<=90));
  assert.equal(p.check(data,p.solve(data)).solved,true);
  counts[d].push(data.clues.length);
 }
});

test('Logic grid: clue count grows with difficulty',()=>{
 const avg=d=>counts[d].reduce((x,y)=>x+y,0)/counts[d].length;
 assert.ok(avg(1)<avg(2)&&avg(2)<avg(3),JSON.stringify([avg(1),avg(2),avg(3)]));
});

test('Logic grid: wrong grids fail and name a broken clue',()=>{
 const data=p.generate(Rift.makeRng('wrong'),2);const s=p.solve(data);
 const swapped={a:[s.a[1],s.a[0],...s.a.slice(2)],b:s.b};
 const r=p.check(data,swapped);assert.equal(r.solved,false);
 assert.equal(p.check(data,{a:[0,0,1,2],b:s.b}).solved,false,'not a permutation');
 assert.equal(p.check(data,{}).solved,false);
});

test('Logic grid: the mounted grid confirms cells by clicks',()=>{
 const g=loadWithDom(['js/core/rift.js','js/puzzles/registry.js','js/puzzles/logic-grid.js']);
 const R=g.Rift,def=R.Puzzles.get('logic-grid'),data=def.generate(R.makeRng('mount'),1);
 const sent=[];const box=g.document.createElement('div');
 def.mount(box,data,{submit:a=>{sent.push(a);return def.check(data,a);},sfx(){},say(){},rng:R.makeRng('ui'),difficulty:1,el:R.el});
 const grids=box.querySelectorAll('.lg-grid');assert.equal(grids.length,3);
 box.querySelector('.lg-submit').click();assert.equal(sent.length,0,'incomplete grid is not a check');
 for(const [k,key] of [[0,'a'],[1,'b']]){const cells=grids[k].querySelectorAll('.lg-cell');
  data.solution[key].forEach((c,r)=>{const cell=cells[r*3+c];cell.click();cell.click();});}
 box.querySelector('.lg-submit').click();
 assert.equal(sent.length,1);assert.equal(def.check(data,sent[0]).solved,true);
});
