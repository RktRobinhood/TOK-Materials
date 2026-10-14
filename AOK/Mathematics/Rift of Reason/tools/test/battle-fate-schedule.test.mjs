// Scheduled Fate events (#118 model, design/drafts/card-arena-2026-10-12/FATE-SCHEDULE-MODEL.md) and the
// first scheduled spell, Clean Slate (#119): a public one-shot node 2 rounds ahead that defeats every
// creature in play when Fate reaches it. Preview = resolution, exactly once, lossless state, AI awareness.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { Rift, E, AI, setup, act, onBoard, toHand, toDiscard, plain, rule } from './battle-helpers.mjs';
import { GAME_DIR } from './harness.mjs';

const TL = { timeline: true, fateStart: 3, fateGap: 3 };
const sched = s => plain(E.fateSchedule(s));
const fired = (s, id) => E.fullLog(s).filter(e => e.t === 'fate-event' && e.id === id).length;
// Finish the current turn quietly: take a card if one can be taken (deck first), then End turn.
function quietTurn(s) {
    if (s.phase === 'draw') {
        const legal = E.legalActions(s).filter(a => a.type === 'draw');
        s = act(s, legal.find(a => a.choice === 'deck') || legal[0]);
    }
    return act(s, { type: 'end' });
}
// Two sides with creatures in play; p0 holds Clean Slate (p0t0).
function arena(extra = {}) {
    const s = setup(Object.assign({ p0: ['zuckerborg', 'kardashiant', 'astrophysicat'], p1: ['lobstorian', 'astrophysicat', 'beastie'],
        t0: ['clean-slate'], options: TL }, extra));
    onBoard(s, 'p0c0', 'p0c1', 'p1c0', 'p1c1');
    toHand(s, 'p0t0');
    return s;
}
const cast = (s, cid = 'p0t0') => act(s, { type: 'play', cid });

test('Clean Slate is a public one-shot node 2 rounds ahead, cast from either seat, with source and controller explicit', () => {
    let s = arena();
    s = cast(s);
    assert.equal(s.players[0].energy, 6, 'it costs 4');
    assert.ok(s.players[0].discard.includes('p0t0'), 'the card goes to the discard as usual');
    const ev = s.lastEvents.find(e => e.t === 'fate-schedule');
    assert.ok(ev && ev.privateTo === undefined, 'scheduling is public');
    assert.match(ev.text, /schedules Clean Slate on the Fate track\. In 2 rounds: every creature in play is defeated\./);
    const [node] = sched(s);
    assert.deepEqual([node.id, node.def, node.cid, node.controller, node.state, node.repeat, node.spaces, node.rounds, node.after],
        ['f1', 'clean-slate', 'p0t0', 0, 'pending', false, 2, 2, 1]);
    assert.equal(s.fate.queue[0].space, s.fate.pos + 2);
    // The second player casting it in round 1: it still resolves after two round ends.
    let t = arena({ t1: ['clean-slate'] });
    toHand(t, 'p1t0');
    t = act(t, { type: 'end' });
    t = act(t, { type: 'draw', choice: 'deck' });
    t = cast(t, 'p1t0');
    assert.deepEqual([sched(t)[0].controller, sched(t)[0].rounds, sched(t)[0].turns], [1, 2, 3]);
});

test('the countdown agrees with the real resolution: rounds, End turns, turn and round, for either seat', () => {
    for (const seat of [0, 1]) {
        let s = arena({ t1: ['clean-slate'] });
        toHand(s, 'p1t0');
        if (seat === 1) { s = act(s, { type: 'end' }); s = act(s, { type: 'draw', choice: 'deck' }); }
        s = cast(s, 'p' + seat + 't0');
        const promise = sched(s)[0];
        let n = 0;
        while (!fired(s, 'f1') && n++ < 10) {
            const now = sched(s)[0];
            assert.equal(now.turn, promise.turn, 'the forecast turn never drifts while nothing bends time');
            assert.equal(now.round, promise.round);
            assert.equal(now.turns, 2 * now.rounds - (s.roundTurns[1 - s.active] ? 1 : 0));
            s = quietTurn(s);
        }
        assert.equal(fired(s, 'f1'), 1);
        assert.equal(s.turn, promise.turn, 'it happens as the forecast turn starts');
        assert.equal(s.round, promise.round, 'and as the forecast round starts');
        assert.ok(s.lastEvents.findIndex(e => e.t === 'fate-move') < s.lastEvents.findIndex(e => e.t === 'fate-event'), 'on the round\'s ordinary Fate move');
    }
});

test('it defeats whoever is in play when it resolves, with normal Last Words, and leaves hands and decks alone', () => {
    let s = arena();
    s = cast(s);
    s = quietTurn(s);
    // A creature played after the cast is caught too; one that left play before is not.
    s = act(s, { type: 'draw', choice: 'deck' });
    toHand(s, 'p1c2');
    s = act(s, { type: 'play', cid: 'p1c2' });
    s = quietTurn(s);
    toHand(s, 'p0c1');   // Kim leaves play before Fate arrives
    const hand1 = s.players[1].hand.slice();
    s = quietTurn(s); s = quietTurn(s);
    assert.equal(fired(s, 'f1'), 1);
    const defeated = s.lastEvents.filter(e => e.t === 'defeated');
    assert.deepEqual(plain(defeated.map(e => e.cid)), ['p0c0', 'p1c0', 'p1c1', 'p1c2'], 'the caster\'s side first, left to right');
    assert.ok(defeated.every(e => e.why === 'fate'));
    assert.deepEqual(plain(s.players[0].board.concat(s.players[1].board)), []);
    assert.ok(s.players[0].hand.includes('p0c0'), 'Zuckerborg\'s Last Word (Metaverse) returns it to the hand');
    assert.ok(s.players[0].hand.includes('p0c1'), 'a creature in the hand is untouched');
    assert.ok(hand1.every(cid => s.players[1].hand.includes(cid) || s.players[1].board.includes(cid) || s.players[1].discard.includes(cid)));
    assert.equal(sched(s)[0].state, 'fired');
    assert.equal(sched(s)[0].firedRound, 2);
});

test('the preview is the resolution: normal rules, Mercy, abilities off, and a nearly full hand', () => {
    const cases = [
        ['basic', s => s],
        ['mercy', s => rule(s, 'mercy')],
        ['empty-set', s => rule(s, 'empty-set')],
        ['full hand', s => { rule(s, 'mercy'); s.players[1].hand = s.players[1].deck.splice(0, 9); return s; }],
    ];
    for (const [label, change] of cases) {
        let s = change(arena());
        s = cast(s);
        s = quietTurn(quietTurn(quietTurn(s)));
        s = act(s, E.legalActions(s).find(a => a.type === 'draw'));   // round 2, player 1: its End turn resolves Clean Slate
        const pre = plain(E.fateEventPreview(s, 'f1'));
        assert.equal(fired(s, 'f1'), 0, label + ': the preview resolves nothing');
        const after = act(s, { type: 'end' });
        const real = after.lastEvents.filter(e => e.t === 'defeated').map(e => ({ cid: e.cid, owner: e.player, dest: e.dest }));
        assert.deepEqual(pre.defeated.map(d => ({ cid: d.cid, owner: d.owner, dest: d.dest })), plain(real), label + ': preview = resolution');
        assert.deepEqual(pre.hearts, plain(after.players.map(P => P.hearts)), label);
        if (label === 'mercy') assert.ok(pre.defeated.every(d => d.dest === 'hand'), 'Mercy: back to the hand');
        if (label === 'empty-set') assert.equal(pre.defeated.find(d => d.cid === 'p0c0').dest, 'discard', 'abilities off: no Last Word');
        if (label === 'full hand') assert.ok(pre.defeated.some(d => d.owner === 1 && d.dest === 'discard'), 'a full hand sends the rest to the discard');
    }
});

test('time effects move the node with the cursor; a fired one-shot never fires again, whichever way Fate comes back', () => {
    // Next Year (Muskrat, rewind 2) delays it; Filter (Kim, 2 sooner) walks onto it at once.
    let s = setup({ p0: ['muskrat', 'kardashiant', 'astrophysicat'], p1: ['lobstorian'], t0: ['clean-slate', 'clockwork', 'clockwork'], options: TL });
    onBoard(s, 'p0c0', 'p0c1', 'p1c0'); toHand(s, 'p0t0', 'p0t1', 'p0t2');
    s = cast(s);
    assert.equal(E.fatePreview(s, -2).rounds, 5);
    s = act(s, { type: 'activate', cid: 'p0c0', ability: 'next-year' });
    assert.deepEqual([sched(s)[0].spaces, sched(s)[0].rounds], [4, 4], 'Next Year: the wipe is 2 rounds later too');
    assert.equal(s.fate.pos, -2);
    s = quietTurn(s); s = quietTurn(s);   // round 1 ends (space -1); p0 again
    s = act(s, { type: 'draw', choice: 'deck' });
    assert.equal(sched(s)[0].rounds, 3);
    s.players[0].energy = 5;
    s = act(s, { type: 'activate', cid: 'p0c1', ability: 'filter' });
    assert.equal(sched(s)[0].rounds, 1, 'Filter: 2 rounds sooner');
    // Clockwork forward walks onto it: it resolves at once, mid-turn.
    toHand(s, 'p0t1');
    s = act(s, { type: 'play', cid: 'p0t1' });
    s = act(s, { type: 'choose', choice: 'forward' });
    assert.equal(fired(s, 'f1'), 1);
    assert.equal(s.lastEvents.find(e => e.t === 'fate-event').how, 'walk');
    assert.deepEqual(plain(s.players[1].board), []);
    // Rewind back past it (Clockwork back), then let Fate walk over its space again: still spent.
    onBoard(s, 'p1c0');
    toHand(s, 'p0t2');
    s = act(s, { type: 'play', cid: 'p0t2' });
    s = act(s, { type: 'choose', choice: 'rewind' });
    assert.ok(sched(s)[0].spaces > 0, 'its space is ahead of NOW again');
    assert.equal(sched(s)[0].state, 'fired');
    assert.equal(sched(s)[0].rounds, null, 'a spent node has no countdown');
    for (let n = 0; n < 6; n++) s = quietTurn(s);
    assert.equal(fired(s, 'f1'), 1, 'one-shot: it never happens twice');
    assert.ok(s.players[1].board.includes('p1c0'), 'the creature it once missed is safe');
});

test('same space: scheduled events resolve in the order they were cast, then Fate\'s own rule event', () => {
    let s = arena({ t1: ['clean-slate'], options: Object.assign({}, TL, { fateStart: 2 }), axioms: ['mercy', 'thrift'] });
    assert.equal(s.fate.next, 'mercy', 'Fate will turn Mercy over on the same space');
    toHand(s, 'p1t0');
    s = cast(s);
    s = act(s, { type: 'end' }); s = act(s, { type: 'draw', choice: 'deck' });
    s = cast(s, 'p1t0');
    assert.deepEqual(sched(s).map(e => [e.id, e.rounds]), [['f1', 2], ['f2', 2]]);
    const pre = plain(E.fateEventPreview(s, 'f1'));
    s = act(s, { type: 'end' }); s = quietTurn(s); s = quietTurn(s);
    const order = plain(s.lastEvents).map(e => e.t === 'fate-event' ? e.id : e.t).filter(t => ['f1', 'f2', 'flip'].includes(t));
    assert.deepEqual(order, ['f1', 'f2', 'flip']);
    assert.ok(s.lastEvents.filter(e => e.t === 'defeated').every(e => e.dest === 'discard' || e.cid === 'p0c0'), 'under the rules it was forecast with (Mercy arrives after)');
    assert.deepEqual(pre.defeated.map(d => d.dest), plain(s.lastEvents.filter(e => e.t === 'defeated').map(e => e.dest)));
    assert.equal(s.axioms.active.defeat, 'mercy');
    assert.match(s.lastEvents.find(e => e.t === 'tactic' && /no creature/.test(e.text)).text, /no creature to defeat/, 'the second wipe finds nothing, and is spent all the same');
    assert.deepEqual(sched(s).map(e => e.state), ['fired', 'fired']);
});

test('capacity, no Fate track, Fate reset and the Spare Axiom: the queue follows the model', () => {
    let s = arena({ t0: ['clean-slate', 'clean-slate'] });
    toHand(s, 'p0t1');
    s.players[0].energy = 20;
    s = cast(s); s = cast(s, 'p0t1');
    s.players[0].playsThisTurn = 0;
    toHand(s, 'p0t0');   // a third cast, as if the card came back
    assert.ok(!E.legalActions(s).some(a => a.cid === 'p0t0'), 'two live events per player: a third is not offered');
    assert.equal(E.canSchedule(s, 0), false);
    assert.equal(E.canSchedule(s, 1), true, 'the other player has its own two');
    const off = setup({ p0: ['kardashiant'], t0: ['clean-slate'] });   // the helper's default: no Fate track
    toHand(off, 'p0t0');
    assert.ok(!E.legalActions(off).some(a => a.cid === 'p0t0'));
    // A Fate reset clears rules, never the queue.
    let r = arena({ options: Object.assign({}, TL, { fateStart: 1 }) });
    r.fate.events = 1;   // the next rule event is a reset
    rule(r, 'thrift');
    r = cast(r);
    const before = sched(r)[0];
    r = act(r, { type: 'end' }); r = quietTurn(r);
    assert.ok(r.lastEvents.some(e => e.t === 'reset'));
    assert.deepEqual(plain(r.axioms.active), {});
    assert.deepEqual([sched(r)[0].state, sched(r)[0].rounds, r.fate.queue[0].space], ['pending', 1, before.spaces]);
    // Granny's Spare Axiom clears every rule; the queue stays as it was.
    let g = arena();
    g.players[0].axHand = ['spare-axiom'];
    rule(g, 'thrift');
    g = cast(g);
    const queue = plain(g.fate.queue);
    g = act(g, { type: 'axiom', choice: 'spare-axiom' });
    assert.deepEqual(plain(g.fate.queue), queue);
});

test('lossless: the input never changes, copies resolve identically, and a JSON round trip loses nothing', () => {
    let s = arena();
    s = cast(s);
    s = quietTurn(quietTurn(quietTurn(s)));
    s = act(s, { type: 'draw', choice: 'deck' });   // its End turn resolves Clean Slate
    const json = JSON.stringify(s);
    const a = act(s, { type: 'end' }), b = act(s, { type: 'end' });
    assert.equal(JSON.stringify(s), json, 'applying the action never changes the state it was given');
    assert.equal(JSON.stringify(a), JSON.stringify(b), 'a repeated click on the same state gives the same single result');
    assert.equal(fired(a, 'f1'), 1);
    assert.throws(() => act(a, { type: 'end' }), /Illegal/, 'the next player must draw first: no second End turn');
    const copy = JSON.parse(json);
    const c = E.applyAction(copy, { type: 'end', player: 1 });
    assert.deepEqual(plain(c.fate), plain(a.fate));
    assert.deepEqual(plain(c.players), plain(a.players));
    assert.deepEqual(c.lastEvents.map(e => e.text), a.lastEvents.map(e => e.text));
    // A clone owns its queue records.
    const k = E.cloneState(s);
    k.fate.queue[0].state = 'cancelled';
    assert.equal(s.fate.queue[0].state, 'pending');
    // A state from before #118 (no cursor or queue) plays on and can schedule.
    let old = arena();
    delete old.fate.pos; delete old.fate.seq; delete old.fate.queue;
    old = quietTurn(old);
    assert.equal(old.fate.pos, undefined);
    old = quietTurn(old);
    assert.equal(old.fate.pos, 1);
    toHand(old, 'p0t0');
    old = act(old, { type: 'draw', choice: 'deck' });
    old = cast(old);
    assert.deepEqual([sched(old)[0].id, sched(old)[0].spaces], ['f1', 2]);
});

test('the source card may come back: the pending node is unchanged, and recasting it makes a new, separate node', () => {
    let s = arena();
    s.players[0].energy = 20;
    s = cast(s);
    toHand(s, 'p0t0');   // as Remember When would
    assert.equal(sched(s)[0].state, 'pending');
    s = quietTurn(s); s = act(s, { type: 'draw', choice: 'deck' }); s = quietTurn(s);
    s = act(s, { type: 'draw', choice: 'deck' });
    s.players[0].energy = 10;
    s = cast(s);
    assert.deepEqual(sched(s).map(e => [e.id, e.cid, e.rounds]), [['f1', 'p0t0', 1], ['f2', 'p0t0', 2]]);
    s = quietTurn(s); s = quietTurn(s);
    assert.deepEqual(sched(s).map(e => e.state), ['fired', 'pending']);
    s = quietTurn(s); s = quietTurn(s);
    assert.deepEqual(sched(s).map(e => e.state), ['fired', 'fired']);
    assert.equal(fired(s, 'f1') + fired(s, 'f2'), 2);
});

test('normal winner checks: a side left with no creatures anywhere loses at its next turn start', () => {
    // Player 1's whole deck is one creature (and two spells); player 0 keeps a creature in its deck.
    let s = setup({ p0: ['kardashiant', 'astrophysicat'], p1: ['lobstorian'], t0: ['clean-slate'], t1: ['second-wind', 'second-wind'],
        options: Object.assign({}, TL, { minCreatures: 1, deckSize: 3 }) });
    onBoard(s, 'p0c0', 'p1c0'); toHand(s, 'p0t0');
    s = cast(s);
    for (let n = 0; n < 8 && s.winner == null; n++) s = quietTurn(s);
    assert.equal(fired(s, 'f1'), 1);
    assert.equal(s.winner, 0, 'the side with no creature left anywhere loses');
    assert.equal(s.endReason, 'cannot-act');
    const end = plain(s.fate);
    assert.throws(() => act(s, { type: 'end' }));
    assert.deepEqual(plain(s.fate), end, 'nothing moves once the battle is over');
});

test('the AI reads the public schedule: it casts Clean Slate when behind and delays an enemy wipe when ahead', () => {
    const turnOf = (s, level) => {
        const turn = s.turn;
        while (s.winner == null && s.turn === turn) s = E.applyAction(s, AI.choose(s, { level }));
        return s;
    };
    for (const level of ['normal', 'competent', 'expert']) {
        // Behind: four enemy creatures in play, none of its own.
        let s = setup({ p0: ['lobstorian', 'astrophysicat', 'tremendoodle', 'beastie'], p1: ['kardashiant', 'siuuugull'], t1: ['clean-slate'], options: TL });
        onBoard(s, 'p0c0', 'p0c1', 'p0c2', 'p0c3'); toHand(s, 'p1t0', 'p1c0');
        s = turnOf(act(s, { type: 'end' }), level);
        assert.deepEqual(sched(s).map(e => [e.def, e.controller]), [['clean-slate', 1]], level + ' casts Clean Slate when behind');
        // Ahead, with the enemy's wipe due at the end of this round: Nostalgia (2 rounds later) saves its board.
        const ahead = wipe => {
            let t = setup({ p0: ['kardashiant'], p1: ['lobstorian', 'astrophysicat', 'tremendoodle', 'beastie', 'siuuugull'], t0: [wipe ? 'clean-slate' : 'second-wind'], t1: ['nostalgia'], options: TL });
            onBoard(t, 'p1c0', 'p1c1', 'p1c2', 'p1c3'); toHand(t, 'p0t0', 'p1t0', 'p1c4');
            t.players[0].hearts = t.players[0].maxHearts = 30;
            t = act(t, { type: 'play', cid: 'p0t0' });
            t = act(t, { type: 'end' }); t = act(t, { type: 'draw', choice: 'deck' }); t = act(t, { type: 'end' });
            t = act(t, { type: 'draw', choice: 'deck' }); t = act(t, { type: 'end' });
            return turnOf(t, level);
        };
        const delayed = ahead(true);
        assert.ok(delayed.players[1].discard.includes('p1t0'), level + ' plays Nostalgia to delay the wipe');
        assert.deepEqual([sched(delayed)[0].state, sched(delayed)[0].rounds], ['pending', 2]);
        assert.ok(!ahead(false).players[1].discard.includes('p1t0'), level + ' keeps Nostalgia when nothing threatens its board');
    }
    // The schedule is public, so the AI's view of it is complete.
    let v = arena(); v = cast(v);
    assert.deepEqual(plain(E.informationState(v, 1).fate.queue), plain(v.fate.queue));
});

test('model readiness (#120): a marked repeatable space fires on each entry, again on a rewind landing, and expires by real rounds', () => {
    Rift.data.tactics['test-echo'] = { id: 'test-echo', name: 'Test Echo', cost: 1, text: 'Test: a repeatable +1/+1 space.', run() {},
        scheduled: { delay: 1, repeat: true, lifetime: 3, summary: 'Your creatures get +1/+1.',
            resolve(api, ev) { api.s.players[ev.controller].board.forEach(cid => api.buff(cid, 1, 1, 'Echo ' + ev.id)); },
            expire(api, ev) { Object.values(api.s.cards).forEach(c => { if (c.kind === 'creature') c.buffs = c.buffs.filter(b => b.label !== 'Echo ' + ev.id); }); } } };
    let s = setup({ p0: ['kardashiant', 'muskrat'], p1: ['lobstorian'], t0: ['test-echo', 'clockwork'], options: Object.assign({}, TL, { fateStart: 9 }) });
    onBoard(s, 'p0c0'); toHand(s, 'p0t0', 'p0t1');
    s = cast(s);
    assert.deepEqual([sched(s)[0].repeat, sched(s)[0].expiresRound], [true, 3]);
    s = act(s, { type: 'end' }); s = quietTurn(s);                       // round 1 ends: entry 1
    assert.equal(sched(s)[0].fires, 1);
    assert.equal(E.attackOf(s, 'p0c0'), 2);
    s = quietTurn(s); s = quietTurn(s);                                  // round 2 ends: space 2 (empty)
    s = act(s, { type: 'draw', choice: 'deck' });
    s = act(s, { type: 'play', cid: 'p0t1' }); s = act(s, { type: 'choose', choice: 'rewind' });   // lands on space 1
    assert.equal(sched(s)[0].fires, 2, 'a rewind landing on a live repeatable space fires it again');
    assert.equal(E.attackOf(s, 'p0c0'), 3);
    s = quietTurn(s); s = quietTurn(s);                                  // round 3 ends: lifetime used up
    assert.equal(sched(s)[0].state, 'expired');
    assert.ok(s.lastEvents.some(e => e.t === 'fate-expire'));
    assert.equal(E.attackOf(s, 'p0c0'), 1, 'its buffs end with it');
    onBoard(s, 'p0c1');
    s.players[0].energy = 10;
    s = act(s, { type: 'draw', choice: 'deck' });
    s = act(s, { type: 'activate', cid: 'p0c1', ability: 'next-year' });   // back past it again
    for (let n = 0; n < 6; n++) s = quietTurn(s);
    assert.equal(sched(s)[0].fires, 2, 'rewinding never extends a lifetime');
    delete Rift.data.tactics['test-echo'];
});

test('Clean Slate is bench and test only: no grant list, starter, deck or reward names it, and the game never loads the bench', () => {
    const decks = Rift.data.tacticDecks;
    const lists = [decks.starter, decks.earned, decks.starterPack].concat(Object.values(decks.colour));
    assert.ok(lists.every(list => !list.includes('clean-slate')));
    for (const file of fs.readdirSync(path.join(GAME_DIR, 'data'))) {
        if (file === 'tactics.js' || !file.endsWith('.js')) continue;
        assert.ok(!fs.readFileSync(path.join(GAME_DIR, 'data', file), 'utf8').includes('clean-slate'), 'data/' + file + ' must not grant Clean Slate');
    }
    assert.ok(!Rift.State.ownedTactics(Rift.State.freshState()).includes('clean-slate'));
    assert.ok(!fs.readFileSync(path.join(GAME_DIR, 'index.html'), 'utf8').includes('fate-bench'));
    assert.ok(fs.readFileSync(path.join(GAME_DIR, 'dev', 'battle.html'), 'utf8').includes('dev/fate-bench.js'));
});
