import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';

const Rift = loadRift(['js/core/rift.js', 'data/creatures.js', 'data/cases.js', 'js/puzzles/registry.js', 'js/puzzles/tribunal.js']);
const def = Rift.Puzzles.get('tribunal');
const { FLAWS, EVIDENCE_ART, THEMES, build, fill, matchContra, nearFor } = def._internal;
const CASES = Rift.data.cases;
const WORDS = { two: 2, three: 3, four: 4, five: 5, six: 6 };

// Every string anywhere in a value.
function strings(v, out = []) {
    if (typeof v === 'string') out.push(v);
    else if (Array.isArray(v)) v.forEach(x => strings(x, out));
    else if (v && typeof v === 'object') Object.values(v).forEach(x => strings(x, out));
    return out;
}

// Only strings, finite numbers, booleans, null, arrays and plain objects.
function jsonSafe(v) {
    if (v === null || typeof v === 'string' || typeof v === 'boolean') return true;
    if (typeof v === 'number') return Number.isFinite(v);
    if (Array.isArray(v)) return v.every(jsonSafe);
    if (typeof v === 'object') return Object.values(v).every(jsonSafe);
    return false;
}

// Can the player reach every step of solve(), pressing anything they like
// and finding contradictions in solve()'s order?
function reachable(data) {
    const seen = new Set(data.testimony.filter(s => !s.hidden).map(s => s.id));
    const unlocked = new Set(data.evidence.filter(e => !e.hidden).map(e => e.id));
    const pressAll = () => {
        let grew = true;
        while (grew) {
            grew = false;
            data.testimony.filter(s => seen.has(s.id)).forEach(s => {
                if (s.press.adds && !seen.has(s.press.adds)) { seen.add(s.press.adds); grew = true; }
                if (s.press.unlocks && !unlocked.has(s.press.unlocks)) { unlocked.add(s.press.unlocks); grew = true; }
            });
        }
    };
    for (const p of def.solve(data).presented) {
        pressAll();
        if (!seen.has(p.statement) || !unlocked.has(p.evidence)) return false;
        const c = data.contradictions[matchContra(data, p)];
        if (c.after && c.after.adds) seen.add(c.after.adds);
    }
    return true;
}

test('there are 12 cases, 4 per difficulty, one per flaw', () => {
    assert.equal(CASES.length, 12);
    assert.equal(new Set(CASES.map(c => c.id)).size, 12, 'case ids unique');
    for (const d of [1, 2, 3]) assert.equal(CASES.filter(c => c.difficulty === d).length, 4, 'difficulty ' + d);
    assert.deepEqual([...CASES.map(c => c.flaw)].sort(), [...Object.keys(FLAWS)].sort(), 'every flaw taught exactly once');
    CASES.forEach(c => assert.ok(THEMES.includes(c.theme), c.id + ' theme'));
    assert.ok(CASES.some(c => c.repair), 'a proof on trial with a repair step');
});

for (const c of CASES) {
    test(`case ${c.id}: internally consistent`, () => {
        const sIds = c.testimony.map(s => s.id), eIds = c.evidence.map(e => e.id);
        assert.ok(Rift.data.creatures[c.witness], 'witness ' + c.witness + ' exists in data/creatures.js');
        assert.ok(FLAWS[c.flaw], 'flaw id ' + c.flaw);
        assert.equal(c.distractors.length, 3);
        c.distractors.forEach(f => assert.ok(FLAWS[f], 'distractor ' + f));
        assert.equal(new Set([c.flaw].concat(c.distractors)).size, 4, 'flaw options distinct');
        assert.ok(c.title && c.claim && c.opening && c.intro && c.hint && c.lesson);

        // Testimony
        assert.ok(c.testimony.length >= 4 && c.testimony.length <= 6, 'testimony has 4-6 statements');
        assert.equal(new Set(sIds).size, sIds.length, 'statement ids unique');
        c.testimony.forEach(s => {
            assert.ok(s.text && s.text.length <= 130, 'statement short: ' + s.text);
            assert.ok(s.press && s.press.q && s.press.reply, 'press follow-up for ' + s.id);
            if (s.press.adds) {
                const t = c.testimony.find(x => x.id === s.press.adds);
                assert.ok(t && t.hidden, s.id + ' adds a hidden statement');
            }
            if (s.press.unlocks) {
                const e = c.evidence.find(x => x.id === s.press.unlocks);
                assert.ok(e && e.hidden, s.id + ' unlocks hidden evidence');
            }
        });
        assert.ok(c.testimony.filter(s => !s.hidden).length >= 4, 'at least 4 statements at the start');

        // Evidence
        assert.ok(c.evidence.length >= 2 && c.evidence.length <= 5, 'evidence 2-5 items');
        assert.equal(new Set(eIds).size, eIds.length, 'evidence ids unique');
        c.evidence.forEach(e => {
            assert.ok(EVIDENCE_ART.includes(e.art), 'evidence art ' + e.art);
            assert.ok(e.name && e.desc);
            if (e.hidden) assert.ok(c.testimony.some(s => s.press.unlocks === e.id), 'hidden evidence ' + e.id + ' is unlocked by a press');
        });

        // Contradictions
        assert.ok(c.contradictions.length >= 1, 'at least one contradiction');
        c.contradictions.forEach(x => {
            assert.ok([].concat(x.statements).length && [].concat(x.evidence).length);
            [].concat(x.statements).forEach(id => assert.ok(sIds.includes(id), 'contradiction statement ' + id));
            [].concat(x.evidence).forEach(id => assert.ok(eIds.includes(id), 'contradiction evidence ' + id));
            assert.ok(x.explain && x.reaction);
            if (x.after && x.after.adds) assert.ok(c.testimony.find(s => s.id === x.after.adds && s.hidden), 'after.adds a hidden statement');
        });
        const need = c.need || c.contradictions.length;
        assert.ok(need >= 1 && need <= c.contradictions.length);
        c.testimony.filter(s => s.hidden).forEach(s => {
            const byPress = c.testimony.some(t => t.press.adds === s.id);
            const byContra = c.contradictions.some(x => x.after && x.after.adds === s.id);
            assert.ok(byPress || byContra, 'hidden statement ' + s.id + ' can appear');
        });

        // Near misses are real pairs and not contradictions.
        (c.near || []).forEach(n => {
            assert.ok(sIds.includes(n.statement) && eIds.includes(n.evidence) && n.say, 'near pair ' + n.statement + '/' + n.evidence);
            assert.ok(!c.contradictions.some(x => [].concat(x.statements).includes(n.statement) && [].concat(x.evidence).includes(n.evidence)), 'near is not a contradiction');
        });

        assert.ok(c.why && c.why.right && c.why.wrong.length === 3);
        assert.equal(new Set([c.why.right].concat(c.why.wrong)).size, 4);
        if (c.repair) {
            assert.ok(c.repair.options.some(o => o.id === c.repair.correct));
            assert.ok(c.repair.options.length >= 3);
            c.repair.options.forEach(o => assert.ok(o.text && o.explain));
        }

        // Placeholders: every one filled by every parameter set, none without params.
        const all = strings(c);
        if (c.params) {
            c.params.forEach(p => strings(fill(c, p)).forEach(s => assert.ok(!/\{\w+\}/.test(s), 'unfilled placeholder in: ' + s)));
        } else {
            all.forEach(s => assert.ok(!/\{\w+\}/.test(s), 'placeholder without params: ' + s));
        }
    });
}

test('numbers in the varied statistics cases are consistent', () => {
    const coin = CASES.find(c => c.id === 'psychic-coin');
    coin.params.forEach(p => {
        assert.equal(p.p, 2 ** p.k, '1 in 2^k');
        assert.equal(p.m, p.n / p.p, 'expected winners n / p');
    });
    const bar = CASES.find(c => c.id === 'tall-bar');
    bar.params.forEach(p => {
        assert.equal((p.b - p.base) / (p.a - p.base), WORDS[p.ratio], 'cut-axis bar ratio');
        assert.equal(p.diff, p.b - p.a);
        assert.ok(p.base < p.a && p.a < p.b && p.b <= 100);
    });
    const frame = CASES.find(c => c.id === 'picture-frame');
    assert.match(frame.evidence.find(e => e.id === 'frame').desc, /16 corners, 32 edges, 16 faces/);
});

for (const d of [1, 2, 3]) {
    test(`difficulty ${d}: generated cases are JSON-safe, solvable, reachable`, () => {
        const seen = new Set();
        for (let i = 0; i < 200; i++) {
            const data = def.generate(Rift.makeRng(`tb-${d}-${i}`), d);
            seen.add(data.caseId);
            assert.equal(data.difficulty, d);
            assert.ok(jsonSafe(data), 'JSON-safe');
            assert.ok(!strings(data).some(s => /\{\w+\}|undefined/.test(s)), 'no unfilled text');
            assert.equal(data.flawOptions.length, 4);
            assert.ok(data.flawOptions.includes(data.flaw));
            assert.ok(reachable(data), data.caseId + ': solution reachable by pressing');

            const ans = def.solve(data);
            const ok = def.check(data, ans);
            assert.equal(ok.solved, true, data.caseId);
            assert.equal(ok.partial, 1);
            assert.match(ok.feedback, /Case closed/);

            const h = def.hints(data);
            assert.equal(h.length, 3);
            h.forEach(x => assert.ok(typeof x === 'string' && x.length > 10 && !/undefined/.test(x)));
            assert.match(h[2], /^Present /);

            const w = def.why(data);
            assert.equal(w.options.length, 4);
            assert.equal(new Set(w.options).size, 4);
            assert.equal(w.options[w.correct], data.whyText.right);
            assert.ok(w.question && w.explain);
        }
        assert.deepEqual([...seen].sort(), [...CASES.filter(c => c.difficulty === d).map(c => c.id)].sort(), 'every case turns up');
    });
}

test('wrong presentations fail with feedback; partial credit is ordered', () => {
    for (const c of CASES) {
        for (let v = 0; v < (c.params ? c.params.length * 3 : 2); v++) {
            const data = build(c, Rift.makeRng(c.id + ':' + v));
            const good = def.solve(data);
            // Every statement x evidence pair that is not a contradiction fails.
            for (const s of data.testimony) {
                for (const e of data.evidence) {
                    const pair = { statement: s.id, evidence: e.id };
                    if (matchContra(data, pair) >= 0) continue;
                    const r = def.check(data, { presented: [pair], flaw: data.flaw, repair: good.repair });
                    assert.equal(r.solved, false, `${c.id}: ${s.id}+${e.id} should fail`);
                    assert.ok(r.partial < 1 && r.partial >= 0);
                    assert.ok(r.feedback && r.feedback.length > 20, 'feedback explains');
                    if (!nearFor(data, pair)) assert.match(r.feedback, /“[^”]+”/, 'quotes the statement');
                    // A wrong pair on top of a correct answer still fails.
                    const extra = def.check(data, Object.assign({}, good, { presented: good.presented.concat([pair]) }));
                    assert.equal(extra.solved, false);
                }
            }
            // Every listed alternative counts.
            data.contradictions.forEach(x => x.statements.forEach(s => x.evidence.forEach(e => assert.ok(matchContra(data, { statement: s, evidence: e }) >= 0))));
            const alt = Object.assign({}, good, {
                presented: data.contradictions.slice(0, data.need).map(x => ({ statement: x.statements[x.statements.length - 1], evidence: x.evidence[x.evidence.length - 1] })),
            });
            assert.equal(def.check(data, alt).solved, true, c.id + ' alternative pairs');
            // Order of presentations doesn't matter.
            assert.equal(def.check(data, Object.assign({}, good, { presented: good.presented.slice().reverse() })).solved, true);

            // Right contradiction(s), wrong flaw.
            const wrongFlaw = data.flawOptions.find(f => f !== data.flaw);
            const wf = def.check(data, Object.assign({}, good, { flaw: wrongFlaw }));
            assert.equal(wf.solved, false);
            assert.match(wf.feedback, /isn’t/);
            assert.ok(wf.partial > 0.5 && wf.partial < 1);
            const nf = def.check(data, { presented: good.presented });
            assert.equal(nf.solved, false);
            assert.match(nf.feedback, /name the flaw/);

            // Not enough contradictions.
            if (data.need > 1) {
                const half = def.check(data, Object.assign({}, good, { presented: good.presented.slice(0, 1) }));
                assert.equal(half.solved, false);
                assert.match(half.feedback, /another weak point/);
                assert.ok(half.partial < wf.partial + 0.35);
            }
            // Wrong repair.
            if (data.repair) {
                const wrongRepair = data.repair.options.find(o => o.id !== data.repair.correct);
                const wr = def.check(data, Object.assign({}, good, { repair: wrongRepair.id }));
                assert.equal(wr.solved, false);
                assert.equal(wr.feedback, wrongRepair.explain);
            }
            // Flaw alone earns less than the contradiction alone.
            const flawOnly = def.check(data, { presented: [], flaw: data.flaw });
            assert.equal(flawOnly.solved, false);
            assert.ok(flawOnly.partial < def.check(data, { presented: good.presented }).partial);

            // Junk is reported, not crashed on.
            for (const junk of [null, undefined, {}, { presented: 'x' }, { presented: [null, 3] }, { presented: [{ statement: 'nope', evidence: 'nada' }], flaw: 'nonsense' }]) {
                const r = def.check(data, junk);
                assert.equal(r.solved, false);
                assert.ok(r.feedback);
            }
        }
    }
});

test('generation is deterministic for a seed, and options are shuffled', () => {
    for (const d of [1, 2, 3]) {
        const a = def.generate(Rift.makeRng('same-seed'), d);
        const b = def.generate(Rift.makeRng('same-seed'), d);
        assert.deepEqual(a, b);
        assert.deepEqual(def.why(a), def.why(b));
        assert.deepEqual(def.hints(a), def.hints(b));
    }
    // Over many seeds, the same case shows its evidence and flaw options in different orders.
    const orders = new Set(), flawOrders = new Set(), coins = new Set();
    for (let i = 0; i < 60; i++) {
        const data = build(CASES.find(c => c.id === 'psychic-coin'), Rift.makeRng('ord' + i));
        orders.add(data.evidence.map(e => e.id).join());
        flawOrders.add(data.flawOptions.join());
        coins.add(data.params.k);
    }
    assert.ok(orders.size > 1 && flawOrders.size > 1, 'presentation varies');
    assert.ok(coins.size > 1, 'numbers vary');
});

test('optional theme and case picks', () => {
    for (let i = 0; i < 30; i++) {
        const p = def.generate(Rift.makeRng('th' + i), 1 + (i % 3), { theme: 'proof' });
        assert.equal(p.theme, 'proof');
        const s = def.generate(Rift.makeRng('st' + i), 1 + (i % 3), { theme: 'statistics' });
        assert.equal(s.theme, 'statistics');
    }
    assert.equal(def.generate(Rift.makeRng('x'), 1, { caseId: 'picture-frame' }).caseId, 'picture-frame');
    assert.equal(def.generate(Rift.makeRng('x'), 9).difficulty, 3, 'difficulty is clamped');
});

test('registration', () => {
    assert.equal(def.colour, 'language');
    assert.equal(def.family, 'Breaking down arguments');
    assert.ok(def.tok && def.blurb && def.name);
});
