import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';

const Rift = loadRift(['js/core/rift.js', 'js/puzzles/registry.js', 'js/puzzles/switchboard.js']);
const P = Rift.Puzzles.get('switchboard');
const I = P.internals;

// ---- an independent evaluator (not the puzzle's own) ----
const bits = (r, n) => Array.from({ length: n }, (_, i) => !!((r >> (n - 1 - i)) & 1));
function bruteEval(gates, out, values) {
    const byId = Object.fromEntries(gates.map(g => [g.id, g]));
    const go = (src, depth) => {
        if (depth > 50) throw new Error('loop');
        if (/^S\d+$/.test(src)) return values[+src.slice(1)];
        const g = byId[src];
        const a = go(g.in[0], depth + 1);
        if (g.op === 'NOT') return !a;
        const b = go(g.in[1], depth + 1);
        return g.op === 'AND' ? a && b : a || b;
    };
    return go(out, 0);
}
const bruteTable = (gates, out, n) => Array.from({ length: 1 << n }, (_, r) => bruteEval(gates, out, bits(r, n)));
const onCount = v => v.filter(Boolean).length;

const many = (d, count, fn) => {
    for (let s = 0; s < count; s++) fn(P.generate(Rift.makeRng('sb-' + d + '-' + s), d), s);
};
const byMode = (mode, count = 300) => {
    const out = [];
    for (const d of [1, 2, 3]) many(d, count, data => { if (data.mode === mode) out.push(data); });
    return out;
};

test('generated puzzles are well formed and solved by their own solution', () => {
    for (const d of [1, 2, 3]) many(d, 300, data => {
        assert.equal(data.difficulty, d);
        const n = data.switches.length;
        assert.ok(n >= 2 && n <= 4, 'switches ' + n);
        const gateCount = data.mode === 'wire' ? data.palette.length : data.circuit.gates.length;
        assert.ok(gateCount >= 1 && gateCount <= 5, 'gates ' + gateCount);
        if (data.mode !== 'wire') assert.ok(data.circuit.gates.length <= 4);
        else assert.ok(data.known && Object.keys(data.known.inputs).length <= 4);
        const r = P.check(data, P.solve(data));
        assert.equal(r.solved, true, data.mode + ': ' + r.feedback);
    });
});

test('light mode: the circuit is meaningful and the minimal set is computed correctly', () => {
    const all = byMode('light');
    assert.ok(all.length > 100);
    for (const data of all) {
        const n = data.switches.length;
        const t = bruteTable(data.circuit.gates, data.circuit.out, n);
        // every switch matters, the bulb can light, and not with zero or all assumptions only
        for (let i = 0; i < n; i++) assert.ok(t.some((v, r) => v !== t[r ^ (1 << (n - 1 - i))]), 'switch ' + i + ' is irrelevant');
        let min = Infinity;
        t.forEach((lit, r) => { if (lit) min = Math.min(min, onCount(bits(r, n))); });
        assert.equal(data.maxOn, min, 'maxOn is the true minimum');
        assert.ok(min >= 1 && min < n, 'min ' + min + ' of ' + n);
        assert.ok(t.filter(Boolean).length >= 2, 'more than one setting lights it');
        const info = I.minimalInfo(I.truthTable(data.circuit.gates, data.circuit.out, n).table, n);
        assert.equal(info.min, min);
        assert.deepEqual([...info.rows], t.map((lit, r) => (lit && onCount(bits(r, n)) === min ? r : -1)).filter(r => r >= 0));
        if (data.difficulty >= 2) assert.ok(min >= 2, 'difficulty 2+ needs at least two assumptions');
    }
});

test('light mode: the checker agrees with brute force on every setting', () => {
    for (const data of byMode('light', 120)) {
        const n = data.switches.length;
        let accepted = 0;
        for (let r = 0; r < (1 << n); r++) {
            const on = bits(r, n);
            const lit = bruteEval(data.circuit.gates, data.circuit.out, on);
            const res = P.check(data, { type: 'switches', on });
            assert.equal(res.solved, lit && onCount(on) === data.maxOn, 'row ' + r);
            if (res.solved) accepted++;
            if (lit && onCount(on) > data.maxOn) assert.match(res.feedback, /only/);
            if (!lit) assert.match(res.feedback, /dark/);
        }
        assert.ok(accepted >= 1);
    }
    const data = byMode('light', 20)[0];
    for (const bad of [null, {}, { on: 'x' }, { on: [true] }]) assert.equal(P.check(data, bad).solved, false);
});

test('wire mode: target is a real function of every switch, and the known wiring matches it', () => {
    const all = byMode('wire');
    assert.ok(all.length > 100);
    for (const data of all) {
        const n = data.switches.length;
        assert.ok(n === 2 || n === 3);
        assert.equal(data.target.length, 1 << n);
        assert.ok(I.dependsOnAll(data.target, n));
        const gates = data.palette.map(p => ({ id: p.id, op: p.op, in: data.known.inputs[p.id] || [] }));
        assert.deepEqual(bruteTable(gates, data.known.bulb, n), [...data.target]);
    }
});

// Random wirings over the palette, judged independently.
function randomWiring(rng, data) {
    const n = data.switches.length;
    const srcs = Array.from({ length: n }, (_, i) => 'S' + i).concat(data.palette.map(p => p.id));
    const inputs = {};
    data.palette.forEach(p => { inputs[p.id] = Array.from({ length: I.ARITY[p.op] }, () => rng.pick(srcs)); });
    return { type: 'wiring', inputs, bulb: rng.pick(srcs) };
}
function judge(data, wiring) {
    const n = data.switches.length;
    const gates = data.palette.map(p => ({ id: p.id, op: p.op, in: wiring.inputs[p.id] }));
    try {
        return bruteTable(gates, wiring.bulb, n).every((v, r) => v === data.target[r]);
    } catch (e) {
        return null; // loop
    }
}
const shape = w => JSON.stringify(w);

test('wire mode: any equivalent wiring is accepted, non-equivalent ones rejected (random wirings)', () => {
    const rng = Rift.makeRng('wirings');
    let equivalentFound = 0, differentShape = 0, rejected = 0;
    for (const data of byMode('wire', 120)) {
        const known = shape(P.solve(data));
        for (let k = 0; k < 400; k++) {
            const w = randomWiring(rng, data);
            const truth = judge(data, w);
            const res = P.check(data, w);
            if (truth === null) { assert.equal(res.solved, false); assert.match(res.feedback, /loop/); continue; }
            assert.equal(res.solved, truth, JSON.stringify(w));
            if (truth) { equivalentFound++; if (shape(w) !== known) differentShape++; } else rejected++;
        }
    }
    assert.ok(equivalentFound > 20, 'found ' + equivalentFound);
    assert.ok(differentShape > 10, 'equivalent but differently wired: ' + differentShape);
    assert.ok(rejected > 1000);
});

test('wire mode: swapped inputs and hand-made equivalents pass; wrong, incomplete and looping wirings fail', () => {
    for (const data of byMode('wire', 80)) {
        const sol = P.solve(data);
        const swapped = JSON.parse(JSON.stringify(sol));
        Object.keys(swapped.inputs).forEach(k => swapped.inputs[k].reverse());
        assert.equal(P.check(data, swapped).solved, true, 'AND/OR do not care about order');
        // unplug the bulb
        assert.equal(P.check(data, Object.assign({}, sol, { bulb: null })).solved, false);
        // a used plaque with a missing wire
        const used = Object.keys(sol.inputs)[0];
        const holes = JSON.parse(JSON.stringify(sol));
        holes.inputs[used][0] = null;
        const r = P.check(data, holes);
        assert.equal(r.solved, false);
        assert.match(r.feedback, /needs/);
        // the bulb on a single switch is never right (the target depends on every switch)
        assert.equal(P.check(data, { type: 'wiring', inputs: sol.inputs, bulb: 'S0' }).solved, false);
    }
    // De Morgan: A AND B == NOT (NOT A OR NOT B)
    const data = {
        mode: 'wire',
        switches: [{ label: 'A', claim: 'a' }, { label: 'B', claim: 'b' }],
        bulb: { claim: 'c' },
        palette: [{ id: 'P0', op: 'AND' }, { id: 'P1', op: 'OR' }, { id: 'P2', op: 'NOT' }, { id: 'P3', op: 'NOT' }, { id: 'P4', op: 'NOT' }],
        target: [false, false, false, true],
    };
    const direct = { type: 'wiring', inputs: { P0: ['S0', 'S1'] }, bulb: 'P0' };
    const deMorgan = { type: 'wiring', inputs: { P2: ['S0'], P3: ['S1'], P1: ['P2', 'P3'], P4: ['P1'] }, bulb: 'P4' };
    const orWrong = { type: 'wiring', inputs: { P1: ['S0', 'S1'] }, bulb: 'P1' };
    const loop = { type: 'wiring', inputs: { P2: ['P3'], P3: ['P2'] }, bulb: 'P2' };
    assert.equal(P.check(data, direct).solved, true);
    assert.equal(P.check(data, deMorgan).solved, true);
    const wrong = P.check(data, orWrong);
    assert.equal(wrong.solved, false);
    assert.equal(wrong.partial, 0.5);
    assert.match(P.check(data, loop).feedback, /loop/);
    assert.equal(P.check(data, { type: 'wiring', inputs: { P0: ['S0', 'S7'] }, bulb: 'P0' }).solved, false);
    assert.equal(P.check(data, { type: 'wiring', inputs: {}, bulb: 'P9' }).solved, false);
    for (const bad of [null, 'x', {}, { inputs: 5 }]) assert.equal(P.check(data, bad).solved, false);
});

test('hidden mode: only at difficulty 3; exactly one answer fits the reports, and the checker knows which', () => {
    const counts = { 1: {}, 2: {}, 3: {} };
    for (const d of [1, 2, 3]) many(d, 300, data => { counts[d][data.mode] = (counts[d][data.mode] || 0) + 1; });
    assert.equal(counts[1].hidden || 0, 0);
    assert.equal(counts[2].hidden || 0, 0);
    assert.ok(counts[3].hidden > 60, JSON.stringify(counts[3]));
    for (const d of [1, 2]) assert.ok(counts[d].light > 60 && counts[d].wire > 60, JSON.stringify(counts[d]));

    const all = byMode('hidden');
    const kinds = { switch: 0, gate: 0 };
    for (const data of all) {
        kinds[data.hidden.kind]++;
        const n = data.switches.length;
        const choices = data.hidden.kind === 'switch' ? [true, false] : ['AND', 'OR'];
        const fits = choices.filter(c => data.observations.every(o => {
            const values = o.on.slice();
            let gates = data.circuit.gates;
            if (data.hidden.kind === 'switch') values[data.hidden.index] = c;
            else gates = gates.map(g => (g.id === data.hidden.gate ? Object.assign({}, g, { op: c }) : g));
            return bruteEval(gates, data.circuit.out, values) === o.lit;
        }));
        assert.equal(fits.length, 1, 'exactly one possibility fits');
        assert.equal(fits[0], data.secret);
        assert.ok(data.observations.length >= 3);
        // reports are distinct visible settings, with the hidden slot blank
        const keys = data.observations.map(o => JSON.stringify(o.on));
        assert.equal(new Set(keys).size, keys.length);
        if (data.hidden.kind === 'switch') data.observations.forEach(o => assert.equal(o.on[data.hidden.index], null));
        assert.ok(n >= 2 && n <= 4);
        for (const c of choices) {
            const ans = data.hidden.kind === 'switch' ? { type: 'hidden', value: c } : { type: 'hidden', gate: c };
            const r = P.check(data, ans);
            assert.equal(r.solved, c === data.secret);
            if (!r.solved) assert.match(r.feedback, /report \d/);
        }
        assert.equal(P.check(data, { type: 'hidden' }).solved, false);
    }
    assert.ok(kinds.switch > 20 && kinds.gate > 10, JSON.stringify(kinds));
});

test('generation is deterministic per seed and JSON-safe', () => {
    for (const d of [1, 2, 3]) for (let s = 0; s < 40; s++) {
        const a = P.generate(Rift.makeRng('det' + s), d), b = P.generate(Rift.makeRng('det' + s), d);
        assert.deepEqual(a, b);
        assert.equal(JSON.stringify(JSON.parse(JSON.stringify(a))), JSON.stringify(a));
    }
    const shapes = new Set();
    for (let s = 0; s < 40; s++) shapes.add(JSON.stringify(P.generate(Rift.makeRng('var' + s), 2)));
    assert.ok(shapes.size > 35);
});

test('hints and why are well formed', () => {
    for (const d of [1, 2, 3]) many(d, 60, data => {
        const h = P.hints(data);
        assert.equal(h.length, 3);
        assert.ok(h.every(x => typeof x === 'string' && x.length > 15 && !/undefined|NaN/.test(x)), JSON.stringify(h));
        const w = P.why(data);
        assert.equal(w.options.length, 4);
        assert.ok(w.correct >= 0 && w.correct < 4);
        assert.ok(/input|every|contradiction/i.test(w.options[w.correct]));
        assert.ok(!/undefined|NaN/.test(JSON.stringify(w)));
    });
});

test('no wasted plaques: no AND/OR gate just copies one of its inputs', () => {
    const fn = (gates, src, n) => bruteTable(gates, src, n).join('');
    for (const mode of ['light', 'hidden']) for (const data of byMode(mode, 100)) {
        const n = data.switches.length, gates = data.circuit.gates;
        for (const g of gates) if (g.op !== 'NOT') {
            assert.notEqual(fn(gates, g.id, n), fn(gates, g.in[0], n));
            assert.notEqual(fn(gates, g.id, n), fn(gates, g.in[1], n));
        }
    }
});

test('formulas describe the circuit they came from', () => {
    for (const data of byMode('wire', 60)) {
        assert.match(data.formula, /^[A-C() ANDORT]+$/);
        assert.ok(data.formula.length >= 5);
    }
    const c = { gates: [{ id: 'G0', op: 'NOT', in: ['S1'] }, { id: 'G1', op: 'AND', in: ['S0', 'G0'] }, { id: 'G2', op: 'OR', in: ['G1', 'S2'] }], out: 'G2' };
    assert.equal(I.describe(c.gates, c.out), '(A AND NOT B) OR C');
});
