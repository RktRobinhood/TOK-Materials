import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWithDom } from './fake-dom.mjs';

function setup(onEnd, opts = {}) {
    const screens = {};
    const g = loadWithDom(['js/core/rift.js', 'js/core/assets.js', 'data/creatures.js', 'data/axioms.js', 'data/tactics.js',
        ...(opts.avatar ? ['data/powers.js'] : []),
        'js/battle/abilities.js', 'js/battle/engine.js', 'js/battle/lesson.js',
        ctx => { ctx.Rift.Screens = { register: (n, d) => { screens[n] = d; }, get: n => screens[n] }; },
        'js/screens/battle.js', 'js/screens/battle-lesson.js']);
    const { Rift } = g;
    Rift.data.speakers = { granny: { name: 'Granny Axiom', art: 'npc/granny-axiom' } };
    if (opts.avatar) {
        Rift.data.avatars = { [opts.avatar.type]: { powers: { [opts.avatar.variant]: opts.power } } };
        Rift.State = { get: () => ({ avatar: opts.avatar }) };
    }
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
        case 'draw': {
            // The gold pointer lands on the picture button whose tooltip name is the step label.
            const b = $('.b-draw-btn[data-choice="' + expect.choice + '"]');
            assert.ok(b && b.classList.contains('guide-focus'), 'the gold pointer is on the ' + expect.choice + ' button');
            assert.match(b.querySelector('.guide-pointer').textContent, new RegExp(b.dataset.tip));
            click('.b-draw-btn[data-choice="' + expect.choice + '"]');
            break;
        }
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
        // An open step (the learner decides) speaks its hint later: the test's timer flush gets there.
        assert.equal(t.spoken.at(-1).text, step.open ? step.hint2 || step.hint : step.text);
        assert.equal(t.spoken.at(-1).voice, t.Rift.voiceId('granny', step.open ? step.hint2 || step.hint : step.text));
        if (step.compare) {
            // Same cards, different rule: under the basic rules Astrophysicat falls; under Underdog it is safe.
            const text = t.$('.b-compare').textContent;
            assert.match(text, /Normal rules: Astrophysicat 1 vs Shakirattle 3 → Astrophysicat is defeated/);
            assert.match(text, /Underdog: Astrophysicat 1 vs Shakirattle 3 → both survive/);
        }
        if (step.trap) {
            // The tempting wrong move (attacking under the reversed victory rule) is stopped and explained.
            const s0 = t.handle.state;
            perform(t, Object.assign({ cid: 'p0c1' }, step.trap.expect));
            assert.equal(t.handle.state, s0, 'step ' + i + ': the trap move is not made');
            assert.match(t.$('.b-note').textContent, /Careful/);
            assert.match(t.$('.b-reveal').textContent, /Granny wins/);
            assert.equal(t.spoken.at(-1).text, step.trap.say);
            for (let n = 0; n < 20 && t.g.timers.length; n++) t.g.timers.shift().fn();
            assert.equal(t.handle.step, i, 'the lesson stays on this step');
        }
        const before = t.handle.state.step;
        perform(t, step.expect);
        assert.equal(t.handle.state.step, before + 1, 'step ' + i + ': one move happens at once');
        const replies = step.replies || [];
        if (replies.length) {
            assert.equal(t.handle.busy, true, 'replies wait for a visible pause');
            const busyState = t.handle.state;
            t.$('.b-end').click();
            assert.equal(t.handle.state, busyState, 'controls do nothing during replies');
        }
        // Each narration line ({ say }) is shown in Granny's panel and spoken, in order, before
        // the next reply; run the timers one at a time to see each one.
        const says = [...replies.filter(r => !r.type).map(r => r.say)];
        const shown = [];
        for (let n = 0; n < 200 && t.g.timers.length; n++) {
            const say = t.$('.b-coach-say');
            if (say && shown.at(-1) !== say.textContent) shown.push(say.textContent);
            t.g.timers.shift().fn();
        }
        assert.deepEqual(shown, says, 'step ' + i + ': narration lines');
        says.forEach(line => assert.ok(t.spoken.some(x => x.text === line && x.speaker === 'granny'), 'spoken: ' + line));
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
    t.root.querySelectorAll('button').find(b => b.getAttribute('aria-label') === 'Hear this step again').click();
    assert.equal(t.spoken.length, n + 1);
    assert.equal(t.spoken.at(-1).speaker, 'granny');
    t.root.querySelectorAll('button').find(b => b.getAttribute('aria-label') === 'Leave lesson').click();
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
    t.root.querySelectorAll('button').find(b => b.getAttribute('aria-label') === 'Leave lesson').click();
    assert.equal(won, false);
    t.handle.destroy();
    t.g.flush();
    assert.equal(t.handle.state, state);
});

test('a narration line waits for Granny\'s voice to finish (and a reading pause) before the lesson goes on', async () => {
    const t = setup(() => {});
    const L = t.Rift.Battle.Lesson;
    assert.ok(!L.steps[1].replies[0].type && L.steps[1].replies[0].say, 'step 2 replies with a narration line');
    let done = null;
    const said = [];
    t.Rift.Audio.speak = l => { said.push(l.text); return new Promise(res => { done = res; }); };
    perform(t, L.steps[0].expect);
    t.g.flush();
    perform(t, L.steps[1].expect);
    assert.equal(t.handle.busy, true);
    assert.equal(t.$('.b-coach-say').textContent, L.steps[1].replies[0].say);
    assert.equal(said.at(-1), L.steps[1].replies[0].say);
    // The reading pause passes, but the voice is still speaking: wait (the 12 s safety cap aside).
    const run = () => { for (let n = 0; n < 50; n++) { const i = t.g.timers.findIndex(x => x.ms < 12000); if (i < 0) break; t.g.timers.splice(i, 1)[0].fn(); } };
    run();
    assert.equal(t.handle.step, 1, 'still waiting for the voice');
    assert.equal(t.handle.busy, true);
    done();
    await new Promise(r => setImmediate(r));
    run();
    assert.equal(t.handle.step, 2, 'the voice ended: the next step starts');
    assert.equal(t.handle.busy, false);
    assert.equal(t.$('.b-coach-say'), null);
    t.handle.destroy();
});

test('the instruction bar repeats each step\'s "Do this"; Guard explains a wrong target', () => {
    const t = setup(() => {});
    const L = t.Rift.Battle.Lesson;
    L.steps.forEach((step, i) => {
        const ask = t.$('.b-prompt .b-ask');
        if (ask && step.expect.type !== 'draw') assert.match(ask.textContent, new RegExp('^Do this: ' + step.label.replace(/[()]/g, '\$&') + '\.'), 'step ' + i);
        assert.ok(!/onto your side to play it/.test(t.$('.b-prompt').textContent), 'step ' + i + ': no generic hint that contradicts Granny');
        if (step.title === 'Guard comes first') {
            // The step's attacker, aimed at the hero instead of the Guard: the note says why.
            const att = step.expect.cid;
            assert.equal(step.expect.target, 'p1c0');
            t.$('.my-board [data-cid="' + att + '"]').click();
            t.$('.b-hero[data-target="h1"]').click();
            assert.match(t.$('.b-note').textContent, /Khaby Llame has Guard\. Attack it first\./);
            t.$('.my-board [data-cid="' + att + '"]').click();
            // A creature that is not part of this step: follow the gold pointer.
            t.$('.my-board [data-cid="p0c0"]').click();
            assert.match(t.$('.b-note').textContent, /Follow the gold pointer/);
        }
        perform(t, step.expect);
        t.g.flush();
    });
    assert.match(t.$('.b-overlay').textContent, /the same attack can win or lose/);
});

test('"Your turn" follows the lesson: no "choose your draw" when Granny\'s script draws for you', () => {
    const t = setup(() => {});
    const L = t.Rift.Battle.Lesson;
    assert.match(t.$('.b-banner').textContent, /Your turn.*Do this: Draw from your deck\./);
    // Steps 1-3; step 3's replies end with a narration line, so the banner gives no instruction yet.
    for (let i = 0; i < 3; i++) { perform(t, L.steps[i].expect); t.g.flush(); }
    assert.match(t.$('.b-banner').textContent, /^Your turn$/);
    t.handle.destroy();
});

test('lesson picture buttons have names: each draw step label is the tooltip name of the button it points at', () => {
    const t = setup();
    const L = t.Rift.Battle.Lesson;
    const draws = L.steps.filter(s => s.expect.type === 'draw');
    // Time draws are off by default, so the lesson only draws from the deck (Fate is bent by Kim's Filter).
    assert.ok(draws.length >= 3);
    const tipNames = { deck: 'Draw from your deck', axiom: 'Take a rule card' };
    draws.forEach(s => assert.equal(s.label, tipNames[s.expect.choice], s.title));
    assert.equal(t.$('.b-draw-btn[data-choice="deck"]').dataset.tip, L.steps[0].label);
    assert.equal(t.root.querySelectorAll('.b-draw-btn').length, 2);
    t.root.querySelectorAll('.b-ibtn').forEach(b => {
        assert.ok(b.getAttribute('aria-label'), 'every picture button has a name');
        assert.ok(b.dataset.tip, 'and a tooltip');
    });
    const coach = t.root.querySelectorAll('.b-coach .b-ibtn').map(b => b.getAttribute('aria-label'));
    assert.deepEqual(coach, ['Hear this step again', 'Leave lesson']);
    t.handle.destroy();
});

test('with an avatar power, Granny adds "Your power": the pointer is on the button, clicking it moves on, no move is made', () => {
    let won = null;
    const t = setup(value => { won = value; }, { avatar: { type: 'fox', variant: 'girl' }, power: 'lantern' });
    const L = t.Rift.Battle.Lesson;
    const steps = L.guide({ id: 'lantern', tweaks: [] }).steps;
    assert.equal(steps.length, L.steps.length + 1);
    assert.equal(L.guide(null).steps, L.steps, 'no power: the lesson is unchanged');
    assert.equal(t.handle.state.players[0].power.id, 'lantern');
    steps.forEach((step, i) => {
        assert.equal(t.handle.step, i);
        assert.match(t.$('.b-coach').textContent, new RegExp('Step ' + (i + 1) + ' of ' + steps.length));
        if (step.info) {
            assert.ok(t.$('.b-power.mine').classList.contains('guide-focus'), 'the gold pointer is on the power button');
            assert.match(t.$('.b-power.mine .guide-pointer').textContent, /Click your power/);
            assert.equal(t.$('.b-coach-ok'), null, 'no Got it button: the pointer flow goes on');
            assert.equal(t.spoken.at(-1).text, step.text);
            const before = t.handle.state;
            t.$('.b-power.mine').click();
            assert.equal(t.handle.state, before, 'the power is not used in the lesson');
            assert.equal(t.handle.step, i + 1, 'the click moves the lesson on');
            return;
        }
        perform(t, step.expect);
        for (let n = 0; n < 200 && t.g.timers.length; n++) t.g.timers.shift().fn();
    });
    assert.equal(t.Rift.Battle.Engine.winner(t.handle.state), 0, 'still a win');
    t.root.querySelectorAll('button').find(b => b.textContent === 'Finish lesson').click();
    assert.equal(won, true);
});
