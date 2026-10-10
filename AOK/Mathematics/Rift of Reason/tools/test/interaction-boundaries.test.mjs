// #67: drive mounted controls through document capture and browser-like key defaults.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWithDom } from './fake-dom.mjs';

const drain = async () => { for (let i = 0; i < 16; i++) await Promise.resolve(); };

function setup() {
    const g = loadWithDom(['js/core/rift.js']);
    const records = new WeakMap();
    const doc = g.document;
    function events(node) {
        records.set(node, []);
        node.addEventListener = (type, fn, opts) => records.get(node).push({ type, fn, capture: opts === true || !!(opts && opts.capture) });
        node.removeEventListener = (type, fn) => records.set(node, records.get(node).filter(x => x.type !== type || x.fn !== fn));
        node.dispatchEvent = event => {
            event.target = node;
            event.preventDefault = () => { event.defaultPrevented = true; };
            event.stopPropagation = () => { event.stopped = true; };
            event.stopImmediatePropagation = () => { event.stopped = true; event.immediate = true; };
            const path = [];
            for (let n = node; n; n = n.parentNode) path.push(n);
            if (path.includes(doc.body)) path.push(doc);
            const fire = (n, capture) => {
                event.currentTarget = n;
                for (const x of [...(records.get(n) || [])]) {
                    if (x.type === event.type && x.capture === capture) x.fn(event);
                    if (event.immediate) break;
                }
            };
            for (const n of [...path].reverse()) { fire(n, true); if (event.stopped) break; }
            if (!event.stopped) for (const n of path) { fire(n, false); if (event.stopped) break; }
            return !event.defaultPrevented;
        };
        node.click = () => { if (!node.disabled) node.dispatchEvent({ type: 'click', button: 0, detail: 1 }); };
        return node;
    }
    events(doc); events(doc.body);
    const create = doc.createElement;
    doc.createElement = tag => events(create(tag));
    doc.createElementNS = (ns, tag) => doc.createElement(tag);
    let now = 1000, serial = 0;
    const timers = new Map();
    g.ctx.Date = class extends Date { static now() { return now; } };
    g.ctx.setTimeout = (fn, ms = 0) => { timers.set(++serial, { fn, at: now + ms }); return serial; };
    g.ctx.clearTimeout = id => timers.delete(id);
    g.ctx.setInterval = () => ++serial;
    g.ctx.clearInterval = () => {};
    g.ctx.performance = { now: () => now };
    g.ctx.requestAnimationFrame = () => 1; // map's real hidden-tab walk fallback
    async function advance(ms) {
        const end = now + ms;
        for (;;) {
            const next = [...timers].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
            if (!next) break;
            timers.delete(next[0]); now = next[1].at; next[1].fn(); await drain();
        }
        now = end; await drain();
    }
    const { Rift } = g;
    const screen = Rift.el('div', { id: 'screen' }), overlay = Rift.el('div', { id: 'overlay' });
    // FakeElement's id property does not reflect to its attribute.
    screen.setAttribute('id', 'screen'); overlay.setAttribute('id', 'overlay');
    doc.body.append(screen, overlay);
    ['js/core/state.js', 'js/core/world.js', 'js/core/story.js', 'js/core/cast.js', 'js/core/router.js',
        'data/avatars.js', 'data/items.js', 'data/creatures.js', 'data/map.js', 'js/puzzles/registry.js'].forEach(g.run);
    const state = Rift.State.freshState();
    state.avatar = { type: 'owlet', variant: 'boy', nickname: 'Tester' };
    state.map.revealed = Object.keys(Rift.data.map.nodes);
    state.flags['story-battle-won'] = true;
    state.tutorialsSeen.village = true;
    Rift.State.get = () => state;
    Rift.State.save = () => {};
    Rift.State.update = fn => { fn(state); Rift.bus.emit('state:changed', state); };
    Rift.Assets = { has: () => false, frames: () => null, src: id => id, url: id => id,
        img: (id, opts) => Rift.el('img', { src: id, className: opts && opts.className }) };
    Rift.Audio = { sfx() {}, speak() {}, stopVoice() {} };
    Rift.Battles = { canChallenge: () => false };
    Rift.data.speakers = { narrator: { name: 'Narrator', art: 'narrator' } };
    Rift.data.script = {};
    ['js/ui/ui.js', 'js/ui/dialogue.js', 'js/ui/tutorial.js', 'js/puzzles/village.js', 'js/screens/encounter.js', 'js/screens/map.js'].forEach(g.run);
    const click = (node, detail = 1) => { assert.ok(node, 'click target exists'); if (!node.disabled) node.dispatchEvent({ type: 'click', button: 0, detail }); };
    const key = (node, value, repeat = false, type = 'keydown') => {
        const event = { type, key: value, repeat };
        node.dispatchEvent(event);
        if (type === 'keydown' && !event.defaultPrevented && node.tagName === 'BUTTON' && (value === 'Enter' || value === ' ')) click(node, 0);
        return event;
    };
    const button = text => g.$$('button').find(n => n.textContent === text);
    return { g, Rift, state, screen, overlay, click, key, button, advance };
}

test('a first-time modal owns Enter while an underlying dialogue is still open', async () => {
    const t = setup();
    t.Rift.Dialogue.play([{ note: 'Covered line.' }, { note: 'Second line.' }]);
    await t.advance(500);
    const external = t.Rift.el('button', { text: 'Map location' }); t.screen.append(external);
    t.Rift.UI.modal('First time here?', t.Rift.el('p', { text: 'Would you like a tour?' }), [{ label: 'Close' }]);
    t.key(external, 'Enter'); await drain();
    assert.equal(t.g.$('.dialogue .text').textContent, 'Covered line.');
    assert.ok(t.g.$('.modal-backdrop'));
    t.click(t.button('Close')); await t.advance(500);
    t.key(external, 'Enter'); await drain();
    assert.ok(t.g.$('.dialogue'), 'uncovered dialogue can still advance');
    assert.notEqual(t.g.$('.dialogue .text').textContent, 'Covered line.');
});

test('held Enter cannot reveal or advance the next dialogue line', async () => {
    const t = setup();
    const marker = t.Rift.el('button', { text: 'Map location' }); t.screen.append(marker);
    t.Rift.Dialogue.play([{ note: 'First line.' }, { note: 'Second line.' }]);
    await t.advance(500);
    t.key(marker, 'Enter'); await drain();
    const next = t.g.$('.dialogue .text').textContent;
    for (let i = 0; i < 5; i++) t.key(marker, 'Enter', true);
    await drain();
    assert.ok(t.g.$('.dialogue'));
    assert.equal(t.g.$('.dialogue .text').textContent, next);
});

test('only the newest of two dialogue layers advances, then the older one resumes', async () => {
    const t = setup();
    const marker = t.Rift.el('button', { text: 'Map marker' }); t.screen.append(marker);
    t.Rift.Dialogue.play([{ note: 'Older line.' }]);
    t.Rift.Dialogue.play([{ note: 'Top line.' }]);
    await t.advance(500);
    t.key(marker, 'Enter'); await drain();
    assert.equal(t.g.$$('.dialogue-layer').length, 1);
    assert.equal(t.g.$('.dialogue .text').textContent, 'Older line.');
    await t.advance(500); t.key(marker, 'Enter'); await drain();
    assert.equal(t.g.$$('.dialogue-layer').length, 0);
});

test('dialogue choices receive focus and Tab stays inside the current choices', async () => {
    const t = setup();
    const marker = t.Rift.el('button', { text: 'Map marker' }); t.screen.append(marker); marker.focus();
    t.Rift.Dialogue.play([{ choice: [{ t: 'Stay', flag: 'choice-stay' }, { t: 'Go', flag: 'choice-go' }] }]);
    assert.equal(t.g.document.activeElement, t.button('Stay'));
    t.button('Go').focus(); t.key(t.button('Go'), 'Tab');
    assert.equal(t.g.document.activeElement, t.button('Stay'));
    const back = { type: 'keydown', key: 'Tab', shiftKey: true }; t.button('Stay').dispatchEvent(back);
    assert.equal(t.g.document.activeElement, t.button('Go'));
    marker.focus(); t.key(marker, 'Tab');
    assert.equal(t.g.document.activeElement, t.button('Stay'), 'external focus returns to choices');
    t.key(t.button('Stay'), 'Enter'); await drain();
    assert.equal(t.state.flags['choice-stay'], true);
    assert.equal(t.state.flags['choice-go'], undefined);
});

test('a fast second click from a dialogue line cannot choose the newly shown story option', async () => {
    const t = setup();
    t.Rift.Dialogue.play([{ note: 'Choose after this line.' }, { choice: [
        { t: 'First option', flag: 'fast-choice-selected' }, { t: 'Second option' },
    ] }]);
    await t.advance(1000); t.click(t.g.$('.dialogue .box')); await drain();
    await t.advance(50); t.click(t.button('First option'), 2); await drain();
    assert.equal(t.state.flags['fast-choice-selected'], undefined);
    assert.ok(t.g.$('.choices'));
    await t.advance(600); t.click(t.button('First option')); await drain();
    assert.equal(t.state.flags['fast-choice-selected'], true);
});

test('a modal opened above a tutorial owns Escape and Tab until it closes', async () => {
    const t = setup();
    let tourClosed = 0;
    t.Rift.Tutorial.play(t.screen, [{ text: 'Tour step.' }], 'narrator', { onClose: () => tourClosed++ });
    t.Rift.UI.modal('Rules', t.Rift.el('p', { text: 'Read these.' }), [{ label: 'Close' }]);
    const modal = t.g.$('.modal-backdrop');
    assert.ok(+modal.style.zIndex > +t.g.$('.tutorial-layer').style.zIndex);
    t.button('Close').focus(); t.key(t.button('Close'), 'Tab');
    assert.ok(modal.contains(t.g.document.activeElement));
    t.key(t.g.document.activeElement, 'Escape'); await drain();
    assert.equal(t.g.$('.modal-backdrop'), null);
    assert.equal(tourClosed, 0);
    await t.advance(500); t.button('Ready').focus(); t.key(t.button('Ready'), 'Escape'); await drain();
    assert.equal(tourClosed, 1);
});

function square(t) {
    t.Rift.data.map.nodes['test-square'] = { id: 'test-square', chapter: 'ch2', type: 'puzzle', name: 'Village Square',
        host: 'narrator', script: 'test-square', links: [], puzzles: [{ id: 'village', difficulty: 1, opts: { fixed: 'square', lead: false } }] };
    t.Rift.data.script['test-square'] = [{ note: 'Inspect the board.' }];
    t.state.map.at = 'test-square';
    t.Rift.Router.replace('encounter', { nodeId: 'test-square' });
}

test('a fast second click after the mounted Square introduction cannot submit the new puzzle', async () => {
    const t = setup(); square(t);
    await t.advance(1000);
    t.click(t.g.$('.dialogue .box')); await drain();
    const submit = t.button('Nobody is an imp!');
    assert.ok(submit, 'real Village puzzle is mounted after dialogue');
    await t.advance(50); t.click(submit, 2); await drain();
    assert.equal(t.state.stats.puzzlesSolved, 0);
    assert.equal(t.state.health, 5);
    await t.advance(600); t.click(submit); await drain();
    assert.equal(t.state.stats.puzzlesSolved, 1, 'a later deliberate answer works');
});

test('the tutorial owns clicks and Escape above the live Village puzzle and dialogue', async () => {
    const t = setup(); square(t); await t.advance(1000);
    t.click(t.g.$('.dialogue .box')); await t.advance(600);
    t.Rift.Dialogue.play([{ note: 'Covered court line.' }]); await t.advance(500);
    let closed = 0;
    t.Rift.Tutorial.play(t.screen, [{ text: 'Use the board.', highlight: '.village' }], 'narrator', { onClose: () => closed++ });
    t.click(t.button('Nobody is an imp!')); await drain();
    assert.equal(t.state.stats.puzzlesSolved, 0);
    t.key(t.button('Ready'), 'Escape'); await drain();
    assert.equal(closed, 1);
    assert.ok(t.g.$('.dialogue'));
    assert.equal(t.g.$('.tutorial-layer'), null);
});

function map(t, params = {}, direct = false) {
    t.state.map.at = 'burrow';
    t.Rift.data.map.nodes.burrow.repeat = true;
    t.Rift.data.script[t.Rift.data.map.nodes.burrow.script] = [{ note: 'Corvina speaks.' }];
    if (direct) return t.Rift.Screens.get('map').mount(t.screen, params);
    t.Rift.Router.replace('map', params);
}

test('map clicks during a pending automatic arrival cannot create a second dialogue or chapter jump', async () => {
    const t = setup(); const handle = map(t, { arrive: true }, true);
    await t.advance(50);
    t.click(t.g.$('[data-node="burrow"]'));
    t.click(t.button('🌀 Time rift'));
    await t.advance(800);
    assert.equal(t.g.$$('.dialogue-layer').length, 1);
    assert.equal(t.g.$('.modal-backdrop'), null);
    handle.destroy();
});

test('held Enter after a map scene ends cannot reopen that same station', async () => {
    const t = setup(); map(t); await t.advance(600);
    t.click(t.g.$('[data-node="burrow"]')); await drain(); await t.advance(500);
    t.key(t.g.$('[data-node="burrow"]'), 'Enter'); await drain();
    assert.equal(t.g.$$('.dialogue-layer').length, 0);
    await t.advance(600);
    t.key(t.g.$('[data-node="burrow"]'), 'Enter', true); await drain();
    assert.equal(t.g.$$('.dialogue-layer').length, 0);
    t.key(t.g.$('[data-node="burrow"]'), 'Enter'); await drain();
    assert.equal(t.g.$$('.dialogue-layer').length, 1, 'a fresh deliberate visit still opens');
});

test('destroying a map before its automatic arrival cancels the old opening', async () => {
    const t = setup(); map(t, { arrive: true });
    t.Rift.Screens.register('test-empty', { mount() {} });
    t.Rift.Router.replace('test-empty');
    await t.advance(1000);
    assert.equal(t.g.$$('.dialogue-layer').length, 0);
});
