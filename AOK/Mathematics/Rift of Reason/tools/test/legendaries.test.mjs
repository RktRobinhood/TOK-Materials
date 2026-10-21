// Legendaries are one of a kind (teacher, 17 Oct 2026): a folder of one, one per deck, no repeat
// spawns, and the roaming legendaries (#111) are stronger than the common cards they echo.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';
import { Rift as B, E, setup, act, onBoard, toHand, pass, hp, atk, events, plain, stats } from './battle-helpers.mjs';

const files = ['js/core/rift.js', 'js/core/state.js', 'js/core/world.js', 'data/map.js', 'data/creatures.js', 'data/fate.js', 'js/battle/ante.js'];
const game = () => { const Rift = loadRift(files); return { Rift, S: Rift.State, s: Rift.State.freshState() }; };
const common = Rift => Object.keys(Rift.data.creatures).find(id => Rift.data.creatures[id].rarity === 'common');

test('a legendary folder holds one; other creatures still hold four', () => {
    const { Rift, S, s } = game();
    assert.equal(S.copyCap('godelix'), 1);
    assert.equal(S.copyCap(common(Rift)), 4);
    assert.equal(S.addCreature(s, S.makeCreature('godelix')), true);
    assert.equal(S.hasRoom(s, 'godelix'), false);
    assert.equal(S.addCreature(s, S.makeCreature('godelix')), false, 'a second copy is refused');
    assert.equal(S.roomFor(s, 'godelix'), 0);
    assert.match(S.fullReason('godelix'), /^You already have Gödelix\. Legendaries are one of a kind\.$/);
    assert.match(S.fullReason(common(Rift)), /folder is full \(4 copies\)/);
});

test('an old save with two copies keeps both, but a deck takes only one', () => {
    const { S, s } = game();
    const a = S.makeCreature('maskip'), b = S.makeCreature('maskip');
    s.creatures.push(a, b);
    assert.equal(S.copiesOf(s, 'maskip'), 2, 'nothing is deleted');
    assert.equal(S.defaultTeam(s).filter(c => c.species === 'maskip').length, 1);
    const two = S.validateDeck({ creatures: [a, b], tactics: [] }, { complete: false });
    const p = two.problems.find(x => x.code === 'copies');
    assert.ok(p, 'two copies of a legendary break the deck rules');
    assert.equal(p.text, 'Maskip is legendary: one per deck. Remove 1.');
    assert.ok(!S.validateDeck({ creatures: [a], tactics: [] }, { complete: false }).problems.some(x => x.code === 'copies'));
    assert.equal(S.deckCopies('maskip'), 1);
    assert.equal(S.deckCopies('astrophysicat'), 2);
});

test('a won legendary you already have becomes a Catch Charm, said plainly', () => {
    const { Rift, S, s } = game();
    S.addCreature(s, S.makeCreature('tycho'));
    const ante = { type: 'trainer', player: { items: {} }, opponent: { items: {}, creatures: ['tycho'], trophy: null } };
    const res = Rift.Battle.Ante.settle(ante, 'won', { seed: 'x', now: 1, room: sp => S.roomFor(s, sp) });
    assert.equal(res.creaturesGained.length, 0);
    assert.equal(res.itemsDelta.charm, 1);
    assert.ok(res.lines.includes('You already have Tycho. Legendaries are one of a kind. You take a Catch Charm instead.'));
});

test('an owned legendary stops turning up in the wild', () => {
    const { Rift, S, s } = game();
    const n = Object.assign({ id: 'standing-stone' }, Rift.data.map.nodes['standing-stone']);
    s.flags['rumour:godelix'] = true;
    assert.ok('godelix' in Rift.World.spawnWeights(s, n));
    S.addCreature(s, S.makeCreature('godelix'));
    assert.ok(!('godelix' in Rift.World.spawnWeights(s, n)));
});

test('the roaming legendaries sit above the cards they echo', () => {
    const C = B.data.creatures;
    const pair = [['maskip', 'eelish'], ['quibblequill', 'carlseal'], ['oddsnap', 'altmanta']];
    for (const [legend, echo] of pair) {
        const l = C[legend], e = C[echo];
        assert.equal(l.abilityText, B.Battle.Abilities[l.ability].text, legend);
        assert.ok(l.abilityText.length <= 106, legend + ': card text fits');
        assert.ok(l.attack + l.health - l.cost > e.attack + e.health - e.cost, legend + ' beats ' + echo + ' for its cost');
    }
});

test('Lantern Switch: every enemy creature loses its abilities, keywords and boosts', () => {
    let s = setup({ p0: ['maskip'], p1: ['khaby', 'rockodile'] });
    onBoard(s, 'p1c0', 'p1c1');
    s.cards.p1c1.buffs.push({ label: 'x', attack: 2, health: 0 });
    toHand(s, 'p0c0');
    s = act(s, { type: 'play', cid: 'p0c0' });
    for (const cid of ['p1c0', 'p1c1']) {
        assert.deepEqual(plain(E.keywordsOf(s, cid)), []);
        assert.equal(E.describe(s, cid).silenced, true);
    }
    assert.equal(atk(s, 'p1c1'), s.cards.p1c1.attack, 'the boost is gone');
    assert.match(events(s, 'ability')[0].text, /Every enemy creature loses/);
});

test('Cross-Examine: Guard, 1 less damage from each hit, reads the hand and draws 2', () => {
    let s = setup({ p0: ['quibblequill', 'kardashiant', 'astrophysicat'], p1: ['kardashiant', 'astrophysicat'] });
    toHand(s, 'p0c0', 'p1c0', 'p1c1');
    s = act(s, { type: 'play', cid: 'p0c0' });
    assert.deepEqual(plain(s.players[0].knows).sort(), ['p1c0', 'p1c1']);
    assert.equal(s.players[0].hand.length, 2);
    assert.ok(E.keywordsOf(s, 'p0c0').includes('guard'));
    let t = setup({ p0: ['kardashiant'], p1: ['quibblequill'] });
    onBoard(t, 'p0c0', 'p1c0');
    stats(t, 'p0c0', 3, 9);
    t = act(t, { type: 'attack', cid: 'p0c0', target: 'p1c0' });
    assert.equal(hp(t, 'p1c0'), B.data.creatures.quibblequill.health - 1, 'Weak −1 then Cross-Examine prevents one more');
});

test('Loaded Odds: right gives +3/+3 and a card; wrong still gives +1/+1', () => {
    let s = setup({ p0: ['oddsnap', 'kardashiant', 'astrophysicat'], p1: ['rockodile', 'astrophysicat'] });
    onBoard(s, 'p0c0');
    stats(s, 'p0c0', 3, 4);
    toHand(s, 'p1c0', 'p1c1');
    s = act(s, { type: 'activate', cid: 'p0c0', ability: 'loaded-odds' });
    s = act(s, { type: 'choose', choice: B.data.creatures.rockodile.colour });
    s = pass(s);
    s.players[1].energy = 10;
    const hand = s.players[0].hand.length;
    const right = act(s, { type: 'play', cid: 'p1c0' });
    assert.equal(atk(right, 'p0c0'), 6);
    assert.equal(E.healthOf(right, 'p0c0').max, 7);
    assert.equal(right.players[0].hand.length, hand + 1, 'a right guess draws a card');
    const wrong = act(s, { type: 'play', cid: 'p1c1' });
    assert.equal(atk(wrong, 'p0c0'), 4);
    assert.equal(E.healthOf(wrong, 'p0c0').max, 5);
    assert.equal(wrong.players[0].hand.length, hand);
});
