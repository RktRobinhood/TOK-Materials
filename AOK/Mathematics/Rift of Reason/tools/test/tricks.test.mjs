// Roaming legendary trick rounds (#111, js/core/tricks.js): hard, idiot-test style, and fair.
// Every round: one answer that follows from the sign and the screen, every other answer rejected
// with a reason, no colour-only cues, and the same run for the same seed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';

const R = loadRift(['js/core/rift.js', 'js/core/tricks.js']);
const T = R.Tricks;
const J = x => JSON.parse(JSON.stringify(x));
const MODES = ['pick', 'multi', 'tap', 'sequence', 'wait', 'number'];
const SEEDS = 40;

test('a run: ROUNDS rounds, OWN_PER_RUN of the creature\'s own, the rest shared, no repeats, fixed by the seed', () => {
    for (const id of T.ids()) {
        const runs = new Set();
        for (let seed = 0; seed < SEEDS; seed++) {
            const run = T.make(id, seed);
            assert.equal(run.rounds.length, T.ROUNDS);
            assert.deepEqual(J(T.make(id, seed)), J(run), 'same seed, same run');
            const keys = run.rounds.map(r => r.key);
            assert.equal(new Set(keys).size, keys.length, 'no trick twice in a run');
            assert.equal(keys.filter(k => k.startsWith('own:')).length, T.OWN_PER_RUN);
            assert.equal(new Set(run.rounds.map(r => r.sign)).size, T.ROUNDS, 'the sign changes every round');
            runs.add(keys.slice().sort().join());
        }
        assert.ok(runs.size > SEEDS * 0.8, id + ': attempts rarely repeat (' + runs.size + ' different runs)');
    }
});

test('the bank is big: about 50 tricks per creature, and a run never needs a trick twice', () => {
    for (const id of T.ids()) {
        assert.ok(T.ownKeys(id).length >= 9, id);
        assert.ok(T.ownKeys(id).length >= T.OWN_PER_RUN * 2, id + ': own tricks vary between attempts');
        assert.equal(T.bank(id, 0).length, T.ownKeys(id).length + T.sharedKeys().length);
        assert.ok(T.bank(id, 0).length >= 49, id);
    }
    assert.ok(T.sharedKeys().length >= (T.ROUNDS - T.OWN_PER_RUN) * 4, 'shared tricks vary between attempts');
});

test('a quick round fails when its clock runs out, and says so', () => {
    const quick = T.bank('maskip', 0).filter(r => r.seconds && r.mode !== 'wait');
    assert.ok(quick.length >= 2);
    quick.forEach(r => {
        assert.ok(r.seconds >= 6, r.key + ': generous, not a reflex test');
        const res = T.check(r, T.TIMEOUT);
        assert.equal(res.ok, false);
        assert.match(res.why, /^The clock ran out\./);
    });
});

test('quick timers are occasional: at most one per twelve-round run, always signposted', () => {
    let timed = 0, untimed = 0;
    for (const id of T.ids()) {
        for (let seed = 0; seed < 500; seed++) {
            const run = T.make(id, seed);
            const quick = run.rounds.filter(r => r.seconds && r.mode !== 'wait');
            assert.ok(quick.length <= 1, id + ' seed ' + seed + ': speed must not dominate a run');
            if (quick.length) timed++; else untimed++;
            run.rounds.forEach(r => {
                if (r.seconds && r.mode !== 'wait') {
                    assert.equal(r.mode, 'tap', r.key + ': keep reading/counting untimed');
                    assert.match(r.sign, /^Quick! /);
                } else if (r.mode !== 'wait') {
                    assert.doesNotMatch(r.sign, /Quick!|clock runs out/i, r.key + ': no false deadline');
                }
            });
        }
    }
    assert.ok(timed > 0 && untimed > 0, 'some runs have a speed test; others have none');
});

test('counting stays untimed; waiting still tests resisting a click', () => {
    for (const id of T.ids()) {
        const bank = T.bank(id, 0);
        const count = bank.find(r => r.key === 'shared:quickCount');
        assert.equal(count.seconds, undefined);
        assert.doesNotMatch(count.sign, /Quick!/);
        const waits = bank.filter(r => r.mode === 'wait');
        assert.ok(waits.length > 0);
        waits.forEach(r => {
            assert.ok(r.seconds >= 3);
            assert.equal(T.check(r, T.WAITED).ok, true);
        });
    }
});

function checkRound(where, r) {
    assert.ok(MODES.includes(r.mode), where + ': mode ' + r.mode);
    assert.ok(r.sign && r.sign.length <= 200, where + ': sign');
    assert.ok(r.why && r.why.length > 10 && r.why.length <= 260, where + ': why');
    assert.ok(!/\b(red|green|blue|yellow|orange|purple|pink)\b/i.test(r.sign), where + ': no colour-only cue in the sign');
    const ids = r.options.map(o => o.id);
    assert.equal(new Set(ids).size, ids.length, where + ': duplicate options');
    const places = r.options.filter(o => o.place);
    assert.ok(places.length <= 1, where + ': at most one hidden target');
    places.forEach(o => {
        assert.equal(r.mode, 'tap', where + ': hidden targets answer on click');
        assert.ok(['sign', 'portrait', 'title'].includes(o.place));
        if (o.place === 'sign') assert.ok(r.signLink && r.sign.includes(r.signLink), where + ': the sign word is in the sign');
    });
    assert.ok(T.check(r, T.solution(r)).ok, where + ': the solution passes');

    if (r.mode === 'pick' || r.mode === 'tap') {
        assert.ok(r.accept.length >= 1 && r.accept.every(a => ids.includes(a)), where + ': answer on offer');
        assert.ok(r.accept.length < ids.length, where + ': not everything is right');
        ids.forEach(o => {
            const res = T.check(r, o);
            assert.equal(res.ok, r.accept.includes(o), where + ': ' + o);
            if (!res.ok) assert.equal(res.why, r.why);
        });
    } else if (r.mode === 'multi') {
        const want = r.accept[0];
        assert.ok(want.length >= 1 && want.length < ids.length && want.every(a => ids.includes(a)), where + ': a real subset');
        assert.equal(T.check(r, want.slice(1)).ok, false, where + ': missing one fails');
        const extra = ids.find(x => !want.includes(x));
        assert.equal(T.check(r, want.concat([extra])).ok, false, where + ': one too many fails');
        assert.equal(T.check(r, want.slice().reverse()).ok, true, where + ': order does not matter');
    } else if (r.mode === 'sequence') {
        const want = r.accept[0];
        assert.ok(want.length >= 2 && want.every(a => ids.includes(a)), where + ': presses on offer');
        const wrongFirst = ids.find(x => x !== want[0]);
        assert.equal(T.onTrack(r, [wrongFirst]), false, where + ': a wrong first press is caught at once');
        assert.equal(T.onTrack(r, want.slice(0, 1)), true);
        assert.equal(T.check(r, want.slice(0, -1)).ok, false, where + ': stopping early fails');
    } else if (r.mode === 'wait') {
        assert.deepEqual(J(r.accept), [T.WAITED]);
        assert.ok(r.seconds >= 3 && r.seconds <= 10, where + ': a short wait');
        assert.ok(ids.length >= 2, where + ': something to resist');
        ids.forEach(o => assert.equal(T.check(r, o).ok, false, where + ': touching fails'));
    } else if (r.mode === 'number') {
        assert.equal(ids.length, 0);
        assert.ok(/^-?\d+$/.test(r.accept[0]), where + ': a whole number');
        const n = Number(r.accept[0]);
        assert.equal(T.check(r, ' ' + n + ' ').ok, true, where + ': spaces are forgiven');
        assert.equal(T.check(r, String(n + 1)).ok, false);
        assert.equal(T.check(r, '').ok, false);
    }
}

test('every trick in every bank is well-formed, solvable and rejects wrong answers with a reason', () => {
    for (const id of T.ids()) {
        for (let seed = 0; seed < SEEDS; seed++) T.bank(id, seed).forEach(r => checkRound(id + ' ' + r.key + ' #' + seed, r));
    }
});

const find = (rounds, key) => rounds.find(r => r.key === key);

test('audited clues provide the assumptions and layout needed for their accepted answers', () => {
    for (let seed = 0; seed < SEEDS; seed++) {
        const bank = T.bank('quibblequill', seed);
        const months = find(bank, 'shared:months');
        assert.equal(months.scene.kind, 'note');
        assert.match(months.scene.text, /12 months.*February.*28 or 29.*30 or 31/);
        assert.equal(months.accept[0], months.sign.includes('30') ? '11' : '12');
        const corners = find(bank, 'shared:corners');
        if (corners.sign.includes('square')) {
            assert.equal(corners.scene.kind, 'corner-cut');
            assert.equal(Number(corners.accept[0]), 4 - 1 + 2);
        }
        assert.equal(find(bank, 'shared:secondLeft').layout, 'row');
        const agreeing = find(bank, 'own:agreeing');
        assert.deepEqual(J(agreeing.accept[0]).sort(), J(agreeing.scene.records.filter(r => r.stamped && r.arrived).map(r => r.id)).sort());
        assert.match(agreeing.sign, /STAMPED.*ARRIVED/);
        const odds = T.bank('oddsnap', seed);
        ['own:streak', 'own:sameRolls', 'own:twoDice'].forEach(key => assert.match(find(odds, key).scene.text, /independent/i));
    }
});

test('the creatures\' own tricks follow from their evidence', () => {
    for (let seed = 0; seed < SEEDS; seed++) {
        const m = T.bank('maskip', seed);
        const pairOf = (r, pid) => r.scene.pairs.find(p => p.id === pid);
        const both = find(m, 'own:both');
        assert.deepEqual(J(both.accept.map(a => pairOf(both, a)).map(p => [p.left, p.right])), [[true, true]]);
        const one = find(m, 'own:exactlyOne');
        assert.equal(one.accept.length, 2, 'both "exactly one" pairs pass');
        one.accept.forEach(a => assert.notEqual(pairOf(one, a).left, pairOf(one, a).right));
        const claim = find(m, 'own:claim');
        assert.ok(claim.scene.claim.startsWith(pairOf(claim, claim.scene.target).name));
        const rule = find(m, 'own:breaksRule');
        assert.deepEqual(J(rule.accept.map(a => pairOf(rule, a)).map(p => [p.left, p.right])), [[true, false]]);
        assert.equal(find(m, 'own:atLeastOne').accept[0].length, 3);

        const q = T.bank('quibblequill', seed);
        const ce = find(q, 'own:counterexample');
        const rec = ce.scene.records.find(r => r.id === ce.accept[0]);
        assert.ok(rec.stamped && !rec.arrived, 'the counterexample is stamped and not arrived');
        assert.equal(ce.scene.records.filter(r => r.stamped && !r.arrived).length, 1);
        const irr = find(q, 'own:irrelevant');
        irr.accept[0].forEach(a => assert.equal(irr.scene.records.find(r => r.id === a).stamped, false));

        const o = T.bank('oddsnap', seed);
        const least = find(o, 'own:least'), most = find(o, 'own:most');
        assert.equal(least.accept[0], least.scene.shapes.reduce((a, b) => (b.count < a.count ? b : a)).id);
        assert.ok(!least.scene.shapes.find(x => x.id === least.accept[0]).glow, 'the glowing shape is a decoy');
        assert.equal(most.accept[0], most.scene.shapes.reduce((a, b) => (b.count > a.count ? b : a)).id);
        const g = find(o, 'own:guarantee');
        assert.ok(g.scene.doors.every(d => d.pct < 100));
        assert.deepEqual(J(g.accept), ['none']);
    }
});

test('the shared tricks are traps you can see through', () => {
    for (let seed = 0; seed < SEEDS; seed++) {
        const s = T.bank('oddsnap', seed);
        const small = find(s, 'shared:smallest');
        assert.equal(small.options.find(x => x.id === small.accept[0]).size, 'xs');
        const big = find(s, 'shared:biggestNumber');
        const biggest = big.options.find(x => x.id === big.accept[0]);
        assert.equal(Number(biggest.label), Math.max(...big.options.map(x => Number(x.label))));
        assert.equal(biggest.size, 'xs', 'the biggest number is in the smallest print');
        const shape = find(s, 'shared:shapeNotWord');
        assert.ok(shape.options.find(x => x.id === shape.accept[0]).label.startsWith(shape.scene.icon));
        assert.notEqual(shape.scene.word, shape.options.find(x => x.id === shape.accept[0]).label.slice(2).toUpperCase(), 'the word is a decoy');
        const word = find(s, 'shared:wordNotShape');
        assert.equal(word.options.find(x => x.id === word.accept[0]).label.slice(2).toUpperCase(), word.scene.word);
        const evens = find(s, 'shared:evens');
        assert.ok(evens.accept[0].includes('v0'), 'zero is even');
        const cost = find(s, 'shared:cost');
        const nums = cost.sign.match(/\d+/g).map(Number);
        assert.equal(2 * Number(cost.accept[0]) + nums[1], nums[0], 'the cheap thing plus the dear one makes the total');
        assert.equal(find(s, 'shared:rounds').accept[0], String(T.ROUNDS));
        const odd = find(s, 'shared:oddOne');
        assert.equal(odd.options.filter(x => Number(x.label) % 2 === 1).map(x => x.id).join(), odd.accept[0]);
    }
});
