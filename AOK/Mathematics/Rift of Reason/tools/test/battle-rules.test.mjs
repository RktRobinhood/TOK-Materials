// One focused test per ability keyword, per axiom, and for the colour wheel.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';

const Rift = loadRift([
    'js/core/rift.js', 'js/core/state.js', 'data/creatures.js', 'data/axioms.js',
    'js/battle/abilities.js', 'js/battle/engine.js', 'js/battle/ai.js',
]);
const E = Rift.Battle.Engine;
const J = x => JSON.parse(JSON.stringify(x));

let n = 0;
const inst = (species, extra) => Object.assign({ uid: 'u' + (++n), species, powerDelta: 0, injuries: [], scars: [], warped: null, trophyOf: null }, extra || {});
// Teams in fixed order: hand = first 5, deck = the rest. Card ids are p<player>c<index>.
const FILL = ['astrophysicat', 'zuckerborg', 'siuuugull', 'astrophysicat', 'zuckerborg', 'siuuugull', 'astrophysicat', 'zuckerborg', 'siuuugull', 'astrophysicat'];
const team = list => list.concat(FILL).slice(0, 10).map(x => typeof x === 'string' ? inst(x) : x);
const setup = (p0, p1, axioms, options) => {const state=E.createBattle({
    seed: 'rules',
    players: [{ name: 'A', team: team(p0) }, { name: 'B', team: team(p1) }],
    axiomDeck: axioms || [],
    options: Object.assign({ shuffle: false, shuffleAxioms: false, first: 0 }, options),
});
state.players.forEach(P=>{P.energy=10;P.capacity=10;});if(axioms&&axioms[0]){state.axioms.current=axioms[0];state.axioms.active[Rift.data.axioms[axioms[0]].category]=axioms[0];state.axioms.deck.shift();}return state;};
const act = (s, a) => E.applyAction(s, Object.assign({ player: E.decider(s) }, a));
function toBoard(s, cid, p) {
    s.players.forEach(P => ['deck', 'hand', 'board', 'discard'].forEach(z => { const i = P[z].indexOf(cid); if (i >= 0) P[z].splice(i, 1); }));
    s.players[p].board.push(cid);
    s.cards[cid].controller = p;
    s.cards[cid].enteredTurn = 0;s.cards[cid].exhausted=false;
}
function toDiscard(s, cid, p) {
    s.players.forEach(P => ['deck', 'hand', 'board', 'discard'].forEach(z => { const i = P[z].indexOf(cid); if (i >= 0) P[z].splice(i, 1); }));
    s.players[p].discard.push(cid);
}
// Play a card and let the opponent decline the steal if offered.
function play(s,cid){
 const owner=s.cards[cid].owner;
 if(s.active!==owner){s=act(s,{type:'end'});}
 s=act(s,{type:'play',cid});
 s.cards[cid].enteredTurn=0; // isolate ability semantics; arrival readiness is tested separately
 const activation=E.legalActions(s).find(a=>a.type==='activate'&&a.cid===cid&&a.ability!=='focus');
 return activation?act(s,activation):s;
}

// ---- every keyword in data/creatures.js is implemented ----------------------------

test('every ability keyword used by a creature is implemented', () => {
    Object.values(Rift.data.creatures).forEach(sp => {
        assert.ok(Rift.Battle.Abilities[sp.ability], 'missing ability ' + sp.ability);
    });
    // 17 original keywords, The Eyebrow, and 15 renamed copies for the expansion roster.
    assert.equal(Rift.Battle.KEYWORDS.length, 33);
    Rift.Battle.KEYWORDS.forEach(k => assert.ok(Rift.Battle.Abilities[k].name && Rift.Battle.Abilities[k].text, k));
});

// ---- abilities ---------------------------------------------------------------------

test('lecture: when it blocks, the attacker loses its ability this turn', () => {
    // Mr. Beastie at 5 base + escalate 3 = 8 would beat Lobstorian (6). Lectured, it is 5.
    const s = setup([inst('beastie')], ['lobstorian']);
    toBoard(s, 'p0c0', 0);
    toBoard(s, 'p1c0', 1);
    s.players[0].playedCount = 3;
    assert.equal(E.power(s, 'p0c0'), 8);
    const t = act(act(s, { type: 'attack', cid: 'p0c0' }), { type: 'block', cid: 'p1c0' });
    assert.ok(t.players[0].discard.includes('p0c0'), 'attacker lost');
    assert.ok(t.players[1].board.includes('p1c0'), 'lecturer survived');
});

test('well-actually: paid activation draws a creature card',()=>{
 const s=setup(['astrophysicat'],[],['underdog','silence']);const before=s.players[0].hand.length;
 const t=play(s,'p0c0');assert.equal(t.players[0].hand.length,before);assert.ok(t.cards.p0c0.exhausted);
});

test('nickname: an enemy creature loses its colour this round', () => {
    const s = setup(['tremendoodle'], ['lobstorian']);
    toBoard(s, 'p1c0', 1);
    const t = play(s, 'p0c0');
    assert.equal(t.cards.p1c0.nicknamedRound, t.round);
    assert.equal(E.colourOf(t, t.cards.p1c0), 'memory');
    assert.match(t.cards.p1c0.nickname, /Lobstorian/);
    // Next round its colour is back.
    const later = J(t);
    later.round += 1;
    assert.equal(E.colourOf(later, later.cards.p1c0), 'reason');
});

test('easter-egg: paid activation reveals one card in the opponent\'s hand', () => {
    const t = play(setup(['swiftlet'], []), 'p0c0');
    assert.equal(t.players[0].knows.length, 1);
    assert.ok(t.players[1].hand.includes(t.players[0].knows[0]));
});

test('new creatures cannot attack unless arrival rule changes; Next Year still waits',()=>{
 const s=setup(['muskrat'],[],['arrival']);const t=act(s,{type:'play',cid:'p0c0'});assert.equal(E.canAttack(t,'p0c0'),false);
});

test('metaverse: the first time it is defeated it returns to hand; the second time it is gone', () => {
    const s = setup(['lobstorian'], ['zuckerborg']);
    toBoard(s, 'p0c0', 0);
    toBoard(s, 'p1c0', 1);
    let t = act(act(s, { type: 'attack', cid: 'p0c0' }), { type: 'block', cid: 'p1c0' });
    assert.ok(t.players[1].hand.includes('p1c0'));
    assert.equal(t.cards.p1c0.metaverseUsed, true);
    toBoard(t, 'p1c0', 1);
    t.active = 0; t.phase = 'action';t.cards.p0c0.exhausted=false;
    t = act(act(t, { type: 'attack', cid: 'p0c0' }), { type: 'block', cid: 'p1c0' });
    assert.ok(t.players[1].discard.includes('p1c0'));
});

test('predict: guess the colour of the opponent\'s next creature; if right, +3', () => {
    let t = play(setup(['altmanta'], ['lobstorian']), 'p0c0');
    assert.equal(t.phase, 'choose');
    assert.equal(t.pending.choiceKind, 'colour');
    t = act(t, { type: 'choose', choice: 'reason' });
    assert.equal(t.active, 0);
    t = play(t, 'p1c0'); // Lobstorian is Reason
    assert.equal(E.power(t, 'p0c0'), 9);

    let w = play(setup(['altmanta'], ['lobstorian']), 'p0c0');
    w = play(act(w, { type: 'choose', choice: 'emotion' }), 'p1c0');
    assert.equal(E.power(w, 'p0c0'), 6);
});

test('escalate: +1 power for each creature you have played this battle', () => {
    let t = play(setup(['beastie', 'lobstorian'], []), 'p0c0');
    assert.equal(E.power(t, 'p0c0'), 6);
    t = play(t, 'p1c0');
    t = play(t, 'p0c1');
    assert.equal(E.power(t, 'p0c0'), 7);
});

test('every-time: paid activation restores energy within capacity',()=>{
 const s=setup(['siuuugull'],[]);toBoard(s,'p0c0',0);s.players[0].energy=4;const t=act(s,{type:'activate',cid:'p0c0',ability:'every-time'});assert.equal(t.players[0].energy,5);assert.ok(t.cards.p0c0.exhausted);
});

test('its-raw: paid activation defeats an enemy creature with power 4 or less', () => {
    const s = setup(['rawmsay'], [inst('lobstorian', { powerDelta: -3 }), 'swiftlet']);
    toBoard(s, 'p1c0', 1); // power 3
    toBoard(s, 'p1c1', 1); // power 5: safe
    const t = play(s, 'p0c0');
    assert.ok(t.players[1].discard.includes('p1c0'));
    assert.ok(t.players[1].board.includes('p1c1'));
});

test('hype: your other creatures get +1 until the end of your next turn', () => {
    const s = setup(['speedcheeta', 'lobstorian'], []);
    toBoard(s, 'p0c1', 0);
    let t = play(s, 'p0c0');
    assert.equal(E.power(t, 'p0c1'), 7, 'during the opponent\'s turn');
    assert.equal(E.power(t, 'p0c0'), 4, 'not itself');
    t = play(t, 'p1c0');
    assert.equal(E.power(t, 'p0c1'), 7, 'during our next turn');
    t = act(act(t,{type:'end'}),{type:'end'});t=act(t,{type:'end'});
    assert.equal(E.power(t, 'p0c1'), 6, 'gone after it');
});

test('pull-that-up: paid activation chooses one of three and puts others underneath',()=>{
 const s=setup(['chimpossible'],[]);const top=s.players[0].deck.slice(0,3);let t=play(s,'p0c0');assert.deepEqual(J(t.pending.options),top);
 t=act(t,{type:'choose',choice:top[1]});assert.ok(t.players[0].hand.includes(top[1]));assert.deepEqual(J(t.players[0].deck.slice(-2)),[top[0],top[2]]);
});

test('axiomatic: paid activation chooses a rule rewrite without a second payment',()=>{
 let s=setup(['euclidon'],[],['underdog','silence','doubt','haste']);let t=play(s,'p0c0');assert.equal(t.phase,'choose');assert.equal(t.pending.choiceKind,'axiom');
 const energy=t.players[0].energy;t=act(t,{type:'choose',choice:'haste'});assert.equal(t.axioms.current,'haste');assert.equal(E.rules(t).actions,4);assert.equal(t.players[0].energy,energy);
});

test('program: gaining a paid skill requires a separate activation after readying', () => {
    const s = setup(['lovelace', 'rawmsay', 'lobstorian'], [inst('lobstorian', { powerDelta: -3 })]);
    toDiscard(s, 'p0c1', 0);
    toDiscard(s, 'p0c2', 0);
    toBoard(s, 'p1c0', 1);
    let t = play(s, 'p0c0');
    assert.equal(t.pending.choiceKind, 'ability');
    assert.deepEqual(J(t.pending.options).sort(), ['its-raw', 'lecture']);
    t = act(t, { type: 'choose', choice: 'its-raw' });
    assert.deepEqual(J(t.cards.p0c0.gained), ['its-raw']);
    assert.ok(t.players[1].board.includes('p1c0'), 'copying does not fire the paid skill');
    assert.equal(t.cards.p0c0.exhausted,true);
    assert.ok(!E.legalActions(t).some(a=>a.type==='activate'&&a.cid==='p0c0'));
    t=act(act(t,{type:'end'}),{type:'end'});
    t=act(t,{type:'activate',cid:'p0c0',ability:'its-raw'});
    assert.ok(t.players[1].discard.includes('p1c0'), 'the separately paid skill fired');
});

test('unprovable: can\'t be stolen, can\'t be blocked by creatures with power above 7', () => {
    const s = setup(['godelix'], ['muskrat', 'lobstorian']);
    let t = act(s, { type: 'play', cid: 'p0c0' });
    assert.notEqual(t.phase, 'steal');
    assert.equal(t.active, 0);
    toBoard(s, 'p0c0', 0);
    toBoard(s, 'p1c0', 1);
    toBoard(s, 'p1c1', 1);
    t = act(s, { type: 'attack', cid: 'p0c0' });
    assert.deepEqual(J(t.pending.options), ['p1c1']);
});

test('measure: paid activation looks at the opponent\'s whole hand', () => {
    const t = play(setup(['tycho'], []), 'p0c0');
    assert.deepEqual(J(t.players[0].knows).sort(), J(t.players[1].hand).sort());
});

test('grook: when it blocks and survives, draw a card', () => {
    const s = setup(['lobstorian'], ['hexling']);
    toBoard(s, 'p0c0', 0);
    toBoard(s, 'p1c0', 1);
    const handBefore = s.players[1].hand.length;
    const t = act(act(s, { type: 'attack', cid: 'p0c0' }), { type: 'block', cid: 'p1c0' });
    assert.equal(t.players[1].hand.length, handBefore + 1);
});

test('creature instance effects: injuries and warp curses change the card', () => {
    const s = setup([inst('lobstorian', { powerDelta: -1, injuries: ['minus-one', 'no-ability'] }), inst('astrophysicat', { warped: { ability: 'grook' } })], []);
    assert.equal(s.cards.p0c0.base, 5);
    assert.equal(s.cards.p0c0.ability, null);
    assert.equal(s.cards.p0c1.ability, 'grook');
});

// ---- colour wheel --------------------------------------------------------------------

test('colour wheel: a clean 5-cycle with a TOK line per edge; Memory stays outside', () => {
    const W = Rift.data.wheel;
    const cols = ['reason', 'emotion', 'perception', 'language', 'imagination'];
    assert.deepEqual(Object.keys(W.beats).sort(), cols.slice().sort());
    assert.deepEqual(Object.values(W.beats).sort(), cols.slice().sort(), 'each colour is beaten exactly once');
    let c = 'reason';
    const seen = [];
    for (let i = 0; i < 5; i++) { seen.push(c); c = W.beats[c]; }
    assert.equal(c, 'reason');
    assert.equal(new Set(seen).size, 5, 'one single cycle');
    cols.forEach(k => assert.ok(W.lines[k].length > 20));
    assert.ok(!('memory' in W.beats));
});

test('colour wheel: +2 power when fighting the colour you beat', () => {
    const s = setup(['lobstorian'], [inst('rawmsay', { powerDelta: 2 }), 'beastie']); // reason vs emotion (Rawmsay boosted to 8 for a tie)
    toBoard(s, 'p0c0', 0);
    toBoard(s, 'p1c0', 1);
    toBoard(s, 'p1c1', 1);
    assert.equal(E.power(s, 'p0c0', 'p1c0'), 8);
    assert.equal(E.power(s, 'p1c0', 'p0c0'), 8);
    assert.equal(E.power(s, 'p0c0', 'p1c1'), 6, 'no bonus against colourless Memory');
    const out = E.fightOutcome(s, 'p0c0', 'p1c0');
    assert.equal(out.attackerDefeated && out.blockerDefeated, true, '8 vs 8 tie');
});

// ---- axioms ----------------------------------------------------------------------------

function duel(axiom, att, blk) {
    const s = setup([att], [blk], [axiom]);
    toBoard(s, 'p0c0', 0);
    toBoard(s, 'p1c0', 1);
    return s;
}
const fightAfter = s => act(act(s, { type: 'attack', cid: 'p0c0' }), { type: 'block', cid: 'p1c0' });

test('axiom deck stays put until a paid rewrite or visible timeline event',()=>{
 let s=setup([],[],['underdog','silence','doubt']);const id=s.axioms.current;s=act(act(s,{type:'end'}),{type:'end'});assert.equal(s.axioms.current,id);assert.equal(s.round,2);
});

test('every axiom has a name, text and flavour', () => {
    Object.values(Rift.data.axioms).forEach(a => {
        assert.ok(a.id && a.name && a.text && a.flavour, a.id);
    });
    assert.ok(Rift.data.axiomDecks.starter.length>=20);
});

test('axiom of the underdog: the weaker creature wins', () => {
    const t = fightAfter(duel('underdog', 'lobstorian', 'astrophysicat'));
    assert.ok(t.players[0].discard.includes('p0c0'));
    assert.ok(t.players[1].board.includes('p1c0'));
});

test('axiom of silence changes activation cost for both players',()=>{const s=setup([],[],['silence']);assert.equal(E.rules(s).abilityCost,3);});

test('axiom of doubt: the attacker is hidden from the defender', () => {
    const t = act(duel('doubt', 'lobstorian', 'astrophysicat'), { type: 'attack', cid: 'p0c0' });
    assert.equal(t.pending.hidden, true);
    const ev = t.lastEvents.find(e => e.t === 'attack');
    assert.equal(ev.privateTo, 0);
    assert.ok(!/Lobstorian/.test(ev.publicText));
});

test('axiom of haste permits four actions, with arriving creatures still waiting',()=>{
 const s=setup(['astrophysicat'],[],['haste']);const t=act(s,{type:'play',cid:'p0c0'});assert.equal(E.actionsLeft(t),3);assert.equal(E.canAttack(t,'p0c0'),false);assert.equal(act(t,{type:'end'}).active,1);
});

test('axiom of mercy: defeated creatures return to hand', () => {
    const t = fightAfter(duel('mercy', 'lobstorian', 'astrophysicat'));
    assert.ok(t.players[1].hand.includes('p1c0'));
    assert.equal(t.players[1].discard.length, 0);
});

test('axiom of the crowd: +1 per other creature on your side', () => {
    const s = setup(['lobstorian', 'astrophysicat', 'zuckerborg'], [], ['crowd']);
    ['p0c0', 'p0c1', 'p0c2'].forEach(c => toBoard(s, c, 0));
    assert.equal(E.power(s, 'p0c0'), 8);
});

test('law of the excluded middle: ties go to the attacker', () => {
    const t = fightAfter(duel('excluded-middle', 'lobstorian', 'lobstorian'));
    assert.ok(t.players[0].board.includes('p0c0'));
    assert.ok(t.players[1].discard.includes('p1c0'));
});

test('axiom of extensionality: ties defeat neither', () => {
    const t = fightAfter(duel('extensionality', 'lobstorian', 'lobstorian'));
    assert.ok(t.players[0].board.includes('p0c0'));
    assert.ok(t.players[1].board.includes('p1c0'));
});

test('axiom of choice: the attacker may choose the blocker', () => {
    const s = duel('choice', 'lobstorian', 'astrophysicat');
    toBoard(s, 'p1c1', 1);
    const legal = E.legalActions(s).filter(a => a.cid === 'p0c0'&&a.type==='attack');
    assert.deepEqual(J(legal.map(a => a.target || null)), [null, 'p1c0', 'p1c1']);
    const t = act(s, { type: 'attack', cid: 'p0c0', target: 'p1c1' });
    assert.notEqual(t.phase, 'block');
    assert.ok(t.players[1].discard.includes('p1c1'));
});

test('the broken postulate: the colour wheel runs backwards', () => {
    const s = duel('curved-space', 'lobstorian', 'rawmsay'); // reason vs emotion
    assert.equal(E.power(s, 'p0c0', 'p1c0'), 6);
    assert.equal(E.power(s, 'p1c0', 'p0c0'), 8);
});

test('axiom of the empty set: abilities are switched off', () => {
    const s = setup(['beastie', 'godelix'], [], ['empty-set']);
    toBoard(s, 'p0c0', 0);
    s.players[0].playedCount = 4;
    assert.equal(E.power(s, 'p0c0'), 5);
    assert.equal(E.activations(s,'p0c0').length,0,'no paid abilities available');
});

test('principle of induction: winning a fight gives +1 for the rest of the battle', () => {
    const t = fightAfter(duel('induction', 'lobstorian', 'astrophysicat'));
    assert.equal(E.power(t, 'p0c0'), 7);
});

test('spotlight axioms: +2 to one colour', () => {
    const map = {
        'age-of-reason': 'lobstorian', 'age-of-feeling': 'rawmsay', 'age-of-rhetoric': 'tremendoodle',
        'age-of-observation': 'chimpossible', 'age-of-wonder': 'muskrat', 'age-of-tradition': 'beastie',
    };
    Object.entries(map).forEach(([ax, sp]) => {
        const s = setup([sp, 'lobstorian', 'rawmsay'], [], [ax]);
        toBoard(s, 'p0c0', 0);
        const base = Rift.data.creatures[sp].power + (sp === 'beastie' ? s.players[0].playedCount : 0);
        assert.equal(E.power(s, 'p0c0'), base + 2, ax);
        const other = sp === 'lobstorian' ? 'p0c2' : 'p0c1';
        toBoard(s, other, 0);
        assert.equal(E.power(s, other), Rift.data.creatures[s.cards[other].species].power, ax + ' leaves other colours alone');
    });
});

test('the AI respects axioms and the colour wheel when blocking', () => {
    // Astrophysicat (4) can't beat Lobstorian (6) normally, but under the Underdog it wins.
    const s = duel('underdog', 'lobstorian', 'astrophysicat');
    const t = act(s, { type: 'attack', cid: 'p0c0' });
    assert.equal(Rift.Battle.AI.choose(t, { level: 'hard' }).type, 'block');
    const plain = setup(['lobstorian'], ['astrophysicat']);
    toBoard(plain, 'p0c0', 0);
    toBoard(plain, 'p1c0', 1);
    assert.equal(Rift.Battle.AI.choose(act(plain, { type: 'attack', cid: 'p0c0' }), { level: 'hard' }).type, 'take');
});

test('the-eyebrow: the Rockodile can\'t be stolen', () => {
    assert.equal(Rift.Battle.Abilities['the-eyebrow'].canBeStolen, false);
});

test('reinvention (a renamed Program) never programs itself, so it can\'t loop', () => {
    const A = Rift.Battle.Abilities;
    assert.equal(A.reinvention.onActivate, A.program.onActivate);
    assert.notEqual(A.reinvention.onActivate, A.measure.onActivate);
});
