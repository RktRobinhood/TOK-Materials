import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';

const Rift = loadRift(['js/core/rift.js', 'js/puzzles/registry.js', 'js/puzzles/rule-hunter.js']);
const def = Rift.Puzzles.get('rule-hunter');
const lib = def.lib;
const plain = v => JSON.parse(JSON.stringify(v));

// Sampled domain: every triple of tiles 1..30.
const DOMAIN = [];
for (let a = 1; a <= 30; a++) for (let b = 1; b <= 30; b++) for (let c = 1; c <= 30; c++) DOMAIN.push([a, b, c]);
const truthTable = id => DOMAIN.map(t => lib.fits(id, t));
const equivalent = (x, y) => { const p = truthTable(x), q = truthTable(y); return p.every((v, i) => v === q[i]); };

const SEEDS = Array.from({ length: 60 }, (_, i) => 'seed-' + i);

test('registers with the required fields', () => {
    assert.ok(def);
    assert.equal(def.colour, 'memory');
    assert.equal(def.family, 'Pattern breakers');
    assert.ok(def.tok.length > 10 && def.blurb.length > 10);
    assert.ok(lib.RULES.length >= 20);
});

test('no two library rules are equivalent on the tile domain', () => {
    const tables = lib.RULES.map(r => truthTable(r.id).map(Number).join(''));
    assert.equal(new Set(tables).size, lib.RULES.length);
    lib.RULES.forEach(r => {
        const t = truthTable(r.id);
        assert.ok(t.some(Boolean) && t.some(v => !v), r.id + ' must be neither always nor never true');
    });
});

test('every rule is consistent with its generated starting example', () => {
    for (const r of lib.RULES) {
        for (let s = 0; s < 5; s++) {
            const built = lib.buildRules(Rift.makeRng(r.id + s), r.id, 5);
            assert.ok(built, 'could build a puzzle for ' + r.id);
            assert.ok(lib.fits(r.id, built.example), r.id + ' fits ' + built.example);
            built.candidates.forEach(c => assert.ok(lib.fits(c.id, built.example), c.id + ' fits example of ' + r.id));
        }
    }
});

test('starting examples fit many rules (like 2-4-6)', () => {
    for (const r of lib.RULES) {
        const ex = lib.topExamples(r.id, 1)[0];
        const n = lib.RULES.filter(q => lib.fits(q.id, ex)).length;
        assert.ok(n >= 6, r.id + ' example ' + ex + ' fits only ' + n + ' rules');
    }
});

test('candidate lists have exactly one correct rule; decoys are not equivalent', () => {
    for (const d of [1, 2]) {
        for (const seed of SEEDS.slice(0, 25)) {
            const data = def.generate(Rift.makeRng(seed), d);
            assert.equal(data.mode, 'rules');
            assert.equal(data.candidates.length, d === 1 ? 4 : 5);
            const correct = data.candidates.filter(c => c.id === data.secret);
            assert.equal(correct.length, 1);
            assert.equal(data.candidates[data.correct].id, data.secret);
            data.candidates.forEach((c, i) => {
                assert.ok(lib.fits(c.id, data.example));
                if (i !== data.correct) assert.ok(!equivalent(c.id, data.secret), c.id + ' ≡ ' + data.secret);
            });
            const tables = new Set(data.candidates.map(c => lib.signatures()[c.id].join('')));
            assert.equal(tables.size, data.candidates.length, 'candidates pairwise distinct');
        }
    }
});

test('generation is deterministic per seed and JSON-safe', () => {
    for (const d of [1, 2, 3]) {
        for (const seed of SEEDS.slice(0, 10)) {
            const a = def.generate(Rift.makeRng(seed), d);
            const b = def.generate(Rift.makeRng(seed), d);
            assert.deepEqual(plain(a), plain(b));
            assert.doesNotThrow(() => JSON.stringify(a));
        }
    }
    const x = plain(def.generate(Rift.makeRng('one'), 2));
    const y = plain(def.generate(Rift.makeRng('two'), 2));
    assert.notDeepEqual(x, y);
});

test('difficulty 3 is a pattern breaker; opts.mode overrides', () => {
    assert.equal(def.generate(Rift.makeRng('p'), 3).mode, 'pattern');
    assert.equal(def.generate(Rift.makeRng('p'), 1, { mode: 'pattern' }).mode, 'pattern');
    const r3 = def.generate(Rift.makeRng('p'), 3, { mode: 'rules' });
    assert.equal(r3.mode, 'rules');
    assert.equal(r3.candidates.length, 5);
    const fixed = def.generate(Rift.makeRng('p'), 1, { secret: 'ascending' });
    assert.equal(fixed.secret, 'ascending');
});

test('strategy: confirming-only vs tried-to-falsify', () => {
    const data = def.generate(Rift.makeRng('strategy'), 1, { secret: 'ascending' });
    const confirming = [[1, 2, 3], [10, 12, 14], [3, 5, 7]];
    const falsifying = [[1, 2, 3], [6, 4, 2], [5, 5, 5]];
    const wrong = data.candidates.findIndex((c, i) => i !== data.correct);

    const r1 = def.check(data, { rule: data.correct, tests: confirming });
    assert.equal(r1.strategy, 'confirming-only');
    assert.equal(r1.solved, true);
    assert.match(r1.feedback, /confirmation bias/i);

    const r2 = def.check(data, { rule: data.correct, tests: falsifying });
    assert.equal(r2.strategy, 'tried-to-falsify');
    assert.equal(r2.no, 2);
    assert.ok(r2.partial > r1.partial);

    const r3 = def.check(data, { rule: wrong, tests: confirming });
    assert.equal(r3.solved, false);
    assert.equal(r3.strategy, 'confirming-only');

    const r4 = def.check(data, { rule: data.correct, tests: [] });
    assert.equal(r4.strategy, 'confirming-only');

    // works for any secret: tests taken from the rule's own fitting triples are confirming-only
    for (const seed of SEEDS.slice(0, 20)) {
        const d = def.generate(Rift.makeRng(seed), 2);
        const yes = lib.topExamples(d.secret, 4);
        assert.equal(def.check(d, { rule: d.correct, tests: yes }).strategy, 'confirming-only');
        const no = yes.concat([lib.failingTriple(d.secret)]);
        assert.equal(def.check(d, { rule: d.correct, tests: no }).strategy, 'tried-to-falsify');
    }
});

test('check survives junk answers', () => {
    const data = def.generate(Rift.makeRng('junk'), 1);
    for (const ans of [null, {}, { rule: 99 }, { rule: 'x', tests: 'nope' }, { rule: 0, tests: [[0, 1, 2], [1, 2], [1, 2, 31], [1, 2, 3]] }]) {
        const r = def.check(data, ans);
        assert.equal(typeof r.solved, 'boolean');
        assert.equal(typeof r.feedback, 'string');
    }
});

test('solve() passes check with a falsifying strategy that rules out every decoy', () => {
    for (const d of [1, 2, 3]) {
        for (const seed of SEEDS) {
            const data = def.generate(Rift.makeRng(seed), d);
            const r = def.check(data, def.solve(data));
            assert.equal(r.solved, true, seed + ' d' + d);
            assert.equal(r.partial, 1);
            if (data.mode === 'rules') {
                assert.equal(r.strategy, 'tried-to-falsify');
                assert.equal(r.eliminated, true);
            }
        }
    }
});

test('hints and why are well formed', () => {
    for (const d of [1, 2, 3]) {
        for (const seed of SEEDS.slice(0, 15)) {
            const data = def.generate(Rift.makeRng(seed), d);
            const h = def.hints(data);
            assert.equal(h.length, 3);
            h.forEach(s => assert.ok(typeof s === 'string' && s.length > 10 && !/undefined|null/.test(s), s));
            const w = def.why(data);
            assert.ok(w.options.length >= 3);
            assert.ok(w.correct >= 0 && w.correct < w.options.length);
            assert.deepEqual(plain(def.why(data)), plain(w), 'why is deterministic');
        }
    }
});

test('Moser circle: 1, 2, 4, 8, 16, 31, 57, 99', () => {
    assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8].map(n => lib.moser(n)), [1, 2, 4, 8, 16, 31, 57, 99]);
    const s = lib.SEQUENCES.moser;
    assert.deepEqual(plain(s.ns.map(s.term)), ['1', '2', '4', '8', '16']);
    assert.equal(s.term(6), '31');
    assert.equal(s.term(7), '57');
});

test('prime pattern breakers hold, then break', () => {
    const S = lib.SEQUENCES;
    const big = n => BigInt(n);
    const isPrimeBig = s => { const n = Number(s); return lib.isPrime(n); };

    // n² + n + 41: prime for n = 0..39, 1681 = 41² at n = 40
    S.euler41.ns.forEach(n => assert.ok(isPrimeBig(S.euler41.term(n)), 'euler ' + n));
    assert.equal(S.euler41.ns.length, 40);
    assert.equal(S.euler41.term(40), '1681');
    assert.equal(41 * 41, 1681);

    // 31, 331, … 33333331 prime; 333333331 = 17 × 19607843
    S.threes.ns.forEach(k => assert.ok(isPrimeBig(S.threes.term(k)), 'threes ' + k));
    assert.equal(S.threes.term(8), '333333331');
    assert.equal(17 * 19607843, 333333331);

    // Fermat: 3, 5, 17, 257, 65537 prime; 2^32 + 1 = 641 × 6700417
    assert.deepEqual(plain(S.fermat.ns.map(S.fermat.term)), ['3', '5', '17', '257', '65537']);
    S.fermat.ns.forEach(n => assert.ok(isPrimeBig(S.fermat.term(n))));
    assert.equal(S.fermat.term(5), '4294967297');
    assert.equal(big(641) * big(6700417), big('4294967297'));

    // Mersenne: 3, 7, 31, 127 prime; 2^11 − 1 = 2047 = 23 × 89
    assert.deepEqual(plain(S.mersenne.ns.map(S.mersenne.term)), ['3', '7', '31', '127']);
    assert.equal(S.mersenne.term(11), '2047');
    assert.equal(23 * 89, 2047);
    assert.ok(!lib.isPrime(2047));

    // 111…1²: palindromic pyramid up to nine 1s, broken at ten
    assert.equal(S.repunit.term(9), '12345678987654321');
    assert.equal(S.repunit.term(10), '1234567900987654321');
});

test('pattern data: correct option is the true term, naive option is the pattern', () => {
    for (const id of Object.keys(lib.SEQUENCES)) {
        for (const seed of SEEDS.slice(0, 6)) {
            const data = def.generate(Rift.makeRng(seed), 3, { sequence: id });
            assert.equal(data.seq, id);
            assert.ok(data.correct >= 0 && data.naive >= 0 && data.correct !== data.naive);
            assert.ok(data.terms.length >= 3);
            assert.ok(data.lesson.correct >= 0);
            if (id === 'moser') assert.equal(data.options[data.correct], '31');
            const r = def.check(data, { predict: data.naive, lesson: data.lesson.correct });
            assert.equal(r.solved, true);
            assert.equal(r.fooled, true);
            const bad = def.check(data, { predict: data.correct, lesson: (data.lesson.correct + 1) % 4 });
            assert.equal(bad.solved, false);
        }
    }
});
