// #129 expansion-4: public battle, acquisition and save/backup seams used by earlier batches.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { Rift as R, E, AI, setup, act, onBoard, toHand, pass, rule, hp, atk, invariants } from './battle-helpers.mjs';
import { loadRift, GAME_DIR } from './harness.mjs';

const CREATURES = ['reason-counterexample-crow', 'emotion-grudge-goose', 'language-debate-dingo', 'imagination-paradox-pony', 'memory-bookmark-bunny'];
const SPELLS = ['reason-exact-answer', 'perception-notice-the-crack', 'generic-forked-reply'];
const BATCH = CREATURES.concat(SPELLS);

const battle = opts => setup({ ...opts, options: { deckSize: Math.max(1, (opts.p0 || []).length + (opts.t0 || []).length, (opts.p1 || []).length + (opts.t1 || []).length), minCreatures: 0, maxCreatures: 20, ...(opts.options || {}) } });
const play = (s, cid, target) => act(toHand(s, cid), { type: 'play', cid, ...(target ? { target } : {}) });

test('V-Squish deals one Entrance damage, or two with another explicit colour on its board', () => {
    for (const [friend, damage] of [['proof-pup', 1], ['beastie', 2]]) {
        let s = battle({ p0: ['reason-counterexample-crow', friend], p1: ['beastie'] });
        onBoard(s, 'p0c1', 'p1c0');
        const before = hp(s, 'p1c0');
        s = play(s, 'p0c0', 'p1c0');
        assert.equal(hp(s, 'p1c0'), before - damage);
        invariants(s, assert);
    }
});

test('V-Squish ignores generic, colourless and absent-colour friends, and respects Shield and target gates', () => {
    for (const change of [c => { c.generic = true; }, c => { c.colourless = true; }, c => { delete c.colour; }]) {
        let s = battle({ p0: ['reason-counterexample-crow', 'beastie'], p1: ['beastie'] });
        onBoard(s, 'p0c1', 'p1c0'); change(s.cards.p0c1);
        const before = hp(s, 'p1c0'); s = play(s, 'p0c0', 'p1c0');
        assert.equal(hp(s, 'p1c0'), before - 1);
    }
    let shield = battle({ p0: ['reason-counterexample-crow', 'beastie'], p1: ['beastie'] });
    onBoard(shield, 'p0c1', 'p1c0'); shield.cards.p1c0.extraKeywords = ['shield'];
    const before = hp(shield, 'p1c0'); shield = play(shield, 'p0c0', 'p1c0');
    assert.equal(hp(shield, 'p1c0'), before); assert.ok(!E.describe(shield, 'p1c0').keywords.includes('shield'));
    for (const enemy of [[], ['shakirattle']]) {
        let s = battle({ p0: ['reason-counterexample-crow'], p1: enemy });
        if (enemy.length) onBoard(s, 'p1c0');
        s = play(s, 'p0c0'); assert.ok(s.players[0].board.includes('p0c0'));
        assert.equal(s.phase, 'main'); assert.ok(s.lastEvents.some(e => e.t === 'fizzle'));
    }
    let empty = battle({ p0: ['reason-counterexample-crow'], p1: ['beastie'] });
    onBoard(empty, 'p1c0'); rule(empty, 'empty-set');
    const untouched = hp(empty, 'p1c0'); empty = play(empty, 'p0c0');
    assert.equal(hp(empty, 'p1c0'), untouched);
});

test('Exact Answer reads current attack, caps damage at three and excludes zero-attack targets', () => {
    for (const [attack, damage] of [[2, 2], [8, 3]]) {
        let s = battle({ p0: ['beastie'], p1: ['beastie'], t0: ['reason-exact-answer'] });
        onBoard(s, 'p1c0'); s.cards.p1c0.attack = attack; s.cards.p1c0.health = 10;
        s = play(s, 'p0t0', 'p1c0'); assert.equal(hp(s, 'p1c0'), 10 - damage);
    }
    const s = battle({ p0: ['beastie'], p1: ['beastie'], t0: ['reason-exact-answer'] });
    onBoard(s, 'p1c0'); s.cards.p1c0.attack = 0; toHand(s, 'p0t0');
    assert.ok(!E.legalActions(s).some(a => a.type === 'play' && a.cid === 'p0t0'));
});

test('Notice the Crack deals two only to a creature already damaged before the spell', () => {
    for (const [oldDamage, loss] of [[0, 1], [1, 2]]) {
        let s = battle({ p0: ['beastie'], p1: ['beastie'], t0: ['perception-notice-the-crack'] });
        onBoard(s, 'p1c0'); s.cards.p1c0.health = 10; s.cards.p1c0.damage = oldDamage;
        s = play(s, 'p0t0', 'p1c0'); assert.equal(hp(s, 'p1c0'), 10 - oldDamage - loss);
    }
});

test('Jack Axoloticeye damages the enemy hero on defeat and resolves lethal damage after Last Words', () => {
    let s = battle({ p0: ['beastie'], p1: ['emotion-grudge-goose', 'beastie'], t0: ['counterexample'] });
    onBoard(s, 'p1c0'); s.players[0].hearts = 1;
    s = play(s, 'p0t0', 'p1c0');
    assert.equal(s.players[0].hearts, 0); assert.equal(s.winner, 1);
    assert.ok(s.players[1].discard.includes('p1c0'));
    const defeat = s.lastEvents.findIndex(e => e.t === 'defeated'), end = s.lastEvents.findIndex(e => e.t === 'end');
    assert.ok(defeat >= 0 && end > defeat);
});

test('K-S-Ibis has Shield only for an attack into higher effective attack, including the preview', () => {
    let s = battle({ p0: ['language-debate-dingo', 'beastie'], p1: ['beastie'], t1: ['counterexample'] });
    onBoard(s, 'p0c0', 'p1c0'); s.cards.p1c0.colour = 'language'; s.cards.p1c0.attack = 4; s.cards.p1c0.health = 10;
    assert.equal(E.fightPreview(s, 'p0c0', 'p1c0').damageToAttacker, 0);
    s = act(s, { type: 'attack', cid: 'p0c0', target: 'p1c0' });
    assert.equal(hp(s, 'p0c0'), 2); assert.ok(s.lastEvents.some(e => e.t === 'shield' && e.cid === 'p0c0'));
    assert.ok(!E.describe(s, 'p0c0').keywords.includes('shield'), 'no Shield remains after the fight');
    s = pass(s); s = play(s, 'p1t0', 'p0c0');
    assert.ok(s.players[0].discard.includes('p0c0'), 'the later spell is not blocked');
});

test('Hank Greenhare draws once at the next own turn start, before the ordinary draw choice, through JSON reload', () => {
    let s = battle({ p0: ['memory-bookmark-bunny', 'beastie'], p1: ['beastie'], t0: ['counterexample', 'lemma'] });
    onBoard(s, 'p1c0'); s = play(s, 'p0c0');
    assert.equal(s.players[0].hand.length, 0);
    s = JSON.parse(JSON.stringify(s)); s = pass(s);
    assert.equal(s.players[0].hand.length, 0, 'not at the opponent turn start');
    s = act(s, { type: 'end' });
    assert.equal(s.active, 0); assert.equal(s.phase, 'draw');
    assert.equal(s.players[0].hand.length, 1, 'one extra card before the ordinary draw');
    assert.equal(s.players[0].hand[0], 'p0c1');
});

test('Pedro Platypascal swaps current attack and health until the caster next starts, retaining later damage', () => {
    let s = battle({ p0: ['imagination-paradox-pony', 'beastie'], p1: ['beastie'], t0: ['perception-notice-the-crack'] });
    onBoard(s, 'p1c0'); s.cards.p1c0.attack = 3; s.cards.p1c0.health = 5; s.cards.p1c0.damage = 1;
    s = play(s, 'p0c0', 'p1c0');
    assert.equal(atk(s, 'p1c0'), 4); assert.equal(hp(s, 'p1c0'), 3);
    s = play(s, 'p0t0', 'p1c0'); assert.equal(hp(s, 'p1c0'), 2);
    s = JSON.parse(JSON.stringify(s)); s = pass(s);
    assert.equal(atk(s, 'p1c0'), 4, 'still swapped through the enemy turn');
    s = act(s, { type: 'end' });
    assert.equal(atk(s, 'p1c0'), 3); assert.equal(E.describe(s, 'p1c0').maxHealth, 5);
    assert.equal(hp(s, 'p1c0'), 4, 'damage after the swap stays when its timed effect ends');
});

test('Forked Reply hits two distinct enemies and then heals; a single available enemy is legal', () => {
    for (const count of [1, 2, 3]) {
        let s = battle({ p0: ['beastie'], p1: Array(count).fill('beastie'), t0: ['generic-forked-reply'] });
        const ids = Array.from({ length: count }, (_, i) => 'p1c' + i);
        onBoard(s, ...ids); ids.forEach(cid => { s.cards[cid].health = 10; }); s.players[0].hearts = 5;
        s = play(s, 'p0t0', 'p1c0');
        if (count === 3) {
            assert.equal(s.phase, 'choose'); assert.equal(s.players[0].hearts, 5);
            assert.deepEqual(Array.from(s.pending.options), ['p1c1', 'p1c2']);
            assert.equal(hp(s, 'p1c0'), 10, 'both packets wait for the second target');
            s = act(s, { type: 'choose', choice: 'p1c2' });
        }
        assert.equal(s.players[0].hearts, 6);
        assert.equal(hp(s, 'p1c0'), 9);
        if (count === 2) assert.equal(hp(s, 'p1c1'), 9);
        if (count === 3) { assert.equal(hp(s, 'p1c1'), 10); assert.equal(hp(s, 'p1c2'), 9); }
        invariants(s, assert);
    }
});

test('Jack: Silence and Empty Set suppress it, Mercy and a full hand do not, and mutual lethal Last Words draw', () => {
    for (const mode of ['silence', 'empty', 'mercy', 'full']) {
        let s = battle({ p0: ['beastie'], p1: ['emotion-grudge-goose', 'beastie'], t0: ['counterexample'], options: { handLimit: 1 } });
        onBoard(s, 'p1c0');
        if (mode === 'silence') s.cards.p1c0.silenced = true;
        if (mode === 'empty') rule(s, 'empty-set');
        if (mode === 'mercy') rule(s, 'mercy');
        if (mode === 'full') toHand(s, 'p1c1');
        s = play(s, 'p0t0', 'p1c0');
        assert.equal(s.players[0].hearts, ['silence', 'empty'].includes(mode) ? 10 : 9, mode);
        if (mode === 'mercy') assert.ok(s.players[1].hand.includes('p1c0'));
    }
    let mutual = battle({ p0: ['emotion-grudge-goose', 'beastie'], p1: ['emotion-grudge-goose', 'beastie'] });
    onBoard(mutual, 'p0c0', 'p1c0');
    for (const p of [0, 1]) { mutual.players[p].hearts = 1; mutual.cards['p' + p + 'c0'].damage = 3; }
    mutual = act(mutual, { type: 'end' }); assert.equal(mutual.winner, 'draw');
    assert.deepEqual(Array.from(mutual.players, P => P.hearts), [0, 0]);
});

test('K-S-Ibis: equal/lower attack, defence, Silence and Empty Set give no Shield; a real Shield stays unused', () => {
    for (const [power, suppressed] of [[3, null], [2, null], [4, 'silence'], [4, 'empty']]) {
        let s = battle({ p0: ['language-debate-dingo', 'beastie'], p1: ['beastie'] });
        onBoard(s, 'p0c0', 'p1c0'); s.cards.p1c0.colour = 'language'; s.cards.p1c0.attack = power;
        if (suppressed === 'silence') s.cards.p0c0.silenced = true;
        if (suppressed === 'empty') rule(s, 'empty-set');
        assert.equal(E.fightPreview(s, 'p0c0', 'p1c0').damageToAttacker, power);
        s = act(s, { type: 'attack', cid: 'p0c0', target: 'p1c0' });
        assert.ok(!s.lastEvents.some(e => e.t === 'shield' && e.cid === 'p0c0'));
    }
    let defend = battle({ p0: ['beastie'], p1: ['language-debate-dingo', 'beastie'] });
    onBoard(defend, 'p0c0', 'p1c0'); defend.cards.p0c0.colour = 'language'; defend.cards.p0c0.attack = 4;
    defend = act(defend, { type: 'attack', cid: 'p0c0', target: 'p1c0' });
    assert.ok(defend.players[1].discard.includes('p1c0'));
    let shield = battle({ p0: ['language-debate-dingo', 'beastie'], p1: ['beastie'] });
    onBoard(shield, 'p0c0', 'p1c0'); shield.cards.p1c0.colour = 'language'; shield.cards.p1c0.attack = 4;
    shield.cards.p0c0.extraKeywords = ['shield'];
    shield = act(shield, { type: 'attack', cid: 'p0c0', target: 'p1c0' });
    assert.ok(E.describe(shield, 'p0c0').keywords.includes('shield'));
    const wheel = battle({ p0: ['language-debate-dingo'], p1: ['beastie'] });
    onBoard(wheel, 'p0c0', 'p1c0'); wheel.cards.p1c0.colour = 'reason'; wheel.cards.p1c0.attack = 3;
    const preview = E.fightPreview(wheel, 'p0c0', 'p1c0');
    assert.equal(preview.pa, 2, 'Language is Weak against Reason');
    assert.equal(preview.pb, 4, 'Reason is Strong against Language');
    assert.equal(preview.damageToAttacker, 0, 'effective higher attack qualifies despite printed equality');
});

test('Hank: defeat, bounce, stealing, Silence and Empty Set cancel the delayed draw', () => {
    for (const mode of ['defeat', 'bounce', 'steal', 'silence', 'empty', 'empty-on-entry']) {
        let s = battle({ p0: ['memory-bookmark-bunny', 'beastie'], p1: ['beastie'], t0: ['rethink', 'counterexample'], t1: ['persuasion'] });
        onBoard(s, 'p0c1', 'p1c0');
        if (mode === 'empty-on-entry') rule(s, 'empty-set');
        s = play(s, 'p0c0');
        if (mode === 'empty-on-entry') s.axioms.active[R.data.axioms['empty-set'].category] = null;
        if (mode === 'bounce') s = play(s, 'p0t0', 'p0c0');
        if (mode === 'defeat') s = play(s, 'p0t1', 'p0c0');
        s = pass(s);
        if (mode === 'steal') s = play(s, 'p1t0', 'p0c0');
        if (mode === 'silence') s.cards.p0c0.silenced = true;
        if (mode === 'empty') rule(s, 'empty-set');
        const before = s.players[0].hand.length; s = act(s, { type: 'end' });
        assert.equal(s.players[0].hand.length, before, mode);
    }
});

test('Hank: missed draws never fire late, replay schedules a fresh one, and full/empty hands/decks are bounded', () => {
    let missed = battle({ p0: ['memory-bookmark-bunny', 'beastie'], p1: ['beastie'], t0: ['counterexample', 'lemma', 'counterexample', 'lemma'] });
    onBoard(missed, 'p0c1', 'p1c0'); missed = pass(play(missed, 'p0c0')); rule(missed, 'empty-set');
    missed = act(missed, { type: 'end' }); assert.equal(missed.players[0].hand.length, 0);
    missed.axioms.active[R.data.axioms['empty-set'].category] = null;
    missed = E.applyAction(missed, E.legalActions(missed)[0]); missed = pass(missed);
    const before = missed.players[0].hand.length; missed = act(missed, { type: 'end' });
    assert.equal(missed.players[0].hand.length, before, 'no late draw after Empty Set leaves');
    let replay = battle({ p0: ['memory-bookmark-bunny', 'beastie'], p1: ['beastie'], t0: ['rethink', 'counterexample', 'lemma'] });
    onBoard(replay, 'p0c1', 'p1c0'); replay = play(replay, 'p0c0'); replay = play(replay, 'p0t0', 'p0c0');
    replay = act(pass(replay), { type: 'end' }); assert.equal(replay.players[0].hand.length, 1, 'only the bounced bunny');
    replay = E.applyAction(replay, E.legalActions(replay)[0]); replay = play(replay, 'p0c0');
    const held = replay.players[0].hand.length; replay = act(pass(replay), { type: 'end' });
    assert.equal(replay.players[0].hand.length, held + 1, 'one fresh delayed draw');
    for (const full of [false, true]) {
        let s = battle({ p0: ['memory-bookmark-bunny', 'beastie'], p1: ['beastie'], t0: full ? ['counterexample', 'lemma'] : [], options: { handLimit: 1 } });
        onBoard(s, 'p0c1', 'p1c0'); s = play(s, 'p0c0');
        if (full) toHand(s, 'p0t0');
        s = act(pass(s), { type: 'end' }); assert.equal(s.players[0].hand.length, full ? 1 : 0);
        invariants(s, assert);
    }
});

test('Pedro: zero attack falls, two swaps expire cleanly, and lasting/timed boosts follow normal swap rules', () => {
    let zero = battle({ p0: ['imagination-paradox-pony'], p1: ['beastie', 'beastie'] });
    onBoard(zero, 'p1c0'); zero.cards.p1c0.attack = 0;
    zero = play(zero, 'p0c0', 'p1c0'); assert.ok(zero.players[1].discard.includes('p1c0'));
    let twice = battle({ p0: ['imagination-paradox-pony', 'imagination-paradox-pony'], p1: ['beastie'] });
    onBoard(twice, 'p1c0'); twice.cards.p1c0.attack = 3; twice.cards.p1c0.health = 5;
    twice = play(twice, 'p0c0', 'p1c0'); twice = play(twice, 'p0c1', 'p1c0');
    assert.equal(atk(twice, 'p1c0'), 3); assert.equal(hp(twice, 'p1c0'), 5);
    twice = act(pass(twice), { type: 'end' });
    assert.equal(atk(twice, 'p1c0'), 3); assert.equal(hp(twice, 'p1c0'), 5);
    let boosts = battle({ p0: ['imagination-paradox-pony'], p1: ['beastie'] });
    onBoard(boosts, 'p1c0'); boosts.cards.p1c0.attack = 2; boosts.cards.p1c0.health = 4; boosts.cards.p1c0.damage = 1;
    boosts.cards.p1c0.buffs.push({ attack: 1, health: 2, temp: false }, { attack: 2, health: 3, untilStart: 99 });
    assert.equal(atk(boosts, 'p1c0'), 5); assert.equal(hp(boosts, 'p1c0'), 8);
    boosts = play(boosts, 'p0c0', 'p1c0'); assert.equal(atk(boosts, 'p1c0'), 8); assert.equal(hp(boosts, 'p1c0'), 5);
    boosts = act(pass(boosts), { type: 'end' });
    assert.equal(atk(boosts, 'p1c0'), 5); assert.equal(hp(boosts, 'p1c0'), 6);
});

test('a timed swap losing health at expiry defeats the creature before the draw phase, including lethal Last Word', () => {
    for (const victim of ['language-debate-dingo', 'emotion-grudge-goose']) {
        let s = battle({ p0: ['imagination-paradox-pony', 'beastie'], p1: [victim, 'beastie'], t0: ['counterexample'] });
        onBoard(s, 'p1c0'); s.cards.p1c0.attack = 5; s.cards.p1c0.health = 3;
        if (victim === 'emotion-grudge-goose') s.players[0].hearts = 1;
        s = play(s, 'p0c0', 'p1c0'); s = play(s, 'p0t0', 'p1c0');
        assert.equal(hp(s, 'p1c0'), 2);
        s = act(pass(s), { type: 'end' });
        assert.ok(s.players[1].discard.includes('p1c0'));
        invariants(s, assert);
        if (victim === 'emotion-grudge-goose') { assert.equal(s.winner, 1); assert.equal(s.phase, 'over'); }
        else assert.equal(s.phase, 'draw');
    }
});

test('Forked Reply respects Shield/Elusive and heals before deferred defeats and their Last Words', () => {
    let s = battle({ p0: ['beastie'], p1: ['emotion-grudge-goose', 'beastie'], t0: ['generic-forked-reply'] });
    onBoard(s, 'p1c0', 'p1c1'); s.cards.p1c0.damage = 2; s.players[0].hearts = 1;
    s.cards.p1c1.extraKeywords = ['shield'];
    s = play(s, 'p0t0', 'p1c0');
    assert.equal(s.players[0].hearts, 1); assert.equal(s.winner, null);
    assert.ok(s.players[1].discard.includes('p1c0')); assert.equal(s.cards.p1c1.damage, 0);
    for (const id of ['reason-exact-answer', 'perception-notice-the-crack', 'generic-forked-reply']) {
        const none = battle({ p0: ['beastie'], p1: ['shakirattle'], t0: [id] });
        onBoard(none, 'p1c0'); toHand(none, 'p0t0');
        assert.ok(!E.legalActions(none).some(a => a.type === 'play' && a.cid === 'p0t0'), id);
    }
});

test('the reviewed batch has real release metadata, existing art, readable text, catches, packs and backup survival', async () => {
    const cat = JSON.parse(fs.readFileSync(path.join(GAME_DIR, 'design/drafts/card-arena-2026-10-12/card-catalogue.json'), 'utf8'));
    const L = loadRift(['js/core/rift.js', 'js/core/state.js', 'js/core/world.js', 'js/core/acquisition.js', 'js/core/packs.js',
        'data/creatures.js', 'data/items.js', 'data/map.js', 'data/tactics.js', 'data/axioms.js', 'data/starters.js', 'data/assets.js',
        'js/battle/abilities.js', 'js/battle/conditional-cards.js', 'js/ui/card-text.js']);
    const s = L.State.freshState(); s.avatar = { type: 'owlet', variant: 'girl' }; L.State.grantStarter(s);
    const sources = { 'reason-counterexample-crow': 'b-school', 'emotion-grudge-goose': 'b-south-bridge',
        'language-debate-dingo': 'b-post', 'imagination-paradox-pony': 'b-clockmaker', 'memory-bookmark-bunny': 'b-kitchen' };
    const roster = L.Packs.roster(s);
    const assets = fs.readFileSync(path.join(GAME_DIR, 'data/assets.js'), 'utf8');
    assert.equal(new Set(BATCH.map(id => cat.cards.find(c => c.id === id).affinity)).size, 7);
    for (const id of BATCH) {
        const row = cat.cards.find(c => c.id === id), d = L.data.creatures[id] || L.data.tactics[id];
        assert.equal(row.runtimeRelease, 'expansion-4', id); assert.equal(d.release, 'expansion-4', id);
        assert.equal(d.cost, row.cost); assert.equal(d.rarity, row.rarity);
        assert.ok(roster.some(entry => entry.id === id && entry.weight > 0), id + ' pack source');
        if (sources[id]) {
            assert.equal(d.attack, row.attack); assert.equal(d.health, row.health); assert.equal(d.lines.length, 0);
            assert.ok(assets.includes("'creature/" + id + "/idle'"), id + ' existing portrait');
            assert.ok(L.CardText.fits(d.abilityText, 'framed'), id + ' readable face');
            const node = L.World.node(sources[id]); assert.equal(node.chapter, 'ch2'); assert.equal(node.type, 'puzzle');
            assert.ok(L.World.spawnWeights(s, node, { stars: 1 })[id] > 0, id + ' ordinary catch source');
            assert.equal(L.State.addCreature(s, L.State.makeCreature(id)), true);
        } else {
            assert.ok(assets.includes("'" + d.art + "'"), id + ' existing motif');
            assert.equal(L.State.grantPrint('tactic', id, s), true);
            assert.equal(L.State.grantPrint('tactic', id, s, { foil: true }), true);
        }
    }
    for (const row of L.Acquisition.entries) assert.ok(!roster.some(e => e.id === row.id), 'story-only ' + row.id);
    const plain = L.State.migrate(JSON.parse(JSON.stringify(s)));
    const backup = L.State.migrate(await L.State.decodeAsync('save', await L.State.encodePacked('save', s)));
    for (const copy of [plain, backup]) {
        for (const id of CREATURES) assert.equal(L.State.copiesOf(copy, id), 1, id);
        for (const id of SPELLS) assert.equal(L.State.cardCopies('tactic', id, copy), 2, id);
    }
    for (const id of SPELLS) {
        L.State.grantPrint('tactic', id, backup); L.State.grantPrint('tactic', id, backup);
        assert.equal(L.State.grantPrint('tactic', id, backup), false, id + ' four-copy cap');
    }
});

test('Hank delayed draws do not leak hidden deck order through previews or AI planning', () => {
    let s = battle({ p0: ['memory-bookmark-bunny', 'beastie'], p1: ['beastie'], t0: ['counterexample', 'lemma'] });
    onBoard(s, 'p0c1', 'p1c0'); s = pass(play(s, 'p0c0'));
    const a = { type: 'end', player: 1 }, before = JSON.stringify(s);
    const preview = E.previewAction(s, a, 1);
    const other = E.cloneState(s); other.players[0].deck.reverse();
    assert.deepEqual(JSON.parse(JSON.stringify(E.previewAction(other, a, 1))), JSON.parse(JSON.stringify(preview)));
    assert.doesNotMatch(JSON.stringify(preview), /Counterexample|Lemma/);
    for (const level of ['normal', 'competent', 'expert']) for (const salt of [0, 1]) {
        assert.equal(E.actionKey(AI.choose(other, { level, salt })), E.actionKey(AI.choose(s, { level, salt })), level);
        assert.equal(JSON.stringify(s), before, 'planning does not alter the match');
    }
});

test('AI self-play with all eight cards stays finite, preserves zones and actually plays every new card', () => {
    const seen = new Set(), deck = CREATURES.concat(['beastie', 'khaby', 'paper-dragon']);
    for (let seed = 0; seed < 8; seed++) {
        const s = E.createBattle({ seed: 'e4-fuzz-' + seed, players: [0, 1].map(p => ({ name: 'P' + p,
            team: deck.flatMap((species, i) => [0, 1].map(k => ({ uid: 'e4-' + p + '-' + i + '-' + k, species, powerDelta: 0, injuries: [], scars: [] }))),
            tactics: SPELLS.concat(SPELLS, ['counterexample', 'pep-talk']) })), options: { first: seed % 2, deckSize: 24, maxCreatures: 16 } });
        const end = AI.playOut(s, ['competent', 'competent'], (before, a, after) => {
            if (a.type === 'play') { const c = before.cards[a.cid]; seen.add(c.species || c.tactic); }
            invariants(after, assert);
        });
        assert.ok(end.winner != null, 'game ends');
    }
    for (const id of BATCH) assert.ok(seen.has(id), id + ' was played');
});
