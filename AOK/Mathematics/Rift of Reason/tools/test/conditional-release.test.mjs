// #148/#149 campaign release: the 23 waiting (conditional) cards open after two completed lessons
// (saved Gate + Town Hall wins) through one shared policy, on every grant, pack, reward, deck and import route.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadRift, GAME_DIR } from './harness.mjs';

const FILES = ['js/core/rift.js', 'js/core/state.js', 'js/core/world.js', 'js/core/acquisition.js', 'js/core/packs.js', 'js/core/quests.js',
    'data/creatures.js', 'data/items.js', 'data/map.js', 'data/starters.js', 'data/script/lesson1.js', 'data/script/lesson2.js',
    'data/axioms.js', 'data/tactics.js', 'data/fate.js', 'js/battle/abilities.js', 'js/battle/conditional-cards.js', 'js/battle/engine.js',
    'js/battle/ante.js', 'js/battle/team-codes.js'];
const KIND = { creature: 'creatures', tactic: 'tactics', axiom: 'axioms' };
const J = x => JSON.parse(JSON.stringify(x));

function setup(store = new Map()) {
    const R = loadRift(FILES); let screen = 'map';
    R.Router = { current: () => screen };
    R.storage = () => ({ getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) });
    R.State.newGame();
    R.State.update(s => { s.seed = 4321; s.avatar = { type: 'owlet', variant: 'girl', nickname: 'Tester' }; s.map.at = 'campfire'; s.wallet.coins = 2000; R.State.grantStarter(s); });
    R.State.saveNow();
    return { R, S: R.State, A: R.Acquisition, C: R.ConditionalCards, store };
}
const win = (S, ...ids) => S.update(s => { ids.forEach(id => { if (!s.map.completed.includes(id)) s.map.completed.push(id); }); });
const kindOf = (R, id) => (R.data.creatures[id] ? 'creature' : 'tactic');
const held = (R, s) => J(R.ConditionalCards.ids).filter(id => (kindOf(R, id) === 'creature' ? R.State.copiesOf(s, id) : R.State.cardCopies('tactic', id, s)) > 0);

test('the 23 cards ship in one production script, as released pack cards with 8 creatures and 15 spells', () => {
    const { R, C } = setup();
    const index = fs.readFileSync(path.join(GAME_DIR, 'index.html'), 'utf8');
    const at = f => index.indexOf('<script src="' + f + '"></script>');
    assert.ok(at('js/battle/abilities.js') >= 0 && at('js/battle/abilities.js') < at('js/battle/conditional-cards.js') && at('js/battle/conditional-cards.js') < at('js/battle/engine.js'));
    assert.ok(!index.includes('dev/conditional-'), 'no developer file is part of the game');
    assert.equal(C.ids.length, 23); assert.equal(C.creatures.length, 8); assert.equal(C.spells.length, 15); assert.equal(new Set(C.ids).size, 23);
    for (const id of C.ids) {
        const d = R.data[KIND[kindOf(R, id)]][id];
        assert.equal(d.release, 'conditional-1', id); assert.equal(d.packEligible, true, id); assert.ok(d.conditional, id);
        assert.equal(R.Acquisition.story(kindOf(R, id), id), null, id + ' is not a story card');
        if (kindOf(R, id) === 'creature') assert.ok(d.inspiredBy && d.abilityText && d.blurb, id);
    }
    assert.ok(!R.data.creatures[C.PAPER], 'the paper token is never a collectible creature');
});

test('two completed lessons is the only key: chapter, rift jumps, stars, scenes and journal labels never stand in', () => {
    const { R, S, A } = setup();
    assert.deepEqual(J(A.LESSON_BOSSES), ['gate', 'b-town-hall']);
    assert.equal(A.conditionalOpen(S.get()), false);
    // Everything except the two boss wins: later chapters by time rift, every other node done, seen win scenes, stars.
    S.update(s => {
        R.World.jumpToChapter(s, 'ch3'); R.World.jumpToChapter(s, 'ch4');
        Object.keys(R.data.map.nodes).filter(id => !A.LESSON_BOSSES.includes(id)).forEach(id => { s.map.completed.push(id); s.map.visitCount[id] = 3; });
        Object.assign(s.flags, { 'seen:ch1.gate.win': true, 'seen:ch2.hall.win': true, 'entered:ch2': true, 'entered:ch3': true, 'entered:ch4': true, 'dead:granny': true });
        s.chapter = 'ch4'; s.xp = 999;
    });
    assert.equal(A.conditionalOpen(S.get()), false, 'no substitute history qualifies');
    win(S, 'gate'); assert.equal(A.conditionalOpen(S.get()), false, 'Lesson 1 alone');
    S.update(s => { s.map.completed = s.map.completed.filter(id => id !== 'gate'); });
    win(S, 'b-town-hall'); assert.equal(A.conditionalOpen(S.get()), false, 'Lesson 2 alone');
    win(S, 'gate'); assert.equal(A.conditionalOpen(S.get()), true, 'both lessons');
    assert.equal(A.conditionalOpen(S.get()), true, 'asking again changes nothing');
    assert.equal(A.conditionalOpen(null), false);
});

test('an old qualified backup is recognised from its history; nothing new is stored and nothing is granted', async () => {
    const { R, S, A } = setup();
    const old = JSON.parse(fs.readFileSync(path.join(GAME_DIR, 'tools/test/fixtures/save-v1.json'), 'utf8'));
    old.map.completed = old.map.completed.concat(['gate', 'b-town-hall']); old.chapter = 'ch3';
    const s = J(await S.importCode(await S.encodePacked('save', old)));
    assert.ok(s.version > 1, 'the old save migrated');
    assert.equal(A.conditionalOpen(S.get()), true);
    const keys = Object.keys(S.get().flags).sort();
    // Ordinary reconciliation (plot catch-up, card tracks, colour spells) never hands out a waiting card.
    A.catchUp(); R.World.catchUpCards(); S.update(() => {}); S.update(() => {});
    assert.deepEqual(held(R, S.get()), []);
    assert.deepEqual(Object.keys(S.get().flags).filter(k => !keys.includes(k)).filter(k => /cond|wait|cards\./.test(k)), [], 'no unlock flag is written');
    // The code round trip keeps the qualification.
    await S.importCode(await S.exportCode());
    assert.equal(A.conditionalOpen(S.get()), true);
    // An old save with only a later chapter (a rift) does not qualify.
    const rift = JSON.parse(fs.readFileSync(path.join(GAME_DIR, 'tools/test/fixtures/save-v1.json'), 'utf8'));
    rift.chapter = 'ch3'; rift.map.completed.push('gate');
    await S.importCode(await S.encodePacked('save', rift));
    assert.equal(A.conditionalOpen(S.get()), false);
});

test('every grant route refuses waiting cards before the lessons and accepts them after', () => {
    const { R, S, A, C } = setup();
    const s = S.get();
    for (const id of C.ids) {
        if (kindOf(R, id) === 'creature') assert.equal(S.addCreature(s, S.makeCreature(id)), false, id);
        else assert.equal(S.grantPrint('tactic', id, s), false, id);
        assert.equal(A.usable(kindOf(R, id), id, s), false, id);
    }
    assert.deepEqual(held(R, s), []);
    // A side-story visitor or a spawn list naming one is skipped; the random practice team never shows one.
    const node = { id: 'test', type: 'puzzle', spawns: [C.creatures[0], 'lobstorian'] };
    assert.deepEqual(Object.keys(R.World.spawnWeights(s, node)), ['lobstorian']);
    s.flags['visitor:' + C.creatures[0]] = true;
    assert.notEqual(R.World.rollLoot(s, node, R.makeRng('loot')).species, C.creatures[0]);
    for (let i = 0; i < 60; i++) assert.ok(R.Battle.Engine.randomTeam(R.makeRng('rt' + i), 14, {}).every(c => !R.data.creatures[c.species].conditional));
    win(S, 'gate', 'b-town-hall');
    const t = S.get();
    for (const id of C.ids) {
        assert.equal(A.usable(kindOf(R, id), id, t), true, id);
        if (kindOf(R, id) === 'creature') assert.equal(S.addCreature(t, S.makeCreature(id)), true, id);
        else assert.equal(S.grantPrint('tactic', id, t), true, id);
    }
    assert.equal(held(R, t).length, 23, 'one copy each, only when asked for');
    delete t.flags['visitor:' + C.creatures[0]];
    assert.ok(Object.keys(R.World.spawnWeights(t, node)).includes(C.creatures[0]), 'a listed spawn works once open');
});

test('packs: waiting cards join only after both lessons; story cards stay out before and after', () => {
    const { R, S, A, C } = setup();
    const pool = () => R.Packs.roster(S.get()).map(e => e.kind + ':' + e.id);
    const before = pool();
    assert.ok(before.length > 0 && C.ids.every(id => !before.includes(kindOf(R, id) + ':' + id)));
    // Locked: many paid packs never contain one.
    for (let n = 0; n < 8; n++) {
        const q = R.Packs.quote(); const r = R.Packs.open(q, 'coins'); if (!r.ok) break;
        assert.ok(r.value.cards.every(c => !C.ids.includes(c.id))); R.Packs.finish(r.value.number);
    }
    assert.deepEqual(held(R, S.get()), []);
    win(S, 'gate', 'b-town-hall');
    // Unlock every story reward too: plot-only cards still never enter packs.
    S.update(s => { A.entries.forEach(row => { if (!s.map.completed.includes(row.node)) s.map.completed.push(row.node); }); });
    const after = pool();
    for (const id of C.ids) assert.ok(after.includes(kindOf(R, id) + ':' + id), id);
    for (const row of A.entries) assert.ok(!after.includes(row.kind + ':' + row.id), row.id);
    assert.equal(after.length, before.length + 23, 'the unlock adds exactly the 23 cards');
    const roster = R.Packs.roster(S.get());
    assert.ok(roster.filter(e => C.ids.includes(e.id)).every(e => e.rarity === 'uncommon'));
    // Open packs now draw real waiting cards, one counted copy each, through the same atomic purchase.
    S.update(s => { s.wallet.coins = 5000; });
    let got = 0;
    for (let n = 0; n < 20 && !got; n++) {
        const r = R.Packs.open(R.Packs.quote(), 'coins'); assert.ok(r.ok, r.error);
        got += r.value.cards.filter(c => C.ids.includes(c.id)).length; R.Packs.finish(r.value.number);
    }
    assert.ok(got > 0, 'a pack eventually holds a waiting card');
    assert.equal(held(R, S.get()).length > 0, true);
});

test('legacy ownership is kept but cannot be played before the lessons; the deck says why', () => {
    const { R, S, A, C } = setup();
    // An old or edited save that holds waiting cards without the two lessons.
    const seat = C.creatures.find(id => id.endsWith('seat-reserved')), spell = C.spells[0];
    S.update(s => {
        s.creatures.push(S.makeCreature(seat, { uid: 'legacy-seat' }));
        s.cardPrints.tactic[spell] = [false, true]; s.tactics.push(spell);
        s.team = s.creatures.filter(c => c.uid !== 'legacy-seat').slice(0, 11).map(c => c.uid).concat(['legacy-seat']);
        s.deckTactics = S.deckTactics(s).slice(0, 7).concat([spell]);
    });
    A.catchUp(); S.update(() => {});
    assert.ok(S.get().creatures.some(c => c.uid === 'legacy-seat'), 'never removed to enforce the lock');
    assert.equal(S.cardCopies('tactic', spell, S.get()), 2, 'prints and foil kept');
    const check = S.ownDeck(S.get()).check;
    assert.equal(check.valid, false);
    const locked = J(check.problems).filter(p => p.code === 'locked').map(p => p.id).sort();
    assert.deepEqual(locked, [seat, spell].sort());
    assert.match(check.problems.find(p => p.code === 'locked').text, /opens after two lessons/);
    // Trainer and team-code checks (no adventure given) are unchanged.
    assert.equal(S.validateDeck({ creatures: [seat], tactics: [spell] }, { complete: false }).problems.some(p => p.code === 'locked'), false);
    win(S, 'gate', 'b-town-hall');
    const open = S.ownDeck(S.get()).check;
    assert.equal(open.problems.some(p => p.code === 'locked'), false);
    assert.equal(open.valid, true, open.message);
});

test('a classmate ghost leaves its waiting cards out before the lessons, and keeps them after', () => {
    const { R, S, C } = setup();
    const T = R.Battle.TeamCodes, seat = C.creatures.find(id => id.endsWith('seat-reserved'));
    const creatures = ['lobstorian', 'tremendoodle', seat, seat].map((sp, i) => S.makeCreature(sp, { uid: 'g' + i }));
    const code = T.exportTeam({ nickname: 'Pal', creatures, tactics: ['eureka', C.spells[0]], axioms: [] });
    const locked = T.importTeam(code);
    assert.deepEqual(locked.team.map(c => c.species), ['lobstorian', 'tremendoodle']);
    assert.deepEqual(J(locked.tactics), ['eureka']);
    assert.deepEqual(J(locked.lockedCards), [R.data.creatures[seat].name, R.data.creatures[seat].name, R.data.tactics[C.spells[0]].name]);
    // The trophy for beating that ghost can only be a card the adventure could own.
    const ante = R.Battle.Ante.compute({ type: 'ghost', player: { items: { charm: 3 } }, opponent: R.Battle.TeamCodes.ghostOpponent(locked), seed: 'x' });
    assert.ok(!R.data.creatures[ante.opponent.trophy.species].conditional);
    assert.throws(() => T.importTeam(T.exportTeam({ nickname: 'All', creatures: [S.makeCreature(seat)], tactics: [], axioms: [] })), /open after two lessons/);
    win(S, 'gate', 'b-town-hall');
    const open = T.importTeam(code);
    assert.equal(open.team.length, 4); assert.deepEqual(J(open.lockedCards), []);
    assert.ok(open.tactics.includes(C.spells[0]));
});

test('introduction: a teaser after Lesson 1, an invitation after both, each once, granting nothing; the journal follows', () => {
    const { R, S, A, C } = setup();
    const entry = () => R.Quests.list(S.get()).find(q => q.id === 'cards:waiting');
    assert.equal(A.introDue(S.get()), null); assert.equal(entry(), undefined);
    win(S, 'gate');
    assert.equal(A.introDue(S.get()), 'cards.teaser');
    assert.equal(entry().status, 'locked'); assert.match(entry().locked, /Town Hall/);
    S.setFlag('seen:cards.teaser', true);
    assert.equal(A.introDue(S.get()), null, 'the teaser plays once');
    win(S, 'b-town-hall');
    assert.equal(A.introDue(S.get()), 'cards.invite');
    assert.equal(entry().status, 'new'); assert.equal(entry().node, 'campfire');
    S.setFlag('seen:cards.invite', true);
    assert.equal(A.introDue(S.get()), null, 'the invitation plays once; the Journal can replay it');
    assert.equal(entry().status, 'progress');
    assert.deepEqual(held(R, S.get()), [], 'seeing either scene grants nothing');
    S.update(s => { S.grantPrint('tactic', C.spells[2], s); });
    assert.equal(entry().status, 'done');
    // A player who qualifies at once (an old save) is invited without first being teased.
    const fresh = setup(); win(fresh.S, 'gate', 'b-town-hall');
    assert.equal(fresh.A.introDue(fresh.S.get()), 'cards.invite');
    // The scenes only talk: no gifts, items or keepsakes, and a fallback speaker when Granny is silent.
    const steps = list => list.flatMap(x => [x].concat(x.then ? steps(x.then) : [], x.else ? steps(x.else) : []));
    for (const key of ['cards.teaser', 'cards.invite']) {
        const all = steps(R.data.script[key]);
        assert.ok(all.length > 1, key);
        assert.ok(all.every(x => !x.give && !x.keepsake && !x.visitor && !x.flag), key + ' grants and sets nothing');
        assert.ok(all.some(x => x.s === 'syllo') && all.some(x => x.note), key + ' has a fallback speaker and a note');
    }
});

test('production board path: an owned deck arms Seat Reserved and its Guard takes the attack before damage', () => {
    const { R, S, C } = setup();
    const E = R.Battle.Engine, seat = C.creatures.find(id => id.endsWith('seat-reserved'));
    win(S, 'gate', 'b-town-hall');
    S.update(s => { for (let i = 0; i < 2; i++) S.addCreature(s, S.makeCreature(seat, { uid: 'seat-' + i, variant: { attack: 0, health: 0, trait: null } })); s.team = s.creatures.filter(c => !c.uid.startsWith('seat')).slice(0, 10).map(c => c.uid).concat(['seat-0', 'seat-1']); });
    const own = S.ownDeck(S.get());
    assert.equal(own.check.valid, true, own.check.message);
    let s = E.createBattle({ seed: 'release-seat', players: [{ name: 'You', team: own.team, tactics: own.tactics, axioms: own.axioms },
        { name: 'Rival', team: ['lobstorian', 'tremendoodle', 'paper-dragon'].map((sp, i) => S.makeCreature(sp, { uid: 'r' + i })), tactics: ['eureka'] }],
        options: { first: 0, shuffle: false, shuffleAxioms: false, openHand: [0, 0], openAxioms: 0, spark: false, timeline: false } });
    const move = (cid, zone) => { const P = s.players[s.cards[cid].owner]; ['deck', 'hand', 'board', 'discard'].forEach(z => { P[z] = P[z].filter(x => x !== cid); }); P[zone].push(cid); s.cards[cid].enteredTurn = 0; };
    const mine = Object.keys(s.cards).find(k => s.cards[k].owner === 0 && s.cards[k].species === seat);
    const foe = Object.keys(s.cards).find(k => s.cards[k].owner === 1 && s.cards[k].kind === 'creature');
    s.players[0].board.slice().forEach(cid => move(cid, 'deck'));
    move(mine, 'hand'); move(foe, 'board'); s.phase = 'main'; s.players.forEach(P => { P.energy = 10; P.capacity = 10; });
    const act = a => { s = E.applyAction(s, { ...a, player: E.decider(s) }); };
    assert.ok(E.legalActions(s).some(a => a.type === 'play' && a.cid === mine), 'arming is a legal play');
    act({ type: 'play', cid: mine });
    if (s.phase === 'choose') act(E.legalActions(s)[0]);
    assert.deepEqual(J(s.players[0].armed), [mine]);
    assert.equal(s.players[0].energy, 10 - R.data.creatures[seat].cost, 'arming is paid once');
    act({ type: 'end' });
    while (s.phase !== 'main') act(E.legalActions(s)[0]); // the rival's draw
    const hearts = s.players[0].hearts;
    act({ type: 'attack', cid: foe, target: 'h0' });
    if (s.phase === 'choose') act(E.legalActions(s)[0]);
    assert.ok(s.players[0].board.includes(mine), 'the masked Guard revealed onto the board');
    assert.equal(s.players[0].hearts, hearts, 'the hero took no damage');
    assert.equal(s.cards[mine].damage, 2, 'the Guard took the attack');
    assert.ok(E.fullLog(s).some(e => e.t === 'conditional-reveal' && e.cid === mine));
});

test('Memory waiting spells use the Memory quota; generic waiting creatures bring no colour spell', () => {
    const { R, S, C } = setup();
    for (const id of C.spells.filter(id => id.startsWith('conditional-memory-'))) assert.equal(R.data.tactics[id].colour, 'memory', id);
    const alarm = 'conditional-memory-second-alarm';
    const check = S.validateDeck({ creatures: ['lobstorian', 'tremendoodle'], tactics: [alarm] }, { complete: false });
    assert.ok(check.problems.some(p => p.code === 'quota' && p.colour === 'memory'), 'a Memory spell needs a Memory creature');
    win(S, 'gate', 'b-town-hall');
    S.update(s => { s.cardPrints.colours = {}; s.creatures = s.creatures.filter(c => (R.data.creatures[c.species] || {}).colour !== 'memory'); });
    const before = S.cardCopies('tactic', R.data.tacticDecks.colour.memory[0], S.get());
    let fresh = [];
    S.update(s => { S.addCreature(s, S.makeCreature(C.creatures.find(id => id.endsWith('seat-reserved')))); fresh = J(S.unlockColourTactics(s)); });
    assert.deepEqual(fresh, []);
    assert.equal(S.cardCopies('tactic', R.data.tacticDecks.colour.memory[0], S.get()), before, 'Seat Reserved is generic: no Memory spell');
});
