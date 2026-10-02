import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';

const Rift = loadRift(['js/core/rift.js', 'js/puzzles/registry.js', 'js/puzzles/chart-fixer.js']);
const P = Rift.Puzzles.get('chart-fixer');
const I = P.internals;

const ALL = ['baseline', 'scale', 'window', 'intervals', 'cumulative', 'percapita', 'dual', 'picto'];
const COUNT = 150;
const many = (fn) => {
    for (const d of [1, 2, 3]) for (let s = 0; s < COUNT; s++) fn(P.generate(Rift.makeRng('cf-' + d + '-' + s), d), d, s);
};

// ---- an independent reading of the honest chart (not the puzzle's own code) ----
function fitLine(xs, ys) {
    const n = xs.length;
    const mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
    const b = num / den;
    return x => my + b * (x - mx);
}
function slope(xs, ys) {
    const f = fitLine(xs, ys);
    return (f(xs[xs.length - 1]) - f(xs[0])) / (xs[xs.length - 1] - xs[0]);
}
function trendCat(xs, ys) {
    const f = fitLine(xs, ys);
    const r = (f(xs[xs.length - 1]) - f(xs[0])) / f(xs[0]);
    const a = Math.abs(r);
    if (a <= 0.04) return 'flat';
    if (a >= 0.08 && a <= 0.22) return r > 0 ? 'smallRise' : 'smallFall';
    if (a >= 0.32) return r > 0 ? 'bigRise' : 'bigFall';
    return 'BORDERLINE';
}
function paceCat(xs, ys) {
    const mid = (xs[0] + xs[xs.length - 1]) / 2;
    const A = xs.map((x, i) => i).filter(i => xs[i] <= mid), B = xs.map((x, i) => i).filter(i => xs[i] >= mid);
    const q = slope(B.map(i => xs[i]), B.map(i => ys[i])) / slope(A.map(i => xs[i]), A.map(i => ys[i]));
    if (q >= 0.67 && q <= 1.5) return 'steady';
    if (q >= 2) return 'speeding';
    if (q > 0 && q <= 0.5) return 'slowing';
    return 'BORDERLINE';
}
// honest series: each year on its own, per villager when the population is known, every year, true dates
function honestSeries(data) {
    return data.pop ? data.raw.map((v, i) => v / data.pop[i] * data.pcFactor) : data.raw.slice();
}

const plain = x => JSON.parse(JSON.stringify(x));
const isHonest = (data, fixes) => P.check(data, { fixes, reading: data.reading.correct }).solved;
// set just one control to its honest position
function fixOne(data, state, key) {
    const s = JSON.parse(JSON.stringify(state));
    const h = P.solve(data).fixes;
    const map = { baseline: 'baseline', scale: 'top', window: 'window', intervals: 'spacing', cumulative: 'cumulative', percapita: 'perCapita', dual: 'dual', picto: 'picto' };
    s[map[key]] = h[map[key]];
    return s;
}

test('registration and metadata', () => {
    assert.equal(P.id, 'chart-fixer');
    assert.equal(P.colour, 'perception');
    assert.equal(P.family, 'Seeing vs knowing');
    assert.ok(P.tok.length > 20 && P.blurb.length > 20);
    assert.equal(typeof P.mount, 'function');
});

test('charts are well formed: 1/2/3 compatible distortions, positive data, four distinct readings', () => {
    const seen = new Set();
    many((data, d) => {
        assert.equal(data.distortions.length, d);
        data.distortions.forEach(k => { assert.ok(ALL.includes(k), k); seen.add(k); });
        for (const a of data.distortions) for (const b of data.distortions) if (a !== b) assert.ok(!I.clash(a, b), a + ' clashes with ' + b);
        const n = data.years.length;
        assert.ok(n >= 5 && n <= 12);
        assert.equal(data.raw.length, n);
        for (let i = 1; i < n; i++) assert.ok(data.years[i] > data.years[i - 1], 'years increase');
        data.raw.forEach(v => assert.ok(v > 0 && isFinite(v)));
        if (data.pop) { assert.equal(data.pop.length, n); data.pop.forEach(p => assert.ok(p > 100)); }
        if (data.raw2) assert.equal(data.raw2.length, n);
        const gaps = data.years.slice(1).map((y, i) => y - data.years[i]);
        assert.equal(data.uneven, new Set(gaps).size > 1, 'uneven flag matches the years');
        assert.equal(data.reading.options.length, 4);
        assert.equal(new Set(data.reading.options).size, 4, 'distinct option texts');
        assert.ok(data.reading.correct >= 0 && data.reading.correct < 4);
        assert.ok(typeof data.headline === 'string' && data.headline.length > 5);
        assert.doesNotThrow(() => JSON.stringify(data));
    });
    ALL.forEach(k => assert.ok(seen.has(k), 'distortion ' + k + ' is generated'));
});

test('every distortion is detected in the starting chart, and nothing else is', () => {
    many(data => {
        const r = P.check(data, { fixes: data.start, reading: data.reading.correct });
        assert.equal(r.solved, false);
        assert.deepEqual([...r.unfixed].sort(), [...data.distortions].sort(), 'unfixed = the distortions');
        const firstName = I.DIST[r.unfixed[0]].name;
        assert.ok(r.feedback.includes(firstName), 'feedback names the distortion: ' + r.feedback);
        // missing fixes means "nothing touched"
        assert.deepEqual(plain(P.check(data, { reading: data.reading.correct }).unfixed), plain(r.unfixed));
    });
});

test('each distortion is fixable on its own, and fixing all of them makes the chart honest', () => {
    many(data => {
        let state = JSON.parse(JSON.stringify(data.start));
        data.distortions.forEach((k, i) => {
            const alone = fixOne(data, data.start, k);
            const r = P.check(data, { fixes: alone, reading: data.reading.correct });
            assert.ok(!r.unfixed.includes(k), k + ' is fixed by its control');
            assert.equal(r.unfixed.length, data.distortions.length - 1);
            state = fixOne(data, state, k);
            const after = P.check(data, { fixes: state, reading: data.reading.correct });
            assert.equal(after.unfixed.length, data.distortions.length - i - 1);
        });
        assert.ok(isHonest(data, state));
    });
});

test('the UI ruler can reach the honest axis (baseline snaps to 0, top inside the honest band)', () => {
    assert.equal(I.rulerRatio(0), 0);
    assert.ok(Math.abs(I.rulerRatio(I.rulerPos(1.2)) - 1.2) < 1e-9);
    assert.ok(Math.abs(I.rulerRatio(I.rulerPos(7)) - 7) < 1e-9);
    assert.ok(I.rulerRatio(1) >= 12 - 1e-9, 'the ruler reaches the squashed scales');
    many(data => assert.ok(data.start.top <= 12 + 1e-9 && data.start.baseline < data.start.top));
});

test('the honest reading computed from the data matches the correct option', () => {
    many(data => {
        const ys = honestSeries(data);
        const truth = { trend: trendCat(data.years, ys) };
        assert.notEqual(truth.trend, 'BORDERLINE', 'the honest trend is clear-cut');
        if (data.facets.pace) { truth.pace = paceCat(data.years, ys); assert.notEqual(truth.pace, 'BORDERLINE'); }
        if (data.facets.trend2) { truth.trend2 = trendCat(data.years, data.raw2); assert.notEqual(truth.trend2, 'BORDERLINE'); }
        const kinds = data.reading.kinds;
        const same = k => k.trend === truth.trend && k.pace === truth.pace && k.trend2 === truth.trend2;
        assert.ok(same(kinds[data.reading.correct]), 'correct option ' + JSON.stringify(kinds[data.reading.correct]) + ' vs ' + JSON.stringify(truth));
        assert.equal(kinds.filter(same).length, 1, 'only one option fits');
        // the puzzle's own honest reading agrees
        assert.deepEqual(plain(I.facets(data, I.honestState(data), true)), truth);
        // the option text says the right thing
        const text = data.reading.options[data.reading.correct];
        const words = { bigRise: 'rose a lot', smallRise: 'rose a little', flat: 'stayed about the same', smallFall: 'fell a little', bigFall: 'fell a lot' };
        assert.ok(text.includes(words[truth.trend]), text);
    });
});

test('the lying chart tells a different story from the honest one', () => {
    many(data => {
        const seen = I.facets(data, data.start, false);
        const truth = I.facets(data, I.honestState(data), true);
        assert.ok(seen.trend !== truth.trend || seen.pace !== truth.pace || seen.trend2 !== truth.trend2,
            data.distortions.join('+') + ' does not mislead: ' + JSON.stringify(seen));
    });
});

test('solve() passes check()', () => {
    many(data => {
        const r = P.check(data, P.solve(data));
        assert.equal(r.solved, true, r.feedback);
        assert.equal(r.partial, 1);
    });
});

test('a chart with one distortion left unfixed fails, and names it', () => {
    many(data => {
        const good = P.solve(data);
        data.distortions.forEach(k => {
            const map = { baseline: 'baseline', scale: 'top', window: 'window', intervals: 'spacing', cumulative: 'cumulative', percapita: 'perCapita', dual: 'dual', picto: 'picto' };
            const fixes = JSON.parse(JSON.stringify(good.fixes));
            fixes[map[k]] = data.start[map[k]];
            const r = P.check(data, { fixes, reading: good.reading });
            assert.equal(r.solved, false, k + ' left unfixed should fail');
            assert.deepEqual(plain(r.unfixed), [k]);
            assert.ok(r.feedback.includes(I.DIST[k].name), r.feedback);
            assert.ok(r.partial < 1);
        });
    });
});

test('breaking an honest control also fails (decoys and the always-present ruler and window)', () => {
    many(data => {
        const good = P.solve(data);
        const tries = [
            ['baseline', 0.5], ['top', 6], ['top', 0.8], ['window', [1, data.years.length - 1]],
        ];
        if (data.uneven) tries.push(['spacing', 'even']);
        if (data.hasCum) tries.push(['cumulative', true]);
        if (data.pop) tries.push(['perCapita', false]);
        if (data.raw2) tries.push(['dual', 'overlay']);
        if (data.picto) tries.push(['picto', 'area']);
        tries.forEach(([key, val]) => {
            const fixes = Object.assign({}, good.fixes, { [key]: val });
            assert.equal(P.check(data, { fixes, reading: good.reading }).solved, false, key + '=' + JSON.stringify(val));
        });
        // the honest band for the top of the axis
        [1, 1.3, 1.75].forEach(top => assert.ok(isHonest(data, Object.assign({}, good.fixes, { top }))));
    });
});

test('both steps are required: an honest chart with a wrong reading fails', () => {
    many(data => {
        const good = P.solve(data);
        for (let i = 0; i < 4; i++) {
            if (i === good.reading) continue;
            const r = P.check(data, { fixes: good.fixes, reading: i });
            assert.equal(r.solved, false);
            assert.ok(r.partial > 0 && r.partial < 1);
        }
        assert.equal(P.check(data, { fixes: good.fixes }).solved, false);
    });
});

test('hints and why()', () => {
    many(data => {
        const h = P.hints(data);
        assert.equal(h.length, 3);
        h.forEach(t => assert.ok(typeof t === 'string' && t.length > 10));
        data.distortions.forEach(k => assert.ok(h[2].includes(I.DIST[k].fix)));
        const w = P.why(data);
        assert.equal(w.options.length, 4);
        assert.ok(w.correct >= 0 && w.correct < 4);
        assert.match(w.options[w.correct], /numbers stayed the same/);
        assert.ok(w.explain.length > 20);
    });
});

test('check() is robust to junk answers', () => {
    const data = P.generate(Rift.makeRng('junk'), 2);
    [null, undefined, 5, 'x', {}, { fixes: 'nope' }, { fixes: { window: [5, 2], top: 'a', baseline: null } }, { fixes: null, reading: 'z' }]
        .forEach(a => assert.doesNotThrow(() => P.check(data, a)));
    assert.equal(P.check(data, null).solved, false);
});

test('determinism: the same seed gives the same chart; different seeds differ', () => {
    for (const d of [1, 2, 3]) {
        for (let s = 0; s < 20; s++) {
            const a = P.generate(Rift.makeRng('det-' + d + '-' + s), d);
            const b = P.generate(Rift.makeRng('det-' + d + '-' + s), d);
            assert.deepEqual(a, b);
        }
        const keys = new Set();
        for (let s = 0; s < 20; s++) keys.add(JSON.stringify(P.generate(Rift.makeRng('var-' + d + '-' + s), d).raw));
        assert.ok(keys.size >= 19, 'charts vary');
    }
});

test('the chart drawing runs for the lying and the honest state', () => {
    many(data => {
        const a = I.chartSvg(data, data.start, 640, 320, 't');
        const b = I.chartSvg(data, I.honestState(data), 640, 320, 't');
        assert.match(a, /^<svg/);
        assert.match(b, /^<svg/);
        assert.ok(!/NaN|Infinity|undefined/.test(a + b), 'no NaN in the SVG');
    });
});
