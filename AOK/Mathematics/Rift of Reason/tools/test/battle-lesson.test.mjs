import test from 'node:test';
import assert from 'node:assert/strict';
import {loadRift} from './harness.mjs';
const Rift = loadRift(['js/core/rift.js','data/creatures.js','data/axioms.js','js/battle/abilities.js','js/battle/engine.js','js/battle/lesson.js']);
const E=Rift.Battle.Engine, L=Rift.Battle.Lesson;
test('following every teaching prompt makes legal moves and wins with fixed hands',()=>{
 let state=L.create();
 assert.equal(state.players[0].lives,1); assert.equal(state.players[0].steals,0);
 for(let i=0;i<L.steps.length;i++) {
  const before=JSON.stringify(state);
  for(const action of L.steps[i].actions){
   assert.ok(E.legalActions(state).some(a=>Object.entries(action).every(([k,v])=>a[k]===v)), 'step '+i+' '+JSON.stringify(action));
   state=E.applyAction(state,action);
  }
  const second=L.advance(JSON.parse(before),i);
  assert.equal(JSON.stringify(state),JSON.stringify(second));
 }
 assert.equal(E.winner(state),0);assert.equal(state.players[0].lives,0);assert.equal(state.options.mode,'practice');
});
test('same cards reverse their result under Underdog',()=>{
 let s=L.create();for(let i=0;i<=9;i++)s=L.advance(s,i);
 const changed=E.fightOutcome(s,'p0c0','p1c3');const normal=E.fightOutcome({...s,axioms:{...s.axioms,active:{},current:null}},'p0c0','p1c3');
 assert.equal(changed.attackerDefeated,false);assert.equal(normal.attackerDefeated,true);assert.equal(JSON.stringify(L.create()),JSON.stringify(L.create()));
});
