import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWithDom } from './fake-dom.mjs';

function setup(onEnd) {
    const screens = {};
    const g = loadWithDom(['js/core/rift.js', 'js/core/assets.js', 'data/creatures.js', 'data/axioms.js', 'data/tactics.js',
        'js/battle/abilities.js', 'js/battle/engine.js', 'js/battle/lesson.js',
        ctx => { ctx.Rift.Screens = { register: (n, d) => { screens[n] = d; }, get: n => screens[n] }; },
        'js/screens/battle.js', 'js/screens/battle-lesson.js']);
    const { Rift } = g;
    Rift.data.speakers = { granny: { name: 'Granny Axiom', art: 'npc/granny-axiom' } };
    Rift.Battle.AI = { choose() { throw new Error('the guided lesson never asks the AI'); } };
    const spoken = [];
    let stops = 0;
    Rift.Audio = { speak: l => spoken.push(l), stopVoice: () => { stops++; }, sfx() {} };
    const routes = [];
    Rift.Router = { replace: name => routes.push(name) };
    const root = g.document.createElement('div');
    g.document.body.appendChild(root);
    const handle = screens['battle-lesson'].mount(root, onEnd === undefined ? { onEnd: () => {} } : onEnd ? { onEnd } : {});
    return { g, Rift, root, handle, spoken, routes, stops: () => stops, $: s => root.querySelector(s) };
}

// Performs a step's expected action the way a learner would, by clicking (click-click).
function perform(t, expect) {
    const { $ } = t;
    const click = sel => { const n = $(sel); assert.ok(n, 'missing ' + sel); n.click(); };
    switch (expect.type) {
        case 'draw': click('.b-draw-btn[data-choice="' + expect.choice + '"]'); break;
        case 'end': click('.b-end'); break;
        case 'play':
            click('.b-hand [data-cid="' + expect.cid + '"]');
            if (expect.target) {
                assert.ok($('[data-target="' + expect.target + '"]').classList.contains('guide-focus'), 'the gold pointer moves to the target');
                click('[data-target="' + expect.target + '"]');
            } else click('.b-prompt .btn.primary');
            break;
        case 'attack':
            click('.my-board [data-cid="' + expect.cid + '"]');
            click('[data-target="' + expect.target + '"]');
            break;
        case 'activate':
            click('.my-board [data-cid="' + expect.cid + '"]');
            assert.ok($('.b-prompt .btn.gold').classList.contains('guide-focus'));
            click('.b-prompt .btn.gold');
            if (expect.target) click('[data-target="' + expect.target + '"]');
            break;
        case 'axiom':
            click('.b-hand [data-axiom="' + expect.choice + '"]');
            click('.b-prompt .btn.primary');
            break;
        default: throw new Error('unknown step type ' + expect.type);
    }
}

test('the guided lesson runs on the real battle screen, step by step, to a win', () => {
    let won = null;
    const t = setup(value => { won = value; });
    const L = t.Rift.Battle.Lesson, E = t.Rift.Battle.Engine;
    L.steps.forEach((step, i) => {
        assert.equal(t.handle.step, i);
        assert.match(t.$('.b-coach').textContent, new RegExp('Step ' + (i + 1) + ' of ' + L.steps.length));
        assert.ok(t.root.querySelector('.guide-focus'), 'step ' + i + ' highlights something');
        assert.equal(t.spoken.at(-1).text, step.text);
        assert.equal(t.spoken.at(-1).voice, t.Rift.voiceId('granny', step.text));
        if (step.compare) {
            const text = t.$('.b-compare').textContent;
            assert.match(text, /Normal rules: Astrophysicat 1 vs Shakirattle 3 → both are defeated/);
            assert.match(text, /Underdog: Astrophysicat 1 vs Shakirattle 3 → Shakirattle is defeated/);
        }
        const before = t.handle.state.step;
        perform(t, step.expect);
        assert.equal(t.handle.state.step, before + 1, 'step ' + i + ': one move happens at once');
        if ((step.replies || []).length) {
            assert.equal(t.handle.busy, true, 'replies wait for a visible pause');
            const busyState = t.handle.state;
            t.$('.b-end').click();
            assert.equal(t.handle.state, busyState, 'controls do nothing during replies');
        }
        t.g.flush();
    });
    assert.equal(E.winner(t.handle.state), 0);
    assert.match(t.$('.b-overlay').textContent, new RegExp('Real matches start with ' + E.DEFAULTS.hearts + ' hearts each'));
    const finish = t.root.querySelectorAll('button').find(b => b.textContent === 'Finish lesson');
    assert.ok(finish);
    finish.click();
    assert.equal(won, true);
});

test('Hear this step again repeats Granny; without onEnd the lesson returns to the Collection', () => {
    const t = setup(null);
    const n = t.spoken.length;
    t.root.querySelectorAll('button').find(b => b.textContent === 'Hear this step again').click();
    assert.equal(t.spoken.length, n + 1);
    assert.equal(t.spoken.at(-1).speaker, 'granny');
    t.root.querySelectorAll('button').find(b => b.textContent === 'Leave lesson').click();
    assert.deepEqual([...t.routes], ['collection']);
    assert.ok(t.stops() >= 1, 'leaving stops the voice');
});

test('leaving during replies cancels them and never completes the lesson', () => {
    let won = null;
    const t = setup(value => { won = value; });
    t.$('.b-draw-btn[data-choice="deck"]').click();
    t.$('.b-hand [data-cid="p0c0"]').click();
    t.$('.b-prompt .btn.primary').click();
    t.$('.b-end').click();
    assert.ok(t.g.timers.length > 0);
    const state = t.handle.state;
    t.root.querySelectorAll('button').find(b => b.textContent === 'Leave lesson').click();
    assert.equal(won, false);
    t.handle.destroy();
    t.g.flush();
    assert.equal(t.handle.state, state);
});
