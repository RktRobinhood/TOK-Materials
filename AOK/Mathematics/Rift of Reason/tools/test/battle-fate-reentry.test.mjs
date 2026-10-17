// Fate leaps, rewinds and marked repeatable spaces (#120; design/drafts/card-arena-2026-10-12/FATE-SCHEDULE-MODEL.md):
// Leap Ahead (enters only its landing space; one-shots it jumps over are skipped for good), Revisit (a rewind
// that re-enters a live repeatable space) and Echoing Encouragement (the first repeatable space: +1/+1 on each
// entry, boosts tagged with it and ended together when its lifetime of real rounds is used up).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { Rift, E, AI, setup, act, onBoard, toHand, plain, rule, stats } from './battle-helpers.mjs';
import { GAME_DIR } from './harness.mjs';

const TL = { timeline: true, fateStart: 9, fateGap: 3 };
const sched = s => plain(E.fateSchedule(s));
const byId = (s, id) => sched(s).find(e => e.id === id);
const fired = (s, id) => E.fullLog(s).filter(e => e.t === 'fate-event' && e.id === id).length;
const last = (s, t) => s.lastEvents.filter(e => e.t === t);
// Finish the current turn quietly: take a card if one can be taken (deck first), then End turn.
function quietTurn(s) {
    if (s.phase === 'draw') s = draw(s);
    return act(s, { type: 'end' });
}
function draw(s) {
    const legal = E.legalActions(s).filter(a => a.type === 'draw');
    return act(s, legal.find(a => a.choice === 'deck') || legal[0]);
}
// Plenty of energy and plays for the player about to act (tests are about Fate, not budgets).
function fresh(s) { s.players[s.active].energy = 10; s.players[s.active].playsThisTurn = 0; return s; }
const play = (s, cid, extra) => act(fresh(s), Object.assign({ type: 'play', cid }, extra || {}));

// A test-only one-shot summon on the Fate track, shaped like the draft Tomorrow's Idea (#121 owns the real
// card and tokens): when Fate reaches it, the first creature of its controller's deck enters play.
function withTestIdea(fn) {
    Rift.data.tactics['test-idea'] = { id: 'test-idea', name: 'Test Idea', cost: 1, text: 'Test: a one-shot summon 1 round ahead.', run() {},
        scheduled: { delay: 1, summary: 'A creature joins its side.',
            resolve(api, ev) {
                const s = api.s, P = s.players[ev.controller];
                const cid = P.deck.find(c => s.cards[c].kind === 'creature');
                if (!cid || P.board.length >= s.options.boardLimit) { api.emit({ t: 'tactic', text: 'Test Idea: no room.' }); return; }
                P.deck.splice(P.deck.indexOf(cid), 1);
                P.board.push(cid);
                s.cards[cid].enteredTurn = s.turn;
                api.emit({ t: 'play', player: ev.controller, cid, text: 'Test Idea: ' + api.name(cid) + ' joins.' });
            } } };
    try { fn(); } finally { delete Rift.data.tactics['test-idea']; }
}

test('Leap Ahead bypasses an enemy plan: the one-shot it jumps over is skipped for good, in public', () => {
    let s = setup({ p0: ['kardashiant', 'astrophysicat'], p1: ['lobstorian', 'beastie'], t0: ['leap-ahead', 'clockwork', 'clockwork'], t1: ['clean-slate'],
        options: Object.assign({}, TL, { fateStart: 6 }) });
    onBoard(s, 'p0c0', 'p0c1', 'p1c0'); toHand(s, 'p0t0', 'p0t1', 'p0t2', 'p1t0');
    s = act(s, { type: 'end' });
    s = draw(s);
    s = play(s, 'p1t0');                                   // B: Clean Slate on space 2
    s = act(s, { type: 'end' });                           // round 1 ends: cursor 1, the wipe is 1 round away
    s = draw(s);
    assert.deepEqual([byId(s, 'f1').state, byId(s, 'f1').rounds, s.fate.pos, s.fate.until], ['pending', 1, 1, 5]);
    s = play(s, 'p0t0');                                   // A: Leap Ahead
    const leap = last(s, 'fate-leap')[0];
    assert.deepEqual([leap.player, leap.from, leap.to, leap.spaces, plain(leap.skipped), plain(leap.passed)], [0, 1, 3, 2, ['f1'], []]);
    assert.equal(leap.privateTo, undefined, 'a leap is public');
    assert.match(leap.text, /^Fate leaps 2 rounds closer\.$/);
    const skip = last(s, 'fate-skip')[0];
    assert.deepEqual([skip.id, skip.def, skip.player, skip.by, skip.privateTo], ['f1', 'clean-slate', 1, 0, undefined]);
    assert.equal(skip.text, 'B\'s Clean Slate is skipped. It will not happen.');
    assert.deepEqual([byId(s, 'f1').state, byId(s, 'f1').reason, byId(s, 'f1').live, byId(s, 'f1').rounds], ['skipped', 'leap', false, null]);
    assert.deepEqual([s.fate.pos, s.fate.until], [3, 3], 'the cursor and the rule event move together');
    assert.equal(fired(s, 'f1'), 0);
    // Rewinding back over its space (twice), and walking over it again: it never happens.
    s = play(s, 'p0t1'); s = act(s, { type: 'choose', choice: 'rewind' });
    s = play(s, 'p0t2'); s = act(s, { type: 'choose', choice: 'rewind' });
    assert.equal(s.fate.pos, 1);
    assert.deepEqual([byId(s, 'f1').state, byId(s, 'f1').spaces, byId(s, 'f1').rounds], ['skipped', 1, null], 'ahead of NOW again, still skipped');
    for (let n = 0; n < 4; n++) s = quietTurn(s);
    assert.ok(s.fate.pos >= 2);
    assert.equal(fired(s, 'f1'), 0, 'skipped for good');
    assert.deepEqual(plain(s.players[0].board), ['p0c0', 'p0c1'], 'the wipe never came');
    assert.ok(s.players[1].board.includes('p1c0'));
    assert.equal(E.canSchedule(s, 1), true, 'a skipped event frees its capacity slot');
});

test('a leap never jumps Fate\'s own event: it lands on it; the landing space resolves first, then the rule event', () => {
    withTestIdea(() => {
        // until 2: a one-shot on space 1 (jumped over) and one on space 2 (the landing space, with the rule event).
        let s = setup({ p0: ['kardashiant', 'astrophysicat', 'beastie'], p1: ['lobstorian'], t0: ['test-idea', 'leap-ahead'], t1: ['test-idea'],
            axioms: ['mercy', 'thrift'], options: Object.assign({}, TL, { fateStart: 3 }) });
        onBoard(s, 'p0c0', 'p1c0'); toHand(s, 'p0t0', 'p0t1', 'p1t0');
        s = act(s, { type: 'end' }); s = draw(s);
        s = play(s, 'p1t0');                               // B's one-shot on space 1
        s = act(s, { type: 'end' }); s = draw(s);          // A's one-shot fires? no: B's f1 fires at space 1
        assert.equal(byId(s, 'f1').state, 'fired');
        s = play(s, 'p0t0');                               // A's one-shot on space 2 (cursor 1), rule event on space 3
        assert.deepEqual([byId(s, 'f2').spaces, s.fate.until], [1, 2]);
        s = play(s, 'p0t1');                               // Leap 2: lands on space 3, the rule event's space
        const leap = last(s, 'fate-leap')[0];
        assert.deepEqual([leap.spaces, leap.to, plain(leap.skipped)], [2, 3, ['f2']], 'space 2 is jumped over');
        assert.deepEqual(plain(s.lastEvents.map(e => e.t).filter(t => ['fate-leap', 'fate-skip', 'fate-event', 'flip'].includes(t))), ['fate-leap', 'fate-skip', 'flip']);
        assert.equal(s.axioms.active.defeat, 'mercy', 'the rule event happens on the landing space');
        assert.equal(s.fate.until, 3, 'and the next one is announced as usual');
        // Now with the rule event 1 space away: a leap of 2 stops there and says so.
        let t = setup({ p0: ['kardashiant'], p1: ['lobstorian'], t0: ['test-idea', 'leap-ahead'], axioms: ['mercy', 'thrift'], options: Object.assign({}, TL, { fateStart: 1 }) });
        onBoard(t, 'p0c0', 'p1c0'); toHand(t, 'p0t0', 'p0t1');
        t = play(t, 'p0t0');                               // a one-shot on space 1: the rule event's space
        t = play(t, 'p0t1');
        const short = last(t, 'fate-leap')[0];
        assert.deepEqual([short.spaces, short.to, plain(short.skipped)], [1, 1, []]);
        assert.match(short.text, /Fate leaps 1 round closer\. It stops at Fate's own event: a leap never jumps over a new rule or reset\./);
        assert.deepEqual(plain(t.lastEvents.map(e => e.t).filter(x => ['fate-event', 'flip'].includes(x))), ['fate-event', 'flip'], 'the landing space\'s event, then the rule');
        assert.equal(plain(t.lastEvents.find(e => e.t === 'fate-event')).how, 'leap');
    });
});

test('a leap passes over a repeatable space without entering it: it neither fires nor ends', () => {
    let s = setup({ p0: ['kardashiant', 'astrophysicat'], p1: ['lobstorian'], t0: ['echoing-encouragement', 'leap-ahead'], options: TL });
    onBoard(s, 'p0c0', 'p1c0'); toHand(s, 'p0t0', 'p0t1');
    const attack = E.attackOf(s, 'p0c0');
    s = play(s, 'p0t0');                                   // EE on space 1
    s = play(s, 'p0t1');                                   // leap 0 → 2 over it
    const leap = last(s, 'fate-leap')[0];
    assert.deepEqual([plain(leap.skipped), plain(leap.passed)], [[], ['f1']]);
    assert.equal(last(s, 'fate-skip').length, 0);
    assert.deepEqual([byId(s, 'f1').state, byId(s, 'f1').live, byId(s, 'f1').fires], ['pending', true, 0]);
    assert.equal(E.attackOf(s, 'p0c0'), attack, 'no boost');
});

test('Revisit re-enters a live repeatable space (it fires again); one-shots there never repeat; it is not offered at the cap', () => {
    withTestIdea(() => {
        let s = setup({ p0: ['kardashiant', 'astrophysicat', 'beastie'], p1: ['lobstorian'], t0: ['echoing-encouragement', 'revisit', 'revisit', 'test-idea'], options: TL });
        onBoard(s, 'p0c0', 'p1c0'); toHand(s, 'p0t0', 'p0t1', 'p0t2', 'p0t3');
        stats(s, 'p0c0', 1, 2);
        s = play(s, 'p0t0');                               // EE on space 1
        s = play(s, 'p0t3');                               // a one-shot summon on space 1 too
        s = act(s, { type: 'end' }); s = quietTurn(s);     // round 1 ends: cursor 1, both fire (in cast order)
        assert.deepEqual(plain(s.lastEvents.filter(e => e.t === 'fate-event').map(e => e.id)), ['f1', 'f2']);
        const summoned = s.players[0].board.filter(cid => cid !== 'p0c0');
        assert.equal(summoned.length, 1, 'the one-shot summon brings one creature');
        assert.deepEqual([E.attackOf(s, 'p0c0'), E.healthOf(s, 'p0c0').max], [2, 3], 'EE ran first: the summoned creature was not there yet');
        s = draw(s);
        s = quietTurn(s); s = quietTurn(s);                // round 2 ends: cursor 2 (empty)
        s = draw(s);
        const board = s.players[0].board.length, later = E.attackOf(s, summoned[0]);
        s = play(s, 'p0t1');                               // Revisit: back to space 1
        assert.equal(s.fate.pos, 1);
        const again = last(s, 'fate-event');
        assert.deepEqual(plain(again.map(e => [e.id, e.how, e.fires])), [['f1', 'rewind', 2]], 'only the repeatable space fires again');
        assert.equal(again[0].text, 'Fate reaches A\'s Echoing Encouragement again: A\'s creatures get +1/+1 until it expires.');
        assert.deepEqual([E.attackOf(s, 'p0c0'), E.healthOf(s, 'p0c0').max], [3, 4]);
        assert.equal(E.attackOf(s, summoned[0]), later + 1, 'the creature that joined later gets its first boost');
        assert.equal(s.players[0].board.length, board, 'no second summon');
        assert.equal(fired(s, 'f2'), 1, 'a one-shot fires once, whichever way Fate comes back');
        assert.match(last(s, 'tactic')[0].text, /^Revisit: Fate moves 1 round further away\.$/);
        // Revisit again lands on space 0, which holds nothing.
        s = play(s, 'p0t2');
        assert.deepEqual([s.fate.pos, last(s, 'fate-event').length], [0, 0]);
        // At the cap (the rule event already fateMax rounds away) it would do nothing: not offered.
        const capped = setup({ p0: ['kardashiant'], p1: ['lobstorian'], t0: ['revisit'], options: Object.assign({}, TL, { fateStart: 6, fateMax: 6 }) });
        toHand(capped, 'p0t0');
        assert.ok(!E.legalActions(capped).some(a => a.cid === 'p0t0'));
        const off = setup({ p0: ['kardashiant'], t0: ['revisit', 'leap-ahead'] });   // no Fate track
        toHand(off, 'p0t0', 'p0t1');
        assert.ok(!E.legalActions(off).some(a => a.type === 'play'));
    });
});

test('Echoing Encouragement: tagged boosts end together on expiry, health that needed them is lost, and inspection says how long they last', () => {
    let s = setup({ p0: ['kardashiant', 'astrophysicat'], p1: ['lobstorian'], t0: ['echoing-encouragement'], options: TL });
    onBoard(s, 'p0c0', 'p0c1', 'p1c0'); toHand(s, 'p0t0');
    stats(s, 'p0c0', 1, 2); stats(s, 'p0c1', 2, 1);
    s = play(s, 'p0t0');
    const sch = last(s, 'fate-schedule')[0];
    assert.equal(sch.text, 'A schedules Echoing Encouragement on the Fate track. In 1 round: A\'s creatures get +1/+1 until it expires.');
    assert.deepEqual([byId(s, 'f1').repeat, byId(s, 'f1').lifetime, byId(s, 'f1').expiresRound, byId(s, 'f1').summary],
        [true, 3, 3, 'A\'s creatures get +1/+1 until it expires.']);
    s = act(s, { type: 'end' }); s = quietTurn(s);         // round 1 ends: first entry
    assert.deepEqual([E.attackOf(s, 'p0c1'), E.healthOf(s, 'p0c1').max], [3, 2]);
    const fx = plain(E.activeEffects(s, 'p0c1'));
    assert.deepEqual(fx.map(x => [x.stat, x.amount, x.label, x.until, x.from]),
        [['attack', 1, 'Echoing Encouragement', 'fate', 3], ['health', 1, 'Echoing Encouragement', 'fate', 3]], 'until it expires after round 3');
    assert.ok(s.cards.p0c1.buffs.every(b => b.fate === 'f1'));
    // An ordinary temporary boost and a permanent one are not touched by the expiry.
    s.cards.p0c0.buffs.push({ label: 'Other', attack: 1, health: 0, temp: false });
    s.cards.p0c1.damage = 1;                                // it now needs the +1 health to stay in play
    s = draw(s); s = quietTurn(s); s = quietTurn(s);       // round 2 ends (space 2: nothing)
    s = draw(s); s = quietTurn(s);
    s = quietTurn(s);                                      // round 3 ends: lifetime used up
    const exp = s.lastEvents.find(e => e.t === 'fate-expire');
    assert.ok(exp, 'it expires at the end of round 3');
    assert.deepEqual(plain(exp.boosted).sort(), ['p0c0', 'p0c1']);
    assert.equal(exp.text, 'A\'s Echoing Encouragement expires after 3 rounds. Its boosts end.');
    assert.equal(byId(s, 'f1').state, 'expired');
    assert.ok(s.lastEvents.some(e => e.t === 'defeated' && e.cid === 'p0c1'), 'the creature that needed the boost is defeated');
    assert.deepEqual(plain(s.cards.p0c0.buffs.map(b => b.label)), ['Other'], 'other boosts stay');
    assert.equal(E.attackOf(s, 'p0c0'), 2);
});

test('lifetime counts real rounds: the Anchor, rewinds and re-entries never extend it', () => {
    let s = setup({ p0: ['kardashiant', 'muskrat'], p1: ['lobstorian'], t0: ['echoing-encouragement', 'revisit', 'clockwork'],
        options: Object.assign({}, TL, { fateStart: 6, fateMax: 12 }) });
    onBoard(s, 'p0c0', 'p0c1', 'p1c0'); toHand(s, 'p0t0', 'p0t1', 'p0t2');
    stats(s, 'p0c0', 1, 3);
    s = play(s, 'p0t0');                                   // round 1: EE on space 1, expires after round 3
    s.fate.anchorRound = s.round;                          // the Anchor holds round 1: Fate does not move
    s = act(s, { type: 'end' }); s = quietTurn(s);
    assert.deepEqual([s.fate.pos, byId(s, 'f1').fires], [0, 0], 'held: nothing entered');
    s = draw(s); s = quietTurn(s); s = quietTurn(s);       // round 2 ends: cursor 1, entry 1
    assert.equal(byId(s, 'f1').fires, 1);
    s = draw(s);
    s = play(s, 'p0t2'); s = act(s, { type: 'choose', choice: 'rewind' });   // back to space 0
    s = act(s, { type: 'activate', cid: 'p0c1', ability: 'next-year' });     // and two more
    assert.equal(s.fate.pos, -2);
    s = act(s, { type: 'end' }); s = quietTurn(s);         // round 3 ends: cursor -1, lifetime used up
    assert.equal(byId(s, 'f1').state, 'expired', 'expired after round 3 although the cursor went back');
    for (let n = 0; n < 6; n++) s = quietTurn(s);           // walks over space 1 again
    assert.ok(s.fate.pos >= 1);
    assert.equal(byId(s, 'f1').fires, 1, 'an expired space never fires again');
    assert.equal(E.attackOf(s, 'p0c0'), 1);
});

test('the worked example in FATE-SCHEDULE-MODEL.md §6, move by move', () => {
    withTestIdea(() => {
        let s = setup({ p0: ['kardashiant', 'astrophysicat', 'beastie'], p1: ['lobstorian', 'muskrat'],
            t0: ['test-idea', 'leap-ahead', 'echoing-encouragement', 'revisit'], t1: ['clean-slate', 'clockwork'], options: TL });
        onBoard(s, 'p1c1'); toHand(s, 'p0t0', 'p0t1', 'p0t2', 'p0t3', 'p1t0', 'p1t1');
        const untils = [s.fate.until];
        const note = () => untils.push(s.fate.until);
        const T = () => s.players[0].board[0];
        const q = () => sched(s).map(e => e.id + '@' + s.fate.queue.find(x => x.id === e.id).space + ' ' + e.state).join(', ');
        s = play(s, 'p0t0');                                                 // 1 A: Tomorrow's Idea (here: Test Idea)
        assert.equal(q(), 'f1@1 pending');
        s = act(s, { type: 'end' }); s = draw(s);
        s = play(s, 'p1t0');                                                 // 1 B: Clean Slate
        assert.equal(q(), 'f1@1 pending, f2@2 pending');
        s = act(s, { type: 'end' }); note();                                 // 1 end: ordinary advance
        assert.deepEqual([s.fate.pos, byId(s, 'f1').state], [1, 'fired']);
        stats(s, T(), 1, 2);                                                 // the 1/2 token T
        s = draw(s);
        s = play(s, 'p0t1'); note();                                         // 2 A: Leap Ahead
        assert.deepEqual([s.fate.pos, byId(s, 'f2').state], [3, 'skipped']);
        s = play(s, 'p0t2');                                                 // 2 A: Echoing Encouragement
        assert.deepEqual([s.fate.queue[2].space, byId(s, 'f3').state, byId(s, 'f3').expiresRound], [4, 'pending', 4]);
        s = quietTurn(s); s = quietTurn(s); note();                          // 2 end
        assert.deepEqual([s.fate.pos, byId(s, 'f3').fires, E.attackOf(s, T()), E.healthOf(s, T()).max], [4, 1, 2, 3]);
        s = quietTurn(s); s = quietTurn(s); note();                          // 3 end: space 5 is empty
        assert.equal(s.fate.pos, 5);
        s = draw(s);
        s = play(s, 'p0t3'); note();                                         // 4 A: Revisit
        assert.deepEqual([s.fate.pos, byId(s, 'f3').fires, E.attackOf(s, T()), E.healthOf(s, T()).max], [4, 2, 3, 4]);
        s = act(s, { type: 'end' }); s = draw(s);
        s = act(fresh(s), { type: 'activate', cid: 'p1c1', ability: 'next-year' }); note();   // 4 B: Next Year
        assert.deepEqual([s.fate.pos, byId(s, 'f2').state, fired(s, 'f2')], [2, 'skipped', 0], 'the skipped Clean Slate stays skipped');
        s = play(s, 'p1t1'); s = act(s, { type: 'choose', choice: 'rewind' }); note();       // 4 B: Clockwork back
        assert.deepEqual([s.fate.pos, fired(s, 'f1'), s.players[0].board.length], [1, 1, 1], 'a fired one-shot: no second token');
        s = act(s, { type: 'end' }); note();                                 // 4 end: EE expires, its boosts end
        assert.deepEqual([s.fate.pos, byId(s, 'f3').state, E.attackOf(s, T()), E.healthOf(s, T()).max], [2, 'expired', 1, 2]);
        s = quietTurn(s); s = quietTurn(s); note();                          // 5 end
        s = quietTurn(s); s = quietTurn(s); note();                          // 6 end: entering EE's space does nothing
        assert.equal(s.fate.pos, 4);
        assert.deepEqual([fired(s, 'f1'), fired(s, 'f2'), fired(s, 'f3')], [1, 0, 2]);
        assert.deepEqual(untils, [9, 8, 6, 5, 4, 5, 7, 8, 7, 6, 5], 'the rule node never reached the cap');
    });
});

test('control changes never move an event: a stolen creature keeps its tagged boost until expiry, and the space boosts only its controller\'s side', () => {
    let s = setup({ p0: ['kardashiant', 'astrophysicat'], p1: ['lobstorian', 'beastie'], t0: ['echoing-encouragement', 'revisit'], t1: ['persuasion'], options: TL });
    onBoard(s, 'p0c0', 'p0c1', 'p1c0'); toHand(s, 'p0t0', 'p0t1', 'p1t0');
    stats(s, 'p0c0', 1, 2); stats(s, 'p0c1', 0, 4);
    s = play(s, 'p0t0');
    s = act(s, { type: 'end' }); s = quietTurn(s);         // round 1 ends: A's two creatures +1/+1
    s = draw(s); s = act(s, { type: 'end' }); s = draw(s);
    s = play(s, 'p1t0', { target: 'p0c1' });               // B steals the 1/5 creature
    assert.equal(s.cards.p0c1.controller, 1);
    assert.deepEqual([E.attackOf(s, 'p0c1'), E.healthOf(s, 'p0c1').max], [1, 5], 'it keeps the boost');
    s = act(s, { type: 'end' }); s = draw(s);              // round 2 ends: space 2 (empty)
    s = play(s, 'p0t1');                                   // A: Revisit onto EE
    assert.deepEqual([E.attackOf(s, 'p0c0'), E.attackOf(s, 'p0c1')], [3, 1], 'only its controller\'s side gets the new boost');
    assert.equal(byId(s, 'f1').controller, 0);
    s = quietTurn(s); s = quietTurn(s);                    // round 3 ends: expiry ends every boost it gave, on either side
    assert.equal(byId(s, 'f1').state, 'expired');
    assert.deepEqual([E.attackOf(s, 'p0c0'), E.attackOf(s, 'p0c1'), E.healthOf(s, 'p0c1').max], [1, 0, 4]);
});

test('rules may change around it: a Fate reset or the Spare Axiom never touches the space or its boosts', () => {
    let s = setup({ p0: ['kardashiant'], p1: ['lobstorian'], t0: ['echoing-encouragement'], axioms: ['thrift'], options: Object.assign({}, TL, { fateStart: 2 }) });
    onBoard(s, 'p0c0', 'p1c0'); toHand(s, 'p0t0');
    s.fate.events = 1;                                     // the next rule event is a reset
    rule(s, 'thrift');
    s = play(s, 'p0t0');
    s = act(s, { type: 'end' }); s = quietTurn(s);         // round 1 ends: EE fires
    const boosted = E.attackOf(s, 'p0c0');
    s = draw(s); s = quietTurn(s); s = quietTurn(s);       // round 2 ends: the reset
    assert.ok(E.fullLog(s).some(e => e.t === 'reset'));
    assert.deepEqual(plain(s.axioms.active), {});
    assert.deepEqual([byId(s, 'f1').state, byId(s, 'f1').live, E.attackOf(s, 'p0c0')], ['fired', true, boosted]);
    s.players[0].axHand = ['spare-axiom'];
    rule(s, 'thrift');                                     // a rule for it to clear
    s = draw(s);
    const queue = plain(s.fate.queue);
    s = act(fresh(s), { type: 'axiom', choice: 'spare-axiom' });
    assert.deepEqual(plain(s.fate.queue), queue);
    assert.equal(E.attackOf(s, 'p0c0'), boosted);
});

test('saved replay and repeated submits: the same actions on a JSON copy give the same single result', () => {
    let s = setup({ p0: ['kardashiant', 'astrophysicat'], p1: ['lobstorian', 'beastie'], t0: ['echoing-encouragement', 'leap-ahead', 'revisit'], t1: ['clean-slate'],
        options: TL });
    onBoard(s, 'p0c0', 'p1c0'); toHand(s, 'p0t0', 'p0t1', 'p0t2', 'p1t0');
    s = play(s, 'p0t0');
    s = act(s, { type: 'end' }); s = draw(s); s = play(s, 'p1t0');
    s = act(s, { type: 'end' }); s = draw(s);              // round 1 ends: EE fires; B's wipe is 1 round away
    const saved = JSON.stringify(s);
    const script = [{ type: 'play', cid: 'p0t1' }, { type: 'play', cid: 'p0t2' }, { type: 'end' }];
    const run = start => script.reduce((x, a) => act(fresh(x), a), start);
    const a = run(s), b = run(JSON.parse(saved));
    assert.equal(JSON.stringify(s), saved, 'the input state never changes');
    assert.deepEqual(plain(a.fate), plain(b.fate));
    assert.deepEqual(plain(a.cards), plain(b.cards));
    assert.deepEqual(E.fullLog(a).map(e => e.text), E.fullLog(b).map(e => e.text));
    assert.deepEqual(sched(a).map(e => [e.id, e.state, e.fires]), [['f1', 'fired', 1], ['f2', 'skipped', 0]], 'the leap skips the wipe; Revisit lands on its space: nothing');
    // A double click: the same play on the same state twice gives one result; on the new state it is illegal.
    const x = act(fresh(s), { type: 'play', cid: 'p0t1' }), y = act(fresh(s), { type: 'play', cid: 'p0t1' });
    assert.equal(JSON.stringify(x), JSON.stringify(y));
    assert.equal(x.lastEvents.filter(e => e.t === 'fate-leap').length, 1);
    assert.throws(() => act(x, { type: 'play', cid: 'p0t1' }), /Illegal/);
    const r = act(fresh(x), { type: 'play', cid: 'p0t2' });
    assert.throws(() => act(r, { type: 'play', cid: 'p0t2' }), /Illegal/);
    assert.equal(fired(r, 'f1'), 1, 'Revisit lands on space 2 (the skipped wipe): nothing fires');
});

test('previews are the resolution: a leap\'s skips, passes and landing, and a repeatable space\'s boosts', () => {
    let s = setup({ p0: ['kardashiant', 'astrophysicat'], p1: ['lobstorian'], t0: ['echoing-encouragement', 'leap-ahead'], t1: ['clean-slate'], options: TL });
    onBoard(s, 'p0c0', 'p0c1', 'p1c0'); toHand(s, 'p0t0', 'p0t1', 'p1t0');
    s = act(s, { type: 'end' }); s = draw(s); s = play(s, 'p1t0');   // B's wipe on space 2
    s = act(s, { type: 'end' }); s = draw(s);
    s = play(s, 'p0t0');                                   // A's EE on space 2 as well (cursor 1)
    const pre = plain(E.fateEventPreview(s, 'f2'));
    assert.deepEqual(pre.boosted.map(b => [b.cid, b.controller, b.attack, b.health]), [['p0c0', 0, 1, 1], ['p0c1', 0, 1, 1]]);
    assert.deepEqual(pre.defeated, []);
    const lp = plain(E.fateLeapPreview(s, 2, 0));
    assert.deepEqual([lp.spaces, lp.from, lp.to, lp.skipped, lp.passed, lp.fired, lp.rule], [2, 1, 3, ['f1'], ['f2'], [], false]);
    const real = play(s, 'p0t1');
    const leap = last(real, 'fate-leap')[0];
    assert.deepEqual([leap.spaces, leap.to, plain(leap.skipped), plain(leap.passed)], [lp.spaces, lp.to, lp.skipped, lp.passed]);
    assert.equal(fired(s, 'f2'), 0, 'previews change nothing');
    assert.equal(E.fateLeapPreview(setup({ p0: ['kardashiant'] }), 2, 0), null, 'no Fate track, no preview');
});

test('the AI reads leaps and repeatable spaces from the public schedule', () => {
    const turnOf = (s, level) => {
        const turn = s.turn;
        while (s.winner == null && s.turn === turn) s = E.applyAction(s, AI.choose(s, { level }));
        return s;
    };
    for (const level of ['normal', 'competent', 'expert']) {
        // Ahead on the board, with the enemy's wipe due at the end of this round: Leap Ahead skips it.
        const ahead = wipe => {
            let t = setup({ p0: ['kardashiant'], p1: ['lobstorian', 'astrophysicat', 'tremendoodle', 'beastie', 'siuuugull'], t0: [wipe ? 'clean-slate' : 'second-wind'], t1: ['leap-ahead'],
                options: Object.assign({}, TL, { fateStart: 6 }) });
            onBoard(t, 'p1c0', 'p1c1', 'p1c2', 'p1c3'); toHand(t, 'p0t0', 'p1t0', 'p1c4');
            t.players[0].hearts = t.players[0].maxHearts = 30;
            t = act(t, { type: 'play', cid: 'p0t0' });
            t = act(t, { type: 'end' }); t = act(t, { type: 'draw', choice: 'deck' }); t = act(t, { type: 'end' });
            t = act(t, { type: 'draw', choice: 'deck' }); t = act(t, { type: 'end' });
            return turnOf(t, level);
        };
        const leapt = ahead(true);
        assert.ok(leapt.players[1].discard.includes('p1t0'), level + ' plays Leap Ahead over the wipe');
        assert.equal(sched(leapt)[0].state, 'skipped', level);
        assert.ok(!ahead(false).players[1].discard.includes('p1t0'), level + ' keeps Leap Ahead when nothing threatens its board');
    }
});

test('the Fate pack is bench and test only: no grant list, starter, deck or reward names its cards', () => {
    const T = Rift.data.tactics;
    const pack = Object.keys(T).filter(id => T[id].pack === 'fate');
    assert.deepEqual(plain(pack), ['clean-slate', 'leap-ahead', 'revisit', 'echoing-encouragement']);
    const decks = Rift.data.tacticDecks;
    const lists = [decks.starter, decks.earned, decks.starterPack].concat(Object.values(decks.colour));
    for (const id of pack) {
        assert.ok(lists.every(list => !list.includes(id)), id);
        assert.ok(!Rift.State.ownedTactics(Rift.State.freshState()).includes(id), id);
        for (const file of fs.readdirSync(path.join(GAME_DIR, 'data'))) {
            if (file === 'tactics.js' || !file.endsWith('.js')) continue;
            assert.ok(!fs.readFileSync(path.join(GAME_DIR, 'data', file), 'utf8').includes("'" + id + "'"), 'data/' + file + ' must not grant ' + id);
        }
    }
    assert.deepEqual(plain(pack.map(id => [T[id].colour || null, T[id].rarity || null])), [[null, null], [null, null], ['memory', null], ['memory', null]]);
    assert.deepEqual(plain(pack.map(id => T[id].cost)), [4, 2, 2, 3], 'the draft costs');
    pack.forEach(id => assert.ok(T[id].text.length <= 110, id + ': short card text'));
});
