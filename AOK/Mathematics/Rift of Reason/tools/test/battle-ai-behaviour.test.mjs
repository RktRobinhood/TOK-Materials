// Card Arena AI behaviour a student can see: both levels develop their board (no passing
// with an affordable creature and room), Easy keeps the big twists for Hard, Easy stays
// beatable, Syllo's story challenge stays winnable, and the AI never reads hidden cards.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Rift, E, AI, setup, act, onBoard, toHand, toDiscard } from './battle-helpers.mjs';
import { loadRift } from './harness.mjs';

const TWISTS = ['reverse-hearts', 'empty-set'];
const pct = (a, b) => (100 * a / Math.max(1, b)).toFixed(1) + '%';

// Plays one battle and records every End turn: energy left, and whether a creature could
// still have been played (a legal creature play means it is affordable and the board has room).
function watch(s, levels, tally) {
    let guard = 0;
    while (E.winner(s) == null) {
        const p = E.decider(s);
        const level = levels[p];
        const a = AI.choose(s, { level });
        const t = tally[level];
        if (a.type === 'axiom' && level === 'easy' && TWISTS.includes(a.choice)) t.twists.push(a.choice);
        if (s.phase === 'main' && a.type === 'end') {
            t.ends += 1;
            t.unspent += s.players[p].energy;
            if (E.legalActions(s).some(x => x.type === 'play' && s.cards[x.cid].kind === 'creature')) t.passed += 1;
        }
        s = E.applyAction(s, a);
        if (++guard > 6000) throw new Error('battle did not finish');
    }
    return s;
}
const blank = () => ({ ends: 0, unspent: 0, passed: 0, twists: [] });

// Practice-style matchups: random teams, starter tactics, ten random starter axioms each.
function practice(tag, g, first) {
    const rng = Rift.makeRng('behaviour:' + tag + ':' + g);
    const teams = [0, 1].map(p => E.randomTeam(rng, 10, { prefix: tag + g + 'p' + p, legendaries: false }));
    const axioms = [0, 1].map(() => rng.shuffle(Rift.data.axiomDecks.starter).slice(0, 10));
    return E.createBattle({
        seed: 'behaviour:' + tag + ':' + g + ':' + first,
        players: teams.map((team, p) => ({ team, axioms: axioms[p] })),
        options: { mode: 'practice', first },
    });
}

test('over 300 seeded games both levels develop their board and Easy never plays the big twists', () => {
    const tally = { easy: blank(), hard: blank() };
    let hardWins = 0, heGames = 0;
    for (let g = 0; g < 50; g++) {
        for (const first of [0, 1]) {
            for (const hardSeat of [0, 1]) {
                const levels = hardSeat ? ['easy', 'hard'] : ['hard', 'easy'];
                const end = watch(practice('he', g, first), levels, tally);
                heGames += 1;
                if (end.winner === hardSeat) hardWins += 1;
            }
        }
    }
    for (let g = 0; g < 50; g++) for (const first of [0, 1]) watch(practice('ee', g, first), ['easy', 'easy'], tally);
    for (const level of ['easy', 'hard']) {
        const t = tally[level];
        assert.ok(t.ends > 500, level + ' ended enough turns to judge (' + t.ends + ')');
        assert.ok(t.passed / t.ends < 0.02, level + ' passed with an affordable creature and room in ' + pct(t.passed, t.ends) + ' of End turns');
        assert.ok(t.unspent / t.ends < 2.2, level + ' leaves ' + (t.unspent / t.ends).toFixed(2) + ' energy unspent on average');
    }
    assert.deepEqual(tally.easy.twists, [], 'Easy played a twist rule card');
    assert.ok(hardWins / heGames >= 0.7 && hardWins / heGames <= 0.92, 'Hard beats Easy ' + pct(hardWins, heGames) + ' (Easy beatable, not hopeless)');
});

test('with an affordable creature and an empty board, neither level ends its turn first', () => {
    for (const level of ['easy', 'hard']) {
        for (let i = 0; i < 60; i++) {
            let s = setup({ p0: ['kardashiant', 'keanu'], p1: ['astrophysicat'], energy: 3 });
            onBoard(s, 'p1c0');
            toHand(s, 'p0c0', 'p0c1');
            const played = [];
            for (let k = 0; k < 8 && s.active === 0 && s.winner == null; k++) {
                const a = AI.choose(s, { level, salt: 'dev' + i });
                if (a.type === 'end') break;
                if (a.type === 'play') played.push(a.cid);
                s = act(s, a);
            }
            assert.ok(played.length >= 1, level + ' (salt ' + i + ') played no creature');
        }
    }
});

test('Easy keeps The Last Shall Be First and Empty Set in hand, also when Axiomatic offers them', () => {
    // A losing Easy player would love to reverse the win rule; it still must not.
    for (let i = 0; i < 80; i++) {
        const s = setup({ p0: ['kardashiant'], p1: ['lobstorian', 'tremendoodle'], energy: 6 });
        onBoard(s, 'p0c0', 'p1c0', 'p1c1');
        s.players[0].hearts = 2;
        s.players[1].hearts = 10;
        s.players[0].axHand = ['reverse-hearts', 'empty-set', 'haste'];
        const a = AI.choose(s, { level: 'easy', salt: 'tw' + i });
        assert.ok(!(a.type === 'axiom' && TWISTS.includes(a.choice)), 'salt ' + i + ': ' + JSON.stringify(a));
    }
    // Axiomatic (Euclidon's Entrance) asks for a rule: Easy picks a calm one when it can.
    for (let i = 0; i < 40; i++) {
        let s = setup({ p0: ['euclidon'], axioms: ['reverse-hearts', 'empty-set', 'haste', 'mercy'] });
        toHand(s, 'p0c0');
        s = act(s, { type: 'play', cid: 'p0c0' });
        assert.equal(s.pending && s.pending.kind, 'axiom');
        const a = AI.choose(s, { level: 'easy', salt: 'ax' + i });
        assert.equal(a.type, 'choose');
        assert.ok(!TWISTS.includes(a.choice), 'Axiomatic chose ' + a.choice);
    }
});

test('the Predict colour guess uses only public cards, never the hidden hand or deck', () => {
    // Opponent: Astrophysicat on the board and Lobstorian in the discard (both seen, reason),
    // and three language creatures plus one reason creature not seen yet.
    const make = split => {
        const s = setup({ p0: ['altmanta'], p1: ['astrophysicat', 'lobstorian', 'tremendoodle', 'swiftlet', 'tremendoodle', 'lobstorian'], options: { deckSize: 6 } });
        onBoard(s, 'p0c0', 'p1c0');
        toDiscard(s, 'p1c1');
        split(s);
        const asked = act(s, { type: 'activate', cid: 'p0c0', ability: 'predict' });
        assert.equal(asked.pending && asked.pending.kind, 'colour');
        return asked;
    };
    const variants = [
        make(() => {}),                                            // all unseen cards in the deck
        make(s => toHand(s, 'p1c2', 'p1c3')),                       // two of them in hand
        make(s => { toHand(s, 'p1c5'); s.players[1].deck.reverse(); }), // other hand, other deck order
    ];
    // Lock the opponent's hidden zones: reading them at all is a bug.
    const locked = make(s => toHand(s, 'p1c4'));
    ['hand', 'deck'].forEach(zone => Object.defineProperty(locked.players[1], zone, { get() { throw new Error('the AI read the opponent\'s ' + zone); } }));
    variants.push(locked);
    const picks = variants.map(s => AI.choose(s, { level: 'hard' }).choice);
    assert.deepEqual(picks, picks.map(() => 'language'));
});

test('Syllo\'s story challenge stays winnable for a beginner-level player', () => {
    const SYLLO_TEAM = ['attenbirdough', 'eelish', 'beansprout', 'kardashiant', 'attenbirdough', 'eelish', 'zuckerborg', 'beansprout'];
    const SYLLO_TACTICS = ['look-it-up', 'look-it-up', 'clockwork', 'clockwork', 'stand-firm', 'eureka', 'pep-talk', 'occams-razor'];
    const R = loadRift([
        'js/core/rift.js', 'js/core/state.js', 'data/creatures.js', 'data/items.js', 'data/axioms.js', 'data/tactics.js', 'data/fate.js',
        'js/battle/abilities.js', 'js/battle/engine.js', 'js/battle/ai.js', 'js/battle/lesson.js',
    ]);
    const Eng = R.Battle.Engine;
    const tally = { easy: blank(), hard: blank() };
    let won = 0;
    const N = 60;
    for (let g = 0; g < N; g++) {
        let s = Eng.createBattle({
            seed: 'syllo-behaviour:' + g,
            players: [
                { team: R.Battle.Lesson.starter(), tactics: R.data.tacticDecks.starter, axioms: [] },
                { team: R.Battle.Lesson.team(SYLLO_TEAM, 'syllo-'), tactics: SYLLO_TACTICS },
            ],
            axiomDeck: ['underdog', 'thrift', 'three-actions', 'normal-hearts', 'mercy', 'arrival', 'age-of-reason'],
            options: { first: 0, shuffle: false, shuffleAxioms: false, deckSize: 16, mode: 'practice' },
        });
        // The player side plays at Easy level (a beginner); Syllo is Easy.
        let guard = 0;
        while (Eng.winner(s) == null && guard++ < 6000) {
            const p = Eng.decider(s);
            const a = R.Battle.AI.choose(s, { level: 'easy', salt: p ? '' : 'student' });
            if (p === 1 && s.phase === 'main' && a.type === 'end') {
                tally.easy.ends += 1;
                if (Eng.legalActions(s).some(x => x.type === 'play' && s.cards[x.cid].kind === 'creature')) tally.easy.passed += 1;
            }
            s = Eng.applyAction(s, a);
        }
        if (s.winner === 0) won += 1;
    }
    assert.ok(won / N >= 0.4, 'a beginner-level player beats Syllo in ' + pct(won, N));
    assert.ok(tally.easy.passed / tally.easy.ends < 0.02, 'Syllo passed with a playable creature in ' + pct(tally.easy.passed, tally.easy.ends));
});
