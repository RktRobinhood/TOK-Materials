// Environmental Fate events (#128; design/drafts/card-arena-2026-10-12/ENVIRONMENTAL-FATE.md): an encounter's
// public, fixed events on the Fate track. Syllo's Drill Whistle (gentle, both players) and the Feed's Trending
// (boss, its strongest creature). A leap skips an occurrence for good; a recurring plan puts a NEW occurrence
// (its own id) on the track; a rewind never brings a skipped or fired one back.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Rift, E, AI, setup, act, onBoard, toHand, plain } from './battle-helpers.mjs';

const TL = { timeline: true, fateStart: 9, fateGap: 3 };
const WHISTLE = [{ def: 'drill-whistle', first: 4, every: 4, side: null }];
const TREND = [{ def: 'trending', first: 2, every: 2, side: 1 }];
const sched = s => plain(E.fateSchedule(s));
const byId = (s, id) => sched(s).find(e => e.id === id);
const envs = s => sched(s).filter(e => e.env);
const log = (s, t) => E.fullLog(s).filter(e => e.t === t);
function draw(s) {
    const legal = E.legalActions(s).filter(a => a.type === 'draw');
    return act(s, legal.find(a => a.choice === 'deck') || legal[0]);
}
function quietTurn(s) {
    if (s.phase === 'draw') s = draw(s);
    return act(s, { type: 'end' });
}
// Both players pass until `rounds` round ends have happened.
function rounds(s, n) {
    const target = s.fate.pos + n;
    while (s.fate.pos < target && s.winner == null) s = quietTurn(s);
    return s;
}
function fresh(s) { s.players[s.active].energy = 10; s.players[s.active].playsThisTurn = 0; return s; }
const play = (s, cid, extra) => act(fresh(s), Object.assign({ type: 'play', cid }, extra || {}));

test('an encounter puts its environmental events on the track at the start, in public, owned by nobody', () => {
    const s = setup({ p0: ['beastie'], p1: ['lobstorian'], t0: ['clean-slate', 'clean-slate'], options: TL, environment: WHISTLE.concat(TREND) });
    const list = envs(s);
    assert.deepEqual(list.map(e => [e.id, e.def, e.env, e.controller, e.side, e.state, e.spaces, e.occurrence, e.every]),
        [['f1', 'drill-whistle', true, null, null, 'pending', 4, 1, 4], ['f2', 'trending', true, null, 1, 'pending', 2, 1, 2]]);
    assert.equal(list[0].source, 'Sergeant Syllo');
    assert.equal(list[1].summary, 'B\'s creature with the most attack gets +1 attack until the end of its next turn.');
    const starts = s.lastEvents.filter(e => e.t === 'fate-schedule' && e.env);
    assert.equal(starts.length, 2);
    assert.ok(starts.every(e => e.privateTo == null && e.player === null), 'public, from no player');
    assert.match(starts[0].text, /^Environmental: Sergeant Syllo's Drill Whistle in 4 rounds: both players get \+1 energy/);
    // Environmental events use nobody's limit of live scheduled spells.
    assert.equal(E.canSchedule(s, 0), true);
    assert.equal(E.canSchedule(s, 1), true);
    // A plan for an unknown event, or a battle without a Fate track, adds nothing.
    assert.equal(envs(setup({ options: TL, environment: [{ def: 'no-such-event', first: 2 }] })).length, 0);
    assert.equal(sched(setup({ options: { timeline: false }, environment: WHISTLE })).length, 0);
});

for (const first of [0, 1]) {
    test('Drill Whistle at the end of round 4 gives both players +1 energy on their next turn (player ' + first + ' first)', () => {
        let s = setup({ p0: ['beastie'], p1: ['lobstorian'], options: Object.assign({}, TL, { first }), energy: 2, main: false, environment: WHISTLE });
        s = rounds(s, 3);
        const before = s.players.map(P => P.capacity);
        s = rounds(s, 1);                                   // the round-4 end: Fate enters space 4
        assert.equal(byId(s, 'f1').state, 'fired');
        assert.equal(log(s, 'fate-event').filter(e => e.id === 'f1').length, 1);
        // The player who goes first in round 5 has its turn now; the other has the extra energy waiting.
        const a = s.active;
        assert.equal(s.players[a].energy, s.players[a].capacity + 1);
        assert.equal(s.players[a].capacity, Math.min(10, before[a] + 1));
        assert.equal(s.players[1 - a].nextEnergy, 1);
        s = quietTurn(s);
        assert.equal(s.players[1 - a].energy, s.players[1 - a].capacity + 1, 'the second player gets it on its next turn too');
        assert.equal(s.players[1 - a].nextEnergy, 0, 'once, then gone');
        s = quietTurn(s); s = draw(s);
        assert.equal(s.players[s.active].energy, s.players[s.active].capacity, 'only that one turn');
    });
}

test('a recurring plan puts a NEW occurrence on after each one: its own id, every n spaces on', () => {
    let s = setup({ p0: ['beastie'], p1: ['lobstorian'], options: TL, main: false, environment: WHISTLE });
    s = rounds(s, 4);
    const list = envs(s);
    assert.deepEqual(list.map(e => [e.id, e.state, e.occurrence, e.spaces]), [['f1', 'fired', 1, 0], ['f2', 'pending', 2, 4]]);
    assert.match(s.lastEvents.find(e => e.t === 'fate-schedule' && e.env).text, /^It comes back: Sergeant Syllo's Drill Whistle in 4 rounds/);
    s = rounds(s, 4);
    assert.deepEqual(envs(s).map(e => [e.id, e.state, e.occurrence]), [['f1', 'fired', 1], ['f2', 'fired', 2], ['f3', 'pending', 3]]);
    // `times` stops a plan after that many occurrences.
    let t = setup({ p0: ['beastie'], p1: ['lobstorian'], options: TL, main: false, environment: [{ def: 'drill-whistle', first: 1, every: 1, times: 2 }] });
    t = rounds(t, 4);
    assert.deepEqual(envs(t).map(e => [e.occurrence, e.state]), [[1, 'fired'], [2, 'fired']]);
});

test('a leap past an environmental occurrence skips it for good; a rewind never brings it back', () => {
    let s = setup({ p0: ['kardashiant'], p1: ['lobstorian', 'beastie'], t0: ['leap-ahead', 'nostalgia'], options: TL, main: false, environment: TREND });
    onBoard(s, 'p0c0', 'p1c0', 'p1c1'); toHand(s, 'p0t0', 'p0t1');
    s = rounds(s, 1);                                       // cursor 1: Trending (space 2) is 1 round away
    s = draw(s);
    assert.equal(s.active, 0);
    s = play(s, 'p0t0');                                    // Leap Ahead: 1 → 3, over space 2
    const leap = s.lastEvents.find(e => e.t === 'fate-leap');
    assert.deepEqual(plain(leap.skipped), ['f1']);
    const skip = s.lastEvents.find(e => e.t === 'fate-skip');
    assert.equal(skip.env, true);
    assert.equal(skip.text, 'The Trending is skipped. It will not happen.');
    assert.equal(byId(s, 'f1').state, 'skipped');
    assert.equal(byId(s, 'f1').reason, 'leap');
    // The next occurrence is a new record, 2 spaces after the skipped one (space 4), never on the landing space.
    const next = envs(s).find(e => e.occurrence === 2);
    assert.deepEqual([next.id, next.state, next.spaces, s.fate.pos], ['f2', 'pending', 1, 3]);
    assert.ok(!log(s, 'fate-event').length, 'nothing trended');
    // Nostalgia rewinds 2 spaces, onto space 1: the skipped occurrence on space 2 stays skipped.
    s = play(s, 'p0t1');
    assert.equal(s.fate.pos, 1);
    assert.equal(byId(s, 'f1').state, 'skipped');
    s = rounds(s, 1);                                       // the cursor walks onto space 2 again
    assert.equal(s.fate.pos, 2);
    assert.equal(byId(s, 'f1').state, 'skipped');
    assert.ok(!log(s, 'fate-event').some(e => e.id === 'f1'), 'a skipped occurrence never happens');
    assert.ok(!s.players[1].board.some(cid => s.cards[cid].buffs.length), 'no creature trended');
    s = rounds(s, 2);                                       // space 4: the second occurrence happens
    assert.equal(byId(s, 'f2').state, 'fired');
});

test('a rewind after an occurrence happened does not repeat it: the next one is just further away', () => {
    let s = setup({ p0: ['kardashiant'], p1: ['lobstorian'], t0: ['nostalgia'], options: TL, main: false, environment: TREND });
    onBoard(s, 'p0c0', 'p1c0'); toHand(s, 'p0t0');
    s = rounds(s, 2);                                       // space 2: Trending happens once
    assert.equal(byId(s, 'f1').state, 'fired');
    assert.equal(envs(s)[1].spaces, 2);
    s = draw(s);
    s = play(s, 'p0t0');                                    // Nostalgia: back 2, onto space 0
    assert.equal(s.fate.pos, 0);
    assert.equal(envs(s)[1].spaces, 4, 'the next occurrence is 4 rounds away now');
    s = rounds(s, 2);                                       // back over space 2
    assert.equal(log(s, 'fate-event').filter(e => e.id === 'f1').length, 1, 'it happened exactly once');
    assert.equal(envs(s).length, 2, 'no extra occurrence was made');
});

test('Trending boosts the Feed\'s creature with the most attack (leftmost on a tie) until the end of its next turn', () => {
    let s = setup({ p0: ['kardashiant'], p1: ['beastie', 'lobstorian', 'astrophysicat'], options: TL, main: false, environment: TREND });
    onBoard(s, 'p0c0', 'p1c0', 'p1c1', 'p1c2');
    const atk = cid => E.attackOf(s, cid);
    const top = Math.max(...s.players[1].board.map(atk));
    const want = s.players[1].board.find(cid => atk(cid) === top);
    const pre = E.fateEventPreview(s, 'f1');
    assert.deepEqual(plain(pre.boosted.map(b => [b.cid, b.attack, b.health])), [[want, 1, 0]], 'the preview runs the real effect');
    s = rounds(s, 2);
    assert.equal(E.attackOf(s, want), top + 1);
    assert.match(s.lastEvents.filter(e => e.t === 'tactic').map(e => e.text).join(' '), /^Trending: .+ gets \+1 attack until the end of its next turn\.$/);
    // Fate moved after B's End turn (player 1 closes the round): the boost lasts through B's next turn only.
    s = quietTurn(s);                                       // A's turn
    assert.equal(E.attackOf(s, want), top + 1);
    s = quietTurn(s);                                       // B's turn ends: the boost ends
    assert.equal(E.attackOf(s, want), top, 'gone after its controller\'s next turn');
});

test('Trending with no creature to trend is used up in public and still comes back', () => {
    let s = setup({ p0: ['kardashiant'], p1: ['lobstorian'], options: TL, main: false, environment: TREND });
    s = rounds(s, 2);
    assert.equal(byId(s, 'f1').state, 'fired');
    assert.ok(E.fullLog(s).some(e => e.text === 'Trending: there is no creature to trend.'));
    assert.equal(envs(s)[1].state, 'pending');
    assert.equal(E.fateEventPreview(s, envs(s)[1].id).boosted.length, 0);
});

test('on one space: events resolve in the order they were scheduled, then Fate\'s own rule event', () => {
    // fateStart 2 puts the rule event on space 2 too; Clean Slate (scheduled later) is on space 2 as well.
    let s = setup({ p0: ['kardashiant'], p1: ['lobstorian', 'beastie'], t0: ['clean-slate'], axioms: ['underdog', 'thrift', 'mercy'],
        options: Object.assign({}, TL, { fateStart: 2 }), environment: TREND });
    onBoard(s, 'p0c0', 'p1c0', 'p1c1'); toHand(s, 'p0t0');
    s = play(s, 'p0t0');                                    // Clean Slate on space 2 (seq 2, after Trending's seq 1)
    s = rounds(s, 2);
    const order = E.fullLog(s).filter(e => ['fate-event', 'flip', 'fate-empty', 'reset'].includes(e.t)).map(e => e.t === 'fate-event' ? e.def : 'rule');
    assert.deepEqual(plain(order), ['trending', 'clean-slate', 'rule']);
});

test('the whole state survives a JSON round trip mid-battle and resolves the same way', () => {
    let s = setup({ p0: ['kardashiant', 'beastie'], p1: ['lobstorian', 'beastie'], options: TL, main: false, environment: WHISTLE.concat(TREND) });
    onBoard(s, 'p0c0', 'p1c0', 'p1c1');
    s = rounds(s, 1);
    const copy = JSON.parse(JSON.stringify(s));
    const a = rounds(s, 5), b = rounds(copy, 5);
    assert.deepEqual(plain(sched(a)), plain(sched(b)));
    assert.deepEqual(plain(a.players.map(P => [P.energy, P.nextEnergy, P.hearts])), plain(b.players.map(P => [P.energy, P.nextEnergy, P.hearts])));
    // Applying the same action twice to the same state gives the same single firing (the engine is pure).
    const c = rounds(copy, 1);
    assert.deepEqual(plain(sched(c)), plain(sched(rounds(copy, 1))));
});

test('the AI reads environmental events through the public schedule and finishes a boss match', () => {
    const team = (pre, list) => list.map((sp, i) => ({ uid: pre + i, species: sp, powerDelta: 0, injuries: [], scars: [], warped: null, trophyOf: null }));
    const make = () => E.createBattle({
        seed: 'env-ai', environment: TREND,
        players: [{ name: 'You', team: team('a', ['beastie', 'eelish', 'lobstorian', 'kardashiant', 'beastie', 'eelish', 'lobstorian', 'kardashiant']) },
            { name: 'The Feed\'s Champion', team: team('b', ['muskrat', 'altmanta', 'zuckerborg', 'tremendoodle', 'muskrat', 'altmanta', 'zuckerborg', 'tremendoodle']) }],
    });
    const end = AI.playOut(make(), ['competent', 'expert']);
    assert.notEqual(E.winner(end), null);
    assert.ok(log(end, 'fate-event').some(e => e.def === 'trending'), 'Trending happened in the match');
    assert.deepEqual(plain(E.fullLog(AI.playOut(make(), ['competent', 'expert'])).map(e => e.text)), plain(E.fullLog(end).map(e => e.text)), 'deterministic');
});

test('encounter data: the Feed\'s Champion trends every 2 rounds at Expert and every 3 below; other battles have none', async () => {
    const { loadRift } = await import('./harness.mjs');
    const { Node } = await import('./dom-adapter.mjs');
    const R = loadRift(['js/core/rift.js', 'js/core/state.js', 'js/core/world.js', 'data/creatures.js', 'data/items.js', 'data/map.js', 'data/decks.js', 'data/starters.js',
        'data/axioms.js', 'data/tactics.js', 'data/script/lesson1.js', 'js/battle/abilities.js', 'js/battle/engine.js', 'js/battle/ai.js', 'js/battle/lesson.js', 'js/ui/battles.js']);
    const state = R.State.freshState(); state.avatar = { type: 'owlet', nickname: 'Test' }; R.State.grantStarter(state);
    R.State.get = () => state; R.State.update = fn => fn(state); R.el = (...a) => new Node(...a);
    const routes = [];
    R.Assets = { img: () => new Node() }; R.Dialogue = { has: () => false };
    R.UI = { toast() {}, modal: (title, body, buttons) => ({ title, body, buttons }) };
    R.Router = { go: (screen, params) => routes.push({ screen, params }), replace() {} };
    assert.deepEqual(plain(R.Battles.trainerSide('feed').fate), [{ def: 'trending', first: 2, every: 2, times: null, side: 1 }]);
    assert.deepEqual(plain(R.Battles.trainerSide('feed', 'competent').fate), [{ def: 'trending', first: 3, every: 3, times: null, side: 1 }]);
    Object.keys(R.data.trainers).filter(id => id !== 'feed').forEach(id => assert.deepEqual(plain(R.Battles.trainerSide(id).fate), [], id + ' has no environmental events yet'));
    // Every planned event exists.
    Object.values(R.data.trainers).forEach(t => (t.fate || []).forEach(x => assert.ok(R.data.environments[x.def], x.def)));
    // Syllo's practice match brings the gentle Drill Whistle, for both players.
    R.Battles.story();
    const p = routes.at(-1).params;
    assert.deepEqual(plain(p.environment), [{ def: 'drill-whistle', first: 4, every: 4, times: null, side: null }]);
    const s = R.Battle.Engine.createBattle({ seed: p.seed, players: [p.player, p.opponent], axiomDeck: p.axiomDeck, environment: p.environment, options: { ...p.battleOptions, mode: p.mode } });
    assert.equal(R.Battle.Engine.fateSchedule(s).filter(e => e.env).length, 1);
    // The beginner match stays winnable for a careful player with the whistle in it.
    assert.equal(R.Battle.Engine.winner(R.Battle.AI.playOut(s, ['hard', p.opponent.ai])), 0);
});
