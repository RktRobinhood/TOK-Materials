// The Bag on the battle screen: the Bag button by the energy, its tray, click-click and drag use,
// dimmed items with a short reason, keyboard, and result.itemsUsed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWithDom } from './fake-dom.mjs';

const CORE = ['js/core/rift.js', 'js/core/assets.js', 'data/creatures.js', 'data/items.js', 'data/axioms.js', 'data/tactics.js',
    'js/battle/abilities.js', 'js/battle/engine.js', 'js/battle/lesson.js'];

function setup(params, opts) {
    const screens = {};
    const g = loadWithDom(CORE.concat([ctx => { ctx.Rift.Screens = { register: (n, d) => { screens[n] = d; }, get: n => screens[n] }; }, 'js/screens/battle.js', 'js/screens/battle-lesson.js']));
    const { Rift } = g;
    Rift.data.speakers = { granny: { name: 'Granny Axiom', art: 'npc/granny-axiom' } };
    Rift.Battle.AI = { choose(s) {
        const L = Rift.Battle.Engine.legalActions(s);
        return L.find(a => a.type === 'draw' && a.choice === 'deck') || L.find(a => a.type === 'end') || L[0];
    } };
    Rift.Audio = { speak() {}, stopVoice() {}, sfx() {} };
    Rift.Battles = { rules: onClose => ({ close() { onClose(); } }) };
    const fateCalls = [];
    Rift.Battle.Fate = { roll(o) { fateCalls.push(o); return { results: [], removed: [], itemsUsed: { ward: 0, anchor: 0 }, log: [] }; } };
    Rift.Battle.Ante = { compute: () => ({ lines: [] }), settle: () => ({ lines: [] }) };
    const root = g.document.createElement('div');
    g.document.body.appendChild(root);
    const results = [];
    const handle = screens[(opts && opts.screen) || 'battle'].mount(root, Object.assign({ onEnd: r => results.push(r) }, params));
    const $ = sel => root.querySelector(sel);
    return { g, Rift, E: Rift.Battle.Engine, root, handle, $, results, fateCalls };
}

const team = (ids, prefix) => ids.map((species, i) => ({ uid: prefix + i, species, injuries: [], scars: [], powerDelta: 0 }));
const practice = bag => ({
    mode: 'practice', seed: 'bag-screen',
    player: { team: team(Array(8).fill('kardashiant'), 'me-'), tactics: [], axioms: [], bag },
    opponent: { name: 'Dummy', team: team(Array(8).fill('kardashiant'), 'opp-'), tactics: [], ai: 'easy' },
    axiomDeck: ['thrift', 'luxury', 'arrival', 'mercy'],
    battleOptions: { first: 0, shuffle: false, shuffleAxioms: false, spark: false, openHand: [3, 3], deckSize: 8, minCreatures: 1 },
});
const mouse = extra => Object.assign({ pointerType: 'mouse', pointerId: 1, clientX: 0, clientY: 0, button: 0, preventDefault() {} }, extra);
const tray = t => t.$('.b-bag-tray');
const item = (t, id) => t.$('.b-bag-item[data-item="' + id + '"]');

// Draw, then play the first creature from the hand onto my side (it is asleep but can be targeted).
function drawAndPlay(t) {
    t.$('.b-draw-btn[data-choice="deck"]').click();
    t.$('.b-hand [data-cid="p0c0"]').click();
    t.$('.b-prompt .btn.primary').click();
    t.handle.state.players[0].energy = 3;   // room for an item after the creature
}

test('the Bag button shows the count by the energy; no button without a bag or in the lesson', () => {
    const t = setup(practice(['tonic', 'ward']));
    const btn = t.$('.b-hero-row.me .b-row-right .b-bag-btn');
    assert.ok(btn, 'next to my energy');
    assert.match(btn.textContent, /🎒\s*2/);
    assert.equal(btn.getAttribute('aria-label'), 'Bag: 2 items');
    assert.equal(btn.dataset.tip, 'Bag');
    assert.match(btn.dataset.tipDetail, /Use one per turn/);
    assert.equal(btn.title, '', 'no native tooltip next to the custom one');
    assert.equal(btn.getAttribute('aria-expanded'), 'false');
    assert.equal(tray(t), null, 'the tray starts closed');
    t.handle.destroy();
    const none = setup(practice([]));
    assert.equal(none.$('.b-bag-btn'), null);
    none.handle.destroy();
    const lesson = setup({}, { screen: 'battle-lesson' });
    assert.equal(lesson.$('.b-bag-btn'), null, 'the guided lesson has no bag');
    lesson.handle.destroy();
});

test('the tray lists the items with energy and text; unusable ones are dimmed with a reason', () => {
    const t = setup(practice(['tonic', 'ward']));
    t.$('.b-bag-btn').click();
    assert.ok(tray(t));
    assert.equal(t.$('.b-bag-btn').getAttribute('aria-expanded'), 'true');
    assert.equal(t.g.document.activeElement, item(t, 'tonic'), 'focus moves into the tray');
    assert.match(item(t, 'tonic').textContent, /Tonic.*Restore 2 hearts to your hero\..*1 ⚡/);
    assert.match(item(t, 'tonic').textContent, /First choose your draw\./);
    assert.ok(item(t, 'tonic').classList.contains('off'));
    assert.ok(t.$('.b-bag-item img[data-placeholder="item/tonic"]'), 'item art with the placeholder fallback');
    t.$('.b-draw-btn[data-choice="deck"]').click();
    assert.match(item(t, 'tonic').textContent, /Your hearts are full\./);
    assert.match(item(t, 'ward').textContent, /You need a creature of yours without Shield\./);
    // The big preview, like a card.
    item(t, 'ward').dispatchEvent(mouse({ type: 'pointerenter' }));
    t.g.flush();
    assert.ok(t.$('.b-inspect').classList.contains('show'));
    assert.match(t.$('.b-inspect').textContent, /Ward.*A friendly creature gets Shield\..*used up only when you use it/);
    item(t, 'tonic').click();
    assert.match(t.$('.b-note').textContent, /Your hearts are full\./);
    t.handle.destroy();
});

test('click-click: choose the Ward, then a glowing creature; then no second item this turn', () => {
    const t = setup(practice(['ward', 'tonic']));
    drawAndPlay(t);
    t.handle.state.players[0].hearts = 5;
    t.$('.b-bag-btn').click();
    assert.ok(!item(t, 'ward').classList.contains('off'));
    item(t, 'ward').click();
    assert.equal(tray(t), null, 'the tray closes so the targets can be seen');
    assert.match(t.$('.b-prompt .b-ask').textContent, /Now click a glowing target for the Ward/);
    assert.ok(t.$('.my-board [data-cid="p0c0"]').classList.contains('valid'));
    t.$('.my-board [data-cid="p0c0"]').click();
    const s = t.handle.state;
    assert.ok(t.E.hasKeyword(s, 'p0c0', 'shield'));
    assert.deepEqual([...s.players[0].bag], ['tonic']);
    assert.equal(t.$('.b-bag-btn .b-bag-count').textContent, '1');
    // No text log: the item use is the newest tile in Recent plays (marked with the Bag).
    const newest = t.$('.b-recent .b-recent-tile.newest');
    assert.match(newest.getAttribute('aria-label'), /^You use the Ward on Kim Kardashiant\./);
    assert.equal(newest.querySelector('.b-recent-move').textContent, '🎒');
    t.$('.b-bag-btn').click();
    assert.ok(item(t, 'tonic').classList.contains('off'));
    assert.match(item(t, 'tonic').textContent, /You already used an item this turn\./);
    // Escape closes the tray.
    t.$('.battle').dispatchEvent({ type: 'keydown', key: 'Escape' });
    assert.equal(tray(t), null);
    t.handle.destroy();
});

test('an item without a target asks first, then Use spends the energy', () => {
    const t = setup(practice(['tonic']));
    t.$('.b-draw-btn[data-choice="deck"]').click();
    t.handle.state.players[0].hearts = 5;
    t.$('.b-bag-btn').click();
    item(t, 'tonic').click();
    assert.equal(t.handle.state.players[0].hearts, 5, 'not used by the first click');
    assert.match(t.$('.b-prompt .b-ask').textContent, /^Use the Tonic for 1 energy\? You have 1\./);
    const use = t.$('.b-prompt .btn.primary');
    assert.match(use.textContent, /Use · 1 ⚡/);
    assert.equal(t.g.document.activeElement, use, 'keyboard focus goes to Use');
    use.click();
    assert.equal(t.handle.state.players[0].hearts, 7);
    assert.equal(t.handle.state.players[0].energy, 0);
    assert.equal(tray(t), null);
    assert.equal(t.$('.b-bag-btn .b-bag-count').textContent, '0');
    t.handle.destroy();
});

test('drag the Ward from the tray onto a creature', () => {
    const t = setup(practice(['ward']));
    drawAndPlay(t);
    t.$('.b-bag-btn').click();
    const { g, $ } = t;
    g.document.elementFromPoint = () => $('.my-board [data-cid="p0c0"]');
    item(t, 'ward').dispatchEvent(mouse({ type: 'pointerdown' }));
    $('.b-arena').dispatchEvent(mouse({ type: 'pointermove', clientX: 0, clientY: -80 }));
    assert.match($('.b-prompt .b-ask').textContent, /Drop it on a glowing target\./);
    assert.ok($('.my-board [data-cid="p0c0"]').classList.contains('valid-drag'));
    $('.b-arena').dispatchEvent(mouse({ type: 'pointerup', clientX: 0, clientY: -80 }));
    assert.ok(t.E.hasKeyword(t.handle.state, 'p0c0', 'shield'));
    assert.deepEqual([...t.handle.state.players[0].bag], []);
    t.handle.destroy();
});

test('Leave match reports the items used; End turn ignores items for "Nothing left to do"', () => {
    const t = setup(practice(['ward', 'anchor']));
    drawAndPlay(t);
    t.handle.state.players[0].energy = 0;
    t.$('.b-bag-btn').click();
    t.$('.b-bag-btn').click();   // open and close: a re-render with 0 energy
    assert.ok(t.$('.b-end').classList.contains('glow'), 'an unused (free) Anchor does not stop the End turn hint');
    t.handle.state.players[0].energy = 1;
    t.$('.b-bag-btn').click();
    item(t, 'ward').click();
    t.$('.my-board [data-cid="p0c0"]').click();
    t.root.querySelectorAll('button').find(b => b.getAttribute('aria-label') === 'Leave match').click();
    t.root.querySelectorAll('.b-overlay button').find(b => b.textContent === 'Leave match').click();
    assert.deepEqual({ ...t.results[0].itemsUsed }, { ward: 1 });
    t.handle.destroy();
});

test('a real match: result.itemsUsed, and a Ward used in battle no longer saves a creature after it', () => {
    const holder = setup(practice([]));
    const E = holder.E;
    holder.handle.destroy();
    const s = E.createBattle({
        seed: 'bag-win',
        players: [{ name: 'You', team: team(['kardashiant'], 'me-'), tactics: [], bag: ['ward', 'anchor'] }, { name: 'Dummy', team: team(['kardashiant'], 'opp-'), tactics: [] }],
        axiomDeck: ['thrift'],
        options: { first: 0, shuffle: false, shuffleAxioms: false, spark: false, openHand: [0, 0], openAxioms: 0, deckSize: 1, minCreatures: 1 },
    });
    s.phase = 'main';
    s.players[0].energy = 3;
    s.players[0].deck = []; s.players[0].board = ['p0c0']; s.cards.p0c0.enteredTurn = -1;
    s.players[1].hearts = 1;
    const t = setup(Object.assign(practice([]), { mode: 'trainer', initialState: s, player: { team: team(['kardashiant'], 'me-'), items: { ward: 2, anchor: 1 } } }));
    t.$('.b-bag-btn').click();
    item(t, 'ward').click();
    t.$('.my-board [data-cid="p0c0"]').click();
    t.$('.my-board [data-cid="p0c0"]').click();
    t.$('.b-hero[data-target="h1"]').click();
    assert.equal(t.E.winner(t.handle.state), 0);
    t.g.flush();
    t.root.querySelectorAll('.b-overlay button').find(b => b.textContent === 'Continue').click();
    assert.equal(t.results.length, 1);
    assert.deepEqual({ ...t.results[0].itemsUsed }, { ward: 1 });
    assert.deepEqual({ ...t.fateCalls[0].items }, { ward: 1, anchor: 1 }, 'one Ward is left for the after-battle check');
    t.handle.destroy();
});

test('Anchor: the lane shows the anchor and counts the held turn', () => {
    const t = setup(Object.assign(practice(['anchor']), { battleOptions: Object.assign({}, practice().battleOptions, { timeline: true }) }));
    t.$('.b-draw-btn[data-choice="deck"]').click();
    assert.match(t.$('.b-fate-sum').textContent, /^New rule.* in 6 turns/);
    t.$('.b-bag-btn').click();
    item(t, 'anchor').click();
    assert.match(t.$('.b-prompt .b-ask').textContent, /Use the Anchor\? It needs no energy\./);
    t.$('.b-prompt .btn.primary').click();
    assert.match(t.$('.b-fate-sum').textContent, /^⚓ New rule.* in 7 turns/);
    t.$('.b-end').click();
    t.g.flush();
    assert.equal(t.handle.state.fate.until, 5, 'held once, then the opponent\'s End turn moved it');
    t.handle.destroy();
});
