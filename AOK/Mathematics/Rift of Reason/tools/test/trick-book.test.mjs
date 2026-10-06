// Trick Book: teaching rules, sources (trainers, rare puzzle loot) and the Bag flow.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import { loadRift } from './harness.mjs';
import { Node } from './dom-adapter.mjs';

const FILES = ['js/core/rift.js', 'js/core/state.js', 'js/core/world.js', 'data/creatures.js', 'data/items.js', 'data/tactics.js', 'data/map.js'];
const J = x => JSON.parse(JSON.stringify(x));

test('teach: one trick per creature, replacing spends a book, invalid requests spend nothing', () => {
    const Rift = loadRift(FILES);
    const s = Rift.State.freshState();
    s.items['trick-book'] = 2;
    s.creatures.push(Rift.State.makeCreature('lobstorian', { uid: 'lob' }));
    const before = JSON.stringify(s);
    // Lobstorian already has Guard, so teaching Guard is refused too.
    for (const [uid, trick] of [['missing', 'swift'], ['lob', 'fly'], ['lob', null], ['lob', 'guard']]) assert.equal(Rift.World.teach(s, uid, trick), false);
    assert.equal(JSON.stringify(s), before);
    assert.equal(Rift.World.teach(s, 'lob', 'swift'), true);
    assert.equal(s.creatures[0].taught, 'swift');
    assert.equal(s.items['trick-book'], 1);
    assert.equal(Rift.World.teach(s, 'lob', 'swift'), false, 'same trick again is refused');
    assert.equal(s.items['trick-book'], 1);
    assert.equal(Rift.World.teach(s, 'lob', 'attack'), true);
    assert.equal(s.creatures[0].taught, 'attack');
    assert.equal(s.items['trick-book'], 0);
    assert.equal(Rift.World.teach(s, 'lob', 'health'), false, 'no book left');
    assert.equal(s.creatures[0].taught, 'attack');
});

test('a trainer gives one Trick Book and one earned tactic the first time only', () => {
    const Rift = loadRift(FILES);
    const s = Rift.State.freshState();
    const first = Rift.World.claimTrainerReward(s, 'syllo');
    assert.deepEqual(J(first), { items: { 'trick-book': 1 }, tactic: Rift.data.trainers.syllo.rewardTactic });
    assert.equal(s.items['trick-book'], 1);
    assert.equal(s.flags['trainer-reward:syllo'], true);
    assert.equal(Rift.World.claimTrainerReward(s, 'syllo'), null);
    assert.equal(s.items['trick-book'], 1);
    assert.deepEqual(J(s.tactics), [Rift.data.trainers.syllo.rewardTactic]);
    assert.equal(Rift.World.claimTrainerReward(s, 'nobody'), null);
    // Every trainer gives a book; tactics run out once all earned ones are owned, never duplicate.
    Object.keys(Rift.data.trainers).filter(id => id !== 'syllo').forEach(id => Rift.World.claimTrainerReward(s, id));
    assert.equal(s.items['trick-book'], Object.keys(Rift.data.trainers).length);
    assert.equal(new Set(s.tactics).size, s.tactics.length);
    assert.deepEqual(J(s.tactics.slice().sort()), J(Rift.data.tacticDecks.earned.slice().sort()));
    Object.values(Rift.data.trainers).forEach(t => {
        if (t.rewardTactic) assert.ok(Rift.data.tacticDecks.earned.includes(t.rewardTactic));
        (t.tactics || []).forEach(id => assert.ok(Rift.data.tactics[id], id));
        const counts = {};
        (t.tactics || []).forEach(id => { counts[id] = (counts[id] || 0) + 1; assert.ok(counts[id] <= 2); });
        if (t.tactics) assert.equal(t.tactics.length, 10);
    });
});

test('puzzles drop a Trick Book rarely (about 5%), minibosses a little more often', () => {
    const Rift = loadRift(FILES);
    const s = Rift.State.freshState();
    const rate = type => {
        let n = 0;
        for (let i = 0; i < 10000; i++) if (Rift.World.rewards(s, { type }, Rift.makeRng('tb' + i), { stars: 2 }).items['trick-book']) n++;
        return n / 10000;
    };
    const p = rate('puzzle'), m = rate('miniboss');
    assert.ok(p > 0.035 && p < 0.065, 'puzzle ' + p);
    assert.ok(m > 0.08 && m < 0.12, 'miniboss ' + m);
});

class Element extends Node {
    append(...nodes) { super.append(...nodes); for (const n of nodes) if (n instanceof Node) n.parent = this; }
    appendChild(n) { this.append(n); return n; }
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(n => n !== this); }
}
function ui() {
    const Rift = loadRift(FILES);
    const state = Rift.State.freshState();
    state.items['trick-book'] = 1;
    state.creatures.push(Rift.State.makeCreature('astrophysicat', { uid: 'cat', taught: 'guard' }), Rift.State.makeCreature('khaby', { uid: 'kb' }));
    Rift.State.replace(state);
    Rift.State.update = fn => fn(state);
    Rift.el = (...args) => new Element(...args);
    Rift.Assets = { img: () => new Element(), has: () => false };
    Rift.Audio = { sfx: () => {} };
    Rift.data.map = { nodes: {} };
    const overlay = new Element();
    vm.runInNewContext(fs.readFileSync(new URL('../../js/ui/ui.js', import.meta.url), 'utf8'), { window: { Rift, document: { getElementById: () => overlay } }, setTimeout: () => {} });
    const walk = n => [n, ...n.children.filter(x => x instanceof Node).flatMap(walk)];
    const find = pred => walk(overlay).find(pred);
    const button = text => find(n => n.textContent === text);
    const cls = c => walk(overlay).filter(n => typeof n.className === 'string' && n.className.split(' ').includes(c));
    return { Rift, state, button, cls };
}
const tick = () => new Promise(r => setImmediate(r));

test('Bag → Trick Book: cancel spends nothing; choose creature and trick; replacing asks first', async () => {
    const g = ui();
    g.Rift.UI.bag();
    g.button('Use').onclick();
    assert.equal(g.cls('trick-pick').length, 2);
    g.button('Cancel').onclick();
    assert.equal(g.state.items['trick-book'], 1);
    assert.ok(g.button('Bag'));
    // Choose Khaby, then Shield.
    g.button('Use').onclick();
    g.cls('trick-pick')[1].onclick();
    const options = g.cls('trick-option');
    assert.equal(options.length, 5);
    options[2].onclick();
    await tick();
    assert.equal(g.state.creatures[1].taught, 'shield');
    assert.equal(g.state.items['trick-book'], 0);
    // Replacing a known trick asks; keeping the old one spends nothing.
    g.state.items['trick-book'] = 1;
    g.Rift.UI.trickBook('cat', () => {});
    const known = g.cls('trick-option');
    assert.equal(known[0].disabled, true, 'the known trick cannot be picked again');
    assert.equal(known.filter(b => b.disabled).length, 1 + g.Rift.State.naturalKeywords(g.state.creatures[0]).filter(k => k !== 'guard').length);
    known[3].onclick();
    await tick();
    g.button('Keep the old trick').onclick();
    await tick();
    assert.equal(g.state.creatures[0].taught, 'guard');
    assert.equal(g.state.items['trick-book'], 1);
    g.cls('trick-option')[3].onclick();
    await tick();
    g.button('Replace').onclick();
    await tick();
    assert.equal(g.state.creatures[0].taught, 'attack');
    assert.equal(g.state.items['trick-book'], 0);
});

test('mini-bosses and bosses teach one unowned earned tactic the first time only', () => {
    const Rift = loadRift(FILES);
    const s = Rift.State.freshState();
    const rng = Rift.makeRng('tactic-reward');
    const first = Rift.World.rewards(s, { type: 'miniboss' }, rng, { firstTime: true, stars: 3 });
    assert.equal(first.tactic, Rift.data.tacticDecks.earned[0]);
    Rift.World.applyRewards(s, first);
    assert.ok(s.tactics.includes(first.tactic));
    const next = Rift.World.rewards(s, { type: 'boss' }, rng, { firstTime: true, stars: 3 });
    assert.equal(next.tactic, Rift.data.tacticDecks.earned[1], 'skips tactics already owned');
    assert.equal(Rift.World.rewards(s, { type: 'boss' }, rng, { firstTime: false }).tactic, undefined, 'replays give none');
    assert.equal(Rift.World.rewards(s, { type: 'puzzle' }, rng, { firstTime: true }).tactic, undefined, 'ordinary puzzles give none');
});
