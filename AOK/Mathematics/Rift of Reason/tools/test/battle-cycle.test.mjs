import test from 'node:test';
import assert from 'node:assert/strict';
import {loadRift} from './harness.mjs';
const R=loadRift(['js/core/rift.js','data/creatures.js','data/axioms.js','js/battle/abilities.js','js/battle/engine.js','js/battle/ai.js']);
const E=R.Battle.Engine;
const team=Array.from({length:10},(_,i)=>({uid:'u'+i,species:i===0?'astrophysicat':'zuckerborg'}));
const create=()=>E.createBattle({seed:'cycle',players:[{team},{team}],axiomDeck:['underdog','two-actions','reverse-hearts','mercy'],options:{first:0,shuffle:false,shuffleAxioms:false,timeline:false}});
const act=(s,a)=>E.applyAction(s,{player:E.decider(s),...a});
test('playing spends energy and an action but keeps the turn until End turn',()=>{
 let s=create(); assert.equal(s.players[0].energy,1);
 s=act(s,{type:'play',cid:'p0c0'});
 assert.equal(s.active,0);assert.equal(s.players[0].energy,0);assert.equal(s.actionsUsed,1);
 assert.ok(!E.legalActions(s).some(a=>a.type==='attack'));
 s=act(s,{type:'end'});assert.equal(s.active,1);assert.equal(s.players[1].energy,1);
 s=act(s,{type:'end'});assert.equal(s.players[0].energy,2);assert.equal(s.actionsUsed,0);
});
test('activating pays energy, exhausts the creature, and does not hand over the turn',()=>{
 let s=act(create(),{type:'play',cid:'p0c0'});s=act(act(s,{type:'end'}),{type:'end'});
 const choice=E.legalActions(s).find(a=>a.type==='activate');assert.ok(choice);
 const before=s.players[0].hand.length;s=act(s,choice);
 assert.equal(s.players[0].energy,0);assert.equal(s.cards.p0c0.exhausted,true);assert.equal(s.players[0].hand.length,before+1);
 assert.equal(s.active,0);assert.ok(!E.legalActions(s).some(a=>a.cid==='p0c0'));
});
test('paid axioms persist, replace only their category, and change current action allowance',()=>{
 let s=create();s=act(act(s,{type:'end'}),{type:'end'});
 s=act(s,{type:'rewrite',choice:'underdog'});assert.equal(E.axiomFlag(s,'resolveFight'),true);
 s=act(act(s,{type:'end'}),{type:'end'});
 assert.equal(E.axiomFlag(s,'resolveFight'),true);
 s=act(s,{type:'rewrite',choice:'two-actions'});assert.equal(E.rules(s).actions,2);assert.equal(E.axiomFlag(s,'resolveFight'),true);
 assert.equal(E.legalActions(s).filter(a=>a.type==='rewrite').length,0);
});
function onBoard(s,cid,p){const P=s.players[p];for(const zone of ['hand','deck','discard'])P[zone]=P[zone].filter(x=>x!==cid);P.board.push(cid);s.cards[cid].controller=p;s.cards[cid].enteredTurn=0;}
test('two ready creatures can attack in one turn, but an exhausted attacker cannot attack or block again',()=>{
 let s=create();onBoard(s,'p0c0',0);onBoard(s,'p0c1',0);
 s=act(s,{type:'attack',cid:'p0c0'});assert.equal(s.active,0);assert.equal(s.cards.p0c0.exhausted,true);
 assert.throws(()=>act(s,{type:'attack',cid:'p0c0'}),/Illegal/);
 s=act(s,{type:'attack',cid:'p0c1'});assert.equal(s.players[1].lives,4);assert.equal(s.actionsUsed,2);
 s=act(s,{type:'end'});onBoard(s,'p1c0',1);assert.equal(E.eligibleBlockers(s,'p1c0').length,0);
 s=act(s,{type:'end'});assert.equal(s.cards.p0c0.exhausted,false);
});
test('blocking exhausts a surviving defender without spending its next-turn action budget',()=>{
 let s=create();onBoard(s,'p0c0',0);onBoard(s,'p1c0',1);s.cards.p0c0.base=2;s.cards.p1c0.base=6;
 s=act(act(s,{type:'attack',cid:'p0c0'}),{type:'block',cid:'p1c0'});
 assert.equal(s.cards.p1c0.exhausted,true);assert.equal(s.actionsUsed,1);assert.equal(s.active,0);
});
test('reversed goal awards victory to the player losing their last heart; restoring normal goal reverses that result',()=>{
 for(const reverse of [false,true]){let s=create();onBoard(s,'p0c0',0);s.players[1].lives=1;
 if(reverse){s.axioms.active.victory='reverse-hearts';s.axioms.current='reverse-hearts';}
 s=act(s,{type:'attack',cid:'p0c0'});assert.equal(s.winner,reverse?1:0);assert.equal(s.endReason,reverse?'reverse-hearts':'lives');}
});
test('timeline announces and applies a free round-four flip then a round-seven full reset',()=>{
 let s=E.createBattle({seed:'timeline',players:[{team},{team}],axiomDeck:['underdog','two-actions'],options:{first:0,shuffle:false,shuffleAxioms:false}});
 assert.equal(E.timeline(s)[0].round,4);assert.match(E.timeline(s)[0].text,/Underdog/);
 while(s.round<4)s=act(s,{type:'end'});assert.equal(E.axiomFlag(s,'resolveFight'),true);
 assert.equal(E.timeline(s)[0].round,7);
 while(s.round<7)s=act(s,{type:'end'});assert.equal(E.activeAxioms(s).length,0);assert.equal(E.rules(s).actions,3);
});
test('reducing the action limit cannot refund spent actions, while increasing it creates usable actions',()=>{
 let s=create();s.players[0].energy=10;s.axioms.deck=['two-actions','one-action','haste'];
 s=act(s,{type:'play',cid:'p0c0'});s=act(s,{type:'rewrite',choice:'one-action'});
 assert.equal(E.actionsLeft(s),0);assert.deepEqual(Array.from(E.legalActions(s),a=>a.type),['end']);
 let t=create();t.players[0].energy=10;t.axioms.deck=['haste'];t=act(t,{type:'rewrite',choice:'haste'});assert.equal(E.actionsLeft(t),3);
});
test('energy caps, unaffordable actions and wrong-player actions are enforced by the engine',()=>{
 let s=create();assert.throws(()=>act(s,{type:'rewrite',choice:'underdog'}),/Illegal/);
 assert.throws(()=>E.applyAction(s,{type:'end',player:1}),/Wrong player/);
 for(let i=0;i<24;i++)s=act(s,{type:'end'});assert.equal(s.players[0].energy,10);assert.equal(s.players[1].capacity,10);
});
test('shared deck includes ten distinct rules per side, retains shared copies, and shuffles reproducibly',()=>{
 const mine=['underdog','underdog','missing','arrival'],theirs=['normal-hearts'];
 const deck=E.buildAxiomDeck(mine,theirs);assert.equal(deck.length,20);assert.equal(new Set(deck.slice(0,10)).size,10);assert.equal(deck[0],'underdog');assert.equal(deck[10],'normal-hearts');assert.equal(deck.filter(id=>id==='underdog').length,2);
 const make=seed=>E.createBattle({seed,players:[{team,axioms:mine},{team,axioms:theirs}]}).axioms.deck;
 assert.deepEqual(Array.from(make('same')),Array.from(make('same')));assert.notDeepEqual(Array.from(make('same')),Array.from(make('other')));
});
test('Fate skills spend normal resources, advance immediately at zero, delay within bounds, and preserve inputs',()=>{
 let s=E.createBattle({seed:'fate',players:[{team:[{species:'kardashiant'},{species:'muskrat'}]},{team}],axiomDeck:['underdog','normal-hearts'],options:{first:0,shuffle:false,shuffleAxioms:false}});
 onBoard(s,'p0c0',0);onBoard(s,'p0c1',0);s.players[0].energy=10;s.fate.until=2;
 const before=JSON.stringify(s);let t=act(s,{type:'activate',cid:'p0c0',ability:'filter'});
 assert.equal(JSON.stringify(s),before);assert.equal(t.players[0].energy,8);assert.equal(t.cards.p0c0.exhausted,true);assert.equal(t.fate.events,1);assert.equal(t.fate.until,6);assert.equal(E.axiomFlag(t,'resolveFight'),true);
 t=act(t,{type:'activate',cid:'p0c1',ability:'next-year'});assert.equal(t.fate.until,8);assert.equal(t.players[0].energy,6);
 t=act(t,{type:'end'});assert.equal(t.fate.until,7);assert.equal(E.timeline(t)[0].turns,7);assert.equal(E.timeline(t)[0].type,'reset');
 t.fate.until=12;t.cards.p0c1.exhausted=false;t.cards.p0c1.enteredTurn=0;t.active=0;t.players[0].energy=10;t.actionsUsed=0;t=act(t,{type:'activate',cid:'p0c1',ability:'next-year'});assert.equal(t.fate.until,12);
});
test('Axiomatic AI reasons from the victory goal when choosing its paid rewrite',()=>{
 let s=create();s.active=0;s.players[0].lives=6;s.players[1].lives=1;
 s.phase='choose';s.pending={player:0,kind:'choose',choiceKind:'axiom',ability:'axiomatic',cid:'p0c0',options:['reverse-hearts','normal-hearts']};
 assert.equal(R.Battle.AI.choose(s,{level:'hard'}).choice,'normal-hearts');
});
