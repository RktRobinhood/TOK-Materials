import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';

const Rift = loadRift(['js/core/rift.js', 'js/puzzles/registry.js', 'js/puzzles/village.js']);
const def = Rift.Puzzles.get('village');
const { evaluate, worlds, solutions, table, mentions, worthSaying, fallback, CONFIG } = def._internal;
const says = data => data.villagers.map(v => v.says);

for (const d of [1, 2, 3]) {
    test(`difficulty ${d}: 1,000 seeded villages each have exactly one consistent world`, () => {
        const cfg = CONFIG[d];
        for (let i = 0; i < 1000; i++) {
            const data = def.generate(Rift.makeRng(`vg-${d}-${i}`), d);
            const n = data.villagers.length, k = data.imps;
            assert.ok(n >= cfg.n[0] && n <= cfg.n[1], `villager count ${n} at d${d}`);
            assert.ok(k >= cfg.k[0] && k <= cfg.k[1], `imp count ${k} at d${d}`);
            assert.equal(solutions(says(data), k).length, 1, `seed vg-${d}-${i} is not uniquely solvable`);
            assert.ok(!/undefined|function|null/.test(JSON.stringify(data)), 'data is JSON-safe');
            assert.equal(new Set(data.villagers.map(v => v.id)).size, n, 'one villager per job');
            data.villagers.forEach(v => {
                assert.ok(cfg.roles.includes(v.role), `${v.role} allowed at d${d}`);
                assert.ok(v.text && /[.]$/.test(v.text) && v.text.length < 110, 'statement rendered, short');
            });
        }
    });

    test(`difficulty ${d}: statements are never trivially self-referential (except the Sweep)`, () => {
        for (let i = 0; i < 300; i++) {
            const data = def.generate(Rift.makeRng(`self-${d}-${i}`), d);
            const all = says(data), k = data.imps;
            const ws = worlds(all.length, k);
            data.villagers.forEach((v, s) => {
                if (v.role === 'sweep') {
                    assert.equal(v.says.t, 'self');
                    assert.equal(v.text, 'I am honest.');
                    return;
                }
                assert.notEqual(v.says.t, 'self', 'only the Sweep talks about themself');
                assert.ok(!mentions(v.says).includes(s), `${v.role} names themself: ${v.text}`);
                // Its truth must not simply be "I am honest" / "I am an imp" in disguise,
                // nor always true / always false.
                const vals = ws.map(w => evaluate(v.says, w.imp, all));
                const own = ws.map(w => !w.imp[s]);
                assert.ok(vals.includes(true) && vals.includes(false), `${v.role}: constant statement ${v.text}`);
                assert.notDeepEqual(vals, own, `${v.role}: secretly "I am honest": ${v.text}`);
                assert.notDeepEqual(vals, own.map(x => !x), `${v.role}: secretly "I am an imp": ${v.text}`);
                assert.ok(worthSaying(v.says, s, all, k));
            });
        }
    });

    test(`difficulty ${d}: truth-table rows computed by the tool match the solver`, () => {
        for (let i = 0; i < 300; i++) {
            const data = def.generate(Rift.makeRng(`tt-${d}-${i}`), d);
            const n = data.villagers.length, k = data.imps;
            const rows = table(data);
            // C(n, k) rows, each exactly k imps, all different.
            let c = 1; for (let j = 0; j < k; j++) c = c * (n - j) / (j + 1);
            assert.equal(rows.length, c);
            assert.equal(new Set(rows.map(r => r.imps.join(','))).size, c);
            rows.forEach(r => assert.equal(r.imp.filter(Boolean).length, k));
            // A row is "possible" iff the solver says the world is consistent.
            const sol = solutions(says(data), k).map(w => w.list.join(','));
            const possible = rows.filter(r => r.possible).map(r => r.imps.join(','));
            assert.deepEqual(possible, sol);
            // Every impossible row has a clash the player can find, and clashes are
            // exactly "honest but false" or "imp but true".
            rows.forEach(r => {
                r.cells.forEach((val, j) => assert.equal(r.clash[j], val === r.imp[j]));
                if (!r.possible) assert.ok(r.clash.includes(true));
            });
            // The surviving row is solve()'s answer.
            const ans = def.solve(data);
            assert.deepEqual(rows.find(r => r.possible).imps.map(j => data.villagers[j].id), ans.imps);
            // The Sweep's column never clashes.
            const sw = data.villagers.findIndex(v => v.role === 'sweep');
            if (sw >= 0) rows.forEach(r => assert.equal(r.clash[sw], false));
        }
    });

    test(`difficulty ${d}: solve() passes check(), wrong answers fail with feedback`, () => {
        for (let i = 0; i < 200; i++) {
            const data = def.generate(Rift.makeRng(`chk-${d}-${i}`), d);
            const ans = def.solve(data);
            assert.equal(ans.imps.length, data.imps);
            const ok = def.check(data, ans);
            assert.equal(ok.solved, true);
            assert.equal(ok.partial, 1);
            assert.match(ok.feedback, /Unmasked/);
            // Order of ids doesn't matter.
            assert.equal(def.check(data, { imps: ans.imps.slice().reverse() }).solved, true);

            // Swap one imp for an honest villager: right count, wrong world, and
            // the feedback quotes a statement that contradicts it.
            const honest = data.villagers.map(v => v.id).filter(id => !ans.imps.includes(id));
            const wrong = { imps: ans.imps.slice() };
            wrong.imps[i % wrong.imps.length] = honest[i % honest.length];
            const bad = def.check(data, wrong);
            assert.equal(bad.solved, false);
            assert.ok(bad.partial < 1 && bad.partial >= 0);
            assert.match(bad.feedback, /must be (true|false)/);
            assert.match(bad.feedback, /“[^”]+”/, 'quotes the statement');

            // Too many / too few imps.
            const extra = def.check(data, { imps: ans.imps.concat([honest[0]]) });
            assert.equal(extra.solved, false);
            assert.match(extra.feedback, /exactly/);

            // Junk is reported, not crashed on.
            assert.equal(def.check(data, { imps: [] }).solved, false);
            assert.equal(def.check(data, null).solved, false);
            assert.equal(def.check(data, { imps: ['nobody'] }).solved, false);
        }
    });

    test(`difficulty ${d}: hints and why() are well-formed`, () => {
        for (let i = 0; i < 100; i++) {
            const data = def.generate(Rift.makeRng(`hint-${d}-${i}`), d);
            const ans = def.solve(data);
            const h = def.hints(data);
            assert.equal(h.length, 3);
            assert.match(h[0], /truth table/);
            assert.ok(!/undefined/.test(h.join(' ')));
            const named = data.villagers.find(v => h[2].startsWith('The ' + v.name + ' is honest'));
            assert.ok(named, 'last hint reveals one villager');
            assert.ok(!ans.imps.includes(named.id), 'and it is right');
            const w = def.why(data);
            assert.equal(w.options.length, 4);
            assert.equal(new Set(w.options).size, 4);
            assert.match(w.options[w.correct], /every world except this one contains a contradiction/);
            assert.ok(w.question && w.explain && !/undefined/.test(JSON.stringify(w)));
        }
    });
}

test('generation is deterministic for a seed', () => {
    for (const d of [1, 2, 3]) {
        const a = def.generate(Rift.makeRng('same-seed'), d);
        const b = def.generate(Rift.makeRng('same-seed'), d);
        assert.deepEqual(a, b);
        assert.deepEqual(def.why(a), def.why(b));
    }
    assert.notDeepEqual(def.generate(Rift.makeRng('x1'), 3), def.generate(Rift.makeRng('x2'), 3));
});

test('every job and statement type turns up', () => {
    const roles = new Set(), types = new Set();
    for (let i = 0; i < 300; i++) {
        const data = def.generate(Rift.makeRng('mix' + i), 1 + (i % 3));
        data.villagers.forEach(v => { roles.add(v.role); types.add(v.says.t); });
    }
    assert.deepEqual([...roles].sort(), Object.keys(def._internal.ROLES).sort());
    for (const t of ['imp', 'honest', 'count', 'same', 'diff', 'if', 'anyImp', 'noImp', 'odd', 'self', 'lying']) {
        assert.ok(types.has(t), 'statement type ' + t);
    }
});

test('the Gardener only talks about neighbours; the Baker about another statement', () => {
    for (let i = 0; i < 300; i++) {
        const data = def.generate(Rift.makeRng('nb' + i), 2 + (i % 2));
        data.villagers.forEach((v, s) => {
            if (v.role === 'gardener') v.says.of.forEach(j => assert.equal(Math.abs(j - s), 1));
            if (v.role === 'baker') {
                assert.equal(v.says.t, 'lying');
                assert.notEqual(v.says.g, s);
                assert.notEqual(data.villagers[v.says.g].says.t, 'lying');
            }
        });
    }
});

test('fallback village is uniquely solvable', () => {
    for (const d of [1, 2, 3]) {
        const data = fallback(Rift.makeRng('fb' + d), d);
        assert.equal(solutions(says(data), data.imps).length, 1);
        assert.equal(def.check(data, def.solve(data)).solved, true);
    }
});
