import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';
const R = loadRift(['js/core/rift.js', 'js/core/catch-arcade.js', 'js/core/catch-games.js']);
const A = R.CatchArcade, C = R.CatchGames, json = v => JSON.stringify(v);
const at = (x, y) => y * A.COLS + x;
const v = 2.6 / A.HZ;

// A 2×3 pocket in the top-left corner with one doorway at (0,3): rocks at x=2 (rows 0–2) and (1,3).
function pocketBoard(balls) {
    return { kind: 'net', cols: A.COLS, rows: A.ROWS, terrain: [at(2, 0), at(2, 1), at(2, 2), at(1, 3)], balls,
        cfg: { lives: 3, seconds: 60, goal: 0.8 }, log: [], tick: 0, done: null, lives: 3 };
}
const inPocket = { x: 1, y: 1.5, vx: v, vy: v }, outside = { x: 6.5, y: 6.5, vx: -v, vy: v };

test("teacher's 2×3 report: a creature closed into a tiny pocket is penned, and the catch stays winnable", () => {
    let b = pocketBoard([inPocket, outside]);
    b = A.step(b, { t: 0, wall: [0, 3, 0] }).board;
    b = A.step(b, { t: 5 }).board;
    assert.equal(b.done, null);
    const s = A.replay(b);
    for (const x of [0, 1]) for (const y of [0, 1, 2]) assert.equal(s.grid[at(x, y)], 3, 'the pocket is a pen, not a dead end');
    assert.ok(s.fill > 0.06, 'the pen counts toward the goal');
    for (let i = 0; i < 1200; i++) {
        A.tick(s);
        assert.ok(s.balls[0].x < 2 && s.balls[0].y < 3, 'the penned creature stays inside');
    }
    // The old turn-based net left 120 of 120 such 2×3 rooms unwinnable (see the #158 report).
    const plan = A.solve(b);
    assert.ok(plan && plan.length, 'good play still has a winning line');
    for (const action of plan) b = A.step(b, action).board;
    assert.equal(b.done, 'caught');
});

test('penning every creature wins at once; nets cannot start on a creature or beside a growing net', () => {
    let b = pocketBoard([inPocket]);
    assert.equal(A.step(b, { t: 0, wall: [1, 1, 0] }), null, 'a net never starts on top of a creature');
    assert.equal(b.log.length, 0);
    b = A.step(b, { t: 0, wall: [0, 3, 0] }).board;
    b = A.step(b, { t: 2 }).board;
    assert.equal(b.done, 'caught');
    assert.equal(b.tick, 1, 'the end is saved at the tick it happened');
    const open = pocketBoard([outside]);
    const growing = A.step(open, { t: 0, wall: [3, 2, 1] }).board;
    assert.equal(A.step(growing, { t: 1, wall: [8, 2, 1] }), null, 'one net at a time');
});

test('a portrait in a one-square lane holds the centre line instead of jittering; crowded pockets still pen', () => {
    const lane = [];
    for (let y = 0; y < A.ROWS; y++) lane.push(at(1, y));
    const s = A.start({ kind: 'net', terrain: lane, balls: [{ x: 0.5, y: 4.5, vx: v, vy: v }], cfg: { lives: 3, seconds: 60, goal: 0.8 } });
    const xs = new Set(), ys = [];
    for (let i = 0; i < 120; i++) { A.tick(s); xs.add(s.balls[0].x); ys.push(s.balls[0].y); }
    assert.equal(json(Array.from(xs)), '[0.5]', 'no sideways bouncing in the lane');
    assert.ok(Math.max(...ys) - Math.min(...ys) > 3, 'it still runs along the lane');
    // Three creatures in a 3×4 pocket (12 squares): 6 + 3 + 3 allows them to be penned.
    let b = { kind: 'net', cols: A.COLS, rows: A.ROWS, terrain: [at(3, 0), at(3, 1), at(3, 2), at(3, 3), at(1, 4), at(2, 4)],
        balls: [{ x: 0.5, y: 0.5, vx: v, vy: v }, { x: 2.5, y: 1.5, vx: -v, vy: v }, { x: 1.5, y: 3.5, vx: v, vy: -v }, { x: 8.5, y: 6.5, vx: v, vy: v }],
        cfg: { lives: 3, seconds: 60, goal: 0.8 }, log: [], tick: 0, done: null, lives: 3 };
    b = A.step(b, { t: 0, wall: [0, 4, 0] }).board;
    b = A.step(b, { t: 3 }).board;
    assert.equal(A.replay(b).grid[at(1, 1)], 3, 'a pocket holding three creatures is penned');
});

test('a broken net costs one net once, and the checkpoint survives replay', () => {
    // A creature heading right meets a net that starts just ahead of it.
    let b = pocketBoard([{ x: 3.5, y: 4.5, vx: v, vy: 0 }]);
    b = A.step(b, { t: 0, wall: [4, 4, 1] }).board;
    b = A.step(b, { t: 20 }).board;
    assert.equal(b.lives, 2, 'both halves broke on one touch: one net lost');
    assert.equal(b.tick, 20);
    assert.equal(A.replay(b).lives, 2);
    assert.equal(A.step(b, { t: 19 }), null, 'time cannot be rewound');
    assert.equal(A.step(b, { t: 10, wall: [8, 2, 0] }), null, 'inputs cannot be backdated');
});

test('replay is the only authority: step, replay and play agree tick for tick', () => {
    for (const kind of A.KINDS) {
        const board = A.create(kind, 'agree', 'rare', 0), run = A.play(board, A.skilled(kind));
        let b = board;
        for (const a of run.log) b = A.step(b, a).board;
        b = A.step(b, { t: run.t }).board;
        assert.equal(b.done, run.done);
        assert.equal(json(A.replay(b, run.t)), json(run.state));
    }
});

test('rarity adds moving creatures; every net field is one connected meadow with terrain', () => {
    const counts = { net: [], burst: [] };
    for (const [level, rarity] of A.RARITIES.entries()) for (let i = 0; i < 8; i++) {
        const net = A.create('net', 'tier:' + i, rarity, 0), burst = A.create('burst', 'tier:' + i, rarity, 0);
        assert.equal(net.balls.length, A.NET.balls[level]);
        assert.ok(net.terrain.length >= 3, 'rocks, trees or water shape every field');
        assert.equal(net.cfg.goal, A.NET.goal[level]);
        const s = A.start(net), seen = new Set(), open = s.grid.map((g, c) => g ? -1 : c).filter(c => c >= 0), queue = [open[0]];
        seen.add(open[0]);
        while (queue.length) {
            const c = queue.pop(), x = c % A.COLS, y = Math.floor(c / A.COLS);
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const n = at(x + dx, y + dy);
                if (x + dx >= 0 && y + dy >= 0 && x + dx < A.COLS && y + dy < A.ROWS && !s.grid[n] && !seen.has(n)) { seen.add(n); queue.push(n); }
            }
        }
        assert.equal(seen.size, open.length);
        counts.net[level] = net.balls.length;
        counts.burst[level] = A.start(burst).total;
    }
    for (let level = 1; level < 4; level++) {
        assert.ok(counts.net[level] > counts.net[level - 1]);
        assert.ok(counts.burst[level] >= counts.burst[level - 1]);
    }
});

test('Shard Burst: big shards split, small ones pop, the lantern loses one shield per hit with a grace second', () => {
    const shard = (s, x, y, vx, vy) => ({ id: 0, s, x, y, vx, vy });
    const board = shards => ({ kind: 'burst', w: A.W, h: A.H, seed: 'unit', shards, cfg: { shields: 4, seconds: 35, pace: 1 }, log: [], tick: 0, done: null });
    let b = A.step(board([shard(1, 8.5, 4.5, 0, 0)]), { t: 0, fire: 0 }).board;
    b = A.step(b, { t: 30 }).board;
    assert.equal(b.done, 'caught');
    let s = A.start(board([shard(3, 9.5, 4.5, 0, 0)]));
    A.input(s, { fire: 0 });
    for (let i = 0; i < 20; i++) A.tick(s);
    assert.equal(json(s.shards.map(x => x.s)), json([2, 2]), 'a big shard becomes two medium ones');
    assert.equal(s.total, 7);
    s = A.start(board([shard(1, 7.8, 4.5, -0.05, 0)]));
    while (s.shields === 4) A.tick(s);
    assert.equal(s.shields, 3);
    assert.ok(s.shards[0].vx > 0, 'the shard bounces away');
    assert.equal(A.canFire(s), true);
    s = A.start(board([shard(1, 11.95, 1, 0.1, 0)]));
    A.tick(s);
    assert.ok(s.shards[0].x < 1, 'shards wrap around the edges');
    s = A.start(board([shard(1, 3, 3, 0, 0)]));
    assert.equal(A.input(s, { fire: 1 }), true);
    assert.equal(A.input(s, { fire: 1 }), false, 'one net in the air at a time');
    for (let i = 0; i < 60; i++) A.tick(s);
    assert.equal(A.input(s, { fire: 1 }), true, 'the next throw is ready once the net lands');
});

// The average sensible player: looks for 0.6–1.5 s, reacts in 0.17–0.33 s, weighs six spots,
// misjudges speed by up to a quarter, slips one cell a fifth of the time. In Shard Burst it holds
// the pointer down, trailing its chosen shard by a quarter second with about 6° of aim error.
// Machine evidence, not students.
test('average sensible player wins about half the time; help clearly improves it', () => {
    const report = {};
    for (const kind of A.KINDS) {
        let wins = 0, helped = 0, total = 0;
        const times = [];
        for (const rarity of A.RARITIES) {
            let rarityWins = 0;
            for (let i = 0; i < 20; i++) {
                const run = A.play(A.create(kind, 'rate:' + i, rarity, 0), A.average(kind, i));
                if (run.done === 'caught') { wins++; rarityWins++; times.push(run.t / A.HZ); }
                if (A.play(A.create(kind, 'rate:' + i, rarity, 1), A.average(kind, i)).done === 'caught') helped++;
                total++;
            }
            assert.ok(rarityWins >= 3 && rarityWins <= 17, `${kind}/${rarity}: ${rarityWins}/20`);
        }
        times.sort((a, b) => a - b);
        report[kind] = { win: wins / total, help: helped / total, median: times[times.length >> 1] };
        assert.ok(report[kind].win >= 0.38 && report[kind].win <= 0.66, json(report));
        assert.ok(report[kind].help >= report[kind].win + 0.08, json(report));
        assert.ok(report[kind].median >= 12 && report[kind].median <= 60, json(report));
    }
});

test('games are chosen from all five, and the old turn-based net is gone', () => {
    assert.deepEqual(Array.from(C.IDS).sort(), ['burst', 'lure', 'net', 'picture', 'tracks']);
    assert.equal(R.CatchNetPrototype, undefined);
    assert.equal(C.NAMES.burst, 'Shard Burst');
    assert.equal(C.NAMES.net, 'Pocket Nets');
});
