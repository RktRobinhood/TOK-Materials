import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';

const Rift = loadRift(['js/core/rift.js', 'js/puzzles/registry.js', 'js/puzzles/tower.js']);
const def = Rift.Puzzles.get('tower');
const I = def._internal;

// ---- an independent brute force: all 2^n assignments, every clause ----

function bruteWorlds(data) {
    const n = data.atoms.length;
    const clauses = [].concat(...data.rules.map(r => r.clauses));
    const out = [];
    for (let w = 0; w < (1 << n); w++) {
        if (clauses.every(c => c.some(l => (((w >> l.a) & 1) === 1) === l.v))) out.push(w);
    }
    return out;
}
const holds = (w, lits) => lits.every(l => (((w >> l.a) & 1) === 1) === l.v);
const consistent = (worlds, lits) => worlds.some(w => holds(w, lits));
const entails = (worlds, premises, lits) => worlds.filter(w => holds(w, premises)).every(w => holds(w, lits));
const litsOf = blocks => [].concat(...blocks.map(b => b.lits));

const brute = new Map();
function worldsFor(data) {
    if (!brute.has(data)) brute.set(data, bruteWorlds(data));
    return brute.get(data);
}

function randomPath(data, rng, mode) {
    return data.questions.map(q => {
        if (mode === 'trap') {
            // Prefer an answer that clashes with the cover story.
            const ws = worldsFor(data);
            const bad = q.answers.filter(a => !consistent(ws, litsOf(data.base).concat(a.lits)));
            if (bad.length) return rng.pick(bad).id;
        }
        return rng.pick(q.answers).id;
    });
}

// ---- tests ----

for (const d of [1, 2, 3]) {
    const cfg = I.CFG[d];

    test(`difficulty ${d}: 150 stories, each with a fully consistent path that check() accepts`, () => {
        for (let i = 0; i < 150; i++) {
            const data = def.generate(Rift.makeRng(`tw-${d}-${i}`), d);
            assert.equal(data.questions.length, cfg.questions);
            assert.equal(data.base.length, 3);
            assert.ok(!/undefined|function|NaN/.test(JSON.stringify(data)), 'data is JSON-safe');
            assert.equal(JSON.stringify(JSON.parse(JSON.stringify(data))), JSON.stringify(data));
            const ids = new Set();
            data.questions.forEach(q => {
                assert.ok(q.answers.length >= 2 && q.answers.length <= 4, 'two to four answers');
                q.answers.forEach(a => { assert.ok(!ids.has(a.id)); ids.add(a.id); assert.ok(a.text && a.short); });
            });
            const path = def.solve(data);
            assert.equal(path.length, cfg.questions);
            assert.ok(path.every(Boolean));
            const r = def.check(data, path);
            assert.equal(r.solved, true, `seed tw-${d}-${i}: ${r.feedback}`);
            assert.equal(r.partial, 1);
            assert.ok(r.height >= 2 && typeof r.cemented === 'number');
            // Works on a JSON copy too (no hidden state on the data object).
            assert.equal(def.check(JSON.parse(JSON.stringify(data)), path).solved, true);
        }
    });

    test(`difficulty ${d}: the engine's worlds are exactly the brute-force worlds, and the solve path is consistent`, () => {
        for (let i = 0; i < 12; i++) {
            const data = def.generate(Rift.makeRng(`bw-${d}-${i}`), d);
            const ws = worldsFor(data);
            assert.deepEqual(Array.from(I.compile(data).worlds).sort((a, b) => a - b), ws);
            const path = def.solve(data);
            const chosen = path.map((id, qi) => data.questions[qi].answers.find(a => a.id === id));
            assert.ok(consistent(ws, litsOf(data.base).concat(litsOf(chosen))));
        }
    });

    test(`difficulty ${d}: every story hides a trap at least ${cfg.trapDist} steps from the cover story`, () => {
        for (let i = 0; i < 100; i++) {
            const data = def.generate(Rift.makeRng(`trap-${d}-${i}`), d);
            const t = I.deepestTrap(data);
            assert.ok(t && t.d >= cfg.trapDist, `seed trap-${d}-${i}: deepest trap ${t && t.d}`);
            const ws = worldsFor(data);
            assert.ok(!consistent(ws, litsOf(data.base).concat(t.a.lits)), 'the trap really contradicts the cover story');
            brute.delete(data);
        }
    });

    test(`difficulty ${d}: contradiction detection, cementing and collapse match brute force on random play`, () => {
        for (let i = 0; i < 25; i++) {
            const data = def.generate(Rift.makeRng(`play-${d}-${i}`), d);
            const ws = worldsFor(data);
            const rng = Rift.makeRng(`path-${d}-${i}`);
            for (const mode of ['random', 'trap', 'random']) {
                const path = randomPath(data, rng, mode);
                const state = I.newState(data);
                for (const id of path) {
                    if (state.done) break;
                    const before = state.blocks.map(b => ({ id: b.id, kind: b.kind, lits: b.lits, parents: b.parents.slice(), standing: b.standing, cracked: b.cracked }));
                    const stand = before.filter(b => b.standing);
                    const ans = data.questions[state.qi].answers.find(a => a.id === id);
                    const ok = consistent(ws, litsOf(stand).concat(ans.lits));
                    const ev = I.step(data, state, id);
                    assert.equal(ev.type, ok ? 'placed' : 'caught', 'contradiction detection matches brute force');

                    if (ev.type === 'placed') {
                        const base = stand.filter(b => b.kind === 'base');
                        assert.equal(ev.status === 'cemented', entails(ws, litsOf(base), ans.lits), 'cemented = proven from the cover story');
                        ev.block.parents.forEach(p => assert.ok(stand.some(b => b.id === p), 'rests on standing blocks'));
                        if (ev.status === 'cemented') {
                            ev.block.parents.forEach(p => {
                                const pb = state.blocks.find(b => b.id === p);
                                assert.ok(pb.kind === 'base' || pb.status === 'cemented', 'proven blocks rest only on proven blocks');
                            });
                            assert.ok(ev.block.proof.length >= 1);
                        }
                    } else {
                        // The core really clashes, and is minimal.
                        const core = stand.filter(b => ev.core.includes(b.id));
                        assert.equal(core.length, ev.core.length);
                        assert.ok(!consistent(ws, litsOf(core).concat(ans.lits)), 'core clashes with the answer');
                        core.forEach(b => assert.ok(consistent(ws, litsOf(core.filter(x => x !== b)).concat(ans.lits)), 'core is minimal'));
                        assert.ok(ev.explain.length >= 1);

                        // Exactly the dependent blocks are pulled.
                        const hit = new Set(ev.core);
                        const broken = core.filter(b => b.kind === 'base' && b.cracked).map(b => b.id);
                        assert.deepEqual([...ev.broken], [...broken]);
                        assert.deepEqual([...ev.cracked].sort(), [...core.filter(b => b.kind === 'base' && !b.cracked).map(b => b.id)].sort());
                        let expected;
                        if (broken.length) expected = stand.map(b => b.id);
                        else {
                            const gone = new Set();
                            for (const b of before) {
                                if (!b.standing || b.kind === 'base') continue;
                                if (hit.has(b.id) || b.parents.some(p => hit.has(p) || gone.has(p))) gone.add(b.id);
                            }
                            expected = [...gone];
                        }
                        assert.deepEqual([...ev.pulled].sort(), [...expected].sort(), 'collapse removes exactly the dependent blocks');
                        // Nothing else moved.
                        before.forEach(b => {
                            const now = state.blocks.find(x => x.id === b.id);
                            if (b.standing && !expected.includes(b.id)) assert.ok(now.standing, 'independent blocks stay up');
                        });
                    }
                    // Integrity: every standing block's supports are standing, and the tower stays consistent.
                    const standNow = state.blocks.filter(b => b.standing);
                    standNow.forEach(b => b.parents.forEach(p => assert.ok(standNow.some(x => x.id === p))));
                    if (!state.lost) assert.ok(consistent(ws, litsOf(standNow)));
                }
                const r = def.check(data, path);
                assert.equal(r.solved, !state.lost && state.done);
                assert.ok(r.partial >= 0 && r.partial <= 1);
            }
            brute.delete(data);
        }
    });

    test(`difficulty ${d}: hints and why() are well-formed`, () => {
        for (let i = 0; i < 60; i++) {
            const data = def.generate(Rift.makeRng(`hint-${d}-${i}`), d);
            const h = def.hints(data);
            assert.equal(h.length, 3);
            assert.match(h[0], /trace which base claim/);
            const t = I.deepestTrap(data);
            assert.ok(h[2].includes(t.a.text), 'last hint names the trap answer');
            const w = def.why(data);
            assert.equal(w.options.length, 4);
            assert.equal(new Set(w.options).size, 4);
            assert.ok(w.correct >= 0 && w.correct < 4);
            assert.ok(w.question && w.explain);
        }
    });
}

test('cemented blocks have a derivation from the cover story, and every derived step is sound', () => {
    for (let i = 0; i < 40; i++) {
        const data = def.generate(Rift.makeRng('sound-' + i), 1 + (i % 3));
        const ws = worldsFor(data);
        const p = I.propagate(data, litsOf(data.base).map(l => ({ a: l.a, v: l.v })));
        assert.equal(p.conflict, null);
        p.known.forEach((k, a) => { if (k) assert.ok(entails(ws, litsOf(data.base), [{ a, v: k.v }]), 'propagation never derives what is not proven'); });
        brute.delete(data);
    }
});

test('falling for traps loses the round; check() explains why', () => {
    let lost = 0;
    for (let i = 0; i < 60; i++) {
        const data = def.generate(Rift.makeRng('lose-' + i), 1 + (i % 3));
        const ws = worldsFor(data);
        // Always pick an answer that clashes with the current tower when one exists.
        const state = I.newState(data);
        const path = [];
        while (!state.done) {
            const q = data.questions[state.qi];
            const stand = state.blocks.filter(b => b.standing);
            const bad = q.answers.find(a => !consistent(ws, litsOf(stand).concat(a.lits))) || q.answers[0];
            path.push(bad.id);
            I.step(data, state, bad.id);
        }
        const r = def.check(data, path);
        if (state.lost) {
            lost++;
            assert.equal(r.solved, false);
            assert.match(r.feedback, /collapsed|comes down/);
        }
        brute.delete(data);
    }
    assert.ok(lost > 30, `only ${lost} of 60 trap-chasing runs lost`);
});

test('check() handles missing, partial and invalid answers', () => {
    const data = def.generate(Rift.makeRng('edge'), 2);
    assert.equal(def.check(data, null).solved, false);
    assert.equal(def.check(data, []).solved, false);
    assert.match(def.check(data, def.solve(data).slice(0, 2)).feedback, /still to go/);
    assert.equal(def.check(data, ['nope']).solved, false);
    assert.equal(def.check(data, { answers: def.solve(data) }).solved, true);
});

test('generation is deterministic for a seed', () => {
    for (const d of [1, 2, 3]) {
        assert.equal(JSON.stringify(def.generate(Rift.makeRng('same-seed'), d)), JSON.stringify(def.generate(Rift.makeRng('same-seed'), d)));
    }
    assert.notEqual(JSON.stringify(def.generate(Rift.makeRng('x1'), 2)), JSON.stringify(def.generate(Rift.makeRng('x2'), 2)));
    const data = def.generate(Rift.makeRng('replay'), 3);
    const path = randomPath(data, Rift.makeRng('p'), 'random');
    assert.equal(JSON.stringify(def.check(data, path)), JSON.stringify(def.check(data, path)));
});

test('difficulty raises questions, facts and trap depth', () => {
    const avg = d => {
        let facts = 0, depth = 0;
        for (let i = 0; i < 40; i++) {
            const data = def.generate(Rift.makeRng(`avg-${d}-${i}`), d);
            facts += data.rules.filter(r => r.kind === 'fact').length;
            depth += I.deepestTrap(data).d;
        }
        return { facts: facts / 40, depth: depth / 40 };
    };
    const a1 = avg(1), a2 = avg(2), a3 = avg(3);
    assert.ok(a1.facts < a2.facts && a2.facts < a3.facts);
    assert.ok(a1.depth < a2.depth && a2.depth < a3.depth);
    assert.ok(I.CFG[1].questions < I.CFG[2].questions && I.CFG[2].questions < I.CFG[3].questions);
});
