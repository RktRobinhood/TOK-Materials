import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';

const Rift = loadRift(['js/core/rift.js', 'js/puzzles/registry.js', 'js/puzzles/three-act.js']);
const P = Rift.Puzzles.get('three-act');
const I = P.internals;
const plain = v => JSON.parse(JSON.stringify(v));
const SEEDS = 60;

// every task at every difficulty, many seeds
function each(fn) {
    for (const task of I.TASK_IDS) for (const d of [1, 2, 3]) for (let s = 0; s < SEEDS; s++) {
        fn(P.generate(Rift.makeRng('ta-' + task + '-' + d + '-' + s), d, { task }), task, d, s);
    }
}

// Independent answers, written from each task's story (not the puzzle's own formulas).
const ref = {
    hourglass: p => (p.cap - p.start) / p.rate,
    lanterns: p => (p.N - p.k) * p.s,
    tower: p => { let n = 0; while ((p.n0 + n) * p.h < p.H) n++; return n; },
    cauldron: p => { let t = 0, drops = p.S * p.D; while (drops < p.C * p.D) { drops += p.R; t++; } return t; },
    queue: p => { let ahead = p.Q, t = 0; while (ahead >= p.w) { ahead -= p.w; t += p.m; } return t; },
    tiles: p => (p.kind === 'linear' ? p.a * p.N + 1 : p.N * (p.N + p.b) + p.c),
};

test('registered with the required fields', () => {
    assert.equal(P.id, 'three-act');
    assert.equal(P.colour, 'imagination');
    assert.equal(P.family, 'Maths as thinking');
    assert.ok(P.tok && P.blurb);
    assert.equal(I.TASK_IDS.length, 6);
});

test('generate: well-formed, JSON-safe data', () => {
    each((data, task, d) => {
        assert.equal(data.task, task);
        assert.equal(data.difficulty, d);
        assert.doesNotThrow(() => JSON.stringify(data));
        assert.ok(data.answer > 0, task + ' answer positive');
        assert.ok(data.range.max > data.answer, 'slider range covers the answer');
        const ids = data.info.map(i => i.id);
        assert.equal(new Set(ids).size, ids.length, 'unique info ids');
        assert.ok(data.info.some(i => i.need), 'has necessary info');
        assert.ok(data.info.filter(i => !i.need).length >= 3, 'has red herrings');
        assert.ok(data.info.some(i => i.need && i.hidden), 'one necessary piece is missing until asked');
        assert.equal(data.wonders[0], data.question);
        assert.ok(data.tolerance > 0);
    });
    // without opts.task the task is picked by the rng, and all six turn up
    const seen = new Set();
    for (let s = 0; s < 200; s++) seen.add(P.generate(Rift.makeRng('any' + s), 2).task);
    assert.equal(seen.size, 6);
});

test("each task's true answer matches the end state of its Act 3 animation", () => {
    each((data, task) => {
        const T = I.TASKS[task];
        const p = data.p;
        assert.equal(T.answer(p), ref[task](p), task + ' formula vs independent answer');
        assert.equal(data.answer, T.answer(p));
        const sim = T.sim(p);
        const last = sim.post[sim.post.length - 1];
        assert.ok(T.done(p, last), task + ': the animation ends in the finished state');
        assert.ok(!sim.post.slice(0, -1).some(s => T.done(p, s)), task + ': and not before its last frame');
        assert.ok(!sim.pre.some(s => T.done(p, s)), task + ': Act 1 stops before the end');
        assert.equal(last.clock, data.answer, task + ': the animation clock shows the answer');
        // Act 3 picks up where Act 1 stopped
        assert.deepEqual(plain(sim.pre[sim.pre.length - 1]).clock, null);
    });
});

test('tiles: the drawn pattern really has the counted tiles', () => {
    each((data, task) => {
        if (task !== 'tiles') return;
        for (let n = 1; n <= data.p.N; n++) {
            const pts = I.tileCoords(data.p, n);
            assert.equal(new Set(pts.map(t => t.join(','))).size, pts.length, 'no overlapping tiles');
        }
        assert.equal(I.tileCoords(data.p, data.p.N).length, data.answer);
    });
});

test('solve() passes check()', () => {
    each(data => {
        const r = P.check(data, P.solve(data));
        assert.equal(r.solved, true, r.feedback);
        assert.equal(r.tidy, true);
    });
});

test('a model that ignores necessary information fails', () => {
    each((data, task) => {
        const T = I.TASKS[task];
        const good = P.solve(data);
        // 1. the common naive model (ignores something that matters) is outside the tolerance
        const naive = T.naive(data.p);
        assert.ok(Math.abs(naive - data.answer) > data.tolerance, task + ' d' + data.difficulty + ': naive ' + naive + ' vs ' + data.answer);
        const r1 = P.check(data, Object.assign({}, good, { model: naive }));
        assert.equal(r1.solved, false);
        // 2. a right number without asking for every necessary piece is not a model
        for (const need of data.info.filter(i => i.need)) {
            const r2 = P.check(data, Object.assign({}, good, { requested: good.requested.filter(id => id !== need.id) }));
            assert.equal(r2.solved, false, 'missing ' + need.id);
            assert.ok(r2.partial > 0 && r2.partial < 1);
        }
    });
});

test('check: tolerance, red herrings, reflection and bad input', () => {
    const data = P.generate(Rift.makeRng('chk'), 1, { task: 'lanterns' });
    const good = P.solve(data);
    // within the tolerance is fine (generous), just outside is not
    assert.equal(P.check(data, Object.assign({}, good, { model: data.answer + data.tolerance })).solved, true);
    assert.equal(P.check(data, Object.assign({}, good, { model: data.answer + data.tolerance + 1 })).solved, false);
    // a typed expression counts as a model
    assert.equal(P.check(data, Object.assign({}, good, { model: String(data.answer) + '+0' })).solved, true);
    // asking for red herrings still solves, but is not tidy
    const herring = data.info.find(i => !i.need).id;
    const r = P.check(data, Object.assign({}, good, { requested: good.requested.concat([herring]) }));
    assert.equal(r.solved, true);
    assert.equal(r.tidy, false);
    // no reflection: not yet
    assert.equal(P.check(data, Object.assign({}, good, { reflection: null })).solved, false);
    // any reflection is accepted
    for (let i = 0; i < data.reflections.length; i++) assert.equal(P.check(data, Object.assign({}, good, { reflection: i })).solved, true);
    // junk
    assert.equal(P.check(data, null).solved, false);
    assert.equal(P.check(data, {}).solved, false);
    assert.equal(P.check(data, Object.assign({}, good, { model: 'abc' })).solved, false);
    assert.equal(P.check(data, Object.assign({}, good, { requested: 'cap' })).solved, false);
});

test('tolerance is wider at difficulty 1', () => {
    assert.ok(I.toleranceFor(1, 100) > I.toleranceFor(2, 100));
    assert.ok(I.toleranceFor(2, 100) > I.toleranceFor(3, 100));
});

test('determinism: same seed, same puzzle', () => {
    for (const d of [1, 2, 3]) for (let s = 0; s < 20; s++) {
        const a = P.generate(Rift.makeRng('det' + s), d);
        const b = P.generate(Rift.makeRng('det' + s), d);
        assert.deepEqual(plain(a), plain(b));
        assert.deepEqual(plain(I.TASKS[a.task].sim(a.p)), plain(I.TASKS[b.task].sim(b.p)));
        assert.deepEqual(plain(P.why(a)), plain(P.why(b)));
    }
    const x = P.generate(Rift.makeRng('one'), 2), y = P.generate(Rift.makeRng('two'), 2);
    assert.notDeepEqual(plain(x), plain(y));
});

test('hints and why', () => {
    each(data => {
        const h = P.hints(data);
        assert.equal(h.length, 3);
        h.forEach(t => assert.ok(typeof t === 'string' && t.length > 10));
        const w = P.why(data);
        assert.equal(w.options.length, 4);
        assert.ok(/choosing what matters/.test(w.options[w.correct]));
    });
});

test('scratch tools: calculator and table extension', () => {
    assert.equal(I.evaluate('2+3×4'), 14);
    assert.equal(I.evaluate('(2+3)×4'), 20);
    assert.equal(I.evaluate('120 ÷ 8 − 1.5'), 13.5);
    assert.equal(I.evaluate('-3*-2'), 6);
    assert.equal(I.evaluate('2+'), null);
    assert.equal(I.evaluate('alert(1)'), null);
    assert.equal(I.evaluate(''), null);
    assert.equal(I.extend([[1, 4], [2, 7], [3, 10]], 20), 61);              // linear
    assert.equal(I.extend([[1, 2], [2, 6], [3, 12]], 10), 110);             // n(n+1)
    assert.equal(I.extend([[1, 5]], 10), null);
});
