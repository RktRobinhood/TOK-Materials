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
        [step.expect].concat((step.replies || []).filter(r => r.type)).forEach((action, k) => {
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
    assert.ok(L.steps.length >= 18 && L.steps.length <= 24);
    assert.ok(L.steps.every(s => s.title && s.text && s.label && s.expect && s.text.length < 260));
});

test('the lesson is deterministic and advance() replays one step at a time', () => {
    assert.equal(JSON.stringify(L.create()), JSON.stringify(L.create()));
    let s = L.create();
    for (let i = 0; i < L.steps.length; i++) s = L.advance(s, i);
    assert.equal(E.winner(s), 0);
    assert.throws(() => L.advance(L.create(), 99));
});

test('the steps teach what the design asks for, in a sensible order', () => {
    const seen = { creatureOnlyWhenNeeded: true };
    replay((i, s) => {
        const step = L.steps[i];
        const x = step.expect;
        if (i === 0) { seen.draw = s.phase === 'draw' && E.drawChoices(s).includes('deck'); seen.hearts = s.players[0].hearts === 6; }
        // The teacher's playtest: never attack a creature while the hero is open, unless the step
        // shows a rule at work (compare).
        if (x.type === 'attack' && x.target !== 'h1' && E.attackTargets(s, x.cid).includes('h1') && !step.compare) seen.creatureOnlyWhenNeeded = false;
        if (x.type === 'attack' && x.target === 'h1' && !seen.face) seen.face = s.players[1].board.length === 0;
        if (x.type === 'attack' && x.target === 'p1c0' && !seen.guard) seen.guard = E.attackTargets(s, x.cid).join() === 'p1c0' && E.keywordsOf(s, 'p1c0').includes('guard');
        if (seen.guard && seen.damageStays == null && x.type === 'play' && x.target === 'p1c0') seen.damageStays = s.cards.p0c1.damage === 1 && s.cards.p1c0.damage === 1;
        if (x.type === 'play' && x.target && s.cards[x.cid].kind === 'creature') seen.entrance = !!E.entranceOf(s, s.cards[x.cid]).target;
        if (x.type === 'play' && s.cards[x.cid].kind === 'tactic') seen.tactic = s.cards[x.cid].tactic;
        if (x.type === 'axiom') {
            const pv = E.fightPreview(s, 'p0c1', 'p1c1');
            const under = E.fightPreview({ ...s, axioms: { ...s.axioms, active: { ...s.axioms.active, combat: 'underdog' } } }, 'p0c1', 'p1c1');
            seen.underdog = pv.attackerDefeated && !under.attackerDefeated;
        }
        if (x.type === 'activate') { seen.reversed = E.rules(s).reverseHearts; seen.reset = E.timeline(s)[0].type === 'reset' && E.timeline(s)[0].turns === 2; }
    });
    assert.deepEqual({ ...seen }, { creatureOnlyWhenNeeded: true, draw: true, hearts: true, face: true, guard: true, damageStays: true, entrance: true, tactic: 'counterexample', underdog: true, reversed: true, reset: true });
});

test('no early win: until the final steps the learner can never take all of Granny\'s hearts in one turn', () => {
    const last = L.steps.length - 2;   // the two winning attacks
    replay((i, s) => {
        if (i >= last || s.active !== 0 || s.phase !== 'main' || E.rules(s).reverseHearts) return;
        const r = E.rules(s);
        const hits = s.players[0].board.filter(cid => E.canAttack(s, cid) && E.attackTargets(s, cid).includes('h1'))
            .map(cid => Math.min(E.attackOf(s, cid), r.heroDamageCap == null ? Infinity : r.heroDamageCap));
        const total = hits.reduce((n, x) => n + x, 0);
        assert.ok(total < s.players[1].hearts, 'step ' + i + ': ' + total + ' damage could beat Granny (' + s.players[1].hearts + ' hearts)');
    });
});

test('narration lines are short and only between replies', () => {
    L.steps.forEach(step => (step.replies || []).forEach(r => {
        if (!r.type) assert.ok(r.say && r.say.length < 140, 'a say line: ' + JSON.stringify(r));
    }));
    assert.ok(L.steps.some(step => (step.replies || []).some(r => r.say)));
});

test('starter() still lends ten loaned creatures and team() builds instances', () => {
    const team = L.starter();
    assert.equal(team.length, 10);
    assert.ok(team.every(c => c.loaner && Rift.data.creatures[c.species]));
    assert.equal(L.team(['eelish'], 'x-')[0].uid, 'x-0');
    assert.equal(L.guide().steps, L.steps);
});
