import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWithDom } from './fake-dom.mjs';

function game(kind) {
    let screen, api;
    const modals = [], store = new Map(), routes = [];
    const g = loadWithDom([
        'js/core/rift.js', 'js/core/state.js', 'js/core/world.js', 'js/core/catch-net.js', 'js/core/catch-games.js', 'js/core/catch-session.js',
        'data/avatars.js', 'data/creatures.js', 'data/items.js', 'js/puzzles/registry.js', 'js/ui/catching.js',
        ctx => {
            const R = ctx.Rift;
            R.storage = () => ({ getItem: k => store.get(k) || null, setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k) });
            R.State.newGame();
            R.State.update(s => { s.avatar = { type: 'owlet', nickname: 'Test' }; s.tutorialsSeen.fake = true; s.flags['learning-hint:fake'] = true; });
            R.State.saveNow();
            R.data.map = { nodes: { test: { type: 'puzzle', chapter: 'prologue', links: [], name: 'Test', host: 'narrator', puzzles: [{ id: 'fake', difficulty: 1 }] } } };
            R.data.chapters = { prologue: {} }; R.data.speakers = { narrator: { name: 'Host', art: 'host' } }; R.data.script = {};
            R.Assets = { img: () => R.el('div') }; R.Audio = { sfx() {}, speak() {} }; R.Dialogue = { has: () => false };
            R.Router = { replace: route => routes.push(route) };
            R.UI = { hud: opts => R.el('div', {}, [opts.status]), toast() {}, modal(title, body, buttons) { const m = { title, body, buttons, close() {} }; modals.push(m); return m; } };
            R.Tutorial = {}; R.Screens = { register: (_, def) => { screen = def; } };
            R.Puzzles.register({ id: 'fake', name: 'Fake', colour: 'language', generate: () => ({}), check: () => ({ solved: true }), hints: () => [],
                mount(_, data, actions) { api = actions; return { pause() {}, destroy() {} }; } });
            R.World.rollLoot = () => ({ species: 'swiftlet' });
            R.CatchGames.pick = () => kind;
        }, 'js/screens/encounter.js',
    ]);
    let root, handle;
    function mount() {
        root = g.Rift.el('div'); g.document.body.append(root);
        handle = screen.mount(root, { nodeId: 'test' });
    }
    mount();
    const button = text => root.querySelectorAll('button').find(b => b.textContent === text);
    function move(action) {
        if (kind === 'net') { root.querySelector('[data-catch-key="cut-' + action.cut + '"]').click(); button('Cast net').click(); }
        else if (kind === 'ricochet') { root.querySelector('[data-catch-key="aim-' + action.aim + '"]').click(); button('Fire').click(); }
        else {
            const tile = root.querySelector('[data-catch-key="tile-' + action.cell + '"]');
            if (action.flag) tile.dispatchEvent({ type: 'keydown', key: 'f', preventDefault() {} }); else tile.click();
        }
    }
    return { ...g, modals, routes, button, move, submit: () => api.submit(true), root: () => root,
        reload() { handle.destroy(); root.remove(); g.Rift.State.load(); mount(); },
    };
}
for (const kind of ['net', 'ricochet', 'tracks']) test(`${kind}: real encounter resumes a paid game without revisits, puzzle rewards or another charge`, async () => {
    const g = game(kind), R = g.Rift;
    g.submit(); await g.modals.at(-1).buttons[0].onclick();
    const before = R.State.get(), xp = before.xp, items = before.items.charm, visits = before.map.visitCount.test;
    assert.equal(g.modals.at(-1).title, 'Solved!');
    g.modals.at(-1).buttons[0].onclick();
    assert.ok(g.button('Start · 1 charm'));
    g.button('Start · 1 charm').click();
    const plan = R.CatchGames.solve(R.CatchSession.get('test').board);
    const oldButton = g.button('Pause');
    g.reload(); oldButton.click();
    assert.equal(R.State.get().items.charm, items - 1);
    assert.equal(R.State.get().xp, xp); assert.equal(R.State.get().map.visitCount.test, visits);
    assert.equal(R.State.get().stats.puzzlesSolved, 1);
    assert.ok(g.button('Resume'));
    g.button('Resume').click();
    for (const action of plan) { if (R.CatchSession.get('test').receipt) break; g.move(action); }
    assert.equal(R.State.get().stats.catches, 1);
    assert.equal(R.State.get().creatures.length, 1);
    assert.match(g.root().textContent, /Caught!/);
    g.reload();
    assert.match(g.root().textContent, /Caught!/);
    assert.equal(R.State.get().stats.catches, 1); assert.equal(R.State.get().items.charm, items - 1);
    g.button('Back to the map').click();
    assert.equal(R.CatchSession.get('test').dismissed, true);
    assert.equal(g.routes.at(-1), 'map');
});
