import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';

const Rift = loadRift(['js/core/rift.js', 'data/creatures.js', 'js/puzzles/registry.js', 'js/puzzles/liars-gate.js']);
const def = Rift.Puzzles.get('liars-gate');
const { solutions } = def._internal;

const RANGES = { 1: [2, 3], 2: [3, 4], 3: [4, 5] };

for (const d of [1, 2, 3]) {
    test(`difficulty ${d}: 1,000 seeded puzzles each have exactly one consistent world`, () => {
        for (let i = 0; i < 1000; i++) {
            const data = def.generate(Rift.makeRng(`lg-${d}-${i}`), d);
            const n = data.guards.length;
            assert.ok(n >= RANGES[d][0] && n <= RANGES[d][1], `guard count ${n} at d${d}`);
            assert.equal(data.doors.length, d === 3 ? 3 : 2);
            const sols = solutions(data.guards.map(g => g.says), data.doors.length);
            assert.equal(sols.length, 1, `seed lg-${d}-${i} has ${sols.length} solutions`);
            assert.ok(!/undefined|function|null/.test(JSON.stringify(data)), 'data is JSON-safe');
            assert.equal(new Set(data.guards.map(g => g.id)).size, n, 'guard ids unique');
            data.guards.forEach(g => assert.ok(g.text && /[.]$/.test(g.text), 'statement rendered'));
        }
    });

    test(`difficulty ${d}: solve() passes check(), a wrong answer fails with feedback`, () => {
        for (let i = 0; i < 200; i++) {
            const data = def.generate(Rift.makeRng(`chk-${d}-${i}`), d);
            const ans = def.solve(data);
            const ok = def.check(data, ans);
            assert.equal(ok.solved, true);
            assert.equal(ok.partial, 1);

            // Flip one guard: wrong, partial < 1, and the feedback names a contradiction.
            const first = data.guards[i % data.guards.length].id;
            const wrong = { roles: Object.assign({}, ans.roles), door: ans.door };
            wrong.roles[first] = wrong.roles[first] === 'truth' ? 'lie' : 'truth';
            const bad = def.check(data, wrong);
            assert.equal(bad.solved, false);
            assert.ok(bad.partial < 1 && bad.partial >= 0);
            assert.match(bad.feedback, /must be (true|false)/);

            // Right roles, wrong door: still fails with a contradiction.
            const wrongDoor = { roles: ans.roles, door: (ans.door + 1) % data.doors.length };
            const bd = def.check(data, wrongDoor);
            assert.equal(bd.solved, false);
            assert.equal(bd.partial, 1);
            assert.match(bd.feedback, /must be (true|false)/);

            // Missing marks are reported, not crashed on.
            assert.equal(def.check(data, { roles: {}, door: 0 }).solved, false);
            assert.equal(def.check(data, null).solved, false);
        }
    });

    test(`difficulty ${d}: hints and why() are well-formed`, () => {
        for (let i = 0; i < 100; i++) {
            const data = def.generate(Rift.makeRng(`hint-${d}-${i}`), d);
            const h = def.hints(data);
            assert.equal(h.length, 3);
            assert.match(h[0], /^Suppose /);
            const ans = def.solve(data);
            const named = data.guards.find(g => h[2].startsWith(g.name));
            assert.ok(named, 'last hint names a guard');
            assert.ok(h[2].includes(ans.roles[named.id] === 'truth' ? 'honest' : 'liar'), 'last hint gives the right role');
            const w = def.why(data);
            assert.ok(w.options.length >= 3 && w.options.length <= 4);
            assert.ok(w.correct >= 0 && w.correct < w.options.length);
            assert.match(w.options[w.correct], /Only one way/);
            assert.equal(new Set(w.options).size, w.options.length);
        }
    });
}

test('generation is deterministic for a seed', () => {
    for (const d of [1, 2, 3]) {
        const a = def.generate(Rift.makeRng('same-seed'), d);
        const b = def.generate(Rift.makeRng('same-seed'), d);
        assert.deepEqual(a, b);
    }
    assert.notDeepEqual(def.generate(Rift.makeRng('x1'), 3), def.generate(Rift.makeRng('x2'), 3));
});

test('difficulty signatures: d2 uses and/or/same-type, d3 uses if-then or counting', () => {
    for (let i = 0; i < 300; i++) {
        const d2 = def.generate(Rift.makeRng('sig2-' + i), 2);
        assert.ok(d2.guards.some(g => ['and', 'or', 'same', 'diff'].includes(g.says.t)));
        const d3 = def.generate(Rift.makeRng('sig3-' + i), 3);
        assert.ok(d3.guards.some(g => ['if', 'count'].includes(g.says.t)));
    }
});

test('works without creature data (generic guard names)', () => {
    const Bare = loadRift(['js/core/rift.js', 'js/puzzles/registry.js', 'js/puzzles/liars-gate.js']);
    const p = Bare.Puzzles.get('liars-gate');
    const data = p.generate(Bare.makeRng(1), 3);
    assert.ok(data.guards.every(g => g.name.startsWith('Guard ')));
    assert.equal(p.check(data, p.solve(data)).solved, true);
});

test('fallback puzzle is always uniquely solvable', () => {
    for (let i = 0; i < 200; i++) {
        const rng = Rift.makeRng('fb' + i);
        const n = rng.int(2, 5), k = rng.int(2, 3);
        assert.equal(solutions(def._internal.fallbackSays(rng, n, k), k).length, 1);
    }
});
