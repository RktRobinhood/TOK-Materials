import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';
import { loadWithDom } from './fake-dom.mjs';

const files = ['js/core/rift.js', 'js/puzzles/registry.js', 'js/puzzles/oracle.js'];
const R = loadRift(files);
const P = R.Puzzles.get('oracle');
const I = P.internals;
const oddProofs = () => {
    const found = new Map();
    for (let s = 0; found.size < 2 && s < 30; s++) {
        const p = I.C.odd(R.makeRng('domain-odd-' + s));
        found.set(p.title, p);
    }
    assert.equal(found.size, 2);
    return [...found.values()];
};

test('odd sum and product reject the reported fractional counterexample before evaluating it', () => {
    for (const data of oddProofs()) {
        const r = I.testStep(data, data.steps.length - 1, { j: 0.5, k: 3 });
        assert.equal(r.fits, false, data.title);
        assert.equal(r.ok, true, 'an invalid input is not a broken step');
        assert.equal(r.result, undefined, 'do not calculate a supposed counterexample');
        assert.match(r.unmet.join(' '), /j.*0\.5.*integer/i);
        for (const env of [{ j: 0, k: 3 }, { j: -2, k: 0 }, { j: 12, k: 12 }]) {
            data.steps.forEach((s, i) => {
                const out = I.testStep(data, i, env);
                assert.equal(out.fits, true, data.title);
                assert.equal(out.ok, true, data.title);
            });
        }
    }
});

test('Gauss accepts positive integer lengths and rejects fractions, zero and negatives', () => {
    const data = I.C.gauss(R.makeRng('domain-gauss'));
    const formula = 4;
    for (const n of [0.5, 0, -1, '', ' ', null, undefined, NaN, Infinity]) {
        const r = I.testStep(data, formula, { n });
        assert.equal(r.fits, false, String(n));
        assert.equal(r.result, undefined);
        assert.equal(r.ok, true);
        assert.ok(r.unmet.length);
    }
    for (const n of [1, 2, 40, 100]) {
        const r = I.testStep(data, formula, { n });
        assert.equal(r.fits, true, String(n));
        assert.equal(r.ok, true);
    }
    const outsideRow = I.testStep(data, 2, { n: 4, i: 5 });
    assert.equal(outsideRow.fits, false, 'a pair must be in the row being added');
});

test('the real-number algebra proofs still accept decimals and permitted negatives', () => {
    for (const key of ['square', 'diff-squares']) {
        const data = I.C[key](R.makeRng('domain-real-' + key));
        for (const value of [-2.5, 0, 0.5, 12.25]) {
            const env = Object.fromEntries(data.vars.map(v => [v.name, value]));
            data.steps.forEach((s, i) => {
                const r = I.testStep(data, i, env);
                assert.equal(r.fits, true, key + ' ' + value);
                assert.equal(r.ok, true);
            });
        }
    }
});

test('every generated variable declares its domain and its permitted edge values agree with it', () => {
    const seen = new Set();
    for (const difficulty of [1, 2, 3]) {
        for (let seed = 0; seed < 120; seed++) {
            const data = P.generate(R.makeRng('domain-generated-' + difficulty + '-' + seed), difficulty);
            seen.add(data.template);
            assert.equal(P.check(data, P.solve(data)).solved, true);
            for (const v of data.vars) {
                assert.ok(['integer', 'real'].includes(v.domain?.type), data.template + ' ' + v.name);
                const index = data.steps.findIndex((s, i) => I.testVars(data, i).includes(v.name));
                assert.ok(index >= 0, data.template + ' uses ' + v.name);
                const lower = v.domain.min;
                const valid = lower === undefined ? [-2, 0, 2] : [lower, lower + 1, lower + 2];
                if (v.domain.type === 'real') valid.push(lower === undefined ? -0.5 : lower + 0.5);
                for (const value of valid) {
                    const out = I.testStep(data, index, { [v.name]: value });
                    // Other stated assumptions (e.g. b >= a) may exclude a permitted variable value.
                    assert.ok(!out.unmet?.some(x => x.startsWith(v.name + ' = ') || x.startsWith('Enter a number for ' + v.name)), data.template + ' ' + v.name + '=' + value);
                }
                const invalid = ['', ' ', null, undefined, NaN, Infinity, -Infinity];
                if (v.domain.type === 'integer') invalid.push(0.5, -0.5);
                if (lower !== undefined) invalid.push(lower - 1);
                for (const value of invalid) {
                    const out = I.testStep(data, index, { [v.name]: value });
                    assert.equal(out.fits, false, data.template + ' ' + v.name + '=' + value);
                    assert.equal(out.result, undefined);
                }
            }
        }
    }
    assert.deepEqual([...seen].sort(), [...I.FLAW_IDS, ...Object.keys(I.C), 'machine'].sort());
});

test('the mounted tester reports typed fractions and blanks without marking the tape broken or submitting a verdict', () => {
    const g = loadWithDom(files);
    const oracle = g.Rift.Puzzles.get('oracle');
    const data = oddProofs().find(p => p.title.includes('+'));
    let submissions = 0;
    const container = g.document.createElement('div');
    g.document.body.appendChild(container);
    oracle.mount(container, data, { submit: () => { submissions++; }, sfx() {}, say() {} });
    container.querySelectorAll('.om-step').at(-1).click();
    assert.match(container.querySelector('.om-vars').textContent, /integer/i);
    for (const value of ['0.5', '']) {
        const input = container.querySelector('.om-val');
        input.value = value;
        input.dispatchEvent({ type: 'input' });
        container.querySelector('.om-testbtn').click();
        const result = container.querySelector('.om-result');
        assert.ok(result.classList.contains('unfit'));
        assert.doesNotMatch(result.textContent, /Fails for these numbers|Holds for these numbers/);
        assert.ok(!container.querySelectorAll('.om-step').at(-1).classList.contains('broke'));
        assert.equal(submissions, 0);
    }
    const input = container.querySelector('.om-val');
    input.value = '0';
    input.dispatchEvent({ type: 'input' });
    container.querySelector('.om-testbtn').click();
    assert.match(container.querySelector('.om-result').textContent, /Holds for these numbers/);
});
