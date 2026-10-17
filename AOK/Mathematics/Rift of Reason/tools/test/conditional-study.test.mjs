import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadRift, GAME_DIR } from './harness.mjs';
const R = loadRift(['js/core/rift.js','js/core/state.js','data/creatures.js','data/axioms.js','data/tactics.js',
    'js/battle/abilities.js','js/battle/engine.js','dev/conditional-cards.js']);
const E = R.Battle.Engine, prefix = 'conditional-';
const inst = (species, i) => ({ uid: 'study-' + i, species, injuries: [], scars: [] });
function setup(id) {
    const creature = !!R.data.creatures[id];
    const s = E.createBattle({seed:'study',players:[
        {name:'A',team:[creature?id:'proof-pup','paper-dragon','cloud-calf','lens-lizard','comma-crab','rawmsay'].map(inst),tactics:creature?[]:[id]},
        {name:'B',team:['lens-lizard','paper-dragon','cloud-calf'].map(inst),tactics:['second-wind']}],
        axiomDeck:['luxury'], options:{first:0,shuffle:false,shuffleAxioms:false,openHand:[0,0],openAxioms:0,spark:false,timeline:false,hearts:10}});
    s.phase='main';s.players.forEach(P=>{P.energy=10;P.capacity=10;});
    move(s,creature?'p0c0':'p0t0','hand'); return s;
}
function move(s,cid,zone) {
    const p=s.cards[cid].owner;
    s.players.forEach(P=>['deck','hand','board','discard','armed'].forEach(z=>{P[z]=P[z].filter(c=>c!==cid);}));
    s.players[p][zone].push(cid);s.cards[cid].enteredTurn=0;
}
const act = (s,a) => E.applyAction(s,{...a,player:E.decider(s)});
function enemyTurn(s) {s=act(s,{type:'end'});return act(s,E.legalActions(s)[0]);}

test('all fifteen study cards have legal arming and use the proposed classification',()=>{
    for(const id of R.ConditionalStudy.ids){let s=setup(id),cid=R.data.creatures[id]?'p0c0':'p0t0';
        if(s.cards[cid].kind==='tactic')assert.equal(E.describe(s,cid).colourReady,true);
        assert.ok(E.legalActions(s).some(a=>a.cid===cid));s=act(s,{type:'play',cid});
        if(s.phase==='choose')s=act(s,E.legalActions(s)[0]);
        assert.equal(s.players[0].armed[0],cid);assert.equal(s.players[0].playsThisTurn,1);
    }
    const s=setup(prefix+'generic-seat-reserved');assert.equal(E.colourOf(s,s.cards.p0c0),'none');
});

test('Tiny Drama checks own-zero victory before drawing',()=>{
    let s=setup(prefix+'emotion-tiny-drama');s.axioms.active.victory='reverse-hearts';s.players[0].hearts=1;
    move(s,'p0c1','board');move(s,'p1c1','board');
    s=act(s,{type:'play',cid:'p0t0'});s=enemyTurn(s);
    const count=s.players[0].hand.length;s=act(s,{type:'attack',cid:'p1c1',target:'p0c1'});
    assert.equal(s.winner,0);assert.equal(s.players[0].hand.length,count);
});

test('Group Gasp reduces both heroes together using the existing draw rule',()=>{
    for(const reverse of [false,true]){let s=setup(prefix+'emotion-group-gasp');
        if(reverse)s.axioms.active.victory='reverse-hearts';s.players.forEach(P=>{P.hearts=1;});
        s.players[0].axHand=['luxury'];s=act(s,{type:'play',cid:'p0t0'});s=act(s,{type:'axiom',choice:'luxury'});
        assert.equal(s.winner,'draw');assert.equal(s.players[0].hearts,0);assert.equal(s.players[1].hearts,0);
    }
});

test('paid-cost parity uses the actual historical payment',()=>{
    let s=setup(prefix+'reason-exhibit-aha');s=act(s,{type:'play',cid:'p0t0'});
    s=act(s,{type:'choose',choice:'spell-played:opponent'});s=enemyTurn(s);
    move(s,'p1t0','hand');s.players[1].tax=1;const count=s.players[0].hand.length;
    s=act(s,{type:'play',cid:'p1t0'}); // printed 2, paid 3
    assert.equal(s.players[0].hand.length,count+1);
});

test('Somewhere Safe recovers the defeated exact instance with its history',()=>{
    let s=setup(prefix+'memory-somewhere-safe');move(s,'p0c1','board');move(s,'p1c1','board');
    s.cards.p0c1.conditionSpent=true;const uid=s.cards.p0c1.uid;
    s=act(s,{type:'play',cid:'p0c0'});s=enemyTurn(s);s=act(s,{type:'attack',cid:'p1c1',target:'p0c1'});
    assert.ok(s.players[0].board.includes('p0c0'));assert.equal(s.players[0].deck.at(-1),'p0c1');
    assert.equal(s.cards.p0c1.uid,uid);assert.equal(s.cards.p0c1.conditionSpent,true);
    assert.equal(s.players[0].playedCount,1);assert.ok(!s.players[0].discard.includes('p0c1'));
});

test('Queue Please changes blind ordering without giving cards or information',()=>{
    let s=setup(prefix+'generic-queue-please');move(s,'p1t0','hand');s=act(s,{type:'play',cid:'p0t0'});s=enemyTurn(s);
    const before=s.players.map(P=>Array.from(P.deck)),hands=s.players.map(P=>P.hand.length);
    s=act(s,{type:'play',cid:'p1t0'});
    for(let p=0;p<2;p++)assert.deepEqual(Array.from(s.players[p].deck),before[p].slice(1).concat(before[p][0]));
    assert.equal(s.players[0].hand.length,hands[0]);assert.equal(s.players[1].hand.length,hands[1]-1);
    assert.ok(!s.lastEvents.some(e=>e.t==='forecast'||e.t==='draw'));
});

test('study definitions are absent from production scripts and campaign catalogues',()=>{
    const index=fs.readFileSync(path.join(GAME_DIR,'index.html'),'utf8');assert.ok(!index.includes('dev/conditional-'));
    for(const file of ['data/creatures.js','data/tactics.js'])assert.ok(!fs.readFileSync(path.join(GAME_DIR,file),'utf8').includes('conditional-generic-seat-reserved'));
});
