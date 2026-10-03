import test from 'node:test';
import assert from 'node:assert/strict';
import {loadRift} from './harness.mjs';
const Rift=loadRift(['js/core/rift.js','js/core/world.js','js/core/state.js','data/items.js','data/creatures.js']);
for(const d of [1,2,3]) test('difficulty '+d+': free wrong checks then one heart each',()=>{
 const a=Rift.World.attempts(d,{type:'owlet'}); const free=d===1?3:2;
 assert.equal(a.free,free);
 for(let i=0;i<free;i++) assert.equal(Rift.World.recordWrong(a),0);
 assert.equal(Rift.World.recordWrong(a),1);assert.equal(Rift.World.recordWrong(a),1);
 assert.equal(a.wrong,free+2);
});
test('Frogling adds one free check; a new stage gets a fresh budget',()=>{
 const a=Rift.World.attempts(3,{type:'frogling'});assert.equal(a.free,3);
 for(let i=0;i<3;i++)assert.equal(Rift.World.recordWrong(a),0);
 assert.equal(Rift.World.recordWrong(a),1);
 assert.equal(Rift.World.attempts(3,{type:'frogling'}).wrong,0);
});
test('heart costs include scars and stars reward an unassisted clean solve',()=>{
 assert.equal(Rift.World.hintCost({scars:[]}),1);
 assert.equal(Rift.World.hintCost({scars:['shaky-hand']}),2);
 assert.equal(Rift.World.solveStars(0,0),3);
 assert.equal(Rift.World.solveStars(1,0),2);
 assert.equal(Rift.World.solveStars(0,2),2);
 assert.equal(Rift.World.solveStars(0,3),1);
 assert.equal(Rift.World.solveStars(2,0),2);
 assert.equal(Rift.World.solveStars(3,0),1);
});

test('stars increase XP and never change item chances',()=>{
 const state=Rift.State.freshState();
 const r=stars=>Rift.World.rewards(state,{type:'puzzle'},Rift.makeRng(12),{stars});
 assert.equal(r(3).xp-r(1).xp,10);assert.equal(r(2).xp-r(1).xp,5);
 assert.deepEqual(r(3).items,r(1).items);
});
