import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWithDom } from './fake-dom.mjs';

const CORE = ['js/core/rift.js', 'js/core/state.js', 'js/core/world.js', 'js/core/assets.js', 'data/assets.js',
    'data/map.js', 'data/creatures.js', 'data/tactics.js', 'data/items.js', 'data/avatars.js', 'data/legendaries.js', 'js/core/hunts.js', 'js/core/tricks.js'];
const CH = { maskip: 'ch2', quibblequill: 'ch3', oddsnap: 'ch4' };
const plain = x => JSON.parse(JSON.stringify(x));

function setup(id = 'maskip', chooseRun = () => true) {
    const screens = {}, intervals = new Map(); let nextTimer = 0, handle;
    const g = loadWithDom(CORE.concat([ctx => { ctx.Rift.Screens = { register: (name, screen) => { screens[name] = screen; } }; }, 'js/screens/hunt.js']));
    const create = g.document.createElement;
    g.document.createElement = tag => {
        const node = create(tag);
        node.insertBefore = (child, before) => {
            if (!before) return node.appendChild(child);
            if (child.parentNode) child.parentNode.removeChild(child);
            const at = node.childNodes.indexOf(before); assert.ok(at >= 0);
            child.parentNode = node; node.childNodes.splice(at, 0, child); return child;
        };
        return node;
    };
    g.ctx.setInterval = fn => { intervals.set(++nextTimer, fn); return nextTimer; };
    g.ctx.clearInterval = token => intervals.delete(token);
    const { Rift: R } = g, S = R.State, H = R.Hunts, T = R.Tricks;
    const stored = new Map(); R.storage = () => ({ getItem: k => stored.get(k) || null, setItem: (k, v) => stored.set(k, String(v)), removeItem: k => stored.delete(k) });
    S.newGame();
    S.update(s => {
        s.avatar = { type: 'owlet', variant: 'girl', nickname: 'Test' };
        R.World.jumpToChapter(s, CH[id]);
        Object.entries(R.data.map.nodes).forEach(([key, node]) => { if ((node.map || 'main') === CH[id]) R.World.reveal(s, key); });
        H.sync(s); s.map.at = H.record(s, id).node;
        let found = false;
        for (let seed = 1; seed <= 5000; seed++) { s.seed = seed; if (chooseRun(T.make(id, H.runSeed(s, id)))) { found = true; break; } }
        assert.ok(found, 'a genuine seeded run matches the requested interaction');
    });
    const routes = [], sounds = [];
    R.Audio = { sfx: name => sounds.push(name) };
    R.UI = { toast() {}, framedCard: species => R.el('div', { text: R.data.creatures[species].name }) };
    const navigate = (name, params) => { routes.push({ name, params }); if (handle) handle.destroy(); };
    R.Router = { replace: navigate, go: navigate };
    const root = g.document.createElement('div'); g.document.body.appendChild(root);
    function mount() { root.replaceChildren(); handle = screens.hunt.mount(root, { id }); return handle; }
    mount();
    const $ = selector => root.querySelector(selector);
    const byText = text => root.querySelectorAll('button').find(b => b.textContent === text);
    const tick = n => { for (let i = 0; i < n; i++) [...intervals].forEach(([key, fn]) => { if (intervals.has(key)) fn(); }); };
    const run = () => T.make(id, H.runSeed(S.get(), id));
    const solve = () => {
        const at = root.querySelectorAll('.hunt-pip').findIndex(p => p.classList.contains('now'));
        const r = run().rounds[at], answer = T.solution(r);
        const option = value => $('[data-option="' + value + '"]');
        if (r.mode === 'wait') { tick(r.seconds); return; }
        if (r.mode === 'number') { const input = $('.hunt-number'); input.value = answer; input.dispatchEvent({ type: 'input' }); $('.hunt-check').click(); return; }
        if (r.mode === 'multi' || r.mode === 'sequence') answer.forEach(value => option(value).click());
        else {
            const hidden = r.options.find(o => o.id === answer && o.place);
            if (hidden) $(hidden.place === 'portrait' ? '.hunt-portrait' : hidden.place === 'title' ? 'h2' : '.hunt-sign-link').click();
            else option(answer).click();
        }
        if (r.mode === 'pick' || r.mode === 'multi') $('.hunt-check').click();
    };
    function map() {
        if (handle) handle.destroy(); root.replaceChildren();
        R.UI.hud = () => R.el('div'); R.Battles = { canChallenge: () => false };
        R.Assets.frames = () => null;
        g.ctx.performance = { now: () => 0 }; g.ctx.requestAnimationFrame = () => 1;
        g.run('js/screens/map.js'); handle = screens.map.mount(root, {}); return handle;
    }
    return { g, R, S, H, T, root, $, byText, routes, sounds, intervals, tick, run, solve, mount, map, get handle() { return handle; } };
}

test('a stale tap cannot answer the next unseen round or restart its timer', () => {
    const t = setup('maskip', run => run.rounds[0].mode === 'tap' && run.rounds[1].accept.includes(run.rounds[0].accept[0]) && !run.rounds[0].options.some(o => o.place));
    t.byText('Start').click();
    const old = t.$('[data-option="' + t.run().rounds[0].accept[0] + '"]');
    old.click(); assert.equal(t.S.get().hunts.maskip.round, 1);
    old.click(); old.click();
    assert.equal(t.S.get().hunts.maskip.round, 1, 'only the visible round was submitted');
    const next = t.byText('Next round'); next.click();
    const sign = t.$('.hunt-sign'); next.click();
    assert.equal(t.$('.hunt-sign'), sign, 'a stale Next does not recreate/reset an active round');
    t.handle.destroy();
});

test('a failed answer commits flight once and every old answer/Start control stays inert', () => {
    const t = setup('quibblequill', run => run.rounds[0].mode === 'tap' && !run.rounds[0].options.some(o => o.place));
    const start = t.byText('Start'); start.click();
    const r = t.run().rounds[0], old = t.$('[data-option="' + r.options.find(o => !r.accept.includes(o.id)).id + '"]');
    old.click(); const failed = plain(t.S.get().hunts.quibblequill);
    old.click(); start.click();
    assert.deepEqual(plain(t.S.get().hunts.quibblequill), failed);
    assert.equal(t.$('.hunt-sign'), null, 'a failed attempt cannot restart at the old site');
    assert.equal(t.S.get().hunts.quibblequill.attempt, 2);
    t.handle.destroy();
});

test('old transition controls cannot dismiss later feedback or start a later clock', () => {
    const t = setup(), start = t.byText('Start'); start.click(); t.solve();
    const next = t.byText('Next round'); next.click(); t.solve();
    const feedback = t.$('.hunt-result'); start.click(); next.click();
    assert.equal(t.$('.hunt-result'), feedback);
    assert.equal(t.intervals.size, 0); t.handle.destroy();
});

for (const id of Object.keys(CH)) {
    test(id + ': map badge → hunt → flee → actual travel → twelve rounds → once-only recruitment → practice', async () => {
        const t = setup(id, run => run.rounds[0].mode === 'tap' && !run.rounds[0].options.some(o => o.place));
        const story = () => plain({ completed: t.S.get().map.completed, flags: t.S.get().flags, chapter: t.S.get().chapter, health: t.S.get().health, scars: t.S.get().scars, items: t.S.get().items });
        const before = story();
        t.map(); const badge = t.$('.hunt-badge'); assert.equal(badge.getAttribute('role'), 'button');
        badge.dispatchEvent({ type: 'keydown', key: 'Enter', preventDefault() {}, stopPropagation() {} });
        assert.equal(t.routes.at(-1).name, 'hunt'); t.mount(); t.byText('Start').click();
        const r = t.run().rounds[0]; t.$('[data-option="' + r.options.find(o => !r.accept.includes(o.id)).id + '"]').click();
        const from = t.S.get().map.at, to = t.S.get().hunts[id].node;
        assert.notEqual(to, from); assert.equal(t.S.get().hunts[id].round, 0);
        t.byText('Back to the map').click(); t.map();
        assert.ok(t.$('.hunt-trail')); assert.ok(t.$('.map-hunt-note'));
        t.$('.hunt-badge').click();
        for (let i = 0; i < 30 && t.S.get().map.at !== to; i++) { t.g.flush(); for (let j = 0; j < 10; j++) await Promise.resolve(); }
        for (let j = 0; j < 20; j++) await Promise.resolve();
        assert.equal(t.S.get().map.at, to, 'the map walks the route to the creature');
        assert.equal(t.routes.at(-1).name, 'hunt');
        t.mount(); t.byText('Start').click();
        for (let i = 0; i < 12; i++) { t.solve(); if (i < 11) t.byText('Next round').click(); }
        assert.equal(t.S.get().hunts[id].phase, 'claimed');
        assert.equal(t.S.get().creatures.filter(c => c.species === id).length, 1);
        assert.deepEqual(story(), before, 'optional hunt leaves story and costs alone');
        t.handle.debugSolve();
        t.handle.destroy(); t.mount(); t.byText('Start').click();
        for (let i = 0; i < 12; i++) { t.solve(); if (i < 11) t.byText('Next round').click(); }
        assert.equal(t.S.get().creatures.filter(c => c.species === id).length, 1, 'practice cannot duplicate the reward');
        assert.equal(t.S.get().hunts[id].practice, 1);
        t.handle.destroy(); assert.equal(t.intervals.size, 0);
    });
}

for (const mode of ['wait', 'quick']) {
    test(mode + ': clock starts with the round, stops on leave/destruction, and resumes the same saved round', () => {
        const t = setup('oddsnap', run => mode === 'wait' ? run.rounds[0].mode === 'wait' : run.rounds[0].mode !== 'wait' && !!run.rounds[0].seconds);
        assert.equal(t.intervals.size, 0); t.byText('Start').click(); assert.equal(t.intervals.size, 1);
        const r = plain(t.run().rounds[0]); t.tick(1); t.byText('Leave').click();
        assert.equal(t.intervals.size, 0); t.tick(100); assert.equal(t.S.get().hunts.oddsnap.round, 0);
        t.mount(); t.byText('Start').click(); assert.deepEqual(plain(t.run().rounds[0]), r);
        t.tick(mode === 'wait' ? r.seconds : r.seconds);
        assert.equal(t.intervals.size, 0);
        assert.equal(t.S.get().hunts.oddsnap[mode === 'wait' ? 'round' : 'attempt'], mode === 'wait' ? 1 : 2);
        t.handle.destroy();
    });
}

test('saved progress reopens at the next round; every real input mode and hidden keyboard target works', () => {
    const covered = new Set(), hidden = new Set();
    for (const id of Object.keys(CH)) for (let seed = 0; seed < 12; seed++) {
        const t = setup(id); t.S.update(s => { s.seed = seed; }); t.handle.destroy(); t.mount(); t.byText('Start').click();
        for (let i = 0; i < 12; i++) {
            const r = t.run().rounds[i]; covered.add(r.mode);
            const target = r.options.find(o => o.place && r.accept.includes(o.id));
            if (target) {
                hidden.add(target.place);
                const node = t.$(target.place === 'portrait' ? '.hunt-portrait' : target.place === 'title' ? 'h2' : '.hunt-sign-link');
                if (target.place === 'sign') node.click();
                else { assert.equal(node.getAttribute('tabindex'), '0'); node.dispatchEvent({ type: 'keydown', key: ' ', preventDefault() {} }); }
            } else t.solve();
            assert.equal(t.intervals.size, 0);
            if (i === 2) { t.handle.destroy(); t.mount(); assert.ok(t.byText('Go on')); t.byText('Go on').click(); }
            else if (i < 11) t.byText('Next round').click();
        }
        assert.equal(t.S.get().hunts[id].phase, 'claimed'); t.handle.destroy();
    }
    assert.deepEqual([...covered].sort(), ['multi', 'number', 'pick', 'sequence', 'tap', 'wait']);
    assert.deepEqual([...hidden].sort(), ['portrait', 'sign', 'title']);
});

test('every bank case renders evidence and accepts its answer through the real controls', () => {
    for (const id of Object.keys(CH)) {
        const t = setup(id), bank = t.T.bank(id, 1), make = t.T.make;
        for (const r of bank) {
            t.handle.destroy();
            // Isolate one bank question at a time without changing production generation.
            t.S.update(s => { const rec = s.hunts[id]; rec.round = 0; rec.phase = 'roaming'; });
            t.T.make = (which, seed) => Object.assign({}, make(which, seed), { rounds: [r] });
            t.mount(); t.byText('Start').click();
            assert.ok(t.$('.hunt-sign'), id + ' ' + r.key);
            if (r.scene) assert.ok(t.$('.hunt-scene'), id + ' ' + r.key + ' evidence renders');
            t.solve(); assert.ok(t.$('.result-banner'), id + ' ' + r.key + ' reaches win');
            assert.equal(t.intervals.size, 0);
        }
        t.handle.destroy();
    }
});
