// #98: changed numbers explain themselves on the card (signed +/- chips), in the inspector
// ("Active effects" + the colour wheel), and in the opponent's attack preview before impact.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWithDom } from './fake-dom.mjs';

const FILES = ['js/core/rift.js', 'js/core/state.js', 'js/core/assets.js', 'data/creatures.js', 'data/axioms.js', 'data/tactics.js',
    'js/battle/abilities.js', 'js/battle/engine.js', 'js/battle/lesson.js'];

function load() {
    const screens = {};
    const g = loadWithDom(FILES.concat([ctx => { ctx.Rift.Screens = { register: (id, s) => { screens[id] = s; } }; }, 'js/ui/battles.js', 'js/screens/battle.js']));
    g.Rift.Audio = { speak() {}, stopVoice() {}, sfx() {} };
    return { g, R: g.Rift, E: g.Rift.Battle.Engine, screens };
}

// Syllo's real practice match (the teacher's report), with zones/turn prepared like the repro in #98.
function syllo(chooseAttack) {
    const t = load();
    const save = t.R.State.freshState();
    save.flags['card-lesson-won'] = true;
    save.flags['card-rules-version'] = 3;
    t.R.State = { get: () => save };
    t.R.data.speakers = { syllo: { name: 'Sergeant Syllo', art: 'npc/syllo' } };
    let launch;
    t.R.Router = { go: (id, p) => { launch = p; } };
    t.R.Battles.story();
    t.R.Battle.AI = { choose: s => t.E.legalActions(s).find(chooseAttack) || { type: 'end' } };
    const first = t.g.document.createElement('div'); t.g.document.body.appendChild(first);
    const h0 = t.screens.battle.mount(first, launch);
    const s = JSON.parse(JSON.stringify(h0.state));
    h0.destroy(); first.remove();
    return Object.assign(t, { launch, s });
}
function toBoard(s, cid) {
    const c = s.cards[cid];
    for (const P of s.players) for (const z of ['hand', 'deck', 'board', 'discard']) P[z] = P[z].filter(x => x !== cid);
    s.players[c.owner].board.push(cid); c.controller = c.owner; c.enteredTurn = 0;
}
function mount(t, s) {
    const root = t.g.document.createElement('div'); t.g.document.body.appendChild(root);
    const view = t.screens.battle.mount(root, Object.assign({}, t.launch, { initialState: s }));
    return { root, view, $: sel => root.querySelector(sel) };
}
const runTimer = (g, ms) => { const i = g.timers.findIndex(x => x.ms === ms); assert.ok(i >= 0, 'timer ' + ms); g.timers.splice(i, 1)[0].fn(); };
// Point at a card and run only the timers that hover queued (not the AI's).
const hover = (g, node) => { const n = g.timers.length; node.dispatchEvent({ type: 'pointerenter', pointerType: 'mouse' }); g.timers.splice(n).forEach(x => x.fn()); };
const badges = root => root.querySelectorAll('.b-predict').map(n => n.textContent).join(' | ');

test('opponent attack: Beansprout shows 1, previews 2 (+1 colour) against Kim, then deals 2', () => {
    const t = syllo(a => a.type === 'attack' && a.cid === 'p1c2' && a.target === 'p0c0');
    const s = t.s;
    s.turn = 10; s.active = 1; s.phase = 'main';
    toBoard(s, 'p1c2'); toBoard(s, 'p0c0');
    assert.equal(s.cards.p1c2.species, 'beansprout');
    assert.equal(s.cards.p0c0.species, 'kardashiant');
    const m = mount(t, s);
    assert.equal(m.$('.opp-board [data-cid="p1c2"] .bc-gem.attack').textContent, '1', 'the card keeps its targetless attack');
    assert.equal(m.$('.opp-board [data-cid="p1c2"] .bc-delta.attack'), null, 'no target-free change, so no chip');
    runTimer(t.g, 1250);   // the AI picks its attack: the arrow and preview show
    assert.match(badges(m.root), /Deals 2 \(\+1 colour\)/);
    assert.match(m.$('.b-prompt').textContent, /attacks Kim Kardashiant with Mr\. Beansprout: deals 2 \(\+1 colour\)/);
    runTimer(t.g, 1000);   // impact
    const hit = m.view.state.lastEvents.find(e => e.t === 'damage' && e.source === 'p1c2' && e.cid === 'p0c0');
    assert.equal(hit && hit.amount, 2);
    assert.equal(badges(m.root), '', 'the preview clears once the attack resolves');
    m.view.destroy();
});

test('opponent attack on your hero previews 1 and says who wins at 0 hearts', () => {
    const t = syllo(a => a.type === 'attack' && a.cid === 'p1c2' && a.target === 'h0');
    const s = t.s;
    s.turn = 10; s.active = 1; s.phase = 'main';
    toBoard(s, 'p1c2');
    s.players[0].board = [];
    s.players[0].hearts = 1;
    const m = mount(t, s);
    runTimer(t.g, 1250);
    const text = badges(m.root);
    assert.match(text, /Deals 1/);
    assert.ok(!/colour/.test(text), 'no colour bonus against a hero');
    assert.match(text, /0 hearts: Sergeant Syllo wins!/);
    assert.ok(!/you win/.test(text), 'the opponent hitting you never says you win');
    runTimer(t.g, 1000);
    assert.equal(m.view.state.lastEvents.find(e => e.t === 'hit' && e.player === 0).amount, 1, 'the hero loses exactly the previewed 1');
    m.view.destroy();
});

test('stacked, cancelling and expiring effects show on both players\' cards and in Active effects', () => {
    const t = syllo(() => false);
    const s = t.s;
    s.turn = 10; s.active = 0; s.phase = 'main';
    toBoard(s, 'p0c0'); toBoard(s, 'p1c2');
    s.cards.p0c0.buffs.push({ label: 'Creative Spark', attack: 1, health: 1, temp: true });
    s.cards.p1c2.buffs.push({ label: 'Hype', attack: 2, health: 0, temp: true }, { label: 'Heckled', attack: -1, health: 0, temp: false });
    const m = mount(t, s);
    const mine = m.$('.my-board [data-cid="p0c0"]'), theirs = m.$('.opp-board [data-cid="p1c2"]');
    assert.equal(mine.querySelector('.bc-delta.attack').textContent, '+1');
    assert.ok(mine.querySelector('.bc-delta.attack').classList.contains('up'));
    assert.equal(mine.querySelector('.bc-delta.health').textContent, '+1');
    assert.equal(theirs.querySelector('.bc-delta.attack').textContent, '+1', 'net +2 −1 on the opponent card');
    assert.match(theirs.getAttribute('aria-label'), /Active effects: \+2 attack: Hype \(this turn only\); −1 attack: Heckled \(until it leaves play\)/);

    hover(t.g, theirs);
    const notes = m.$('.b-inspect .b-notes').textContent;
    assert.match(notes, /Active effects/);
    assert.match(notes, /\+2 attack: Hype \(this turn only\)/);
    assert.match(notes, /−1 attack: Heckled \(until it leaves play\)/);
    assert.match(notes, /Colour wheel: \+1 attack against Sense perception; Emotion gets \+1 against it\./);
    m.view.destroy();

    // A cancelling pair: the card shows no chip, yet the inspector still lists both changes.
    s.cards.p1c2.buffs = [{ label: 'Hype', attack: 1, health: 0, temp: true }, { label: 'Heckled', attack: -1, health: 0, temp: false }];
    const m2 = mount(t, s);
    assert.equal(m2.$('.opp-board [data-cid="p1c2"] .bc-delta.attack'), null);
    assert.match(m2.$('.opp-board [data-cid="p1c2"]').getAttribute('aria-label'), /\+1 attack: Hype.*−1 attack: Heckled/);
    m2.view.destroy();

    // End of turn: this-turn effects expire and their chips go with them (no stale badge).
    const after = t.E.applyAction(JSON.parse(JSON.stringify(s)), { type: 'end', player: 0 });
    const m3 = mount(t, after);
    assert.equal(m3.$('.my-board [data-cid="p0c0"] .bc-delta.attack'), null);
    assert.equal(m3.$('.opp-board [data-cid="p1c2"] .bc-delta.attack').textContent, '−1', 'the lasting debuff remains');
    assert.ok(m3.$('.opp-board [data-cid="p1c2"] .bc-delta.attack').classList.contains('down'));
    m3.view.destroy();
});

test('wheel edges and the inspector line follow a reversed wheel; preview matches resolution', () => {
    const t = syllo(a => a.type === 'attack' && a.cid === 'p1c2' && a.target === 'p0c0');
    const s = t.s;
    s.turn = 10; s.active = 1; s.phase = 'main';
    toBoard(s, 'p1c2'); toBoard(s, 'p0c0');
    assert.deepEqual(JSON.parse(JSON.stringify(t.E.wheelEdges(s, 'p1c2'))), { strong: ['perception'], weak: ['emotion'], bonus: 1 });
    s.axioms.active = Object.assign({}, s.axioms.active, { colour: 'curved-space' });
    assert.deepEqual(JSON.parse(JSON.stringify(t.E.wheelEdges(s, 'p1c2'))), { strong: ['emotion'], weak: ['perception'], bonus: 1 });
    const m = mount(t, s);
    hover(t.g, m.$('.opp-board [data-cid="p1c2"]'));
    assert.match(m.$('.b-inspect .b-notes').textContent, /Colour wheel \(reversed now\): \+1 attack against Emotion; Sense perception gets \+1 against it\./);
    runTimer(t.g, 1250);
    assert.match(badges(m.root), /Deals 1/, 'reversed: Language no longer beats Perception');
    assert.match(badges(m.root), /Shield blocks.*\| Takes 1Survives/, 'Kim takes 1; its stronger counter-hit meets the Shield');
    runTimer(t.g, 1000);
    const dealt = m.view.state.lastEvents.filter(e => e.t === 'damage' && e.source === 'p1c2' && e.cid === 'p0c0').map(e => e.amount);
    assert.equal(dealt.join(), '1', 'resolved damage agrees with the preview');
    m.view.destroy();
});
