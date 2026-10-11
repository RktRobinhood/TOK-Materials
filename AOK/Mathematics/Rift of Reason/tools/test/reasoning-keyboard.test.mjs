// #80: construct and repair real reasoning tools with native keyboard controls.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWithDom } from './fake-dom.mjs';

const plain = value => JSON.parse(JSON.stringify(value));
function setup(id, difficulty = 2, choose = () => true) {
    const g = loadWithDom(['js/core/rift.js', 'js/puzzles/registry.js', 'js/puzzles/' + id + '.js']);
    const createElement = g.document.createElement;
    g.document.createElement = tag => {
        const node = createElement(tag);
        if (node.tagName === 'SELECT') {
            // Native selects cannot select a value before its option exists.
            let selected = '';
            Object.defineProperty(node, 'value', {
                get() { const options = node.querySelectorAll('option'); return options.some(option => option.value === selected) ? selected : options[0]?.value || ''; },
                set(value) { selected = node.querySelectorAll('option').some(option => option.value === String(value)) ? String(value) : ''; },
            });
        }
        return node;
    };
    const createSvg = g.document.createElementNS;
    g.document.createElementNS = (namespace, tag) => {
        const node = createSvg(namespace, tag);
        if (node.tagName === 'SVG') {
            node.getScreenCTM = () => ({ a: 1, inverse() { return this; } });
            node.createSVGPoint = () => ({ x: 0, y: 0, matrixTransform() { return { x: this.x, y: this.y }; } });
        }
        return node;
    };
    const documentListeners = new Map();
    g.document.addEventListener = (type, callback) => { const callbacks = documentListeners.get(type) || []; callbacks.push(callback); documentListeners.set(type, callbacks); };
    g.document.removeEventListener = (type, callback) => documentListeners.set(type, (documentListeners.get(type) || []).filter(fn => fn !== callback));
    g.document.dispatchEvent = event => { for (const callback of documentListeners.get(event.type) || []) callback(event); };
    g.ctx.addEventListener = () => {};
    g.ctx.removeEventListener = () => {};
    const def = g.Rift.Puzzles.get(id);
    let data;
    for (let i = 0; i < 500; i++) {
        const candidate = def.generate(g.Rift.makeRng('keyboard-' + i), difficulty);
        if (choose(candidate)) { data = candidate; break; }
    }
    assert.ok(data, 'test variant found');
    const host = g.Rift.el('div'); g.document.body.append(host);
    const submitted = [];
    const handle = def.mount(host, data, { el: g.Rift.el, sfx() {}, submit: answer => { submitted.push(plain(answer)); return def.check(data, answer); } });
    const button = text => g.$$('button').find(node => node.textContent === text);
    const named = name => g.$$('[aria-label]').find(node => node.getAttribute('aria-label') === name);
    function press(node, key = 'Enter', repeat = false) {
        assert.ok(node, 'keyboard control exists'); node.focus();
        const event = { type: 'keydown', key, repeat, preventDefault() { this.defaultPrevented = true; }, stopPropagation() { this._stop = true; } };
        node.dispatchEvent(event);
        if (!event.defaultPrevented && !repeat && node.tagName === 'BUTTON' && !node.disabled && ['Enter', ' '].includes(key)) node.click();
        if (!event.defaultPrevented && !repeat && node.tagName === 'SUMMARY' && ['Enter', ' '].includes(key)) node.parentNode.open = !node.parentNode.open;
        return event;
    }
    // Native select Arrow keys change the selection and dispatch change in the browser.
    function select(node, value) {
        assert.ok(node, 'named native select exists'); assert.equal(node.tagName, 'SELECT'); node.focus();
        const options = node.querySelectorAll('option');
        const goal = options.findIndex(option => String(option.value) === String(value));
        assert.ok(goal >= 0, 'requested keyboard selection is offered: ' + value);
        let current = Math.max(0, options.findIndex(option => String(option.value) === String(node.value)));
        while (current !== goal) { const delta = current < goal ? 1 : -1; press(node, delta > 0 ? 'ArrowDown' : 'ArrowUp'); current += delta; node.value = options[current].value; node.dispatchEvent({ type: 'change' }); }
    }
    const pointer = (node, type, point, detail = 1) => node.dispatchEvent({ type, clientX: point.x, clientY: point.y, button: 0, pointerId: 1, detail,
        preventDefault() { this.defaultPrevented = true; }, stopPropagation() { this._stop = true; } });
    return { g, def, data, handle, submitted, button, named, press, select, pointer };
}

test('Venn keyboard controls name every region, shade/unshade, place/move/remove and cancel x markings', () => {
    const t = setup('venn', 1, data => tMarks(data));
    t.press(t.g.$('.vn-keyboard-summary'));
    assert.equal(t.g.$('.vn-keyboard').open, true);
    const region = t.named('Diagram region'), border = t.named('Uncertain border'), marks = t.named('Existing x');
    assert.equal(region.querySelectorAll('option').length, 1 << t.data.terms.length);
    for (const option of region.querySelectorAll('option')) for (const term of t.data.terms) assert.ok(option.textContent.includes(term.label), 'membership names ' + term.label);
    t.select(region, '5'); t.press(t.button('Shade or unshade region'), ' ');
    assert.deepEqual(plain(t.handle.answer().shading), [5]);
    t.press(t.button('Shade or unshade region'));
    assert.deepEqual(plain(t.handle.answer().shading), []);
    t.press(t.button('Place x in region'));
    assert.deepEqual(plain(t.handle.answer().marks), [[5]]);
    t.press(t.button('Move selected x')); t.select(region, '7'); t.press(region, 'Escape');
    assert.deepEqual(plain(t.handle.answer().marks), [[5]], 'cancel keeps the original x');
    t.press(t.button('Move selected x')); t.press(t.button('Place x in region'));
    assert.deepEqual(plain(t.handle.answer().marks), [[7]]);
    t.select(border, '5,7'); t.press(t.button('Move selected x')); t.press(t.button('Place x on border'));
    assert.deepEqual(plain(t.handle.answer().marks), [[5, 7]], 'on-border x keeps both possibilities');
    assert.ok(marks.querySelector('option').textContent.includes('unknown'));
    t.press(t.button('Remove selected x'), ' ');
    assert.deepEqual(plain(t.handle.answer().marks), []);
});
function tMarks(data) { return data.kind === 'classic' && data.terms[0].key === 'giovanni' && data.premises[1].q === 'is'; }

test('Venn selects the new second x after its option exists, so removal keeps the first x', () => {
    const t = setup('venn', 1, tMarks);
    t.press(t.g.$('.vn-keyboard-summary'));
    const region = t.named('Diagram region'), marks = t.named('Existing x');
    t.select(region, '5'); t.press(t.button('Place x in region'));
    const firstId = marks.value;
    t.select(region, '7'); t.press(t.button('Place x in region'));
    assert.notEqual(marks.value, firstId, 'the new x is selected after rendering its option');
    t.press(t.button('Remove selected x'));
    assert.deepEqual(plain(t.handle.answer().marks), [[5]]);
    assert.equal(marks.value, firstId);
    assert.equal(t.g.document.activeElement, marks, 'remaining marks keep useful focus');
});

test('a Venn pointer drag cancels a keyboard move and the next keyboard placement adds a new x', () => {
    const t = setup('venn', 1, tMarks);
    t.press(t.g.$('.vn-keyboard-summary'));
    t.select(t.named('Diagram region'), '5'); t.press(t.button('Place x in region'));
    t.press(t.button('Move selected x'));
    const geometry = t.def.engine.geometry(3);
    t.pointer(t.g.$('.vn-counter'), 'pointerdown', geometry.anchors[5]);
    t.pointer(t.g.document, 'pointermove', geometry.anchors[7]);
    t.pointer(t.g.document, 'pointerup', geometry.anchors[7]);
    assert.deepEqual(plain(t.handle.answer().marks), [[7]]);
    assert.equal(t.button('Cancel move').disabled, true);
    t.press(t.button('Place x in region'));
    assert.deepEqual(plain(t.handle.answer().marks), [[7], [5]]);
    t.press(t.button('Remove selected x'));
    assert.deepEqual(plain(t.handle.answer().marks), [[7]], 'the new keyboard mark is selected');
});

test('Venn keyboard construction can build the full solution including a four-set diagram', () => {
    const t = setup('venn', 3, data => data.terms.length === 4);
    t.press(t.g.$('.vn-keyboard-summary'));
    const solution = t.def.solve(t.data);
    for (const r of solution.shading) { t.select(t.named('Diagram region'), r); t.press(t.button('Shade or unshade region')); }
    for (const mark of solution.marks) {
        const split = mark.length === 2;
        t.select(t.named(split ? 'Uncertain border' : 'Diagram region'), split ? mark.join(',') : mark[0]);
        t.press(t.button(split ? 'Place x on border' : 'Place x in region'));
    }
    assert.deepEqual(plain(t.handle.answer().shading), plain(solution.shading));
    assert.deepEqual(plain(t.handle.answer().marks), plain(solution.marks));
    t.press(t.button(solution.valid ? 'Valid' : 'Invalid'));
    const evidence = { supported: 'All supported', refuted: 'At least one refuted', unknown: 'Not enough evidence' };
    t.press(t.button(evidence[solution.premisesEvidence])); t.press(t.button('Seal the verdict'));
    assert.equal(t.submitted.length, 1);
    assert.equal(t.def.check(t.data, t.submitted[0]).diagram.perfect, true);
});

test('every generated uncertain existence mark has an offered geometric border destination', () => {
    const t = setup('venn', 3);
    for (const difficulty of [1, 2, 3]) for (let i = 0; i < 300; i++) {
        const data = t.def.generate(t.g.Rift.makeRng('accessible-border-' + i), difficulty);
        const destinations = t.def.engine.geometry(data.terms.length).borders;
        for (const mark of t.def.solve(data).marks) if (mark.length === 2) assert.ok(destinations[mark.join(',')], data.conclusion.text + ': missing ' + mark.join(','));
    }
});

test('Switchboard keyboard sockets can cancel, wire the complete circuit, unplug and repair it', () => {
    const t = setup('switchboard', 2, data => data.mode === 'wire');
    const socket = key => t.g.$('[data-key="' + key + '"]');
    for (const node of t.g.$$('.sb-sock')) { assert.equal(node.tagName, 'BUTTON'); assert.match(node.getAttribute('aria-label'), /input|output/); }
    t.press(socket('S0:out')); assert.equal(socket('S0:out').getAttribute('aria-pressed'), 'true');
    t.press(socket('S0:out'), 'Escape'); assert.equal(socket('S0:out').getAttribute('aria-pressed'), 'false');
    const solution = t.def.solve(t.data);
    const wire = (from, to) => { t.press(socket(from + ':out')); t.press(socket(to), ' '); };
    Object.entries(solution.inputs).forEach(([id, sources]) => sources.forEach((source, i) => { if (source) wire(source, id + ':in' + i); }));
    wire(solution.bulb, 'BULB:in');
    assert.match(socket('BULB:in').getAttribute('aria-label'), /connected/i);
    t.press(socket('BULB:in'), 'Delete');
    assert.ok(!socket('BULB:in').classList.contains('filled'));
    wire(solution.bulb, 'BULB:in');
    t.press(t.button('✓ Check my wiring'));
    assert.equal(t.submitted.length, 1);
    for (const [id, inputs] of Object.entries(solution.inputs)) assert.deepEqual(t.submitted[0].inputs[id], plain(inputs));
    for (const [id, inputs] of Object.entries(t.submitted[0].inputs)) if (!(id in solution.inputs)) assert.ok(inputs.every(input => input === null), 'unused gate stays unwired');
    assert.equal(t.def.check(t.data, t.submitted[0]).solved, true);
});

test('Switchboard named switch buttons toggle using Enter and Space without rewiring', () => {
    const t = setup('switchboard', 1, data => data.mode === 'light');
    const solution = t.def.solve(t.data);
    const switches = t.g.$$('.sb-toggle');
    assert.equal(switches.length, t.data.switches.length);
    switches.forEach((button, i) => { assert.ok(button.getAttribute('aria-label').includes(t.data.switches[i].claim)); assert.equal(button.getAttribute('aria-pressed'), 'false'); });
    t.press(switches[0], ' '); assert.equal(switches[0].getAttribute('aria-pressed'), 'true');
    t.press(switches[0]); assert.equal(switches[0].getAttribute('aria-pressed'), 'false');
    solution.on.forEach((on, i) => { if (on) t.press(switches[i], i % 2 ? ' ' : 'Enter'); });
    t.press(t.button('✓ These are enough'));
    assert.deepEqual(t.submitted[0].on, plain(solution.on));
    assert.equal(t.def.check(t.data, t.submitted[0]).solved, true);
});

test('Switchboard pointer wiring and keyboard selection share state without toggling input switches', () => {
    const t = setup('switchboard', 2, data => data.mode === 'wire');
    const socket = key => t.g.$('[data-key="' + key + '"]');
    const board = t.g.$('.sb-board'), destination = t.data.palette[0].id + ':in0';
    const origin = { x: 0, y: 0 }, drop = { x: 30, y: 20 };
    gPoint(socket(destination));
    function gPoint(node) { t.g.document.elementFromPoint = () => node; }
    t.press(socket('S0:out'));
    t.pointer(socket('S1:out'), 'pointerdown', origin);
    t.pointer(board, 'pointermove', drop);
    t.pointer(board, 'pointerup', drop);
    t.pointer(socket('S1:out'), 'click', drop, 1);
    assert.equal(socket('S0:out').getAttribute('aria-pressed'), 'false', 'drag clears the older pending selection');
    assert.equal(socket(destination).classList.contains('filled'), true);
    assert.equal(t.g.$$('.sb-toggle')[1].getAttribute('aria-pressed'), 'false', 'socket events never toggle its switch');
    t.press(socket('S0:out')); t.press(socket('S0:out'), 'Escape');
    t.press(t.button('✓ Check my wiring'));
    assert.equal(t.submitted[0].inputs[t.data.palette[0].id][0], 'S1');
    gPoint(socket(destination));
    t.pointer(socket(destination), 'pointerdown', origin);
    t.pointer(board, 'pointerup', origin);
    t.pointer(socket(destination), 'click', origin, 1);
    assert.equal(socket(destination).classList.contains('filled'), false, 'pointer click still unplugs an input');
});
