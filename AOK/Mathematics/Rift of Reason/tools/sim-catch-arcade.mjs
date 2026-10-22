// #158 win-rate evidence for the two real-time catch games (Pocket Nets, Shard Burst).
// Machine players only: the documented average sensible player (js/core/catch-arcade.js),
// plus random play. Not a claim about classroom success.
//   node tools/sim-catch-arcade.mjs [boards per rarity=200] [report.json]
import fs from 'node:fs';
import { loadRift } from './test/harness.mjs';
const R = loadRift(['js/core/rift.js', 'js/core/catch-arcade.js']);
const A = R.CatchArcade, count = Number(process.argv[2] || 200), rows = [];
function random(rng) {
    return s => (s.t % (s.kind === 'net' ? 60 : 12)) ? null : s.kind === 'burst' ? { fire: rng.next() * Math.PI * 2 }
        : { wall: [rng.int(0, A.COLS - 1), rng.int(0, A.ROWS - 1), rng.int(0, 1)] };
}
// Calm step mode: the field moves only in half-second steps and shows each mover's exact next
// second. This player acts once per step, reads that forecast, weighs six spots (nets) or the
// nearest shard (throws), and still slips a cell 10% of the time or aims about 3° off.
const STEP = 30, clone = v => JSON.parse(JSON.stringify(v));
function forecast(s) { const f = clone(s), out = []; for (let i = 0; i < A.HZ && !f.done; i++) { A.tick(f); out.push(clone(f.kind === 'net' ? f.balls : f.shards)); } return out; }
function calmPlayer(kind, rng) {
    return s => {
        if (s.t % STEP) return null;
        if (kind === 'burst') {
            if (!A.canFire(s) || !s.shards.length) return null;
            const ahead = forecast(s), near = s.shards.slice().sort((a, b) => A.wrapDist(a.x, a.y, A.CX, A.CY) - A.wrapDist(b.x, b.y, A.CX, A.CY))[0];
            // Aim where the dotted path says the shard will be when the net arrives.
            const later = (ahead[Math.min(ahead.length - 1, Math.round(A.wrapDist(near.x, near.y, A.CX, A.CY) / A.BURST.dart * A.HZ))] || []).find(x => x.id === near.id) || near;
            return { fire: Math.atan2(later.y - A.CY, later.x - A.CX) + (rng.next() - 0.5) * 0.1 };
        }
        if (s.wall) return null;
        const ahead = forecast(s), open = [];
        for (let c = 0; c < A.COLS * A.ROWS; c++) if (s.grid[c] === 0) open.push(c);
        let best = null;
        for (let n = 0; n < 6; n++) {
            const c = rng.pick(open), o = rng.int(0, 1), view = A.preview(s, c % A.COLS, Math.floor(c / A.COLS), o);
            if (!view || view.fill <= s.fill) continue;
            const ticks = Math.min(ahead.length, Math.ceil(view.grow * A.HZ) + 6);
            const hit = ahead.slice(0, ticks).some(balls => balls.some(b => view.span.some(cell => Math.abs(cell % A.COLS + 0.5 - b.x) < 0.95 && Math.abs(Math.floor(cell / A.COLS) + 0.5 - b.y) < 0.95)));
            if (!hit && (!best || view.fill > best.fill)) best = { fill: view.fill, wall: [c % A.COLS, Math.floor(c / A.COLS), o] };
        }
        if (!best) return null;
        const wall = best.wall.slice();
        if (rng.chance(0.1)) { if (wall[2] === 0) wall[1] += rng.chance(0.5) ? 1 : -1; else wall[0] += rng.chance(0.5) ? 1 : -1; }
        return { wall };
    };
}
const median = list => { const a = list.slice().sort((x, y) => x - y); return a.length ? +a[a.length >> 1].toFixed(1) : null; };
for (const kind of A.KINDS) for (const rarity of A.RARITIES) {
    const row = { kind, rarity, boards: count, certified: 0, average: 0, help1: 0, help2: 0, calm: 0, random: 0, timeouts: 0, winSeconds: [], lossSeconds: [] };
    for (let i = 0; i < count; i++) {
        const seed = 'arcade-held-out:2210:' + i, board = A.create(kind, seed, rarity, 0);
        let proof = board;
        for (const action of A.solve(board)) proof = A.step(proof, action).board;
        row.certified += Number(proof.done === 'caught');
        const run = A.play(board, A.average(kind, seed));
        if (run.done === 'caught') { row.average++; row.winSeconds.push(run.t / A.HZ); }
        else { row.lossSeconds.push(run.t / A.HZ); if ((kind === 'net' ? run.state.lives : run.state.shields) > 0) row.timeouts++; }
        const one = A.play(A.create(kind, seed, rarity, 1), A.average(kind, seed)).done === 'caught';
        if (run.done === 'caught' && !one) throw new Error('Help undid a win: ' + seed);
        row.help1 += Number(one);
        row.help2 += Number(A.play(A.create(kind, seed, rarity, 2), A.average(kind, seed)).done === 'caught');
        row.random += Number(A.play(board, random(R.makeRng('random:' + seed))).done === 'caught');
        row.calm += Number(A.play(board, calmPlayer(kind, R.makeRng('calm:' + seed))).done === 'caught');
    }
    row.medianWinSeconds = median(row.winSeconds); row.medianLossSeconds = median(row.lossSeconds);
    delete row.winSeconds; delete row.lossSeconds;
    for (const k of ['average', 'help1', 'help2', 'calm', 'random']) row[k] = +(row[k] / count * 100).toFixed(1);
    rows.push(row);
}
const report = { boardsPerRarity: count, seedPrefix: 'arcade-held-out:2210:', settings: { NET: A.NET, BURST: A.BURST, HELP: A.HELP },
    players: {
        average: 'Pocket Nets: looks 0.6–1.5 s between nets, weighs six random spots, skips spots a creature seems to head for (speed misjudged up to 25%), reacts in 0.17–0.33 s, slips one cell 20% of the time. Shard Burst: holds the pointer down, picks the nearest shard 75% of the time (else a random one), pointer trails it by 0.25 s, about 6° aim error, half a lead, 0.1–0.23 s to re-aim.',
        calm: 'Calm step mode: acts once per half-second step, reads the exact one-second ghost path, weighs six spots (nets) or leads the nearest shard (throws), slips a cell 10% of the time or aims about 3° off. No reaction delay.',
        random: 'Pocket Nets: a random spot and direction once a second. Shard Burst: a random direction five times a second.',
        skilled: 'Admission only: tests options against the exact clock; every served board has its replayed win.' },
    limitations: 'Machine players. They do not establish classroom success, timing or enjoyment.', rows };
// Keep any other evidence already in the report (for example the old-engine repro).
if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify(Object.assign(fs.existsSync(process.argv[3]) ? JSON.parse(fs.readFileSync(process.argv[3], 'utf8')) : {}, report), null, 2) + '\n');
console.table(rows);
