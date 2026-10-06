import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';

const Rift = loadRift(['js/core/rift.js', 'data/creatures.js', 'data/axioms.js', 'data/tactics.js', 'js/battle/abilities.js', 'js/battle/engine.js', 'js/battle/lesson.js']);
const E = Rift.Battle.Engine, L = Rift.Battle.Lesson;
const matches = expect => a => Object.keys(expect).every(k => a[k] === expect[k]);

// Replays the lesson; before(i, state) runs before step i.
function replay(before) {
    let s = L.create();
    L.steps.forEach((step, i) => {
        if (before) before(i, s);
        [step.expect].concat(step.replies || []).forEach((action, k) => {
            const legal = E.legalActions(s).filter(matches(action));
            assert.equal(legal.length, 1, 'step ' + i + (k ? ' reply ' + k : ' expect') + ' ' + JSON.stringify(action) + ' must match exactly one legal action');
            assert.equal(E.winner(s), null, 'no winner before step ' + i);
            s = E.applyAction(s, legal[0]);
        });
    });
    return s;
}

test('every step and reply is legal in the real engine and the learner wins by the current rules', () => {
    const end = replay();
    assert.equal(E.winner(end), 0);
    assert.equal(end.endReason, 'hearts');
    assert.equal(end.options.mode, 'practice');
    assert.equal(Object.keys(end.axioms.active).length, 0, 'the Fate reset cleared every rule');
    assert.ok(L.steps.length >= 14 && L.steps.length <= 17);
    assert.ok(L.steps.every(s => s.title && s.text && s.label && s.expect && s.text.length < 260));
});

test('the lesson is deterministic and advance() replays one step at a time', () => {
    assert.equal(JSON.stringify(L.create()), JSON.stringify(L.create()));
    let s = L.create();
    for (let i = 0; i < L.steps.length; i++) s = L.advance(s, i);
    assert.equal(E.winner(s), 0);
    assert.throws(() => L.advance(L.create(), 99));
});

test('the steps teach what the design asks for', () => {
    const seen = {};
    replay((i, s) => {
        const step = L.steps[i];
        if (i === 0) { seen.draw = s.phase === 'draw' && E.drawChoices(s).includes('deck'); seen.hearts = s.players[0].hearts === 6; }
        if (step.expect.type === 'attack' && step.expect.target === 'p1c1') seen.guard = E.attackTargets(s, step.expect.cid).join() === 'p1c1' && E.keywordsOf(s, 'p1c1').includes('guard');
        if (i === 5) seen.damageStays = s.cards.p0c0.damage === 1 && s.cards.p1c0.damage === 1;
        if (step.expect.type === 'activate') seen.activate = true;
        if (step.expect.type === 'play' && step.expect.target && s.cards[step.expect.cid].kind === 'creature') seen.entrance = !!E.entranceOf(s, s.cards[step.expect.cid]).target;
        if (step.expect.type === 'play' && s.cards[step.expect.cid].kind === 'tactic') seen.tactic = s.cards[step.expect.cid].tactic;
        if (step.expect.type === 'axiom') {
            const pv = E.fightPreview(s, 'p0c1', 'p1c2');
            const under = E.fightPreview({ ...s, axioms: { ...s.axioms, active: { ...s.axioms.active, combat: 'underdog' } } }, 'p0c1', 'p1c2');
            seen.underdog = pv.attackerDefeated && pv.defenderDefeated && !under.attackerDefeated && under.defenderDefeated;
        }
        if (step.expect.type === 'draw' && step.expect.choice === 'forward') { seen.reversed = E.rules(s).reverseHearts; seen.reset = E.timeline(s)[0].type === 'reset' && E.timeline(s)[0].turns === 2; }
        if (i === 12) seen.lastWord = s.players[0].hand.includes('p0c2') && s.cards.p0c2.metaverseUsed;
    });
    assert.deepEqual({ ...seen }, { draw: true, hearts: true, guard: true, damageStays: true, activate: true, entrance: true, tactic: 'counterexample', underdog: true, reversed: true, reset: true, lastWord: true });
});

test('starter() still lends ten loaned creatures and team() builds instances', () => {
    const team = L.starter();
    assert.equal(team.length, 10);
    assert.ok(team.every(c => c.loaner && Rift.data.creatures[c.species]));
    assert.equal(L.team(['eelish'], 'x-')[0].uid, 'x-0');
    assert.equal(L.guide().steps, L.steps);
});
