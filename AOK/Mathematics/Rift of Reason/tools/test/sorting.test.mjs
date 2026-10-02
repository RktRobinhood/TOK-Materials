import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';

const Rift = loadRift(['js/core/rift.js', 'js/puzzles/registry.js', 'js/puzzles/sorting.js']);
const P = Rift.Puzzles.get('sorting');
const I = P.internals;
const plain = v => JSON.parse(JSON.stringify(v));

// ---- an independent reference implementation of the machine and the audit ----
function refRule(data, fixId) {
    const r = plain(data.rule);
    const fix = fixId ? data.fixes.find(f => f.id === fixId) : null;
    if (fix) for (const [k, v] of Object.entries(fix.change)) r[k] = plain(v);
    return r;
}
function refAudit(data, rule) {
    const m = { tp: 0, fp: 0, fn: 0, tn: 0 };
    const missed = [0, 0, 0], needy = [0, 0, 0];
    const decisions = data.applicants.map(a => {
        let s = rule.wH * a.hardship;
        if (a.household >= rule.bigAt) s += rule.wBig;
        s += rule.points[a.district];
        s -= rule.wR * Math.floor(a.notes / rule.perVisit[a.district]);
        const yes = s >= rule.T;
        if (a.needed) needy[a.district] += 1;
        if (yes && a.needed) m.tp++;
        if (yes && !a.needed) m.fp++;
        if (!yes && a.needed) { m.fn++; missed[a.district] += 1; }
        if (!yes && !a.needed) m.tn++;
        return yes;
    });
    const rates = needy.map((n, d) => (n ? missed[d] / n : null)).filter(x => x !== null);
    const gap = Math.max(...rates) - Math.min(...rates);
    const c = data.criteria;
    const ok = m.tp + m.fp <= c.budget && m.tp >= c.minHelp && gap <= c.maxGap + 1e-9;
    return { decisions, ...m, gap, ok, rates: needy.map((n, d) => (n ? missed[d] / n : 0)) };
}

const many = (d, count, fn) => {
    for (let s = 0; s < count; s++) fn(P.generate(Rift.makeRng('sm-' + d + '-' + s), d), s);
};

test('registered with the right identity', () => {
    assert.equal(P.id, 'sorting');
    assert.equal(P.colour, 'emotion');
    assert.equal(P.family, 'Ethics of maths');
    assert.ok(P.tok && P.blurb);
});

test('generate: well-formed data for every difficulty', () => {
    for (const d of [1, 2, 3]) many(d, 40, data => {
        assert.equal(data.difficulty, d);
        assert.ok(data.applicants.length >= 12 && data.applicants.length <= 20);
        assert.equal(data.applicants.length, I.SETTINGS[d].n);
        assert.equal(data.districts.length, 3);
        assert.ok(['biased-data', 'proxy', 'threshold'].includes(data.flaw));
        assert.equal(data.flawOptions.length, 4);
        assert.ok(data.flawOptions.some(o => o.id === data.flaw));
        assert.equal(new Set(data.flawOptions.map(o => o.id)).size, 4);
        assert.equal(data.fixes.length, I.SETTINGS[d].fixCount);
        assert.equal(data.values.length, 4);
        data.fixes.forEach(f => assert.ok(data.values.some(v => v.id === f.value), 'fix value is answerable'));
        const names = new Set(data.applicants.map(a => a.name));
        assert.equal(names.size, data.applicants.length, 'unique names');
        for (let k = 0; k < 3; k++) assert.ok(data.applicants.some(a => a.district === k && a.needed), 'each district has needy villagers');
        assert.doesNotThrow(() => JSON.stringify(data));
    });
});

test('determinism: same seed, same puzzle, same answers', () => {
    for (const d of [1, 2, 3]) {
        const a = P.generate(Rift.makeRng('same-' + d), d);
        const b = P.generate(Rift.makeRng('same-' + d), d);
        assert.deepEqual(plain(a), plain(b));
        assert.deepEqual(plain(P.solve(a)), plain(P.solve(b)));
        assert.deepEqual(plain(P.hints(a)), plain(P.hints(b)));
        assert.deepEqual(plain(P.why(a)), plain(P.why(b)));
    }
    const c = P.generate(Rift.makeRng('other'), 2);
    const e = P.generate(Rift.makeRng('other-2'), 2);
    assert.notDeepEqual(plain(c.applicants), plain(e.applicants));
});

test('outcomes match the reference implementation for the rule and every fix', () => {
    let compared = 0;
    for (const d of [1, 2, 3]) many(d, 40, data => {
        for (const fixId of [null, ...data.fixes.map(f => f.id)]) {
            const rule = refRule(data, fixId);
            const ref = refAudit(data, rule);
            const got = I.outcomes(data, I.applyFix(data.rule, fixId ? data.fixes.find(f => f.id === fixId) : null));
            assert.deepEqual(plain(got.decisions), plain(ref.decisions));
            assert.deepEqual([got.tp, got.fp, got.fn, got.tn], [ref.tp, ref.fp, ref.fn, ref.tn]);
            assert.ok(Math.abs(got.gap - ref.gap) < 1e-9);
            assert.deepEqual(plain(got.byDistrict.map(D => D.missedRate)), plain(ref.rates));
            assert.equal(got.ok, ref.ok);
            compared++;
        }
    });
    assert.ok(compared > 500);
});

test('the machine as built fails the goals, in the way its flaw predicts', () => {
    for (const d of [1, 2, 3]) many(d, 60, data => {
        const base = refAudit(data, refRule(data, null));
        assert.equal(base.ok, false, 'the unfixed machine must fail');
        if (data.flaw === 'threshold') {
            assert.ok(base.gap <= data.criteria.maxGap + 1e-9, 'threshold flaw: districts treated alike');
            assert.ok(base.tp < data.criteria.minHelp, 'threshold flaw: too many needy missed');
            assert.ok(base.rates.every(r => r < 1), 'threshold flaw: still helps some needy villagers in every district');
        } else {
            assert.ok(base.gap > data.criteria.maxGap, 'district gap too big');
            const t = data.roles.target;
            assert.ok(base.rates.every((r, k) => k === t || r < base.rates[t]), 'the named district is the worst off');
        }
        if (data.flaw === 'biased-data') {
            assert.ok(data.visits[data.roles.target] > Math.max(...data.visits.filter((_, k) => k !== data.roles.target)));
        } else {
            assert.equal(new Set(data.visits).size, 1, 'equal inspections when the data is not skewed');
        }
        if (data.flaw !== 'proxy') assert.deepEqual(plain(data.rule.points), [0, 0, 0]);
    });
});

test('at least one fix meets the goals for every generated puzzle (several at d1–2), and at least one fails', () => {
    for (const d of [1, 2, 3]) many(d, 120, data => {
        const pass = data.fixes.filter(f => refAudit(data, refRule(data, f.id)).ok);
        assert.ok(pass.length >= (d <= 2 ? 2 : 1), 'passing fixes: ' + pass.length);
        assert.ok(pass.length < data.fixes.length, 'not every fix works');
    });
});

test('solve() is accepted by check()', () => {
    for (const d of [1, 2, 3]) many(d, 60, data => {
        const r = P.check(data, P.solve(data));
        assert.equal(r.solved, true, r.feedback);
        assert.equal(r.partial, 1);
    });
});

test('every passing fix is accepted (with its own value at d3)', () => {
    for (const d of [1, 2, 3]) many(d, 40, data => {
        data.fixes.forEach(f => {
            const ok = refAudit(data, refRule(data, f.id)).ok;
            const answer = { flaw: data.flaw, fix: f.id };
            if (d >= 3) answer.value = data.values.findIndex(v => v.id === f.value);
            const r = P.check(data, answer);
            assert.equal(r.solved, ok, f.id + ': ' + r.feedback);
            if (!ok) { assert.ok(r.partial < 1); assert.ok(r.feedback.length > 10); }
        });
    });
});

test('wrong flaw, wrong fix, wrong value and junk fail with feedback', () => {
    for (const d of [1, 2, 3]) many(d, 40, data => {
        const good = P.solve(data);
        data.flawOptions.filter(o => o.id !== data.flaw).forEach(o => {
            const r = P.check(data, Object.assign({}, good, { flaw: o.id }));
            assert.equal(r.solved, false);
            assert.ok(r.feedback && r.feedback.length > 10);
        });
        const bad = data.fixes.find(f => !refAudit(data, refRule(data, f.id)).ok);
        const r2 = P.check(data, Object.assign({}, good, { fix: bad.id }));
        assert.equal(r2.solved, false);
        assert.match(r2.feedback, /Try another change/);
        assert.equal(P.check(data, Object.assign({}, good, { fix: 'nope' })).solved, false);
        if (d >= 3) {
            const fix = data.fixes.find(f => f.id === good.fix);
            const wrongV = data.values.findIndex(v => v.id !== fix.value);
            const r3 = P.check(data, Object.assign({}, good, { value: wrongV }));
            assert.equal(r3.solved, false);
            assert.ok(r3.feedback.length > 10);
            assert.equal(P.check(data, { flaw: good.flaw, fix: good.fix }).solved, false, 'd3 needs a value');
        }
        assert.equal(P.check(data, null).solved, false);
        assert.equal(P.check(data, {}).solved, false);
        assert.equal(P.check(data, { flaw: 'made-up', fix: good.fix }).solved, false);
    });
});

test('check ignores outcomes reported by the UI', () => {
    const data = P.generate(Rift.makeRng('forge'), 2);
    const bad = data.fixes.find(f => !refAudit(data, refRule(data, f.id)).ok);
    const r = P.check(data, { flaw: data.flaw, fix: bad.id, outcomes: { ok: true }, tp: 99, solved: true });
    assert.equal(r.solved, false);
});

test('hints and why are well-formed', () => {
    for (const d of [1, 2, 3]) many(d, 20, data => {
        const h = P.hints(data);
        assert.equal(h.length, 3);
        h.forEach(x => assert.ok(typeof x === 'string' && x.length > 20));
        const w = P.why(data);
        assert.equal(w.options.length, 4);
        assert.ok(w.correct >= 0 && w.correct < 4);
        assert.match(w.options[w.correct], /mistake/);
        assert.ok(w.explain.length > 40);
    });
});
