import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';

const Rift = loadRift([
    'js/core/rift.js', 'js/core/state.js', 'data/creatures.js', 'data/items.js', 'data/axioms.js', 'data/fate.js',
    'js/battle/abilities.js', 'js/battle/engine.js', 'js/battle/ai.js', 'js/battle/fate.js',
]);
const E = Rift.Battle.Engine;
const AI = Rift.Battle.AI;

let n = 0;
const inst = (species, extra) => Object.assign({ uid: 'u' + (++n), species, powerDelta: 0, injuries: [], scars: [], warped: null, trophyOf: null }, extra || {});
const setup = (p0, p1, opts) => { const state=E.createBattle({
    seed: (opts && opts.seed) || 'test',
    players: [
        { name: 'A', team: p0.map(x => typeof x === 'string' ? inst(x) : x) },
        { name: 'B', team: p1.map(x => typeof x === 'string' ? inst(x) : x) },
    ],
    axiomDeck: (opts && opts.axioms) || [],
    options: Object.assign({ shuffle: false, shuffleAxioms: false, first: 0 }, opts && opts.options),
});
state.players.forEach(P=>{P.energy=10;P.capacity=10;});return state;};
const J = x => JSON.parse(JSON.stringify(x));
const act = (s, a) => E.applyAction(s, Object.assign({ player: E.decider(s) }, a));
function toBoard(s, cid, p) {
    s.players.forEach(P => ['deck', 'hand', 'board', 'discard'].forEach(z => { const i = P[z].indexOf(cid); if (i >= 0) P[z].splice(i, 1); }));
    s.players[p].board.push(cid);
    s.cards[cid].controller = p;
    s.cards[cid].enteredTurn = 0;
}

const TEN = ['lobstorian', 'astrophysicat', 'tremendoodle', 'swiftlet', 'muskrat', 'zuckerborg', 'altmanta', 'beastie', 'siuuugull', 'speedcheeta'];

function checkInvariants(s) {
    const seen = {};
    s.players.forEach((P, p) => {
        ['deck', 'hand', 'board', 'discard'].forEach(z => P[z].forEach(cid => {
            assert.ok(s.cards[cid], 'unknown card ' + cid);
            assert.ok(!seen[cid], 'card in two zones: ' + cid);
            seen[cid] = true;
            if (z === 'board') assert.equal(s.cards[cid].controller, p, 'board controller mismatch');
        }));
        assert.ok(P.lives >= 0 && P.steals >= 0, 'negative lives or steals');
    });
    assert.equal(Object.keys(seen).length, Object.keys(s.cards).length, 'a card went missing');
    if (s.winner == null) {
        assert.ok(E.legalActions(s).length > 0, 'no legal actions in phase ' + s.phase);
        assert.ok(['action', 'haste', 'steal', 'block', 'choose', 'axiom'].includes(s.phase), 'bad phase ' + s.phase);
    } else {
        assert.equal(E.legalActions(s).length, 0);
    }
}

test('10,000 AI-vs-AI battles finish with no illegal states or exceptions', () => {
    const levels = [['hard', 'hard'], ['hard', 'easy'], ['easy', 'hard'], ['easy', 'easy']];
    const reasons = {};
    for (let g = 0; g < 10000; g++) {
        const rng = Rift.makeRng('fuzz:' + g);
        const teams = [0, 1].map(p => {
            const size = rng.chance(0.15) ? rng.int(1, 9) : 10; // short teams get padded
            return E.randomTeam(rng, size, { prefix: 'f' + g + p }).map(c => {
                if (rng.chance(0.1)) c.injuries = ['no-ability'];
                if (rng.chance(0.1)) c.powerDelta = -1;
                if (rng.chance(0.1)) c.warped = { ability: rng.pick(Rift.Battle.KEYWORDS) };
                return c;
            });
        });
        let s = E.createBattle({
            seed: 'fuzz:' + g,
            players: teams.map((team, p) => ({ team, consumables: rng.chance(0.2) ? { 'extra-steal': 1, 'extra-life': 1 } : {} })),
            axiomDeck: Object.keys(Rift.data.axioms),
        });
        checkInvariants(s);
        s = AI.playOut(s, levels[g % 4], (prev, a, next) => {
            if (g % 10 === 0) checkInvariants(next); // full checks on every 10th battle keep this fast
        });
        checkInvariants(s);
        assert.ok(s.winner === 0 || s.winner === 1 || s.winner === 'draw');
        reasons[s.endReason] = (reasons[s.endReason] || 0) + 1;
    }
    assert.ok(reasons.lives > 1000, JSON.stringify(reasons));
});

test('battles are deterministic per seed', () => {
    const run = seed => {
        const rng = Rift.makeRng('teams');
        const teams = [E.randomTeam(rng, 10, { prefix: 'a' }), E.randomTeam(rng, 10, { prefix: 'b' })];
        const s = AI.playOut(E.createBattle({ seed, players: teams.map(team => ({ team })) }), ['hard', 'easy']);
        return { winner: s.winner, turn: s.turn, log: E.fullLog(s).map(e => e.text).join('\n') };
    };
    assert.deepEqual(run('same'), run('same'));
    assert.notEqual(run('same').log, run('different').log);
});

test('applyAction never mutates its input state', () => {
    let s = E.createBattle({ seed: 'pure', players: [{ team: TEN.map(x => inst(x)) }, { team: TEN.map(x => inst(x)) }] });
    for (let i = 0; i < 60 && E.winner(s) == null; i++) {
        const before = JSON.stringify(Object.assign({}, s, { log: null }));
        const next = E.applyAction(s, AI.choose(s, { level: 'hard' }));
        assert.equal(JSON.stringify(Object.assign({}, s, { log: null })), before);
        s = next;
    }
});

test('creating and playing a battle does not change the team instances', () => {
    const team = TEN.map(x => inst(x));
    const copy = JSON.parse(JSON.stringify(team));
    AI.playOut(E.createBattle({ seed: 'x', players: [{ team }, { team: TEN.map(x => inst(x)) }] }), ['hard', 'hard']);
    assert.deepEqual(JSON.parse(JSON.stringify(team)), copy);
});

test('illegal actions are rejected', () => {
    const s = setup(TEN, TEN);
    assert.throws(() => E.applyAction(s, { type: 'attack', cid: 'p0c0' }), /Illegal/);
    assert.throws(() => E.applyAction(s, { type: 'play', cid: 'p1c0' }), /Illegal/);
    assert.throws(() => E.applyAction(s, { type: 'play', cid: 'p0c9' }), /Illegal/); // still in deck
});

test('short teams are padded with loaned commons that never roll fate', () => {
    const s = setup(['lobstorian'], TEN);
    assert.equal(s.players[0].hand.length + s.players[0].deck.length, 10);
    const loans = Object.values(s.cards).filter(c => c.owner === 0 && c.loaner);
    assert.equal(loans.length, 9);
    loans.forEach(c => assert.ok(E.PAD_SPECIES.includes(c.species)));
    s.players[0].discard.push(...s.players[0].hand.splice(0));
    assert.deepEqual(J(E.lostUids(s, 0)), [s.cards.p0c0.uid]);
});

test('setup: hand of 5, 6 lives, no automatic steals, life consumables still work', () => {
    const s = E.createBattle({ seed: 'c', players: [{ team: TEN.map(x => inst(x)), consumables: { 'extra-life': 1, 'extra-steal': 1 } }, { team: TEN.map(x => inst(x)) }] });
    assert.equal(s.players[0].hand.length, 5);
    assert.equal(s.players[1].hand.length, 5);
    assert.equal(s.players[0].lives, 7);
    assert.equal(s.players[0].steals, 1);
    assert.equal(s.players[1].lives, 6);
    assert.equal(s.players[1].steals, 0);
});

test('play remains on the same turn; draw happens next turn, not refill',()=>{
 let s=setup(TEN,TEN);s=act(s,{type:'play',cid:'p0c0'});assert.equal(s.active,0);assert.equal(s.players[0].hand.length,4);
 s=act(act(s,{type:'end'}),{type:'end'});assert.equal(s.players[0].hand.length,5);assert.equal(s.players[0].deck.length,4);
});

test('blocking: lower power is defeated, a tie defeats both; unblocked attacks cost a life', () => {
    let s = setup(TEN, TEN);
    toBoard(s, 'p0c0', 0); // lobstorian 6 (reason)
    toBoard(s, 'p1c1', 1); // astrophysicat 4 (reason)
    let t = act(s, { type: 'attack', cid: 'p0c0' });
    assert.equal(t.phase, 'block');
    t = act(t, { type: 'block', cid: 'p1c1' });
    assert.ok(t.players[1].discard.includes('p1c1'));
    assert.ok(t.players[0].board.includes('p0c0'));

    toBoard(s, 'p1c0', 1); // lobstorian 6 vs 6
    t = act(act(s, { type: 'attack', cid: 'p0c0' }), { type: 'block', cid: 'p1c0' });
    assert.ok(t.players[0].discard.includes('p0c0') && t.players[1].discard.includes('p1c0'));

    t = act(act(s, { type: 'attack', cid: 'p0c0' }), { type: 'take' });
    assert.equal(t.players[1].lives, 5);
});

test('losing the last life ends the battle', () => {
    const s = setup(TEN, TEN);
    toBoard(s, 'p0c0', 0);
    s.players[1].lives = 1;
    const t = act(s, { type: 'attack', cid: 'p0c0' });
    assert.equal(E.winner(t), 0);
    assert.equal(t.endReason, 'lives');
    assert.equal(E.legalActions(t).length, 0);
});

test('a player who cannot act (no hand, deck or board) loses', () => {
    const s = setup(TEN, TEN);
    s.players[1].discard.push(...s.players[1].hand.splice(0), ...s.players[1].deck.splice(0));
    const t = act(act(s, { type: 'play', cid: 'p0c0' }), { type: 'end' });
    assert.equal(E.winner(t), 0);
    assert.equal(t.endReason, 'cannot-act');
});

test('optional steal transfers ownership control without firing a paid ability for free',()=>{
 let s=setup(['swiftlet',...TEN.slice(1)],TEN,{options:{steals:2}});s=act(s,{type:'play',cid:'p0c0'});assert.equal(s.phase,'steal');s=act(s,{type:'steal'});
 assert.equal(s.cards.p0c0.controller,1);assert.equal(s.cards.p0c0.owner,0);assert.equal(s.players[1].knows.length,0);assert.equal(s.active,0);
});

test('no steal is offered when the opponent has no steals left', () => {
    const s = setup(TEN, TEN);
    s.players[1].steals = 0;
    const t = act(s, { type: 'play', cid: 'p0c0' });
    assert.equal(t.active, 0);
    assert.equal(t.phase, 'action');
});

test('stolen creatures that are defeated still count as lost for their owner', () => {
    const s = setup(TEN, TEN);
    s.cards.p0c0.controller = 1;
    s.players[1].discard.push('p0c0');
    s.players[0].hand.splice(s.players[0].hand.indexOf('p0c0'), 1);
    assert.deepEqual(J(E.lostUids(s, 0)), [s.cards.p0c0.uid]);
    assert.deepEqual(J(E.lostUids(s, 1)), []);
});

test('the event log reads as sentences and the full log is ordered', () => {
    let s = setup(TEN, TEN);
    s = act(s, { type: 'play', cid: 'p0c0' });
    const texts = E.fullLog(s).map(e => e.text);
    assert.ok(texts.includes('A plays Lobstorian.'), texts.join(' | '));
    assert.ok(texts.indexOf('A goes first.') < texts.indexOf('A plays Lobstorian.'));
    const you = E.createBattle({ seed: 'y', players: [{ name: 'You', team: TEN.map(x => inst(x)) }, { team: TEN.map(x => inst(x)) }], options: { first: 0 } });
    assert.equal(E.fullLog(you).find(e => e.t === 'start').text, 'You go first.');
});

test('turn limit is a draw regardless of a temporary victory rule',()=>{
 let s=setup(TEN,TEN,{options:{maxTurns:2}});s.players[1].lives=2;s=act(act(s,{type:'end'}),{type:'end'});assert.equal(s.winner,'draw');assert.equal(s.endReason,'turn-limit');
});
