import test from 'node:test';
import assert from 'node:assert/strict';
import {loadRift} from './harness.mjs';
const files=['js/core/rift.js','js/core/state.js','js/core/world.js','js/core/rumours.js','data/rumours.js','data/map.js','data/creatures.js','data/axioms.js'];

test('clues unlock fixed lore/legend/axiom rewards once without granting checked progress',()=>{
 const R=loadRift(files),s=R.State.freshState(),before={health:s.health,xp:s.xp,stats:JSON.stringify(s.stats)};
 assert.throws(()=>R.Rumours.redeem(s,'bad'));assert.equal(s.rumours.length,0);
 for(const entry of R.data.clues){
  assert.equal(R.Rumours.redeem(s,entry.code.toLowerCase()).fresh,true);const once=JSON.stringify(s);
  assert.equal(R.Rumours.redeem(s,entry.code).fresh,false);assert.equal(JSON.stringify(s),once);
 }
 assert.equal(s.rumours.length,3);assert.equal(s.flags['rumour:booleon'],true);assert.equal(s.axioms.filter(id=>id==='age-of-wonder').length,1);
 assert.equal(s.health,before.health);assert.equal(s.xp,before.xp);assert.equal(JSON.stringify(s.stats),before.stats);assert.equal(s.map.completed.length,0);
});

test('strategy board grows once per supported checked family and rejects arbitrary note ids',()=>{
 const R=loadRift(files),s=R.State.freshState();assert.equal(R.Rumours.notes(s).length,0);
 R.Rumours.recordWin(s,'__proto__');R.Rumours.recordWin(s,'blackbox');assert.equal(R.Rumours.notes(s).length,0);
 for(const id of Object.keys(R.data.strategyNotes)){R.Rumours.recordWin(s,id);R.Rumours.recordWin(s,id);}
 assert.equal(R.Rumours.notes(s).length,14);assert.equal(s.stats.puzzlesSolved,0);assert.equal(s.axioms.length,0);
});

test('clue configuration refers to real battle rewards and available rare spawn stations',()=>{
 const R=loadRift(files);
 for(const c of R.data.clues){
  if(c.axiom)assert.ok(R.data.axioms[c.axiom]);
  if(c.species){assert.equal(R.data.creatures[c.species].rarity,'legendary');assert.ok(Object.values(R.data.map.nodes).some(n=>(n.spawns||[]).includes(c.species)));}
 }
});
