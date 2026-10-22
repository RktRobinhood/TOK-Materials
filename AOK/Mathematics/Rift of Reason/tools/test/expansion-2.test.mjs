// #129 expansion-2: the second small audited catalogue batch. Hooks, empty and no-target paths,
// re-entry bounds, sources (catches and packs) and backup survival. Mirrors expansion-foundation.test.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { Rift as R, E, AI, setup, act, onBoard, toHand, pass, rule, invariants } from './battle-helpers.mjs';
import { loadRift, GAME_DIR } from './harness.mjs';

const CREATURES = ['reason-diagonal-deer', 'emotion-resolve-ram', 'perception-scout-stoat', 'language-label-lemur', 'imagination-possibility-pika'];
const SPELLS = ['emotion-share-the-feeling', 'memory-remember-the-guard', 'generic-warm-blanket'];
const BATCH = CREATURES.concat(SPELLS);
const narrow = { deckSize: 4, minCreatures: 0, maxCreatures: 4 };
const battle = opts => setup({ ...opts, options: { ...narrow, deckSize: Math.max(1, (opts.p0 || []).length + (opts.t0 || []).length, (opts.p1 || []).length + (opts.t1 || []).length), ...(opts.options || {}) } });
const play = (s, cid, target) => act(toHand(s, cid), { type: 'play', cid, ...(target ? { target } : {}) });
const choose = (s, choice) => act(s, { type: 'choose', choice });
const atk = (s, cid) => E.attackOf(s, cid);
const kws = (s, cid) => Array.from(E.describe(s, cid).keywords);

test('the batch is eight released, pack-eligible catalogue IDs whose data matches the reviewed contract', () => {
    const cat = JSON.parse(fs.readFileSync(path.join(GAME_DIR, 'design/drafts/card-arena-2026-10-12/card-catalogue.json'), 'utf8'));
    const assets = fs.readFileSync(path.join(GAME_DIR, 'data/assets.js'), 'utf8');
    for (const id of BATCH) {
        const row = cat.cards.find(c => c.id === id), d = R.data.creatures[id] || R.data.tactics[id];
        assert.ok(row && d, id);
        assert.equal(d.release, 'expansion-2', id); assert.equal(d.packEligible, true, id);
        assert.equal(row.runtimeRelease, 'expansion-2', id); assert.equal(row.acquisition.packEligible, true, id);
        assert.equal(d.rarity, row.rarity, id); assert.equal(d.cost, row.cost, id);
        if (row.kind === 'creature') {
            assert.equal(d.attack, row.attack, id); assert.equal(d.health, row.health, id);
            assert.equal(d.colour, row.affinity, id); assert.equal(d.lines.length, 0, id + ' is unvoiced');
            assert.ok(R.Battle.Abilities[d.ability], id + ' has a real handler');
            assert.ok(assets.includes("'creature/" + id + "/idle'"), id + ' uses its existing portrait');
        } else {
            assert.ok(typeof d.run === 'function' && d.target, id + ' has a real handler');
            assert.equal(d.colour || 'generic', row.affinity, id);
            assert.ok(assets.includes("'" + d.art + "'"), id + ' uses an existing motif');
        }
    }
    const rarities = new Set(BATCH.map(id => (R.data.creatures[id] || R.data.tactics[id]).rarity));
    assert.ok(rarities.has('rare') && rarities.has('uncommon'), 'more than Commons');
    assert.equal(new Set(BATCH.map(id => cat.cards.find(c => c.id === id).affinity)).size, 7, 'all six Ways plus generic');
});

test('Grant compares attack on the board and strips only an equal, targetable enemy', () => {
    let s = battle({ p0: ['reason-diagonal-deer'], p1: ['lobstorian', 'beastie'] }); onBoard(s, 'p1c0', 'p1c1');
    s.cards.p1c0.attack = 3; s.cards.p1c1.attack = 1;
    s = play(s, 'p0c0'); // one match: no choice needed
    assert.equal(s.phase, 'main'); assert.equal(s.cards.p1c0.silenced, true); assert.ok(!kws(s, 'p1c0').includes('guard'));
    assert.equal(!!s.cards.p1c1.silenced, false);
    // Two matches → a choice; an Elusive one is never offered.
    let two = battle({ p0: ['reason-diagonal-deer'], p1: ['lobstorian', 'beastie', 'shakirattle'] }); onBoard(two, 'p1c0', 'p1c1', 'p1c2');
    ['p1c0', 'p1c1', 'p1c2'].forEach(cid => { two.cards[cid].attack = 3; });
    two = play(two, 'p0c0'); assert.equal(two.phase, 'choose');
    assert.deepEqual(Array.from(two.pending.options).sort(), ['p1c0', 'p1c1']);
    two = choose(two, 'p1c1'); assert.equal(two.cards.p1c1.silenced, true); assert.equal(!!two.cards.p1c0.silenced, false);
    // An aura on our side raises Grant to 4 first, so the 4-attack enemy is the match.
    let aura = battle({ p0: ['reason-diagonal-deer', 'beeyonce'], p1: ['lobstorian', 'beastie'] }); onBoard(aura, 'p0c1', 'p1c0', 'p1c1');
    aura.cards.p1c0.attack = 3; aura.cards.p1c1.attack = 4;
    aura = play(aura, 'p0c0'); assert.equal(atk(aura, 'p0c0'), 4); assert.equal(aura.cards.p1c1.silenced, true); assert.equal(!!aura.cards.p1c0.silenced, false);
    // No match: the creature still enters; nothing is pending.
    let none = battle({ p0: ['reason-diagonal-deer'], p1: ['beastie'] }); onBoard(none, 'p1c0'); none.cards.p1c0.attack = 1;
    none = play(none, 'p0c0');
    assert.equal(none.phase, 'main'); assert.ok(none.players[0].board.includes('p0c0')); assert.equal(!!none.cards.p1c0.silenced, false);
    assert.ok(none.lastEvents.some(e => /finds no enemy with 3 attack/.test(e.text || '')));
});

test('Greta has Guard and +1 attack only while her controller is at 4 hearts or fewer', () => {
    const s = battle({ p0: ['emotion-resolve-ram'] }); onBoard(s, 'p0c0');
    assert.ok(kws(s, 'p0c0').includes('guard'));
    for (const [hearts, attack] of [[10, 2], [5, 2], [4, 3], [1, 3]]) { s.players[0].hearts = hearts; assert.equal(atk(s, 'p0c0'), attack, hearts + ' hearts'); }
    rule(s, 'empty-set'); assert.equal(atk(s, 'p0c0'), 2, 'abilities off'); assert.ok(!kws(s, 'p0c0').includes('guard'));
});

test('Nelly privately moves exactly one of the top two cards to the bottom', () => {
    for (const [pick, order] of [['p0t1', ['p0t0', 'p0t2', 'p0t1']], ['p0t0', ['p0t1', 'p0t2', 'p0t0']]]) {
        let s = battle({ p0: ['perception-scout-stoat'], t0: ['counterexample', 'generic-small-patch', 'lemma'] });
        s.players[0].deck = ['p0t0', 'p0t1', 'p0t2']; const count = Object.keys(s.cards).length;
        s = play(s, 'p0c0'); assert.equal(s.phase, 'choose');
        assert.deepEqual(Array.from(s.pending.options), ['p0t0', 'p0t1']);
        assert.equal(s.players[1].knows.includes('p0t0') || s.players[1].knows.includes('p0t1'), false);
        s = choose(s, pick);
        assert.deepEqual(Array.from(s.players[0].deck), order); assert.equal(s.players[0].hand.length, 0);
        assert.equal(Object.keys(s.cards).length, count, 'no copy is made');
        const ev = s.lastEvents.find(e => e.privateTo === 0 && /bottom/.test(e.text));
        assert.ok(ev && !/Counterexample|Small Patch|Lemma/.test(ev.publicText), 'the opponent only hears that a card moved');
    }
    // Empty or single-card deck: nothing to choose and nothing moves.
    for (const deck of [[], ['p0t0']]) {
        let s = battle({ p0: ['perception-scout-stoat'], t0: ['counterexample'] }); s.players[0].deck = deck.slice();
        s = play(s, 'p0c0'); assert.equal(s.phase, 'main'); assert.deepEqual(Array.from(s.players[0].deck), deck);
    }
});

test('Nelly never leaks the hidden order to a preview or an AI plan', () => {
    const s = battle({ p0: ['perception-scout-stoat', 'lens-lizard'], p1: ['beastie'], t0: ['counterexample', 'generic-small-patch'], energy: 3 });
    onBoard(s, 'p1c0'); toHand(s, 'p0c0', 'p0c1'); s.players[0].deck = ['p0t0', 'p0t1'];
    const a = { type: 'play', player: 0, cid: 'p0c0' }, before = JSON.stringify(s);
    const first = E.previewAction(s, a, 0);
    s.players[0].deck.reverse(); const second = E.previewAction(s, a, 0); s.players[0].deck.reverse();
    assert.deepEqual(JSON.parse(JSON.stringify(first)), JSON.parse(JSON.stringify(second)));
    assert.doesNotMatch(JSON.stringify(first), /Counterexample|Small Patch/);
    for (const level of ['normal', 'competent', 'expert']) for (const salt of [0, 1]) {
        const pick = AI.choose(s, { level, salt }); assert.equal(JSON.stringify(s), before, 'planning never changes the battle');
        const hidden = E.cloneState(s); hidden.players[0].deck.reverse();
        assert.equal(E.actionKey(AI.choose(hidden, { level, salt })), E.actionKey(pick), level + ' ' + salt);
    }
});

test('Ryan gives −1 attack until the end of the target\'s next turn, never below zero', () => {
    let s = battle({ p0: ['language-label-lemur'], p1: ['beastie', 'lobstorian'] }); onBoard(s, 'p1c0', 'p1c1');
    s.cards.p1c0.attack = 3; s.cards.p1c1.attack = 0;
    s = play(s, 'p0c0', 'p1c0'); assert.equal(atk(s, 'p1c0'), 2);
    s = pass(s); assert.equal(s.active, 1); assert.equal(atk(s, 'p1c0'), 2, 'still lower during its own turn');
    s = pass(s); assert.equal(atk(s, 'p1c0'), 3, 'gone after that turn ends');
    let zero = battle({ p0: ['language-label-lemur'], p1: ['lobstorian'] }); onBoard(zero, 'p1c0'); zero.cards.p1c0.attack = 0;
    zero = play(zero, 'p0c0', 'p1c0');
    assert.equal(zero.cards.p1c0.buffs.length, 0, 'nothing stored on a zero-attack creature'); zero.cards.p1c0.buffs.push({ label: 'later', attack: 2, health: 0 });
    assert.equal(atk(zero, 'p1c0'), 2);
    // Elusive enemies cannot be chosen; with no legal target the Entrance fizzles and the body still lands.
    const elusive = battle({ p0: ['language-label-lemur'], p1: ['shakirattle'] }); onBoard(elusive, 'p1c0'); toHand(elusive, 'p0c0');
    assert.ok(E.legalActions(elusive).some(a => a.type === 'play' && a.cid === 'p0c0' && !a.target));
    const alone = play(battle({ p0: ['language-label-lemur'] }), 'p0c0');
    assert.ok(alone.players[0].board.includes('p0c0')); assert.ok(alone.lastEvents.some(e => e.t === 'fizzle'));
});

test('PewDiePika chooses one mode once: +1 attack, or +1 maximum health and heal 1', () => {
    for (const [choice, a, h] of [['attack', 3, 2], ['health', 2, 3]]) {
        let s = play(battle({ p0: ['imagination-possibility-pika'] }), 'p0c0');
        assert.equal(s.phase, 'choose'); assert.deepEqual(Array.from(s.pending.options), ['attack', 'health']);
        s = choose(s, choice);
        const d = E.describe(s, 'p0c0'); assert.equal(d.attack, a); assert.equal(d.health, h); assert.equal(s.phase, 'main');
    }
});

test('Share the Feeling: survive for +2 until the caster\'s next turn; a 1-health target just dies', () => {
    let s = battle({ p0: ['paper-dragon'], t0: ['emotion-share-the-feeling'] }); onBoard(s, 'p0c0');
    const base = atk(s, 'p0c0');
    s = play(s, 'p0t0', 'p0c0'); assert.equal(atk(s, 'p0c0'), base + 2); assert.equal(s.cards.p0c0.damage, 1);
    s = pass(s); assert.equal(atk(s, 'p0c0'), base + 2, 'lasts through the opponent\'s turn');
    s = pass(s); assert.equal(atk(s, 'p0c0'), base, 'ends when the caster\'s next turn starts');
    let frail = battle({ p0: ['paper-dragon'], t0: ['emotion-share-the-feeling'] }); onBoard(frail, 'p0c0');
    frail.cards.p0c0.health = 1; frail = play(frail, 'p0t0', 'p0c0');
    assert.ok(frail.players[0].discard.includes('p0c0')); assert.equal(frail.cards.p0c0.buffs.length, 0);
    // A Shield blocks the 1 damage; the creature survives and still gets the attack.
    let shielded = battle({ p0: ['paper-dragon'], t0: ['emotion-share-the-feeling'] }); onBoard(shielded, 'p0c0');
    shielded.cards.p0c0.extraKeywords.push('shield'); shielded = play(shielded, 'p0t0', 'p0c0');
    assert.equal(shielded.cards.p0c0.damage, 0); assert.equal(atk(shielded, 'p0c0'), base + 2); assert.ok(!kws(shielded, 'p0c0').includes('shield'));
});

test('Remember the Guard and Warm Blanket last until the caster\'s next turn and never stack a second copy', () => {
    let s = battle({ p0: ['paper-dragon'], t0: ['memory-remember-the-guard', 'generic-warm-blanket'] }); onBoard(s, 'p0c0');
    s.cards.p0c0.health = 6; s.cards.p0c0.damage = 5;
    s = play(s, 'p0t0', 'p0c0'); assert.ok(kws(s, 'p0c0').includes('guard')); assert.equal(s.cards.p0c0.damage, 3);
    s = play(s, 'p0t1', 'p0c0'); assert.ok(kws(s, 'p0c0').includes('shield')); assert.equal(s.cards.p0c0.damage, 1);
    assert.equal(E.healthOf(s, 'p0c0').max, 6, 'healing never raises maximum health');
    s = pass(s); assert.ok(kws(s, 'p0c0').includes('guard') && kws(s, 'p0c0').includes('shield'));
    s = pass(s); assert.ok(!kws(s, 'p0c0').includes('guard') && !kws(s, 'p0c0').includes('shield'), 'both end at the caster\'s turn start');
    // A creature that already has the keyword gains no second copy, but is still healed.
    let guard = battle({ p0: ['proof-pup'], t0: ['memory-remember-the-guard'] }); onBoard(guard, 'p0c0'); guard.cards.p0c0.damage = 2;
    guard = play(guard, 'p0t0', 'p0c0'); assert.equal(guard.cards.p0c0.timedKeywords, undefined); assert.equal(guard.cards.p0c0.damage, 0);
    // The timed Shield is used up by the first damage.
    let blanket = battle({ p0: ['paper-dragon'], p1: ['beastie'], t0: ['generic-warm-blanket'] }); onBoard(blanket, 'p0c0', 'p1c0');
    blanket = play(blanket, 'p0t0', 'p0c0');
    blanket.cards.p0c0.damage = 0; blanket = pass(blanket);
    blanket = act(blanket, { type: 'attack', cid: 'p1c0', target: 'p0c0' });
    assert.equal(blanket.cards.p0c0.damage, 0); assert.ok(!kws(blanket, 'p0c0').includes('shield'));
});

test('spells need a friendly creature; with none they are not offered', () => {
    for (const id of SPELLS) {
        const s = battle({ p1: ['beastie'], t0: [id] }); onBoard(s, 'p1c0'); toHand(s, 'p0t0');
        assert.equal(E.legalActions(s).some(a => a.type === 'play' && a.cid === 'p0t0'), false, id);
    }
});

test('Empty Set turns off every new Entrance; re-entry needs another paid play', () => {
    for (const id of ['reason-diagonal-deer', 'perception-scout-stoat', 'language-label-lemur', 'imagination-possibility-pika']) {
        let s = battle({ p0: [id], p1: ['beastie'], t0: ['counterexample', 'lemma'] }); onBoard(s, 'p1c0'); s.cards.p1c0.attack = 3; rule(s, 'empty-set');
        s.players[0].deck = ['p0t0', 'p0t1']; toHand(s, 'p0c0');
        assert.ok(E.legalActions(s).some(a => a.type === 'play' && a.cid === 'p0c0' && !a.target), id + ' asks for no target');
        s = play(s, 'p0c0'); assert.equal(s.phase, 'main', id); assert.equal(!!s.cards.p1c0.silenced, false); assert.deepEqual(Array.from(s.players[0].deck), ['p0t0', 'p0t1']);
        assert.equal(atk(s, 'p1c0'), 3, id); assert.equal(s.cards.p0c0.buffs.length, 0, id);
        delete s.axioms.active[R.data.axioms['empty-set'].category];
        s = pass(s);
        assert.equal(s.phase, 'main', id + ' does not fire late'); assert.equal(!!s.cards.p1c0.silenced, false, id);
        assert.equal(s.cards.p0c0.buffs.length, 0, id); assert.equal(s.cards.p1c0.buffs.length, 0, id);
    }
    // Rethink returns Grant to hand; the next Entrance costs a fresh play, energy and activation.
    let s = battle({ p0: ['reason-diagonal-deer'], p1: ['beastie'], t0: ['rethink'] }); onBoard(s, 'p1c0'); s.cards.p1c0.attack = 3;
    s = play(s, 'p0c0'); s.cards.p1c0.silenced = false;
    s = play(s, 'p0t0', 'p0c0'); assert.ok(s.players[0].hand.includes('p0c0')); assert.equal(s.cards.p1c0.silenced, false, 'leaving play fires nothing');
    assert.equal(E.legalActions(s).some(a => a.type === 'play' && a.cid === 'p0c0'), false, 'two activations used: no free replay this turn');
    s.players[0].playsThisTurn = 0; s.players[0].energy = 10;
    s = act(s, { type: 'play', cid: 'p0c0' });
    assert.equal(s.players[0].energy, 6); assert.equal(s.players[0].playsThisTurn, 1, 'a second Entrance is a fresh paid play');
    assert.equal(s.cards.p1c0.silenced, true);
});

test('replays and repeat casts: each one is a fresh paid play, and nothing doubles beyond its own effect', () => {
    const fresh = s => { s.players[0].playsThisTurn = 0; s.players[0].energy = 10; return s; };
    // Rethink clears PewDiePika's boost; the replay asks again and gives one more boost, not two.
    let pika = battle({ p0: ['imagination-possibility-pika'], t0: ['rethink'] });
    pika = choose(play(pika, 'p0c0'), 'attack'); assert.equal(atk(pika, 'p0c0'), 3);
    pika = play(pika, 'p0t0', 'p0c0'); assert.equal(pika.cards.p0c0.buffs.length, 0, 'leaving play clears the boost');
    pika = choose(act(fresh(pika), { type: 'play', cid: 'p0c0' }), 'attack');
    assert.equal(atk(pika, 'p0c0'), 3); assert.equal(pika.players[0].energy, 8);
    // Nelly's replay looks at the new top two once, and moves one card only.
    let nelly = battle({ p0: ['perception-scout-stoat'], t0: ['rethink', 'counterexample', 'lemma', 'generic-small-patch'] });
    nelly.players[0].deck = ['p0t1', 'p0t2', 'p0t3'];
    nelly = choose(play(nelly, 'p0c0'), 'p0t1'); assert.deepEqual(Array.from(nelly.players[0].deck), ['p0t2', 'p0t3', 'p0t1']);
    nelly = play(nelly, 'p0t0', 'p0c0'); assert.deepEqual(Array.from(nelly.players[0].deck), ['p0t2', 'p0t3', 'p0t1'], 'leaving play moves nothing');
    nelly = act(fresh(nelly), { type: 'play', cid: 'p0c0' }); assert.deepEqual(Array.from(nelly.pending.options), ['p0t2', 'p0t3']);
    nelly = choose(nelly, 'p0t2'); assert.deepEqual(Array.from(nelly.players[0].deck), ['p0t3', 'p0t1', 'p0t2']); assert.equal(nelly.phase, 'main');
    // Two Ryans on one target give −2 with the same end; the target never goes below 0.
    let ryan = battle({ p0: ['language-label-lemur', 'language-label-lemur'], p1: ['beastie'] }); onBoard(ryan, 'p1c0'); ryan.cards.p1c0.attack = 3;
    ryan = play(ryan, 'p0c0', 'p1c0'); ryan = play(fresh(ryan), 'p0c1', 'p1c0'); assert.equal(atk(ryan, 'p1c0'), 1);
    assert.equal(ryan.cards.p1c0.buffs.length, 2); ryan = pass(pass(ryan)); assert.equal(atk(ryan, 'p1c0'), 3, 'both end together');
    let low = battle({ p0: ['language-label-lemur', 'language-label-lemur'], p1: ['beastie'] }); onBoard(low, 'p1c0'); low.cards.p1c0.attack = 1;
    low = play(low, 'p0c0', 'p1c0'); low = play(fresh(low), 'p0c1', 'p1c0');
    assert.equal(atk(low, 'p1c0'), 0); assert.equal(low.cards.p1c0.buffs.length, 1, 'the second finds no attack to lose');
    assert.ok(low.lastEvents.some(e => /no attack to lose/.test(e.text || '')));
    // Share the Feeling twice: two separate casts, 2 damage, +4, and both end at the caster's next turn.
    let share = battle({ p0: ['paper-dragon'], t0: ['emotion-share-the-feeling', 'emotion-share-the-feeling'] }); onBoard(share, 'p0c0');
    const base = atk(share, 'p0c0'); share.cards.p0c0.health = 5;
    share = play(share, 'p0t0', 'p0c0'); share = play(fresh(share), 'p0t1', 'p0c0');
    assert.equal(share.cards.p0c0.damage, 2); assert.equal(atk(share, 'p0c0'), base + 4);
    share = pass(pass(share)); assert.equal(atk(share, 'p0c0'), base);
    // Warm Blanket twice: the second heals but adds no second Shield.
    let warm = battle({ p0: ['paper-dragon'], t0: ['generic-warm-blanket', 'generic-warm-blanket'] }); onBoard(warm, 'p0c0');
    warm.cards.p0c0.health = 6; warm.cards.p0c0.damage = 5;
    warm = play(warm, 'p0t0', 'p0c0'); warm = play(fresh(warm), 'p0t1', 'p0c0');
    assert.equal(warm.cards.p0c0.damage, 1); assert.equal(warm.cards.p0c0.timedKeywords.length, 1, 'one timed Shield');
    assert.ok(warm.lastEvents.some(e => /already has a Shield/.test(e.text || '')));
    warm = pass(pass(warm)); assert.ok(!kws(warm, 'p0c0').includes('shield'));
});

test('AI self-play with the batch stays finite, keeps every card in one zone and plays every new creature', () => {
    const seen = new Set();
    const deck = ['reason-diagonal-deer', 'emotion-resolve-ram', 'perception-scout-stoat', 'language-label-lemur', 'imagination-possibility-pika', 'beastie', 'khaby', 'paper-dragon'];
    for (let seed = 0; seed < 6; seed++) {
        const s = E.createBattle({ seed: 'e2-fuzz-' + seed, players: [0, 1].map(p => ({ name: 'P' + p,
            team: deck.flatMap((species, i) => [0, 1].map(k => ({ uid: 'e2-' + p + '-' + i + '-' + k, species, powerDelta: 0, injuries: [], scars: [] }))),
            tactics: SPELLS.concat(SPELLS, ['counterexample', 'pep-talk']) })), options: { first: seed % 2, deckSize: 26, maxCreatures: 16 } });
        const end = AI.playOut(s, ['competent', 'competent'], (before, a, after) => {
            if (a.type === 'play') { const c = before.cards[a.cid]; seen.add(c.species || c.tactic); }
            invariants(after, assert);
        });
        assert.ok(end.winner != null, 'game ends');
    }
    // The AI seldom spends a turn on a defensive spell; the measured probe (tools/sim-expansion-2.mjs) reports spell counts.
    for (const id of CREATURES) assert.ok(seen.has(id), id + ' was played');
});

test('sources: one ordinary chapter-two catch each, packs carry all eight, and copies survive a backup code', async () => {
    const L = loadRift(['js/core/rift.js', 'js/core/state.js', 'js/core/world.js', 'js/core/acquisition.js', 'js/core/packs.js',
        'data/creatures.js', 'data/items.js', 'data/map.js', 'data/tactics.js', 'data/axioms.js', 'data/starters.js', 'js/battle/abilities.js', 'js/battle/conditional-cards.js']);
    const s = L.State.freshState(); s.avatar = { type: 'owlet', variant: 'girl' }; L.State.grantStarter(s);
    const sources = { 'reason-diagonal-deer': 'b-school', 'emotion-resolve-ram': 'b-stairs', 'perception-scout-stoat': 'b-lamp-lane',
        'language-label-lemur': 'b-post', 'imagination-possibility-pika': 'b-bakery' };
    for (const [id, node] of Object.entries(sources)) {
        assert.equal(L.World.node(node).chapter, 'ch2');
        assert.ok(L.World.spawnWeights(s, L.World.node(node), { stars: 1 })[id] > 0, id + ' has a real ordinary source');
        assert.equal(L.State.copyCap(id), 4);
    }
    const roster = L.Packs.roster(s), inPool = id => roster.find(e => e.id === id);
    for (const id of BATCH) {
        const e = inPool(id), d = L.data.creatures[id] || L.data.tactics[id];
        assert.ok(e, id + ' is in the pack pool'); assert.equal(e.rarity, d.rarity, id); assert.ok(e.weight > 0, id);
    }
    for (const row of L.Acquisition.entries) assert.ok(!inPool(row.id), row.id + ' stays story-only');
    for (const id of CREATURES) { assert.equal(L.State.addCreature(s, L.State.makeCreature(id)), true, id); if (!s.seen.includes(id)) s.seen.push(id); }
    for (const id of SPELLS) { assert.equal(L.State.grantPrint('tactic', id, s), true, id); assert.equal(L.State.grantPrint('tactic', id, s, { foil: true }), true, id); }
    const back = L.State.migrate(await L.State.decodeAsync('save', await L.State.encodePacked('save', s)));
    for (const id of CREATURES) assert.equal(L.State.copiesOf(back, id), 1, id + ' survives the backup code');
    for (const id of SPELLS) assert.equal(L.State.cardCopies('tactic', id, back), 2, id + ' survives the backup code');
    for (const id of SPELLS) { L.State.grantPrint('tactic', id, back); L.State.grantPrint('tactic', id, back); assert.equal(L.State.grantPrint('tactic', id, back), false, id + ' stops at four'); }
});
