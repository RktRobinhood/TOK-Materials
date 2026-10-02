import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';

const Rift = loadRift(['js/core/rift.js', 'js/puzzles/registry.js', 'js/puzzles/oracle.js']);
const P = Rift.Puzzles.get('oracle');
const I = P.internals;
const plain = v => JSON.parse(JSON.stringify(v));

const many = (d, count, fn) => {
    for (let s = 0; s < count; s++) fn(P.generate(Rift.makeRng('om-' + d + '-' + s), d), s);
};

// Every combination of the step's free variables over their ranges (capped),
// run through the puzzle's own number tester.
function sampleStep(data, i) {
    const names = I.stepVars(data, i);
    const vars = names.map(n => data.vars.find(v => v.name === n));
    const lists = vars.map(v => {
        const out = [];
        for (let x = v.min; x <= v.max; x++) out.push(x);
        return out;
    });
    let envs = [{}];
    lists.forEach((list, k) => {
        const next = [];
        envs.forEach(e => list.forEach(x => next.push(Object.assign({}, e, { [vars[k].name]: x }))));
        envs = next;
    });
    if (envs.length > 20000) envs = envs.filter((_, k) => k % Math.ceil(envs.length / 20000) === 0);
    let fit = 0, fails = 0;
    let firstFail = null;
    for (const e of envs) {
        const r = I.testStep(data, i, e);
        if (!r.fits) continue;
        fit++;
        if (!r.ok) { fails++; if (!firstFail) firstFail = e; }
    }
    return { fit, fails, firstFail, n: envs.length };
}

function eachData(fn) {
    for (const d of [1, 2, 3]) many(d, 120, (data, s) => fn(data, d, s));
}

test('generate: well-formed, JSON-safe data at every difficulty', () => {
    const kinds = { 1: new Set(), 2: new Set(), 3: new Set() };
    const flaws = new Set();
    eachData((data, d) => {
        assert.equal(data.difficulty, d);
        kinds[d].add(data.kind);
        assert.ok(data.steps.length >= 3);
        assert.ok(data.steps.every(s => typeof s.text === 'string' && s.text.length > 3));
        assert.doesNotThrow(() => JSON.stringify(data));
        assert.deepEqual(plain(data), JSON.parse(JSON.stringify(data)));
        if (data.kind === 'flawed') {
            flaws.add(data.flaw);
            assert.ok(data.flawOptions.includes(data.flaw));
            // all seven at difficulty 3, minus any second flaw type that is also accepted
            assert.equal(data.flawOptions.length, d === 1 ? 3 : d === 2 ? 4 : 7 - data.alsoAccept.length);
            assert.equal(new Set(data.flawOptions).size, data.flawOptions.length);
            data.alsoAccept.forEach(id => assert.ok(!data.flawOptions.includes(id) || id === data.flaw));
            assert.equal(data.trust, undefined);
        } else {
            assert.equal(data.flawStep, null);
            assert.equal(data.trust.options.length, 4);
        }
    });
    assert.deepEqual([...kinds[1]], ['flawed']);
    assert.ok(kinds[2].has('correct') && kinds[2].has('flawed') && !kinds[2].has('machine'));
    assert.ok(kinds[3].has('machine') && kinds[3].has('correct') && kinds[3].has('flawed'));
    assert.deepEqual([...flaws].sort(), [...I.FLAW_IDS].sort(), 'every flaw type appears');
});

test('every flawed proof: steps before the flaw hold, and the flaw step is genuinely wrong', () => {
    let checked = 0;
    eachData(data => {
        if (data.kind !== 'flawed') return;
        for (let i = 0; i < data.flawStep; i++) {
            const r = sampleStep(data, i);
            assert.ok(r.fit > 0, data.template + ' step ' + i + ' has values that fit');
            assert.equal(r.fails, 0, data.template + ': step ' + (i + 1) + ' "' + data.steps[i].text + '" failed at ' + JSON.stringify(r.firstFail));
        }
        const f = data.steps[data.flawStep];
        assert.ok(f.claim, 'the flaw step has a testable claim');
        const r = sampleStep(data, data.flawStep);
        assert.ok(r.fails > 0, data.template + ': flaw step "' + f.text + '" never fails numerically');
        checked++;
    });
    assert.ok(checked > 200, 'checked ' + checked);
});

test('every correct proof (including the machine proofs) holds numerically on every step', () => {
    let checked = 0;
    eachData(data => {
        if (data.kind === 'flawed') return;
        data.steps.forEach((s, i) => {
            const r = sampleStep(data, i);
            assert.equal(r.fails, 0, data.template + ': step ' + (i + 1) + ' "' + s.text + '" failed at ' + JSON.stringify(r.firstFail));
            if (s.claim) assert.ok(r.fit > 0);
        });
        checked++;
    });
    assert.ok(checked > 40, 'checked ' + checked);
});

test('the number tester: classic counter-examples', () => {
    const rng = Rift.makeRng('tester');
    // n² + n + 41 at n = 40 is 41 × 41
    const fc = I.T['few-cases'](rng, 3);
    const data = { vars: fc.vars, lets: [], given: [], steps: fc.steps };
    const last = fc.flawStep;
    const p = Number(/\+(\d+)$/.exec(fc.steps[last].claim.l)[1]);
    const n = fc.steps[last].claim.l.includes('-n') ? p : p - 1;
    const r = I.testStep(data, last, { n });
    assert.equal(r.ok, false);
    assert.equal(r.result.factor, p);
    // √(x²) ≠ x for x = −3
    assert.equal(I.evaluate('sqrt(x^2)', { x: -3 }), 3);
    assert.equal(I.evaluate('-x^2', { x: 3 }), -9);
    assert.equal(I.evaluate('mod(-7, 4)'), 1);
    assert.equal(I.evaluate('count(1,3)'), 3);
    assert.equal(I.evaluate('sum(1,10)'), 55);
    assert.equal(I.evaluate('2*(3+4)^2/7'), 14);
    // a given that does not fit is reported, not counted as a failure
    const nonSeq = P.generate(Rift.makeRng('om-2-0'), 2);
    assert.ok(nonSeq);
    assert.equal(I.pretty('a^2-a*b'), 'a² − ab');
    assert.equal(I.pretty('(a+b)*(a-b)'), '(a + b)(a − b)');
    assert.equal(I.pretty('x^2=(-x)^2'), 'x² = (−x)²');
});

test('solve() passes check() everywhere', () => {
    eachData(data => {
        const r = P.check(data, P.solve(data));
        assert.equal(r.solved, true, r.feedback);
        assert.equal(r.partial, 1);
    });
});

test('wrong answers fail with feedback', () => {
    eachData(data => {
        const correct = P.solve(data);
        const bad = [];
        if (data.kind === 'flawed') {
            bad.push({ step: null, flaw: null });
            if (data.flawStep > 0) bad.push({ step: data.flawStep - 1, flaw: data.flaw });
            if (data.flawStep < data.steps.length - 1) bad.push({ step: data.flawStep + 1, flaw: data.flaw });
            const wrongFlaw = data.flawOptions.find(id => id !== data.flaw);
            const r = P.check(data, { step: data.flawStep, flaw: wrongFlaw });
            assert.equal(r.solved, false);
            assert.equal(r.partial, 0.6);
            assert.match(r.feedback, /Right step/);
            data.alsoAccept.forEach(id => assert.equal(P.check(data, { step: data.flawStep, flaw: id }).solved, true));
        } else {
            for (let i = 0; i < data.steps.length; i++) bad.push({ step: i, flaw: I.FLAW_IDS[0] });
            const r = P.check(data, { step: null, flaw: null, trust: (correct.trust + 1) % 4 });
            assert.equal(r.solved, false);
            assert.equal(r.partial, 0.6);
            assert.equal(P.check(data, { step: null, flaw: null }).solved, false);
        }
        bad.forEach(a => {
            const r = P.check(data, a);
            assert.equal(r.solved, false, JSON.stringify(a));
            assert.ok(r.feedback.length > 10);
            assert.ok(r.partial < 0.5);
        });
        for (const junk of [null, undefined, {}, 'step', { step: 99 }, { step: -1 }, { step: 1.5 }]) {
            const r = P.check(data, junk);
            assert.equal(r.solved, false);
            assert.ok(r.feedback);
        }
    });
});

test('determinism: same seed, same proof; different seeds vary', () => {
    for (const d of [1, 2, 3]) {
        for (let s = 0; s < 10; s++) {
            const a = P.generate(Rift.makeRng('same-' + d + '-' + s), d);
            const b = P.generate(Rift.makeRng('same-' + d + '-' + s), d);
            assert.deepEqual(plain(a), plain(b));
            assert.deepEqual(plain(P.hints(a)), plain(P.hints(b)));
            assert.deepEqual(plain(P.why(a)), plain(P.why(b)));
        }
    }
    // the same template with different seeds prints different proofs
    const titles = new Set();
    for (let s = 0; s < 40; s++) titles.add(P.generate(Rift.makeRng('vary' + s), 1).title);
    assert.ok(titles.size > 20, 'distinct titles: ' + titles.size);
});

test('difficulty 3 can print the long machine proof', () => {
    let found = null;
    for (let s = 0; s < 200 && !found; s++) {
        const data = P.generate(Rift.makeRng('machine-' + s), 3);
        if (data.kind === 'machine') found = data;
    }
    assert.ok(found);
    assert.ok(found.cases >= 512);
    assert.ok(found.steps.some(s => s.grid === found.cases));
    assert.match(found.trust.options[found.trust.correct], /independent/);
});

test('hints, why and text', () => {
    eachData(data => {
        const h = P.hints(data);
        assert.equal(h.length, 3);
        h.forEach(x => assert.ok(typeof x === 'string' && x.length > 10));
        if (data.kind === 'flawed') assert.match(h[2], new RegExp('step ' + (data.flawStep + 1)));
        const w = P.why(data);
        assert.equal(w.options.length, 4);
        assert.match(w.options[w.correct], /check/);
    });
    assert.equal(P.colour, 'reason');
    assert.equal(P.family, 'Proof');
    assert.ok(P.tok.length > 20 && P.blurb.length > 20);
});
