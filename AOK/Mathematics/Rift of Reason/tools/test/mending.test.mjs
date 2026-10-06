import test from 'node:test';
import assert from 'node:assert/strict';
import {loadRift} from './harness.mjs';
const Rift=loadRift(['js/core/rift.js','js/core/state.js','js/core/world.js','data/creatures.js','data/axioms.js','js/battle/abilities.js','js/battle/engine.js']);
test('Mending restores one lost power point or ability and preserves unrelated fate changes',()=>{
 const s=Rift.State.freshState();s.items.mending=4;
 const c=Rift.State.makeCreature('astrophysicat',{uid:'hurt',powerDelta:-2,injuries:['minus-one','no-ability'],scars:['scar'],warped:{ability:'lecture'}});s.creatures.push(c);
 assert.equal(Rift.World.mend(s,'hurt','minus-one'),true);assert.equal(c.powerDelta,-1);assert.ok(c.injuries.includes('minus-one'));assert.equal(s.items.mending,3);
 assert.equal(Rift.World.mend(s,'hurt','minus-one'),true);assert.equal(c.powerDelta,0);assert.ok(!c.injuries.includes('minus-one'));assert.equal(s.items.mending,2);
 assert.equal(Rift.World.mend(s,'hurt','no-ability'),true);assert.equal(c.injuries.length,0);assert.equal(s.items.mending,1);
 assert.equal(c.scars[0],'scar');assert.equal(c.warped.ability,'lecture');
 const b=Rift.Battle.Engine.createBattle({seed:'mended',players:[{team:[c]},{team:[]}],options:{shuffle:false,first:0}});
 assert.equal(b.cards.p0c0.attack,Rift.State.creatureStats(c).attack);assert.equal(b.cards.p0c0.attack,Math.max(0,Rift.data.creatures.astrophysicat.attack+c.variant.attack));assert.equal(b.cards.p0c0.ability,'lecture');
});
test('Mending cannot spend on a healthy, absent or unowned injury, or when the item is empty',()=>{
 const s=Rift.State.freshState();const c=Rift.State.makeCreature('lobstorian',{uid:'mine',injuries:['no-ability']});s.creatures.push(c);s.items.mending=1;
 const before=JSON.stringify(s);
 for(const [uid,injury] of [['missing','no-ability'],['mine','minus-one'],['mine','warp'],['mine','scar']])assert.equal(Rift.World.mend(s,uid,injury),false);
 assert.equal(JSON.stringify(s),before);s.items.mending=0;assert.equal(Rift.World.mend(s,'mine','no-ability'),false);assert.ok(c.injuries.includes('no-ability'));
});
test('restoring an injured trophy preserves an imported positive power boost',()=>{
 const s=Rift.State.freshState();s.items.mending=1;const c=Rift.State.makeCreature('astrophysicat',{uid:'trophy',powerDelta:1,injuries:['minus-one'],trophyOf:'Classmate'});s.creatures.push(c);
 assert.equal(Rift.World.mend(s,'trophy','minus-one'),true);assert.equal(c.powerDelta,2);assert.equal(c.injuries.length,0);assert.equal(c.trophyOf,'Classmate');
});
