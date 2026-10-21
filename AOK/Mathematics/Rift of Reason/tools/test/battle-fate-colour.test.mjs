// The first colour-scheduled spells and the Fate timing Axioms (#121; design/drafts/card-arena-2026-10-12/
// CARD-DRAFTS.md "Later Fate card pack" and "Axiom expansion drafts", FATE-SCHEDULE-MODEL.md section 9):
// Prepared Defence, Delayed Observation, Tomorrow's Idea (and its token), Remember This and Scheduled Speech;
// Patient Plans, Hasty Plans, Open Calendar and Gentle Consequences.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { Rift, E, AI, setup, act, onBoard, toHand, toDiscard, plain, rule, stats } from './battle-helpers.mjs';
import { GAME_DIR } from './harness.mjs';

const TL = { timeline: true, fateStart: 9, fateGap: 3 };
const sched = s => plain(E.fateSchedule(s));
const byId = (s, id) => sched(s).find(e => e.id === id);
const last = (s, t) => s.lastEvents.filter(e => e.t === t);
const logOf = (s, t) => E.fullLog(s).filter(e => e.t === t);
function draw(s) {
    const legal = E.legalActions(s).filter(a => a.type === 'draw');
    return act(s, legal.find(a => a.choice === 'none') || legal.find(a => a.choice === 'deck') || legal[0]);
}
// End this turn, and take the next player's draw (no card if they can skip it).
function endTurn(s) { s = act(s, { type: 'end' }); return s.phase === 'draw' ? draw(s) : s; }
// Plenty of energy and plays for the player about to act (these tests are about Fate, not budgets).
function fresh(s) { s.players[s.active].energy = 10; s.players[s.active].playsThisTurn = 0; return s; }
const play = (s, cid, extra) => act(fresh(s), Object.assign({ type: 'play', cid }, extra || {}));
const axiom = (s, id) => { fresh(s); s.players[s.active].axHand.push(id); return act(s, { type: 'axiom', choice: id }); };
// A test-only scheduled spell that hits both heroes and every creature (no released card hits a hero yet:
// #128 owns environmental ones).
function withTestStorm(fn, hit = 3, delay = 1) {
    Rift.data.tactics['test-storm'] = { id: 'test-storm', name: 'Test Storm', cost: 1, text: 'Test.', run() {},
        scheduled: { delay, summary: 'Both heroes lose ' + hit + ' hearts.',
            resolve(api) {
                api.damage('h0', hit, null); api.damage('h1', hit, null);
                api.s.players.forEach(P => P.board.slice().forEach(cid => api.damage(cid, hit, null)));
            } } };
    try { fn(); } finally { delete Rift.data.tactics['test-storm']; }
}

test('Tomorrow\'s Idea: a public 1/2 Idea token joins its side at the round\'s end, ready for that side\'s next turn', () => {
    for (const caster of [0, 1]) {
        let s = setup({ p0: ['kardashiant'], p1: ['lobstorian'], t0: ['tomorrows-idea'], t1: ['tomorrows-idea'], options: TL });
        onBoard(s, 'p0c0', 'p1c0'); toHand(s, 'p0t0', 'p1t0');
        if (caster === 1) s = endTurn(s);
        s = play(s, 'p' + caster + 't0');
        const ev = last(s, 'fate-schedule')[0];
        assert.deepEqual([ev.rounds, ev.printed, ev.delay, ev.privateTo], [1, 1, 1, undefined]);
        assert.match(ev.text, /schedules Tomorrow's Idea on the Fate track\. In 1 round: a 1\/2 Idea token joins (A's|B's) side, if there is room\./);
        assert.deepEqual(plain(E.fateEventPreview(s, 'f1').summoned.map(x => [x.name, x.controller])), [['Idea', caster]], 'the preview runs the real summon');
        if (caster === 0) s = endTurn(s);
        s = act(s, { type: 'end' });                        // the second player's End: round 1 ends, Fate enters space 1
        const sum = last(s, 'summon')[0];
        assert.ok(sum, 'it arrives at the round\'s end');
        assert.deepEqual([sum.player, sum.token, sum.privateTo], [caster, 'idea-token', undefined]);
        const cid = sum.cid, d = E.describe(s, cid);
        assert.deepEqual([d.name, d.attack, d.health, d.colour, d.cost], ['Idea', 1, 2, 'imagination', 1]);
        assert.equal(s.cards[cid].token, true);
        assert.deepEqual(plain(s.players[caster].board), ['p' + caster + 'c0', cid]);
        assert.equal(byId(s, 'f1').state, 'fired');
        // It can act on its side's next turn: player 0's turn starts now; player 1's comes after it.
        s = draw(s);
        if (caster === 0) assert.equal(E.isSleeping(s, cid), false, 'ready on the turn that starts now');
        else { s = endTurn(s); assert.equal(s.active, 1); assert.equal(E.isSleeping(s, cid), false, 'ready on its next turn'); }
        assert.ok(E.legalActions(s).some(a => a.type === 'attack' && a.cid === cid), 'it can attack');
    }
});

test('the Idea token is not a card: defeated or sent to a hand, it leaves the game; nothing after the battle counts it', () => {
    let s = setup({ p0: ['kardashiant'], p1: ['lobstorian', 'beastie'], t0: ['tomorrows-idea', 'tomorrows-idea'], t1: ['rethink', 'counterexample', 'recall'],
        axioms: ['mercy'], options: TL });
    onBoard(s, 'p0c0', 'p1c0'); toHand(s, 'p0t0', 'p0t1', 'p1t0', 'p1t1', 'p1t2');
    s = play(s, 'p0t0'); s = play(s, 'p0t1');
    s = endTurn(s); s = act(s, { type: 'end' });
    const tokens = last(s, 'summon').map(e => e.cid);
    assert.equal(tokens.length, 2, 'two separate records, two tokens');
    assert.notEqual(tokens[0], tokens[1]);
    s = draw(s); s = endTurn(s);                            // B's turn
    rule(s, 'mercy');
    s = play(s, 'p1t1', { target: tokens[0] });             // Counterexample: 3 damage, defeated under Mercy
    const dead = last(s, 'defeated')[0];
    assert.deepEqual([dead.cid, dead.dest], [tokens[0], 'gone']);
    assert.match(dead.text, /Idea is defeated\. A token leaves the game\./);
    assert.ok(!s.players[0].hand.includes(tokens[0]) && !s.players[0].discard.includes(tokens[0]), 'Mercy cannot return a token');
    s = play(s, 'p1t0', { target: tokens[1] });             // Rethink: to its owner's hand… a token can't go there
    assert.match(last(s, 'token-gone')[0].text, /Idea leaves the game: a token cannot go to a hand\./);
    assert.ok([0, 1].every(p => ['deck', 'hand', 'board', 'discard'].every(z => !tokens.some(t => s.players[p][z].includes(t)))));
    assert.deepEqual(plain(E.lostUids(s, 0)), [], 'a token is never a lost creature');
    assert.ok(E.creaturesLeft(s, 0), 'Kim is still in play');
});

test('Tomorrow\'s Idea on a full side: no token, the event is still used up, and it says so in public', () => {
    let s = setup({ p0: ['kardashiant', 'astrophysicat', 'beastie', 'keanu', 'khaby', 'siuuugull', 'zuckerborg'], p1: ['lobstorian'], t0: ['tomorrows-idea'], options: TL });
    onBoard(s, 'p0c0', 'p0c1', 'p0c2', 'p0c3', 'p0c4', 'p0c5', 'p1c0'); toHand(s, 'p0t0', 'p0c6');
    s = play(s, 'p0t0');
    s = play(s, 'p0c6');                                    // the seventh creature fills the side
    assert.equal(s.players[0].board.length, 7);
    assert.equal(plain(E.fateEventPreview(s, 'f1').summoned).length, 0);
    s = endTurn(s); s = act(s, { type: 'end' });
    assert.equal(last(s, 'summon').length, 0);
    const line = s.lastEvents.find(e => /^Tomorrow's Idea: there is no room, so no Idea arrives\.$/.test(e.text));
    assert.ok(line && line.t === 'tactic' && line.privateTo === undefined, 'a public line, not a fizzle (#119: nothing scheduled ever "fizzles")');
    assert.ok(!s.lastEvents.some(e => e.t === 'fizzle'));
    assert.equal(byId(s, 'f1').state, 'fired', 'a one-shot is never retried');
});

test('a preview names a token that is made and defeated inside it (a leap onto Tomorrow\'s Idea and Clean Slate)', () => {
    let s = setup({ p0: ['kardashiant'], p1: ['lobstorian'], t0: ['tomorrows-idea', 'clean-slate'], options: Object.assign({}, TL, { fateStart: 6 }) });
    onBoard(s, 'p0c0', 'p1c0'); toHand(s, 'p0t0', 'p0t1');
    s = rule(s, 'hasty-plans');
    s = play(s, 'p0t0'); s = play(s, 'p0t1');               // both on space 1 (Clean Slate brought forward)
    assert.deepEqual(sched(s).map(e => e.spaces), [1, 1]);
    const pre = E.fateLeapPreview(s, 1, 0);                  // lands on space 1: the Idea arrives, then the wipe
    const token = pre.defeated.find(d => d.dest === 'gone');
    assert.ok(token, 'the token is made, then wiped');
    assert.equal(token.name, 'Idea', 'by its name, never its id');
});

test('Prepared Defence and Scheduled Speech act on the creatures in play when Fate arrives, not when cast', () => {
    let s = setup({ p0: ['kardashiant', 'astrophysicat', 'beastie'], p1: ['lobstorian'], t0: ['prepared-defence', 'scheduled-speech'], options: TL });
    onBoard(s, 'p0c0', 'p0c1', 'p1c0'); toHand(s, 'p0t0', 'p0t1', 'p0c2');
    stats(s, 'p0c0', 2, 3); stats(s, 'p0c1', 1, 4); stats(s, 'p0c2', 3, 3);
    s.cards.p0c0.damage = 2;
    s = play(s, 'p0t0'); s = play(s, 'p0t1');
    const pre = E.fateEventPreview(s, 'f1');
    assert.deepEqual(plain(pre.boosted.map(b => [b.cid, b.attack, b.health])), [['p0c0', 0, 1], ['p0c1', 0, 1]]);
    s = play(s, 'p0c2');                                    // arrives after the cast: it is in play when Fate arrives
    s.cards.p0c1.damage = 4; s = act(s, { type: 'end' });   // and Astrophysicat falls before it (cleanup at End turn)
    assert.ok(!s.players[0].board.includes('p0c1'));
    s = draw(s); s = act(s, { type: 'end' });               // round 1 ends
    assert.deepEqual(plain(['p0c0', 'p0c2'].map(cid => { const h = E.healthOf(s, cid); return [h.current, h.max]; })), [[3, 4], [4, 4]],
        'Prepared Defence: +1 maximum health and heal 1, for the creatures in play then');
    assert.deepEqual(plain(['p0c0', 'p0c2'].map(cid => E.attackOf(s, cid))), [3, 4], 'Scheduled Speech: +1 attack');
    assert.deepEqual(plain(E.activeEffects(s, 'p0c0').map(x => [x.stat, x.amount, x.label, x.until, x.from])),
        [['health', 1, 'Prepared Defence', 'play', null], ['attack', 1, 'Scheduled Speech', 'next-turn', 3]]);
    assert.equal(s.cards.p1c0.buffs.length, 0, 'only its controller\'s side');
});

test('Scheduled Speech lasts until the end of its creatures\' controller\'s next turn: first player, second player, or mid-turn', () => {
    const at = s => E.attackOf(s, 'p0c0');
    // A (first player) casts it: it arrives as A's turn 3 is about to start and ends with turn 3.
    let s = setup({ p0: ['kardashiant'], p1: ['lobstorian'], t0: ['scheduled-speech'], t1: ['scheduled-speech'], options: TL });
    onBoard(s, 'p0c0', 'p1c0'); toHand(s, 'p0t0', 'p1t0'); stats(s, 'p0c0', 2, 5); stats(s, 'p1c0', 2, 5);
    s = play(s, 'p0t0'); s = endTurn(s); s = act(s, { type: 'end' });
    assert.deepEqual([s.turn, s.active, at(s)], [3, 0, 3]);
    s = draw(s); s = act(s, { type: 'end' });
    assert.equal(at(s), 2, 'over at the end of A\'s next turn');
    // B (second player) casts it: it arrives before A's turn 3 and lasts through B's turn 4.
    s = setup({ p0: ['kardashiant'], p1: ['lobstorian'], t1: ['scheduled-speech'], options: TL });
    onBoard(s, 'p0c0', 'p1c0'); toHand(s, 'p1t0'); stats(s, 'p1c0', 2, 5);
    s = endTurn(s); s = play(s, 'p1t0'); s = act(s, { type: 'end' });
    assert.equal(E.attackOf(s, 'p1c0'), 3);
    assert.deepEqual(plain(E.activeEffects(s, 'p1c0').map(x => [x.until, x.from])), [['next-turn', 4]]);
    s = draw(s); s = act(s, { type: 'end' });
    assert.equal(E.attackOf(s, 'p1c0'), 3, 'still there in A\'s turn');
    s = draw(s); s = act(s, { type: 'end' });
    assert.equal(E.attackOf(s, 'p1c0'), 2, 'over at the end of B\'s turn');
    // Mid-turn: Clockwork forward brings it during A's own turn; it lasts through A's next turn.
    s = setup({ p0: ['kardashiant'], p1: ['lobstorian'], t0: ['scheduled-speech', 'clockwork'], options: TL });
    onBoard(s, 'p0c0', 'p1c0'); toHand(s, 'p0t0', 'p0t1'); stats(s, 'p0c0', 2, 5);
    s = play(s, 'p0t0'); s = play(s, 'p0t1'); s = act(s, { type: 'choose', choice: 'forward' });
    assert.equal(at(s), 3, 'it happens now');
    assert.deepEqual(plain(E.activeEffects(s, 'p0c0').map(x => [x.until, x.from])), [['next-turn', 3]]);
    s = endTurn(s); s = act(s, { type: 'end' }); s = draw(s);
    assert.equal(at(s), 3, 'in A\'s next turn');
    s = act(s, { type: 'end' });
    assert.equal(at(s), 2);
});

test('Delayed Observation draws 2 at the round\'s end; its preview counts the cards but never names one', () => {
    let s = setup({ p0: ['kardashiant', 'astrophysicat', 'beastie'], p1: ['lobstorian'], t0: ['delayed-observation'], options: TL });
    onBoard(s, 'p0c0', 'p1c0'); toHand(s, 'p0t0');
    const top = s.players[0].deck.slice(0, 2);
    s = play(s, 'p0t0');
    const pre = E.fateEventPreview(s, 'f1');
    assert.deepEqual(plain(pre.drawn), [2, 0]);
    const words = JSON.stringify(plain(pre));
    top.forEach(cid => {
        assert.ok(!words.includes('"' + cid + '"'), 'no card id from the deck in the preview');
        assert.ok(!words.includes(E.cardName(s, cid)), 'no card name from the deck in the preview');
    });
    assert.ok(pre.events.filter(e => e.t === 'draw').every(e => e.text === 'A draws a card.' && e.cid === undefined), 'only the public side of each draw');
    assert.equal(byId(s, 'f1').summary, 'A draws 2 cards from their deck.');
    s = endTurn(s); s = act(s, { type: 'end' });
    assert.deepEqual(plain(s.players[0].hand), top);
    assert.ok(last(s, 'draw').every(e => e.privateTo === 0 && e.publicText === 'A draws a card.'), 'the draws themselves are private');
});

test('Delayed Observation with a full hand: the draw stops and the cards stay in the deck; the event is used up', () => {
    let s = setup({ p0: ['kardashiant', 'astrophysicat', 'beastie', 'keanu'], p1: ['lobstorian'], t0: ['delayed-observation', 'lemma', 'lemma', 'second-wind', 'second-wind', 'clockwork', 'clockwork', 'rethink', 'rethink', 'recall', 'recall'], options: TL });
    onBoard(s, 'p0c0', 'p1c0'); toHand(s, 'p0t0');
    s = play(s, 'p0t0');
    toHand(s, 'p0t1', 'p0t2', 'p0t3', 'p0t4', 'p0t5', 'p0t6', 'p0t7', 'p0t8', 'p0t9');
    assert.equal(s.players[0].hand.length, 9);
    const deck = s.players[0].deck.length;
    s = endTurn(s); s = act(s, { type: 'end' });
    assert.equal(s.players[0].hand.length, 10, 'room for one card only');
    assert.equal(s.players[0].deck.length, deck - 1);
    assert.match(s.lastEvents.find(e => e.t === 'tactic').text, /Delayed Observation: only 1 card is drawn \(the deck is empty or the hand is full\)\./);
    assert.equal(byId(s, 'f1').state, 'fired');
});

test('Remember This fixes your most recently defeated creature when it is played, and brings back only that one', () => {
    let s = setup({ p0: ['kardashiant', 'astrophysicat', 'beastie'], p1: ['lobstorian'], t0: ['remember-this', 'remember-this'], options: TL });
    onBoard(s, 'p0c2', 'p1c0'); toHand(s, 'p0t0', 'p0t1');
    assert.ok(!E.legalActions(fresh(s)).some(a => a.cid === 'p0t0'), 'not offered with no defeated creature');
    toDiscard(s, 'p0c0', 'p0c1');                           // Kim, then Astrophysicat
    s.cards.p0c0.burned = false; s.cards.p0c1.burned = false;
    s = play(s, 'p0t0');
    assert.equal(byId(s, 'f1').target, 'p0c1', 'the most recently defeated one');
    assert.equal(byId(s, 'f1').targetName, 'Astrophysicat');
    assert.match(last(s, 'fate-schedule')[0].text, /In 1 round: Astrophysicat returns from the discard pile to A's hand\./);
    assert.deepEqual(plain(E.fateEventPreview(s, 'f1').returned.map(x => [x.cid, x.name, x.player])), [['p0c1', 'Astrophysicat', 0]]);
    s = endTurn(s); s = act(s, { type: 'end' });
    assert.ok(s.players[0].hand.includes('p0c1'), 'it returns');
    assert.ok(s.players[0].discard.includes('p0c0'), 'the other one stays');
});

test('Remember This with its creature gone, or a full hand: nothing comes back, never another creature, and it says why', () => {
    // Recalled before Fate arrives: the fixed target is gone.
    let s = setup({ p0: ['kardashiant', 'astrophysicat'], p1: ['lobstorian'], t0: ['remember-this', 'recall'], options: TL });
    onBoard(s, 'p1c0'); toHand(s, 'p0t0', 'p0t1'); toDiscard(s, 'p0c0', 'p0c1');
    s = play(s, 'p0t0');
    s = play(s, 'p0t1'); s = act(s, { type: 'choose', choice: 'p0c1' });
    assert.ok(s.players[0].hand.includes('p0c1'));
    assert.deepEqual(plain(E.fateEventPreview(s, 'f1').returned), [], 'the preview already says nothing would come back');
    s = endTurn(s); s = act(s, { type: 'end' });
    const line = s.lastEvents.find(e => /^Remember This: /.test(e.text));
    assert.match(line.text, /Remember This: Astrophysicat is no longer in the discard pile, so nothing comes back\./);
    assert.deepEqual([line.t, line.privateTo], ['tactic', undefined]);
    assert.ok(s.players[0].discard.includes('p0c0'), 'Kim is not taken instead');
    assert.equal(byId(s, 'f1').state, 'fired');
    // A full hand: the creature stays in the discard pile (not burned: it can still be recalled later).
    s = setup({ p0: ['kardashiant', 'astrophysicat', 'beastie', 'keanu'], p1: ['lobstorian'], t0: ['remember-this', 'lemma', 'lemma', 'second-wind', 'second-wind', 'clockwork', 'clockwork', 'rethink', 'rethink', 'recall', 'recall'], options: TL });
    onBoard(s, 'p1c0'); toHand(s, 'p0t0'); toDiscard(s, 'p0c0');
    s = play(s, 'p0t0');
    toHand(s, 'p0t1', 'p0t2', 'p0t3', 'p0t4', 'p0t5', 'p0t6', 'p0t7', 'p0t8', 'p0t9', 'p0t10');
    s = endTurn(s); s = act(s, { type: 'end' });
    assert.match(s.lastEvents.find(e => /^Remember This: /.test(e.text)).text, /Remember This: the hand is full, so Kim Kardashiant stays in the discard pile\./);
    assert.ok(s.players[0].discard.includes('p0c0'));
    assert.equal(s.cards.p0c0.burned, false);
});

test('cards discarded from a full hand never fought: Remember This skips them', () => {
    let s = setup({ p0: ['kardashiant', 'astrophysicat'], p1: ['lobstorian'], t0: ['remember-this'], options: TL });
    onBoard(s, 'p1c0'); toHand(s, 'p0t0'); toDiscard(s, 'p0c0', 'p0c1');
    s.cards.p0c1.burned = true;                              // discarded from a full hand
    s = play(s, 'p0t0');
    assert.equal(byId(s, 'f1').target, 'p0c0');
});

test('a scheduled spell does not need its card: recovering and replaying it makes a second, separate record', () => {
    let s = setup({ p0: ['kardashiant', 'astrophysicat'], p1: ['lobstorian'], t0: ['prepared-defence', 'remember-when'], options: TL });
    onBoard(s, 'p0c0', 'p1c0'); toHand(s, 'p0t0', 'p0t1');
    s = play(s, 'p0t0');
    s = play(s, 'p0t1');                                     // Remember When: Prepared Defence comes back to the hand
    assert.ok(s.players[0].hand.includes('p0t0'));
    assert.equal(byId(s, 'f1').state, 'pending', 'the record is untouched');
    s = play(s, 'p0t0');
    assert.deepEqual(sched(s).map(e => [e.id, e.def, e.cid, e.state]), [['f1', 'prepared-defence', 'p0t0', 'pending'], ['f2', 'prepared-defence', 'p0t0', 'pending']]);
    assert.equal(E.canSchedule(s, 0), false, 'two waiting: the limit');
    s = endTurn(s); s = act(s, { type: 'end' });
    assert.equal(E.healthOf(s, 'p0c0').max, E.describe(s, 'p0c0').baseHealth + 2, 'each record resolves once');
});

test('construction: the colour quota counts these spells, and they cast with no creature of their colour in play', () => {
    const v = Rift.State.validateDeck;
    const creatures = ['astrophysicat', 'astrophysicat', 'kardashiant', 'kardashiant', 'lobstorian', 'lobstorian', 'beastie', 'beastie', 'keanu', 'keanu', 'khaby', 'khaby'];
    const base = ['counterexample', 'counterexample', 'pep-talk', 'pep-talk', 'stand-firm', 'stand-firm'];
    const reason = creatures.filter(id => Rift.data.creatures[id].colour === 'reason' && !Rift.data.creatures[id].generic).length;
    assert.ok(reason >= 2);
    const ok = v({ creatures, tactics: base.concat(['prepared-defence', 'prepared-defence']) });
    assert.equal(ok.valid, true, ok.message);
    const over = v({ creatures: creatures.filter(id => Rift.data.creatures[id].colour !== 'perception'), tactics: base.concat(['delayed-observation', 'delayed-observation']) }, { complete: false });
    assert.ok(over.problems.some(p => p.code === 'quota' && p.colour === 'perception'), 'no Perception creature: no Perception spell');
    let s = setup({ p0: ['lobstorian'], p1: ['beastie'], t0: ['tomorrows-idea'], options: TL });
    onBoard(s, 'p0c0', 'p1c0'); toHand(s, 'p0t0');
    assert.equal(E.colourInPlay(s, 0, 'imagination'), false);
    assert.ok(E.legalActions(fresh(s)).some(a => a.cid === 'p0t0'), 'offered with no Imagination creature in play');
});

test('Patient and Hasty Plans move only spells played while they are active; announced events stay fixed', () => {
    withTestStorm(() => {
        let s = setup({ p0: ['kardashiant'], p1: ['lobstorian'], t0: ['tomorrows-idea', 'clean-slate', 'tomorrows-idea', 'clean-slate', 'test-storm'], options: TL });
        onBoard(s, 'p0c0', 'p1c0'); toHand(s, 'p0t0', 'p0t1', 'p0t2', 'p0t3', 'p0t4');
        assert.deepEqual([E.scheduleDelay(s, 'tomorrows-idea'), E.scheduleDelay(s, 'clean-slate')], [1, 2]);
        s = play(s, 'p0t0');                                 // f1: Tomorrow's Idea at space 1
        s = axiom(s, 'patient-plans');
        assert.equal(s.axioms.active['fate-delay'], 'patient-plans');
        assert.equal(byId(s, 'f1').spaces, 1, 'an announced event does not move');
        assert.deepEqual([E.scheduleDelay(s, 'tomorrows-idea'), E.scheduleDelay(s, 'clean-slate')], [2, 3]);
        s = play(s, 'p0t1');                                 // f2: Clean Slate at 3
        const ev = last(s, 'fate-schedule')[0];
        assert.deepEqual([ev.printed, ev.delay, ev.rounds], [2, 3, 3]);
        assert.match(ev.text, /In 3 rounds: every creature in play is defeated\. Patient Plans moved it 1 round later\./);
        // Hasty Plans replaces Patient Plans (same category); both records stay where they were announced.
        s.players[0].energy = 10; s = axiom(s, 'hasty-plans');
        assert.equal(s.axioms.active['fate-delay'], 'hasty-plans');
        assert.ok(s.axioms.discard.includes('patient-plans'));
        assert.deepEqual(sched(s).map(e => e.spaces), [1, 3]);
        assert.deepEqual([E.scheduleDelay(s, 'tomorrows-idea'), E.scheduleDelay(s, 'clean-slate')], [1, 1], 'never sooner than 1 round');
        // The cap: Patient Plans never puts a spell more than 4 rounds ahead.
        Rift.data.tactics['test-storm'].scheduled.delay = 4;
        s = rule(s, 'patient-plans');
        assert.equal(E.scheduleDelay(s, 'test-storm'), 4);
        Rift.data.tactics['test-storm'].scheduled.delay = 3;
        assert.equal(E.scheduleDelay(s, 'test-storm'), 4);
    });
});

test('the timing rules are shared: a rule one player plays changes the other player\'s spells too', () => {
    let s = setup({ p0: ['kardashiant'], p1: ['lobstorian'], t1: ['tomorrows-idea'], options: TL });
    onBoard(s, 'p0c0', 'p1c0'); toHand(s, 'p1t0');
    s = axiom(s, 'patient-plans');                           // A plays it
    s = endTurn(s);
    s = play(s, 'p1t0');                                     // B's spell lands 2 rounds ahead
    assert.equal(byId(s, 'f1').spaces, 2);
});

test('Open Calendar: three spells may wait; losing the rule cancels none, but no new one is offered until fewer than two wait', () => {
    let s = setup({ p0: ['kardashiant'], p1: ['lobstorian'], t0: ['tomorrows-idea', 'prepared-defence', 'scheduled-speech', 'tomorrows-idea'], options: TL });
    onBoard(s, 'p0c0', 'p1c0'); toHand(s, 'p0t0', 'p0t1', 'p0t2', 'p0t3');
    assert.equal(E.scheduleLimit(s), 2);
    s = rule(s, 'open-calendar');
    assert.equal(E.scheduleLimit(s), 3);
    s = play(s, 'p0t0'); s = play(s, 'p0t1'); s = play(s, 'p0t2');
    assert.equal(sched(s).filter(e => e.live).length, 3);
    assert.equal(E.canSchedule(s, 0), false);
    assert.ok(!E.legalActions(fresh(s)).some(a => a.cid === 'p0t3'), 'a fourth is not offered');
    // The rule goes (Granny's Spare Axiom clears every rule) with three waiting: none is cancelled, and
    // none can be added until fewer than two wait.
    s = axiom(s, 'spare-axiom');
    assert.equal(s.axioms.active['fate-capacity'], undefined);
    assert.deepEqual(sched(s).map(e => e.state), ['pending', 'pending', 'pending']);
    assert.equal(E.canSchedule(s, 0), false);
    s = endTurn(s); s = act(s, { type: 'end' });             // round 1 ends: all three resolve as scheduled
    assert.deepEqual(sched(s).map(e => e.state), ['fired', 'fired', 'fired']);
    assert.equal(E.canSchedule(s, 0), true);
});

test('Gentle Consequences: one scheduled effect takes at most 1 heart from each hero; creature damage is unchanged', () => {
    withTestStorm(() => {
        const run = withRule => {
            let s = setup({ p0: ['kardashiant'], p1: ['lobstorian'], t0: ['test-storm'], options: TL });
            onBoard(s, 'p0c0', 'p1c0'); toHand(s, 'p0t0'); stats(s, 'p0c0', 1, 9); stats(s, 'p1c0', 1, 9);
            if (withRule) s = rule(s, 'gentle-consequences');
            s = play(s, 'p0t0');
            const pre = E.fateEventPreview(s, 'f1');
            s = endTurn(s); s = act(s, { type: 'end' });
            return { s, pre };
        };
        const plainRun = run(false), gentle = run(true);
        assert.deepEqual(plain(plainRun.s.players.map(P => P.hearts)), [7, 7]);
        assert.deepEqual(plain(gentle.s.players.map(P => P.hearts)), [9, 9], 'at most 1 from each hero');
        assert.deepEqual(plain(gentle.pre.hearts), [9, 9], 'the preview uses the rule too');
        assert.deepEqual(plain(['p0c0', 'p1c0'].map(cid => gentle.s.cards[cid].damage)), [3, 3], 'creatures take the full damage');
        const capped = gentle.s.lastEvents.filter(e => e.t === 'axiom-effect').map(e => e.text);
        assert.deepEqual(plain(capped), ['Gentle Consequences: a spell from the Fate track takes at most 1 heart from A\'s hero.',
            'Gentle Consequences: a spell from the Fate track takes at most 1 heart from B\'s hero.']);
        // Ordinary hero damage is not a scheduled effect: an attack still takes hearts in full.
        let s = setup({ p0: ['kardashiant'], p1: ['lobstorian'], options: TL });
        onBoard(s, 'p0c0'); stats(s, 'p0c0', 3, 3);
        s = rule(s, 'gentle-consequences');
        s = act(s, { type: 'attack', cid: 'p0c0', target: 'h1' });
        assert.equal(s.players[1].hearts, 7, 'an attack is not capped');
    });
});

test('a Fate reset or Granny\'s Spare Axiom clears the timing rules but never moves or cancels a queued event', () => {
    // A real Fate reset: a flip at the end of round 1, the reset at the end of round 2.
    let r = setup({ p0: ['kardashiant'], p1: ['lobstorian'], t0: ['clean-slate'], axioms: ['mercy'], options: Object.assign({}, TL, { fateStart: 1, fateGap: 1 }) });
    onBoard(r, 'p0c0', 'p1c0'); toHand(r, 'p0t0');
    r = rule(r, 'patient-plans'); r = rule(r, 'open-calendar'); r = rule(r, 'gentle-consequences');
    r = play(r, 'p0t0');                                     // Clean Slate 3 rounds ahead (Patient Plans)
    assert.equal(byId(r, 'f1').spaces, 3);
    r = endTurn(r); r = act(r, { type: 'end' }); r = draw(r); // round 1: the flip (Mercy)
    assert.equal(r.axioms.active.defeat, 'mercy');
    r = endTurn(r); r = act(r, { type: 'end' });              // round 2: the reset
    assert.ok(r.lastEvents.some(e => e.t === 'reset'));
    assert.deepEqual(plain(r.axioms.active), {}, 'the reset clears the timing rules');
    assert.deepEqual([byId(r, 'f1').state, byId(r, 'f1').spaces], ['pending', 1], 'the wipe stays where it was announced');
    r = draw(r); r = endTurn(r); r = act(r, { type: 'end' });
    assert.equal(byId(r, 'f1').state, 'fired', 'and happens on time');
    // Granny's Spare Axiom.
    let s = setup({ p0: ['kardashiant'], p1: ['lobstorian'], t0: ['clean-slate', 'tomorrows-idea'], options: TL });
    onBoard(s, 'p0c0', 'p1c0'); toHand(s, 'p0t0', 'p0t1');
    s = rule(s, 'patient-plans'); s = rule(s, 'open-calendar'); s = rule(s, 'gentle-consequences');
    s = play(s, 'p0t0');
    const before = sched(s).map(e => [e.id, e.spaces, e.state]);
    s = axiom(s, 'spare-axiom');
    assert.deepEqual(plain(s.axioms.active), {});
    assert.deepEqual(sched(s).map(e => [e.id, e.spaces, e.state]), before);
    assert.equal(E.scheduleDelay(s, 'tomorrows-idea'), 1, 'new spells land as printed again');
    assert.equal(E.scheduleLimit(s), 2);
});

test('the timing Axioms are later earnable rules: no pool, default ten, starter or reward names them', () => {
    const AX = Rift.data.axioms, ids = ['patient-plans', 'hasty-plans', 'open-calendar', 'gentle-consequences'];
    assert.deepEqual(plain(Object.keys(AX).filter(id => AX[id].pack === 'fate')), ids);
    assert.deepEqual(plain(ids.map(id => [AX[id].category, AX[id].cost])), [['fate-delay', 2], ['fate-delay', 2], ['fate-capacity', 2], ['fate-impact', 2]]);
    const D = Rift.data.axiomDecks;
    ids.forEach(id => {
        assert.ok(!D.default.includes(id) && !D.starter.includes(id), id);
        assert.ok(!Rift.State.ownedAxioms(Rift.State.freshState()).includes(id), id);
        for (const file of fs.readdirSync(path.join(GAME_DIR, 'data'))) {
            if (file === 'axioms.js' || !file.endsWith('.js')) continue;
            assert.ok(!fs.readFileSync(path.join(GAME_DIR, 'data', file), 'utf8').includes("'" + id + "'"), 'data/' + file + ' must not grant ' + id);
        }
        assert.ok(AX[id].text.length <= 130 && AX[id].short.length <= 30, id + ': short text');
    });
    // #101 changes the default ten; none of these unreleased timing cards enter that contribution.
    assert.equal(D.default.length, 10);
    assert.equal(D.default.filter(id => AX[id].modifier).length, 7);
});

test('saves and backups: the battle state with tokens and timing rules survives JSON and replays the same; save codes keep the new ids', async () => {
    let s = setup({ p0: ['kardashiant', 'astrophysicat'], p1: ['lobstorian'], t0: ['tomorrows-idea', 'scheduled-speech', 'remember-this'], options: TL });
    onBoard(s, 'p0c0', 'p1c0'); toHand(s, 'p0t0', 'p0t1', 'p0t2'); toDiscard(s, 'p0c1');
    s = rule(s, 'patient-plans');
    s = play(s, 'p0t0'); s = play(s, 'p0t1');
    const actions = [{ type: 'end' }, { type: 'draw', choice: 'deck' }, { type: 'end' }, { type: 'draw', choice: 'deck' }, { type: 'end' }, { type: 'draw', choice: 'deck' }, { type: 'end' }];
    const runFrom = st => actions.reduce((x, a) => {
        const legal = E.legalActions(x);
        const pick = legal.find(l => l.type === a.type && (a.choice == null || l.choice === a.choice)) || legal.find(l => l.type === a.type);
        return E.applyAction(x, pick);
    }, st);
    const one = runFrom(s), two = runFrom(JSON.parse(JSON.stringify(s)));
    assert.deepEqual(plain(E.fullLog(one).slice(-20).map(e => e.text)), plain(E.fullLog(two).slice(-20).map(e => e.text)));
    assert.equal(logOf(one, 'summon').length, 1, 'one token, once');
    assert.deepEqual(plain(one.players[0].board), plain(two.players[0].board));
    // The same action on the same state twice: the input is never changed, so the token arrives once each time.
    const once = runFrom(s);
    assert.equal(logOf(once, 'summon').length, 1);
    assert.equal(logOf(s, 'summon').length, 0, 'the input state is untouched');
    // Save codes carry card ids as text, so a later grant of these cards survives a backup code.
    const save = Rift.State.freshState();
    ['prepared-defence', 'tomorrows-idea'].forEach(id => Rift.State.grantTactic(id, save));
    ['patient-plans', 'open-calendar'].forEach(id => Rift.State.grantAxiom(id, save));
    const back = Rift.State.migrate(await Rift.State.decodeAsync('save', await Rift.State.encodePacked('save', save)));
    assert.deepEqual(plain(back.tactics), ['prepared-defence', 'tomorrows-idea']);
    assert.deepEqual(plain(back.axioms), ['patient-plans', 'open-calendar']);
    assert.ok(Rift.State.ownedTactics(back).includes('tomorrows-idea'));
});

test('Delayed Observation\'s projection never tells the AI which cards are on top of its deck', () => {
    const make = flip => {
        let s = setup({ p0: ['lobstorian', 'kardashiant', 'astrophysicat'], p1: ['beastie'], t0: ['delayed-observation', 'counterexample', 'qed', 'lemma'], options: TL });
        onBoard(s, 'p0c0', 'p1c0'); toHand(s, 'p0t0');
        const removal = ['p0t1', 'p0t2'], rest = s.players[0].deck.filter(cid => !removal.includes(cid));
        s.players[0].deck = flip ? removal.concat(rest) : rest.concat(removal);   // removal on top, or at the bottom
        return play(s, 'p0t0');
    };
    for (const level of ['competent', 'expert']) {
        const a = AI.evaluate(make(true), 0, { level, deep: true }), b = AI.evaluate(make(false), 0, { level, deep: true });
        assert.equal(a, b, level + ': the same score whatever the deck order');
    }
});

test('the AI weighs the new spells through their public projections: it summons into room and recovers its fallen creature', () => {
    for (const level of ['normal', 'competent', 'expert']) {
        let s = setup({ p0: ['lobstorian', 'beastie'], p1: ['kardashiant', 'astrophysicat', 'keanu'], t0: ['tomorrows-idea', 'remember-this'], options: TL });
        onBoard(s, 'p0c0', 'p1c0', 'p1c1'); toHand(s, 'p0t0', 'p0t1'); toDiscard(s, 'p0c1');
        s.players[0].energy = 4;
        let x = s;
        for (let i = 0; i < 6 && x.active === 0 && x.winner == null; i++) {
            const a = AI.choose(x, { level, salt: 'fate-colour' });
            if (a.type === 'end') break;
            x = E.applyAction(x, a);
        }
        const mine = sched(x).filter(e => e.controller === 0).map(e => e.def).sort();
        assert.ok(mine.length >= 1, level + ' casts at least one of them');
        assert.ok(mine.every(id => ['remember-this', 'tomorrows-idea'].includes(id)), level);
    }
});
