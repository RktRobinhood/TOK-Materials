// Puzzle motion (#66), group A: river-crossing, water-jugs, switchboard, line-drawer, tower.
// Each puzzle is driven by real clicks twice: once with a recording Rift.Motion stub and once
// without Rift.Motion at all. The motion calls must happen, nothing may throw without Motion,
// and what the puzzle submits must be identical either way (animation is presentation only).
// Only strings, numbers and booleans are asserted (never fake-DOM nodes).
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWithDom, FakeElement } from './fake-dom.mjs';

function motionStub(calls) {
    const rec = kind => node => { calls.push(kind + ':' + (node && node.className)); return null; };
    return { calm: () => false, play: rec('play'), settle: rec('settle'), nudge: rec('nudge'), reveal: rec('reveal'), glow: rec('glow'), pop: rec('pop'), draw: rec('draw'), cancel() {} };
}

// Mounts puzzle `id` in a fresh fake DOM and runs drive(box, data, def, g); returns what was sent.
function run(id, withMotion, pick, drive) {
    const g = loadWithDom(['js/core/rift.js', 'js/puzzles/registry.js', 'js/puzzles/' + id + '.js']);
    g.ctx.addEventListener = () => {};
    g.ctx.removeEventListener = () => {};
    const R = g.Rift, def = R.Puzzles.get(id);
    const calls = [];
    if (withMotion) R.Motion = motionStub(calls);
    const data = pick(def, R);
    const sent = [];
    const box = g.document.createElement('div');
    g.document.body.appendChild(box);
    def.mount(box, data, { submit: a => { sent.push(a); return def.check(data, a); }, sfx() {}, say() {}, rng: R.makeRng('ui'), difficulty: data.difficulty || 1, el: R.el });
    drive(box, data, def, g);
    return { calls, sent: JSON.stringify(sent), results: JSON.stringify(sent.map(a => def.check(data, a))) };
}

// Runs with and without Motion and checks the answers match.
function both(id, pick, drive) {
    const plain = run(id, false, pick, drive);
    const moving = run(id, true, pick, drive);
    assert.ok(plain.sent.length > 2, 'something was submitted');
    assert.equal(moving.sent, plain.sent, 'same answers with and without motion');
    assert.equal(moving.results, plain.results, 'same check results with and without motion');
    moving.calls.solved = /"solved":true/.test(plain.results);
    return moving.calls;
}

const has = (calls, prefix) => calls.some(c => c.startsWith(prefix));
const findSeed = (def, R, name, d, ok) => {
    for (let s = 0; s < 400; s++) { const data = def.generate(R.makeRng(name + s), d); if (ok(data)) return data; }
    throw new Error('no seed for ' + name);
};

// FLIP needs real-looking boxes: place things by the classes of their ancestors.
function withBoxes(fn) {
    const proto = FakeElement.prototype;
    const original = proto.getBoundingClientRect;
    proto.getBoundingClientRect = function () {
        let left = 0;
        const inWater = !!this.closest('.rc-water');
        for (let n = this; n && n.classList; n = n.parentNode) {
            if (n.classList.contains('rc-far')) left += 300;
            if (n.classList.contains('rc-boat')) left += 100;
            if (inWater && n.classList.contains('rc-at-far')) left += 50;
        }
        return { left, top: 0, right: left + 100, bottom: 100, width: 100, height: 100 };
    };
    try { return fn(); } finally { proto.getBoundingClientRect = original; }
}

test('Motion A: river crossing glides the boat and moved creatures, and nudges a named clash', () => withBoxes(() => {
    const pick = (def, R) => def.generate(R.makeRng('motion-rc'), 1);
    const token = (box, data, id) => box.querySelectorAll('.rc-token').find(b => b.title === data.cast.find(c => c.id === id).name);
    const row = box => box.querySelector('.rc-row').click();
    const solved = both('river-crossing', pick, (box, data) => {
        data.plan.forEach(trip => { trip.forEach(id => token(box, data, id).click()); row(box); });
    });
    assert.equal(solved.solved, true, 'the plan solves the puzzle');
    assert.ok(has(solved, 'play:rc-boat'), 'the boat glides: ' + solved.join(' '));
    assert.ok(has(solved, 'play:rc-token'), 'a creature that changed bank glides');
    const clash = both('river-crossing', pick, box => row(box)); // rowing away alone leaves rivals together
    assert.equal(clash.solved, false);
    assert.equal(clash.filter(c => c.startsWith('nudge:rc-token')).length, 2, 'both named rivals are nudged once');
}));

test('Motion A: water jugs show the pour direction and settle the goal ladle', () => {
    const calls = both('water-jugs', (def, R) => findSeed(def, R, 'motion-wj', 2, d => d.possible && d.plan.some(m => m[0] === 'pour')), (box, data) => {
        const cards = box.querySelectorAll('.wj-jug');
        const btn = (root, t) => root.querySelectorAll('button').find(b => b.textContent === t);
        for (const m of data.plan) btn(cards[m[1]], m[0] === 'fill' ? 'Fill' : m[0] === 'empty' ? 'Empty' : 'Pour into ' + data.caps[m[2]]).click();
    });
    assert.equal(calls.solved, true);
    assert.ok(has(calls, 'glow:wj-glass'), 'the acted ladle glows: ' + calls.join(' '));
    assert.ok(has(calls, 'settle:wj-glass'), 'the poured-into ladle settles');
    assert.ok(has(calls, 'settle:wj-jug wj-hit'), 'the ladle with the goal amount settles');
});

test('Motion A: switchboard pops levers, lights the bulb, and draws new wires', () => {
    const light = both('switchboard', (def, R) => findSeed(def, R, 'motion-sb', 1, d => d.mode === 'light'), (box, data, def) => {
        const levers = box.querySelectorAll('.sb-toggle');
        def.solve(data).on.forEach((on, i) => { if (on) levers[i].click(); });
        box.querySelector('.sb-controls .gold').click();
    });
    assert.equal(light.solved, true);
    assert.ok(has(light, 'pop:sb-leverbox'), 'a flipped lever pops: ' + light.join(' '));
    assert.ok(has(light, 'glow:sb-bulbbox'), 'the bulb glows when it lights');

    const proto = FakeElement.prototype, original = proto.getBoundingClientRect;
    proto.getBoundingClientRect = () => ({ left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100 });
    let wire;
    try {
        wire = both('switchboard', (def, R) => findSeed(def, R, 'motion-sbw', 2, d => d.mode === 'wire'), (box, data, def) => {
            const sock = key => box.querySelectorAll('.sb-sock').find(s => s.dataset.key === key).click();
            const plan = def.solve(data);
            Object.keys(plan.inputs).forEach(id => plan.inputs[id].forEach((src, j) => { if (src) { sock(src + ':out'); sock(id + ':in' + j); } }));
            sock(plan.bulb + ':out'); sock('BULB:in');
            box.querySelector('.sb-controls .gold').click();
        });
    } finally { proto.getBoundingClientRect = original; }
    assert.equal(wire.solved, true);
    assert.ok(has(wire, 'draw:sb-wire'), 'a new wire draws itself: ' + wire.join(' '));
});

test('Motion A: line drawer draws the newest line and pops the full counter', () => {
    const press = (box, p) => {
        const svg = box.querySelector('svg');
        svg.getScreenCTM = () => ({ a: 50, inverse: () => null });
        svg.createSVGPoint = () => ({ x: 0, y: 0, matrixTransform() { return { x: this.x, y: this.y }; } });
        svg.dispatchEvent({ type: 'pointerdown', clientX: p[0], clientY: p[1], button: 0, pointerId: 1, preventDefault() {} });
        svg.dispatchEvent({ type: 'pointerup' });
    };
    const dots = both('line-drawer', (def, R) => findSeed(def, R, 'motion-ld', 1, d => d.mode === 'dots' && d.known.length - 1 === d.maxLines),
        (box, data) => data.known.forEach(p => press(box, p)));
    assert.equal(dots.solved, true);
    assert.ok(has(dots, 'draw:ld-ink'), 'the newest chalk line draws itself: ' + dots.join(' '));
    assert.ok(has(dots, 'pop:ld-count full'), 'the counter pops when the last line is used');

    const graph = both('line-drawer', (def, R) => findSeed(def, R, 'motion-ldg', 1, d => d.mode === 'graph' && def.solve(d).type === 'path'),
        (box, data, def) => def.solve(data).vertices.forEach(v => press(box, data.vertices[v])));
    assert.equal(graph.solved, true);
    assert.ok(has(graph, 'draw:ld-edge used'), 'the traced edge draws itself: ' + graph.join(' '));
});

test('Motion A: tower settles cemented blocks and pops changed chips and pips', () => {
    const calls = both('tower', (def, R) => def.generate(R.makeRng('motion-tw'), 1), (box, data, def) => {
        const next = () => box.querySelector('.tw-next').click();
        next(); // Begin the questioning
        def.solve(data).forEach((id, qi) => {
            const k = data.questions[qi].answers.findIndex(a => a.id === id);
            box.querySelectorAll('.tw-answer')[k].click();
            next(); // Next question, or Finish
        });
    });
    assert.equal(calls.solved, true);
    assert.ok(has(calls, 'settle:tw-block'), 'a cemented block settles: ' + calls.join(' '));
    assert.ok(has(calls, 'pop:chip'), 'a changed stats chip pops');
    assert.ok(has(calls, 'pop:tw-pip'), 'a changed progress pip pops');
    assert.equal(calls.filter(c => !/^(settle|pop):/.test(c)).length, 0, 'only settle and pop in the tower');
});
