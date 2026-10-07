// Random legal play: every game terminates, never throws, and keeps the card invariants.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';

const Rift = loadRift([
    'js/core/rift.js', 'js/core/state.js', 'data/creatures.js', 'data/items.js', 'data/axioms.js', 'data/tactics.js', 'data/fate.js',
    'js/battle/abilities.js', 'js/battle/engine.js',
]);
const E = Rift.Battle.Engine;
// Player 0 may bring bag items (the Bag), so item actions are fuzzed too.
const BAG_IDS = Object.keys(Rift.data.items).filter(id => Rift.data.items[id].battle);

function invariants(s) {
    const seen = {};
    s.players.forEach((P, p) => {
        ['deck', 'hand', 'board', 'discard'].forEach(zone => P[zone].forEach(cid => {
            assert.ok(s.cards[cid], 'unknown card ' + cid);
            assert.ok(!seen[cid], cid + ' is in two zones');
            seen[cid] = zone;
            assert.equal(s.cards[cid].owner, p, cid + ' is in the wrong player\'s ' + zone);
        }));
        assert.ok(P.board.length <= s.options.boardLimit, 'board limit');
        assert.ok(P.hand.length + P.axHand.length <= s.options.handLimit, 'hand limit');
        assert.ok(P.energy >= 0, 'energy never negative');
        P.board.forEach(cid => assert.ok(E.healthOf(s, cid).current > 0 || s.winner != null, 'no dead creature stays on the board'));
    });
    assert.equal(Object.keys(seen).length, Object.keys(s.cards).length, 'every card is somewhere');
}

test('2,000 random games terminate with consistent states', () => {
    for (let g = 0; g < 2000; g++) {
        const rng = Rift.makeRng('fuzz-' + g);
        const team = p => E.randomTeam(rng, rng.int(4, 14), { prefix: 'f' + g + p });
        const tactics = () => rng.shuffle(Object.keys(Rift.data.tactics).concat(Object.keys(Rift.data.tactics))).slice(0, rng.int(0, 12));
        let s = E.createBattle({
            seed: 'fuzz-' + g,
            players: [{ name: 'A', team: team(0), tactics: tactics(), bag: rng.chance(0.7) ? [rng.pick(BAG_IDS), rng.pick(BAG_IDS)] : [] }, { name: 'B', team: team(1), tactics: tactics() }],
            axiomDeck: rng.shuffle(Object.keys(Rift.data.axioms)).slice(0, 20),
        });
        let steps = 0;
        while (E.winner(s) == null) {
            const legal = E.legalActions(s);
            assert.ok(legal.length, 'a live game always has a legal action (phase ' + s.phase + ')');
            // Lean towards attacking/playing so games finish; End sometimes.
            const nonEnd = legal.filter(a => a.type !== 'end');
            const a = nonEnd.length && !rng.chance(0.15) ? rng.pick(nonEnd) : rng.pick(legal);
            const tactic = (a.type === 'play' && s.cards[a.cid].kind === 'tactic') || a.type === 'item';
            s = E.applyAction(s, a);
            // Offered activations and tactics never fizzle (those that would are left out).
            if (a.type === 'activate' || tactic) assert.ok(!s.lastEvents.some(e => e.t === 'fizzle'), 'offered ' + (a.ability || a.cid || a.id) + ' fizzled');
            if (a.type === 'item') assert.equal(s.players[a.player].itemTurn, s.turn, 'one item per turn');
            if (g % 50 === 0) invariants(s);
            assert.ok(++steps < 4000, 'game ' + g + ' did not finish');
        }
        invariants(s);
        assert.equal(s.players[0].bag.length + s.players[0].itemsUsed.length, E.bagSelection(s.players[0].bag.concat(s.players[0].itemsUsed)).length, 'items only leave the bag by being used');
        // Cards discarded from a full hand never count as defeated.
        [0, 1].forEach(p => E.lostUids(s, p).forEach(uid => assert.ok(!Object.values(s.cards).some(c => c.uid === uid && c.burned), 'burned card reported lost')));
    }
});

test('the same seed and actions give the same game', () => {
    const play = () => {
        let s = E.createBattle({ seed: 'det', players: [{ name: 'A', team: E.randomTeam(Rift.makeRng('a'), 10) }, { name: 'B', team: E.randomTeam(Rift.makeRng('b'), 10) }] });
        const rng = Rift.makeRng('acts');
        while (E.winner(s) == null) s = E.applyAction(s, rng.pick(E.legalActions(s)));
        return JSON.stringify(E.fullLog(s));
    };
    assert.equal(play(), play());
});
