// Fate leaps and rewinds against marked repeatable spaces (#120; design/drafts/card-arena-2026-10-12/
// FATE-SCHEDULE-MODEL.md, section 6 is the worked example below). Leap Ahead bypasses the space between,
// so a one-shot event there is skipped for good; Revisit rewinds onto a space, so a live repeatable
// space (Echoing Encouragement) fires again; lifetimes count real round ends, so rewinds never extend
// them. Both directions, consecutive moves, skipped/expired events, control and rule changes, previews
// that equal the real move, JSON replay and repeated submits.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { Rift, E, AI, setup, act, onBoard, toHand, plain, stats, invariants } from './battle-helpers.mjs';
import { GAME_DIR } from './harness.mjs';

const T = Rift.data.tactics;
const sched = s => plain(E.fateSchedule(s));
const rec = (s, id) => sched(s).find(e => e.id === id);
const fires = (s, id) => E.fullLog(s).filter(e => e.t === 'fate-event' && e.id === id).length;
const TL = { timeline: true, fateStart: 9, fateMax: 9, fateGap: 3 };
// Take the turn's draw (deck first) if it is due, then End turn.
function quietTurn(s) {
    if (s.phase === 'draw') {
        const legal = E.legalActions(s).filter(a => a.type === 'draw');
        s = act(s, legal.find(a => a.choice === 'deck') || legal[0]);
    }
    return act(s, { type: 'end' });
}
const drawn = s => (s.phase === 'draw' ? act(s, E.legalActions(s).find(a => a.type === 'draw' && a.choice === 'deck') || E.legalActions(s).find(a => a.type === 'draw')) : s);
const play = (s, cid, extra) => act(drawn(s), Object.assign({ type: 'play', cid }, extra || {}));
const at = (s, cid) => [E.attackOf(s, cid), E.healthOf(s, cid).current];

// Tomorrow's Idea is a later card (tokens are not in the engine yet): this test-only stand-in is the
// draft's one-shot summon, 1 round ahead: the first creature in its player's deck comes into play.
function withIdea(fn) {
    T['test-idea'] = { id: 'test-idea', name: 'Test Idea', cost: 1, text: 'Test: summon a creature in 1 round.', run() {},
        scheduled: { delay: 1, summary: 'A creature comes into play.',
            resolve(api, ev) {
                const P = api.s.players[ev.controller], cid = P.deck.find(c => api.s.cards[c].kind === 'creature');
                if (!cid || P.board.length >= api.s.options.boardLimit) { api.emit({ t: 'tactic', text: 'Test Idea: no room.' }); return; }
                P.deck.splice(P.deck.indexOf(cid), 1);
                P.board.push(cid);
                api.s.cards[cid].enteredTurn = api.s.turn;
                api.emit({ t: 'summon', cid, text: 'Test Idea: ' + api.name(cid) + ' comes into play.' });
            } } };
    try { return fn(); } finally { delete T['test-idea']; }
}

// The section 6 table, move by move. Returns every state and the actions, for the replay test.
function workedExample() {
    let s = setup({ p0: ['kardashiant', 'astrophysicat', 'lobstorian', 'tremendoodle', 'beastie', 'siuuugull'], p1: ['muskrat', 'lobstorian', 'astrophysicat'],
        t0: ['test-idea', 'leap-ahead', 'echoing-encouragement', 'revisit'], t1: ['clean-slate', 'clockwork'], options: TL });
    onBoard(s, 'p1c0');
    toHand(s, 'p0t0', 'p0t1', 'p0t2', 'p0t3', 'p1t0', 'p1t1');
    const start = JSON.parse(JSON.stringify(s));
    const log = [];
    const step = (a) => { const full = Object.assign({ player: E.decider(s) }, a); log.push(full); s = E.applyAction(s, full); return s; };
    const draw = () => { if (s.phase === 'draw') step(E.legalActions(s).find(a => a.type === 'draw' && a.choice === 'deck')); };
    const end = () => { draw(); step({ type: 'end' }); };
    const rows = {};
    // Round 1
    step({ type: 'play', cid: 'p0t0' });                                     // A: Tomorrow's Idea, +1
    rows.r1a = s; end();
    draw(); step({ type: 'play', cid: 'p1t0' });                             // B: Clean Slate, +2
    rows.r1b = s; end();                                                    // round 1 ends: Fate enters 1
    rows.r1end = s;
    const token = s.players[0].board[0];
    stats(s, token, 1, 2);                                                  // the token is a plain 1/2
    // Round 2
    draw(); step({ type: 'play', cid: 'p0t1' });                             // A: Leap Ahead (bypass 2, land 3)
    rows.leap = s;
    step({ type: 'play', cid: 'p0t2' });                                     // A: Echoing Encouragement, +1, lifetime 3
    rows.echo = s; end(); end();                                            // round 2 ends: Fate enters 4
    rows.r2end = s;
    end(); end();                                                           // round 3 ends: space 5
    rows.r3end = s;
    // Round 4
    draw(); step({ type: 'play', cid: 'p0t3' });                             // A: Revisit (back to 4)
    rows.revisit = s; end();
    draw(); step({ type: 'activate', cid: 'p1c0', ability: 'next-year' });   // B: Next Year (back to 2)
    rows.nextYear = s;
    step({ type: 'play', cid: 'p1t1' }); step({ type: 'choose', choice: 'rewind' });   // B: Clockwork back (to 1)
    rows.clockwork = s; end();                                              // round 4 ends: space 2; EE expires
    rows.r4end = s;
    end(); end(); rows.r5end = s;                                           // space 3
    end(); end(); rows.r6end = s;                                           // space 4: EE's space, expired
    return { start, log, rows, token, final: s };
}

test('section 6 worked example: bypass an enemy plan, re-enter the +1/+1 space, no duplicate summon, expiry that rewinds cannot extend', () => withIdea(() => {
    const { rows: r, token, final } = workedExample();
    const pos = s => s.fate.pos, until = s => s.fate.until;
    // Round 1: scheduled, public.
    assert.deepEqual([rec(r.r1a, 'f1').state, r.r1a.fate.queue[0].space], ['pending', 1]);
    assert.deepEqual([rec(r.r1b, 'f2').state, rec(r.r1b, 'f2').controller, r.r1b.fate.queue[1].space], ['pending', 1, 2]);
    assert.equal(pos(r.r1end), 1);
    assert.equal(rec(r.r1end, 'f1').state, 'fired', 'ordinary entry: the one-shot summon fires');
    assert.deepEqual(plain(r.r1end.players[0].board), [token]);
    // Round 2: the leap skips B's Clean Slate for good and lands on the empty space 3.
    assert.equal(pos(r.leap), 3);
    assert.deepEqual([rec(r.leap, 'f2').state, rec(r.leap, 'f2').reason, rec(r.leap, 'f2').endedRound], ['skipped', 'leap', 2]);
    const leapEv = r.leap.lastEvents.find(e => e.t === 'fate-leap');
    assert.deepEqual([leapEv.from, leapEv.to, leapEv.spaces, plain(leapEv.skipped)], [1, 3, 2, ['f2']]);
    assert.match(r.leap.lastEvents.find(e => e.t === 'fate-skip').text, /^B's Clean Slate is skipped\. It will never happen\.$/);
    assert.ok(!r.leap.lastEvents.some(e => e.t === 'fate-event'), 'nothing on the landing space');
    assert.deepEqual([r.echo.fate.queue[2].space, rec(r.echo, 'f3').repeat, rec(r.echo, 'f3').expiresRound, rec(r.echo, 'f3').lifetime], [4, true, 4, 3]);
    assert.equal(pos(r.r2end), 4);
    assert.deepEqual([rec(r.r2end, 'f3').state, rec(r.r2end, 'f3').fires, rec(r.r2end, 'f3').live], ['fired', 1, true]);
    assert.deepEqual(at(r.r2end, token), [2, 3], 'EE fires: the token is 2/3');
    assert.deepEqual([pos(r.r3end), rec(r.r3end, 'f3').fires], [5, 1], 'space 5 is empty; EE is not re-entered by walking on');
    // Round 4: Revisit lands back on EE: it fires again.
    assert.deepEqual([pos(r.revisit), rec(r.revisit, 'f3').fires], [4, 2]);
    assert.equal(r.revisit.lastEvents.find(e => e.t === 'fate-event').how, 'rewind');
    assert.deepEqual(at(r.revisit, token), [3, 4]);
    // Next Year lands on the skipped Clean Slate's space: it stays skipped. Space 3 is passed, not entered.
    assert.deepEqual([pos(r.nextYear), rec(r.nextYear, 'f2').state], [2, 'skipped']);
    assert.ok(!r.nextYear.lastEvents.some(e => e.t === 'fate-event'));
    assert.equal(r.nextYear.players[0].board.length, 1, 'no wipe');
    // Clockwork back lands on the fired summon: no second creature.
    assert.deepEqual([pos(r.clockwork), rec(r.clockwork, 'f1').state, fires(r.clockwork, 'f1')], [1, 'fired', 1]);
    assert.deepEqual(plain(r.clockwork.players[0].board), [token], 'no duplicate summon');
    // Round 4 ends: Fate enters 2 (only the skipped f2: nothing); EE's three round ends are used up.
    assert.equal(pos(r.r4end), 2);
    assert.deepEqual([rec(r.r4end, 'f3').state, rec(r.r4end, 'f3').reason, rec(r.r4end, 'f3').endedRound], ['expired', 'lifetime', 4]);
    assert.match(r.r4end.lastEvents.find(e => e.t === 'fate-expire').text, /^A's Echoing Encouragement expires after 3 rounds: its \+1\/\+1 boosts end\.$/);
    assert.deepEqual(at(r.r4end, token), [1, 2], 'its two boosts end: 1/2 again');
    assert.equal(pos(r.r5end), 3);
    assert.equal(pos(r.r6end), 4);
    assert.deepEqual([rec(final, 'f3').state, fires(final, 'f3')], ['expired', 2], 'entering an expired space does nothing');
    // The table's checks.
    assert.equal(pos(final), 6 + 2 - 4);
    assert.deepEqual([fires(final, 'f1'), fires(final, 'f2'), fires(final, 'f3')], [1, 0, 2]);
    assert.equal(pos(final) + until(final), 9, 'the rule node is still on space 9');
    const seen = [r.r1a, r.r1end, r.leap, r.r2end, r.r3end, r.revisit, r.nextYear, r.clockwork, r.r4end, r.r5end, r.r6end].map(until);
    assert.deepEqual(seen, [9, 8, 6, 5, 4, 5, 7, 8, 7, 6, 5]);
    assert.ok(seen.every(n => n <= 9));
    invariants(final, assert);
}));

test('saved replay: the worked example from a JSON copy replays identically, and the state survives a round trip at every step', () => withIdea(() => {
    const { start, log, final } = workedExample();
    let s = JSON.parse(JSON.stringify(start));
    for (const a of log) {
        s = E.applyAction(s, a);
        if (s.phase === 'main' && s.fate.queue.length) {
            const copy = JSON.parse(JSON.stringify(s));
            assert.deepEqual(plain(E.fateSchedule(copy)), plain(E.fateSchedule(s)));
        }
    }
    assert.deepEqual(plain(s.fate), plain(final.fate));
    assert.deepEqual(plain(s.players), plain(final.players));
    assert.deepEqual(E.fullLog(s).map(e => e.text), E.fullLog(final).map(e => e.text));
    assert.ok(E.fullLog(s).some(e => e.t === 'fate-leap') && E.fullLog(s).some(e => e.t === 'fate-skip') && E.fullLog(s).some(e => e.t === 'fate-expire'));
}));

// Two creatures each; p0 holds the Fate pack.
// Two creatures in play each (2/3), lots of hearts; every listed tactic starts in its owner's hand.
function table(extra = {}) {
    const s = setup(Object.assign({ p0: ['kardashiant', 'astrophysicat', 'lobstorian'], p1: ['lobstorian', 'astrophysicat', 'tremendoodle'],
        t0: ['leap-ahead', 'revisit', 'echoing-encouragement', 'clockwork', 'leap-ahead', 'revisit', 'revisit'],
        t1: ['clean-slate', 'echoing-encouragement', 'leap-ahead', 'revisit'], options: TL }, extra));
    onBoard(s, 'p0c0', 'p0c1', 'p1c0', 'p1c1');
    toHand(s, ...Object.keys(s.cards).filter(cid => s.cards[cid].kind === 'tactic'));
    ['p0c0', 'p0c1', 'p1c0', 'p1c1'].forEach(cid => stats(s, cid, 2, 3));
    s.players.forEach(P => { P.hearts = P.maxHearts = 30; });
    return s;
}
// Player 1 plays `cid` on its round-1 turn (unless null); then it is player 0's round-2 main phase (Fate on 1).
function round2(cid, extra) {
    let s = table(extra);
    s = act(s, { type: 'end' });
    s = drawn(s);
    if (cid) s = play(s, cid);
    return drawn(act(s, { type: 'end' }));
}

test('Leap Ahead: a one-shot it jumps over is skipped for good, publicly, and stops counting as a waiting event', () => {
    let s = round2('p1t0');              // the enemy's Clean Slate on space 2: due at the end of this round
    assert.deepEqual([s.fate.pos, rec(s, 'f1').spaces, rec(s, 'f1').rounds], [1, 1, 1]);
    const pre = plain(E.fateMovePreview(s, 2, 'leap'));
    s = play(s, 'p0t0');
    assert.equal(s.players[0].energy, 8, 'it costs 2');
    assert.deepEqual([s.fate.pos, rec(s, 'f1').state, rec(s, 'f1').live, rec(s, 'f1').rounds], [3, 'skipped', false, null]);
    assert.deepEqual([pre.from, pre.to, pre.moved, pre.skipped, pre.fired, pre.rule], [1, 3, 2, ['f1'], [], null], 'the preview is the move');
    assert.ok(s.lastEvents.every(e => e.privateTo === undefined), 'everything about a leap is public');
    // Rewinding onto the skipped space, and walking on past it, never bring it back.
    s = play(s, 'p0t3'); s = act(s, { type: 'choose', choice: 'rewind' });   // Clockwork back: Fate on 2
    assert.deepEqual([s.fate.pos, rec(s, 'f1').state], [2, 'skipped']);
    assert.ok(!s.lastEvents.some(e => e.t === 'fate-event'));
    for (let n = 0; n < 6; n++) s = quietTurn(s);
    assert.equal(fires(s, 'f1'), 0);
    assert.deepEqual([s.players[0].board.length, s.players[1].board.length], [2, 2], 'the wipe never happens');
    assert.equal(E.fateEventPreview(s, 'f1'), null, 'a skipped event has no "if it happened now"');
    // It no longer counts toward its player's two waiting events.
    let c = round2('p1t0');
    c.fate.queue = c.fate.queue.concat([Object.assign({}, c.fate.queue[0], { id: 'f9', seq: 9, space: 8 })]);
    c.fate.seq = 9;
    assert.equal(E.canSchedule(c, 1), false);
    c = play(c, 'p0t0');
    assert.equal(E.canSchedule(c, 1), true);
});

test('Leap Ahead: a repeatable space it jumps over is not entered (still live, not fired); a rewind landing there fires it for its own player', () => {
    let r = round2(null);
    r = play(r, 'p0t2');                 // p0's Echoing Encouragement on space 2
    r = play(r, 'p0t0');                 // then a leap 1 → 3 over it
    assert.deepEqual([r.fate.pos, rec(r, 'f1').state, rec(r, 'f1').fires, rec(r, 'f1').live], [3, 'pending', 0, true]);
    assert.ok(!r.lastEvents.some(e => e.t === 'fate-skip' || e.t === 'fate-event'));
    assert.deepEqual(at(r, 'p0c0'), [2, 3]);
    // The other player's Revisit lands on it: it fires, for the player who scheduled it.
    r = act(r, { type: 'end' });
    r = play(r, 'p1t3');
    assert.deepEqual([r.fate.pos, rec(r, 'f1').fires, rec(r, 'f1').state], [2, 1, 'fired']);
    assert.deepEqual([at(r, 'p0c0'), at(r, 'p1c0')], [[3, 4], [2, 3]]);
    assert.match(r.lastEvents.find(e => e.t === 'fate-event').text, /^Fate comes back to A's Echoing Encouragement: A's creatures get \+1\/\+1\.$/);
});

test('Leap Ahead: the landing space is entered, and the second seat leaps the same way', () => {
    // p0's Clean Slate sits 2 ahead (space 2): leaping 2 lands on it, so it happens now.
    let l = table({ t0: ['clean-slate', 'leap-ahead'] });
    l = play(l, 'p0t0');
    l = play(l, 'p0t1');
    assert.deepEqual([l.fate.pos, rec(l, 'f1').state], [2, 'fired']);
    const ev = l.lastEvents.find(e => e.t === 'fate-event');
    assert.equal(ev.how, 'leap');
    assert.match(ev.text, /^Fate lands on A's Clean Slate: every creature in play is defeated\.$/);
    assert.deepEqual([l.players[0].board.length, l.players[1].board.length], [0, 0]);
    // Player 1 leaps over player 0's repeatable space 1.
    let b = table();
    b = play(b, 'p0t2');                 // EE on space 1
    b = act(b, { type: 'end' });
    b = play(b, 'p1t2');
    const leap = b.lastEvents.find(e => e.t === 'fate-leap');
    assert.deepEqual([leap.player, leap.from, leap.to], [1, 0, 2]);
    assert.deepEqual([b.fate.pos, rec(b, 'f1').state, rec(b, 'f1').fires], [2, 'pending', 0]);
});

test('a leap never jumps Fate\'s own rule event: it lands there, scheduled events first, then the rule', () => {
    let s = round2('p1t0', { options: Object.assign({}, TL, { fateStart: 2 }), axioms: ['thrift', 'luxury'] });
    // Fate's flip is 1 round ahead, on space 2, the same space as the enemy's Clean Slate.
    assert.deepEqual([s.fate.pos, s.fate.until, rec(s, 'f1').spaces], [1, 1, 1]);
    const pre = plain(E.fateMovePreview(s, 2, 'leap'));
    s = play(s, 'p0t0');
    const leap = s.lastEvents.find(e => e.t === 'fate-leap');
    assert.deepEqual([leap.from, leap.to, leap.spaces, leap.asked, plain(leap.skipped)], [1, 2, 1, 2, []]);
    assert.match(leap.text, /^Fate leaps 1 round ahead and stops at its own event\.$/);
    const order = plain(s.lastEvents).map(e => e.t).filter(t => ['fate-leap', 'fate-event', 'flip'].includes(t));
    assert.deepEqual(order, ['fate-leap', 'fate-event', 'flip'], 'the Clean Slate on the landing space, then the flip');
    assert.equal(rec(s, 'f1').state, 'fired', 'events on the landing space are never skipped');
    assert.equal(s.fate.until, s.options.fateGap);
    assert.deepEqual([pre.from, pre.to, pre.moved, pre.skipped, pre.fired, pre.rule], [1, 2, 1, [], ['f1'], 'flip'], 'the preview is the move');
});

test('Revisit: consecutive moves, an expired space, a space passed but not landed on, and not offered at the limit', () => {
    let s = table({ p0: ['muskrat', 'astrophysicat', 'lobstorian'] });
    s = play(s, 'p0t2');                 // EE on space 1, lifetime 3 (round ends 1, 2, 3)
    s = quietTurn(s); s = quietTurn(s);  // round 1 ends: it fires
    assert.deepEqual([s.fate.pos, rec(s, 'f1').fires], [1, 1]);
    assert.deepEqual(at(s, 'p0c1'), [3, 4]);
    s = quietTurn(s); s = quietTurn(s);  // round 2 ends: Fate on 2
    // Two moves in one turn: Leap Ahead (2 → 4), then Revisit (4 → 3). Neither lands on 1.
    s = play(s, 'p0t0');
    s = play(s, 'p0t1');
    assert.deepEqual([s.fate.pos, rec(s, 'f1').fires], [3, 1]);
    assert.equal(E.playsLeft(s, 0), 0, 'two plays: the turn\'s card budget is used');
    assert.ok(!E.legalActions(s).some(a => a.type === 'play'), 'a third move is not offered');
    s = quietTurn(s); s = quietTurn(s);  // round 3 ends: Fate on 4, the lifetime is used up
    assert.equal(rec(s, 'f1').state, 'expired');
    assert.deepEqual(at(s, 'p0c1'), [2, 3], 'its boost ends with it');
    // Next Year (4 → 2) and Revisit (2 → 1): landing on the expired space does nothing.
    s = drawn(s);
    s = act(s, { type: 'activate', cid: 'p0c0', ability: 'next-year' });
    s = play(s, 'p0t5');
    assert.deepEqual([s.fate.pos, rec(s, 'f1').fires, fires(s, 'f1')], [1, 1, 1]);
    assert.deepEqual(at(s, 'p0c1'), [2, 3]);
    // At the limit (Fate's rule event fateMax ahead) Revisit would do nothing, so it is not offered.
    s.fate.until = s.options.fateMax;
    s.players[0].playsThisTurn = 0;
    assert.ok(!E.legalActions(s).some(a => a.cid === 'p0t6'));

    // A rewind of 2 passes a live repeatable space without landing on it; a later walk enters it.
    let n = table({ p0: ['muskrat', 'astrophysicat', 'lobstorian'] });
    n = play(n, 'p0t2');
    n = quietTurn(n); n = quietTurn(n);  // fires (1); Fate on 1
    n = quietTurn(n); n = quietTurn(n);  // Fate on 2
    n = drawn(n);
    n = act(n, { type: 'activate', cid: 'p0c0', ability: 'next-year' });   // 2 → 0, passing 1
    assert.deepEqual([n.fate.pos, rec(n, 'f1').fires], [0, 1]);
    n = quietTurn(n); n = quietTurn(n);  // round 3 ends: the walk enters 1 (fires), then the lifetime ends
    assert.deepEqual([n.fate.pos, fires(n, 'f1'), rec(n, 'f1').state], [1, 2, 'expired']);
    const order = plain(n.lastEvents).map(e => e.t).filter(t => t === 'fate-event' || t === 'fate-expire');
    assert.deepEqual(order, ['fate-event', 'fate-expire'], 'its last round\'s move first, then the expiry');
});

test('previews are the real move: Revisit, Clockwork forward and the rewind preview for a live repeatable space', () => {
    let s = table();
    s = play(s, 'p0t2');
    s = quietTurn(s); s = quietTurn(s);  // fires; Fate on 1
    s = quietTurn(s); s = quietTurn(s);  // Fate on 2
    s = drawn(s);
    const back = plain(E.fateMovePreview(s, 1, 'rewind'));
    assert.deepEqual([back.from, back.to, back.fired, back.skipped], [2, 1, ['f1'], []]);
    assert.deepEqual(back.changes.map(c => [c.cid, c.attack, c.health]), [['p0c0', [3, 4], [4, 5]], ['p0c1', [3, 4], [4, 5]]]);
    const ev = plain(E.fateEventPreview(s, 'f1'));
    assert.deepEqual(ev.changes.map(c => c.cid), ['p0c0', 'p0c1'], 'a live repeatable behind NOW still previews its effect');
    const json = JSON.stringify(s);
    const after = play(s, 'p0t1');
    assert.equal(JSON.stringify(s), json, 'previews and moves never change the state they were given');
    assert.deepEqual(back.changes.map(c => [c.cid, c.attack[1], c.health[1]]), ['p0c0', 'p0c1'].map(cid => [cid, ...at(after, cid)]));
    const fwd = plain(E.fateMovePreview(after, 1, 'walk'));
    assert.deepEqual([fwd.from, fwd.to, fwd.fired], [1, 2, []], 'walking off a repeatable space does not fire it');
    assert.equal(E.fateMovePreview(Object.assign({}, after, { winner: 0 }), 1, 'walk'), null);
});

test('lifetime counts real round ends: the second seat, the Anchor and a Fate reset', () => {
    // Cast by the second player in round 1: that round counts (expires after round 3).
    let s = table();
    s = act(s, { type: 'end' });
    s = play(s, 'p1t1');
    assert.deepEqual([rec(s, 'f1').createdRound, rec(s, 'f1').expiresRound, rec(s, 'f1').roundsLeft], [1, 3, 3]);
    assert.match(s.lastEvents.find(e => e.t === 'fate-schedule').text,
        /^B schedules Echoing Encouragement on the Fate track\. In 1 round: B's creatures get \+1\/\+1\. It happens again each time Fate lands there, for 3 rounds\.$/);
    s = act(s, { type: 'end' });         // round 1 ends: it fires for player 1
    assert.deepEqual(at(s, 'p1c0'), [3, 4]);
    assert.equal(rec(s, 'f1').roundsLeft, 2);
    // The Anchor holds round 2's end: Fate does not move, but the round end still counts.
    s = drawn(s);
    s.fate.anchorRound = s.round;        // what the Anchor item does
    s = quietTurn(s); s = quietTurn(s);
    assert.deepEqual([s.fate.pos, rec(s, 'f1').roundsLeft, rec(s, 'f1').state], [1, 1, 'fired']);
    s = quietTurn(s); s = quietTurn(s);  // round 3 ends: Fate moves only its second space, yet the lifetime is over
    assert.deepEqual([s.fate.pos, rec(s, 'f1').state, rec(s, 'f1').endedRound], [2, 'expired', 3]);
    assert.deepEqual(at(s, 'p1c0'), [2, 3]);

    // A Fate reset (round 2's end here) clears the rules, never the event, its space or its lifetime.
    let r = table({ options: Object.assign({}, TL, { fateStart: 1, fateGap: 1 }), axioms: ['thrift', 'luxury', 'haste'] });
    r = act(r, { type: 'end' });
    r = play(r, 'p1t1');
    r = act(r, { type: 'end' });         // round 1 ends: Fate on 1: EE fires, then Fate's flip
    assert.deepEqual(plain(r.lastEvents).map(e => e.t).filter(t => t === 'fate-event' || t === 'flip'), ['fate-event', 'flip']);
    const before = plain(r.fate.queue);
    r = quietTurn(r); r = quietTurn(r);  // round 2 ends: Fate on 2: a reset
    assert.ok(r.lastEvents.some(e => e.t === 'reset'));
    assert.deepEqual(plain(r.fate.queue), before, 'the reset leaves the queue exactly as it was');
    assert.deepEqual(at(r, 'p1c0'), [3, 4], 'and its boosts stay');
    r = quietTurn(r); r = quietTurn(r);  // round 3 ends: a flip, then the expiry
    assert.equal(rec(r, 'f1').state, 'expired');
    assert.deepEqual(at(r, 'p1c0'), [2, 3]);
});

test('changing control: the event keeps its player; a stolen creature loses the boost at expiry too, and health that depended on it is lost', () => {
    let c = table({ t0: ['echoing-encouragement'], t1: ['persuasion'] });
    c = play(c, 'p0t0');
    c = quietTurn(c); c = quietTurn(c);  // round 1 ends: p0c0 and p0c1 become 3/4
    stats(c, 'p0c0', 1, 3);              // 2 attack with the boost: Persuasion can take it
    c.cards.p0c1.damage = 3;             // 1 health left, and only thanks to the boost
    assert.deepEqual([at(c, 'p0c0'), at(c, 'p0c1')], [[2, 4], [3, 1]]);
    c = drawn(c); c = act(c, { type: 'end' });
    c = drawn(c);
    c = act(c, { type: 'play', cid: 'p1t0', target: 'p0c0' });
    assert.deepEqual([c.cards.p0c0.controller, at(c, 'p0c0')], [1, [2, 4]], 'it changes sides with its boost');
    assert.equal(rec(c, 'f1').controller, 0, 'the event never changes controller');
    c = act(c, { type: 'end' });         // round 2 ends: Fate on 2
    c = drawn(c);
    const pre = plain(E.fateEventPreview(c, 'f1'));
    assert.deepEqual(pre.changes.map(x => x.cid), ['p0c1'], 'if it happened now: only the creatures its player controls now');
    c = act(c, { type: 'end' }); c = quietTurn(c);   // round 3 ends: expiry
    assert.equal(rec(c, 'f1').state, 'expired');
    assert.deepEqual(at(c, 'p0c0'), [1, 3], 'the stolen creature loses the boost too, wherever it is');
    assert.ok(c.players[0].discard.includes('p0c1'), 'health that depended on the boost is lost: defeated');
    assert.ok(c.lastEvents.findIndex(e => e.t === 'fate-expire') < c.lastEvents.findIndex(e => e.t === 'defeated' && e.cid === 'p0c1'));
    invariants(c, assert);
});

test('repeated submits and copies: the same leap on the same state gives one identical result; the old action cannot be sent again', () => {
    const s = round2('p1t0');
    const json = JSON.stringify(s);
    const a = play(s, 'p0t0'), b = play(s, 'p0t0');
    assert.equal(JSON.stringify(s), json, 'the input state never changes');
    assert.equal(JSON.stringify(a), JSON.stringify(b));
    assert.equal(a.fate.queue[0].state, 'skipped');
    assert.throws(() => act(a, { type: 'play', cid: 'p0t0' }), /Illegal/, 'a second click acts on the new state: the card is gone');
    const c = E.applyAction(JSON.parse(json), { type: 'play', cid: 'p0t0', player: 0 });
    assert.deepEqual(plain(c.fate), plain(a.fate), 'a restored copy leaps the same way');
    assert.deepEqual(c.lastEvents.map(e => e.text), a.lastEvents.map(e => e.text));
    // A clone owns its records: changing one never changes the other.
    const k = E.cloneState(a);
    k.fate.queue[0].state = 'pending';
    assert.equal(a.fate.queue[0].state, 'skipped');
});

test('the AI reads the public schedule: it leaps over an enemy wipe, revisits its own repeatable space and not the enemy\'s', () => {
    const turnOf = (s, level) => {
        const turn = s.turn;
        while (s.winner == null && s.turn === turn) s = E.applyAction(s, AI.choose(s, { level }));
        return s;
    };
    for (const level of ['normal', 'competent', 'expert']) {
        // Ahead on the board, with the enemy's Clean Slate due at the end of this round.
        let s = setup({ p0: ['kardashiant'], p1: ['lobstorian', 'astrophysicat', 'tremendoodle', 'beastie'], t0: ['clean-slate'], t1: ['leap-ahead'], options: TL });
        onBoard(s, 'p1c0', 'p1c1', 'p1c2', 'p1c3'); toHand(s, 'p0t0', 'p1t0');
        s.players[0].hearts = s.players[0].maxHearts = 30;
        s = act(s, { type: 'play', cid: 'p0t0' });
        s = act(s, { type: 'end' }); s = drawn(s); s = act(s, { type: 'end' });
        s = drawn(s); s = act(s, { type: 'end' });
        assert.equal(rec(s, 'f1').rounds, 1);
        s = turnOf(s, level);
        assert.equal(rec(s, 'f1').state, 'skipped', level + ' leaps over the wipe');
        assert.ok(['p1c0', 'p1c1', 'p1c2', 'p1c3'].every(cid => s.players[1].board.includes(cid)), 'its creatures are safe');
        // Its own Echoing Encouragement 1 space back: Revisit boosts its four creatures again.
        const echo = mine => {
            let t = setup({ p0: ['kardashiant', 'astrophysicat'], p1: ['lobstorian', 'astrophysicat', 'tremendoodle', 'beastie'],
                t0: mine ? ['second-wind'] : ['echoing-encouragement'], t1: mine ? ['echoing-encouragement', 'revisit'] : ['second-wind', 'revisit'], options: TL });
            onBoard(t, 'p0c0', 'p0c1', 'p1c0', 'p1c1', 'p1c2', 'p1c3'); toHand(t, 'p0t0', 'p1t0', 'p1t1');
            t.players.forEach(P => { P.hearts = P.maxHearts = 30; });
            if (!mine) t = act(t, { type: 'play', cid: 'p0t0' });
            t = act(t, { type: 'end' }); t = drawn(t);
            if (mine) t = act(t, { type: 'play', cid: 'p1t0' });
            t = act(t, { type: 'end' });         // round 1 ends: it fires
            t = quietTurn(t); t = quietTurn(t);  // Fate on 2: the space is 1 back
            t = quietTurn(t);
            assert.equal(rec(t, 'f1').spaces, -1);
            return turnOf(t, level);
        };
        const own = echo(true);
        assert.ok(own.players[1].discard.includes('p1t1'), level + ' revisits its own repeatable space');
        assert.equal(fires(own, 'f1'), 2);
        const theirs = echo(false);
        assert.ok(!theirs.players[1].discard.includes('p1t1'), level + ' does not land Fate on the enemy\'s boost');
        assert.equal(fires(theirs, 'f1'), 1);
    }
});

test('the Fate pack is bench and test only: no grant list, starter, deck or reward names it, and the game never loads the bench', () => {
    const ids = ['leap-ahead', 'revisit', 'echoing-encouragement'];
    const decks = Rift.data.tacticDecks;
    const lists = [decks.starter, decks.earned, decks.starterPack].concat(Object.values(decks.colour));
    ids.forEach(id => {
        assert.ok(T[id] && typeof T[id].run === 'function', id + ' is defined');
        assert.ok(lists.every(list => !list.includes(id)), id + ' is in no grant list');
        assert.ok(!Rift.State.ownedTactics(Rift.State.freshState()).includes(id));
    });
    for (const file of fs.readdirSync(path.join(GAME_DIR, 'data'))) {
        if (file === 'tactics.js' || !file.endsWith('.js')) continue;
        const text = fs.readFileSync(path.join(GAME_DIR, 'data', file), 'utf8');
        ids.forEach(id => assert.ok(!text.includes('\'' + id + '\''), 'data/' + file + ' must not grant ' + id));
    }
    assert.deepEqual([T['leap-ahead'].cost, T.revisit.cost, T['echoing-encouragement'].cost], [2, 2, 3], 'the draft costs');
    assert.deepEqual([T['leap-ahead'].colour, T.revisit.colour, T['echoing-encouragement'].colour], [undefined, 'memory', 'memory'], 'the draft kinds');
    const sch = T['echoing-encouragement'].scheduled;
    assert.deepEqual([sch.delay, sch.repeat, sch.lifetime], [1, true, 3]);
    const bench = fs.readFileSync(path.join(GAME_DIR, 'dev', 'fate-bench.js'), 'utf8');
    ['leap', 'echo', 'expiry'].forEach(c => assert.match(bench, new RegExp('\\b' + c + ': ')));
});
