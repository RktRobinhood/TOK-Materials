// Shared set-up for the Card Arena tests (not a test file itself).
//
//   const { Rift, E, AI, setup, act, onBoard, rule } = await import('./battle-helpers.mjs');
//
// setup() builds a quiet battle for focused rule tests: no shuffling, player 0 first,
// empty opening hands, no Spark, no Fate track, 10 hearts and 10 energy each, and the
// main phase. Creature cids follow the team order (p0c0, p0c1, …); tactics are p0t0, ….
import { loadRift } from './harness.mjs';

export const Rift = loadRift([
    'js/core/rift.js', 'js/core/state.js', 'data/creatures.js', 'data/items.js', 'data/axioms.js', 'data/tactics.js', 'data/fate.js', 'data/avatars.js', 'data/powers.js',
    'js/battle/abilities.js', 'js/battle/engine.js', 'js/battle/ai.js',
]);
export const E = Rift.Battle.Engine;
export const AI = Rift.Battle.AI;

let n = 0;
export const inst = (species, extra) => Object.assign({ uid: 'u' + (++n), species, powerDelta: 0, injuries: [], scars: [], warped: null, trophyOf: null }, extra || {});
const asInst = x => (typeof x === 'string' ? inst(x) : x);

// powers: [player 0's power, player 1's power] as { id, tweaks } (hero powers, data/powers.js).
export function setup({ p0 = [], p1 = [], t0 = [], t1 = [], axioms = [], options = {}, energy = 10, main = true, powers = [] } = {}) {
    const s = E.createBattle({
        seed: 'rules',
        players: [{ name: 'A', team: p0.map(asInst), tactics: t0, power: powers[0] }, { name: 'B', team: p1.map(asInst), tactics: t1, power: powers[1] }],
        axiomDeck: axioms,
        options: Object.assign({ first: 0, shuffle: false, shuffleAxioms: false, openHand: [0, 0], openAxioms: 0, spark: false, timeline: false, hearts: 10 }, options),
    });
    if (energy != null) s.players.forEach(P => { P.energy = energy; P.capacity = energy; });
    if (main) s.phase = 'main';
    return s;
}

// Apply an action as whoever must act now.
export const act = (s, a) => E.applyAction(s, Object.assign({ player: E.decider(s) }, a));

// Move a card from wherever it is to its owner's board, ready to act (entered on turn 0).
export function onBoard(s, ...cids) {
    cids.forEach(cid => {
        const c = s.cards[cid];
        s.players.forEach(P => ['deck', 'hand', 'board', 'discard'].forEach(z => { const i = P[z].indexOf(cid); if (i >= 0) P[z].splice(i, 1); }));
        s.players[c.owner].board.push(cid);
        c.controller = c.owner;
        c.enteredTurn = 0;
    });
    return s;
}
export function toHand(s, ...cids) {
    cids.forEach(cid => {
        const c = s.cards[cid];
        s.players.forEach(P => ['deck', 'hand', 'board', 'discard'].forEach(z => { const i = P[z].indexOf(cid); if (i >= 0) P[z].splice(i, 1); }));
        s.players[c.owner].hand.push(cid);
    });
    return s;
}
export function toDiscard(s, ...cids) {
    cids.forEach(cid => {
        const c = s.cards[cid];
        s.players.forEach(P => ['deck', 'hand', 'board', 'discard'].forEach(z => { const i = P[z].indexOf(cid); if (i >= 0) P[z].splice(i, 1); }));
        s.players[c.owner].discard.push(cid);
    });
    return s;
}

// Make an axiom the active rule of its category.
export function rule(s, id) {
    s.axioms.active = Object.assign({}, s.axioms.active, { [Rift.data.axioms[id].category]: id });
    return s;
}

// End the current turn and skip the next player's draw (they choose 'forward' or 'none').
export function pass(s) {
    s = act(s, { type: 'end' });
    if (s.phase === 'draw') {
        const legal = E.legalActions(s);
        const quiet = legal.find(a => a.choice === 'none') || legal.find(a => a.choice === 'rewind') || legal[0];
        s = E.applyAction(s, quiet);
    }
    return s;
}

export const hp = (s, cid) => E.healthOf(s, cid).current;
export const atk = (s, cid) => E.attackOf(s, cid);
export const events = (s, t) => s.lastEvents.filter(e => e.t === t);

// Card invariants used by the fuzz tests.
export function invariants(s, assert) {
    const seen = {};
    s.players.forEach((P, p) => {
        ['deck', 'hand', 'board', 'discard'].forEach(zone => P[zone].forEach(cid => {
            assert.ok(s.cards[cid], 'unknown card ' + cid);
            assert.ok(!seen[cid], cid + ' is in two zones');
            seen[cid] = zone;
            // On the board it is the controller's (Persuasion takes control); everywhere else the owner's.
            assert.equal(zone === 'board' ? s.cards[cid].controller : s.cards[cid].owner, p, cid + ' is in the wrong player\'s ' + zone);
            if (zone !== 'board') assert.equal(s.cards[cid].controller, p, cid + ' off the board is controlled by its owner');
        }));
        assert.ok(P.board.length <= s.options.boardLimit, 'board limit');
        assert.ok(P.hand.length + P.axHand.length <= s.options.handLimit, 'hand limit');
        assert.ok(P.energy >= 0, 'energy never negative');
        assert.ok(P.hearts >= 0 && P.hearts <= P.maxHearts, 'hearts in range');
        assert.ok(s.fate.until >= 0 && s.fate.until <= s.options.fateMax, 'fate in range');
        P.board.forEach(cid => assert.ok(E.healthOf(s, cid).current > 0 || s.winner != null, 'no dead creature stays on the board'));
    });
    assert.equal(Object.keys(seen).length, Object.keys(s.cards).length, 'every card is somewhere');
}

// Values from the game's vm context have their own Array/Object prototypes; compare plain copies.
export const plain = x => (x === undefined ? x : JSON.parse(JSON.stringify(x)));

// Give a card exact printed stats (keeps rule tests independent of balance changes).
export function stats(s, cid, attack, health) {
    s.cards[cid].attack = attack;
    s.cards[cid].health = health;
    return s;
}
