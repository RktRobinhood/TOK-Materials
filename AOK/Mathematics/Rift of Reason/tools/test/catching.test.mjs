import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadRift} from './harness.mjs';
const Rift=loadRift(['js/core/rift.js','js/core/state.js','js/core/world.js','data/creatures.js','data/items.js','js/core/catching.js']);
test('10,000 catches per rarity match displayed odds within three percentage points',()=>{
 const state=Rift.State.freshState();state.avatar={type:'fox'};
 for(const rarity of ['common','uncommon','rare','legendary']){
  const species=Object.keys(Rift.data.creatures).find(x=>Rift.data.creatures[x].rarity===rarity);
  for(const item of ['charm','greatcharm'])for(const [skillBonus,skillFailed] of [[0,false],[.15,false],[0,true]]){
   const opts={stars:3,lured:true,skillBonus,skillFailed};const p=Rift.World.catchOdds(state,species,item,opts);
   let caught=0;for(let seed=0;seed<10000;seed++){const r=Rift.World.rollCatch(state,species,item,Rift.makeRng(seed),opts);assert.equal(r.p,p);caught+=r.caught?1:0;}
   assert.ok(Math.abs(caught/10000-p)<.03,rarity+' '+item+' '+skillBonus);
   assert.ok(p>=.05&&p<=.95);
  }
 }
});
test('throw: a timed centred click improves odds, miss keeps only a small chance',()=>{
 const cfg=Rift.Catching.config('charm','common',false);assert.ok(cfg.seconds<30);
 assert.equal(Rift.Catching.throwBonus(.2,true),.15);assert.equal(Rift.Catching.throwBonus(.8,true),.05);assert.equal(Rift.Catching.throwBonus(.2,false),0);
 const state=Rift.State.freshState();const base=Rift.World.catchOdds(state,'astrophysicat','charm');
 assert.equal(Rift.World.catchOdds(state,'astrophysicat','charm',{skillFailed:true}),Math.round(base*.25*100)/100);
 const great=Rift.Catching.config('greatcharm','legendary',true);assert.ok(great.seconds>cfg.seconds&&great.seconds<30);assert.ok(great.ring>cfg.ring);
});
test('box: only free cells can be charmed; creature chooses a neighbour away from nearest charm',()=>{
 const b=Rift.Catching.boxStart(12);const original=JSON.stringify(b);const c=b.creature;
 assert.equal(Rift.Catching.boxStep(b,c,false).valid,false);assert.equal(JSON.stringify(b),original);
 const step=Rift.Catching.boxStep(b,c-1,false);assert.equal(step.valid,true);assert.ok(step.board.charms.includes(c-1));assert.ok(!step.board.charms.includes(step.board.creature));assert.equal(JSON.stringify(b),original);
 const pos=step.board.creature;const x=pos%6,y=Math.floor(pos/6);assert.equal(Math.abs(x-c%6)+Math.abs(y-Math.floor(c/6)),1);
});
test('box: surrounding the creature traps it; lure pauses alternate moves',()=>{
 const b={creature:0,charms:[1],turn:0,order:[0,1,2,3]};const step=Rift.Catching.boxStep(b,6,false);assert.equal(step.trapped,true);
 const lure=Rift.Catching.boxStep(Rift.Catching.boxStart(4),0,true);assert.equal(lure.board.creature,14);
});

test('miss is one quarter of the displayed base, even when item and avatar bonuses hit the cap',()=>{
 const state=Rift.State.freshState();state.avatar={type:'fox'};
 for(const species of Object.keys(Rift.data.creatures))for(const item of ['charm','greatcharm']){
  const opts={stars:3,lured:true};const base=Rift.World.catchOdds(state,species,item,opts);
  assert.equal(Rift.World.catchOdds(state,species,item,{...opts,skillFailed:true}),Math.max(.05,Math.round(base*.25*100)/100));
 }
});

test('all movement orders can be trapped within the hardest five-placement budget, with or without lure',()=>{
 const paths=JSON.parse(fs.readFileSync(new URL('./fixtures/catch-box-paths.json',import.meta.url),'utf8'));
 for(const [kind,entries] of Object.entries(paths)){
  if(!Array.isArray(entries))continue;
  assert.equal(entries.length,24);
  for(const entry of entries){
   let board={creature:14,charms:[],turn:0,order:entry.order};let trapped=false;
   for(const cell of entry.path){const step=Rift.Catching.boxStep(board,cell,kind==='lured');assert.equal(step.valid,true);board=step.board;trapped=step.trapped;}
   assert.equal(trapped,true);assert.ok(entry.path.length<=5);
  }
 }
});
