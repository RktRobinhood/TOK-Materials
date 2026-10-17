// #148 steps 2 and 5 (design/drafts/conditional-expansion-2026-10-13/NEXT-STEPS.md): Spare Premise (a legal
// equal-attack pair), Wrong Way Round (a temporary stat swap with explicit damage rules), Paper Tiger and Costume
// Rehearsal (colourless paper tokens: never collected, never a Fate casualty, no second Shield) and Borrowed
// Tomorrow (recovery keeps the used condition; no rearming).
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';

const R = loadRift(['js/core/rift.js', 'js/core/state.js', 'data/creatures.js', 'data/axioms.js', 'data/tactics.js',
    'js/battle/abilities.js', 'js/battle/engine.js', 'dev/conditional-cards.js']);
const E = R.Battle.Engine, prefix = 'conditional-', PAPER = prefix + 'paper-token';
const plain = x => JSON.parse(JSON.stringify(x));
const inst = (species, i) => ({ uid: 'im-' + i, species, injuries: [], scars: [] });
function setup(id, { mine, extra = [], theirs = ['second-wind', 'second-wind'], them } = {}) {
    const creature = !!R.data.creatures[id];
    const s = E.createBattle({ seed: 'imagination', players: [
        { name: 'A', team: [creature ? id : 'proof-pup'].concat(mine || ['paper-dragon', 'cloud-calf', 'lens-lizard', 'comma-crab', 'pocket-tortoise']).map(inst), tactics: (creature ? [] : [id]).concat(extra) },
        { name: 'B', team: (them || ['lens-lizard', 'paper-dragon', 'cloud-calf', 'comma-crab', 'proof-pup', 'pocket-tortoise']).map(inst), tactics: theirs }],
    axiomDeck: ['luxury', 'thrift'], options: { first: 0, shuffle: false, shuffleAxioms: false, openHand: [0, 0], openAxioms: 0, spark: false, timeline: false, hearts: 20 } });
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

test('Spare Premise: after your Axiom change it enters and you choose a pair with equal attack; each gets +1 health and heals 1', () => {
    // Lens Lizard, Comma Crab and Pocket Tortoise have 1 attack; Paper Dragon has 2. Three legal pairs.
    let s = setup(prefix + 'reason-spare-premise', { mine: ['lens-lizard', 'comma-crab', 'pocket-tortoise', 'paper-dragon', 'cloud-calf'] });
    ['p0c1', 'p0c2', 'p0c3', 'p0c4'].forEach(cid => move(s, cid, 'board'));
    s.cards.p0c1.damage = 1; s.cards.p0c2.damage = 1;
    s = arm(s, 'p0c0');
    assert.equal(E.armedView(s, 0, 1)[0].condition, 'After you change an Axiom');
    s.players[0].axHand = ['luxury'];
    s = act(fresh(s), { type: 'axiom', choice: 'luxury' });
    assert.equal(s.phase, 'choose', 'a pair to choose');
    assert.deepEqual(plain(s.pending.options), ['p0c1|p0c2', 'p0c1|p0c3', 'p0c2|p0c3'], 'only equal-attack pairs (never Paper Dragon)');
    const hp = cid => plain(E.healthOf(s, cid));
    const before = [hp('p0c1'), hp('p0c2')];
    s = act(s, { type: 'choose', choice: 'p0c1|p0c2' });
    assert.deepEqual([hp('p0c1'), hp('p0c2')].map(h => [h.max, h.current]), before.map(h => [h.max + 1, h.current + 2]));
    assert.ok(s.players[0].board.includes('p0c0'));
});

test('Spare Premise without a legal pair still enters, with no pair effect', () => {
    let s = setup(prefix + 'reason-spare-premise', { mine: ['paper-dragon', 'lens-lizard'] });
    ['p0c1', 'p0c2'].forEach(cid => move(s, cid, 'board'));
    s = arm(s, 'p0c0');
    s.players[0].axHand = ['luxury'];
    s = act(fresh(s), { type: 'axiom', choice: 'luxury' });
    assert.equal(s.phase, 'main');
    assert.ok(s.players[0].board.includes('p0c0'));
    assert.ok(E.fullLog(s).some(e => /no two of your creatures have equal attack/.test(e.text)));
});

test('Wrong Way Round swaps attack and health left until your next turn starts; damage taken meanwhile stays', () => {
    let s = setup(prefix + 'imagination-wrong-way-round', { them: ['cloud-calf', 'lens-lizard'] });   // Cloud Calf 1/4
    s = arm(s, 'p0t0');
    s = pass(s);
    move(s, 'p1c0', 'hand');
    s = act(s, { type: 'play', cid: 'p1c0' });
    assert.equal(E.attackOf(s, 'p1c0'), 4);
    assert.deepEqual(plain(E.healthOf(s, 'p1c0')).current, 1);
    s = pass(s);                                                        // A's turn 3 starts: the swap ends
    assert.equal(E.attackOf(s, 'p1c0'), 1);
    assert.equal(E.healthOf(s, 'p1c0').current, 4);
    // Damage taken while swapped stays when the swap ends. Paper Dragon 2/2 stays 2/2; 1 damage, then the end.
    let t = setup(prefix + 'imagination-wrong-way-round', { them: ['paper-dragon'] });
    t = arm(t, 'p0t0'); t = pass(t);
    move(t, 'p1c0', 'hand'); t = act(t, { type: 'play', cid: 'p1c0' });
    t.cards.p1c0.damage = 1;                                            // a hit while swapped
    t = pass(t);
    assert.deepEqual([E.attackOf(t, 'p1c0'), E.healthOf(t, 'p1c0').max, E.healthOf(t, 'p1c0').current], [2, 2, 1], 'the damage stays');
});

test('Paper Tiger: when your creature is defeated it enters, and a colourless 1/1 paper token joins you; a token\'s loss makes none', () => {
    let s = setup(prefix + 'imagination-paper-tiger');
    move(s, 'p0c1', 'board');                                           // Paper Dragon 2/2
    s = arm(s, 'p0c0');
    s = pass(s);
    move(s, 'p1c1', 'board'); s.cards.p1c1.enteredTurn = 0;            // B's Paper Dragon
    s = act(s, { type: 'attack', cid: 'p1c1', target: 'p0c1' });        // both defeated
    assert.ok(s.players[0].board.includes('p0c0'), 'Paper Tiger revealed');
    const tok = s.players[0].board.find(cid => s.cards[cid].species === PAPER);
    assert.ok(tok, 'a paper token');
    assert.equal(E.colourOf(s, s.cards[tok]), 'none', 'colourless');
    assert.deepEqual([E.attackOf(s, tok), E.healthOf(s, tok).current], [1, 1]);
    assert.ok(!E.lostUids(s, 0).includes(s.cards[tok].uid), 'never a casualty that counts');
});

test('Costume Rehearsal: every paper token on both sides gains a Shield until its controller\'s next turn starts; no second Shield', () => {
    let s = setup(prefix + 'imagination-costume-rehearsal', { extra: ['second-wind'] });
    // Two paper tokens, one each side (made as Paper Tiger would).
    const make = (p, n) => { const cid = 'p' + p + 'k' + n; s.cards[cid] = Object.assign({}, s.cards.p0c1, { cid, uid: 'token-' + cid, species: PAPER, owner: p, controller: p,
        token: true, generic: true, attack: 1, health: 1, baseKeywords: [], buffs: [], gained: [], extraKeywords: [], damage: 0, ability: null }); s.players[p].board.push(cid); return cid; };
    const mine = make(0, 1), theirs = make(1, 2);
    s = arm(s, 'p0t0');
    move(s, 'p0t1', 'hand');
    s = act(fresh(s), { type: 'play', cid: 'p0t1' });                   // your spell: it reveals
    assert.ok(E.hasKeyword(s, mine, 'shield') && E.hasKeyword(s, theirs, 'shield'));
    assert.equal(s.cards[mine].timedKeywords.length, 1);
    s = pass(s);                                                        // B's turn 2 starts: B's token's Shield ends
    assert.ok(!E.hasKeyword(s, theirs, 'shield'));
    assert.ok(E.hasKeyword(s, mine, 'shield'));
    s = pass(s);                                                        // your turn 3 starts: yours ends
    assert.ok(!E.hasKeyword(s, mine, 'shield'));
});

test('Borrowed Tomorrow: your oldest conditional creature in the discard pile goes to the bottom of your deck, still used', () => {
    let s = setup(prefix + 'memory-borrowed-tomorrow');
    // Two used conditional creatures in A's discard pile, oldest first (as if revealed and defeated earlier).
    const add = (n, species) => { const cid = 'p0c' + (10 + n); s.cards[cid] = Object.assign({}, s.cards.p0c1, { cid, uid: 'old-' + n, species, conditionSpent: true }); s.players[0].discard.push(cid); return cid; };
    const oldest = add(1, prefix + 'imagination-paper-tiger'), newer = add(2, prefix + 'generic-spare-umbrella');
    s.players[0].discard.push('p0c2');                                  // an ordinary creature is never taken
    s = arm(s, 'p0t0');
    s = pass(s);
    move(s, 'p1t0', 'hand');
    s = act(s, { type: 'play', cid: 'p1t0' });
    assert.equal(s.players[0].deck.at(-1), oldest);
    assert.equal(s.cards[oldest].conditionSpent, true, 'its used condition stays used');
    assert.equal(s.cards[oldest].uid, 'old-1', 'the same instance');
    assert.ok(s.players[0].discard.includes(newer));
    // Drawn again, it is played as an ordinary body: no rearming.
    move(s, oldest, 'hand');
    s = pass(s);
    s = act(fresh(s), { type: 'play', cid: oldest });
    assert.ok(s.players[0].board.includes(oldest));
    assert.ok(!s.players[0].armed.includes(oldest));
});

test('Borrowed Tomorrow with no conditional creature in the pile is used up in public and moves nothing', () => {
    let s = setup(prefix + 'memory-borrowed-tomorrow');
    s = arm(s, 'p0t0'); s = pass(s);
    move(s, 'p1t0', 'hand');
    const deck = s.players[0].deck.slice();
    s = act(s, { type: 'play', cid: 'p1t0' });
    assert.deepEqual(plain(s.players[0].deck), plain(deck));
    assert.ok(E.fullLog(s).some(e => /no conditional creature in your discard pile/.test(e.text)));
});

test('all 23 conditional concepts are playable study cards, and each arms legally', () => {
    assert.equal(R.ConditionalStudy.ids.length, 23);
    for (const id of R.ConditionalStudy.ids) {
        let s = setup(id);
        s = arm(s, R.data.creatures[id] ? 'p0c0' : 'p0t0');
        assert.equal(s.players[0].armed.length, 1, id);
    }
});
