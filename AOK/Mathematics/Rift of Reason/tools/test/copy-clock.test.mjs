// The Copy's upload clock (STORY.md App. C, design/SCRIPT-FORMAT.md §8b) and the three core
// trials (Ch4 core): built-in rules in js/core/stakes.js, puzzle opts in data/map.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';

const CORE = ['js/core/rift.js', 'js/core/state.js', 'data/avatars.js', 'data/map.js', 'js/core/story.js', 'js/core/stakes.js'];
const plain = x => JSON.parse(JSON.stringify(x));

function game(flags) {
    const Rift = loadRift(CORE);
    Rift.data.script = {};
    Rift.data.clocks = {};
    Rift.State.newGame();
    Rift.State.update(s => { s.avatar = { type: 'owlet', variant: 'girl', nickname: 'Ada' }; Object.assign(s.flags, flags || {}); });
    return Rift;
}

test('the Copy: built-in rules, merged under the lesson script\'s words', () => {
    const Rift = game();
    Rift.data.clocks.copy = { warn: [{ s: 'algorithm', t: 'UPLOADING.' }] };
    const d = Rift.Stakes.def('copy');
    assert.equal(d.size, 8);
    assert.equal(d.hold, true);
    assert.equal(d.stakes, 'ch4');
    assert.equal(d.node, 'k-core');
    assert.equal(d.fullLabel, 'UPLOAD COMPLETE · WAITING');
    assert.deepEqual(plain(d.pausedAt), ['k-sorting']);
    assert.ok(!d.floors.includes('k-sorting') && !d.floors.includes('k-core'));
    assert.equal(d.warn[0].t, 'UPLOADING.', 'the script adds the words');
    // Every floor and pause node is a real Ch4 node.
    const nodes = Rift.data.map.nodes;
    [d.node].concat(d.floors, d.pausedAt).forEach(id => assert.equal(nodes[id].chapter, 'ch4', id));
    const pip = Rift.Stakes.def('pip');
    assert.equal(pip.size, 6);
    assert.equal(pip.node, 'k-sorting');
    assert.equal(pip.peril, 'pip');
});

test('the Copy starts at ⌊Feed ÷ 3⌋, +2 with the bargain, +1 if the Tribunal was at a price, at most 3', () => {
    const cases = [
        [{}, 0],
        [{ feed: 5 }, 1],
        [{ feed: 6 }, 2],
        [{ feed: 2, bargain: 'yes' }, 2],
        [{ feed: 0, bargain: 'no', 'stakes.ch3': 3 }, 1],
        [{ feed: 3, bargain: 'yes', 'stakes.ch3': 3 }, 3],
        [{ feed: 8, bargain: 'yes', 'stakes.ch3': 3 }, 3],
    ];
    for (const [flags, n] of cases) {
        const Rift = game(flags);
        Rift.Stakes.start('copy', 0);
        assert.equal(Rift.Stakes.danger('copy'), n, JSON.stringify(flags));
    }
});

test('floors tick once per floor; the Sorting Room pauses the bar; the core is a stakes scene', () => {
    const Rift = game();
    const S = Rift.Stakes;
    S.start('copy', 0);
    assert.deepEqual(plain(S.forNode('k-gallery')), { scene: null, floor: 'copy' });
    assert.deepEqual(plain(S.forNode('k-core')), { scene: 'copy', floor: null });
    assert.deepEqual(plain(S.forNode('k-sorting')), { scene: null, floor: null }, 'the bar never ticks at the Sorting Room');
    assert.equal(S.pausedAt('copy', 'k-sorting'), true);
    assert.equal(S.pausedAt('copy', 'k-gallery'), false);
    assert.equal(S.markFloor('copy', 'k-gallery'), true, 'first wrong check on a floor');
    assert.equal(S.markFloor('copy', 'k-gallery'), false, 'later ones (even on a revisit) cost hearts only');
    assert.equal(S.markFloor('copy', 'k-oracle'), true);
    // With Pip's glow running, the Sorting Room's mistakes tick the glow only.
    S.start('pip', 0);
    assert.deepEqual(plain(S.forNode('k-sorting')), { scene: 'pip', floor: null });
});

test('the Copy never resolves early: full shows WAITING, ticks do nothing, drains work, tier read once', () => {
    const Rift = game();
    const S = Rift.Stakes;
    S.start('copy', 2);
    assert.equal(S.tick('copy', 2).outcome, null);        // a temptation: "Just this once" +2
    assert.equal(S.tick('copy', 1).outcome, null);        // "Let me hear them once more" +1
    assert.equal(S.danger('copy'), 5);
    const r = S.tick('copy', 5);
    assert.equal(r.outcome, 'hold');
    assert.equal(S.danger('copy'), 8);
    assert.equal(S.get('copy').done, false, 'still open: the Copy waits at the core');
    assert.equal(S.tick('copy', 1).filled, 0, 'further ticks do nothing');
    assert.deepEqual(plain(S.forNode('k-core')), { scene: 'copy', floor: null }, 'the trials still go on as a stakes scene');
    assert.equal(S.drain('copy', 1), 1, 'drains work on a full bar');
    assert.equal(S.danger('copy'), 7);
    assert.equal(Rift.State.flag('stakes.ch4'), undefined, 'no tier until trial 3 is won');
    assert.equal(S.def('copy').resolveOnWin, true, 'the encounter reads the tier when the core is won');
    assert.equal(S.resolve('copy'), 3, '7 of 8: at a price');
    assert.equal(Rift.State.flag('stakes.ch4'), 3);
    assert.equal(S.resolve('copy'), 3, 'read once: the stored tier comes back');
    // The tier bands: 0–3 clean, 4–5 close, 6–7 at a price, 8 too late.
    assert.deepEqual([0, 3, 4, 5, 6, 7, 8].map(n => S.tierOf('copy', n)), [1, 1, 2, 2, 3, 3, 4]);
});

test('the core trials are three old tricks, each a reused puzzle with new opts', () => {
    const Rift = loadRift(['js/core/rift.js', 'data/creatures.js', 'data/cases.js', 'data/map.js', 'js/puzzles/registry.js',
        'js/puzzles/village.js', 'js/puzzles/tribunal.js', 'js/puzzles/prediction.js']);
    const core = Rift.data.map.nodes['k-core'];
    assert.deepEqual(plain(core.puzzles.map(p => p.id)), ['village', 'tribunal', 'prediction']);
    assert.ok(core.puzzles.every(p => p.difficulty === 3));
    const [quill, mob, copy] = core.puzzles.map(p => ({ def: Rift.Puzzles.get(p.id), opts: p.opts }));

    // 1. Quill's hidden row: the Teacher is an imp, and the table hides the real world.
    for (let i = 0; i < 50; i++) {
        const data = quill.def.generate(Rift.makeRng('core1-' + i), 3, quill.opts);
        assert.ok(quill.def.solve(data).imps.includes('schoolteacher'));
        assert.ok(data.hiddenRow >= 0 && data.prefill);
        assert.equal(quill.def.check(data, quill.def.solve(data)).solved, true);
    }

    // 2. The mob's argument, aimed at you: a story case with your name and counts filled in.
    const o2 = Object.assign({ name: 'Ada', k: 7, n: 9 }, mob.opts);
    const data2 = mob.def.generate(Rift.makeRng('core2'), 3, o2);
    assert.equal(data2.caseId, 'core-mine');
    assert.equal(data2.witness.name, 'The Algorithm');
    const text = JSON.stringify(data2);
    assert.ok(!/\{\w+\}|undefined/.test(text), 'every placeholder filled');
    assert.match(text, /ADA FOLLOWED THE VOICE 7 TIMES OUT OF 9/);
    assert.equal(mob.def.check(data2, mob.def.solve(data2)).solved, true);
    assert.match(JSON.stringify(mob.def.generate(Rift.makeRng('c'), 3, Object.assign({ name: 'Bo', k: 1, n: 1 }, mob.opts))), /1 TIME OUT OF 1/);
    // Never rolled at an ordinary Tribunal station.
    for (let i = 0; i < 200; i++) assert.notEqual(mob.def.generate(Rift.makeRng('roll' + i), 3).caseId, 'core-mine');

    // 3. The Copy at prediction: it starts with your whole-game record and bets on your habit.
    const P = copy.def;
    const habit = P.generate(Rift.makeRng('core3'), 3, Object.assign({ followed: 8, offered: 10 }, copy.opts));
    assert.equal(habit.mode, 'core');
    assert.deepEqual(plain(habit.prior), [8, 2]);
    assert.equal(habit.options.length, 2);
    assert.equal(P.internals.predict(habit, []).guess, 0, 'it bets you follow your voice');
    const rebel = P.generate(Rift.makeRng('core3'), 3, Object.assign({ followed: 1, offered: 30 }, copy.opts));
    assert.deepEqual(plain(rebel.prior), [0, 10], 'scaled to at most 10 counts');
    assert.equal(P.internals.predict(rebel, []).guess, 1);
    assert.equal(P.check(habit, P.solve(habit)).solved, true, 'beatable by not doing what you usually do');
    assert.match(P.why(habit).question, /Copy/);
    assert.equal(habit.autoFirst, false);
    assert.equal(P.generate(Rift.makeRng('x'), 3, { mode: 'core', followed: 1, offered: 2, autoFirst: true }).autoFirst, true, '"Just this once"');
    // Ordinary Prediction Hall stations are unchanged.
    assert.deepEqual(P.generate(Rift.makeRng('same'), 2), P.generate(Rift.makeRng('same'), 2, {}));
    assert.equal(P.generate(Rift.makeRng('same'), 2).prior, undefined);
});
