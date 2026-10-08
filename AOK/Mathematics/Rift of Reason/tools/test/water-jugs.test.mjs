import test from 'node:test';
import assert from 'node:assert/strict';
import {loadRift} from './harness.mjs';
const Rift=loadRift(['js/core/rift.js','js/puzzles/registry.js','js/puzzles/water-jugs.js']);
const p=Rift.Puzzles.get('water-jugs');

for(const d of [1,2,3])test('Water jugs '+d+': every generated puzzle is checked by BFS; debugSolve passes',()=>{
 for(let seed=0;seed<80;seed++){
  const data=p.generate(Rift.makeRng('wj'+seed),d);
  const found=p._search(data.caps,data.target);
  assert.equal(data.possible,d<3);
  assert.equal(!!found.path,data.possible);
  assert.ok(data.target>0&&data.target<Math.max(...data.caps));
  assert.equal(p.check(data,p.solve(data)).solved,true,'solve passes');
  assert.equal(p.hints(data).length,3);
  if(d===1)assert.ok(found.path.length>=3&&found.path.length<=6);
  if(d===2)assert.ok(found.path.length>=7&&found.path.length<=14);
  if(d===3){
   // Every reachable amount is a multiple of the gcd, and the target is not one.
   assert.ok(data.g>1&&data.target%data.g!==0);
   assert.ok(found.amounts.every(v=>v%data.g===0));
   assert.match(data.reasons[data.reasonCorrect],new RegExp('multiple of '+data.g));
   assert.equal(p.why(data).correct,data.reasonCorrect);
  }
 }
});

test('Water jugs: wrong submissions fail',()=>{
 const easy=p.generate(Rift.makeRng('wrong'),1);
 assert.equal(p.check(easy,{moves:[]}).solved,false);
 assert.equal(p.check(easy,{impossible:true,reason:0}).solved,false);
 assert.equal(p.check(easy,{moves:[['pour',0,0]]}).solved,false);
 assert.equal(p.check(easy,{moves:[['empty',0]]}).solved,false,'a move that changes nothing is refused');
 const hard=p.generate(Rift.makeRng('wrong'),3);
 const bad=(hard.reasonCorrect+1)%hard.reasons.length;
 const r=p.check(hard,{impossible:true,reason:bad});
 assert.equal(r.solved,false);assert.equal(r.partial,0.5);
 assert.equal(p.check(hard,{moves:[['fill',0]]}).solved,false);
});

test('Water jugs: the classic 3 and 5 make 4',()=>{
 const f=p._search([3,5],4);assert.equal(f.path.length,6);
 assert.equal(p._search([4,6],5).path,null);
});

test('Water jugs: the mounted ladles play the plan by clicks, and the proof panel submits',async()=>{
 const {loadWithDom}=await import('./fake-dom.mjs');
 for(const d of [2,3]){
  const g=loadWithDom(['js/core/rift.js','js/puzzles/registry.js','js/puzzles/water-jugs.js']);
  const R=g.Rift,def=R.Puzzles.get('water-jugs'),data=def.generate(R.makeRng('mount'),d);
  const sent=[];const box=g.document.createElement('div');
  def.mount(box,data,{submit:a=>{sent.push(a);return def.check(data,a);},sfx(){},say(){},rng:R.makeRng('ui'),difficulty:d,el:R.el});
  const cards=box.querySelectorAll('.wj-jug');assert.equal(cards.length,2);
  const btn=(root,t)=>root.querySelectorAll('button').find(b=>b.textContent===t);
  if(data.possible){
   for(const m of data.plan){const c=cards[m[1]];btn(c,m[0]==='fill'?'Fill':m[0]==='empty'?'Empty':'Pour into '+data.caps[m[2]]).click();}
   assert.equal(sent.length,1);assert.equal(def.check(data,sent[0]).solved,true);
  }else{
   btn(box,"It can't be done…").click();
   box.querySelectorAll('.wj-reason')[data.reasonCorrect].click();
   btn(box,'Declare it impossible').click();
   assert.equal(def.check(data,sent[0]).solved,true);
  }
 }
});
