import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWithDom } from './fake-dom.mjs';

const files = ['js/core/rift.js', 'js/puzzles/registry.js', 'js/puzzles/venn.js'];
const g = loadWithDom(files);
const P = g.Rift.Puzzles.get('venn');
const E = P.engine;
const theme = {
    id: 'record', terms: [['cats', 'Cats', 'cats', 'a cat'], ['mammals', 'Mammals', 'mammals', 'a mammal'], ['fliers', 'Fliers', 'fliers', 'a flier']],
    facts: ['all cats mammals', 'no cats fliers'],
    people: [{ key: 'tom', name: 'Tom', facts: ['is cats'] }],
};
const terms = theme.terms.map(t => ({ key: t[0], label: t[1], plural: t[2], one: t[3] }));
const status = (q, a, b) => E.premiseEvidence(theme, { q, a, b }, terms).status;

test('reference evidence distinguishes proof, counterexample and missing information', () => {
    assert.equal(status('all', 0, 1), 'supported');
    assert.equal(status('no', 0, 1), 'refuted'); // Tom is a known cat and mammal.
    assert.equal(status('some', 0, 1), 'supported');
    assert.equal(status('some', 0, 2), 'refuted');
    assert.equal(status('someNot', 0, 2), 'supported');
    assert.equal(status('all', 1, 0), 'unknown'); // No record of a non-cat mammal.
    assert.equal(status('some', 1, 2), 'unknown'); // Possible does not mean established.
    assert.equal(status('no', 1, 2), 'unknown');
    assert.equal(E.premiseEvidence({ ...theme, people: [] }, { q: 'some', a: 0, b: 1 }, terms).status, 'unknown');
});

test('named records establish only the properties they force', () => {
    const named = [{ key: 'tom', label: 'Tom', singular: true }, ...terms];
    assert.equal(E.premiseEvidence(theme, { q: 'is', a: 0, b: 2 }, named).status, 'supported');
    assert.equal(E.premiseEvidence(theme, { q: 'is', a: 0, b: 3 }, named).status, 'refuted');
    const noRecord = { ...theme, people: [{ key: 'tom', name: 'Tom' }] };
    assert.equal(E.premiseEvidence(noRecord, { q: 'is', a: 0, b: 2 }, named).status, 'unknown');
    const partial = { ...theme, people: [{ key: 'tom', name: 'Tom', facts: ['is mammals'] }] };
    assert.equal(E.premiseEvidence(partial, { q: 'is', a: 0, b: 1 }, named).status, 'unknown');
});

test('Farmyard has no evidence for its premises; neither false nor a third truth value', () => {
    let data;
    for (let i = 0; i < 2000 && !data; i++) {
        const candidate = P.generate(g.Rift.makeRng('farmyard-' + i), 2);
        if (candidate.theme.id === 'carroll-cats') data = candidate;
    }
    assert.ok(data);
    assert.equal(data.reference.status, 'unknown');
    assert.equal(data.reference.records.length, 0);
    const answer = P.solve(data);
    const wrong = P.check(data, { ...answer, premisesEvidence: 'refuted' });
    assert.equal(wrong.validOk, true);
    assert.equal(wrong.evidenceOk, false);
    assert.equal(wrong.solved, false);
    assert.match(wrong.feedback, /Change the premise-support verdict to Not enough evidence/);
    assert.match(wrong.feedback, /Premise 1/);
    assert.match(wrong.feedback, /Lack of evidence does not make it false/);
    assert.equal(P.check(data, answer).solved, true);
});

test('mounted Venn explicitly permits empty working and submits the two separate judgements', () => {
    const data = P.generate(g.Rift.makeRng('optional-evidence'), 2);
    const sol = P.solve(data);
    const submitted = [];
    const host = g.document.createElement('div');
    g.document.body.appendChild(host);
    const handle = P.mount(host, data, { el: g.Rift.el, submit: answer => { submitted.push(answer); return P.check(data, answer); } });
    const button = label => host.querySelectorAll('button').find(b => b.textContent === label);
    assert.match(host.textContent, /Optional working/);
    assert.match(host.textContent, /an empty drawing is allowed/);
    assert.match(host.textContent, /Use only these records/);
    assert.ok(!button('Absurd'));
    button(sol.valid ? 'Valid' : 'Invalid').click();
    assert.equal(button('Seal the verdict').disabled, true);
    const labels = { supported: 'All supported', refuted: 'At least one refuted', unknown: 'Not enough evidence' };
    button(labels[sol.premisesEvidence]).click();
    button('Seal the verdict').click();
    assert.equal(submitted.length, 1);
    assert.equal(submitted[0].shading.length, 0);
    assert.equal(submitted[0].marks.length, 0);
    assert.equal(P.check(data, submitted[0]).solved, true);
    assert.equal(button('Seal the verdict').disabled, true);
    handle.destroy();
});

// Independent finite-world oracle. A permitted region may be empty or occupied;
// only individuals with recorded facts require an occupied matching region.
// This deliberately does not use worldOf, placements, compile or models.
function referenceWorlds(t) {
    const keys = t.terms.map(term => term[0]);
    const n = keys.length;
    assert.ok(n <= 4, 'The complete-world oracle covers the current three/four-term content');
    const maskWhere = pred => {
        let mask = 0;
        for (let r = 0; r < (1 << n); r++) if (pred(r)) mask |= 1 << r;
        return mask;
    };
    let banned = 0;
    for (const fact of t.facts || []) {
        const [q, a, b] = fact.split(' ');
        assert.ok(q === 'all' || q === 'no', 'Reference class records are universal facts');
        const A = 1 << keys.indexOf(a), B = 1 << keys.indexOf(b);
        banned |= maskWhere(r => (r & A) && (q === 'all' ? !(r & B) : (r & B)));
    }
    const witnesses = (t.people || []).filter(p => p.facts?.length).map(p => maskWhere(r => p.facts.every(f => {
        const [q, key] = f.split(' ');
        return !!(r & (1 << keys.indexOf(key))) === (q === 'is');
    })));
    const worlds = [];
    for (let occupied = 0; occupied < (1 << (1 << n)); occupied++) {
        if (!(occupied & banned) && witnesses.every(w => occupied & w)) worlds.push(occupied);
    }
    assert.ok(worlds.length, t.id + ': the reference records must be consistent');
    return { n, worlds, maskWhere };
}

test('all current real-theme premise evidence agrees with every complete world allowed by the records', () => {
    for (const t of E.THEMES.filter(t => !t.absurd)) {
        const { n, worlds, maskWhere } = referenceWorlds(t);
        const T = t.terms.map(term => ({ key: term[0] }));
        for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) {
            for (const q of ['all', 'no', 'some', 'someNot']) {
                const A = 1 << a, B = 1 << b;
                const scope = maskWhere(r => (r & A) && (q === 'all' || q === 'someNot' ? !(r & B) : (r & B)));
                const existential = q === 'some' || q === 'someNot';
                const holds = occupied => existential === !!(occupied & scope);
                const expected = worlds.every(holds) ? 'supported' : worlds.some(holds) ? 'unknown' : 'refuted';
                assert.equal(E.premiseEvidence(t, { q, a, b }, T).status, expected,
                    `${t.id}: ${q} ${T[a].key} ${T[b].key}`);
            }
        }
    }
});

test('a refuted premise takes precedence over another premise with unknown evidence', () => {
    const premises = [{ q: 'some', a: 1, b: 2 }, { q: 'no', a: 0, b: 1 }];
    const reference = E.referenceFor(theme, premises, terms);
    assert.deepEqual(Array.from(reference.judgements, j => j.status), ['unknown', 'refuted']);
    assert.equal(reference.status, 'refuted');
    assert.match(reference.judgements[1].reason, /Tom is a recorded counterexample/);
    assert.ok(reference.records.includes('Tom is a cat.'), 'The named counterexample is in the displayed records');
});
