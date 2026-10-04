import test from 'node:test';
import assert from 'node:assert/strict';
import {loadRift} from './harness.mjs';
const Rift = loadRift(['js/core/rift.js','data/creatures.js','data/axioms.js','js/battle/abilities.js','js/battle/engine.js','js/battle/lesson.js']);
const E=Rift.Battle.Engine, L=Rift.Battle.Lesson;
test('following every teaching prompt makes legal moves and wins with fixed hands',()=>{
 let state=L.create();
 assert.equal(state.players[0].lives,3); assert.equal(state.players[0].steals,2);
 for(let i=0;i<L.steps.length;i++) {
  const before=JSON.stringify(state);
  for(const action of L.steps[i].actions){
   assert.ok(E.legalActions(state).some(a=>Object.entries(action).every(([k,v])=>a[k]===v)), 'step '+i+' '+JSON.stringify(action));
   state=E.applyAction(state,action);
  }
  const second=L.advance(JSON.parse(before),i);
  assert.equal(JSON.stringify(state),JSON.stringify(second));
  if(i===3){assert.equal(state.axioms.current,'underdog');assert.equal(state.players[0].steals,1);assert.ok(state.players[0].board.includes('p1c1'));}
  if(i===5){assert.equal(state.phase,'block');assert.equal(state.players[1].lives,1);}
 }
 assert.equal(E.winner(state),0);assert.equal(state.players[0].lives,2);assert.equal(state.options.mode,'practice');
});
test('the same pair of cards has a different winner under the changed axiom',()=>{
 let s=L.create();for(let i=0;i<4;i++)s=L.advance(s,i);
 assert.equal(E.power(s,'p0c1','p1c2'),6);assert.equal(E.power(s,'p1c2','p0c1'),4);
 const changed=E.fightOutcome(s,'p0c1','p1c2');
 const ordinary=E.fightOutcome({...s,axioms:{...s.axioms,current:'empty-set'}},'p0c1','p1c2');
 assert.equal(changed.attackerDefeated,true);assert.equal(changed.blockerDefeated,false);
 assert.equal(ordinary.attackerDefeated,false);assert.equal(ordinary.blockerDefeated,true);
 assert.equal(JSON.stringify(L.create()),JSON.stringify(L.create()));
});
