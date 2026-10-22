// #148 step 1 (design/drafts/conditional-expansion-2026-10-13/NEXT-STEPS.md): effects with a lifetime tied to a
// controller's turn. Premise Pending (−2 attack until the end of its controller's next turn), Standing Ovation
// (+1 attack until your next turn starts), Velvet Reveal (loses Elusive until its controller's next turn starts),
// The Chair Recognises You (Guard until its controller's next turn starts, no second Guard) and Spare Umbrella
// (a Shield until your next turn starts that never revives a used printed one). Damage and the creature's own
// keywords are unchanged when an effect ends, a card bounces, or Silence applies.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';

const R = loadRift(['js/core/rift.js', 'js/core/state.js', 'data/creatures.js', 'data/axioms.js', 'data/tactics.js',
    'js/battle/abilities.js', 'js/battle/engine.js', 'js/battle/conditional-cards.js']);
const E = R.Battle.Engine, prefix = 'conditional-';
const plain = x => JSON.parse(JSON.stringify(x));
const inst = (species, i) => ({ uid: 'life-' + i, species, injuries: [], scars: [] });
// A's first card is the study card (creature or spell); B's team is given.
function setup(id, them, mineExtra) {
    const creature = !!R.data.creatures[id];
    const s = E.createBattle({ seed: 'lifetimes', players: [
        { name: 'A', team: [creature ? id : 'proof-pup', 'paper-dragon', 'cloud-calf', 'lens-lizard', 'comma-crab', 'rawmsay'].concat(mineExtra || []).map(inst), tactics: creature ? ['second-wind', 'rethink'] : [id, 'second-wind'] },
        { name: 'B', team: (them || ['lens-lizard', 'paper-dragon', 'cloud-calf', 'rawmsay', 'comma-crab', 'proof-pup']).map(inst), tactics: ['second-wind'] }],
    axiomDeck: ['luxury'], options: { first: 0, shuffle: false, shuffleAxioms: false, openHand: [0, 0], openAxioms: 0, spark: false, timeline: false, hearts: 20 } });
    s.phase = 'main'; s.players.forEach(P => { P.energy = 10; P.capacity = 10; });
    move(s, creature ? 'p0c0' : 'p0t0', 'hand');
    return s;
}
function move(s, cid, zone) {
    const p = s.cards[cid].owner;
    s.players.forEach(P => ['deck', 'hand', 'board', 'discard', 'armed'].forEach(z => { P[z] = P[z].filter(c => c !== cid); }));
    s.players[p][zone].push(cid); s.cards[cid].enteredTurn = 0;
}
const act = (s, a) => E.applyAction(s, { ...a, player: E.decider(s) });
const fresh = s => { s.players.forEach(P => { P.energy = 10; P.playsThisTurn = 0; }); return s; };
// End this turn and take the next player's draw.
function pass(s) { s = act(s, { type: 'end' }); const d = E.legalActions(s).find(a => a.type === 'draw'); return d ? fresh(act(s, d)) : fresh(s); }
function arm(s, cid, choice) {
    s = act(fresh(s), { type: 'play', cid });
    if (s.phase === 'choose') s = act(s, choice ? { type: 'choose', choice } : E.legalActions(s)[0]);
    return s;
}
const kw = (s, cid) => plain(E.keywordsOf(s, cid));

test('Premise Pending: the biggest new arrival gets −2 attack until the end of its controller\'s next turn', () => {
    let s = setup(prefix + 'reason-premise-pending', ['paper-dragon', 'lens-lizard']);
    move(s, 'p0c3', 'board');                               // A: Lens Lizard, 1 attack
    s = arm(s, 'p0t0');
    s = pass(s);                                            // B's turn (turn 2)
    move(s, 'p1c0', 'hand');
    const before = E.attackOf(s, 'p1c0');
    assert.ok(before > 1);
    s = act(s, { type: 'play', cid: 'p1c0' });
    assert.equal(E.attackOf(s, 'p1c0'), Math.max(0, before - 2));
    assert.deepEqual(plain(E.activeEffects(s, 'p1c0').filter(x => x.label === 'Premise Pending').map(x => [x.until, x.from])), [['next-turn', 4]]);
    s = pass(s);                                            // A's turn 3: still smaller
    assert.equal(E.attackOf(s, 'p1c0'), Math.max(0, before - 2));
    s = pass(s);                                            // B's turn 4
    assert.equal(E.attackOf(s, 'p1c0'), Math.max(0, before - 2));
    s = pass(s);                                            // B's turn 4 ended
    assert.equal(E.attackOf(s, 'p1c0'), before);
});

test('Premise Pending is used up with no effect when the arrival is not bigger than all of yours', () => {
    let s = setup(prefix + 'reason-premise-pending', ['lens-lizard', 'paper-dragon']);
    move(s, 'p0c1', 'board');                               // A: Paper Dragon, the big one
    s = arm(s, 'p0t0');
    s = pass(s);
    move(s, 'p1c0', 'hand');
    const before = E.attackOf(s, 'p1c0');
    s = act(s, { type: 'play', cid: 'p1c0' });
    assert.equal(E.attackOf(s, 'p1c0'), before);
    assert.equal(s.players[0].armed.length, 0, 'consumed');
    assert.ok(s.lastEvents.some(e => /is not the biggest/.test(e.text)));
});

test('Velvet Reveal: an Elusive arrival loses Elusive until its controller\'s next turn starts, then has it back', () => {
    let s = setup(prefix + 'perception-velvet-reveal', ['shakirattle', 'lens-lizard']);
    s = arm(s, 'p0t0');
    s = pass(s);                                            // B's turn 2
    move(s, 'p1c0', 'hand');
    s = act(s, { type: 'play', cid: 'p1c0' });
    assert.ok(!kw(s, 'p1c0').includes('elusive'));
    assert.match(s.lastEvents.map(e => e.text).join(' '), /loses Elusive until its controller’s next turn starts/);
    s = pass(s);                                            // A's turn 3: it can be targeted now
    assert.ok(!E.hasKeyword(s, 'p1c0', 'elusive'));
    s = pass(s);                                            // B's turn 4 starts: Elusive is back
    assert.ok(E.hasKeyword(s, 'p1c0', 'elusive'));
    assert.equal(s.cards.p1c0.timedKeywords, null);
});

test('Velvet Reveal on a creature that is not Elusive is used up and changes nothing', () => {
    let s = setup(prefix + 'perception-velvet-reveal', ['lens-lizard']);
    s = arm(s, 'p0t0'); s = pass(s);
    move(s, 'p1c0', 'hand');
    s = act(s, { type: 'play', cid: 'p1c0' });
    assert.equal(s.players[0].armed.length, 0);
    assert.equal(s.cards.p1c0.timedKeywords || null, null);
});

test('Standing Ovation: revealed by an enemy spell, your creatures get +1 attack until your next turn starts', () => {
    let s = setup(prefix + 'emotion-standing-ovation');
    move(s, 'p0c1', 'board');
    const dragon = E.attackOf(s, 'p0c1');
    s = arm(s, 'p0c0');
    s = pass(s);                                            // B's turn 2
    move(s, 'p1t0', 'hand');
    s.cards.p0c1.damage = 1;
    s = act(s, { type: 'play', cid: 'p1t0' });              // a spell: the masked creature reveals
    assert.ok(s.players[0].board.includes('p0c0'));
    assert.equal(E.attackOf(s, 'p0c1'), dragon + 1);
    assert.equal(E.attackOf(s, 'p0c0'), R.data.creatures[prefix + 'emotion-standing-ovation'].attack + 1);
    assert.deepEqual(plain(E.activeEffects(s, 'p0c1').filter(x => x.label === 'Standing Ovation').map(x => [x.until, x.from])), [['turn-start', 3]]);
    const damage = s.cards.p0c1.damage;
    s = pass(s);                                            // A's turn 3 starts: the boost ends
    assert.equal(E.attackOf(s, 'p0c1'), dragon);
    assert.equal(s.cards.p0c1.damage, damage, 'damage stays');
});

test('The Chair Recognises You: the chosen side\'s next creature gains Guard until its controller\'s next turn starts; no second Guard', () => {
    // Opponent option: B's next creature must take the front seat.
    let s = setup(prefix + 'language-chair-recognises', ['lens-lizard', 'proof-pup']);
    s = arm(s, 'p0c0', 'creature-played:opponent');
    assert.equal(E.armedView(s, 0, 1)[0].condition, 'After the opponent plays a creature', 'face-up: the opponent sees it');
    s = pass(s);                                            // B's turn 2
    move(s, 'p1c0', 'hand');
    s = act(s, { type: 'play', cid: 'p1c0' });
    assert.ok(E.hasKeyword(s, 'p1c0', 'guard'));
    assert.deepEqual(plain(E.activeEffects(s, 'p1c0').filter(x => x.stat === 'keyword').map(x => [x.keyword, x.amount, x.until, x.from])), [['guard', 1, 'turn-start', 4]]);
    s = pass(s);                                            // A's turn 3: B's creature must be attacked first
    assert.ok(E.hasKeyword(s, 'p1c0', 'guard'));
    s = pass(s);                                            // B's turn 4 starts: the Guard ends
    assert.ok(!E.hasKeyword(s, 'p1c0', 'guard'));
    // A creature that already has Guard gains no second one, and keeps its own when the turn comes.
    let t = setup(prefix + 'language-chair-recognises', ['proof-pup']);
    t = arm(t, 'p0c0', 'creature-played:opponent'); t = pass(t);
    move(t, 'p1c0', 'hand'); t = act(t, { type: 'play', cid: 'p1c0' });
    assert.equal(t.cards.p1c0.timedKeywords || null, null);
    assert.match(t.lastEvents.map(e => e.text).join(' '), /already has Guard/);
    t = pass(t); t = pass(t);
    assert.ok(E.hasKeyword(t, 'p1c0', 'guard'), 'its printed Guard stays');
});

test('Spare Umbrella: your creature with the least health left gets a Shield until your next turn starts', () => {
    let s = setup(prefix + 'generic-spare-umbrella', null, ['proof-pup']);
    move(s, 'p0c1', 'board'); move(s, 'p0c2', 'board');
    s.cards.p0c2.damage = 3;                                // Cloud Calf: 1 health left (the least)
    s = arm(s, 'p0c0');
    move(s, 'p0t0', 'hand');
    s = act(fresh(s), { type: 'play', cid: 'p0t0' });       // your spell: the Umbrella reveals
    assert.ok(E.hasKeyword(s, 'p0c2', 'shield'));
    s = pass(s);                                            // B's turn: the Shield takes the first hit
    move(s, 'p1c0', 'board'); s.cards.p1c0.enteredTurn = 0;
    s = act(s, { type: 'attack', cid: 'p1c0', target: 'p0c2' });
    assert.ok(s.lastEvents.some(e => e.t === 'shield' && e.cid === 'p0c2'));
    assert.equal(s.cards.p0c2.damage, 3, 'blocked');
    assert.ok(!E.hasKeyword(s, 'p0c2', 'shield'), 'used up');
    s = pass(s);
    assert.equal(s.cards.p0c2.timedKeywords || null, null);
});

test('a timed Shield never revives a used printed Shield, and does not stack with an unused one', () => {
    let s = setup(prefix + 'generic-spare-umbrella', null, ['proof-pup']);
    move(s, 'p0c1', 'board');
    s.cards.p0c1.baseKeywords = ['shield']; s.cards.p0c1.shieldUsed = true;   // its own Shield already used
    s = arm(s, 'p0c0');
    move(s, 'p0t0', 'hand');
    s = act(fresh(s), { type: 'play', cid: 'p0t0' });
    // The least health left: Paper Dragon (2) vs the Umbrella itself (2): the older one, Paper Dragon.
    assert.ok(E.hasKeyword(s, 'p0c1', 'shield'));
    s = pass(s);
    move(s, 'p1c0', 'board'); s.cards.p1c0.enteredTurn = 0;
    s = act(s, { type: 'attack', cid: 'p1c0', target: 'p0c1' });
    assert.ok(!E.hasKeyword(s, 'p0c1', 'shield'));
    assert.equal(s.cards.p0c1.shieldUsed, true, 'the printed one stays used');
    // An unused Shield: no second one.
    let t = setup(prefix + 'generic-spare-umbrella', null, ['proof-pup']);
    move(t, 'p0c1', 'board'); t.cards.p0c1.baseKeywords = ['shield'];
    t = arm(t, 'p0c0'); move(t, 'p0t0', 'hand');
    t = act(fresh(t), { type: 'play', cid: 'p0t0' });
    assert.equal(t.cards.p0c1.timedKeywords || null, null);
    assert.match(t.lastEvents.map(e => e.text).join(' '), /already has a Shield/);
});

test('bounce and Silence: a timed keyword never outlives the creature leaving play, and Silence hides it', () => {
    let s = setup(prefix + 'language-chair-recognises', ['lens-lizard']);
    s = arm(s, 'p0c0', 'creature-played:opponent'); s = pass(s);
    move(s, 'p1c0', 'hand'); s = act(s, { type: 'play', cid: 'p1c0' });
    assert.ok(E.hasKeyword(s, 'p1c0', 'guard'));
    const silenced = E.cloneState(s); silenced.cards.p1c0.silenced = true;
    assert.ok(!E.hasKeyword(silenced, 'p1c0', 'guard'), 'Silence: no keywords at all');
    assert.ok(E.hasKeyword(s, 'p1c0', 'guard'), 'the copy changed, not the original');
    // Rethink bounces it on A's turn: it returns with nothing timed, and replaying it gives no Guard.
    s = pass(s);
    move(s, 'p0t1', 'hand');                                // Rethink
    s = act(fresh(s), { type: 'play', cid: 'p0t1', target: 'p1c0' });
    assert.ok(s.players[1].hand.includes('p1c0'));
    assert.equal(s.cards.p1c0.timedKeywords, null);
    s = pass(s);
    s = act(s, { type: 'play', cid: 'p1c0' });
    assert.ok(!E.hasKeyword(s, 'p1c0', 'guard'), 'a used condition does not fire again');
});

test('the whole state with timed effects survives a JSON round trip and ends them the same way', () => {
    let s = setup(prefix + 'emotion-standing-ovation');
    move(s, 'p0c1', 'board');
    s = arm(s, 'p0c0'); s = pass(s);
    move(s, 'p1t0', 'hand'); s = act(s, { type: 'play', cid: 'p1t0' });
    const copy = JSON.parse(JSON.stringify(s));
    const a = pass(s), b = pass(copy);
    assert.equal(E.attackOf(a, 'p0c1'), E.attackOf(b, 'p0c1'));
    assert.deepEqual(plain(a.cards.p0c1.buffs), plain(b.cards.p0c1.buffs));
});
