// The Bag in the launcher (js/ui/battles.js): "Bring anything?" picks up to two bag items, they
// are used up only when used (result.itemsUsed), and practice has a free bag that never touches the save.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';
import { Node } from './dom-adapter.mjs';

function game(items) {
    const Rift = loadRift(['js/core/rift.js', 'js/core/state.js', 'js/core/world.js', 'data/creatures.js', 'data/items.js', 'data/map.js', 'data/axioms.js', 'data/tactics.js',
        'data/script/lesson1.js', 'data/script/lesson2.js', 'data/script/lesson3.js', 'data/script/lesson4.js',
        'js/battle/abilities.js', 'js/battle/engine.js', 'js/battle/ai.js', 'js/battle/lesson.js', 'js/ui/battles.js']);
    const state = Rift.State.freshState();
    state.avatar = { type: 'owlet', nickname: 'Test' };
    state.items = Object.assign({}, items);
    state.flags['story-battle-won'] = true;
    Rift.State.get = () => state;
    Rift.State.update = fn => fn(state);
    Rift.State.useItem = id => { if (!state.items[id]) return false; state.items[id] -= 1; return true; };
    Rift.el = (...args) => new Node(...args);
    const routes = [], modals = [], toasts = [];
    Rift.Assets = { img: () => new Node() };
    Rift.Dialogue = { has: () => false };
    Rift.UI = { toast: t => toasts.push(t), modal: (title, body, buttons) => { const m = { title, body, buttons }; modals.push(m); return m; } };
    Rift.Router = { go: (screen, params) => routes.push({ screen, params }), replace: screen => routes.push({ screen }) };
    Rift.Battle.Ante = { applyToSave() {} };
    // A station whose card challenge is open.
    state.map.completed.push('stall-gallery');
    return { Rift, state, routes, modals, toasts };
}

// The checkbox rows of the "Bring anything?" box: item name → its checkbox.
function rows(modal) {
    const out = {};
    const walk = n => {
        if (!n || typeof n !== 'object') return;
        if (n.className === 'row' && n.children[0] && n.children[0].type === 'checkbox') {
            const name = n.children[2].children[0].textContent.replace(/ \(×\d+\)$/, '');
            out[name] = { box: n.children[0], line: n.children[2].children[1].textContent };
        }
        (n.children || []).forEach(walk);
    };
    walk(modal.body);
    return out;
}
const tick = (r, on) => { r.box.checked = on; r.box.onchange({ target: { checked: on } }); };

test('"Bring anything?" offers bag items with a battle job, at most two, not used up at the start', () => {
    const g = game({ tonic: 2, ward: 1, lure: 1, 'trick-book': 1, heartstone: 1 });
    g.Rift.Battles.trainer('stall-gallery', 'easy');
    const m = g.modals.at(-1);
    assert.equal(m.title, 'Bring anything?');
    const r = rows(m);
    assert.deepEqual(Object.keys(r).sort(), ['Heartstone', 'Lure Lantern', 'Tonic', 'Ward'], 'no Trick Book (no battle job)');
    assert.match(r.Tonic.line, /In battle: Restore 2 hearts to your hero\. \(1 ⚡\)/);
    tick(r.Tonic, true);
    tick(r.Ward, true);
    assert.equal(r['Lure Lantern'].box.disabled, true, 'two items fill the bag');
    tick(r.Ward, false);
    assert.equal(r['Lure Lantern'].box.disabled, false);
    tick(r.Ward, true);
    tick(r.Heartstone, true);
    m.buttons.find(b => b.label === 'Battle!').onclick();
    const p = g.routes.at(-1).params;
    assert.deepEqual([...p.player.bag], ['tonic', 'ward']);
    assert.equal(p.player.consumables['extra-life'], 1);
    assert.equal(g.state.items.heartstone, 0, 'a passive item is used up at the start, as before');
    assert.equal(g.state.items.tonic, 2, 'bag items are not used up at the start');
    assert.equal(g.state.items.ward, 1);
});

test('after a real battle only the items used leave the save', () => {
    const g = game({ tonic: 2, ward: 1 });
    g.Rift.Battles.trainer('stall-gallery', 'easy');
    const r = rows(g.modals.at(-1));
    tick(r.Tonic, true);
    tick(r.Ward, true);
    g.modals.at(-1).buttons[0].onclick();
    const p = g.routes.at(-1).params;
    p.onEnd({ mode: 'trainer', outcome: 'lost', itemsUsed: { tonic: 1 } });
    assert.equal(g.state.items.tonic, 1);
    assert.equal(g.state.items.ward, 1, 'the unused Ward goes back to the bag');
    // Never below zero (an item may also have been lost as a stake).
    const h = game({ tonic: 1 });
    h.Rift.Battles.trainer('stall-gallery', 'easy');
    tick(rows(h.modals.at(-1)).Tonic, true);
    h.modals.at(-1).buttons[0].onclick();
    h.state.items.tonic = 0;
    h.routes.at(-1).params.onEnd({ mode: 'trainer', outcome: 'lost', itemsUsed: { tonic: 1 } });
    assert.equal(h.state.items.tonic, 0);
});

test('with nothing to bring, the battle starts at once with an empty bag', () => {
    const g = game({ 'trick-book': 2 });
    g.Rift.Battles.trainer('stall-gallery', 'easy');
    assert.equal(g.modals.length, 0);
    assert.deepEqual([...g.routes.at(-1).params.player.bag], []);
});

test('practice brings a free Tonic and Ward that never touch the save', () => {
    const g = game({ tonic: 1 });
    g.Rift.Battles.practice();
    const p = g.routes.at(-1).params;
    assert.equal(p.mode, 'practice');
    assert.deepEqual([...p.player.bag], ['tonic', 'ward']);
    const before = JSON.stringify(g.state.items);
    p.onEnd({ mode: 'practice', outcome: 'won', itemsUsed: { tonic: 1, ward: 1 } });
    assert.equal(JSON.stringify(g.state.items), before);
    g.Rift.Battles.practice();
    g.routes.at(-1).params.onEnd({ mode: 'practice', outcome: 'left', itemsUsed: { tonic: 1 } });
    assert.equal(JSON.stringify(g.state.items), before);
});

test('the safe story match and the guided lesson have no bag from the save', () => {
    const g = game({ tonic: 3 });
    g.Rift.Battles.story();
    const p = g.routes.at(-1).params;
    assert.ok(!p.player.bag || !p.player.bag.length);
    g.Rift.Battles.learn('map');
    assert.equal(g.routes.at(-1).screen, 'battle-lesson');
    assert.equal(g.routes.at(-1).params.player, undefined);
});

test('How to play explains the Bag in one line', () => {
    const g = game({});
    g.Rift.Battles.rules();
    const text = n => (typeof n === 'string' ? n : (n.textContent || '') + (n.children || []).map(text).join(' '));
    const all = text(g.modals.at(-1).body);
    assert.match(all, /Bag:\s+use one item per turn for its energy\. An item is used up only when you use it\./);
});
