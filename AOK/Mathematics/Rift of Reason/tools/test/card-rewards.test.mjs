// Station card rewards (#124): node `cards` slots (data/map.js) pay a card from the adventure's starter
// track (data/starters.js `rewards`) once per adventure, at an ordinary or optional station, never only
// at bosses. Receipts live in save.flags['card-reward:<slot>'], so backups carry them and older saves
// catch up once (World.catchUpCards) without duplicates.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import { loadRift } from './harness.mjs';
import { Node } from './dom-adapter.mjs';

const FILES = ['js/core/rift.js', 'js/core/state.js', 'js/core/world.js', 'data/creatures.js', 'data/items.js', 'data/avatars.js',
    'data/axioms.js', 'data/tactics.js', 'data/starters.js', 'data/map.js'];
const J = x => JSON.parse(JSON.stringify(x));
const TYPES = ['owlet', 'mothkin', 'fox', 'frogling', 'raven'];
const BOSSES = { ch1: 'gate', ch2: 'b-town-hall', ch3: 't-tribunal', ch4: 'k-core' };

function memoryStorage() {
    const m = new Map();
    return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: k => { m.delete(k); } };
}
function setup() {
    const R = loadRift(FILES);
    const store = memoryStorage();
    R.storage = () => store;
    return R;
}
// A live adventure of the given avatar type with its starter deck.
function adventure(R, type) {
    R.State.newGame();
    R.State.update(s => { s.avatar = { type, variant: 'girl', nickname: 'Test' }; R.World.start(s); R.State.grantStarter(s); });
    return R.State.get();
}
const slotNodes = R => Object.entries(R.data.map.nodes).filter(([, n]) => Array.isArray(n.cards) && n.cards.length);
const ref = id => (id.startsWith('axiom:') ? { kind: 'axiom', id: id.slice(6) } : { kind: 'tactic', id });
// Activity nodes without which the chapter boss cannot be reached (other node types complete on a visit).
function required(R, ch) {
    const N = R.data.map.nodes, start = R.data.chapters[ch].start;
    const reach = banned => {
        const seen = new Set([start]), q = [start];
        while (q.length) { const id = q.shift(); if (id === banned) continue; (N[id].links || []).forEach(n => { if (N[n] && N[n].chapter === ch && !seen.has(n) && n !== banned) { seen.add(n); q.push(n); } }); }
        return seen;
    };
    return Object.keys(N).filter(id => N[id].chapter === ch && ['puzzle', 'miniboss', 'boss'].includes(N[id].type)
        && reach().has(id) && (id === start || !reach(id).has(BOSSES[ch])));
}

test('every slot has a valid track for each avatar type; first picks are new and fit the starter deck', () => {
    const R = setup();
    const D = R.data.starterDecks;
    const slots = new Set(slotNodes(R).flatMap(([, n]) => n.cards));
    assert.ok(slots.size >= 6, 'several staged slots');
    for (const type of TYPES) {
        const deck = D.decks[type];
        assert.ok(deck.rewards && deck.colour, type + ' has a reward track and a colour');
        const s = adventure(R, type);
        for (const slot of slots) {
            const list = R.World.cardTrack(s)[slot];
            assert.ok(Array.isArray(list) && list.length, type + ' ' + slot);
            for (const id of list) {
                const c = ref(id);
                assert.ok(c.kind === 'axiom' ? R.data.axioms[c.id] && !R.data.axioms[c.id].own : R.data.tactics[c.id], type + ' ' + slot + ': unknown ' + id);
                if (c.kind === 'tactic' && !(D.sharedRewards || {})[slot]) assert.notEqual(R.data.tactics[c.id].colour, undefined, type + ' ' + slot + ': a colour card, not a generic earned tactic');
                if ((D.sharedRewards || {})[slot]) {
                    assert.equal(c.id, 'generic-small-patch'); assert.equal(R.data.tactics[c.id].rarity, 'common');
                    assert.equal(R.data.tactics[c.id].colour, undefined, 'the common shared reward fits every starter');
                }
            }
            const first = ref(list[0]);
            const owned = first.kind === 'axiom' ? R.State.ownedAxioms(s) : R.State.ownedTactics(s);
            assert.ok(!owned.includes(first.id), type + ' ' + slot + ': ' + first.id + ' is new for a fresh adventure');
        }
        // fit and fit-2: a common for a colour the starter already has creatures of, legal by a one-card swap.
        for (const slot of ['fit', 'fit-2']) {
            const id = deck.rewards[slot][0], t = R.data.tactics[id];
            assert.equal(t.rarity, 'common', type + ' ' + slot);
            const generic = deck.tactics.findIndex(x => !R.data.tactics[x].colour);
            const tactics = deck.tactics.slice();
            tactics.splice(generic, 1, id);
            const check = R.State.validateDeck({ creatures: deck.creatures, tactics, axioms: D.axioms }, { owned: R.State.ownedTactics(s).concat([id]) });
            assert.ok(check.valid, type + ' ' + slot + ' ' + id + ': ' + check.message);
        }
        // colour, colour-rare and colour-rule belong to the deck's own colour.
        assert.equal(R.data.tactics[deck.rewards.colour[0]].colour, deck.colour);
        assert.equal(R.data.tactics[deck.rewards['colour-rare'][0]].rarity, 'rare');
        assert.equal(R.data.axioms[ref(deck.rewards['colour-rule'][0]).id].colour, deck.colour);
    }
});

test('no boss-only payout: every chapter pays a card at a required non-boss station', () => {
    const R = setup();
    for (const [id, n] of slotNodes(R)) assert.ok(!['boss', 'miniboss'].includes(n.type), id + ' is a boss or mini-boss');
    for (const [id, n] of slotNodes(R)) assert.equal(n.type, 'puzzle', id + ': slots pay at checked stations only');
    for (const ch of ['ch1', 'ch2', 'ch3', 'ch4']) {
        const req = required(R, ch);
        assert.ok(req.includes(BOSSES[ch]), ch + ' boss is required');
        assert.ok(req.some(id => (R.data.map.nodes[id].cards || []).length), ch + ': a required station pays a card');
    }
    // The prologue: every Fair stall carries the first slot, so whichever two a player picks, one pays it.
    const stalls = Object.entries(R.data.map.nodes).filter(([, n]) => n.chapter === 'prologue' && n.type === 'puzzle');
    assert.ok(stalls.length >= 2 && stalls.every(([, n]) => (n.cards || []).includes('fit')));
    // Played along the required path, each type gets a card in every chapter, from a non-boss station.
    for (const type of TYPES) {
        const s = adventure(R, type);
        const byCh = {};
        const path = [stalls[0][0], stalls[1][0]].concat(...['ch1', 'ch2', 'ch3', 'ch4'].map(ch => required(R, ch)));
        R.State.update(st => path.forEach(id => {
            R.World.claimCards(st, id).filter(c => c.id).forEach(c => { const ch = R.data.map.nodes[id].chapter; byCh[ch] = (byCh[ch] || 0) + 1; });
            R.World.complete(st, id);
        }));
        for (const ch of ['prologue', 'ch1', 'ch2', 'ch3', 'ch4']) assert.ok(byCh[ch] >= 1, type + ': ' + ch + ' pays at least one card');
        assert.ok(s.flags['card-reward:colour'] && s.flags['card-reward:colour'].node === 'well');
    }
});

test('a slot pays once: replays, other nodes with the same slot and stars never pay it again', () => {
    const R = setup();
    const s = adventure(R, 'owlet');
    const before = J(s.tactics);
    let got;
    R.State.update(st => { got = R.World.claimCards(st, 'stall-pattern'); R.World.complete(st, 'stall-pattern'); });
    assert.deepEqual(J(got), [{ slot: 'fit', v: 1, node: 'stall-pattern', kind: 'tactic', id: 'stored-thought' }]);
    assert.deepEqual(J(s.tactics), before.concat(['stored-thought']));
    assert.deepEqual(J(s.flags['card-reward:fit']), { v: 1, node: 'stall-pattern', kind: 'tactic', id: 'stored-thought' });
    // A replay of the same stall, another stall with the same slot, and complete() again: nothing new.
    R.State.update(st => {
        assert.deepEqual(J(R.World.claimCards(st, 'stall-pattern')), []);
        assert.deepEqual(J(R.World.claimCards(st, 'stall-witness')), []);
        R.World.complete(st, 'stall-witness'); R.World.complete(st, 'stall-pattern');
    });
    assert.deepEqual(J(s.tactics), before.concat(['stored-thought']));
    assert.equal(s.tactics.filter(id => id === 'stored-thought').length, 1);
    // An Axiom slot adds to the axiom pool once.
    R.State.update(st => { R.World.complete(st, 'b-south-bridge'); R.World.complete(st, 'b-south-bridge'); });
    assert.deepEqual(J(s.axioms), ['age-of-reason']);
    assert.ok(R.State.ownedAxioms(s).includes('age-of-reason'));
    assert.equal(R.World.pendingCards(s), false);
});

test('a full run of every slot station pays a new card at each, also after boss tactics', () => {
    const R = setup();
    const N = R.data.map.nodes;
    const order = Object.keys(N).filter(id => ['puzzle', 'miniboss', 'boss'].includes(N[id].type)); // map order, chapter by chapter
    for (const type of TYPES) {
        const s = adventure(R, type);
        R.State.update(st => order.forEach(id => {
            const r = R.World.rewards(st, Object.assign({ id }, N[id]), R.makeRng(type + id), { firstTime: true });
            R.World.applyRewards(st, r);
            R.World.complete(st, id);
        }));
        const receipts = Object.keys(s.flags).filter(k => k.startsWith('card-reward:')).map(k => s.flags[k]);
        assert.equal(receipts.length, new Set(slotNodes(R).flatMap(([, n]) => n.cards)).size, type);
        assert.ok(receipts.every(r => r.id), type + ': ' + JSON.stringify(receipts.filter(r => !r.id)));
        assert.equal(new Set(receipts.map(r => r.id)).size, receipts.length, type + ': every slot pays a different card');
    }
});

test('an owned first candidate falls back to the next; all owned writes an empty receipt', () => {
    const R = setup();
    const s = adventure(R, 'owlet');
    R.State.update(st => { R.State.grantTactic('proof-by-contradiction', st); });
    R.State.update(st => { R.World.complete(st, 'well'); });
    assert.equal(s.flags['card-reward:colour'].id, 'qed');
    R.State.update(st => { ['nostalgia', 'total-recall', 'rousing-speech'].forEach(id => R.State.grantTactic(id, st)); });
    let got;
    R.State.update(st => { got = R.World.claimCards(st, 'k-prediction'); });
    assert.deepEqual(J(got), [{ slot: 'fate', v: 1, node: 'k-prediction', kind: null, id: null }]);
    assert.equal(R.World.pendingCards(s), false, 'the empty receipt is recorded, so it is never retried');
    // A save without an avatar or starter type has no track: nothing is paid and no receipt is written.
    const blank = R.State.freshState();
    blank.map.completed.push('well');
    assert.deepEqual(J(R.World.reconcileCards(blank)), []);
    assert.equal(blank.flags['card-reward:colour'], undefined);
});

test('an older save catches up once: completed stations pay, catches and decks are kept, and it never repeats', async () => {
    const R = setup();
    // A save from before #124: several stations completed, a custom deck, a trainer's uncommon already owned.
    const s = adventure(R, 'fox');
    R.State.update(st => {
        st.map.completed.push('stall-witness', 'stall-gallery', 'road-start', 'troll-bridge', 'well', 'gate', 'b-south-bridge', 't-reading-room');
        st.creatures.push(R.State.makeCreature('rawmsay', { uid: 'caught-1' }));
        R.State.grantTactic('imagine-otherwise', st);
        st.deckTactics = st.deckTactics.slice(0, 7).concat(['eureka']);
    });
    const old = J(R.State.get());
    assert.equal(R.World.pendingCards(old), true);
    // Loading the old save through a backup code changes nothing by itself (no receipts during migrate).
    const code = await R.State.exportCode();
    const read = J(await R.State.readCode(code));
    assert.deepEqual(read.flags, old.flags);
    assert.deepEqual(read.tactics, old.tactics);
    const events = [];
    R.bus.on('cards:granted', got => events.push(J(got)));
    const got = R.World.catchUpCards();
    assert.deepEqual(J(got.map(r => [r.slot, r.node, r.id])), [
        ['fit', 'stall-witness', 'careful-words'],
        ['colour', 'well', 'dream-big'],          // Imagine Otherwise was owned already: the fallback rare
        ['colour-rule', 'b-south-bridge', 'age-of-wonder'],
        ['second-rule', 't-reading-room', 'age-of-feeling'],
    ]);
    assert.equal(events.length, 1);
    const live = R.State.get();
    assert.deepEqual(J(live.creatures), old.creatures, 'every catch kept');
    assert.deepEqual(J(live.deckTactics), old.deckTactics, 'custom deck kept');
    assert.deepEqual(J(live.team), old.team);
    assert.deepEqual(J(live.tactics), old.tactics.concat(['careful-words', 'dream-big']));
    assert.deepEqual(J(live.axioms), ['age-of-wonder', 'age-of-feeling']);
    // Again (a reload, another boot): nothing, and no event.
    assert.deepEqual(J(R.World.catchUpCards()), []);
    assert.equal(events.length, 1);
    assert.deepEqual(J(R.State.get().tactics), old.tactics.concat(['careful-words', 'dream-big']));
});

test('receipts and granted cards survive a backup round trip; importing never pays twice', async () => {
    const R = setup();
    adventure(R, 'raven');
    R.State.update(st => ['stall-pattern', 'road-start', 'troll-bridge', 'well', 'river-ford', 'b-south-bridge', 't-library', 'k-prediction'].forEach(id => R.World.complete(st, id)));
    const before = J(R.State.get());
    const receipts = Object.keys(before.flags).filter(k => k.startsWith('card-reward:')).sort();
    assert.deepEqual(receipts, ['card-reward:colour', 'card-reward:colour-rare', 'card-reward:colour-rule', 'card-reward:fate', 'card-reward:fit', 'card-reward:fit-2', 'card-reward:foundation-patch']);
    const code = await R.State.exportCode();
    R.State.wipe();
    const back = J(await R.State.importCode(code));
    assert.deepEqual(back, before);
    assert.deepEqual(J(R.World.catchUpCards()), [], 'nothing is pending after the import');
    // The same code imported again, on top of itself: still one copy of every unlock.
    await R.State.importCode(code);
    R.World.catchUpCards();
    const after = J(R.State.get());
    assert.deepEqual(after.tactics, before.tactics);
    assert.deepEqual(after.axioms, before.axioms);
    assert.equal(new Set(after.tactics).size, after.tactics.length);
});

// The real encounter screen: the "Solved!" box names the station's card, low results pay it too.
async function encounter(nodeOpts, stateFn) {
    const Rift = loadRift(FILES.concat(['js/core/catch-net.js', 'js/core/catch-games.js', 'js/core/catch-session.js', 'js/puzzles/registry.js']));
    const state = Rift.State.freshState();
    state.avatar = { type: 'owlet', nickname: 'Test' };
    Rift.State.grantStarter(state);
    state.tutorialsSeen.fake = true; state.flags['learning-hint:fake'] = true;
    Rift.data.map.nodes.test = Object.assign({ type: 'puzzle', chapter: 'prologue', links: [], puzzles: [{ id: 'fake', difficulty: 1 }], name: 'Test', host: 'narrator', goal: 'Check rules' }, nodeOpts);
    if (stateFn) stateFn(state, Rift);
    Rift.State.get = () => state; Rift.State.save = () => {}; Rift.State.update = fn => fn(state);
    Rift.el = (...a) => new Node(...a);
    Rift.data.speakers = { narrator: { name: 'Host', art: 'host' } }; Rift.data.script = {};
    const modals = []; let api; let screen;
    Rift.Assets = { img: () => new Node() }; Rift.Audio = { sfx: () => {}, speak: () => {} }; Rift.Dialogue = { has: () => false }; Rift.Router = { replace: () => {} };
    Rift.UI = { hud: opts => new Node('div', {}, [opts.status]), toast: () => {}, modal: (title, body, buttons) => { const m = { title, body, buttons, close() {} }; modals.push(m); return m; } };
    Rift.Tutorial = {}; Rift.Screens = { register: (_, def) => { screen = def; } };
    Rift.Puzzles.register({ id: 'fake', name: 'Fake', colour: 'reason', generate: () => ({}), check: (_, a) => ({ solved: a === true }), hints: () => ['Hint'], mount: (_, a, x) => { api = x; return { pause() {}, destroy() {} }; } });
    vm.runInNewContext(fs.readFileSync(new URL('../../js/screens/encounter.js', import.meta.url), 'utf8'), { window: { Rift }, setTimeout, clearTimeout, Date });
    Rift.World.rollLoot = () => ({ species: null });
    screen.mount(new Node(), { nodeId: 'test' });
    return { state, modals, api: () => api };
}
const text = n => [n.textContent].concat((n.children || []).filter(x => x instanceof Node).map(text)).join(' ');

test('the encounter pays the card at a one-star win and names it; a second win does not', async () => {
    const g = await encounter({ cards: ['fit'] });
    for (let i = 0; i < 4; i++) g.api().submit(false); // every free check used and a heart lost: one star
    g.api().submit(true);
    await g.modals.at(-1).buttons[0].onclick();
    assert.equal(g.modals.at(-1).title, 'Solved!');
    assert.match(text(g.modals.at(-1).body), /★☆☆/);
    assert.match(text(g.modals.at(-1).body), /new tactic card: Stored Thought \(add it in Collection → Build decks\)/);
    assert.ok(g.state.tactics.includes('stored-thought'));
    assert.equal(g.state.flags['card-reward:fit'].node, 'test');
    // Replay of the same station: no card line, the unlock stays single.
    const g2 = await encounter({ cards: ['fit'] }, (st, R) => { R.World.complete(st, 'test'); });
    assert.ok(g2.state.tactics.includes('stored-thought'), 'paid at the first completion');
    g2.api().submit(true);
    await g2.modals.at(-1).buttons[0].onclick();
    assert.doesNotMatch(text(g2.modals.at(-1).body), /Stored Thought/);
    assert.equal(g2.state.tactics.filter(id => id === 'stored-thought').length, 1);
});

test('an Axiom slot is announced as an axiom card', async () => {
    const g = await encounter({ cards: ['colour-rule'] });
    g.api().submit(true);
    await g.modals.at(-1).buttons[0].onclick();
    assert.match(text(g.modals.at(-1).body), /new axiom card: Age of Reason \(add it in Collection → Axiom cards\)/);
    assert.deepEqual(J(g.state.axioms), ['age-of-reason']);
});
