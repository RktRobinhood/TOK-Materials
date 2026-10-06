// Card Arena engine: set-up, draw choice, energy, readiness, turn flow, victory, Fate track
// and determinism (design/card-arena-2026-10-07.md).
import test from 'node:test';
import assert from 'node:assert/strict';
import { Rift, E, AI, inst, setup, act, onBoard, toHand, rule, events, plain, stats } from './battle-helpers.mjs';

const same = (a, b, m) => assert.deepEqual(plain(a), b, m);

const TEN = ['astrophysicat', 'zuckerborg', 'siuuugull', 'khaby', 'keanu', 'eelish', 'kardashiant', 'beansprout', 'attenbirdough', 'usainvolt'];
const fresh = (options, extra) => E.createBattle(Object.assign({
    seed: 'engine',
    players: [{ name: 'A', team: TEN.map(x => inst(x)) }, { name: 'B', team: TEN.map(x => inst(x)) }],
    options: Object.assign({ first: 0 }, options),
}, extra));
const zones = P => P.deck.length + P.hand.length + P.board.length + P.discard.length;

// ---- set-up -------------------------------------------------------------------------

test('opening hands: first player deck cards + an axiom; second player one more card, an axiom and the Spark', () => {
    const [first, second] = E.DEFAULTS.openHand;
    assert.ok(E.DEFAULTS.hearts >= 10 && E.DEFAULTS.hearts <= 15, 'about ten hearts');
    assert.ok(second > first, 'the second player gets more cards');
    for (const who of [0, 1]) {
        const s = fresh({ first: who });
        assert.equal(s.active, who);
        assert.equal(s.phase, 'draw');
        assert.equal(s.players[who].hand.length, first);
        assert.equal(s.players[1 - who].hand.length, second);
        s.players.forEach(P => { assert.equal(P.axHand.length, 1); assert.equal(P.hearts, E.DEFAULTS.hearts); assert.equal(zones(P), 20); });
        assert.equal(s.players[who].spark, false);
        assert.equal(s.players[1 - who].spark, true);
        assert.equal(s.players[who].capacity, 1);
        assert.equal(s.players[who].energy, 1);
        assert.equal(s.axioms.deck.length, 20 - 2);
    }
});

test('a deck is the team plus ten starter tactics; small teams are padded with loaners', () => {
    const s = E.createBattle({ seed: 'pad', players: [{ team: [inst('khaby'), inst('keanu')] }, { team: [] }], options: { first: 0, shuffle: false, openHand: [0, 0], openAxioms: 0 } });
    const P = s.players[0];
    const creatures = P.deck.filter(cid => s.cards[cid].kind === 'creature');
    const tactics = P.deck.filter(cid => s.cards[cid].kind === 'tactic');
    assert.equal(creatures.length, 10);
    same(tactics.map(cid => s.cards[cid].tactic), plain(Rift.data.tacticDecks.starter));
    assert.equal(s.cards.p0c0.species, 'khaby');
    assert.equal(creatures.filter(cid => s.cards[cid].loaner).length, 8);
    creatures.filter(cid => s.cards[cid].loaner).forEach(cid => assert.ok(E.PAD_SPECIES.includes(s.cards[cid].species)));
    assert.equal(E.lostUids(s, 0).length, 0);
});

test('deck building limits: at most 14 creatures and two copies of a tactic', () => {
    const team = Array.from({ length: 16 }, () => inst('zuckerborg'));
    const s = E.createBattle({ seed: 'big', players: [{ team, tactics: ['lemma', 'lemma', 'lemma', 'recall', 'nonsense'] }, { team: [] }], options: { first: 0, openHand: [0, 0], openAxioms: 0 } });
    const P = s.players[0];
    assert.equal(P.deck.filter(cid => s.cards[cid].kind === 'creature').length, 14);
    same(P.deck.filter(cid => s.cards[cid].kind === 'tactic').map(cid => s.cards[cid].tactic).sort(), ['lemma', 'lemma', 'recall']);
    same(E.tacticSelection(['lemma', 'lemma', 'lemma', 'x']), ['lemma', 'lemma']);
});

test('the shared axiom deck takes ten distinct cards from each side, topped up from the default pool', () => {
    const deck = E.buildAxiomDeck(['haste', 'haste', 'nonsense'], []);
    assert.equal(deck.length, 20);
    assert.equal(deck.slice(0, 10).filter(id => id === 'haste').length, 1);
    deck.forEach(id => assert.ok(Rift.data.axioms[id]));
});

// ---- draw choice ----------------------------------------------------------------------

test('draw choice: deck, axiom card, Fate forward or rewind, each exactly once per turn', () => {
    let s = fresh({ openHand: [0, 0], openAxioms: 0 });
    same(E.legalActions(s).map(a => a.choice), ['deck', 'axiom', 'forward', 'rewind']);
    assert.ok(!E.legalActions(s).some(a => a.type === 'end'), 'the draw comes first');
    const top = s.players[0].deck[0];
    let d = act(s, { type: 'draw', choice: 'deck' });
    same(d.players[0].hand, [top]);
    assert.equal(d.phase, 'main');
    assert.ok(!E.legalActions(d).some(a => a.type === 'draw'));
    const ax = s.axioms.deck[0];
    d = act(s, { type: 'draw', choice: 'axiom' });
    same(d.players[0].axHand, [ax]);
    assert.equal(d.axioms.deck.length, s.axioms.deck.length - 1);
    d = act(s, { type: 'draw', choice: 'forward' });
    assert.equal(d.fate.until, s.fate.until - 2);
    assert.equal(d.players[0].hand.length, 0);
    d = act(s, { type: 'draw', choice: 'rewind' });
    assert.equal(d.fate.until, s.fate.until + 2);
});

test('a full hand blocks drawing but not the time choices; an empty deck greys out Deck', () => {
    let s = fresh({ openHand: [0, 0], openAxioms: 0 });
    const P = s.players[0];
    while (P.hand.length < 10) P.hand.push(P.deck.shift());
    same(E.legalActions(s).map(a => a.choice), ['forward', 'rewind']);
    P.deck.unshift(P.hand.pop());
    P.axHand.push('haste');
    same(E.legalActions(s).map(a => a.choice), ['forward', 'rewind'], 'axiom cards count towards the hand');
    s = fresh({ openHand: [0, 0], openAxioms: 0, timeline: false });
    s.players[0].deck = [];
    same(E.legalActions(s).map(a => a.choice), ['axiom']);
    s.axioms.deck = [];
    same(E.legalActions(s).map(a => a.choice), ['none']);
    const d = act(s, { type: 'draw', choice: 'none' });
    assert.equal(d.phase, 'main');
});

test('Second Opinion (study) draws two cards from the deck or the axiom deck', () => {
    const s = rule(fresh({ openHand: [0, 0], openAxioms: 0 }), 'study');
    assert.equal(act(s, { type: 'draw', choice: 'deck' }).players[0].hand.length, 2);
    assert.equal(act(s, { type: 'draw', choice: 'axiom' }).players[0].axHand.length, 2);
});

test('the axiom deck reshuffles its discard pile when it runs out', () => {
    const s = fresh({ openHand: [0, 0], openAxioms: 0 });
    s.axioms.discard = s.axioms.deck.splice(0);
    const d = act(s, { type: 'draw', choice: 'axiom' });
    assert.equal(d.players[0].axHand.length, 1);
    assert.equal(d.axioms.discard.length, 0);
    assert.equal(d.axioms.deck.length, 19);
});

// ---- energy and turns -------------------------------------------------------------------

test('energy capacity grows by one each own turn to ten and refills; unspent energy is lost', () => {
    let s = fresh({ openHand: [0, 0], openAxioms: 0, timeline: false });
    const seen = [];
    for (let i = 0; i < 24; i++) {
        if (s.phase === 'draw') s = act(s, { type: 'draw', choice: E.legalActions(s)[0].choice });
        if (s.active === 0) seen.push([s.players[0].capacity, s.players[0].energy]);
        s = act(s, { type: 'end' });
    }
    same(seen.map(x => x[0]), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10]);
    seen.forEach(([cap, energy]) => assert.equal(energy, cap));
});

test('Growing Ideas (abundance) adds two capacity per turn; the Spark adds one energy once', () => {
    let s = rule(fresh({ first: 0 }), 'abundance');
    s = act(s, { type: 'draw', choice: 'forward' });
    s = act(s, { type: 'end' });
    assert.equal(s.players[1].capacity, 2);
    s = act(s, { type: 'draw', choice: 'rewind' });
    assert.ok(E.legalActions(s).some(a => a.type === 'spark'));
    s = act(s, { type: 'spark' });
    assert.equal(s.players[1].energy, 3);
    assert.equal(s.players[1].spark, false);
    assert.ok(!E.legalActions(s).some(a => a.type === 'spark'));
});

test('playing spends energy; a new creature sleeps unless it is Swift or the Arrival rule is on', () => {
    let s = setup({ p0: ['keanu', 'usainvolt', 'zuckerborg'], energy: 10 });
    toHand(s, 'p0c0', 'p0c1', 'p0c2');
    s = act(s, { type: 'play', cid: 'p0c0' });
    assert.equal(s.players[0].energy, 10 - Rift.data.creatures.keanu.cost);
    assert.equal(E.isSleeping(s, 'p0c0'), true);
    assert.equal(E.canAttack(s, 'p0c0'), false);
    s = act(s, { type: 'play', cid: 'p0c1' });
    assert.equal(E.isSleeping(s, 'p0c1'), false, 'Swift');
    assert.ok(E.legalActions(s).some(a => a.type === 'attack' && a.cid === 'p0c1'));
    s = rule(s, 'arrival');
    s = act(s, { type: 'play', cid: 'p0c2' });
    assert.equal(E.canAttack(s, 'p0c2'), true, 'Ready on Arrival');
    assert.throws(() => act(s, { type: 'play', cid: 'p0c3' }), /Illegal/);
});

test('cards cost energy: too-expensive cards are not legal, Thrift and Luxury change creature costs', () => {
    let s = setup({ p0: ['muskrat', 'kardashiant'], t0: ['counterexample'], energy: 5 });
    toHand(s, 'p0c0', 'p0c1', 'p0t0');
    assert.ok(!E.legalActions(s).some(a => a.cid === 'p0c0'));
    rule(s, 'thrift');
    assert.equal(E.playCost(s, 'p0c0'), 5);
    assert.equal(E.playCost(s, 'p0c1'), 0);
    assert.equal(E.playCost(s, 'p0t0'), 2, 'tactics are not creatures');
    assert.ok(E.legalActions(s).some(a => a.cid === 'p0c0'));
    rule(s, 'luxury');
    assert.equal(E.playCost(s, 'p0c1'), 2);
});

test('the board holds at most seven creatures', () => {
    let s = setup({ p0: Array(9).fill('kardashiant') });
    onBoard(s, 'p0c0', 'p0c1', 'p0c2', 'p0c3', 'p0c4', 'p0c5', 'p0c6');
    toHand(s, 'p0c7');
    assert.ok(!E.legalActions(s).some(a => a.type === 'play'));
});

test('End turn passes play, advances the turn and round, and resets attacks', () => {
    let s = setup({ p0: ['keanu'], p1: ['keanu'] });
    onBoard(s, 'p0c0');
    s = act(s, { type: 'attack', cid: 'p0c0', target: 'h1' });
    assert.equal(s.players[1].hearts, 8);
    assert.equal(E.canAttack(s, 'p0c0'), false);
    s = act(s, { type: 'end' });
    assert.equal(s.active, 1);
    assert.equal(s.turn, 2);
    assert.equal(s.round, 1);
    s = act(s, { type: 'draw', choice: 'deck' });
    s = act(s, { type: 'end' });
    assert.equal(s.round, 2);
    s = act(s, { type: 'draw', choice: 'deck' });
    assert.equal(E.canAttack(s, 'p0c0'), true);
});

// ---- victory --------------------------------------------------------------------------------

test('reducing the enemy hero to zero hearts wins; under The Last Shall Be First it makes them win', () => {
    let s = setup({ p0: ['usainvolt'] });
    onBoard(s, 'p0c0');
    stats(s, 'p0c0', 3, 1);
    s.players[1].hearts = 3;
    let d = act(s, { type: 'attack', cid: 'p0c0', target: 'h1' });
    assert.equal(d.winner, 0);
    assert.equal(d.endReason, 'hearts');
    same(E.legalActions(d), []);
    rule(s, 'reverse-hearts');
    d = act(s, { type: 'attack', cid: 'p0c0', target: 'h1' });
    assert.equal(d.winner, 1);
    assert.equal(d.endReason, 'reverse-hearts');
});

test('both heroes at zero is a draw', () => {
    const s = setup({});
    s.players[0].hearts = 0;
    s.players[1].hearts = 0;
    const d = act(s, { type: 'end' });
    assert.equal(d.winner, 'draw');
    assert.equal(d.endReason, 'both-zero');
});

test('a player who starts a turn with no creatures anywhere loses', () => {
    let s = setup({ p0: ['keanu'], p1: ['keanu'] });
    const P = s.players[1];
    P.deck.concat(P.hand).filter(cid => s.cards[cid].kind === 'creature').forEach(cid => {
        P.deck = P.deck.filter(x => x !== cid); P.hand = P.hand.filter(x => x !== cid); P.discard.push(cid);
    });
    assert.equal(E.creaturesLeft(s, 1), false);
    s = act(s, { type: 'end' });
    assert.equal(s.winner, 0);
    assert.equal(s.endReason, 'cannot-act');
});

test('the turn limit ends the battle in a draw', () => {
    let s = setup({ options: { maxTurns: 2 } });
    s = act(s, { type: 'end' });
    s = act(s, { type: 'draw', choice: 'deck' });
    s = act(s, { type: 'end' });
    assert.equal(s.winner, 'draw');
    assert.equal(s.endReason, 'turn-limit');
});

// ---- Fate track ---------------------------------------------------------------------------------

test('Fate: End turn moves it one closer; forward/rewind move two, clamped to 0..12', () => {
    let s = fresh({ openHand: [0, 0], openAxioms: 0 });
    assert.equal(s.fate.until, E.DEFAULTS.fateStart);
    let d = act(s, { type: 'draw', choice: 'rewind' });
    for (let i = 0; i < 6; i++) { d = act(d, { type: 'end' }); d = act(d, { type: 'draw', choice: 'rewind' }); }
    assert.equal(d.fate.until, 12);
    d = act(s, { type: 'draw', choice: 'deck' });
    d = act(d, { type: 'end' });
    assert.equal(d.fate.until, E.DEFAULTS.fateStart - 1);
    assert.equal(E.timeline(s)[0].turns, s.fate.until);
    assert.equal(E.timeline(s)[0].type, 'flip');
    assert.equal(E.timeline(s)[1].type, 'reset');
});

test('Fate flips the top shared axiom at zero, then resets every rule six spaces later', () => {
    let s = fresh({ openHand: [0, 0], openAxioms: 0, fateStart: 2 }, { axiomDeck: ['haste', 'underdog', 'mercy'] });
    s.axioms.deck = ['haste', 'underdog', 'mercy'];
    s = act(s, { type: 'draw', choice: 'forward' });
    assert.equal(s.axioms.active.attacks, 'haste');
    assert.equal(s.fate.until, E.DEFAULTS.fateGap);
    assert.equal(s.fate.events, 1);
    assert.ok(s.lastEvents.some(e => e.t === 'flip'));
    rule(s, 'underdog');
    s.fate.until = 1;
    s = act(s, { type: 'end' });
    same(s.axioms.active, {});
    assert.ok(s.axioms.discard.includes('haste') && s.axioms.discard.includes('underdog'));
    assert.equal(s.fate.events, 2);
    assert.equal(E.timeline(s)[0].type, 'flip');
});

test('Fate events trigger in the middle of a turn (Clockwork, Filter)', () => {
    let s = setup({ p0: ['kardashiant'], t0: ['clockwork'], options: { timeline: true }, axioms: ['haste'] });
    s.fate.until = 3;
    toHand(s, 'p0t0');
    s = act(s, { type: 'play', cid: 'p0t0' });
    assert.equal(s.phase, 'choose');
    same(E.legalActions(s).map(a => a.choice), ['forward', 'rewind']);
    const back = act(s, { type: 'choose', choice: 'rewind' });
    assert.equal(back.fate.until, 6);
    s = act(s, { type: 'choose', choice: 'forward' });
    assert.equal(s.axioms.active.attacks, 'haste');
    assert.equal(s.phase, 'main');
    let f = setup({ p0: ['kardashiant'], options: { timeline: true }, axioms: ['mercy'] });
    onBoard(f, 'p0c0');
    f.fate.until = 2;
    f = act(f, { type: 'activate', cid: 'p0c0', ability: 'filter' });
    assert.equal(f.axioms.active.defeat, 'mercy');
    assert.equal(f.players[0].energy, 9);
});

// ---- purity and determinism ----------------------------------------------------------------------

test('applyAction never changes its input and rejects illegal or out-of-turn actions', () => {
    const s = fresh({});
    const before = JSON.stringify(s, (k, v) => (k === 'log' ? undefined : v));
    act(s, { type: 'draw', choice: 'deck' });
    assert.equal(JSON.stringify(s, (k, v) => (k === 'log' ? undefined : v)), before);
    assert.throws(() => E.applyAction(s, { type: 'end', player: 0 }), /Illegal/);
    assert.throws(() => E.applyAction(s, { type: 'draw', choice: 'deck', player: 1 }), /Wrong player/);
    assert.throws(() => E.applyAction(s, null), /No action/);
});

test('the same seed and choices give the same battle', () => {
    const play = () => {
        const s = E.createBattle({ seed: 'det', players: [{ team: E.randomTeam(Rift.makeRng('a'), 10) }, { team: E.randomTeam(Rift.makeRng('b'), 10) }] });
        return AI.playOut(s, ['hard', 'easy']);
    };
    const a = play(), b = play();
    assert.equal(JSON.stringify(E.fullLog(a)), JSON.stringify(E.fullLog(b)));
    assert.equal(a.winner, b.winner);
    const c = E.createBattle({ seed: 'det-2', players: [{ team: E.randomTeam(Rift.makeRng('a'), 10) }, { team: E.randomTeam(Rift.makeRng('b'), 10) }] });
    assert.notEqual(JSON.stringify(E.fullLog(AI.playOut(c, ['hard', 'easy']))), JSON.stringify(E.fullLog(a)));
});

test('events carry private text for draws and public text for the other player', () => {
    const s = act(fresh({ openHand: [0, 0], openAxioms: 0 }), { type: 'draw', choice: 'deck' });
    const ev = events(s, 'draw')[0];
    assert.equal(ev.privateTo, 0);
    assert.match(ev.publicText, /draws a card/);
    const log = E.fullLog(s);
    assert.ok(log.some(e => e.t === 'start') && log.some(e => e.t === 'draw'));
});

test('describe() gives a card face for creatures and tactics', () => {
    const s = setup({ p0: ['khaby'], t0: ['counterexample'] });
    onBoard(s, 'p0c0');
    const d = E.describe(s, 'p0c0');
    assert.equal(d.name, 'Khaby Llame');
    same(d.keywords, ['guard']);
    assert.equal(d.attack, Rift.data.creatures.khaby.attack);
    assert.equal(d.health, Rift.data.creatures.khaby.health);
    assert.equal(d.lines[0].id, 'deadpan');
    const t = E.describe(s, 'p0t0');
    assert.equal(t.kind, 'tactic');
    assert.equal(t.target, 'any-creature');
    assert.equal(E.ruleSummary(s).length, 8);
});
