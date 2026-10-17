// #148 steps 3 and 4 (design/drafts/conditional-expansion-2026-10-13/NEXT-STEPS.md): the semantic Fate-entry fact
// (one per space Fate enters; actor = the player who moved Fate, or nobody at a round's end; reactions resolve
// after the whole movement), and the cards built on it: Round of Refreshments' Fate option, Clock Eyes and
// Second Alarm. Plus Queue That Question's spell-only tax.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';

const R = loadRift(['js/core/rift.js', 'js/core/state.js', 'data/creatures.js', 'data/axioms.js', 'data/tactics.js',
    'js/battle/abilities.js', 'js/battle/engine.js', 'dev/conditional-cards.js']);
const E = R.Battle.Engine, prefix = 'conditional-';
const plain = x => JSON.parse(JSON.stringify(x));
const inst = (species, i) => ({ uid: 'fe-' + i, species, injuries: [], scars: [] });
// A: the study card (creature or spell) plus `extra` tactics; B: three creatures and `theirs`.
function setup(id, { extra = [], theirs = ['second-wind'], env = null, fateStart = 6 } = {}) {
    const creature = !!R.data.creatures[id];
    const s = E.createBattle({ seed: 'fate-entry', environment: env, players: [
        { name: 'A', team: [creature ? id : 'proof-pup', 'paper-dragon', 'cloud-calf', 'lens-lizard', 'comma-crab', 'rawmsay'].map(inst), tactics: (creature ? [] : [id]).concat(extra) },
        { name: 'B', team: ['lens-lizard', 'paper-dragon', 'cloud-calf', 'comma-crab', 'proof-pup', 'rawmsay'].map(inst), tactics: theirs }],
    axiomDeck: ['luxury', 'thrift', 'mercy', 'arrival'], options: { first: 0, shuffle: false, shuffleAxioms: false, openHand: [0, 0], openAxioms: 0, spark: false,
        timeline: true, fateStart, fateGap: 3, hearts: 20 } });
    s.phase = 'main'; s.players.forEach(P => { P.energy = 10; P.capacity = 10; });
    return s;
}
function move(s, cid, zone) {
    const p = s.cards[cid].owner;
    s.players.forEach(P => ['deck', 'hand', 'board', 'discard', 'armed'].forEach(z => { P[z] = P[z].filter(c => c !== cid); }));
    s.players[p][zone].push(cid); s.cards[cid].enteredTurn = 0;
}
const act = (s, a) => E.applyAction(s, { ...a, player: E.decider(s) });
const fresh = s => { s.players.forEach(P => { P.energy = 10; P.playsThisTurn = 0; }); return s; };
function pass(s) { s = act(s, { type: 'end' }); const d = E.legalActions(s).find(a => a.type === 'draw'); return d ? fresh(act(s, d)) : fresh(s); }
function arm(s, cid, choice) {
    move(s, cid, 'hand');
    s = act(fresh(s), { type: 'play', cid });
    if (s.phase === 'choose') s = act(s, choice ? { type: 'choose', choice } : E.legalActions(s)[0]);
    return s;
}
const reveals = s => E.fullLog(s).filter(e => e.t === 'conditional-reveal');

test('Fate entry is a semantic fact: one per entered space, actor null at a round\'s end, the mover otherwise', () => {
    const seen = [];
    R.data.tactics['test-fate-watch'] = { id: 'test-fate-watch', name: 'Test Watch', cost: 0, text: 'test', run() {},
        conditional: { visibility: 'face-up', options: [{ key: 'fate-entered:self', event: 'fate-entered', actor: 'self', label: 'When you move Fate' }],
            run: (api, p, fact) => seen.push([fact.event, fact.actor, fact.space, fact.how]) } };
    try {
        let s = setup('test-fate-watch', { extra: ['clockwork'] });
        s = arm(s, 'p0t0');
        s = pass(s); s = pass(s);                                   // round 1 ends: ordinary move, actor null: no match
        assert.equal(seen.length, 0, 'the ordinary move is nobody\'s, so a "you" condition stays armed');
        move(s, 'p0t1', 'hand');
        s = act(fresh(s), { type: 'play', cid: 'p0t1' });           // Clockwork: A moves Fate
        if (s.phase === 'choose') s = act(s, E.legalActions(s).find(a => /forward|closer|1/.test(String(a.choice))) || E.legalActions(s)[0]);
        assert.equal(seen.length, 1);
        assert.equal(seen[0][0], 'fate-entered');
        assert.equal(seen[0][1], 0, 'A moved it');
    } finally { delete R.data.tactics['test-fate-watch']; }
});

test('Round of Refreshments can wait for Fate: at the round\'s end both heroes heal 1, once', () => {
    let s = setup(prefix + 'generic-refreshments');
    s.players.forEach(P => { P.hearts = 15; });
    s = arm(s, 'p0t0', 'fate-entered:either');
    assert.equal(E.armedView(s, 0, 1)[0].condition, 'When Fate lands on a space');
    s = pass(s); s = pass(s);                                       // round 1 ends: Fate enters space 1
    assert.equal(reveals(s).length, 1);
    assert.deepEqual(plain(s.players.map(P => P.hearts)), [16, 16]);
    s = pass(s); s = pass(s);
    assert.equal(reveals(s).length, 1, 'one shot');
    assert.deepEqual(plain(s.players.map(P => P.hearts)), [16, 16]);
});

test('Clock Eyes: when Fate lands, it enters and its controller alone sees the top 2 shared rule cards; nothing moves', () => {
    let s = setup(prefix + 'perception-clock-eyes');
    s = arm(s, 'p0c0');
    const deck = s.axioms.deck.slice();
    s = pass(s); s = pass(s);
    assert.ok(s.players[0].board.includes('p0c0'), 'revealed and entered');
    const look = E.fullLog(s).find(e => e.t === 'forecast-axioms');
    assert.equal(look.privateTo, 0);
    assert.equal(look.ids.length, 2);
    assert.ok(look.ids.every(id => deck.includes(id)), 'cards from the shared deck');
    const names = look.ids.map(id => R.data.axioms[id].name);
    names.forEach(n => assert.ok(look.text.includes(n)));
    names.forEach(n => assert.ok(!look.publicText.includes(n), 'the public line names no card'));
    assert.deepEqual(plain(s.axioms.deck.slice(0, 2)), plain(look.ids), 'nothing moved or was drawn');
});

test('Second Alarm moves your soonest waiting one-shot 1 round later; never an environmental event; at most 4 ahead', () => {
    let s = setup(prefix + 'memory-second-alarm', { extra: ['clean-slate', 'clean-slate'], env: [{ def: 'trending', first: 2, every: 2, side: 1 }] });
    s = arm(s, 'p0t0');
    move(s, 'p0t1', 'hand');
    s = act(fresh(s), { type: 'play', cid: 'p0t1' });               // Clean Slate, 2 ahead (space 2)
    const mine = E.fateSchedule(s).find(e => e.def === 'clean-slate');
    const trend = E.fateSchedule(s).find(e => e.env);
    assert.equal(mine.spaces, 2);
    s = pass(s); s = pass(s);                                       // round 1 ends: Fate enters space 1, Second Alarm reveals
    assert.equal(reveals(s).length, 1);
    const after = E.fateSchedule(s).find(e => e.id === mine.id);
    assert.equal(after.spaces, 2, 'it was 1 away, now 2 away');
    assert.match(E.fullLog(s).find(e => e.t === 'fate-delay').text, /^Second Alarm: A's Clean Slate now happens in 2 rounds\.$/);
    assert.equal(E.fateSchedule(s).find(e => e.id === trend.id).spaces, 1, 'the environmental event did not move');
    // The cap: an event already 4 ahead does not move.
    let t = setup(prefix + 'memory-second-alarm', { extra: ['clean-slate'] });
    t = arm(t, 'p0t0');
    move(t, 'p0t1', 'hand'); t = act(fresh(t), { type: 'play', cid: 'p0t1' });
    t.fate.queue.find(e => e.def === 'clean-slate').space = t.fate.pos + 5;   // as if Patient Plans had moved it far
    t = pass(t); t = pass(t);
    assert.ok(E.fullLog(t).some(e => /no waiting event to move/.test(e.text)), 'nothing within the cap to move');
});

test('a leap\'s landing is one Fate entry; the occurrence it skipped never fires, and no condition replays it', () => {
    let s = setup(prefix + 'generic-refreshments', { extra: ['leap-ahead'], env: [{ def: 'trending', first: 1, every: 3, side: 1 }] });
    s.players.forEach(P => { P.hearts = 15; });
    s = arm(s, 'p0t0', 'fate-entered:either');
    move(s, 'p0t1', 'hand');
    s = act(fresh(s), { type: 'play', cid: 'p0t1' });               // leap 2: skips Trending on space 1, lands on 2
    assert.equal(E.fateSchedule(s).find(e => e.def === 'trending' && e.occurrence === 1).state, 'skipped');
    assert.equal(reveals(s).length, 1, 'Refreshments reacted to the landing');
    assert.ok(!E.fullLog(s).some(e => e.t === 'fate-event' && e.def === 'trending'));
});

test('Queue That Question: the opponent\'s next spell costs 1 more until it is paid or their next turn ends; creatures are not taxed', () => {
    let s = setup(prefix + 'language-queue-that-question', { theirs: ['second-wind', 'second-wind', 'pep-talk'] });
    s = arm(s, 'p0t0');
    s = pass(s);                                                    // B's turn 2
    move(s, 'p1t0', 'hand'); move(s, 'p1t1', 'hand'); move(s, 'p1c0', 'hand');
    const base = E.playCost(s, 'p1t0');
    s = act(s, { type: 'play', cid: 'p1t0' });                      // B's spell: the trap reveals
    assert.equal(reveals(s).length, 1);
    assert.equal(E.playCost(s, 'p1t1'), base + 1, 'the next spell costs 1 more');
    assert.equal(E.playCost(s, 'p1c0'), s.cards.p1c0.cost, 'creatures are not taxed');
    const energy = s.players[1].energy;
    s = act(s, { type: 'play', cid: 'p1t1' });
    assert.equal(s.players[1].energy, energy - base - 1);
    assert.ok(s.lastEvents.some(e => e.t === 'tax-paid'));
    assert.equal(s.players[1].spellTax, null, 'used up');
    // Unpaid, it ends with B's next turn.
    let t = setup(prefix + 'language-queue-that-question', { theirs: ['second-wind', 'second-wind'] });
    t = arm(t, 'p0t0'); t = pass(t);
    move(t, 'p1t0', 'hand'); move(t, 'p1t1', 'hand');
    t = act(t, { type: 'play', cid: 'p1t0' });
    assert.equal(t.players[1].spellTax.until, 4);
    t = pass(t); t = pass(t);                                       // B's turn 4
    assert.equal(E.playCost(t, 'p1t1'), base + 1, 'still taxed on their next turn');
    t = pass(t);                                                    // B's turn 4 ends
    assert.equal(t.players[1].spellTax, null);
    assert.ok(E.fullLog(t).some(e => e.t === 'tax-end'));
    assert.equal(E.playCost(t, 'p1t1'), base);
});

test('every study card still arms legally, including the Fate-entry ones', () => {
    for (const id of R.ConditionalStudy.ids) {
        const creature = !!R.data.creatures[id];
        let s = setup(id);
        s = arm(s, creature ? 'p0c0' : 'p0t0');
        assert.equal(s.players[0].armed.length, 1, id);
    }
    assert.equal(R.ConditionalStudy.ids.length, 18);
});
