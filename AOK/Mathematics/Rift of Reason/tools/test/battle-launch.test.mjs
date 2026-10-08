import test from 'node:test';
import assert from 'node:assert/strict';
import {loadRift} from './harness.mjs';
import {Node} from './dom-adapter.mjs';
function game(){
 const Rift=loadRift(['js/core/rift.js','js/core/state.js','js/core/world.js','data/creatures.js','data/items.js','data/map.js','data/decks.js','data/axioms.js','data/script/lesson1.js','data/script/lesson2.js','data/script/lesson3.js','data/script/lesson4.js','js/battle/abilities.js','js/battle/engine.js','js/battle/ai.js','js/battle/lesson.js','js/ui/battles.js']);
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
 g.routes.at(-1).params.onEnd(true);assert.equal(g.state.flags['card-lesson-won'],true);assert.equal(g.state.flags['card-rules-version'],3);
 Rift.Battles.practice();assert.equal(g.routes.at(-1).params.mode,'practice');assert.equal(g.routes.at(-1).params.player.team.length,10);
 Rift.Battles.story();const p=g.routes.at(-1).params;assert.equal(p.story,true,'the end screen can say Story challenge');
 assert.equal(p.mode,'practice');assert.ok(p.player.team.every(c=>c.loaner));
 const start=E.createBattle({seed:p.seed,players:[{name:'You',team:p.player.team},{name:p.opponent.name,team:p.opponent.team}],axiomDeck:p.axiomDeck,options:{...p.battleOptions,mode:p.mode}});
 const end=Rift.Battle.AI.playOut(start,['hard',p.opponent.ai]);assert.equal(E.winner(end),0);
 const before=JSON.stringify({creatures:g.state.creatures,items:g.state.items});
 p.onEnd({mode:'practice',outcome:'lost'});assert.equal(g.state.flags['story-battle-won'],undefined);assert.equal(g.modals.at(-1).title,'Try Syllo again');
 p.onEnd({mode:'practice',outcome:'won'});assert.equal(g.state.flags['story-battle-won'],true);assert.equal(g.modals.at(-1).title,'The Road is open');
 assert.equal(JSON.stringify({creatures:g.state.creatures,items:g.state.items}),before);
});
test('returning learners are offered the changed rules once without spending items',()=>{
 const g=game();g.state.flags['card-lesson-won']=true;const before=JSON.stringify(g.state.items);
 g.Rift.Battles.practice();assert.equal(g.routes.length,0);assert.equal(g.modals.at(-1).title,'The card rules have changed');
 g.modals.at(-1).buttons.find(b=>b.label==='Play the new rules').onclick();assert.equal(g.state.flags['card-rules-seen'],3);assert.equal(g.routes.at(-1).params.mode,'practice');assert.equal(JSON.stringify(g.state.items),before);
 g.Rift.Battles.practice();assert.equal(g.modals.length,1);
});
test('story gate requires victory and a side challenge never completes its puzzle',()=>{
 const g=game();assert.match(g.Rift.World.lockReason(g.state,'fair-rift'),/Syllo/);
 g.state.flags['story-battle-won']=true;assert.match(g.Rift.World.lockReason(g.state,'fair-rift'),/Win 2/);
 g.state.map.completed.push('stall-pattern','stall-witness');assert.equal(g.Rift.World.lockReason(g.state,'fair-rift'),null);
 g.Rift.Battle.Ante.applyToSave=()=>{};
 g.Rift.Battles.trainer('stall-gallery','easy');assert.equal(g.routes.length,0,'unfinished station cannot be challenged directly');
 g.state.map.completed.push('stall-gallery');const completedBefore=JSON.stringify(g.state.map.completed);
 g.Rift.Battles.trainer('stall-gallery','easy');
 // A fresh save has Catch Charms and a Tonic (battle jobs), so "Bring anything?" comes first.
 assert.equal(g.modals.at(-1).title,'Bring anything?');g.modals.at(-1).buttons[0].onclick();const p=g.routes.at(-1).params;
 assert.equal(p.opponent.ai,'normal','the old name easy means Normal');assert.ok(p.player.team.every(c=>c.loaner));
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
test('How to play lists the keywords and the colour wheel hint',()=>{
 const g=game();g.Rift.Battles.rules();const m=g.modals.at(-1);
 const text=n=>typeof n==='string'?n:(n.textContent||'')+(n.children||[]).map(text).join(' ');
 const all=text(m.body);
 // A compact visual sheet: the four steps of a turn, one row per idea, then a Keywords grid.
 for(const step of ['1 · Draw','2 · Play','3 · Attack','4 · End turn'])assert.ok(all.includes(step),step);
 assert.match(all,/Up to 2 cards/,'the 2-play limit is part of the Play step');
 assert.match(all,/Fate moves 1 step/);
 const keys=[];const walk=n=>{if(!n||typeof n==='string')return;if(String(n.className).split(' ').includes('htp-key'))keys.push(text(n));(n.children||[]).forEach(walk);};walk(m.body);
 const names=['Guard','Swift','Shield','Elusive','Entrance','Last Word','Activate','Spark'];
 assert.equal(keys.length,names.length,'one tile per keyword');
 names.forEach((k,i)=>assert.match(keys[i],new RegExp(k+'\\s+\\S'),k+' has a short explanation'));
 assert.match(all,/Colour wheel:\s+\+1 attack against the colour you beat/);
 assert.ok(!/fate roll/i.test(all));
});
test('leaving a practice or story match counts nothing and goes back',()=>{
 const g=game(),{Rift}=g;const stats=JSON.stringify(g.state.stats);
 Rift.Battles.practice();const pr=g.routes.at(-1).params;pr.onEnd({mode:'practice',outcome:'left'});
 assert.equal(g.routes.at(-1).screen,'collection');assert.equal(JSON.stringify(g.state.stats),stats);
 Rift.Battles.story();const p=g.routes.at(-1).params;const modals=g.modals.length;
 p.onEnd({mode:'practice',outcome:'left'});
 assert.equal(g.routes.at(-1).screen,'map');assert.equal(g.modals.length,modals,'no "Try again" modal');
 assert.equal(g.state.flags['story-battle-won'],undefined);assert.equal(JSON.stringify(g.state.stats),stats);
});
test('map trainers play at their AI level: Normal trainers, a Competent mini-boss, Expert bosses with a built deck',()=>{
 const g=game(),{Rift}=g;
 const levels={};
 for(const [id,t] of Object.entries(Rift.data.trainers)){
  const side=Rift.Battles.trainerSide(id);levels[id]=side.ai;
  assert.ok(['normal','competent','expert'].includes(side.ai),id+' plays at '+side.ai);
  if(side.ai==='expert'){
   const deck=Rift.data.decks[t.deck];assert.ok(deck,id+' has a built deck');assert.equal(side.deck,t.deck);
   assert.deepEqual(side.team.map(c=>c.species),deck.creatures);assert.deepEqual(side.tactics,deck.tactics);
   assert.equal(side.team.length+side.tactics.length,20);
  }else{assert.deepEqual(side.team.map(c=>c.species),t.team,id);assert.equal(side.deck,undefined);}
 }
 assert.deepEqual(levels,{syllo:'normal',baker:'normal',pip:'normal','card-sharp':'competent',constable:'expert',fin:'expert',feed:'expert'});
 // Old names still work, and only Expert uses the built deck.
 const hard=Rift.Battles.trainerSide('feed','hard');assert.equal(hard.ai,'competent');assert.deepEqual(hard.team.map(c=>c.species),Rift.data.trainers.feed.team);
 assert.equal(Rift.Battles.trainerSide('syllo','easy').ai,'normal');
});
test('a boss challenge shows its level and launches Expert with the built deck',()=>{
 const g=game(),{Rift}=g;
 Rift.Battles.offer('k-bridge');const m=g.modals.at(-1);
 const labels=m.buttons.map(b=>b.label);
 assert.ok(labels.includes('Challenge · Expert'),labels.join(', '));
 assert.ok(!labels.some(l=>/Easy|Hard/.test(l)),'no Easy or Hard buttons: '+labels.join(', '));
 m.buttons.find(b=>b.label==='Challenge · Expert').onclick();
 if(g.modals.at(-1).title==='Bring anything?')g.modals.at(-1).buttons[0].onclick();
 const p=g.routes.at(-1).params;assert.equal(p.mode,'trainer');assert.equal(p.opponent.ai,'expert');
 assert.deepEqual(p.opponent.team.map(c=>c.species),Rift.data.decks.feed.creatures);
 assert.deepEqual(p.opponent.tactics,Rift.data.decks.feed.tactics);
 Rift.Battles.practice();assert.equal(g.routes.at(-1).params.opponent.ai,'normal');
 Rift.Battles.story();const st=g.routes.at(-1).params.opponent;assert.equal(st.ai,'normal');assert.equal(st.hearts,8);
});
test('a trainer away on a side story cannot be challenged; the card school still offers Learn',()=>{
 const g=game();g.state.map.completed.push('stall-gallery');
 assert.equal(g.Rift.Battles.canChallenge('stall-gallery'),true);assert.equal(g.Rift.Battles.canChallenge('fair-gate'),true);
 g.state.flags['syllo-away']=true;
 assert.equal(g.Rift.Battles.canChallenge('stall-gallery'),false,'Syllo is away after his recruits');
 assert.equal(g.Rift.Battles.canChallenge('fair-gate'),false);
 g.Rift.Battles.offer('fair-gate');const m=g.modals.at(-1);
 assert.equal(m.title,'Card school');assert.equal(m.buttons.map(b=>b.label).join(' | '),'Later | Learn the card game');
 g.state.flags['finale-open']=true;assert.equal(g.Rift.Battles.canChallenge('stall-gallery'),true,'home on the restored Fair');
});
