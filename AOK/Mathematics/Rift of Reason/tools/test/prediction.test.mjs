import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';

const Rift = loadRift(['js/core/rift.js', 'js/puzzles/registry.js', 'js/puzzles/prediction.js']);
const P = Rift.Puzzles.get('prediction');
const I = P.internals;
const plain = v => JSON.parse(JSON.stringify(v));

// ---- an independent re-implementation of the machine (not the puzzle's own) ----
// Order-k model: look at what followed every earlier occurrence of the last k-1
// choices; take the most frequent. Ties back off to shorter contexts, then to the
// favourite order.
function refGuess(data, hist) {
    const n = data.options.length;
    const tables = [];
    for (let k = data.order; k >= 1; k--) {
        const c = Array(n).fill(0);
        if (hist.length >= k - 1) {
            const key = hist.slice(hist.length - (k - 1)).join(',');
            for (let j = k - 1; j < hist.length; j++) {
                if (hist.slice(j - (k - 1), j).join(',') === key) c[hist[j]] += 1;
            }
        }
        tables.push(c);
    }
    let alive = new Set([...Array(n).keys()]);
    for (const c of tables) {
        const best = Math.max(...[...alive].map(i => c[i]));
        alive = new Set([...alive].filter(i => c[i] === best));
        if (alive.size === 1) return [...alive][0];
    }
    for (const i of data.tieOrder) if (alive.has(i)) return i;
    throw new Error('no guess');
}
function refWins(data, choices) {
    return choices.map((c, t) => c !== refGuess(data, choices.slice(0, t)));
}

const many = (d, count, fn) => {
    for (let s = 0; s < count; s++) fn(P.generate(Rift.makeRng('pm-' + d + '-' + s), d), s);
};

test('generate: well-formed data for every difficulty', () => {
    for (const d of [1, 2, 3]) many(d, 50, data => {
        assert.equal(data.difficulty, d);
        assert.equal(data.order, d);
        assert.equal(data.options.length, d === 1 ? 2 : 3);
        assert.deepEqual(plain([...data.tieOrder].sort()), plain(data.options.map((_, i) => i)));
        assert.equal(data.warmup, 10);
        assert.equal(data.block, 10);
        assert.ok(data.target > data.block * (1 - 1 / data.options.length), 'target beats chance');
        assert.equal(data.smoothing, d === 3);
        assert.doesNotThrow(() => JSON.stringify(data));
    });
    const targets = [1, 2, 3].map(d => P.generate(Rift.makeRng('t'), d).target);
    assert.ok(targets[0] < targets[1] && targets[1] < targets[2], 'target rises with difficulty: ' + targets);
});

test('determinism: same seed, same puzzle and same predictions', () => {
    for (const d of [1, 2, 3]) {
        const a = P.generate(Rift.makeRng('same-' + d), d);
        const b = P.generate(Rift.makeRng('same-' + d), d);
        assert.deepEqual(plain(a), plain(b));
        const rng = Rift.makeRng('ch-' + d);
        const choices = Array.from({ length: 40 }, () => rng.int(0, a.options.length - 1));
        assert.deepEqual(plain(I.replay(a, choices)), plain(I.replay(b, choices)));
        assert.deepEqual(plain(P.check(a, { choices, debrief: 0 })), plain(P.check(b, { choices, debrief: 0 })));
    }
});

test('the model matches an independent re-implementation on random and patterned play', () => {
    let compared = 0;
    for (const d of [1, 2, 3]) many(d, 40, (data, s) => {
        const n = data.options.length;
        const rng = Rift.makeRng('play-' + d + '-' + s);
        const sequences = [
            Array.from({ length: 50 }, () => rng.int(0, n - 1)),
            Array.from({ length: 30 }, (_, i) => i % n),
            Array.from({ length: 30 }, (_, i) => (i % 3 === 2 ? 1 : 0) % n),
            Array.from({ length: 20 }, () => 0),
        ];
        for (const seq of sequences) {
            for (let t = 0; t <= seq.length; t++) {
                const h = seq.slice(0, t);
                assert.equal(I.predict(data, h).guess, refGuess(data, h), 'd' + d + ' history ' + h.join(''));
                compared++;
            }
            assert.deepEqual(plain(I.replay(data, seq).map(r => r.win)), refWins(data, seq));
        }
    });
    assert.ok(compared > 1000);
});

test('confidence is the displayed ratio (raw, or add-one smoothed at difficulty 3)', () => {
    const d1 = P.generate(Rift.makeRng('c1'), 1);
    const p1 = I.predict(d1, [0, 0, 1, 0]);
    assert.equal(p1.guess, 0);
    assert.equal(p1.confidence, 3 / 4);
    assert.equal(I.predict(d1, []).confidence, 1 / 2);

    const d2 = P.generate(Rift.makeRng('c2'), 2);
    // after 0: 0→1, 0→1, 0→2 ; last is 0 → guess 1 with 2/3
    const p2 = I.predict(d2, [0, 1, 0, 1, 0, 2, 0]);
    assert.equal(p2.guess, 1);
    assert.equal(p2.decidedBy, 2);
    assert.equal(p2.confidence, 2 / 3);

    const d3 = P.generate(Rift.makeRng('c3'), 3);
    // context (0,1): followed by 2 twice → (2+1)/(2+3)
    const p3 = I.predict(d3, [0, 1, 2, 0, 1, 2, 0, 1]);
    assert.equal(p3.guess, 2);
    assert.equal(p3.confidence, 3 / 5);
    assert.ok(I.predict(d3, [0, 1, 2]).probs.every(x => x > 0), 'smoothing never says 0%');
});

test('ties back off to shorter contexts, then to the seeded favourite', () => {
    const data = P.generate(Rift.makeRng('tie'), 2);
    // empty history: all tied everywhere → favourite
    const p0 = I.predict(data, []);
    assert.equal(p0.decidedBy, 0);
    assert.equal(p0.guess, data.tieOrder[0]);
    // last choice 2 never seen before as context → bigram tied → overall counts decide (0 most frequent)
    const p = I.predict(data, [0, 0, 1, 0, 2]);
    assert.equal(p.decidedBy, 1);
    assert.equal(p.guess, 0);
    // different seeds give different favourites somewhere
    const favs = new Set();
    for (let s = 0; s < 20; s++) favs.add(P.generate(Rift.makeRng('fav' + s), 2).tieOrder.join());
    assert.ok(favs.size > 1);
});

test('solve() passes check for every difficulty and seed', () => {
    for (const d of [1, 2, 3]) many(d, 60, data => {
        const ans = P.solve(data);
        const r = P.check(data, ans);
        assert.equal(r.solved, true, r.feedback);
        // and its wins are real according to the independent model
        const wins = refWins(data, ans.choices).slice(data.warmup).filter(Boolean).length;
        assert.ok(wins >= data.target);
    });
});

test('a naive alternating pattern loses to the bigram model', () => {
    many(2, 30, data => {
        const choices = Array.from({ length: data.warmup + data.block }, (_, i) => i % 2);
        const sc = I.score(data, choices);
        assert.ok(sc.blocks[0].wins <= 2, 'alternating won ' + sc.blocks[0].wins);
        assert.ok(sc.warmupWins <= 4, 'the machine wins most of the warm-up too');
        const r = P.check(data, { choices, debrief: P.why(data).correct });
        assert.equal(r.solved, false);
        assert.ok(r.partial < 0.6);
    });
    // and so does repeating a cycle of three against the trigram model
    many(3, 30, data => {
        const choices = Array.from({ length: data.warmup + data.block }, (_, i) => i % 3);
        assert.equal(P.check(data, { choices, debrief: P.why(data).correct }).solved, false);
    });
});

test('check() never trusts reported results', () => {
    for (const d of [1, 2, 3]) many(d, 20, data => {
        const correct = P.why(data).correct;
        // a losing record with forged claims
        const lose = [];
        for (let t = 0; t < data.warmup + data.block; t++) lose.push(I.predict(data, lose).guess);
        assert.equal(refWins(data, lose).filter(Boolean).length, 0);
        for (const forged of [
            { choices: lose, debrief: correct, wins: data.block },
            { choices: lose, debrief: correct, wins: data.target, solved: true },
            { choices: lose, debrief: correct, predictions: lose.map(c => (c + 1) % data.options.length) },
            { choices: lose, debrief: correct },
        ]) assert.equal(P.check(data, forged).solved, false);
        // a real win with a lying record is rejected too
        const ans = P.solve(data);
        assert.equal(P.check(data, Object.assign({}, ans, { wins: 0 })).solved, false);
        const realPreds = I.replay(data, ans.choices).map(r => r.guess);
        assert.equal(P.check(data, Object.assign({}, ans, { predictions: realPreds })).solved, true);
        // malformed input
        assert.equal(P.check(data, null).solved, false);
        assert.equal(P.check(data, { choices: 'abc' }).solved, false);
        assert.equal(P.check(data, { choices: ans.choices.map(() => 7), debrief: correct }).solved, false);
        assert.equal(P.check(data, { choices: ans.choices.slice(0, 5), debrief: correct }).solved, false);
        assert.equal(P.check(data, { choices: ans.choices.map(c => c + 0.5), debrief: correct }).solved, false);
        assert.equal(P.check(data, { choices: Array(data.warmup + data.block * data.maxBlocks + 1).fill(0), debrief: correct }).solved, false);
        // a win with the wrong debrief is only partial
        const wrong = P.check(data, { choices: ans.choices, debrief: (correct + 1) % 4 });
        assert.equal(wrong.solved, false);
        assert.equal(wrong.partial, 0.7);
    });
});

test('the warm-up does not count; a later block can still win', () => {
    const data = P.generate(Rift.makeRng('later'), 2);
    const choices = [];
    // 10 warm-up rounds, then a block that loses, then a winning block
    for (let t = 0; t < data.warmup + data.block; t++) choices.push(I.predict(data, choices).guess);
    assert.equal(P.check(data, { choices: choices.slice(), debrief: P.why(data).correct }).solved, false);
    for (let i = 0; i < data.target; i++) choices.push(I.beat(data, choices));
    assert.equal(P.check(data, { choices, debrief: P.why(data).correct }).solved, true);
    // winning only in the warm-up is not enough
    const early = [];
    for (let t = 0; t < data.warmup; t++) early.push(I.beat(data, early));
    for (let t = 0; t < data.block; t++) early.push(I.predict(data, early).guess);
    assert.equal(P.check(data, { choices: early, debrief: P.why(data).correct }).solved, false);
});

test('hints, why and text', () => {
    for (const d of [1, 2, 3]) {
        const data = P.generate(Rift.makeRng('w' + d), d);
        const h = P.hints(data);
        assert.equal(h.length, 3);
        assert.match(h[0], /table/);
        const w = P.why(data);
        assert.equal(w.options.length, 4);
        assert.match(w.options[w.correct], /^Only how often/);
        assert.match(w.question, /know about you/);
    }
    assert.equal(P.colour, 'memory');
    assert.equal(P.family, 'Pattern breakers');
    assert.ok(P.tok.length > 20 && P.blurb.length > 20);
});
