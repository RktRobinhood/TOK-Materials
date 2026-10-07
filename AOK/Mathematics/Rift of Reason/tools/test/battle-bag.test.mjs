// The Bag in battle (design/card-arena-expansion-2026-10-07.md §3): bring up to two items,
// use one per turn for energy; used items leave the bag and are reported in itemsUsed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Rift, E, AI, inst, setup, act, onBoard, toHand, pass, events, plain, stats, invariants } from './battle-helpers.mjs';

const same = (a, b, m) => assert.deepEqual(plain(a), b, m);
const items = s => E.legalActions(s).filter(a => a.type === 'item');
const status = (s, id, p) => E.bagStatus(s, p || 0).find(x => x.id === id);

// A quiet main-phase battle (see battle-helpers setup) with a bag for player 0.
function bagged(bag, opts) {
    const s = setup(Object.assign({ p0: ['astrophysicat', 'astrophysicat'], p1: ['astrophysicat', 'astrophysicat'] }, opts || {}));
    s.players[0].bag = E.bagSelection(bag);
    return s;
}

test('createBattle keeps only items with a battle job, at most two', () => {
    const s = E.createBattle({ seed: 'bag', players: [{ team: [inst('khaby')], bag: ['trick-book', 'tonic', 'heartstone', 'ward', 'mending'] }, { team: [inst('khaby')] }],
        options: { first: 0, openHand: [0, 0], openAxioms: 0 } });
    same(s.players[0].bag, ['tonic', 'ward']);
    same(s.players[1].bag, []);
    same(E.itemsUsed(s, 0), {});
    assert.equal(E.BAG_LIMIT, 2);
    for (const id of ['tonic', 'ward', 'mending', 'lure', 'charm', 'greatcharm', 'anchor']) {
        const b = Rift.data.items[id].battle;
        assert.ok(b && typeof b.run === 'function' && b.text && b.text.length < 80, id);
        assert.equal(b.cost, id === 'anchor' ? 0 : 1, id + ' energy');
    }
    for (const id of ['trick-book', 'trickster-coin', 'heartstone']) assert.equal(Rift.data.items[id].battle, undefined, id + ' keeps its current job');
});

test('items are a main-phase action only, for the active player', () => {
    const s = bagged(['lure'], { main: false });
    assert.equal(s.phase, 'draw');
    assert.equal(items(s).length, 0);
    assert.equal(status(s, 'lure').why, 'draw');
    const m = act(s, { type: 'draw', choice: 'deck' });
    same(items(m).map(a => a.id), ['lure']);
    const theirs = pass(m);
    assert.equal(E.decider(theirs), 1);
    assert.equal(items(theirs).length, 0, 'not on the other player\'s turn');
    assert.equal(status(theirs, 'lure').why, 'turn');
});

test('one item per turn; it costs energy; it leaves the bag and is counted', () => {
    let s = bagged(['lure', 'lure']);
    s.players[0].hand = [];
    onBoard(s, 'p0c0');
    s = act(s, { type: 'item', id: 'lure' });
    assert.equal(s.players[0].energy, 9);
    same(s.players[0].bag, ['lure']);
    same(E.itemsUsed(s, 0), { lure: 1 });
    assert.equal(items(s).length, 0, 'only one item per turn');
    assert.equal(status(s, 'lure').why, 'used');
    assert.match(status(s, 'lure').note, /already used an item/);
    assert.throws(() => act(s, { type: 'item', id: 'lure' }), /Illegal/);
    s = pass(pass(s));
    assert.equal(E.decider(s), 0);
    s.phase = 'main';
    assert.equal(items(s).length, 1, 'next turn it can be used again');
    s = act(s, { type: 'item', id: 'lure' });
    same(s.players[0].bag, []);
    same(E.itemsUsed(s, 0), { lure: 2 });
    assert.equal(status(s, 'lure'), undefined, 'an empty bag lists nothing');
});

test('not enough energy: not offered, and the tray says why; Anchor costs nothing', () => {
    const s = bagged(['lure', 'anchor'], { options: { timeline: true } });
    s.players[0].energy = 0;
    same(items(s).map(a => a.id), ['anchor']);
    assert.equal(status(s, 'lure').why, 'energy');
    assert.match(status(s, 'lure').note, /needs 1 energy/);
    assert.equal(status(s, 'anchor').ok, true);
});

test('an item not in the bag is illegal', () => {
    const s = bagged(['tonic']);
    s.players[0].hearts = 5;
    assert.throws(() => act(s, { type: 'item', id: 'ward', target: 'p0c0' }), /Illegal/);
    assert.throws(() => act(s, { type: 'item', id: 'nonsense' }), /Illegal/);
});

test('targets follow the tactic rules (friendly / enemy, filters, Elusive)', () => {
    const s = bagged(['ward', 'greatcharm'], { p1: ['astrophysicat', 'shakirattle', 'astrophysicat'] });
    onBoard(s, 'p0c0', 'p0c1', 'p1c0', 'p1c1');
    same(items(s).filter(a => a.id === 'ward').map(a => a.target), ['p0c0', 'p0c1']);
    same(items(s).filter(a => a.id === 'greatcharm').map(a => a.target), ['p1c0'], 'the Elusive enemy is not a target');
    // A creature with Shield already is not a Ward target.
    s.cards.p0c1.extraKeywords.push('shield');
    same(items(s).filter(a => a.id === 'ward').map(a => a.target), ['p0c0']);
    assert.throws(() => act(s, { type: 'item', id: 'ward', target: 'p0c1' }), /Illegal/);
    assert.throws(() => act(s, { type: 'item', id: 'ward', target: 'p1c0' }), /Illegal/);
    assert.throws(() => act(s, { type: 'item', id: 'ward' }), /Illegal/, 'a targeted item needs its target');
    // No friendly creature at all: the tray says there is no target.
    const empty = bagged(['ward']);
    assert.equal(status(empty, 'ward').why, 'target');
    assert.match(status(empty, 'ward').note, /without Shield/);
});

test('Tonic restores 2 hearts (never above the maximum); not offered at full hearts', () => {
    let s = bagged(['tonic']);
    assert.equal(items(s).length, 0);
    assert.equal(status(s, 'tonic').why, 'useless');
    assert.match(status(s, 'tonic').note, /hearts are full/);
    s.players[0].hearts = 5;
    s = act(s, { type: 'item', id: 'tonic' });
    assert.equal(s.players[0].hearts, 7);
    assert.match(events(s, 'item-use')[0].text, /^A uses the Tonic\./);
    assert.match(events(s, 'item')[0].text, /Tonic: \+2 hearts \(7 now\)/);
    const t = bagged(['tonic']);
    t.players[0].hearts = 9;
    assert.equal(act(t, { type: 'item', id: 'tonic' }).players[0].hearts, 10);
});

test('Ward gives Shield; the next damage is blocked', () => {
    let s = bagged(['ward']);
    onBoard(s, 'p0c0', 'p1c0');
    s = act(s, { type: 'item', id: 'ward', target: 'p0c0' });
    assert.ok(E.hasKeyword(s, 'p0c0', 'shield'));
    s = act(s, { type: 'attack', cid: 'p0c0', target: 'p1c0' });
    assert.equal(s.cards.p0c0.damage, 0, 'the Shield took the hit');
    assert.ok(!E.hasKeyword(s, 'p0c0', 'shield'));
});

test('Mending fully heals a damaged friendly creature; only damaged ones are targets', () => {
    let s = bagged(['mending']);
    onBoard(s, 'p0c0', 'p0c1');
    stats(s, 'p0c0', 1, 5);
    s.cards.p0c0.damage = 4;
    same(items(s).map(a => a.target), ['p0c0']);
    s = act(s, { type: 'item', id: 'mending', target: 'p0c0' });
    assert.equal(E.healthOf(s, 'p0c0').current, 5);
    assert.equal(status(bagged(['mending']), 'mending').note, 'You need a damaged creature of yours.');
});

test('Lure Lantern draws a card; not offered with an empty deck or a full hand', () => {
    let s = bagged(['lure']);
    const top = s.players[0].deck[0];
    s = act(s, { type: 'item', id: 'lure' });
    assert.ok(s.players[0].hand.includes(top));
    // The public line comes before the private draw line.
    const kinds = s.lastEvents.map(e => e.t);
    assert.ok(kinds.indexOf('item') < kinds.indexOf('draw'));
    const empty = bagged(['lure']);
    empty.players[0].deck = [];
    assert.equal(items(empty).length, 0);
    assert.match(status(empty, 'lure').note, /deck is empty/);
    const full = bagged(['lure']);
    full.players[0].axHand = Array(10).fill('thrift');
    assert.match(status(full, 'lure').note, /hand is full/);
});

test('Catch Charm: an enemy with 2 or less health can\'t attack on its next turn', () => {
    let s = bagged(['charm']);
    onBoard(s, 'p0c0', 'p1c0', 'p1c1');
    stats(s, 'p1c0', 2, 2);
    stats(s, 'p1c1', 2, 4);
    same(items(s).map(a => a.target), ['p1c0']);
    s = act(s, { type: 'item', id: 'charm', target: 'p1c0' });
    s = pass(s);
    s.phase = 'main';
    assert.equal(E.decider(s), 1);
    assert.ok(!E.canAttack(s, 'p1c0'), 'the charmed creature can\'t attack');
    assert.ok(E.canAttack(s, 'p1c1'));
    s = pass(pass(s));
    assert.equal(E.decider(s), 1);
    assert.equal(s.phase, 'main');
    assert.ok(E.canAttack(s, 'p1c0'), 'only for one turn');
});

test('Great Charm: any enemy creature can\'t attack on its next turn', () => {
    let s = bagged(['greatcharm']);
    onBoard(s, 'p0c0', 'p1c0');
    stats(s, 'p1c0', 5, 8);
    s = act(s, { type: 'item', id: 'greatcharm', target: 'p1c0' });
    assert.ok(s.cards.p1c0.frozen);
    s = pass(s);
    s.phase = 'main';
    assert.ok(!E.canAttack(s, 'p1c0'));
});

test('Anchor: the Fate track does not move at the end of this turn (then it moves again)', () => {
    let s = bagged(['anchor', 'lure'], { options: { timeline: true, fateStart: 3 } });
    assert.equal(s.fate.until, 3);
    assert.equal(E.timeline(s)[0].turns, 3);
    s = act(s, { type: 'item', id: 'anchor' });
    assert.equal(s.players[0].energy, 10, 'free');
    assert.equal(E.timeline(s)[0].turns, 4, 'the lane counts the held turn');
    s = act(s, { type: 'end' });
    assert.equal(s.fate.until, 3, 'held');
    assert.ok(s.lastEvents.some(e => e.t === 'anchor'));
    assert.equal(E.timeline(s)[0].turns, 3);
    s = act(s, { type: 'draw', choice: 'deck' });
    s = act(s, { type: 'end' });
    assert.equal(s.fate.until, 2, 'the next End turn moves it again');
    // No Fate track: not offered.
    const off = bagged(['anchor']);
    assert.equal(items(off).length, 0);
    assert.match(status(off, 'anchor').note, /no Fate track/);
});

test('using an item leaves the input state untouched and is deterministic', () => {
    const s = bagged(['ward', 'tonic']);
    onBoard(s, 'p0c0');
    const before = JSON.stringify(s.players[0]);
    const a = act(s, { type: 'item', id: 'ward', target: 'p0c0' });
    const b = act(s, { type: 'item', id: 'ward', target: 'p0c0' });
    assert.equal(JSON.stringify(s.players[0]), before);
    same(s.players[0].bag, ['ward', 'tonic']);
    assert.equal(JSON.stringify(E.fullLog(a)), JSON.stringify(E.fullLog(b)));
    assert.equal(E.actionKey({ type: 'item', id: 'ward', target: 'p0c0' }) === E.actionKey({ type: 'item', id: 'mending', target: 'p0c0' }), false);
});

test('the AI never uses items, for either side', () => {
    const team = () => ['astrophysicat', 'zuckerborg', 'khaby', 'keanu', 'eelish', 'kardashiant', 'beansprout', 'attenbirdough'].map(x => inst(x));
    for (let g = 0; g < 6; g++) {
        const start = E.createBattle({ seed: 'ai-bag-' + g, players: [{ name: 'A', team: team(), bag: ['tonic', 'lure'] }, { name: 'B', team: team(), bag: ['ward', 'anchor'] }] });
        let used = 0;
        const end = AI.playOut(start, [g % 2 ? 'hard' : 'easy', 'easy'], (s, a) => { if (a.type === 'item') used++; });
        assert.equal(used, 0);
        same(end.players[0].bag, ['tonic', 'lure']);
    }
});

test('random play with bags: items get used and the card invariants hold', () => {
    const ids = Object.keys(Rift.data.items).filter(id => Rift.data.items[id].battle);
    let used = 0;
    for (let g = 0; g < 150; g++) {
        const rng = Rift.makeRng('bag-fuzz-' + g);
        let s = E.createBattle({
            seed: 'bag-fuzz-' + g,
            players: [{ name: 'A', team: E.randomTeam(rng, 10, { prefix: 'a' + g }), bag: [rng.pick(ids), rng.pick(ids)] }, { name: 'B', team: E.randomTeam(rng, 10, { prefix: 'b' + g }) }],
        });
        let steps = 0;
        while (E.winner(s) == null) {
            const legal = E.legalActions(s);
            const it = legal.filter(a => a.type === 'item');
            const a = it.length && rng.chance(0.5) ? rng.pick(it) : rng.pick(legal.filter(x => x.type !== 'end').concat(legal.filter(x => x.type === 'end')));
            s = E.applyAction(s, a);
            if (a.type === 'item') { used++; assert.ok(!s.lastEvents.some(e => e.t === 'fizzle')); }
            assert.ok(++steps < 4000);
        }
        invariants(s, assert);
        assert.equal(s.players[0].bag.length + s.players[0].itemsUsed.length, 2);
    }
    assert.ok(used > 100, 'items were used: ' + used);
});
