// Catch-game animation (#66): each move shows what it did once (a turned piece, a slid piece,
// opened patches, a snare), the real-time games draw a fading spark where something broke, and
// none of it changes the board. Never pass a fake-DOM node to assert.equal/deepEqual.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWithDom } from './fake-dom.mjs';

const FILES = ['js/core/rift.js', 'data/assets.js', 'js/core/assets.js', 'js/core/catch-arcade.js', 'js/core/catch-games.js', 'js/ui/catch-arcade.js', 'js/ui/catching.js'];

function game(kind, withMotion = true, item = 'charm') {
    const g = loadWithDom(FILES);
    const cues = [];
    if (withMotion) {
        g.Rift.Motion = {};
        ['settle', 'nudge', 'reveal', 'glow', 'pop', 'play'].forEach(k => {
            g.Rift.Motion[k] = (n, a) => { cues.push(k + ':' + ((n && n.getAttribute && (n.getAttribute('data-catch-key') || n.tagName)) || 'none') + (k === 'play' && a ? ':' + JSON.stringify(a[0]) : '')); return null; };
        });
    }
    const root = g.Rift.el('div'); g.document.body.append(root);
    let board = g.Rift.CatchGames.create(kind, 'motion-proof', 'rare', item, false);
    g.Rift.CatchGame.mount(root, {
        board, species: 'astrophysicat',
        onStart: () => ({ ok: true, board }),
        onAction(action) { const r = g.Rift.CatchGames.step(board, action); if (!r) return { ok: false, error: 'no' }; board = r.board; return { ok: true, ...r }; },
        onFinish() {},
    });
    root.querySelectorAll('button').find(b => /^Start/.test(b.textContent)).click();
    const click = key => root.querySelector('[data-catch-key="' + key + '"]').click();
    const move = a => { const key = (kind === 'lure' ? 'trail-' : kind === 'picture' ? 'picture-' : 'tile-') + a.cell;
        if (a.flag) root.querySelector('[data-catch-key="' + key + '"]').dispatchEvent({ type: 'keydown', key: 'f', preventDefault() {} }); else click(key); };
    return { g, root, cues, click, move, board: () => board };
}

test('Lantern Lure: the turned piece turns once, and newly lit trail glows', () => {
    const t = game('lure');
    const plan = t.g.Rift.CatchGames.solve(t.board());
    t.click('trail-' + plan[0].cell);
    // The piece's picture turns (the fake page has no parsed SVG, so the button stands in).
    assert.ok(t.cues.some(c => /^play:(svg|SVG|trail-\d+):\{"rotate":"-90deg"\}$/.test(c)), t.cues.join(' | '));
    for (const a of plan.slice(1)) { if (t.board().done) break; t.cues.length = 0; t.click('trail-' + a.cell); }
    assert.equal(t.board().done, 'caught', 'motion never changes the result');
});

test('Picture Catch: the slid piece glides in from where it was', () => {
    const t = game('picture');
    const gap = t.board().tiles.indexOf(0);
    const move = t.g.Rift.CatchGames.pictureMoves(t.board())[0];
    t.click('picture-' + move);
    const dx = move % 3 - gap % 3, dy = Math.floor(move / 3) - Math.floor(gap / 3);
    assert.ok(t.cues.includes('play:picture-' + gap + ':{"translate":"' + dx * 100 + '% ' + dy * 100 + '%"}'), t.cues.join(' | '));
});

test('Trail Finder: opened patches appear in order, a snare nudges once, a flag pops', () => {
    const t = game('tracks', true, 'greatcharm');   // a spare trap heart, so a snare does not end the try
    const b = t.board();
    const safe = Array.from({ length: b.size ** 2 }, (_, c) => c).find(c => !b.traps.includes(c) && !b.open.includes(c));
    t.click('tile-' + safe);
    assert.ok(t.cues.length >= 1 && t.cues.every(c => /^reveal:tile-/.test(c)), t.cues.join(' | '));
    t.cues.length = 0;
    t.click('tile-' + t.board().traps[0]);
    assert.ok(t.cues.includes('nudge:tile-' + b.traps[0]), t.cues.join(' | '));
});

test('without Rift.Motion every catch game still plays', () => {
    for (const kind of ['lure', 'picture', 'tracks']) {
        const t = game(kind, false);
        const plan = t.g.Rift.CatchGames.solve(t.board());
        for (const a of plan) { if (t.board().done) break; t.move(a); }
        assert.equal(t.board().done, 'caught', kind);
    }
});

// The real-time view with a recording canvas and a fake frame clock.
function live(kind, calm) {
    const g = loadWithDom(FILES);
    const strokes = [];
    const ctx = new Proxy({ globalAlpha: 1 }, {
        get: (o, k) => (k in o ? o[k] : (...args) => { if (k === 'stroke') strokes.push({ style: o.strokeStyle, alpha: o.globalAlpha }); if (k === 'fillRect' && o.globalAlpha < 1) strokes.push({ style: 'fill:' + o.fillStyle, alpha: o.globalAlpha }); }),
        set: (o, k, v) => { o[k] = v; return true; },
    });
    Object.getPrototypeOf(g.document.createElement('canvas')).getContext = () => ctx;
    const frames = []; let now = 0;
    g.ctx.requestAnimationFrame = fn => { frames.push(fn); return frames.length; };
    g.ctx.cancelAnimationFrame = () => {};
    g.ctx.performance = { now: () => now };
    const root = g.Rift.el('div'); g.document.body.append(root);
    let current = g.Rift.CatchGames.create(kind, 'spark-proof', 'common', 'charm', false);
    g.Rift.CatchGame.mount(root, { board: current, species: 'swiftlet', calm,
        onStart: () => ({ ok: true, board: current }),
        onAction(action) { const r = g.Rift.CatchGames.step(current, action); if (!r) return { ok: false, error: 'no' }; current = r.board; return { ok: true, ...r }; } });
    root.querySelectorAll('button').find(b => /^Start/.test(b.textContent)).click();
    const view = root.querySelector('[data-catch-key="arena"]').arcade;
    return { g, view, strokes, board: () => current,
        run(ms) { const end = now + ms; while (now < end - 1e-6 && frames.length) { now += 1000 / 60; frames.splice(0).forEach(f => f(now)); } } };
}

test('Shard Burst: a broken shard leaves one fading spark, gone within half a second', () => {
    const t = live('burst', false);
    const A = t.g.Rift.CatchArcade;
    for (let i = 0; i < 80 && !t.view.state().hits; i++) {
        const s = t.view.state(), sh = s.shards[0];
        t.view.fire(Math.atan2(sh.y - A.CY, sh.x - A.CX));
        t.run(150);
    }
    assert.ok(t.view.state().hits > 0, 'a shard was hit');
    const sparks = t.strokes.filter(x => x.style === '#fff4cf' && x.alpha < 1);
    assert.ok(sparks.length > 0, 'the spark was drawn fading');
    // Half a second with no new hit: the spark is no longer drawn (the lantern's rings stay at full alpha).
    let quiet = false;
    for (let i = 0; i < 6 && !quiet; i++) {
        const hits = t.view.state().hits;
        t.run(500);
        if (t.view.state().hits !== hits) continue;
        t.strokes.length = 0; t.run(20);
        quiet = !t.strokes.some(x => x.style === '#fff4cf' && x.alpha < 1);
    }
    assert.ok(quiet, 'one-shot: it fades and is gone');
});

// The real encounter: the visitor shows the result once when a try ends, never on a reload.
function encounter() {
    let screen, api;
    const modals = [], store = new Map(), cues = [];
    const g = loadWithDom([
        'js/core/rift.js', 'js/core/state.js', 'js/core/world.js', 'js/core/catch-arcade.js', 'js/core/catch-games.js', 'js/core/catch-session.js',
        'data/avatars.js', 'data/creatures.js', 'data/items.js', 'js/puzzles/registry.js', 'js/ui/catch-arcade.js', 'js/ui/catching.js',
        ctx => {
            const R = ctx.Rift;
            R.storage = () => ({ getItem: k => store.get(k) || null, setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k) });
            R.State.newGame();
            R.State.update(s => { s.avatar = { type: 'owlet', nickname: 'Test' }; s.tutorialsSeen.fake = true; s.flags['learning-hint:fake'] = true; });
            R.State.saveNow();
            R.data.map = { nodes: { test: { type: 'puzzle', chapter: 'prologue', links: [], name: 'Test', host: 'narrator', puzzles: [{ id: 'fake', difficulty: 1 }] } } };
            R.data.chapters = { prologue: {} }; R.data.speakers = { narrator: { name: 'Host', art: 'host' } }; R.data.script = {};
            R.Assets = { img: (id, o) => R.el('div' + (o && o.className ? '.' + o.className : '')) }; R.Audio = { sfx() {}, speak() {} }; R.Dialogue = { has: () => false };
            R.Router = { replace() {} };
            R.UI = { hud: opts => R.el('div', {}, [opts.status]), toast() {}, modal(title, body, buttons) { const m = { title, body, buttons, close() {} }; modals.push(m); return m; } };
            R.Tutorial = {}; R.Screens = { register: (_, def) => { screen = def; } };
            R.Puzzles.register({ id: 'fake', name: 'Fake', colour: 'language', generate: () => ({}), check: () => ({ solved: true }), hints: () => [],
                mount(_, data, actions) { api = actions; return { pause() {}, destroy() {} }; } });
            R.World.rollLoot = () => ({ species: 'swiftlet' });
            R.CatchGames.pick = () => 'lure';
            R.Motion = {};
            ['settle', 'nudge', 'reveal', 'glow', 'pop', 'play', 'cancel'].forEach(k => {
                R.Motion[k] = (n, frames, opts) => { cues.push(k + ':' + ((n && n.className) || 'none') + (k === 'play' && frames ? ':' + JSON.stringify(frames.at(-1)) + ':' + (opts && opts.fill) : '')); return null; };
            });
        }, 'js/screens/encounter.js',
    ]);
    let root, handle;
    const mount = () => { root = g.Rift.el('div'); g.document.body.append(root); handle = screen.mount(root, { nodeId: 'test' }); };
    mount();
    const button = text => root.querySelectorAll('button').find(b => b.textContent === text);
    return { g, R: g.Rift, cues, modals, button, submit: () => api.submit(true), root: () => root,
        turn: cell => root.querySelector('[data-catch-key="trail-' + cell + '"]').click(),
        reload() { handle.destroy(); root.remove(); g.Rift.State.load(); mount(); } };
}

test('the encounter: caught settles the visitor once; escaped dashes it off; a new try brings it back', async () => {
    const e = encounter();
    e.submit(); await e.modals.at(-1).buttons[0].onclick(); e.modals.at(-1).buttons[0].onclick();
    e.button('Start · 1 charm').click();
    const plan = e.R.CatchGames.solve(e.R.CatchSession.get('test').board);
    for (const a of plan) { if (e.R.CatchSession.get('test').receipt) break; e.turn(a.cell); }
    assert.equal(e.R.CatchSession.get('test').receipt.outcome, 'caught');
    assert.ok(e.cues.includes('settle:enc-creature'), e.cues.join(' | '));
    e.cues.length = 0;
    e.reload();
    assert.ok(!e.cues.some(c => /enc-creature/.test(c)), 'a saved result does not replay');

    const f = encounter();
    f.submit(); await f.modals.at(-1).buttons[0].onclick(); f.modals.at(-1).buttons[0].onclick();
    f.button('Start · 1 charm').click();
    // Turn one piece until the turns run out: the visitor escapes.
    for (let i = 0; i < 40 && !f.R.CatchSession.get('test').receipt; i++) f.turn(15);
    assert.equal(f.R.CatchSession.get('test').receipt.outcome, 'escaped');
    assert.ok(f.cues.includes('play:enc-creature:{"translate":"56px 0","opacity":0}:forwards'), f.cues.join(' | '));
    f.cues.length = 0;
    f.button('Try again · new random game').click();
    assert.ok(f.cues.some(c => /^cancel:/.test(c)), 'the visitor comes back for the new try');
});
