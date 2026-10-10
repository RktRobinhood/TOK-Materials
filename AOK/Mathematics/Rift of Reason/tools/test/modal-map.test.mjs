// Replay confirmation dismissal must settle the answer and release map navigation (#86).
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWithDom } from './fake-dom.mjs';

const drain = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };

function setup(map = false) {
    const g = loadWithDom(['js/core/rift.js', 'js/ui/ui.js']);
    const { Rift } = g;
    Rift.Audio = { sfx() {} };
    const overlay = g.document.createElement('div');
    overlay.setAttribute('id', 'overlay');
    g.document.body.appendChild(overlay);
    const button = label => overlay.querySelectorAll('button').find(n => n.textContent === label);
    const dismiss = kind => {
        if (kind === 'backdrop') overlay.querySelector('.modal-backdrop').click();
        else if (kind === 'X') overlay.querySelector('.modal-x').click();
        else button(kind).click();
    };
    if (!map) return { g, Rift, overlay, button, dismiss };

    ['js/core/state.js', 'js/core/world.js', 'data/map.js', 'data/avatars.js'].forEach(g.run);
    const state = Rift.State.freshState();
    state.avatar = { type: 'owlet', variant: 'boy', nickname: 'Tester' };
    state.chapter = 'ch4';
    state.flags['finale-open'] = true;
    state.flags['story-battle-won'] = true;
    state.map.at = 'fair-finale';
    state.map.revealed = Object.keys(Rift.data.map.nodes);
    state.map.completed = ['fair-finale', 'stall-pattern', 'stall-witness'];
    Rift.State.get = () => state;
    Rift.State.update = fn => { fn(state); Rift.bus.emit('state:changed', state); };
    Rift.Assets = {
        has: () => false, frames: () => null, src: id => id,
        img: (id, opts) => Rift.el('img', { src: id, className: opts && opts.className }),
    };
    Rift.Battles = { canChallenge: () => false };
    const scenes = [], routes = [], screens = {};
    Rift.Dialogue = { play: async (id, opts) => { scenes.push({ id, opts }); } };
    Rift.Router = { go: (name, params) => routes.push({ name, params }) };
    Rift.Screens = { register: (name, def) => { screens[name] = def; } };
    g.ctx.setInterval = () => 1;
    g.ctx.clearInterval = () => {};
    g.ctx.performance = { now: () => 0 };
    // Use the map's fallback timer, which also handles walks in hidden browser tabs.
    g.ctx.requestAnimationFrame = () => 1;
    g.run('js/screens/map.js');
    const root = g.document.createElement('div');
    g.document.body.appendChild(root);
    const handle = screens.map.mount(root, {});
    // Return the promise from the actual click listener so rejected arrivals can be observed.
    const visit = id => root.querySelector('[data-node="' + id + '"]')._listeners.click[0]();
    return { g, Rift, overlay, button, dismiss, state, scenes, routes, handle, visit };
}

async function finish(g, promise) {
    let done = false, result, error;
    promise.then(value => { done = true; result = value; }, value => { done = true; error = value; });
    for (let i = 0; i < 30 && !done; i++) { g.flush(); await drain(); }
    assert.equal(done, true, 'navigation must settle');
    if (error) throw error;
    return result;
}

for (const kind of ['Not now', 'backdrop', 'X']) {
    test('confirmation resolves false after ' + kind, async () => {
        const t = setup();
        let answer = 'pending', settlements = 0;
        t.Rift.UI.confirm('Replay', 'Watch this scene again?', 'Watch', 'Not now')
            .then(value => { answer = value; settlements++; });
        const backdrop = t.overlay.querySelector('.modal-backdrop');
        t.dismiss(kind);
        backdrop.click();
        await drain();
        assert.equal(t.overlay.children.length, 0);
        assert.equal(answer, false);
        assert.equal(settlements, 1);
    });
}

test('Watch resolves true and clicks inside the panel do not dismiss a confirmation', async () => {
    const t = setup();
    let answer = 'pending';
    t.Rift.UI.confirm('Replay', 'Watch this scene again?', 'Watch', 'Not now').then(value => { answer = value; });
    t.overlay.querySelector('.modal').click();
    await drain();
    assert.equal(answer, 'pending');
    assert.ok(t.overlay.querySelector('.modal-backdrop'));
    t.dismiss('Watch');
    await drain();
    assert.equal(answer, true);
    assert.equal(t.overlay.children.length, 0);
});

test('programmatic modal close calls its dismissal handler once', () => {
    const t = setup();
    const closes = [];
    const m = t.Rift.UI.modal('Replay', t.Rift.el('p', { text: 'A scene' }), undefined,
        { onClose: chosen => closes.push(chosen) });
    m.close();
    m.close();
    m.node.click();
    assert.equal(closes.length, 1);
    assert.equal(closes[0], undefined);
    assert.equal(t.overlay.children.length, 0);
});

for (const kind of ['Not now', 'backdrop', 'X', 'Watch']) {
    test('map navigation remains usable after replay answer ' + kind, async context => {
        const t = setup(true);
        context.after(() => t.handle.destroy());
        const replay = t.visit('fair-finale');
        await drain();
        assert.match(t.overlay.textContent, /Watch this scene again\?/);
        t.dismiss(kind);
        await drain();
        assert.equal(t.scenes.length, kind === 'Watch' ? 1 : 0);
        if (kind === 'Watch') {
            assert.equal(t.scenes[0].id, 'finale.home');
            assert.equal(t.scenes[0].opts.replay, true);
        }
        await finish(t.g, t.visit('well'));
        assert.equal(t.routes.length, 1, 'a second destination must still open');
        assert.equal(t.routes[0].name, 'encounter');
        assert.equal(t.routes[0].params.nodeId, 'well');
        assert.equal(t.state.map.at, 'well');
        await finish(t.g, replay);
    });
}

test('an arrival exception releases navigation for the next destination', async context => {
    const t = setup(true);
    context.after(() => t.handle.destroy());
    t.Rift.Dialogue.play = async () => { throw new Error('Arrival failed'); };
    // The nearby home has an uncompleted story, so it reaches Dialogue.play without a replay prompt.
    await assert.rejects(finish(t.g, t.visit('burrow')), /Arrival failed/);
    assert.equal(t.state.map.at, 'burrow');
    await finish(t.g, t.visit('road-start'));
    assert.equal(t.routes.length, 1);
    assert.equal(t.routes[0].params.nodeId, 'road-start');
    assert.equal(t.state.map.at, 'road-start');
});
