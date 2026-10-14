// Fate counts full rounds and announces its next rule (#116): the first player's turn, the second
// player's turn, then exactly one ordinary advance. The next flip's rule card is set aside when it is
// announced, so shared draws cannot replace it and it is never drawn or flipped twice.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Rift, E, AI, inst, setup, act, onBoard, toHand, plain } from './battle-helpers.mjs';

const TEN = ['astrophysicat', 'zuckerborg', 'siuuugull', 'khaby', 'keanu', 'eelish', 'kardashiant', 'beansprout', 'attenbirdough', 'usainvolt'];
const fresh = (options, extra) => E.createBattle(Object.assign({
    seed: 'fate-rounds',
    players: [{ name: 'A', team: TEN.map(x => inst(x)) }, { name: 'B', team: TEN.map(x => inst(x)) }],
    options: Object.assign({ first: 0 }, options),
}, extra));
// A quiet turn: take a card if one can be taken (deck first), then End turn.
function quietTurn(s, choice) {
    if (s.phase === 'draw') {
        const legal = E.legalActions(s).filter(a => a.type === 'draw');
        s = act(s, (legal.find(a => a.choice === (choice || 'deck')) || legal[0]));
    }
    return act(s, { type: 'end' });
}
// Every shared (non-own) rule card, wherever it is: deck, discard, active, hands, set aside by Fate.
function ruleCards(s) {
    const own = id => (Rift.data.axioms[id] || {}).own;
    const all = s.axioms.deck.concat(s.axioms.discard, Object.values(s.axioms.active), s.players[0].axHand, s.players[1].axHand, s.fate.next ? [s.fate.next] : []);
    return all.filter(id => !own(id)).sort();
}

test('either player first: two End turns make one round, and only the round\'s end moves Fate', () => {
    for (const first of [0, 1]) {
        let s = fresh({ first });
        assert.equal(s.active, first);
        assert.equal(s.round, 1);
        assert.equal(E.timeline(s)[0].after, 1 - first, 'the second player\'s End turn closes each round');
        const moves = [];
        for (let turn = 1; turn <= 13; turn++) {
            const before = s.fate.until, ender = s.active, round = s.round;
            s = quietTurn(s);
            const advanced = s.lastEvents.filter(e => e.t === 'fate-move').length;
            moves.push(advanced);
            // Odd turns are the first player's, even turns the second player's.
            assert.equal(ender, turn % 2 ? first : 1 - first);
            assert.equal(advanced, turn % 2 ? 0 : 1, 'turn ' + turn + ': exactly one ordinary advance, after the second player');
            assert.equal(s.round, turn % 2 ? round : round + 1);
            if (turn % 2) assert.equal(s.fate.until, before, 'the first player\'s End turn never moves Fate');
        }
        assert.equal(moves.reduce((a, b) => a + b, 0), 6);
    }
});

test('the countdown in rounds (and in turns) agrees with when Fate really resolves, for either first player', () => {
    for (const first of [0, 1]) {
        for (const opts of [{}, { fateStart: 1, fateGap: 2 }, { fateStart: 2, fateGap: 1 }]) {
            let s = fresh(Object.assign({ first }, opts));
            let promise = E.timeline(s)[0], events = s.fate.events, fired = 0;
            for (let n = 0; n < 24 && s.winner == null; n++) {
                const tl = E.timeline(s);
                // The same moment, counted two ways: rounds ending, and End turns.
                assert.equal(tl[0].turns, 2 * tl[0].rounds - (s.roundTurns[1 - s.active] ? 1 : 0));
                assert.equal(tl[0].turn, s.turn + tl[0].turns);
                assert.equal(tl[0].round, s.round + tl[0].rounds);
                assert.equal(tl[1].rounds - tl[0].rounds, s.options.fateGap);
                assert.deepEqual([tl[0].turn, tl[0].round, tl[0].type], [promise.turn, promise.round, promise.type], 'a forecast never drifts while nothing bends time');
                s = quietTurn(s, 'axiom');
                if (s.fate.events !== events) {
                    fired++;
                    assert.equal(s.turn, promise.turn, 'it happens as the forecast turn starts');
                    assert.equal(s.round, promise.round, 'and as the forecast round starts');
                    assert.ok(s.lastEvents.some(e => e.t === (promise.type === 'reset' ? 'reset' : 'axiom') || e.t === 'fate-empty'));
                    events = s.fate.events;
                    promise = E.timeline(s)[0];
                }
            }
            assert.ok(fired >= 2, 'several events resolved');
        }
    }
});

test('the announced rule is set aside: shared draws cannot replace it, and no card is duplicated or drawn twice', () => {
    // Two copies of Thrift: card identity, not just names, must stay consistent.
    let s = fresh({ openAxioms: 1, shuffleAxioms: false }, { axiomDeck: ['haste', 'underdog', 'thrift', 'thrift', 'mercy', 'luxury', 'arrival'] });
    const total = ruleCards(s);
    const announced = s.fate.next;
    assert.equal(announced, 'thrift', 'the first card after the two opening rule cards');
    assert.deepEqual(plain(s.axioms.deck), ['thrift', 'mercy', 'luxury', 'arrival'], 'the other Thrift is still in the deck');
    assert.equal(E.timeline(s)[0].id, 'thrift');
    assert.match(E.timeline(s)[0].text, /Free flip: /);
    // Both players take rule cards every turn: the deck empties, the announcement stays.
    let flipped = null;
    for (let n = 0; n < 6 && s.fate.events === 0; n++) {
        s = quietTurn(s, 'axiom');
        assert.deepEqual(ruleCards(s), total, 'every rule card is in exactly one place');
        if (s.fate.events === 0) assert.equal(s.fate.next, announced, 'still the announced card');
        else flipped = s.lastEvents.find(e => e.t === 'axiom');
    }
    assert.ok(flipped, 'the flip happened');
    assert.equal(flipped.id, announced);
    assert.equal(flipped.player, null);
    assert.equal(s.axioms.active.cost, 'thrift');
    assert.equal(s.fate.next, null, 'nothing is set aside while a reset is next');
    assert.equal(E.timeline(s)[0].type, 'reset');
});

test('a reset announces the following flip at once; mid-turn time moves keep the same card', () => {
    let s = setup({ p0: ['kardashiant'], options: { timeline: true, fateStart: 1, fateGap: 2 }, axioms: ['haste', 'mercy', 'thrift'] });
    assert.equal(s.fate.next, 'haste');
    const total = ruleCards(s);
    onBoard(s, 'p0c0');
    // Filter (2 rounds sooner) resolves the flip now: the card announced, not the deck's top card.
    s = act(s, { type: 'activate', cid: 'p0c0', ability: 'filter' });
    assert.equal(s.axioms.active.attacks, 'haste');
    assert.equal(E.timeline(s)[0].type, 'reset');
    // Two rounds on, the reset happens and Fate sets the next card aside in the same moment.
    for (let n = 0; n < 4 && s.fate.events < 2; n++) s = quietTurn(s);
    assert.equal(s.fate.events, 2);
    assert.ok(s.lastEvents.some(e => e.t === 'reset'));
    const next = s.lastEvents.find(e => e.t === 'fate-next');
    assert.ok(next, 'a public announcement');
    assert.equal(next.id, s.fate.next);
    assert.equal(E.timeline(s)[0].id, s.fate.next);
    assert.deepEqual(ruleCards(s), total, 'every rule card is in exactly one place');
    assert.equal(Object.keys(s.axioms.active).length, 0, 'the reset cleared the rules');
});

test('empty rule sources: nothing is announced, nothing flips, and a card is set aside once one is available', () => {
    let s = fresh({ openAxioms: 1, fateStart: 1 }, { axiomDeck: ['haste', 'mercy'] });
    assert.equal(s.axioms.deck.length, 0);
    assert.equal(s.fate.next, null);
    assert.equal(E.timeline(s)[0].id, null);
    assert.equal(E.timeline(s)[0].text, 'No rule left to flip');
    const active = plain(s.axioms.active);
    s = quietTurn(s); s = quietTurn(s);
    assert.ok(s.lastEvents.some(e => e.t === 'fate-empty'), 'the empty flip is reported');
    assert.ok(!s.lastEvents.some(e => e.t === 'axiom'));
    assert.deepEqual(plain(s.axioms.active), active);
    assert.equal(s.fate.events, 1, 'the next event is the reset');
    // The shared deck is finite (#117): a used rule in the discard never comes back for Fate.
    let w = fresh({ openAxioms: 1 }, { axiomDeck: ['haste', 'mercy'] });
    assert.equal(w.fate.next, null);
    w.axioms.discard = ['underdog'];
    w = quietTurn(w);
    assert.equal(w.fate.next, null, 'nothing is set aside from the discard');
    assert.deepEqual(plain(w.axioms.discard), ['underdog']);
    assert.ok(!w.lastEvents.some(e => e.t === 'fate-next'));
    // A card put back on the deck itself is still found at the next turn start, publicly.
    w.axioms.deck = ['underdog'];
    w = quietTurn(w);
    assert.equal(w.fate.next, 'underdog');
    assert.equal(w.lastEvents.find(e => e.t === 'fate-next').id, 'underdog');
});

test('time abilities move whole rounds, and the preview matches the real move', () => {
    const base = () => setup({ p0: ['kardashiant', 'muskrat'], options: { timeline: true, timeDraws: true, fateStart: 3 }, axioms: ['haste', 'mercy'], main: false });
    for (const [action, spaces] of [[{ type: 'draw', choice: 'forward' }, 1], [{ type: 'draw', choice: 'rewind' }, -1]]) {
        const s = base();
        const pre = E.fatePreview(s, spaces);
        const d = act(s, action);
        assert.equal(d.fate.until, 3 - spaces, '1 space = 1 round');
        assert.equal(E.timeline(d)[0].rounds, pre.rounds);
        assert.equal(E.timeline(d)[0].turns, pre.turns);
        assert.equal(E.timeline(d)[0].turns, E.timeline(s)[0].turns - 2 * spaces, 'one round is two turns');
    }
    // Filter: 2 rounds closer; Next Year: 2 rounds back (both with 1 energy, in the main phase).
    for (const [species, ability, spaces] of [['kardashiant', 'filter', 2], ['muskrat', 'next-year', -2]]) {
        let s = base();
        s = act(s, { type: 'draw', choice: 'deck' });
        const cid = Object.keys(s.cards).find(c => s.cards[c].species === species && s.cards[c].owner === 0);
        onBoard(s, cid);
        s.players[0].energy = 5;
        assert.ok(E.activations(s, cid).some(a => a.id === ability), species + ' has ' + ability);
        const pre = E.fatePreview(s, spaces);
        s = act(s, { type: 'activate', cid, ability });
        assert.equal(s.fate.until, Math.min(s.options.fateMax, 3 - spaces));
        assert.equal(E.timeline(s)[0].rounds, pre.rounds);
    }
    // A shift that reaches zero resolves at once, as the preview says.
    const s = base();
    s.fate.until = 1;
    assert.equal(E.fatePreview(s, 2).now, true);
    assert.equal(act(s, { type: 'draw', choice: 'forward' }).axioms.active.attacks, 'haste');
});

test('the Anchor holds the end of the round it is used in, whoever uses it', () => {
    for (const user of [0, 1]) {
        let s = setup({ p0: ['astrophysicat', 'astrophysicat'], p1: ['astrophysicat', 'astrophysicat'], options: { timeline: true, fateStart: 2 }, main: false });
        s.players[user].bag = E.bagSelection(['anchor']);
        if (user === 1) s = quietTurn(s);
        s = act(s, { type: 'draw', choice: E.legalActions(s).find(a => a.type === 'draw').choice });
        s = act(s, { type: 'item', id: 'anchor' });
        assert.equal(E.timeline(s)[0].rounds, 3);
        assert.ok(E.timeline(s)[0].held);
        if (user === 0) s = quietTurn(s);
        s = quietTurn(s);
        assert.equal(s.fate.until, 2, 'held');
        assert.ok(s.lastEvents.some(e => e.t === 'anchor'));
        s = quietTurn(s); s = quietTurn(s);
        assert.equal(s.fate.until, 1, 'then it moves again');
    }
});

test('replays are deterministic, a clone owns its Fate state, and an older state without a set-aside card still works', () => {
    const run = () => {
        let s = fresh({ first: 'random' });
        const seen = [];
        for (let n = 0; n < 40 && s.winner == null; n++) {
            s = E.applyAction(s, AI.choose(s, { level: 'normal' }));
            seen.push([s.turn, s.round, s.fate.until, s.fate.events, s.fate.next]);
        }
        return { seen, log: E.fullLog(s).map(e => e.t + ':' + e.text) };
    };
    assert.deepEqual(run(), run());
    const s = fresh();
    const c = E.cloneState(s);
    c.fate.next = 'changed';
    c.fate.until = 99;
    assert.notEqual(s.fate.next, 'changed');
    assert.notEqual(s.fate.until, 99);
    // A state saved before #116 has no fate.next: it shows and flips the deck's top card, as before,
    // and the next turn start sets a card aside the new way.
    const old = fresh({}, { axiomDeck: ['haste', 'mercy', 'thrift', 'luxury'] });
    old.axioms.deck.unshift(old.fate.next);
    delete old.fate.next;
    old.fate.anchorTurn = 1;   // the old per-turn Anchor field is ignored
    const top = old.axioms.deck[0];
    assert.equal(E.timeline(old)[0].id, top);
    assert.equal(E.timeline(old)[0].held, false);
    const later = quietTurn(old);
    assert.equal(later.fate.next, top);
    assert.equal(later.axioms.deck.filter(x => x === top).length, old.axioms.deck.filter(x => x === top).length - 1, 'taken out of the deck once');
    const flipNow = E.cloneState(old);
    flipNow.fate.until = 1;
    flipNow.options = Object.assign({}, flipNow.options, { timeDraws: true });
    assert.equal(Rift.data.axioms[top].category in act(flipNow, { type: 'draw', choice: 'forward' }).axioms.active, true);
});

