import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWithDom } from './fake-dom.mjs';

// Exercise the mounted Tower and the encounter's real check/hint accounting.
function game() {
    let screen, state, data, generated = 0, checked = 0;
    const modals = [], routes = [];
    const g = loadWithDom([
        'js/core/rift.js', 'js/core/state.js', 'js/core/world.js',
        'data/avatars.js', 'data/items.js', 'data/creatures.js',
        'js/puzzles/registry.js', 'js/puzzles/tower.js',
        ctx => {
            const R = ctx.Rift;
            state = R.State.freshState();
            state.avatar = { type: 'owlet', nickname: 'Test' };
            state.tutorialsSeen.tower = true;
            state.flags['heart-rules-seen'] = true;
            R.State.get = () => state;
            R.State.save = () => {};
            R.State.update = fn => fn(state);
            R.data.map = { nodes: { test: {
                type: 'puzzle', chapter: 'prologue', links: [], name: 'Tower test',
                puzzles: [{ id: 'tower', difficulty: 1 }], host: 'narrator',
            } } };
            R.data.chapters = { prologue: {} };
            R.data.speakers = { narrator: { name: 'Host', art: 'host' } };
            R.data.script = {};
            R.Assets = { img: () => R.el('div') };
            R.Audio = { sfx() {}, speak() {} };
            R.Dialogue = { has: () => false };
            R.Router = { replace: route => routes.push(route) };
            R.UI = {
                hud: opts => R.el('div', {}, [opts.status]), toast() {},
                modal(title, body, buttons) {
                    const m = { title, body, buttons, close() {} };
                    modals.push(m);
                    return m;
                },
            };
            R.Tutorial = {};
            R.Screens = { register: (_, def) => { screen = def; } };
            R.World.rollLoot = () => ({ species: null });
            const def = R.Puzzles.get('tower');
            data = def.generate(R.makeRng('tower-retry'), 1);
            def.generate = () => { generated++; return data; };
            const check = def.check;
            def.check = (...args) => { checked++; return check(...args); };
        },
        'js/screens/encounter.js',
    ]);
    const root = g.Rift.el('div');
    g.document.body.appendChild(root);
    const handle = screen.mount(root, { nodeId: 'test' });
    const def = g.Rift.Puzzles.get('tower');
    return { ...g, root, handle, def, data, state, modals, routes,
        generated: () => generated, checked: () => checked };
}

function clickNext(g, label) {
    const button = g.$('.tw-next');
    assert.ok(button, `Missing Tower control: ${label}`);
    assert.equal(button.textContent, label);
    button.click();
    g.flush();
}

function answerPath(g, path) {
    path.forEach((id, qi) => {
        const answerIx = g.data.questions[qi].answers.findIndex(a => a.id === id);
        const button = g.$$('.tw-answer')[answerIx];
        assert.ok(button, `Missing answer control for question ${qi + 1}`);
        assert.equal(button.disabled, false);
        button.click();
        g.flush();
        if (qi < path.length - 1) clickNext(g, 'Next question ›');
    });
}

function collapse(g) {
    const I = g.def._internal, state = I.newState(g.data);
    // Seek contradictions using the actual facts, rather than hard-code labels.
    while (!state.done) {
        const q = g.data.questions[state.qi];
        const lits = I.blockLits(state.blocks.filter(b => b.standing));
        const answer = q.answers.find(a => !I.sat(I.compile(g.data), lits.concat(a.lits))) || q.answers[0];
        I.step(g.data, state, answer.id);
    }
    assert.equal(state.lost, true, 'The pinned story must really collapse');
    assert.ok(state.qi < g.data.questions.length, 'Collapse occurs before the last question');
    answerPath(g, state.chosen);
    clickNext(g, 'Face the Constable ›');
}

function retry(g) {
    const checked = g.checked(), health = g.state.health, generated = g.generated();
    const checks = g.$('.enc-checks').textContent;
    clickNext(g, 'Try again');
    assert.equal(g.checked(), checked, 'Retry itself must not submit a check');
    assert.equal(g.state.health, health, 'Retry itself must not charge hearts');
    assert.equal(g.$('.enc-checks').textContent, checks, 'Retry keeps the remaining free checks');
    assert.equal(g.generated(), generated, 'Retry keeps this encounter and its generated story');
    assert.equal(g.$('.tw').classList.contains('failed'), false);
    assert.equal(g.$$('.tw-block').length, g.data.base.length);
    assert.ok(g.$$('.tw-block').every(b => b.dataset.status === 'base'));
    assert.match(g.$('.tw-stats').textContent, /Rubble 0 \//);
    assert.equal(g.$('.tw-progress').children[0].dataset.s, 'now');
    assert.equal(g.$$('.tw-ghost').length, 0);
}

function hint(g) {
    const button = g.$$('button').find(b => b.textContent.startsWith('💡 Hint'));
    assert.ok(button);
    button.click();
}

test('Tower collapse can retry and complete in the same encounter, preserving hints and the failed check', async () => {
    const g = game();
    hint(g);
    assert.equal(g.state.health, 4);
    clickNext(g, 'Begin the questioning ›');
    collapse(g);
    assert.equal(g.checked(), 1);
    assert.match(g.$('.enc-checks').textContent, /●●○/);
    assert.equal(g.state.health, 4);
    assert.equal(g.state.stats.puzzlesSolved, 0);
    retry(g);
    hint(g);
    assert.equal(g.state.health, 3);
    assert.equal(g.state.stats.hintsUsed, 2);
    assert.ok(g.$('.enc-feedback').textContent.includes(g.def.hints(g.data)[1]), 'Retry advances to the next hint');
    answerPath(g, g.def.solve(g.data));
    clickNext(g, 'Finish ›');
    assert.equal(g.checked(), 2);
    assert.equal(g.state.stats.puzzlesSolved, 1);
    assert.equal(g.state.health, 3);
    assert.match(g.$('.enc-checks').textContent, /●●○/);
    assert.equal(g.modals.at(-1).title, 'Stage solved!');
    await g.modals.at(-1).buttons[0].onclick();
    assert.equal(g.modals.at(-1).title, 'Solved!');
    assert.equal(g.modals.at(-1).body.querySelector('.enc-stars').textContent, '★☆☆ · 1 wrong checks · 2 hints');
    assert.deepEqual(Array.from(g.state.map.completed), ['test']);
    assert.deepEqual(g.routes, [], 'No map travel was needed to recover');
    g.handle.destroy();
});

test('repeated Tower retries exhaust free checks and charge only genuinely failed submissions', async () => {
    const g = game();
    clickNext(g, 'Begin the questioning ›');
    for (let wrong = 1; wrong <= 4; wrong++) {
        collapse(g);
        assert.equal(g.checked(), wrong);
        assert.equal(g.state.health, wrong <= 3 ? 5 : 4);
        retry(g);
    }
    assert.match(g.$('.enc-checks').textContent, /○○○/);
    answerPath(g, g.def.solve(g.data));
    clickNext(g, 'Finish ›');
    assert.equal(g.state.health, 4, 'The successful check stays free');
    await g.modals.at(-1).buttons[0].onclick();
    assert.equal(g.modals.at(-1).body.querySelector('.enc-stars').textContent, '★☆☆ · 4 wrong checks · 0 hints');
    assert.deepEqual(g.routes, []);
    g.handle.destroy();
});
