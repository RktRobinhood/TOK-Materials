// The three AI levels (design/card-arena-expansion-2026-10-07.md section 8): old names still work,
// every level picks legal moves, Expert stays fast and deterministic, Normal keeps the twists,
// Bag item actions are ignored, the built boss decks are legal 20-card decks, and a short seeded
// ladder keeps the levels in order. The full ladder (1,100 games a row) is
// `node tools/sim-battle.mjs --ladder`; set RIFT_LADDER=1 to also run a 400-game ladder here.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';
import { setup, onBoard, toHand } from './battle-helpers.mjs';

const R = loadRift([
    'js/core/rift.js', 'js/core/state.js', 'data/creatures.js', 'data/items.js', 'data/axioms.js', 'data/tactics.js', 'data/fate.js',
    'data/decks.js', 'js/battle/abilities.js', 'js/battle/engine.js', 'js/battle/ai.js', 'js/battle/lesson.js',
]);
const E = R.Battle.Engine, AI = R.Battle.AI;
const pct = (a, b) => (100 * a / Math.max(1, b)).toFixed(1) + '%';

function practice(tag, g, first, decks) {
    const rng = R.makeRng('levels:' + tag + ':' + g);
    const teams = [0, 1].map(p => E.randomTeam(rng, 10, { prefix: tag + g + 'p' + p, legendaries: false }));
    const axioms = [0, 1].map(() => rng.shuffle(R.data.axiomDecks.starter).slice(0, 10));
    return E.createBattle({
        seed: 'levels:' + tag + ':' + g + ':' + first,
        players: teams.map((team, p) => Object.assign({ team, axioms: axioms[p] }, decks && decks[p])),
        options: { mode: 'trainer', first },
    });
}

test('old level names still work: easy is Normal, hard is Competent', () => {
    assert.equal(AI.levelOf('easy'), 'normal');
    assert.equal(AI.levelOf('hard'), 'competent');
    assert.equal(AI.levelOf('expert'), 'expert');
    assert.equal(AI.levelOf(undefined), 'competent');
    assert.equal(JSON.stringify(AI.LEVEL_NAMES), JSON.stringify({ normal: 'Normal', competent: 'Competent', expert: 'Expert' }));
    assert.equal(AI.MISTAKE.easy, AI.MISTAKE.normal);
    assert.equal(AI.MISTAKE.hard, AI.MISTAKE.competent);
    // Same state and salt: the alias gives exactly the same move (and the same random stream).
    for (let g = 0; g < 4; g++) {
        let s = practice('alias', g, g % 2);
        for (let k = 0; k < 40 && E.winner(s) == null; k++) {
            assert.deepEqual(AI.choose(s, { level: 'easy', salt: 'x' }), AI.choose(s, { level: 'normal', salt: 'x' }));
            assert.deepEqual(AI.choose(s, { level: 'hard', salt: 'x' }), AI.choose(s, { level: 'competent', salt: 'x' }));
            s = E.applyAction(s, AI.choose(s, { level: 'competent' }));
        }
    }
});

test('every level picks legal moves to the end of a battle, and Expert is deterministic', () => {
    for (const level of ['normal', 'competent', 'expert']) {
        for (let g = 0; g < 3; g++) {
            let s = practice('legal-' + level, g, g % 2);
            let guard = 0;
            while (E.winner(s) == null) {
                const a = AI.choose(s, { level });
                assert.ok(a, level + ' found a move');
                if (level === 'expert' && guard % 7 === 0) assert.deepEqual(AI.choose(s, { level }), a, 'Expert repeats its choice');
                s = E.applyAction(s, a); // throws on an illegal move
                assert.ok(++guard < 3000, 'battle finished');
            }
        }
    }
});

test('Expert stays within its time budget (typical move well under 300 ms)', () => {
    const times = [];
    for (let g = 0; g < 4; g++) {
        let s = practice('time', g, g % 2);
        while (E.winner(s) == null) {
            const p = E.decider(s);
            const level = p === 0 ? 'expert' : 'competent';
            const t0 = performance.now();
            const a = AI.choose(s, { level });
            if (level === 'expert' && s.phase === 'main') times.push(performance.now() - t0);
            s = E.applyAction(s, a);
        }
    }
    times.sort((a, b) => a - b);
    const mean = times.reduce((a, b) => a + b, 0) / times.length;
    const p95 = times[Math.floor(0.95 * (times.length - 1))];
    assert.ok(times.length > 40, 'enough Expert moves (' + times.length + ')');
    // Measured alone on the teacher's i7-6700: mean ~20 ms, 99% under 200 ms. The full test suite
    // runs files in parallel, so the limits here leave room.
    assert.ok(mean < 120, 'Expert mean move ' + mean.toFixed(1) + ' ms');
    assert.ok(p95 < 300, 'Expert 95th-percentile move ' + p95.toFixed(1) + ' ms');
});

test('Expert finds a lethal line through a Guard (removal first, then the hero)', () => {
    // Enemy: 3 hearts behind a 1/2 Guard. Me: a ready 3-attack creature and Counterexample.
    let s = setup({ p0: ['shakirattle'], p1: ['attenbirdough'], t0: ['counterexample'] });
    onBoard(s, 'p0c0', 'p1c0');
    toHand(s, 'p0t0');
    s.players[1].hearts = 3;
    let guard = 0;
    while (s.winner == null && s.active === 0 && guard++ < 10) s = E.applyAction(s, AI.choose(s, { level: 'expert' }));
    assert.equal(s.winner, 0, 'Expert won this turn');
});

test('Normal never plays the twists, over many seeded turns', () => {
    const TWISTS = Object.keys(AI.NORMAL_TWISTS);
    let offered = 0;
    for (let i = 0; i < 60; i++) {
        const s = setup({ p0: ['kardashiant'], p1: ['lobstorian', 'tremendoodle'], energy: 6 });
        onBoard(s, 'p0c0', 'p1c0', 'p1c1');
        s.players[0].hearts = 1 + (i % 4);
        s.players[1].hearts = 12;
        s.players[0].axHand = ['reverse-hearts', 'empty-set', i % 2 ? 'haste' : 'mercy'];
        const legal = E.legalActions(s);
        if (legal.some(a => a.type === 'axiom' && TWISTS.includes(a.choice))) offered += 1;
        for (const level of ['normal', 'easy']) {
            const a = AI.choose(s, { level, salt: 'tw' + i });
            assert.ok(!(a.type === 'axiom' && TWISTS.includes(a.choice)), level + ' salt ' + i + ': ' + JSON.stringify(a));
        }
    }
    assert.ok(offered > 50, 'the twists were legal (' + offered + ')');
});

test('the AI never chooses a Bag item action', () => {
    const legalActions = E.legalActions;
    // Pretend the engine offers item uses in every main phase (the Bag adds { type: 'item' }).
    const withItems = s => {
        const list = legalActions(s);
        if (s.phase === 'main' && s.winner == null) list.push({ type: 'item', player: s.active, item: 'charm' }, { type: 'item', player: s.active, item: 'tonic' });
        return list;
    };
    try {
        for (const level of ['normal', 'competent', 'expert']) {
            let s = practice('item-' + level, 0, 0);
            for (let k = 0; k < 60 && E.winner(s) == null; k++) {
                E.legalActions = withItems;
                const a = AI.choose(s, { level, salt: 'i' + k });
                E.legalActions = legalActions;
                assert.notEqual(a.type, 'item', level + ' chose an item');
                s = E.applyAction(s, a);
            }
        }
    } finally {
        E.legalActions = legalActions;
    }
});

test('built boss decks are legal 20-card decks: real ids, their own colours, colour identity, a low curve', () => {
    const decks = R.data.decks;
    assert.ok(Object.keys(decks).length >= 3);
    for (const [id, d] of Object.entries(decks)) {
        assert.equal(d.creatures.length + d.tactics.length, 20, id + ' has 20 cards');
        assert.ok(d.creatures.length >= 6 && d.creatures.length <= 14, id + ' creatures 6–14');
        assert.ok(d.tactics.length >= 6 && d.tactics.length <= 14, id + ' tactics 6–14');
        d.creatures.forEach(sp => {
            const c = R.data.creatures[sp];
            assert.ok(c, id + ': unknown creature ' + sp);
            assert.ok(d.colours.includes(c.colour), id + ': ' + sp + ' is ' + c.colour);
            assert.ok(!c.legendary, id + ': no legendaries in boss decks (' + sp + ')');
        });
        const counts = {};
        d.tactics.forEach(t => {
            assert.ok(R.data.tactics[t], id + ': unknown tactic ' + t);
            const colour = R.data.tactics[t].colour;
            assert.ok(!colour || d.colours.includes(colour), id + ': ' + t + ' is a ' + colour + ' tactic outside the deck colours');
            counts[t] = (counts[t] || 0) + 1;
            assert.ok(counts[t] <= 2, id + ': at most 2 copies of ' + t);
        });
        const cheap = d.creatures.filter(sp => R.data.creatures[sp].cost <= 3).length;
        assert.ok(cheap >= 4, id + ' has ' + cheap + ' creatures costing 3 or less');
        assert.ok(d.creatures.every(sp => R.data.creatures[sp].cost <= 6), id + ' tops out at 6 energy');
        // The engine builds the deck as given: no loaned pad creatures.
        const team = d.creatures.map((species, i) => ({ uid: id + i, species, injuries: [], scars: [], powerDelta: 0, warped: null, trophyOf: null }));
        assert.equal(E.identityFilter(d.tactics, team).dropped.length, 0, id + ' obeys the colour identity rule');
        assert.ok(d.tactics.some(t => R.data.tactics[t].colour), id + ' has colour tactics');
        const s = E.createBattle({ seed: 'deck:' + id, players: [{ team, tactics: d.tactics }, { team: R.Battle.Lesson.starter() }] });
        const P = s.players[0];
        const all = P.deck.concat(P.hand);
        assert.equal(all.length, 20, id + ' builds a 20-card deck');
        assert.equal(all.filter(cid => s.cards[cid].kind === 'tactic').length, d.tactics.length);
    }
});

// Short seeded ladder: deterministic games, so the counts are stable; bands are wide for 32 games.
function ladderRow(a, b, games, decks, tag) {
    let wins = 0, n = 0;
    for (let g = 0; n < games; g++) {
        for (const seat of [0, 1]) {
            const levels = seat ? [b, a] : [a, b];
            const sideDecks = decks ? (seat ? [decks[1], decks[0]] : decks) : null;
            const end = AI.playOut(practice(tag, g, g % 2, sideDecks), levels);
            if (end.winner === seat) wins += 1;
            n += 1;
        }
    }
    return { wins, n };
}

test('short ladder: Competent beats Normal, Expert beats Competent', () => {
    const nc = ladderRow('competent', 'normal', 32, null, 'lad-nc');
    assert.ok(nc.wins / nc.n >= 0.55, 'Competent beats Normal ' + pct(nc.wins, nc.n));
    const ce = ladderRow('expert', 'competent', 24, null, 'lad-ce');
    assert.ok(ce.wins / ce.n >= 0.5, 'Expert beats Competent ' + pct(ce.wins, ce.n));
});

test('full ladder (RIFT_LADDER=1 only): close to the section 8 targets', { skip: !process.env.RIFT_LADDER }, () => {
    const deck = R.data.decks.constable;
    const boss = { team: deck.creatures.map((species, i) => ({ uid: 'b' + i, species, injuries: [], scars: [], powerDelta: 0, warped: null, trophyOf: null })), tactics: deck.tactics };
    const starter = { team: R.Battle.Lesson.starter(), tactics: R.data.tacticDecks.starter };
    const rows = [
        ['Competent vs Normal', ladderRow('competent', 'normal', 400, null, 'full-nc'), 0.62, 0.78],
        ['Expert vs Competent', ladderRow('expert', 'competent', 400, null, 'full-ce'), 0.57, 0.73],
        ['Expert deck vs Competent starter', ladderRow('expert', 'competent', 400, [boss, starter], 'full-boss'), 0.72, 0.9],
    ];
    rows.forEach(([name, r, lo, hi]) => assert.ok(r.wins / r.n >= lo && r.wins / r.n <= hi, name + ' ' + pct(r.wins, r.n)));
});
