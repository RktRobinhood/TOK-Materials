import test from 'node:test';
import assert from 'node:assert/strict';
import {loadRift} from './harness.mjs';
const Rift=loadRift(['js/core/rift.js','js/core/state.js','js/core/world.js','data/creatures.js','data/axioms.js','js/battle/abilities.js','js/battle/engine.js']);
test('Mending restores one lost power point or ability and preserves unrelated fate changes',()=>{
 const s=Rift.State.freshState();s.items.mending=4;
 const c=Rift.State.makeCreature('lobstorian',{uid:'hurt',powerDelta:-2,injuries:['minus-one','no-ability'],scars:['scar'],warped:{ability:'lecture'},variant:{attack:0,health:0,trait:null}});s.creatures.push(c);
 assert.equal(Rift.World.mend(s,'hurt','minus-one'),true);assert.equal(c.powerDelta,-1);assert.ok(c.injuries.includes('minus-one'));assert.equal(s.items.mending,3);
 assert.equal(Rift.World.mend(s,'hurt','minus-one'),true);assert.equal(c.powerDelta,0);assert.ok(!c.injuries.includes('minus-one'));assert.equal(s.items.mending,2);
 assert.equal(Rift.World.mend(s,'hurt','no-ability'),true);assert.equal(c.injuries.length,0);assert.equal(s.items.mending,1);
 assert.equal(c.scars[0],'scar');assert.equal(c.warped.ability,'lecture');
 const b=Rift.Battle.Engine.createBattle({seed:'mended',players:[{team:[c]},{team:[]}],options:{shuffle:false,first:0}});
 assert.equal(b.cards.p0c0.attack,Rift.State.creatureStats(c).attack);assert.equal(b.cards.p0c0.attack,Rift.data.creatures.lobstorian.attack);assert.equal(b.cards.p0c0.ability,'lecture');
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
test('Mending on an old-scale injury always gives a visible +1 attack, or spends nothing',()=>{
 const s=Rift.State.freshState();s.items.mending=2;
 // Astrophysicat (attack 1): an old save said power 4 → 1, powerDelta −3, so attack shows 0.
 const cat=Rift.State.makeCreature('astrophysicat',{uid:'old',powerDelta:-3,injuries:['minus-one'],variant:{attack:0,health:0,trait:null}});s.creatures.push(cat);
 assert.equal(Rift.State.creatureStats(cat).attack,0);
 assert.equal(Rift.World.mend(s,'old','minus-one'),true);
 assert.equal(Rift.State.creatureStats(cat).attack,1,'+1 attack you can see');assert.equal(cat.powerDelta,0);assert.deepEqual(cat.injuries,[]);assert.equal(s.items.mending,1);
 // A gentle Astrophysicat has attack 0 anyway: the stale tag goes and nothing is spent.
 const gentle=Rift.State.makeCreature('astrophysicat',{uid:'gentle',powerDelta:-2,injuries:['minus-one'],variant:{attack:-1,health:0,trait:null}});s.creatures.push(gentle);
 assert.equal(Rift.World.mend(s,'gentle','minus-one'),false);
 assert.equal(s.items.mending,1);assert.equal(gentle.powerDelta,0);assert.deepEqual(gentle.injuries,[]);
 // Every mend that spends an item raises the shown attack by exactly 1.
 for(let d=-6;d<0;d++)for(const va of [-1,0,1])for(const taught of [null,'attack']){
  const st=Rift.State.freshState();st.items.mending=1;
  const x=Rift.State.makeCreature('zuckerborg',{uid:'z',powerDelta:d,injuries:['minus-one'],taught,variant:{attack:va,health:0,trait:null}});st.creatures.push(x);
  const before=Rift.State.creatureStats(x).attack;
  if(Rift.World.mend(st,'z','minus-one'))assert.equal(Rift.State.creatureStats(x).attack,before+1,JSON.stringify({d,va,taught}));
  else {assert.equal(st.items.mending,1);assert.equal(before,Rift.State.creatureStats(x).attack);}
 }
});
