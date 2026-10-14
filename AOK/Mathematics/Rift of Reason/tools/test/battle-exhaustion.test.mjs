// Exhaustion and the finite shared axiom deck (#117; teacher, 12 and 14 October 2026).
// Used rule cards never shuffle back in. At a player's normal draw step, when their own deck AND
// the shared axiom deck are both empty, they lose 1 heart, then 2, then 3… The hearts follow the
// current Win rule (reversed hearts: reaching zero wins). Extra draws and time draws neither
// multiply nor dodge it, and the counter lives in the plain battle state.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Rift, E, AI, setup, act, onBoard, rule, plain, stats } from './battle-helpers.mjs';

const choices = s => plain(E.legalActions(s).map(a => a.choice));
const hits = (s, p) => plain(s.lastEvents.filter(e => e.t === "hit" && e.player === p).map(e => e.amount));
const exhaustions = s => s.lastEvents.filter(e => e.t === 'exhaustion');

// A quiet match at player 0's draw step: one creature each on the board, everything else in the decks.
function base(options) {
    const s = setup({ p0: ['kardashiant', 'khaby', 'keanu'], p1: ['kardashiant', 'khaby', 'keanu'], axioms: ['haste', 'mercy', 'thrift'], main: false, options });
    onBoard(s, 'p0c0', 'p1c0');
    return s;
}
// Empty a player's own deck (into the discard), or the shared axiom deck (into its discard).
const emptyDeck = (s, p) => { const P = s.players[p]; P.discard.push(...P.deck.splice(0)); return s; };
const emptyShared = s => { s.axioms.discard.push(...s.axioms.deck.splice(0)); return s; };
const fill = (s, p) => { const P = s.players[p]; while (P.hand.length + P.axHand.length < s.options.handLimit) P.axHand.push('haste'); return s; };
// End the turn, let the opponent take a quiet draw step and end, back to player 0's draw step.
function round(s) {
    s = act(s, { type: 'end' });
    if (s.winner == null && s.phase === 'draw') s = act(s, E.legalActions(s)[0]);
    if (s.winner == null) s = act(s, { type: 'end' });
    return s;
}

test('every emptiness combination at a normal draw step', () => {
    const cases = [
        // [name, own deck empty, shared deck empty, full hand, choices offered, hearts lost]
        ['both available', false, false, false, ['deck', 'axiom'], 0],
        ['own deck empty: rule cards can still be drawn', true, false, false, ['axiom'], 0],
        ['shared deck empty alone is harmless', false, true, false, ['deck'], 0],
        ['both empty: exhaustion', true, true, false, ['none'], 1],
        ['a full hand alone is not exhaustion', false, false, true, ['none'], 0],
        ['full hand, own deck empty, shared available: not exhausted', true, false, true, ['none'], 0],
        ['full hand and both decks empty: still exhaustion', true, true, true, ['none'], 1],
    ];
    for (const [name, own, shared, full, offered, lost] of cases) {
        let s = base();
        if (own) emptyDeck(s, 0);
        if (shared) emptyShared(s);
        if (full) fill(s, 0);
        assert.deepEqual(choices(s), offered, name + ': choices');
        assert.equal(E.exhaustion(s, 0).due, lost > 0, name + ': preview');
        const before = s.players[0].hearts;
        const choice = offered.includes('axiom') && !offered.includes('deck') ? 'axiom' : offered[0];
        s = act(s, { type: 'draw', choice });
        assert.equal(before - s.players[0].hearts, lost, name + ': hearts lost');
        assert.equal(s.players[0].exhaustion, lost ? 1 : 0, name + ': counter');
        assert.equal(s.phase, 'main', name);
        if (own && !shared && !full) assert.equal(s.players[0].axHand.length, 1, name + ': the rule card was drawn');
    }
});

test("the opponent's empty deck does not exhaust me, and each player counts their own", () => {
    let s = emptyShared(emptyDeck(base(), 1));
    s = act(s, { type: 'draw', choice: 'deck' });
    assert.equal(s.players[0].hearts, 10, 'my deck still has cards');
    s = act(s, { type: 'end' });
    assert.ok(E.exhaustion(s, 1).due);
    s = act(s, { type: 'draw', choice: 'none' });
    assert.deepEqual(hits(s, 1), [1]);
    assert.equal(s.players[1].exhaustion, 1);
    assert.equal(s.players[0].exhaustion, 0);
});

test('exhaustion escalates 1, 2, 3, once per own turn, and the event names the cause', () => {
    let s = emptyShared(emptyDeck(emptyDeck(base(), 0), 1));
    const lost = [];
    for (let turn = 1; turn <= 3; turn++) {
        const pre = E.exhaustion(s, 0);
        assert.equal(pre.damage, turn, 'the preview shows the coming damage');
        s = act(s, { type: 'draw', choice: 'none' });
        const ev = exhaustions(s);
        assert.equal(ev.length, 1);
        assert.match(ev[0].text, /Exhaustion: A's deck and the rule deck are empty/);
        lost.push(...hits(s, 0));
        if (turn < 3) s = round(s);
    }
    assert.deepEqual(lost, [1, 2, 3]);
    assert.equal(s.players[0].hearts, 10 - 6);
    assert.equal(s.players[1].exhaustion, 2, 'the opponent counted its own two draw steps');
});

test('used rule cards never come back: the discard is not a draw source (finite shared deck)', () => {
    let s = base();
    emptyDeck(s, 0);
    s.axioms.discard.push(...s.axioms.deck.splice(0));
    assert.ok(s.axioms.discard.length > 0);
    assert.deepEqual(choices(s), ['none']);
    assert.ok(E.exhaustion(s, 0).due, 'a full discard does not stop exhaustion');
    s = act(s, { type: 'draw', choice: 'none' });
    assert.equal(s.players[0].hearts, 9);
    assert.deepEqual(plain(s.axioms.deck), [], 'nothing was shuffled back in');
    // Fate: with no rule card left in the deck, a due flip turns over nothing ('fate-empty') and the
    // rules stay, even with used rules in the discard.
    let f = setup({ p0: ['kardashiant'], p1: ['kardashiant'], axioms: [], main: false, options: { timeline: true, fateStart: 1 } });
    assert.equal(f.fate.next, null, 'nothing to set aside');
    f.axioms.discard.push('mercy');
    rule(f, 'haste');
    const active = plain(f.axioms.active);
    f = act(f, { type: 'draw', choice: 'deck' });
    f = act(f, { type: 'end' });
    assert.equal(f.fate.next, null, 'the discard does not refill the announced flip');
    f = act(f, { type: 'draw', choice: 'deck' });
    f = act(f, { type: 'end' });
    assert.ok(f.lastEvents.some(e => e.t === 'fate-empty'), 'the empty flip is reported');
    assert.deepEqual(plain(f.axioms.active), active, 'the rules stay as they are');
    assert.deepEqual(plain(f.axioms.discard), ['mercy']);
    assert.deepEqual(plain(f.axioms.deck), []);
});

test('the Win rule decides: normal hearts lose, reversed hearts win, the preview says which', () => {
    // Normal: the exhausted player at 0 hearts loses.
    let s = emptyShared(emptyDeck(base(), 0));
    s.players[0].hearts = 1;
    let pre = E.exhaustion(s, 0);
    assert.deepEqual([pre.due, pre.damage, pre.lethal, pre.wins, pre.reversed], [true, 1, true, false, false]);
    s = act(s, { type: 'draw', choice: 'none' });
    assert.equal(s.winner, 1);
    assert.equal(s.endReason, 'hearts');
    assert.equal(s.phase, 'over');
    // Reversed hearts (The Last Shall Be First): reaching zero of your own hearts wins.
    s = rule(emptyShared(emptyDeck(base(), 0)), 'reverse-hearts');
    s.players[0].hearts = 2;
    s.players[0].exhaustion = 1;
    pre = E.exhaustion(s, 0);
    assert.deepEqual([pre.due, pre.damage, pre.lethal, pre.wins, pre.reversed], [true, 2, true, true, true]);
    s = act(s, { type: 'draw', choice: 'none' });
    assert.equal(s.winner, 0, 'exhaustion can win the game');
    assert.equal(s.endReason, 'reverse-hearts');
    // Not lethal yet: the hearts are lost and play goes on.
    s = rule(emptyShared(emptyDeck(base(), 0)), 'reverse-hearts');
    s = act(s, { type: 'draw', choice: 'none' });
    assert.equal(s.winner, null);
    assert.equal(s.players[0].hearts, 9);
});

test('both heroes at zero is the usual draw', () => {
    let s = emptyShared(emptyDeck(base(), 0));
    s.players[0].hearts = 1;
    s.players[1].hearts = 0;   // already at zero, not yet checked
    s = act(s, { type: 'draw', choice: 'none' });
    assert.equal(s.winner, 'draw');
    assert.equal(s.endReason, 'both-zero');
});

test('time draws neither dodge nor repeat exhaustion', () => {
    for (const choice of ['forward', 'rewind']) {
        let s = emptyShared(emptyDeck(base({ timeline: true, timeDraws: true }), 0));
        s.axioms.discard.push(...s.axioms.deck.splice(0));
        if (s.fate.next) { s.axioms.discard.push(s.fate.next); s.fate.next = null; }
        assert.deepEqual(choices(s), ['forward', 'rewind']);
        const until = s.fate.until;
        s = act(s, { type: 'draw', choice });
        assert.deepEqual(hits(s, 0), [1], choice + ': exactly one exhaustion');
        assert.equal(s.players[0].exhaustion, 1);
        assert.notEqual(s.fate.until, until, choice + ': Fate still moved');
    }
    // A lethal exhaustion ends the game before the time move.
    let s = emptyShared(emptyDeck(base({ timeline: true, timeDraws: true }), 0));
    s.fate.next = null;
    s.players[0].hearts = 1;
    const until = s.fate.until;
    s = act(s, { type: 'draw', choice: 'forward' });
    assert.equal(s.winner, 1);
    assert.equal(s.fate.until, until);
});

test('special draw rules: extra draws never cause or multiply exhaustion', () => {
    // Second Opinion (draw 2): the last card of the deck is drawn, the missing second card costs nothing.
    let s = rule(emptyShared(base()), 'study');
    const P = s.players[0];
    P.discard.push(...P.deck.splice(1));
    assert.equal(P.deck.length, 1);
    s = act(s, { type: 'draw', choice: 'deck' });
    assert.equal(s.players[0].hearts, 10);
    assert.equal(s.players[0].exhaustion, 0);
    // Both empty under Second Opinion: still 1, not 2.
    s = rule(emptyShared(emptyDeck(base(), 0)), 'study');
    s = act(s, { type: 'draw', choice: 'none' });
    assert.deepEqual(hits(s, 0), [1]);
    // Fresh Start (empty hand draws 2 at the turn start) and Think It Over (unused plays draw at the
    // turn end) with nothing to draw: no damage from those draws, only the normal draw step counts.
    s = rule(emptyShared(emptyDeck(emptyDeck(base(), 0), 1)), 'fresh-start');
    s = act(s, { type: 'draw', choice: 'none' });
    s = act(s, { type: 'end' });
    assert.deepEqual(hits(s, 0), [], 'Fresh Start at the opponent\'s turn start: nothing for me');
    assert.deepEqual(hits(s, 1), [], 'the opponent\'s turn start draws cost nothing');
    s = act(s, { type: 'draw', choice: 'none' });
    assert.deepEqual(hits(s, 1), [1], 'its normal draw step does');
    s = rule(s, 'think');
    s = act(s, { type: 'end' });
    assert.deepEqual(hits(s, 1), [], 'Think It Over draws cost nothing');
    assert.equal(s.players[1].exhaustion, 1);
    // A rule card tactic with the shared deck empty is simply not offered.
    let t = setup({ p0: ['kardashiant'], p1: ['kardashiant'], t0: ['look-it-up'], axioms: [] });
    t.players[0].hand.push(t.players[0].deck.splice(t.players[0].deck.indexOf('p0t0'), 1)[0]);
    assert.ok(!E.legalActions(t).some(a => a.cid === 'p0t0'));
});

test('the counter is plain battle state: JSON restore and replays give the same match', () => {
    let s = emptyShared(emptyDeck(emptyDeck(base(), 0), 1));
    s = act(s, { type: 'draw', choice: 'none' });
    s = round(s);
    assert.equal(s.players[0].exhaustion, 1);
    const restored = JSON.parse(JSON.stringify(s));
    restored.log = null;
    assert.equal(restored.players[0].exhaustion, 1);
    assert.equal(E.exhaustion(restored, 0).damage, 2);
    const a = act(s, { type: 'draw', choice: 'none' }), b = act(restored, { type: 'draw', choice: 'none' });
    assert.deepEqual(hits(a, 0), [2]);
    assert.deepEqual(hits(b, 0), [2]);
    assert.equal(s.players[0].exhaustion, 1, 'applyAction leaves its input untouched');
    assert.deepEqual(plain(a.players), plain(b.players));
    // An older state without the counter starts at 1.
    const old = emptyShared(emptyDeck(base(), 0));
    delete old.players[0].exhaustion;
    assert.equal(E.exhaustion(old, 0).damage, 1);
    assert.deepEqual(hits(act(old, { type: 'draw', choice: 'none' }), 0), [1]);
});

// A stalled board: one creature each that cannot hurt anything, no cards left to draw anywhere.
function stalled(seed, extra) {
    const s = E.createBattle({
        seed,
        players: [{ name: 'A', team: [] }, { name: 'B', team: [] }],
        axiomDeck: [],
        options: Object.assign({ first: 'random', shuffle: true, openHand: [0, 0], openAxioms: 0, timeline: false, hearts: 10, maxTurns: 200 }, extra),
    });
    s.players.forEach((P, p) => {
        P.discard.push(...P.deck.splice(0));
        const cid = P.discard.find(id => s.cards[id].kind === 'creature');
        P.discard.splice(P.discard.indexOf(cid), 1);
        P.board.push(cid);
        stats(s, cid, 0, 99);
        s.cards[cid].ability = null;
        s.cards[cid].enteredTurn = 0;
    });
    return s;
}

test('the AI finishes a stalled game by exhaustion, under either Win rule (seeded)', () => {
    for (const level of ['normal', 'competent', 'expert']) {
        for (const reversed of [false, true]) {
            let s = stalled('stall:' + level + ':' + reversed);
            if (reversed) rule(s, 'reverse-hearts');
            const first = s.active;
            let seen = 0;
            s = AI.playOut(s, [level, level], (prev, a, next) => { seen += next.lastEvents.filter(e => e.t === 'exhaustion').length; });
            assert.notEqual(s.winner, 'draw', level + ': not the turn limit');
            assert.equal(s.endReason, reversed ? 'reverse-hearts' : 'hearts');
            // 1 + 2 + 3 + 4 = 10 hearts: the first player's fourth draw step ends it.
            assert.equal(s.winner, reversed ? first : 1 - first, level + (reversed ? ': reaching zero wins' : ': reaching zero loses'));
            assert.equal(s.turn, 7);
            assert.equal(seen, 7);
        }
    }
});
