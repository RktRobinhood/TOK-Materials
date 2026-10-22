// Rift.Motion (#66): one-shot puzzle and screen animation. Every call plays once, Calm motion and
// OS reduced motion only fade, cancel() stops what is inside a scope, and the encounter uses it
// for solved, wrong-check, hint and heart cues without changing any result.
// Never pass a fake-DOM node to assert.equal/deepEqual: assert booleans or strings instead.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import { loadWithDom } from './fake-dom.mjs';
import { loadRift } from './harness.mjs';
import { Node } from './dom-adapter.mjs';

function motionDom(opts = {}) {
    const g = loadWithDom(['js/core/rift.js', 'js/ui/anim.js']);
    const calls = [];
    const proto = Object.getPrototypeOf(g.document.createElement('div'));
    proto.animate = function (frames, options) {
        const a = { node: this, frames, options, effect: { target: this }, cancel() { this.cancelled = true; }, addEventListener() {} };
        calls.push(a);
        return a;
    };
    if (opts.calm) g.document.body.classList.add('calm-motion');
    if (opts.reduced) g.ctx.matchMedia = () => ({ matches: true });
    return { g, M: g.Rift.Motion, calls, node: () => { const n = g.document.createElement('div'); g.document.body.appendChild(n); return n; } };
}
const moves = a => a.frames.some(f => f.transform || f.translate || f.scale || f.rotate || f.filter || f.strokeDashoffset != null);

test('every Motion helper plays once and moves; Calm motion and reduced motion only fade', () => {
    for (const mode of ['normal', 'calm', 'reduced']) {
        const t = motionDom({ calm: mode === 'calm', reduced: mode === 'reduced' });
        const n = t.node();
        ['settle', 'nudge', 'glow', 'pop'].forEach(k => t.M[k](n));
        t.M.reveal(n, 2);
        assert.equal(t.calls.length, 5);
        assert.ok(t.calls.every(a => a.options.iterations === 1), 'never loops');
        assert.ok(t.calls.every(a => a.options.duration + (a.options.delay || 0) <= 700), 'short');
        if (mode === 'normal') assert.ok(t.calls.every(moves), 'each cue moves or glows');
        else assert.ok(t.calls.every(a => !moves(a) && a.frames.every(f => 'opacity' in f)), mode + ': opacity only');
        assert.equal(t.calls[4].options.delay, 140, 'a list reveal staggers 70 ms apart');
        assert.equal(t.M.calm(), mode !== 'normal');
    }
});

test('nudge is one movement out and back, never a back-and-forth shake', () => {
    const t = motionDom();
    t.M.nudge(t.node());
    const xs = t.calls[0].frames.map(f => f.translate);
    assert.equal(xs.join(' | '), '0 0 | 7px 0 | 0 0');
});

test('draw traces an SVG line from its start; without a length it simply reveals', () => {
    const t = motionDom();
    const path = t.node();
    path.getTotalLength = () => 120;
    t.M.draw(path);
    assert.equal(t.calls[0].frames[0].strokeDashoffset, 120);
    assert.equal(t.calls[0].frames[1].strokeDashoffset, 0);
    const plain = t.node();
    t.M.draw(plain);
    assert.equal(t.calls[1].frames[0].opacity, 0);
});

test('cancel(scope) stops only the motions inside it; missing nodes and old browsers are safe', () => {
    const t = motionDom();
    const a = t.node(), b = t.node();
    const inner = t.g.document.createElement('span'); a.appendChild(inner);
    t.M.pop(inner); t.M.pop(b);
    t.M.cancel(a);
    assert.equal(t.calls[0].cancelled, true);
    assert.ok(!t.calls[1].cancelled);
    t.M.cancel();
    assert.equal(t.calls[1].cancelled, true);
    assert.equal(t.M.settle(null), null);
    assert.equal(t.M.pop({}), null, 'no Web Animations: nothing happens');
});

// The real encounter controller with a recording Motion stub.
async function encounter() {
    const Rift = loadRift(['js/core/rift.js', 'js/core/state.js', 'js/core/world.js', 'js/core/catch-arcade.js', 'js/core/catch-games.js', 'js/core/catch-session.js', 'data/avatars.js', 'data/items.js', 'data/creatures.js', 'js/puzzles/registry.js']);
    const state = Rift.State.freshState(); state.avatar = { type: 'owlet', nickname: 'Test' }; state.tutorialsSeen.fake = true; state.flags['learning-hint:fake'] = true;
    Rift.State.transact = fn => ({ ok: true, value: fn(state) }); Rift.State.get = () => state; Rift.State.save = () => {}; Rift.State.update = fn => fn(state);
    Rift.el = (...a) => new Node(...a);
    Rift.data.map = { nodes: { test: { type: 'puzzle', chapter: 'prologue', links: [], puzzles: [{ id: 'fake', difficulty: 1 }], name: 'Test', host: 'narrator', goal: 'Check rules' } } };
    Rift.data.chapters = { prologue: {} }; Rift.data.speakers = { narrator: { name: 'Host', art: 'host' } }; Rift.data.script = {};
    const modals = [], cues = [];
    let api, screen;
    Rift.Assets = { img: () => new Node() }; Rift.Audio = { sfx() {}, speak() {} }; Rift.Dialogue = { has: () => false }; Rift.Router = { replace() {} };
    Rift.UI = { hud: opts => new Node('div', {}, [new Node('span.hearts'), opts.status]), toast() {}, modal: (title, body, buttons) => { const m = { title, body, buttons, close() {} }; modals.push(m); return m; } };
    Rift.Tutorial = {}; Rift.Screens = { register: (_, def) => { screen = def; } };
    const name = n => (n && n.className) || String(n);
    Rift.Motion = {};
    ['settle', 'nudge', 'reveal', 'glow', 'pop', 'cancel'].forEach(k => { Rift.Motion[k] = n => { cues.push(k + ':' + name(n)); return null; }; });
    Rift.Puzzles.register({ id: 'fake', name: 'Fake', colour: 'reason', generate: () => ({}), check: (_, a) => ({ solved: a === true, feedback: 'Check the premise.' }),
        hints: () => ['Look again.'], mount: (_, d, x) => { api = x; return { pause() {}, destroy() {} }; } });
    vm.runInNewContext(fs.readFileSync(new URL('../../js/screens/encounter.js', import.meta.url), 'utf8'), { window: { Rift }, setTimeout, clearTimeout, Date });
    const root = new Node();
    const handle = screen.mount(root, { nodeId: 'test' });
    return { state, handle, modals, cues, api: () => api, root };
}

test('the encounter: a wrong check nudges the feedback, a hint reveals it, a lost heart pops, a solve settles the puzzle', async () => {
    const g = await encounter();
    g.api().submit(false);
    assert.deepEqual(g.cues, ['nudge:enc-feedback bad'], 'a free wrong check: the reason moves once');
    for (let i = 0; i < 3; i++) g.api().submit(false);
    assert.ok(g.cues.includes('pop:hearts'), 'a paid wrong check pops the hearts');
    g.cues.length = 0;
    g.handle.debugSolve && null;
    g.api().submit(true);
    assert.deepEqual(g.cues, ['settle:enc-puzzle', 'reveal:enc-feedback good']);
    assert.equal(g.modals.at(-1).title, 'Stage solved!', 'the dialog still opens at once');
    assert.equal(g.state.stats.puzzlesSolved, 1, 'motion changes no result');
    g.handle.destroy();
    assert.equal(g.cues.at(-1), 'cancel:' + (g.root.className || '[object Object]'));
});

test('the encounter: a hint reveals the new hint text', async () => {
    const g = await encounter();
    const hintBtn = (function find(n) { if (n.text === '💡 Hint' || n.textContent === '💡 Hint') return n; for (const c of n.children || []) { const f = c instanceof Node && find(c); if (f) return f; } return null; })(g.root);
    assert.ok(hintBtn, 'the hint button exists');
    hintBtn.onclick();
    assert.ok(g.cues.includes('reveal:enc-feedback hint'), g.cues.join(' | '));
    g.handle.destroy();
});

test('the map: a place revealed since the last map view opens its fog and fades in once; the first view and later repaints do not', () => {
    const g = loadWithDom(['js/core/rift.js', 'js/ui/ui.js', 'js/core/state.js', 'js/core/world.js', 'data/map.js', 'data/avatars.js']);
    const { Rift } = g;
    Rift.Audio = { sfx() {} };
    const state = Rift.State.freshState();
    state.avatar = { type: 'owlet', variant: 'boy', nickname: 'Tester' };
    Rift.State.get = () => state;
    Rift.State.update = fn => { fn(state); Rift.bus.emit('state:changed', state); };
    Rift.Assets = { has: () => false, frames: () => null, src: id => id, img: (id, opts) => Rift.el('img', { src: id, className: opts && opts.className }) };
    Rift.Battles = { canChallenge: () => false };
    const screens = {}, cues = [];
    Rift.Dialogue = { play: async () => {} };
    Rift.Router = { go() {} };
    Rift.Screens = { register: (name, def) => { screens[name] = def; } };
    Rift.Motion = { play: (n, frames) => { cues.push((n && (n.tagName || '').toLowerCase()) + ':' + Object.keys(frames[0]).join('+')); return null; } };
    g.ctx.setInterval = () => 1; g.ctx.clearInterval = () => {}; g.ctx.performance = { now: () => 0 }; g.ctx.requestAnimationFrame = () => 1;
    g.run('js/screens/map.js');
    const here = Object.keys(Rift.data.map.nodes).find(id => (Rift.data.map.nodes[id].links || []).length && !Rift.data.map.nodes[id].map);
    const next = Rift.data.map.nodes[here].links.find(id => !Rift.data.map.nodes[id].map);
    state.map.at = here; state.map.revealed = [here, next];
    assert.ok(next, 'the start has a neighbour');
    state.map.revealed = state.map.revealed.filter(id => id !== next);
    const mount = () => { const root = g.document.createElement('div'); g.document.body.appendChild(root); return screens.map.mount(root, {}); };
    let handle = mount();
    assert.equal(cues.length, 0, 'the first map view of the session shows the places as they are');
    handle.destroy && handle.destroy();
    const savedBefore = JSON.stringify(state);
    state.map.revealed.push(next);
    const revealedNow = JSON.stringify(state);
    handle = mount();
    assert.equal(cues.join(' | '), 'circle:r | g:opacity+filter', 'the new place: its fog opens, then its marker fades in');
    assert.equal(JSON.stringify(state), revealedNow, 'the map saves nothing for this');
    assert.notEqual(savedBefore, revealedNow);
    cues.length = 0;
    Rift.State.update(() => {});
    assert.equal(cues.length, 0, 'a repaint does not replay it');
    handle.destroy && handle.destroy();
});
