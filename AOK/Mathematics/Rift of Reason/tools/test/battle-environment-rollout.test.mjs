import test from 'node:test';
import assert from 'node:assert/strict';
import { Rift, E, setup, act, onBoard, toHand, plain, stats } from './battle-helpers.mjs';

const plan = (def, side = null) => [{ def, first: 1, every: 4, side }];
const options = first => ({ timeline: true, fateStart: 9, first, hearts: 40 });
function turn(s) {
    if (s.phase === 'draw') s = act(s, E.legalActions(s).find(a => a.type === 'draw' && a.choice === 'deck') || E.legalActions(s)[0]);
    return act(s, { type: 'end' });
}
function round(s) { const pos = s.fate.pos; do { s = turn(s); } while (s.fate.pos === pos && s.winner == null); return s; }
const envs = s => plain(E.fateSchedule(s)).filter(e => e.env);
const ids = ['roll-call', 'marked-deck', 'late-paperwork', 'oven-timer', 'curfew', 'objection'];

for (const first of [0, 1]) {
    for (const def of ids) test(def + ': both seats, one firing per full round, JSON, skip/rewind and recurrence (first ' + first + ')', () => {
        const side = def === 'marked-deck' ? 1 : ['curfew', 'objection'].includes(def) ? 0 : null;
        let s = setup({ p0: ['beastie', 'lobstorian'], p1: ['beastie', 'lobstorian'], main: false,
            options: options(first), environment: plan(def, side) });
        onBoard(s, 'p0c0', 'p1c0');
        const before = JSON.stringify(s), pre = E.fateEventPreview(s, 'f1');
        assert.ok(pre); assert.equal(JSON.stringify(s), before, 'forecast does not mutate the battle');
        const half = turn(s); assert.equal(envs(half)[0].state, 'pending', 'no event after only one turn');
        const end = turn(half), restored = turn(JSON.parse(JSON.stringify(half)));
        assert.deepEqual(plain(end), plain(restored), 'JSON round trip keeps resolution');
        assert.deepEqual(envs(end).map(e => [e.occurrence, e.state, e.spaces]), [[1, 'fired', 0], [2, 'pending', 4]]);

        // Start with this event two spaces away; Leap Ahead passes it, Nostalgia rewinds across it.
        s = setup({ p0: ['beastie'], p1: ['beastie'], t0: ['leap-ahead', 'nostalgia'],
            options: options(0), environment: [{ def, first: 1, every: 4, side }] });
        toHand(s, 'p0t0', 'p0t1');
        s = act(s, { type: 'play', cid: 'p0t0' });
        assert.equal(envs(s)[0].state, 'skipped');
        s = act(s, { type: 'play', cid: 'p0t1' }); s = round(s);
        assert.equal(envs(s)[0].state, 'skipped');
        assert.equal(envs(s)[1].occurrence, 2);
        assert.ok(!E.fullLog(s).some(e => e.t === 'fate-event' && e.id === 'f1'));
    });

    for (const def of ['curfew', 'objection']) test(def + ': chooses leftmost strongest at resolution and expires after affected turn (first ' + first + ')', () => {
        let s = setup({ p0: ['beastie', 'lobstorian'], p1: ['beastie'], main: false, options: options(first), environment: plan(def, 0) });
        onBoard(s, 'p0c0', 'p0c1', 'p1c0'); stats(s, 'p0c0', 3, 10); stats(s, 'p0c1', 3, 10);
        const pre = E.fateEventPreview(s, 'f1');
        assert.equal((def === 'curfew' ? pre.frozen : pre.boosted)[0].cid, 'p0c0', 'leftmost tie');
        // The forecast is provisional: a different creature becomes strongest before the event fires.
        stats(s, 'p0c1', 4, 10);
        s = round(s);
        assert.equal(s.cards.p0c0.frozen, false);
        if (def === 'curfew') assert.equal(s.cards.p0c1.frozen, true);
        else assert.equal(E.attackOf(s, 'p0c1'), 3);
        if (s.active === 1) s = turn(s);
        assert.equal(s.active, 0);
        if (s.phase === 'draw') s = act(s, E.legalActions(s).find(a => a.type === 'draw'));
        if (def === 'curfew') assert.ok(!E.legalActions(s).some(a => ['attack', 'activate'].includes(a.type) && a.cid === 'p0c1'));
        s = turn(s);
        assert.equal(s.cards.p0c1.frozen, false); assert.equal(E.attackOf(s, 'p0c1'), 4);
    });
}

test('Oven Timer heals only damage on both boards, with the same public forecast and immutable AI projection', () => {
    let s = setup({ p0: ['beastie'], p1: ['lobstorian'], options: options(0), main: false, environment: plan('oven-timer') });
    onBoard(s, 'p0c0', 'p1c0'); s.cards.p0c0.damage = 1; s.cards.p1c0.damage = 1;
    const before = JSON.stringify(s), ev = E.fateSchedule(s)[0];
    const pre = E.fateEventPreview(s, ev.id), projected = Rift.data.environments['oven-timer'].project(s, ev, E.H);
    assert.deepEqual(plain(pre.healed).map(h => [h.cid, h.amount]), [['p0c0', 1], ['p1c0', 1]]);
    assert.equal(projected.cards.p0c0.damage, 0); assert.equal(JSON.stringify(s), before);
    s = round(s); assert.equal(s.cards.p0c0.damage, 0); assert.equal(s.cards.p1c0.damage, 0);
});

for (const mover of [0, 1]) test('Clockwork resolving Curfew during player ' + mover + '\'s turn keeps the freeze through the target\'s next turn', () => {
    let s = setup({ p0: ['astrophysicat'], p1: ['beastie'], t0: ['clockwork'], t1: ['clockwork'],
        options: options(mover), environment: [{ def: 'curfew', first: 1, every: 4, side: 0 }] });
    onBoard(s, 'p0c0', 'p1c0'); toHand(s, 'p' + mover + 't0');
    s = act(s, { type: 'play', cid: 'p' + mover + 't0' });
    s = act(s, { type: 'choose', choice: 'forward' });
    const until = s.turn + (mover === 0 ? 2 : 1);
    assert.equal(s.cards.p0c0.frozenUntil, until);
    assert.equal(envs(s)[0].state, 'fired');
    while (s.turn < until) s = turn(s);
    assert.equal(s.active, 0); assert.equal(s.cards.p0c0.frozen, true);
    s = turn(JSON.parse(JSON.stringify(s)));
    assert.equal(s.cards.p0c0.frozen, false); assert.equal(s.cards.p0c0.frozenUntil, null);
});

for (const def of ['roll-call', 'marked-deck', 'late-paperwork']) test(def + ': draws respect full hands/empty decks; previews and AI never name hidden cards', () => {
    let s = setup({ p0: ['beastie', 'lobstorian'], p1: ['lobstorian', 'beastie'], main: false, options: options(0), environment: plan(def, def === 'marked-deck' ? 1 : null) });
    const ev = E.fateSchedule(s)[0], before = JSON.stringify(s), pre = E.fateEventPreview(s, ev.id);
    assert.deepEqual(plain(pre.drawn), def === 'marked-deck' ? [0, 1] : [1, 1]);
    assert.ok(pre.events.every(e => !e.cid && !e.card), 'private draws omit identity');
    const project = Rift.data.environments[def].project;
    const a = project(s, ev, E.H);
    const swapped = JSON.parse(before); swapped.players.forEach(P => P.deck.reverse());
    const b = project(swapped, ev, E.H);
    assert.deepEqual(plain(a.players.map(P => P.hand)), plain(b.players.map(P => P.hand)), 'unknown hand does not depend on hidden deck order');
    assert.equal(JSON.stringify(s), before);
    s.players.forEach(P => { P.hand = P.deck.splice(0); });
    assert.deepEqual(plain(E.fateEventPreview(s, ev.id).drawn), [0, 0]);
    s.players.forEach(P => { P.deck = P.hand.splice(0); P.axHand = Array(s.options.handLimit).fill('thrift'); });
    assert.deepEqual(plain(E.fateEventPreview(s, ev.id).drawn), [0, 0], 'full hand leaves cards in deck');
});

test('missing targets consume an occurrence without inventing a target and still recur; ended battle freezes events', () => {
    for (const def of ['curfew', 'objection']) {
        let s = setup({ p0: ['beastie'], p1: ['lobstorian'], options: options(0), main: false, environment: plan(def, 0) });
        s = round(s);
        assert.equal(envs(s)[0].state, 'fired'); assert.equal(envs(s)[1].state, 'pending');
        assert.ok(E.fullLog(s).some(e => /there is no creature/.test(e.text)));
        s.winner = 0; const before = JSON.stringify(s);
        assert.equal(E.fateEventPreview(s, envs(s)[1].id), null);
        assert.throws(() => act(s, { type: 'end' }), /Illegal action/);
        assert.equal(JSON.stringify(s), before);
    }
});
