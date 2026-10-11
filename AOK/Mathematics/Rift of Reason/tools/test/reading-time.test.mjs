import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadWithDom } from './fake-dom.mjs';

function manualClock(ctx) {
    let now = 0, next = 0;
    const pending = new Map();
    const schedule = (fn, ms, repeat) => {
        const id = ++next, period = Math.max(1, ms || 0);
        pending.set(id, { fn, due: now + period, period: repeat ? period : 0 });
        return id;
    };
    ctx.Date = class extends Date { static now() { return now; } };
    ctx.setInterval = (fn, ms) => schedule(fn, ms, true);
    ctx.clearInterval = id => pending.delete(id);
    ctx.setTimeout = (fn, ms) => schedule(fn, ms, false);
    ctx.clearTimeout = id => pending.delete(id);
    return {
        pending,
        jump(seconds) { now += seconds * 1000; },
        advance(seconds) {
            const target = now + seconds * 1000;
            while (pending.size) {
                const [id, timer] = [...pending].sort((a, b) => a[1].due - b[1].due)[0];
                if (timer.due > target) break;
                now = timer.due;
                if (timer.period) timer.due += timer.period;
                else pending.delete(id);
                timer.fn();
            }
            now = target;
        },
    };
}

function catchGame(mode, item = 'charm', calm = false, lured = false) {
    let clock;
    const g = loadWithDom([
        'js/core/rift.js', 'js/core/state.js', 'js/core/catching.js',
        'data/creatures.js', 'data/items.js',
        ctx => {
            clock = manualClock(ctx);
            ctx.Rift.Assets = { img: () => ctx.Rift.el('div') };
            ctx.Rift.Audio = { sfx() {} };
        },
        'js/ui/catching.js',
    ]);
    const state = g.Rift.State.freshState();
    state.items[item] = 8;
    state.settings.calm = calm;
    g.Rift.State.get = () => state;
    const results = [], root = g.Rift.el('div');
    g.document.body.appendChild(root);
    const handle = g.Rift.CatchGame.mount(root, {
        mode, item, species: 'swiftlet', seed: 12, base: 0.5, lured,
        available: id => state.items[id],
        spend: id => { if (!state.items[id]) return false; state.items[id]--; return true; },
        onFinish: result => results.push(result),
    });
    const cfg = g.Rift.Catching.config(item, g.Rift.data.creatures.swiftlet.rarity, lured);
    const button = label => root.querySelectorAll('button').find(b => b.textContent === label);
    return { ...g, state, results, clock, root, handle, cfg, button };
}

for (const [mode, calm] of [['box', false], ['throw', false], ['throw', true]]) {
    for (const item of ['charm', 'greatcharm']) {
        test(`${mode}, ${item}, calm=${calm}: reading is untimed, Start gives the full action budget`, () => {
            const g = catchGame(mode, item, calm);
            g.clock.advance(60);
            assert.equal(g.results.length, 0, 'Reading instructions must not expire a catch');
            assert.equal(g.state.items[item], 8, 'Reading instructions must not spend charms');
            assert.equal(g.clock.pending.size, 0, 'No timer runs before Start');
            const action = mode === 'throw' ? g.$('.catch-target') : g.$$('.catch-cell').find(b => !b.classList.contains('creature'));
            assert.equal(action.disabled, true);
            action.click();
            assert.equal(g.state.items[item], 8);
            assert.ok(g.button('Start'));
            g.button('Start').click();
            assert.match(g.root.textContent, new RegExp(g.cfg.seconds + ' seconds left'));
            g.clock.advance(g.cfg.seconds - 0.2);
            assert.equal(g.results.length, 0, 'Slow reading did not reduce the full budget');
            g.clock.advance(0.3);
            assert.equal(g.results.length, 1);
            assert.equal(g.results[0].spent, mode === 'throw' ? 1 : 0);
            assert.equal(g.results[0].bonus, 0);
            assert.equal(g.clock.pending.size, 0);
            g.handle.destroy();
        });
    }

    test(`${mode}, calm=${calm}: Pause freezes action time and controls; Resume keeps the remaining budget`, () => {
        const g = catchGame(mode, 'charm', calm);
        g.button('Start').click();
        g.clock.advance(2);
        const width = g.$('.catch-ring')?.style.width;
        const oldTick = [...g.clock.pending.values()][0].fn;
        g.button('Pause').click();
        oldTick(); // A callback already queued when Pause cleared the interval.
        const time = g.$('.catch-clock').textContent;
        const action = mode === 'throw' ? g.$('.catch-target') : g.$$('.catch-cell').find(b => !b.classList.contains('creature'));
        assert.equal(action.disabled, true);
        // Guard the handler as well as the disabled attribute.
        action.dispatchEvent({ type: 'click', detail: 0 });
        g.clock.advance(120);
        assert.equal(g.state.items.charm, 8);
        assert.equal(g.results.length, 0);
        assert.equal(g.$('.catch-clock').textContent, time);
        assert.equal(g.$('.catch-ring')?.style.width, width);
        assert.equal(g.clock.pending.size, 0);
        g.button('Resume').click();
        g.clock.advance(g.cfg.seconds - 2 - 0.2);
        assert.equal(g.results.length, 0);
        g.clock.advance(0.3);
        assert.equal(g.results.length, 1);
        assert.equal(g.results[0].spent, mode === 'throw' ? 1 : 0);
        g.handle.destroy();
    });
}

test('a started throw still scores the active ring phase and spends exactly one charm after a pause', () => {
    const g = catchGame('throw');
    g.button('Start').click();
    g.clock.advance(g.cfg.cycle * 0.8);
    g.button('Pause').click();
    g.clock.advance(60);
    g.button('Resume').click();
    const target = g.$('.catch-target');
    target.dispatchEvent({ type: 'click', detail: 0 });
    target.dispatchEvent({ type: 'click', detail: 0 });
    assert.equal(g.results.length, 1);
    assert.equal(g.results[0].bonus, 0.15);
    assert.equal(g.results[0].spent, 1);
    assert.equal(g.state.items.charm, 7);
    assert.equal(g.clock.pending.size, 0);
    g.handle.destroy();
});

test('Start and Pause do not change the seeded box path, charm charges or trapping bonus', () => {
    const paths = JSON.parse(fs.readFileSync(new URL('./fixtures/catch-box-paths.json', import.meta.url), 'utf8'));
    for (const lured of [false, true]) {
        const g = catchGame('box', 'charm', false, lured);
        const order = g.Rift.Catching.boxStart(12).order;
        const path = paths[lured ? 'lured' : 'plain'].find(p => JSON.stringify(p.order) === JSON.stringify(order)).path;
        g.button('Start').click();
        path.forEach((cell, ix) => {
            if (ix === 1) { g.button('Pause').click(); g.clock.advance(60); g.button('Resume').click(); }
            g.$('.catch-grid').children[cell].click();
        });
        assert.equal(g.results.length, 1);
        assert.equal(g.results[0].bonus, 0.15);
        assert.equal(g.results[0].spent, path.length);
        assert.equal(g.state.items.charm, 8 - path.length);
        g.handle.destroy();
    }
});

test('box timer ticks and pause controls keep the focused cell mounted', () => {
    const g = catchGame('box');
    g.button('Start').click();
    const cell = g.$('.catch-grid').children[0];
    cell.focus();
    g.clock.advance(3);
    assert.equal(g.$('.catch-grid').children[0], cell);
    assert.equal(g.document.activeElement, cell);
    g.button('Pause').click();
    g.button('Resume').click();
    g.clock.advance(2);
    assert.equal(g.$('.catch-grid').children[0], cell);
    assert.equal(g.document.activeElement, cell);
    g.handle.destroy();
});

test('destroying a ready or paused catch cannot spend charms or produce an outcome', () => {
    for (const started of [false, true]) {
        const g = catchGame('throw');
        const start = g.button('Start');
        if (started) { start.click(); g.button('Pause').click(); }
        const resume = g.button('Resume');
        g.handle.destroy();
        start?.click();
        resume?.click();
        g.clock.advance(60);
        assert.equal(g.clock.pending.size, 0);
        assert.equal(g.results.length, 0);
        assert.equal(g.state.items.charm, 8);
    }
});

test('pausing after the deadline settles the expired catch even before the next timer callback', () => {
    for (const mode of ['box', 'throw']) {
        const g = catchGame(mode);
        g.button('Start').click();
        const oldTick = [...g.clock.pending.values()][0].fn;
        g.clock.jump(g.cfg.seconds);
        g.button('Pause').click();
        oldTick();
        assert.equal(g.results.length, 1);
        assert.equal(g.results[0].bonus, 0);
        assert.equal(g.results[0].spent, mode === 'throw' ? 1 : 0);
        assert.equal(g.clock.pending.size, 0);
        g.handle.destroy();
    }
});

test('higher-difficulty Witness keeps its evidence visible during slow reading and correct testimony', () => {
    let clock;
    const g = loadWithDom(['js/core/rift.js', 'js/puzzles/registry.js', ctx => { clock = manualClock(ctx); }, 'js/puzzles/witness.js']);
    const p = g.Rift.Puzzles.get('witness'), data = p.generate(g.Rift.makeRng('slow-witness'), 3);
    const host = g.Rift.el('div'), submitted = [];
    g.document.body.appendChild(host);
    const handle = p.mount(host, data, { el: g.Rift.el, sfx() {}, submit(answer) { submitted.push(answer); return p.check(data, answer); } });
    clock.advance(120);
    const scene = g.$('.wit-scene');
    assert.equal(scene.classList.contains('faded'), false, 'Core evidence must remain readable after 25 seconds');
    for (const line of data.lines) assert.ok(scene.textContent.includes(line));
    assert.match(scene.textContent, /stays visible|read.*again/i);
    assert.equal(clock.pending.size, 0);
    g.$$('.wit-claim').forEach((row, i) => row.querySelectorAll('button').find(b => b.dataset.k === data.claims[i].a).click());
    g.$$('button').find(b => b.textContent === 'Give my testimony').click();
    assert.equal(submitted.length, 1);
    assert.equal(p.check(data, submitted[0]).solved, true);
    handle.destroy();
});
