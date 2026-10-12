import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';
import { Rift, E, AI, setup, act, onBoard, toHand, pass, hp, atk, stats, plain, invariants } from './battle-helpers.mjs';

const creatures=['proof-pup','lens-lizard','paper-dragon','cloud-calf','pocket-tortoise','comma-crab','footnote-finch'];
const spells=['patient-proof','steady-gaze','creative-spark','stored-thought','careful-words'];
const activation=(s,cid)=>E.legalActions(s).find(a=>a.type==='activate'&&a.cid===cid);
const play=(s,cid,target)=>act(s,{type:'play',cid,...(target?{target}:{})});

test('the common pack uses seven distinct bounded hooks, short text and produced portrait IDs',()=>{
    const abilities=new Set();
    for(const id of creatures){
        const c=Rift.data.creatures[id],a=Rift.Battle.Abilities[c.ability];
        assert.equal(c.rarity,'common');assert(a);abilities.add(c.ability);
        assert.equal(c.abilityText,a.text);assert(c.abilityText.length<=100);
        assert.equal(c.lines.length,2);
    }
    assert.equal(abilities.size,7);
    assert.deepEqual(plain(Rift.data.tacticDecks.starterPack),spells);
    for(const id of spells){assert.equal(Rift.data.tactics[id].rarity,'common');assert.equal(typeof Rift.data.tactics[id].run,'function');}
});

test('legacy chapter catch-up kits keep their old common choices; definitions alone do not grant starter helpers',()=>{
    const R=loadRift(['js/core/rift.js','js/core/state.js','js/core/world.js','data/creatures.js','data/items.js','data/map.js']);
    const s=R.State.freshState();
    for(const chapter of ['ch2','ch3','ch4'])assert(R.World.jumpToChapter(s,chapter));
    assert.deepEqual(plain(s.creatures.map(c=>c.species)),['astrophysicat','zuckerborg','siuuugull']);
    assert(!s.creatures.some(c=>R.data.starterSpecies.includes(c.species)));
    R.World.jumpToChapter(s,'ch1');assert.equal(s.creatures.length,3);
});

test('Proof Pup heals a damaged ally, never itself/enemies, and still enters without a heal target',()=>{
    let s=setup({p0:['proof-pup','lens-lizard'],p1:['astrophysicat']});
    onBoard(s,'p0c1','p1c0');toHand(s,'p0c0');s.cards.p0c1.damage=1;s.cards.p1c0.damage=1;
    assert.deepEqual(plain(E.legalActions(s).filter(a=>a.type==='play'&&a.cid==='p0c0').map(a=>a.target)),['p0c1']);
    s=play(s,'p0c0','p0c1');assert.equal(hp(s,'p0c1'),2);assert.equal(s.cards.p1c0.damage,1);assert(E.hasKeyword(s,'p0c0','guard'));
    s=setup({p0:['proof-pup']});toHand(s,'p0c0');s=play(s,'p0c0');assert(s.players[0].board.includes('p0c0'));
});

test('Lens Check inspects one personal card and reorders without drawing, public identity leak or repeated activation',()=>{
    const base=setup({p0:['lens-lizard','paper-dragon','proof-pup'],p1:['astrophysicat']});onBoard(base,'p0c0','p1c0');
    const before=plain(base),action=activation(base,'p0c0');assert(action);
    let s=E.applyAction(base,action);assert.deepEqual(plain(base),before,'immutable input');
    assert.equal(s.phase,'choose');assert(s.pending.prompt.includes('Paper Dragon'));
    assert.equal(s.players[0].energy,9);const deck=plain(s.players[0].deck);
    const kept=act(s,{type:'choose',choice:'keep'});assert.deepEqual(plain(kept.players[0].deck),deck);
    s=act(s,{type:'choose',choice:'bottom'});assert.deepEqual(plain(s.players[0].deck),[...deck.slice(1),deck[0]]);
    assert.equal(s.players[0].hand.length,0);assert(!activation(s,'p0c0'));
    assert(s.lastEvents.every(e=>!e.text.includes('Paper Dragon')),'public log gives no hidden name');
    assert.deepEqual(plain(s),plain(act(E.applyAction(base,action),{type:'choose',choice:'bottom'})),'deterministic choice');
    base.players[0].discard.push(...base.players[0].deck.splice(0));assert(!activation(base,'p0c0'));
});

test('Paper Dragon folds its own damaged stats, uses its attack and cannot accumulate health through repeated folds',()=>{
    let s=setup({p0:['paper-dragon'],p1:['lens-lizard']});onBoard(s,'p0c0','p1c0');
    assert(!activation(s,'p0c0'),'equal stats do not offer a no-op');s.cards.p0c0.damage=1;
    s=E.applyAction(s,activation(s,'p0c0'));assert.equal(atk(s,'p0c0'),1);assert.equal(hp(s,'p0c0'),2);
    assert(!activation(s,'p0c0'));assert(!E.canAttack(s,'p0c0'));
    s=pass(pass(s));s=E.applyAction(s,activation(s,'p0c0'));assert.equal(atk(s,'p0c0'),2);assert.equal(hp(s,'p0c0'),1);
    assert.equal(s.players[0].energy,9);
});

test('Cloud Calf heals once at its controller turn end only when damaged; silence and max hearts are respected',()=>{
    let s=setup({p0:['cloud-calf'],p1:['lens-lizard'],t1:['occams-razor']});onBoard(s,'p0c0','p1c0');s.players[0].hearts=7;
    const clean=pass(s);assert.equal(clean.players[0].hearts,7);
    s.cards.p0c0.damage=1;s=pass(s);assert.equal(s.players[0].hearts,8);
    s=pass(s);assert.equal(s.players[0].hearts,8,'opponent end does not heal');
    s.players[0].hearts=10;s=pass(s);assert.equal(s.players[0].hearts,10);
    toHand(s,'p1t0');s=play(s,'p1t0','p0c0');s=pass(s);s.players[0].hearts=7;s=pass(s);assert.equal(s.players[0].hearts,7);
});

test('Pocket Tortoise retrieves exactly the bottom card, preserving order/card count and refusing a one-card no-op',()=>{
    let s=setup({p0:['pocket-tortoise','paper-dragon','lens-lizard','proof-pup']});onBoard(s,'p0c0');const deck=plain(s.players[0].deck);
    s=E.applyAction(s,activation(s,'p0c0'));assert.deepEqual(plain(s.players[0].deck),[deck.at(-1),...deck.slice(0,-1)]);assert(!activation(s,'p0c0'));
    s=setup({p0:['pocket-tortoise','paper-dragon']});onBoard(s,'p0c0');s.players[0].discard.push(...s.players[0].deck.splice(1));assert(!activation(s,'p0c0'));
});

test('Comma Crab heals only another damaged friend once per turn; no self-target or free healing loop',()=>{
    let s=setup({p0:['comma-crab','paper-dragon'],p1:['lens-lizard']});onBoard(s,'p0c0','p0c1','p1c0');
    assert(!activation(s,'p0c0'));s.cards.p0c0.damage=1;s.cards.p0c1.damage=1;s.cards.p1c0.damage=1;
    const actions=E.legalActions(s).filter(a=>a.type==='activate'&&a.cid==='p0c0');assert.deepEqual(plain(actions.map(a=>a.target)),['p0c1']);
    s=E.applyAction(s,actions[0]);assert.equal(hp(s,'p0c1'),2);assert.equal(s.cards.p0c0.damage,1);assert.equal(s.cards.p1c0.damage,1);
    assert(!activation(s,'p0c0'));assert(!E.canAttack(s,'p0c0'));assert.equal(s.players[0].energy,9);
});

test('Footnote Finch responds only to its controller playing an Axiom and loses its boost at turn end',()=>{
    let s=setup({p0:['footnote-finch'],p1:['lens-lizard'],axioms:['luxury','abundance']});onBoard(s,'p0c0','p1c0');s.players[0].axHand=['luxury'];
    s=act(s,{type:'axiom',choice:'luxury'});assert.equal(atk(s,'p0c0'),2);s=pass(s);assert.equal(atk(s,'p0c0'),1);
    s.players[1].axHand=['abundance'];s=act(s,{type:'axiom',choice:'abundance'});assert.equal(atk(s,'p0c0'),1);
});

function spellTable(id){
    const colour=Rift.data.tactics[id].colour;
    const own={reason:'proof-pup',perception:'lens-lizard',imagination:'paper-dragon',memory:'pocket-tortoise',language:'comma-crab'}[colour];
    const s=setup({p0:[own,'footnote-finch','cloud-calf'],p1:['lens-lizard','paper-dragon'],t0:[id]});
    onBoard(s,'p0c0','p0c1','p1c0','p1c1');toHand(s,'p0t0');return s;
}

test('Patient Proof respects low-attack/enemy/Elusive filters, damage prevention and actual damage',()=>{
    let s=spellTable('patient-proof');stats(s,'p1c0',1,3);stats(s,'p1c1',3,4);
    assert.deepEqual(plain(E.legalActions(s).filter(a=>a.cid==='p0t0').map(a=>a.target)),['p1c0']);
    s.cards.p1c0.extraKeywords.push('shield');const blocked=play(s,'p0t0','p1c0');assert.equal(hp(blocked,'p1c0'),3);
    s.cards.p1c0.extraKeywords=[];assert.equal(hp(play(s,'p0t0','p1c0'),'p1c0'),1);
    s.cards.p1c0.extraKeywords=['elusive'];assert(!E.legalActions(s).some(a=>a.cid==='p0t0'));
});

test('Steady Gaze draws even when Shield blocks damage, and works with an empty personal deck',()=>{
    let s=spellTable('steady-gaze');s.cards.p1c0.extraKeywords.push('shield');s=play(s,'p0t0','p1c0');
    assert.equal(hp(s,'p1c0'),2);assert.equal(s.players[0].hand.length,1);
    s=spellTable('steady-gaze');s.players[0].discard.push(...s.players[0].deck.splice(0));s=play(s,'p0t0','p1c0');assert.equal(hp(s,'p1c0'),1);assert.equal(s.players[0].hand.length,0);
});

test('Creative Spark expires both stats and defeats a creature surviving only on its temporary health',()=>{
    let s=spellTable('creative-spark');s=play(s,'p0t0','p0c1');assert.equal(atk(s,'p0c1'),2);assert.equal(hp(s,'p0c1'),3);
    const ordinary=pass(s);assert.equal(atk(ordinary,'p0c1'),1);assert.equal(hp(ordinary,'p0c1'),2);
    s.cards.p0c1.damage=2;s=pass(s);assert(s.players[0].discard.includes('p0c1'));invariants(s,assert);
});

test('Stored Thought draws and heals with coherent full/empty states and no extra energy',()=>{
    let s=spellTable('stored-thought');s.players[0].hearts=8;s=play(s,'p0t0');assert.equal(s.players[0].hearts,9);assert.equal(s.players[0].hand.length,1);assert.equal(s.players[0].energy,8);
    s=spellTable('stored-thought');s.players[0].discard.push(...s.players[0].deck.splice(0));assert(!E.legalActions(s).some(a=>a.cid==='p0t0'));
    s.players[0].hearts=9;s=play(s,'p0t0');assert.equal(s.players[0].hearts,10);assert.equal(s.players[0].hand.length,0);
});

test('Careful Words raises maximum health before healing, without changing attack or exceeding the new maximum',()=>{
    let s=spellTable('careful-words');s.cards.p0c1.damage=1;s=play(s,'p0t0','p0c1');assert.equal(E.healthOf(s,'p0c1').max,3);assert.equal(hp(s,'p0c1'),3);assert.equal(atk(s,'p0c1'),1);
    s=spellTable('careful-words');s=play(s,'p0t0','p0c1');assert.equal(hp(s,'p0c1'),3);
});

test('all AI levels resolve the pack and its optional Lens question through legal deterministic actions',()=>{
    for(const level of ['normal','competent','expert']){
        let s=setup({p0:creatures,p1:creatures,t0:spells,t1:spells});
        onBoard(s,'p0c0','p0c1','p0c2','p1c0','p1c1','p1c2');toHand(s,'p0t0','p0t1','p0t2');s.cards.p0c0.damage=1;
        for(let i=0;i<20&&E.winner(s)==null;i++){
            const a=AI.choose(s,{level,salt:'starter-'+i});assert(a);assert(E.legalActions(s).some(x=>E.actionKey(x)===E.actionKey(a)));
            const next=E.applyAction(s,a);assert.deepEqual(plain(next),plain(E.applyAction(s,a)));s=next;invariants(s,assert);
        }
        s=setup({p0:['lens-lizard','proof-pup','paper-dragon'],p1:['cloud-calf']});onBoard(s,'p0c0','p1c0');s=E.applyAction(s,activation(s,'p0c0'));
        const a=AI.choose(s,{level});assert.equal(a.type,'choose');s=E.applyAction(s,a);assert.equal(s.phase,'main');invariants(s,assert);
    }
});
