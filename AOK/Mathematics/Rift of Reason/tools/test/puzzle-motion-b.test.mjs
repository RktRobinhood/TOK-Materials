// Presentation-only puzzle motion (#66), batch B: logic grid, Venn, village, witness, Liar's Gate,
// rule hunter. Each scenario runs twice: with a recording Rift.Motion stub and with no Rift.Motion
// at all. The motion calls must appear, and what is submitted (and how it checks) must not change.
// Only strings, numbers and booleans are asserted: never a fake-DOM node.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWithDom } from './fake-dom.mjs';

const KINDS = ['play', 'settle', 'nudge', 'reveal', 'glow', 'pop', 'draw', 'cancel'];

function boot(id, withMotion) {
    const g = loadWithDom(['js/core/rift.js', 'js/puzzles/registry.js', 'js/puzzles/' + id + '.js']);
    g.ctx.removeEventListener = () => {};
    const calls = [];
    const order = [];
    if (withMotion) {
        g.Rift.Motion = { calm: () => false };
        KINDS.forEach(kind => {
            g.Rift.Motion[kind] = (node, i) => {
                calls.push(kind + ':' + (node ? String(node.className) : 'null'));
                order.push(typeof i === 'number' ? i : -1);
                return null;
            };
        });
    } else delete g.Rift.Motion;
    const def = g.Rift.Puzzles.get(id);
    const box = g.document.createElement('div');
    g.document.body.appendChild(box);
    const sent = [];
    const results = [];
    const api = data => ({
        el: g.Rift.el, sfx() {}, say() {}, difficulty: 1, rng: g.Rift.makeRng('ui'),
        submit(answer) { sent.push(JSON.stringify(answer)); const r = def.check(data, answer); results.push(JSON.stringify(r)); return r; },
    });
    const buttons = root => root.querySelectorAll('button');
    const button = (root, text) => buttons(root).find(b => b.textContent === text);
    return { g, R: g.Rift, def, box, sent, results, calls, order, api, button };
}

// Run a scenario with and without Motion; return the motion run and assert the answers match.
function both(id, scenario) {
    const quiet = boot(id, false);
    assert.doesNotThrow(() => scenario(quiet), 'runs without Rift.Motion');
    assert.equal(quiet.calls.length, 0);
    const loud = boot(id, true);
    scenario(loud);
    assert.ok(loud.sent.length > 0, 'the scenario submitted an answer');
    assert.equal(loud.sent.join('|'), quiet.sent.join('|'), 'Motion does not change what is submitted');
    assert.equal(loud.results.join('|'), quiet.results.join('|'), 'Motion does not change check()');
    return loud;
}
const count = (calls, s) => calls.filter(c => c === s).length;

test('logic grid: the clicked mark pops, its automatic crosses arrive staggered, a struck clue pops', () => {
    let afterMount = -1, afterTick = -1, autoOrder = '';
    const t = both('logic-grid', s => {
        const data = s.def.generate(s.R.makeRng('motion'), 1);
        s.def.mount(s.box, data, s.api(data));
        afterMount = s.calls.length;
        const grids = s.box.querySelectorAll('.lg-grid');
        ['a', 'b'].forEach((key, k) => {
            const cells = grids[k].querySelectorAll('.lg-cell');
            data.solution[key].forEach((c, r) => {
                cells[r * 3 + c].click();
                cells[r * 3 + c].click();
                if (key === 'a' && r === 0) { afterTick = s.calls.length; autoOrder = s.order.slice(2).join(','); }
            });
        });
        s.box.querySelector('.lg-clue').click();
        s.box.querySelector('.lg-submit').click();
    });
    assert.equal(afterMount, 0, 'nothing animates on mount');
    const first = t.calls.slice(0, afterTick);
    assert.deepEqual(first.slice(0, 2), ['pop:lg-cell lg-x', 'pop:lg-cell lg-v']);
    assert.equal(count(first, 'reveal:lg-cell lg-x'), 4, 'the ✓ crosses out 2 + 2 cells');
    assert.equal(autoOrder, '1,2,3,4', 'auto crosses follow the ✓, staggered');
    assert.equal(t.calls.includes('pop:lg-clue used'), true, 'already on screen: it pops, never blinks out and back');
    assert.equal(JSON.parse(t.results[0]).solved, true);
});

test('venn: a placed x pops; after a wrong check the missing x is revealed', () => {
    let data = null;
    const probe = boot('venn', false);
    for (let i = 0; i < 200 && !data; i++) {
        const d = probe.def.generate(probe.R.makeRng('motion-' + i), 1);
        if (probe.def.solve(d).marks.some(m => m.length === 1)) data = d;
    }
    assert.ok(data, 'found a puzzle whose answer has an x inside one region');
    const sol = probe.def.solve(data);
    const used = new Set(sol.marks.flat());
    let spare = 0;
    while (used.has(spare)) spare++;
    let placed = -1;
    const t = both('venn', s => {
        const d = JSON.parse(JSON.stringify(data));
        s.def.mount(s.box, d, s.api(d));
        assert.equal(s.calls.length, 0);
        s.box.querySelector('.vn-region-select').value = String(spare);
        s.button(s.box, 'Place x in region').click();
        placed = s.calls.length;
        s.button(s.box, sol.valid ? 'Invalid' : 'Valid').click(); // a wrong check
        s.button(s.box, 'Seal the verdict').click();
    });
    assert.equal(t.calls.slice(0, placed).includes('pop:vn-counter-body'), true);
    assert.equal(JSON.parse(t.sent[0]).marks.length, 1);
    assert.equal(JSON.parse(t.results[0]).solved, false);
    assert.equal(count(t.calls, 'reveal:vn-ghost') >= 1, true, 'the ghost x fades in');
});

test('village: a right cell pops; crossed-out worlds are revealed one by one', () => {
    let firstPop = '', manual = 0, all = 0, allOrder = '';
    const t = both('village', s => {
        const data = s.def.generate(s.R.makeRng('motion'), 2);
        assert.equal(data.hiddenRow == null || data.hiddenRow < 0, true, 'no hidden row in this seed');
        const rows = s.def._internal.table(data);
        const n = data.villagers.length;
        s.def.mount(s.box, data, s.api(data));
        s.button(s.box, '📜 Truth table').click();
        assert.equal(s.calls.length, 0);
        const clashRows = rows.map((row, r) => ({ r, c: row.clash.indexOf(true) })).filter(x => x.c >= 0);
        assert.ok(clashRows.length >= 3, 'enough impossible worlds to strike');
        clashRows.forEach(({ r, c }) => {
            s.box.querySelectorAll('.vg-cell')[r * n + c].click();
            s.button(s.box, rows[r].cells[c] ? '✓ True' : '✗ False').click();
        });
        firstPop = s.calls[0] || '';
        const before = s.calls.length;
        clashRows.slice(0, 2).forEach(({ r }) => s.box.querySelectorAll('.vg-poss')[r].click());
        manual = count(s.calls.slice(before), 'reveal:vg-row struck');
        const mid = s.calls.length;
        s.box.querySelector('.vg-strike-all').click();
        all = count(s.calls.slice(mid), 'reveal:vg-row struck');
        allOrder = s.order.slice(mid).join(',');
        const sol = s.def.solve(data);
        data.villagers.forEach((v, i) => { if (sol.imps.includes(v.id)) s.box.querySelectorAll('.vg-figure')[i].click(); });
        s.box.querySelector('.vg-accuse').click();
    });
    assert.match(firstPop, /^pop:vg-cell /);
    assert.equal(manual, 2);
    assert.ok(all >= 1, 'strike all reveals each crossed row');
    assert.equal(allOrder, Array.from({ length: all }, (_, i) => Math.min(i, 7)).join(','));
    assert.equal(JSON.parse(t.results[0]).solved, true);
});

test('witness: wrong rows are revealed one after another after a check', () => {
    let wrongCount = 0;
    const t = both('witness', s => {
        const data = s.def.generate(s.R.makeRng('motion'), 2);
        s.def.mount(s.box, data, s.api(data));
        const rows = s.box.querySelectorAll('.wit-claim');
        data.claims.forEach((c, i) => {
            const k = i < 3 ? (c.a === 'T' ? 'F' : 'T') : c.a;
            rows[i].querySelectorAll('button').find(b => b.dataset.k === k).click();
        });
        wrongCount = 3;
        assert.equal(s.calls.length, 0);
        s.button(s.box, 'Give my testimony').click();
    });
    assert.equal(count(t.calls, 'reveal:wit-claim panel wit-wrong'), wrongCount);
    assert.equal(t.order.join(','), '0,1,2');
    assert.equal(JSON.parse(t.results[0]).solved, false);
});

test("liar's gate: speech bubbles arrive staggered on mount; a switched role token pops its badge", () => {
    let guards = 0, mountCalls = '', mountOrder = '';
    const t = both('liars-gate', s => {
        const data = s.def.generate(s.R.makeRng('motion'), 2);
        guards = data.guards.length;
        s.def.mount(s.box, data, s.api(data));
        mountCalls = s.calls.join('|');
        mountOrder = s.order.join(',');
        const sol = s.def.solve(data);
        // First guess wrong for the first guard, then switch: only the switch pops (a new mark pops in CSS).
        const first = s.box.querySelectorAll('.lg-guard')[0], other = sol.roles[data.guards[0].id] === 'truth' ? 'lie' : 'truth';
        first.querySelector('.lg-mark.' + other).click();
        s.box.querySelectorAll('.lg-guard').forEach((card, i) => {
            card.querySelector('.lg-mark.' + sol.roles[data.guards[i].id]).click();
        });
        s.box.querySelectorAll('.lg-door')[sol.door].click();
        s.box.querySelector('.lg-open').click();
    });
    assert.equal(mountCalls, Array(guards).fill('reveal:lg-bubble').join('|'));
    assert.equal(mountOrder, Array.from({ length: guards }, (_, i) => i).join(','));
    assert.equal(count(t.calls, 'pop:lg-badge'), 1);
    assert.equal(JSON.parse(t.results[0]).solved, true);
});

test('rule hunter: the tally that changed pops after each test', () => {
    let afterYes = '', afterNo = '';
    const t = both('rule-hunter', s => {
        const def = s.def;
        const data = {
            mode: 'rules', difficulty: 2, gatekeeper: 'siuuugull', max: 30, secret: 'all-mult-3',
            example: [3, 6, 9], correct: 0,
            candidates: ['all-mult-3', 'last-largest', 'ascending', 'all-different'].map(id => ({ id, text: def.lib.RULE[id].text })),
        };
        def.mount(s.box, data, { submit: s.api(data).submit });
        const experiment = triple => {
            triple.forEach(n => s.box.querySelectorAll('.rh-src').find(tile => tile.textContent === String(n)).dispatchEvent({ type: 'click', detail: 0 }));
            s.box.querySelector('.rh-test').click();
        };
        experiment([3, 6, 12]);
        afterYes = s.calls.filter(c => c.startsWith('pop:rh-')).join('|');
        experiment([1, 2, 4]);
        afterNo = s.calls.filter(c => c.startsWith('pop:rh-')).join('|');
        s.box.querySelector('.rh-name-btn').click();
        s.box.querySelectorAll('.rh-cand')[0].click();
        s.button(s.box, 'This is the rule').click();
    });
    assert.equal(afterYes, 'pop:rh-yes');
    assert.equal(afterNo, 'pop:rh-yes|pop:rh-no');
    assert.equal(t.sent.length >= 1, true);
});
