import test from 'node:test';
import assert from 'node:assert/strict';
import {loadRift} from './harness.mjs';
const Rift=loadRift(['js/core/rift.js','js/core/state.js','js/core/world.js','data/creatures.js','data/items.js','data/map.js']);
const node={id:'test',type:'puzzle',spawns:['astrophysicat','lobstorian','swiftlet','godelix']};
const state=()=>{const s=Rift.State.freshState();s.seed=12;return s;};
test('arrival rolls only the puzzle, captures the lure, and spends one visit',()=>{
 const s=state();const id='standing-stone';s.lures[id]=1;const visit=Rift.World.rollVisit(s,id);
 assert.equal(visit.lured,true);assert.equal(s.lures[id],0);assert.equal(s.map.visitCount[id],1);
 assert.ok(!('obstacle' in visit));assert.ok(visit.puzzle);
});
test('normal loot: seeded no-creature rate and rarity improve with stars',()=>{
 const s=state();const counts=stars=>{let none=0,rare=0,appeared=0;for(let seed=0;seed<10000;seed++){
  const result=Rift.World.rollLoot(s,node,Rift.makeRng(seed),{stars});
  if(!result.species)none++;else {appeared++;if(Rift.data.creatures[result.species].rarity==='rare')rare++;}
 }return {none:none/10000,rare:rare/appeared};};
 const a=counts(1),b=counts(3);assert.ok(Math.abs(a.none-.5)<.02);assert.ok(Math.abs(b.none-.35)<.02);assert.ok(b.rare>a.rare);
 const boss={...node,type:'boss'};assert.equal(Rift.World.rollLoot(s,boss,Rift.makeRng(0),{stars:3}).chance,.9);
});
test('rumour required for legendary; last lure visit still boosts rare weights',()=>{
 const s=state();assert.ok(!('godelix' in Rift.World.spawnWeights(s,node,{stars:3,lured:true})));
 s.flags['rumour:godelix']=true;
 const plain=Rift.World.spawnWeights(s,node,{stars:1});const lure=Rift.World.spawnWeights(s,node,{stars:1,lured:true});
 assert.equal(lure.swiftlet,plain.swiftlet*2);assert.equal(lure.godelix,plain.godelix*2);
 assert.equal(lure.astrophysicat,plain.astrophysicat);
});
test('loot is deterministic, empty tables yield none and roll does not consume lure again',()=>{
 const s=state();s.lures.test=2;const run=()=>Rift.World.rollLoot(s,node,Rift.makeRng(42),{stars:3,lured:true});assert.deepEqual(run(),run());assert.equal(s.lures.test,2);
 assert.equal(Rift.World.rollLoot(s,{spawns:[]},Rift.makeRng(1),{stars:3}).species,null);
});
test('catch stars and lure improve the same displayed/rolled odds, never guarantee success',()=>{
 const s=state();const base=Rift.World.catchOdds(s,'swiftlet','charm');const opts={stars:3,lured:true};
 assert.equal(Rift.World.catchOdds(s,'swiftlet','charm',opts),Math.round((base+.11)*100)/100);
 assert.equal(Rift.World.rollCatch(s,'swiftlet','charm',{next:()=>.999},opts).caught,false);
 assert.equal(Rift.World.rollCatch(s,'swiftlet','charm',{next:()=>0},opts).p,Rift.World.catchOdds(s,'swiftlet','charm',opts));
});
