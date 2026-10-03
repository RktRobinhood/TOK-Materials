import test from 'node:test';
import assert from 'node:assert/strict';
import {loadRift} from './harness.mjs';
const Rift=loadRift(['js/core/rift.js','js/puzzles/registry.js','js/puzzles/witness.js']);
const p=Rift.Puzzles.get('witness');
for(const d of [1,2,3])test('Witness '+d+': wrong claims identified with evidence reasons',()=>{
 for(let seed=0;seed<30;seed++){
  const data=p.generate(Rift.makeRng(seed),d);const correct=p.solve(data);
  assert.equal(p.check(data,correct).solved,true);
  const wrong=data.claims[0];correct[wrong.id]=wrong.a==='T'?'F':'T';
  const r=p.check(data,correct);assert.equal(r.solved,false);
  assert.deepEqual([...r.wrongIds],[wrong.id]);
  assert.equal(r.reasons[0].text,wrong.why);
  assert.ok(!r.feedback.includes(' → '));
  assert.equal(new Set(data.claims.map(c=>c.a)).size,3);
 }
});
