import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';

const Rift = loadRift(['js/core/rift.js', 'js/puzzles/registry.js', 'js/puzzles/venn.js']);
const def = Rift.Puzzles.get('venn');
const E = def.engine;

// Terms are bits: 0 = S (minor), 1 = P (major), 2 = M (middle).
const S = 0, P = 1, M = 2;
const cls = [{}, {}, {}];
const st = (q, a, b) => ({ q, a, b });
const valid = (premises, conclusion, opts, terms = cls) => E.analyse(terms.length, terms, premises, conclusion, opts).valid;
const plain = x => JSON.parse(JSON.stringify(x));

test('registers with the required fields', () => {
    assert.equal(def.id, 'venn');
    assert.equal(def.colour, 'language');
    assert.ok(Rift.COLOURS[def.colour]);
    assert.ok(def.tok && def.blurb);
});

test('engine: classic valid forms', () => {
    // Barbara: All M are P; All S are M; so all S are P
    assert.equal(valid([st('all', M, P), st('all', S, M)], st('all', S, P)), true);
    // Celarent: No M are P; All S are M; so no S are P
    assert.equal(valid([st('no', M, P), st('all', S, M)], st('no', S, P)), true);
    // Darii: All M are P; Some S are M; so some S are P
    assert.equal(valid([st('all', M, P), st('some', S, M)], st('some', S, P)), true);
    // Ferio: No M are P; Some S are M; so some S are not P
    assert.equal(valid([st('no', M, P), st('some', S, M)], st('someNot', S, P)), true);
    // Camestres: All P are M; No S are M; so no S are P
    assert.equal(valid([st('all', P, M), st('no', S, M)], st('no', S, P)), true);
});

test('engine: classic invalid forms', () => {
    // undistributed middle: All P are M; All S are M; so all S are P
    assert.equal(valid([st('all', P, M), st('all', S, M)], st('all', S, P)), false);
    // illicit major: All M are P; No S are M; so no S are P
    assert.equal(valid([st('all', M, P), st('no', S, M)], st('no', S, P)), false);
    // illicit minor: All M are P; All M are S; so all S are P
    assert.equal(valid([st('all', M, P), st('all', M, S)], st('all', S, P)), false);
    // two particular premises: Some M are P; Some S are M; so some S are P
    assert.equal(valid([st('some', M, P), st('some', S, M)], st('some', S, P)), false);
});

test('engine: named individuals (Fido valid, Giovanni = affirming the consequent, Tom = denying the antecedent)', () => {
    const terms = [{ singular: true }, {}, {}]; // 0 = individual, 1 = P, 2 = M
    // All dogs are mammals; Fido is a dog; so Fido is a mammal
    assert.equal(valid([st('all', 2, 1), st('is', 0, 2)], st('is', 0, 1), null, terms), true);
    // All Italians eat spaghetti; Giovanni eats spaghetti; so Giovanni is Italian
    assert.equal(valid([st('all', 1, 2), st('is', 0, 2)], st('is', 0, 1), null, terms), false);
    // All dogs are mammals; Tom is not a dog; so Tom is not a mammal
    assert.equal(valid([st('all', 2, 1), st('isNot', 0, 2)], st('isNot', 0, 1), null, terms), false);
    // modus tollens: All Italians eat spaghetti; Giovanni doesn't; so he isn't Italian
    assert.equal(valid([st('all', 1, 2), st('isNot', 0, 2)], st('isNot', 0, 1), null, terms), true);
    // a named individual is exactly one thing: "some of Fido is P" means Fido is P
    assert.equal(valid([st('some', 0, 1)], st('is', 0, 1), null, [{ singular: true }, {}]), true);
});

test('engine: existential import convention (Boolean by default, traditional on request)', () => {
    // Darapti: All M are P; All M are S; so some S are P. Needs M to exist.
    const darapti = [[st('all', M, P), st('all', M, S)], st('some', S, P)];
    assert.equal(valid(...darapti), false);
    assert.equal(valid(...darapti, { existentialImport: true }), true);
    // subalternation: All S are P, so some S are P
    assert.equal(valid([st('all', S, P)], st('some', S, P), null, [{}, {}]), false);
    assert.equal(valid([st('all', S, P)], st('some', S, P), { existentialImport: true }, [{}, {}]), true);
    // Barbara is valid either way
    assert.equal(valid([st('all', M, P), st('all', S, M)], st('all', S, P), { existentialImport: true }), true);
});

test('engine: the forced diagram for Darii shades M-outside-P and puts the x on the P line', () => {
    const an = E.analyse(3, cls, [st('all', M, P), st('some', S, M)], st('some', S, P));
    // M outside P: regions with bit 2 and not bit 1 → 4 (M only) and 5 (S+M)
    assert.deepEqual(plain(an.empty), [4, 5]);
    // Some S are M → S∩M = {5, 7}; 5 is shaded → x sits in 7 alone
    assert.deepEqual(plain(an.marks), [[7]]);
    // Giovanni: G∩Spag split by the Italians line → x on the line
    const g = E.analyse(3, [{ singular: true }, {}, {}], [st('all', 1, 2), st('is', 0, 2)], st('is', 0, 1));
    assert.deepEqual(plain(g.marks), [[5, 7]]);
});

test('generation is deterministic per seed', () => {
    for (const d of [1, 2, 3]) {
        for (let i = 0; i < 25; i++) {
            const a = def.generate(Rift.makeRng('det-' + i), d);
            const b = def.generate(Rift.makeRng('det-' + i), d);
            assert.deepEqual(plain(a), plain(b));
        }
    }
});

test('generated data is JSON-safe', () => {
    for (const d of [1, 2, 3]) {
        const x = def.generate(Rift.makeRng('json-' + d), d);
        assert.deepEqual(JSON.parse(JSON.stringify(x)), plain(x));
    }
});

test('valid and invalid are balanced over 1,000 seeds at every difficulty', () => {
    for (const d of [1, 2, 3]) {
        let v = 0;
        for (let i = 0; i < 1000; i++) v += def.generate(Rift.makeRng('bal-' + d + '-' + i), d).valid ? 1 : 0;
        assert.ok(v >= 350 && v <= 650, 'd' + d + ': ' + v + '/1000 valid');
    }
});

test('generated puzzles respect difficulty and conventions', () => {
    const kinds = new Set();
    for (const d of [1, 2, 3]) {
        for (let i = 0; i < 300; i++) {
            const x = def.generate(Rift.makeRng('rules-' + d + '-' + i), d);
            kinds.add(x.kind);
            const forms = x.premises.map(p => p.q).concat(x.conclusion.q);
            if (d === 1) forms.forEach(q => assert.ok(['all', 'no', 'is', 'isNot'].includes(q), q));
            if (d < 3) assert.equal(x.terms.length, 3);
            assert.equal(x.askEvidence, d >= 2);
            assert.ok(x.premises.length >= 2 && x.premises.length <= 3);
            // validity is computed by the engine and never depends on the import convention
            const boolean = E.analyseData(x), trad = E.analyseData(x, { existentialImport: true });
            assert.equal(x.valid, boolean.valid);
            assert.equal(boolean.valid, trad.valid, 'convention-dependent: ' + x.conclusion.text);
            // world tags
            [...x.premises, x.conclusion].forEach(s => assert.ok([true, false, 'absurd', 'unknown'].includes(s.world)));
            assert.ok(['supported', 'refuted', 'unknown'].includes(x.reference.status));
            // every x fits one region or one line
            boolean.marks.forEach(m => assert.ok(m.length === 1 || (m.length === 2 && ((m[0] ^ m[1]) & ((m[0] ^ m[1]) - 1)) === 0)));
        }
    }
    ['syllogism', 'singular', 'sorites', 'classic', 'carroll'].forEach(k => assert.ok(kinds.has(k), 'never generated ' + k));
});

test('solve() passes check() with full marks', () => {
    for (const d of [1, 2, 3]) {
        for (let i = 0; i < 300; i++) {
            const x = def.generate(Rift.makeRng('solve-' + d + '-' + i), d);
            const r = def.check(x, def.solve(x));
            assert.equal(r.solved, true, x.conclusion.text);
            assert.equal(r.partial, 1);
            assert.equal(r.diagram.perfect, true);
        }
    }
});

test('check(): validity decides, the diagram earns partial credit and named feedback', () => {
    const x = def.generate(Rift.makeRng('partial'), 2);
    const sol = def.solve(x);
    const wrongValid = def.check(x, Object.assign({}, sol, { valid: !sol.valid }));
    assert.equal(wrongValid.solved, false);
    assert.ok(wrongValid.partial > 0 && wrongValid.partial < 1);

    const noDiagram = def.check(x, { valid: sol.valid, premisesEvidence: sol.premisesEvidence, shading: [], marks: [] });
    assert.equal(noDiagram.solved, true);
    assert.ok(noDiagram.partial < 1);
    assert.deepEqual(plain(noDiagram.diagram.missing), plain(sol.shading));
    assert.match(noDiagram.feedback, /should be shaded|x is missing/);

    if (x.askEvidence) {
        const other = sol.premisesEvidence === 'unknown' ? 'supported' : 'unknown';
        assert.equal(def.check(x, Object.assign({}, sol, { premisesEvidence: other })).solved, false);
    }
    assert.equal(def.check(x, {}).solved, false);
});

test('check(): an x placed in one region when it belongs on the line is flagged', () => {
    // Giovanni: x for Giovanni belongs on the Italians line
    let x = null;
    for (let i = 0; i < 400 && !x; i++) {
        const g = def.generate(Rift.makeRng('gio-' + i), 1);
        if (g.kind === 'classic' && g.terms[0].key === 'giovanni' && g.premises[1].q === 'is') x = g;
    }
    assert.ok(x, 'Giovanni piece generated');
    assert.equal(x.valid, false);
    const sol = def.solve(x);
    assert.deepEqual(plain(sol.marks), [[5, 7]]);
    const r = def.check(x, Object.assign({}, sol, { marks: [[7]] }));
    assert.equal(r.solved, true);
    assert.deepEqual(plain(r.diagram.markOk), [false]);
    assert.match(r.feedback, /ON the line/);
});

test('hints and why() are well-formed', () => {
    for (const d of [1, 2, 3]) {
        for (let i = 0; i < 40; i++) {
            const x = def.generate(Rift.makeRng('why-' + d + '-' + i), d);
            const h = def.hints(x);
            assert.ok(h.length >= 4 && h.every(s => typeof s === 'string' && s.length > 10));
            const w = def.why(x);
            assert.equal(w.options.length, 4);
            assert.ok(w.correct >= 0 && w.correct < 4);
            assert.ok(w.options.some(o => /true in real life|false or silly/.test(o)), 'valid-vs-true distractor');
            assert.deepEqual(plain(def.why(x)), plain(w)); // deterministic
        }
    }
});

test('real themes describe our world sensibly', () => {
    E.THEMES.filter(t => !t.absurd).forEach(t => {
        const w = E.worldOf(t);
        t.terms.forEach((term, i) => assert.ok(w.occ & regionBits(w.n, i), t.id + ': ' + term[0] + ' is empty'));
        (t.people || []).filter(p => p.facts).forEach(p => assert.equal(E.placements(t, p.key).length, 1, p.key + ' not pinned'));
    });
    const menagerie = E.THEMES.find(t => t.id === 'menagerie');
    const terms = ['dogs', 'mammals', 'fliers'].map(k => ({ key: k }));
    assert.equal(E.worldTruth(menagerie, st('all', 0, 1), terms), true);
    assert.equal(E.worldTruth(menagerie, st('some', 1, 2), terms), true); // bats
    assert.equal(E.worldTruth(menagerie, st('some', 0, 2), terms), false);
    assert.equal(E.worldTruth(menagerie, st('all', 1, 0), terms), false);
});

test('board geometry has every region, big enough to click', () => {
    for (const n of [3, 4]) {
        const g = E.geometry(n);
        assert.equal(Object.keys(g.anchors).length, 1 << n);
        Object.values(g.anchors).forEach(a => assert.ok(a.clear >= 12));
        for (const [r, a] of Object.entries(g.anchors)) assert.equal(E.locate(g, a.x, a.y, 0).region, Number(r));
    }
});

function regionBits(n, i) {
    let m = 0;
    for (let r = 0; r < (1 << n); r++) if (r & (1 << i)) m |= 1 << r;
    return m;
}
