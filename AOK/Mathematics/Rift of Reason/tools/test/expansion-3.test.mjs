// #129 expansion-3: the third small audited catalogue batch. Hooks, empty and no-target paths,
// re-entry bounds, sources (catches and packs) and backup survival. Mirrors expansion-2.test.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { Rift as R, E, AI, setup, act, onBoard, toHand, toDiscard, pass, rule, invariants } from './battle-helpers.mjs';
import { loadRift, GAME_DIR } from './harness.mjs';

const CREATURES = ['emotion-cheer-chick', 'language-definition-dolphin', 'imagination-mirror-marten', 'memory-archive-armadillo'];
const SPELLS = ['reason-check-the-premise', 'perception-focused-hit', 'generic-simple-cover', 'reason-proof-by-cases'];
const BATCH = CREATURES.concat(SPELLS);
const narrow = { deckSize: 4, minCreatures: 0, maxCreatures: 4 };
const battle = opts => setup({ ...opts, options: { ...narrow, deckSize: Math.max(1, (opts.p0 || []).length + (opts.t0 || []).length, (opts.p1 || []).length + (opts.t1 || []).length), ...(opts.options || {}) } });
const play = (s, cid, target) => act(toHand(s, cid), { type: 'play', cid, ...(target ? { target } : {}) });
const choose = (s, choice) => act(s, { type: 'choose', choice });
const atk = (s, cid) => E.attackOf(s, cid);
const kws = (s, cid) => Array.from(E.describe(s, cid).keywords);
const offered = (s, cid) => Array.from(E.legalActions(s).filter(a => a.type === 'play' && a.cid === cid));
const fresh = s => { s.players[0].playsThisTurn = 0; s.players[0].energy = 10; return s; };

test('the batch is eight released, pack-eligible catalogue IDs whose data matches the reviewed contract', () => {
    const cat = JSON.parse(fs.readFileSync(path.join(GAME_DIR, 'design/drafts/card-arena-2026-10-12/card-catalogue.json'), 'utf8'));
    const assets = fs.readFileSync(path.join(GAME_DIR, 'data/assets.js'), 'utf8');
    for (const id of BATCH) {
        const row = cat.cards.find(c => c.id === id), d = R.data.creatures[id] || R.data.tactics[id];
        assert.ok(row && d, id);
        assert.equal(d.release, 'expansion-3', id); assert.equal(d.packEligible, true, id);
        assert.equal(row.runtimeRelease, 'expansion-3', id); assert.equal(row.acquisition.packEligible, true, id);
        assert.equal(d.rarity, row.rarity, id); assert.equal(d.cost, row.cost, id);
        if (row.kind === 'creature') {
            assert.equal(d.attack, row.attack, id); assert.equal(d.health, row.health, id);
            assert.equal(d.colour, row.affinity, id); assert.equal(d.lines.length, 0, id + ' is unvoiced');
            assert.ok(R.Battle.Abilities[d.ability], id + ' has a real handler');
            assert.ok(assets.includes("'creature/" + id + "/idle'"), id + ' uses its existing portrait');
        } else {
            assert.ok(typeof d.run === 'function', id + ' has a real handler');
            assert.equal(d.colour || 'generic', row.affinity, id);
            assert.ok(assets.includes("'" + d.art + "'"), id + ' uses an existing motif');
        }
    }
    const rarities = new Set(BATCH.map(id => (R.data.creatures[id] || R.data.tactics[id]).rarity));
    assert.ok(rarities.has('rare') && rarities.has('uncommon'), 'more than Commons');
    assert.equal(new Set(BATCH.map(id => cat.cards.find(c => c.id === id).affinity)).size, 7, 'all six Ways plus generic');
});

test('the new card text fits its faces (#163 budget)', () => {
    const C = loadRift(['js/core/rift.js', 'js/ui/card-text.js']).CardText;
    for (const id of CREATURES) assert.ok(C.fits(R.data.creatures[id].abilityText, 'framed'), id + ' fits the 300px card');
    // Three spells print their rule on the tactic plate. Proof by Cases is too long for it, so its big face
    // names the card ("Reason · rare") and the notes hold the rule, as card-text.test.mjs checks for every card.
    for (const id of SPELLS.slice(0, 3)) { const d = R.data.tactics[id]; assert.ok(C.fits(d.short || d.text, 'tactic'), id + ' prints its rule'); }
    assert.ok(!C.fits(R.data.tactics['reason-proof-by-cases'].text, 'tactic') && C.fits('', 'tactic', 'Reason · rare'));
});

test('Terry gives another friendly creature +1 attack this turn only; alone, the Entrance fizzles', () => {
    let s = battle({ p0: ['emotion-cheer-chick', 'beastie'] }); onBoard(s, 'p0c1');
    toHand(s, 'p0c0'); assert.deepEqual(offered(s, 'p0c0').map(a => a.target), ['p0c1'], 'never itself');
    s = play(s, 'p0c0', 'p0c1'); assert.equal(atk(s, 'p0c1'), 3); assert.equal(atk(s, 'p0c0'), 1);
    s = pass(s); assert.equal(atk(s, 'p0c1'), 2, 'gone when this turn ends');
    const alone = play(battle({ p0: ['emotion-cheer-chick'] }), 'p0c0');
    assert.ok(alone.players[0].board.includes('p0c0')); assert.ok(alone.lastEvents.some(e => e.t === 'fizzle'));
});

test('Susie gives Guard until the caster\'s next turn starts, and never to a creature that has it', () => {
    let s = battle({ p0: ['language-definition-dolphin', 'beastie', 'proof-pup'] }); onBoard(s, 'p0c1', 'p0c2'); toHand(s, 'p0c0');
    assert.deepEqual(offered(s, 'p0c0').map(a => a.target), ['p0c1'], 'Proof Pup already has Guard');
    s = play(s, 'p0c0', 'p0c1'); assert.ok(kws(s, 'p0c1').includes('guard')); assert.equal(s.cards.p0c1.timedKeywords.length, 1);
    s = pass(s); assert.ok(kws(s, 'p0c1').includes('guard'), 'guards through the opponent\'s turn');
    s = pass(s); assert.ok(!kws(s, 'p0c1').includes('guard'), 'ends when the caster\'s next turn starts');
    // Only Guard creatures, or none: the body lands and the Entrance finds no target.
    for (const team of [['language-definition-dolphin', 'proof-pup'], ['language-definition-dolphin']]) {
        let t = battle({ p0: team }); if (team[1]) onBoard(t, 'p0c1'); toHand(t, 'p0c0');
        assert.ok(offered(t, 'p0c0').length === 1 && !offered(t, 'p0c0')[0].target);
        t = play(t, 'p0c0'); assert.ok(t.players[0].board.includes('p0c0')); assert.ok(t.lastEvents.some(e => e.t === 'fizzle'));
    }
});

test('Peter copies a higher friendly attack up to 4 until the caster\'s next turn; it never lowers his own', () => {
    let s = battle({ p0: ['imagination-mirror-marten', 'beastie'] }); onBoard(s, 'p0c1'); s.cards.p0c1.attack = 3;
    s = play(s, 'p0c0'); assert.equal(s.phase, 'main', 'one higher creature: no question'); assert.equal(atk(s, 'p0c0'), 3);
    s = pass(s); assert.equal(atk(s, 'p0c0'), 3, 'lasts through the opponent\'s turn');
    s = pass(s); assert.equal(atk(s, 'p0c0'), 2, 'ends when the caster\'s next turn starts');
    // A 7-attack source copies as 4; two higher sources ask; a lower or equal one is never offered.
    let two = battle({ p0: ['imagination-mirror-marten', 'beastie', 'paper-dragon', 'eelish'] }); onBoard(two, 'p0c1', 'p0c2', 'p0c3');
    two.cards.p0c1.attack = 7; two.cards.p0c2.attack = 3; two.cards.p0c3.attack = 2;
    two = play(two, 'p0c0'); assert.equal(two.phase, 'choose'); assert.deepEqual(Array.from(two.pending.options).sort(), ['p0c1', 'p0c2']);
    two = choose(two, 'p0c1'); assert.equal(atk(two, 'p0c0'), 4, 'capped at 4');
    // Nothing higher: no change and a plain log line.
    let low = battle({ p0: ['imagination-mirror-marten', 'eelish'] }); onBoard(low, 'p0c1');
    low = play(low, 'p0c0'); assert.equal(atk(low, 'p0c0'), 2); assert.equal(low.cards.p0c0.buffs.length, 0);
    assert.ok(low.lastEvents.some(e => /no higher attack/.test(e.text || '')));
    // Measured on the board: Beeyonce's aura lifts Beastie from 2 to 3, but it lifts Peter to 3 too, so nothing is higher.
    let aura = battle({ p0: ['imagination-mirror-marten', 'beeyonce', 'beastie'] }); onBoard(aura, 'p0c1', 'p0c2');
    aura.cards.p0c1.attack = 2; aura.cards.p0c2.attack = 2; assert.equal(E.attackOf(aura, 'p0c2'), 3);
    aura = play(aura, 'p0c0'); assert.equal(aura.phase, 'main');
    assert.equal(atk(aura, 'p0c0'), 3, 'aura only'); assert.equal(aura.cards.p0c0.buffs.length, 0, 'no copy');
});

test('Niklas: Guard, and his Last Word puts the oldest discarded spell on top, even with a full hand or Mercy', () => {
    const setupDeath = (extra) => {
        const s = battle({ p0: ['memory-archive-armadillo'], p1: ['beastie'], t0: ['counterexample', 'lemma', 'generic-small-patch'], ...extra });
        onBoard(s, 'p0c0', 'p1c0'); toDiscard(s, 'p0t0', 'p0t1'); s.players[0].deck = ['p0t2']; s.cards.p0c0.damage = 2; return s;
    };
    let s = setupDeath(); assert.ok(kws(s, 'p0c0').includes('guard'));
    s = act(pass(s), { type: 'attack', cid: 'p1c0', target: 'p0c0' });
    assert.ok(s.players[0].discard.includes('p0c0'));
    assert.deepEqual(Array.from(s.players[0].deck), ['p0t0', 'p0t2'], 'Counterexample (discarded first) is now on top');
    assert.deepEqual(Array.from(s.players[0].discard), ['p0t1', 'p0c0']);
    assert.ok(s.lastEvents.some(e => /on top of the personal deck/.test(e.text || '')));
    // The other defeats below: lethal damage, then any action runs the engine's cleanup.
    const kill = st => { const G = E.cloneState(st); G.cards.p0c0.damage = 9; return act(G, { type: 'end' }); };
    // A full hand and Mercy do not skip it (the returning Last Words do skip then).
    const full = setupDeath({ options: { handLimit: 1 } }); full.players[0].hand = ['p0t2']; full.players[0].deck = [];
    const fullEnd = kill(full); assert.deepEqual(Array.from(fullEnd.players[0].deck).slice(0, 1), ['p0t0']);
    const mercy = rule(setupDeath(), 'mercy'); const mercyEnd = kill(mercy);
    assert.ok(mercyEnd.players[0].hand.includes('p0c0'), 'Mercy returns it'); assert.equal(mercyEnd.players[0].deck[0], 'p0t0', 'and the Last Word still happens');
    // No spell in the pile: nothing moves, and the log says so.
    const none = battle({ p0: ['memory-archive-armadillo'], t0: ['lemma'] }); onBoard(none, 'p0c0'); none.players[0].deck = ['p0t0'];
    const noneEnd = kill(none); assert.deepEqual(Array.from(noneEnd.players[0].deck), ['p0t0']);
    assert.ok(noneEnd.lastEvents.some(e => /finds no spell/.test(e.text || '')));
    // A log line, not a fizzle: the spell or attack that defeated him did not fail (battle-arena-fuzz).
    assert.ok(!noneEnd.lastEvents.some(e => e.t === 'fizzle'));
    // Silenced or under Empty Set: no Last Word.
    for (const off of [st => { st.cards.p0c0.silenced = true; }, st => rule(st, 'empty-set')]) {
        const t = setupDeath(); off(t); const end = kill(t); assert.deepEqual(Array.from(end.players[0].deck), ['p0t2']);
    }
});

test('Check the Premise and Focused Hit read the target as they resolve', () => {
    for (const [id, target, extra, want] of [
        ['reason-check-the-premise', 'beastie', null, 1], ['reason-check-the-premise', 'lobstorian', null, 2],
        ['perception-focused-hit', 'beastie', null, 3], ['perception-focused-hit', 'lobstorian', null, 2],
        ['perception-focused-hit', 'lobstorian', c => { c.silenced = true; }, 3],
        ['reason-check-the-premise', 'lobstorian', c => { c.silenced = true; }, 1],
    ]) {
        let s = battle({ p0: ['eelish'], p1: [target], t0: [id] }); onBoard(s, 'p1c0'); s.cards.p1c0.health = 9;
        if (extra) extra(s.cards.p1c0);
        s = play(s, 'p0t0', 'p1c0'); assert.equal(s.cards.p1c0.damage, want, id + ' on ' + target);
    }
    // A Shield is a keyword and blocks the damage; an Elusive enemy cannot be chosen; no enemy, no play.
    let shield = battle({ p0: ['eelish'], p1: ['beastie'], t0: ['perception-focused-hit'] }); onBoard(shield, 'p1c0'); shield.cards.p1c0.extraKeywords.push('shield');
    shield = play(shield, 'p0t0', 'p1c0'); assert.equal(shield.cards.p1c0.damage, 0); assert.ok(!kws(shield, 'p1c0').includes('shield'));
    for (const id of ['reason-check-the-premise', 'perception-focused-hit']) {
        const s = battle({ p0: ['eelish'], p1: ['shakirattle'], t0: [id] }); onBoard(s, 'p1c0'); toHand(s, 'p0t0');
        assert.equal(offered(s, 'p0t0').length, 0, id + ': Elusive is not a target');
        const empty = battle({ p0: ['eelish'], p1: ['beastie'], t0: [id] }); toHand(empty, 'p0t0'); assert.equal(offered(empty, 'p0t0').length, 0, id + ': no enemy');
    }
    // A timed Guard counts for Check the Premise.
    let timed = battle({ p0: ['beastie'], p1: ['beastie'], t0: ['reason-check-the-premise'], t1: ['generic-simple-cover'] }); onBoard(timed, 'p0c0', 'p1c0');
    timed.cards.p1c0.timedKeywords = [{ k: 'guard', mode: 'gain', until: 99, label: 'test' }];
    timed = play(timed, 'p0t0', 'p1c0'); assert.equal(timed.cards.p1c0.damage, 2);
});

test('Simple Cover: timed Guard on a creature without it; not offered otherwise', () => {
    let s = battle({ p0: ['beastie', 'proof-pup'], t0: ['generic-simple-cover', 'generic-simple-cover'] }); onBoard(s, 'p0c0', 'p0c1'); toHand(s, 'p0t0');
    assert.deepEqual(offered(s, 'p0t0').map(a => a.target), ['p0c0']);
    s = play(s, 'p0t0', 'p0c0'); assert.ok(kws(s, 'p0c0').includes('guard'));
    toHand(fresh(s), 'p0t1'); assert.equal(offered(s, 'p0t1').length, 0, 'both already guard: the second copy is not offered');
    s = pass(s); assert.ok(kws(s, 'p0c0').includes('guard')); s = pass(s); assert.ok(!kws(s, 'p0c0').includes('guard'));
    const none = battle({ p0: ['eelish'], p1: ['beastie'], t0: ['generic-simple-cover'] }); onBoard(none, 'p1c0'); toHand(none, 'p0t0');
    assert.equal(offered(none, 'p0t0').length, 0, 'no friendly creature');
});

test('Proof by Cases offers only the cases that can happen, and each case resolves once', () => {
    // Damage case.
    let s = battle({ p0: ['beastie'], p1: ['lobstorian', 'eelish'], t0: ['reason-proof-by-cases'] }); onBoard(s, 'p0c0', 'p1c0', 'p1c1');
    s = play(s, 'p0t0'); assert.equal(s.phase, 'choose'); assert.deepEqual(Array.from(s.pending.options), ['damage', 'support']);
    s = choose(s, 'damage'); assert.deepEqual(Array.from(s.pending.options), ['p1c0', 'p1c1']);
    s = choose(s, 'p1c0'); assert.ok(s.players[1].discard.includes('p1c0'), '4 damage defeats the 2/4');
    // Support case with two creatures: both, no question; with three, two questions and never the same one twice.
    let two = battle({ p0: ['beastie', 'eelish'], p1: ['lobstorian'], t0: ['reason-proof-by-cases'] }); onBoard(two, 'p0c0', 'p0c1', 'p1c0');
    two.cards.p0c0.damage = 3; two = choose(play(two, 'p0t0'), 'support');
    assert.equal(two.phase, 'main'); assert.equal(E.healthOf(two, 'p0c0').max, 6); assert.equal(two.cards.p0c0.damage, 1); assert.equal(E.healthOf(two, 'p0c1').max, 4);
    let three = battle({ p0: ['beastie', 'eelish', 'paper-dragon'], t0: ['reason-proof-by-cases'] }); onBoard(three, 'p0c0', 'p0c1', 'p0c2');
    three = play(three, 'p0t0'); assert.equal(three.pending.options.length, 3, 'no enemy: only the support case, and no case question');
    three = choose(three, 'p0c2'); assert.deepEqual(Array.from(three.pending.options), ['p0c0', 'p0c1']);
    three = choose(three, 'p0c0'); assert.equal(three.phase, 'main');
    assert.deepEqual(['p0c0', 'p0c1', 'p0c2'].map(c => E.healthOf(three, c).max), [6, 2, 4]);
    // Enemies only (one of them Elusive): straight to the visible target.
    let only = battle({ p0: ['eelish'], p1: ['shakirattle', 'beastie'], t0: ['reason-proof-by-cases'] }); onBoard(only, 'p1c0', 'p1c1'); only.cards.p1c1.health = 9;
    only = play(only, 'p0t0'); assert.equal(only.phase, 'main'); assert.equal(only.cards.p1c1.damage, 4);
    // Nothing either case could touch: not offered.
    const elusive = battle({ p0: ['eelish'], p1: ['shakirattle'], t0: ['reason-proof-by-cases'] }); onBoard(elusive, 'p1c0'); toHand(elusive, 'p0t0');
    assert.equal(offered(elusive, 'p0t0').length, 0);
});

test('Empty Set turns off the new Entrances; replays and repeat casts are fresh paid plays that never double', () => {
    for (const id of ['emotion-cheer-chick', 'language-definition-dolphin', 'imagination-mirror-marten']) {
        let s = battle({ p0: [id, 'beastie'] }); onBoard(s, 'p0c1'); s.cards.p0c1.attack = 4; rule(s, 'empty-set'); toHand(s, 'p0c0');
        assert.ok(offered(s, 'p0c0').length === 1 && !offered(s, 'p0c0')[0].target, id + ' asks for no target');
        s = play(s, 'p0c0'); assert.equal(s.phase, 'main', id);
        assert.equal(s.cards.p0c1.buffs.length + s.cards.p0c0.buffs.length, 0, id); assert.equal(s.cards.p0c1.timedKeywords, undefined, id);
        delete s.axioms.active[R.data.axioms['empty-set'].category];
        s = pass(s); assert.equal(s.phase, 'main', id + ' does not fire late'); assert.equal(s.cards.p0c1.buffs.length, 0, id);
    }
    // Rethink clears Peter's copy; the replay is a fresh paid play with one fresh copy, not two.
    let peter = battle({ p0: ['imagination-mirror-marten', 'beastie'], t0: ['rethink'] }); onBoard(peter, 'p0c1'); peter.cards.p0c1.attack = 4;
    peter = play(peter, 'p0c0'); assert.equal(atk(peter, 'p0c0'), 4);
    peter = play(peter, 'p0t0', 'p0c0'); assert.equal(peter.cards.p0c0.buffs.length, 0, 'leaving play clears the copy');
    peter = act(fresh(peter), { type: 'play', cid: 'p0c0' }); assert.equal(atk(peter, 'p0c0'), 4); assert.equal(peter.cards.p0c0.buffs.length, 1);
    assert.equal(peter.players[0].energy, 7);
    // Two Terrys on one friend: +2 this turn, both gone at its end.
    let terry = battle({ p0: ['emotion-cheer-chick', 'emotion-cheer-chick', 'proof-pup'] }); onBoard(terry, 'p0c2');
    terry = play(terry, 'p0c0', 'p0c2'); terry = play(fresh(terry), 'p0c1', 'p0c2'); assert.equal(atk(terry, 'p0c2'), 3);
    terry = pass(terry); assert.equal(atk(terry, 'p0c2'), 1);
    // Two Susies: the second cannot pick the creature the first already guards.
    let susie = battle({ p0: ['language-definition-dolphin', 'language-definition-dolphin', 'beastie'] }); onBoard(susie, 'p0c2');
    susie = play(susie, 'p0c0', 'p0c2'); toHand(fresh(susie), 'p0c1');
    assert.ok(!offered(susie, 'p0c1').some(a => a.target === 'p0c2')); assert.ok(offered(susie, 'p0c1').some(a => a.target === 'p0c0'));
    // Proof by Cases twice on the same two: +4 maximum health in all, two separate casts.
    let proof = battle({ p0: ['beastie', 'eelish'], t0: ['reason-proof-by-cases', 'reason-proof-by-cases'] }); onBoard(proof, 'p0c0', 'p0c1');
    proof = play(proof, 'p0t0'); proof = play(fresh(proof), 'p0t1'); assert.equal(E.healthOf(proof, 'p0c0').max, 8);
    // Two Niklas defeated together: two Last Words, the two oldest spells on top (newest move first), no copy made.
    let pair = battle({ p0: ['memory-archive-armadillo', 'memory-archive-armadillo'], t0: ['counterexample', 'lemma', 'generic-small-patch'] });
    onBoard(pair, 'p0c0', 'p0c1'); toDiscard(pair, 'p0t0', 'p0t1', 'p0t2'); pair.players[0].deck = [];
    const count = Object.keys(pair.cards).length;
    pair.cards.p0c0.damage = 9; pair.cards.p0c1.damage = 9; pair = act(pair, { type: 'end' });
    assert.deepEqual(Array.from(pair.players[0].deck).slice(0, 2), ['p0t1', 'p0t0']); assert.deepEqual(Array.from(pair.players[0].discard).filter(c => c[2] === 't'), ['p0t2']);
    assert.equal(Object.keys(pair.cards).length, count, 'no copy is made');
});

test('previews and the AI never read the hidden deck through Niklas\'s Last Word', () => {
    const s = battle({ p0: ['beastie'], p1: ['memory-archive-armadillo'], t1: ['counterexample', 'lemma', 'generic-small-patch'], energy: 3 });
    onBoard(s, 'p0c0', 'p1c0'); toDiscard(s, 'p1t0'); s.players[1].deck = ['p1t1', 'p1t2']; s.cards.p1c0.damage = 1;
    const a = { type: 'attack', player: 0, cid: 'p0c0', target: 'p1c0' }, before = JSON.stringify(s);
    const first = E.previewAction(s, a, 0);
    s.players[1].deck.reverse(); const second = E.previewAction(s, a, 0); s.players[1].deck.reverse();
    assert.deepEqual(JSON.parse(JSON.stringify(first)), JSON.parse(JSON.stringify(second)));
    assert.doesNotMatch(JSON.stringify(first), /Lemma|Small Patch/);
    for (const level of ['normal', 'competent', 'expert']) for (const salt of [0, 1]) {
        const pick = AI.choose(s, { level, salt }); assert.equal(JSON.stringify(s), before, 'planning never changes the battle');
        const hidden = E.cloneState(s); hidden.players[1].deck.reverse();
        assert.equal(E.actionKey(AI.choose(hidden, { level, salt })), E.actionKey(pick), level + ' ' + salt);
    }
});

test('AI self-play with the batch stays finite, keeps every card in one zone and plays every new card', () => {
    const seen = new Set();
    const deck = CREATURES.concat(['beastie', 'khaby', 'paper-dragon', 'lobstorian']);
    for (let seed = 0; seed < 8; seed++) {
        const s = E.createBattle({ seed: 'e3-fuzz-' + seed, players: [0, 1].map(p => ({ name: 'P' + p,
            team: deck.flatMap((species, i) => [0, 1].map(k => ({ uid: 'e3-' + p + '-' + i + '-' + k, species, powerDelta: 0, injuries: [], scars: [] }))),
            tactics: SPELLS.concat(SPELLS, ['counterexample', 'pep-talk']) })), options: { first: seed % 2, deckSize: 26, maxCreatures: 16 } });
        const end = AI.playOut(s, ['competent', 'competent'], (before, a, after) => {
            if (a.type === 'play') { const c = before.cards[a.cid]; seen.add(c.species || c.tactic); }
            invariants(after, assert);
        });
        assert.ok(end.winner != null, 'game ends');
    }
    for (const id of CREATURES) assert.ok(seen.has(id), id + ' was played');
    // Damage spells are cheap and always useful, so the AI plays them too; Simple Cover is reported by the probe.
    for (const id of ['reason-check-the-premise', 'perception-focused-hit', 'reason-proof-by-cases']) assert.ok(seen.has(id), id + ' was played');
});

test('sources: one ordinary chapter-two catch each, packs carry all eight, and copies survive a backup code', async () => {
    const L = loadRift(['js/core/rift.js', 'js/core/state.js', 'js/core/world.js', 'js/core/acquisition.js', 'js/core/packs.js',
        'data/creatures.js', 'data/items.js', 'data/map.js', 'data/tactics.js', 'data/axioms.js', 'data/starters.js', 'js/battle/abilities.js', 'js/battle/conditional-cards.js']);
    const s = L.State.freshState(); s.avatar = { type: 'owlet', variant: 'girl' }; L.State.grantStarter(s);
    const sources = { 'emotion-cheer-chick': 'b-south-bridge', 'language-definition-dolphin': 'b-post',
        'imagination-mirror-marten': 'b-clockmaker', 'memory-archive-armadillo': 'b-kitchen' };
    for (const [id, node] of Object.entries(sources)) {
        assert.equal(L.World.node(node).chapter, 'ch2'); assert.equal(L.World.node(node).type, 'puzzle');
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
    // The plain save (what saveNow writes and load reads) and the packed backup code both keep them.
    const plain = L.State.migrate(JSON.parse(JSON.stringify(s)));
    const back = L.State.migrate(await L.State.decodeAsync('save', await L.State.encodePacked('save', s)));
    for (const [kind, copy] of [['save', plain], ['backup code', back]]) {
        for (const id of CREATURES) assert.equal(L.State.copiesOf(copy, id), 1, id + ' survives the ' + kind);
        for (const id of SPELLS) assert.equal(L.State.cardCopies('tactic', id, copy), 2, id + ' survives the ' + kind);
    }
    for (const id of SPELLS) { L.State.grantPrint('tactic', id, back); L.State.grantPrint('tactic', id, back); assert.equal(L.State.grantPrint('tactic', id, back), false, id + ' stops at four'); }
});
