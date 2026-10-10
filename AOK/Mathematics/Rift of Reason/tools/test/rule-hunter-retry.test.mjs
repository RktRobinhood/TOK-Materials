// Wrong checked answers must permit a local retry without resetting experiments (#69).
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWithDom } from './fake-dom.mjs';

const plain = value => JSON.parse(JSON.stringify(value));
const drain = async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); };

function setup(mode, submit) {
    const g = loadWithDom(['js/core/rift.js', 'js/puzzles/registry.js', 'js/puzzles/rule-hunter.js']);
    g.ctx.removeEventListener = () => {};
    const def = g.Rift.Puzzles.get('rule-hunter');
    const data = mode === 'rules' ? {
        mode: 'rules', difficulty: 2, gatekeeper: 'siuuugull', max: 30, secret: 'all-mult-3',
        example: [3, 6, 9], correct: 0,
        candidates: ['all-mult-3', 'last-largest', 'ascending', 'all-different'].map(id => ({ id, text: def.lib.RULE[id].text })),
    } : def.generate(g.Rift.makeRng('reflection-retry'), 3, { mode: 'pattern', sequence: 'moser' });
    const root = g.document.createElement('div');
    g.document.body.appendChild(root);
    const answers = [];
    const handle = def.mount(root, data, { submit(answer) {
        answers.push(plain(answer));
        return submit ? submit(answer, def, data) : def.check(data, answer);
    } });
    const $ = selector => root.querySelector(selector);
    const $$ = selector => root.querySelectorAll(selector);
    const button = label => $$('button').find(n => n.textContent === label);
    function experiment(triple) {
        triple.forEach(n => $$('.rh-src').find(tile => tile.textContent === String(n)).dispatchEvent({ type: 'click', detail: 0 }));
        $('.rh-test').click();
    }
    function name(index) {
        $('.rh-name-btn').click();
        $$('.rh-cand')[index].click();
        button('This is the rule').click();
    }
    const reflect = index => $$('.rh-planks.col .rh-plank')[index].click();
    return { g, def, data, root, answers, handle, $, $$, button, experiment, name, reflect };
}

test('ordinary rules preserve experiments across wrong answers and lock only after success', async context => {
    const t = setup('rules');
    context.after(() => t.handle.destroy());
    t.experiment([10, 20, 30]);
    assert.equal(t.$$('.rh-log-row').length, 1);
    assert.match(t.$('.rh-log-row').textContent, /doesn.t fit/);
    t.name(1);
    await drain();
    assert.equal(t.answers.length, 1);
    assert.ok(t.$('.rh-result.lose'));
    assert.ok(t.button('Try again'), 'failed answers must offer a local retry');
    const firstRetry = t.button('Try again');
    firstRetry.click();
    assert.doesNotThrow(() => firstRetry.click(), 'repeated retry is harmless');
    assert.equal(t.answers.length, 1, 'retry itself must not submit another check');
    assert.equal(t.$('.rh-name-btn').disabled, false);
    assert.equal(t.button('Clear').disabled, false);
    assert.equal(t.$$('.rh-log-row').length, 1, 'the useful failed experiment stays');
    assert.equal(t.$$('.rh-result').length, 0);
    t.experiment([3, 6, 12]);
    t.name(2);
    await drain();
    assert.equal(t.$$('.rh-result').length, 1, 'repeated failure replaces feedback');
    firstRetry.click();
    assert.ok(t.$('.rh-result.lose'), 'a stale retry cannot remove newer feedback');
    t.button('Try again').click();
    t.name(t.data.correct);
    await drain();
    assert.equal(t.answers.length, 3);
    assert.deepEqual(t.answers[2].tests, [[10, 20, 30], [3, 6, 12]]);
    assert.ok(t.$('.rh-result.win'));
    firstRetry.click();
    assert.ok(t.$('.rh-result.win'), 'a stale retry cannot remove success feedback');
    assert.equal(t.$('.rh-name-btn').disabled, true);
    assert.equal(t.button('Clear').disabled, true);
    assert.equal(t.$('.rh-test').disabled, true);
    assert.equal(t.button('Try again'), undefined);
    t.$('.rh-name-btn').click();
    assert.equal(t.answers.length, 3);
});

test('Pattern Breaker can retry reflection while keeping its original prediction and reveal', async context => {
    const t = setup('pattern');
    context.after(() => t.handle.destroy());
    const prediction = t.data.naive;
    t.$$('.rh-step .rh-plank')[prediction].click();
    const wrong = (t.data.lesson.correct + 1) % t.data.lesson.options.length;
    t.reflect(wrong);
    await drain();
    assert.equal(t.answers.length, 1);
    assert.ok(t.$('.rh-result.lose'));
    assert.ok(t.button('Try again'), 'a wrong reflection must offer a local retry');
    const firstRetry = t.button('Try again');
    firstRetry.click();
    assert.doesNotThrow(() => firstRetry.click());
    assert.equal(t.answers.length, 1);
    assert.equal(t.$('.rh-mystery .rh-tile').textContent, t.data.reveal.value);
    assert.equal(t.$$('.rh-step .rh-plank').slice(0, t.data.options.length).every(b => b.disabled), true);
    assert.equal(t.$$('.rh-planks.col .rh-plank').every(b => !b.disabled), true);
    t.reflect(wrong);
    await drain();
    assert.equal(t.$$('.rh-result').length, 1);
    firstRetry.click();
    assert.ok(t.$('.rh-result.lose'));
    t.button('Try again').click();
    t.reflect(t.data.lesson.correct);
    await drain();
    assert.equal(t.answers.length, 3);
    assert.deepEqual(t.answers[2], { predict: prediction, lesson: t.data.lesson.correct });
    assert.ok(t.$('.rh-result.win'), 'the reflection, rather than the prediction, determines success');
    firstRetry.click();
    assert.ok(t.$('.rh-result.win'));
    assert.equal(t.$$('.rh-planks.col .rh-plank').every(b => b.disabled), true);
    assert.equal(t.button('Try again'), undefined);
    t.reflect(wrong);
    assert.equal(t.answers.length, 3);
});

for (const mode of ['rules', 'pattern']) {
    test(mode + ' blocks duplicate checked answers until submission settles', async context => {
        let resolve;
        const t = setup(mode, () => new Promise(done => { resolve = done; }));
        context.after(() => t.handle.destroy());
        if (mode === 'rules') {
            t.$('.rh-name-btn').click();
            t.$$('.rh-cand')[1].click();
            const confirm = t.button('This is the rule');
            confirm.click();
            confirm.click();
        } else {
            t.$$('.rh-step .rh-plank')[t.data.correct].click();
            t.reflect((t.data.lesson.correct + 1) % t.data.lesson.options.length);
            t.reflect(t.data.lesson.correct);
        }
        assert.equal(t.answers.length, 1);
        resolve(t.def.check(t.data, t.answers[0]));
        await drain();
        assert.ok(t.button('Try again'));
        t.button('Try again').click();
        assert.equal(t.answers.length, 1);
    });
}
