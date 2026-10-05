import test from 'node:test';
import assert from 'node:assert/strict';
import {loadRift} from './harness.mjs';
import {Node} from './dom-adapter.mjs';
function game(){
 const Rift=loadRift(['js/core/rift.js','js/core/state.js','js/core/world.js','data/creatures.js','data/items.js','data/map.js','data/axioms.js','data/script/lesson1.js','data/script/lesson2.js','data/script/lesson3.js','data/script/lesson4.js','js/battle/abilities.js','js/battle/engine.js','js/battle/ai.js','js/battle/lesson.js','js/ui/battles.js']);
 const state=Rift.State.freshState();state.avatar={type:'owlet',nickname:'Test'};
 Rift.State.get=()=>state;Rift.State.update=fn=>fn(state);Rift.el=(...args)=>new Node(...args);
 const routes=[],modals=[];
 Rift.Assets={img:()=>new Node()};Rift.Dialogue={has:()=>false};
 Rift.UI={toast:()=>{},modal:(title,body,buttons)=>{const m={title,body,buttons};modals.push(m);return m;}};
 Rift.Router={go:(screen,params)=>routes.push({screen,params}),replace:screen=>routes.push({screen})};
 Rift.Battle.Ante={applyToSave(){throw new Error('Safe battle must not settle stakes');}};
 return {Rift,state,routes,modals};
}
test('empty collection can learn, practice and win the real safe story match',()=>{
 const g=game(),{Rift}=g,E=Rift.Battle.Engine;
 Rift.Battles.learn('collection');assert.equal(g.routes.at(-1).screen,'battle-lesson');
 g.routes.at(-1).params.onEnd(true);assert.equal(g.state.flags['card-lesson-won'],true);
 Rift.Battles.practice();assert.equal(g.routes.at(-1).params.mode,'practice');assert.equal(g.routes.at(-1).params.player.team.length,10);
 Rift.Battles.story();const p=g.routes.at(-1).params;
 assert.equal(p.mode,'practice');assert.ok(p.player.team.every(c=>c.loaner));
 const start=E.createBattle({seed:p.seed,players:[{name:'You',team:p.player.team},{name:p.opponent.name,team:p.opponent.team}],axiomDeck:p.axiomDeck,options:{...p.battleOptions,mode:p.mode}});
 const end=Rift.Battle.AI.playOut(start,['hard',p.opponent.ai]);assert.equal(E.winner(end),0);
 const before=JSON.stringify({creatures:g.state.creatures,items:g.state.items});
 p.onEnd({mode:'practice',outcome:'lost'});assert.equal(g.state.flags['story-battle-won'],undefined);assert.equal(g.modals.at(-1).title,'Try Syllo again');
 p.onEnd({mode:'practice',outcome:'won'});assert.equal(g.state.flags['story-battle-won'],true);assert.equal(g.modals.at(-1).title,'The Road is open');
 assert.equal(JSON.stringify({creatures:g.state.creatures,items:g.state.items}),before);
});
test('story gate requires victory and a side challenge never completes its puzzle',()=>{
 const g=game();assert.match(g.Rift.World.lockReason(g.state,'fair-rift'),/Syllo/);
 g.state.flags['story-battle-won']=true;assert.match(g.Rift.World.lockReason(g.state,'fair-rift'),/Win 2/);
 g.state.map.completed.push('stall-pattern','stall-witness');assert.equal(g.Rift.World.lockReason(g.state,'fair-rift'),null);
 g.Rift.Battle.Ante.applyToSave=()=>{};
 g.Rift.Battles.trainer('stall-gallery','easy');assert.equal(g.routes.length,0,'unfinished station cannot be challenged directly');
 g.state.map.completed.push('stall-gallery');const completedBefore=JSON.stringify(g.state.map.completed);
 g.Rift.Battles.trainer('stall-gallery','easy');const p=g.routes.at(-1).params;
 assert.equal(p.opponent.ai,'easy');assert.ok(p.player.team.every(c=>c.loaner));
 p.onEnd({mode:'trainer',outcome:'won'});assert.equal(JSON.stringify(g.state.map.completed),completedBefore);
});
test('every map challenger has a portrait, short introduction and complete themed team',()=>{
 const {Rift}=game();
 for(const [id,t] of Object.entries(Rift.data.trainers)){
  assert.ok(Rift.data.speakers[t.speaker],id);assert.ok(t.intro&&t.intro.length<180,id);
  assert.equal(t.team.length,10);assert.ok(t.team.every(sp=>Rift.data.creatures[sp]),id);
 }
});
test('rest keeper challenges require their associated logic puzzle, not a rest visit',()=>{
 const g=game();
 for(const id of ['b-garden','t-cafe']){
  const n=g.Rift.World.node(id);g.state.map.completed.push(id);
  assert.equal(g.Rift.Battles.canChallenge(id),false);
  const prerequisite=g.Rift.World.node(n.challengeAfter);assert.ok(prerequisite.puzzles.length);
  g.state.map.completed.push(n.challengeAfter);assert.equal(g.Rift.Battles.canChallenge(id),true);
 }
});
