import test from 'node:test';
import assert from 'node:assert/strict';
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
