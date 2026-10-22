// #158 evidence for all five catch games: every board's replayed certificate, and win rates for
// the documented average sensible players (Rift.CatchGames.average) and random play.
// Machine players only; not a claim about student success, timing or enjoyment.
//   node tools/sim-catch-games.mjs [boards per game and rarity=200] [report.json]
import fs from 'node:fs';
import { loadRift } from './test/harness.mjs';
const R = loadRift(['js/core/rift.js', 'js/core/catch-arcade.js', 'js/core/catch-games.js']);
const C = R.CatchGames, A = R.CatchArcade, count = Number(process.argv[2] || 200), rows = [];
// Random play: a uniformly chosen legal-looking action, about once a second in real time.
function random(kind, rng) {
    if (kind === 'net') return s => (s.t % 60) ? null : { wall: [rng.int(0, A.COLS - 1), rng.int(0, A.ROWS - 1), rng.int(0, 1)] };
    if (kind === 'burst') return s => (s.t % 12) ? null : { fire: rng.next() * Math.PI * 2 };
    return b => {
        if (b.kind === 'picture') return { cell: rng.pick(C.pictureMoves(b)) };
        if (b.kind === 'lure') return { cell: rng.int(0, 15) };
        return { cell: rng.pick(Array.from({ length: b.size ** 2 }, (_, i) => i).filter(i => !b.open.includes(i) && !b.flags.includes(i))) };
    };
}
for (const kind of C.IDS) for (const rarity of C.RARITIES) {
    const row = { kind, rarity, boards: count, certified: 0, average: 0, help1: 0, help2: 0, random: 0, helpUndidWin: 0 };
    const actions = []; // puzzle actions the average player takes per round (real-time rounds are timed in sim-catch-arcade)
    for (let i = 0; i < count; i++) {
        const seed = 'catch-held-out:2210:' + i, base = C.create(kind, seed, rarity, 'charm', false);
        let proof = base;
        for (const action of C.solve(base)) { if (proof.done) break; proof = C.step(proof, action).board; }
        row.certified += Number(proof.done === 'caught');
        const player = C.average(kind, seed);
        let taken = 0;
        const won = C.playOut(base, b => { taken++; return player(b); }) === 'caught';
        if (!A.KINDS.includes(kind)) actions.push(taken);
        const one = C.playOut(C.create(kind, seed, rarity, 'greatcharm', false), C.average(kind, seed)) === 'caught';
        row.average += Number(won); row.help1 += Number(one);
        row.help2 += Number(C.playOut(C.create(kind, seed, rarity, 'greatcharm', true), C.average(kind, seed)) === 'caught');
        row.random += Number(C.playOut(base, random(kind, R.makeRng('random:' + seed))) === 'caught');
        if (won && !one) row.helpUndidWin++;
    }
    for (const k of ['average', 'help1', 'help2', 'random']) row[k] = +(row[k] / count * 100).toFixed(1);
    if (actions.length) { actions.sort((a, z) => a - z); row.medianActions = actions[actions.length >> 1]; row.maxActions = actions.at(-1); }
    rows.push(row);
}
const report = { boardsPerRow: count, seedPrefix: 'catch-held-out:2210:', tune: C.TUNE,
    players: {
        picture: 'Weighs each slide by how close all pieces would be to home after it and the best next slide, misjudges that by up to 2.5 squares, never undoes its last slide on purpose, and uses any hints at once.',
        lure: 'Re-plans the shortest route from the screen, but 30% of taps are plausible mistakes on or beside the lit trail.',
        tracks: 'Reads one number at a time (all hidden patches are snares, or all snares are flagged so the rest are safe), never combines numbers or counts snares left; when stuck opens the hidden patch touching the fewest numbers; misclicks 3% of safe opens.',
        net: 'See tools/sim-catch-arcade.mjs: looks 0.6–1.5 s, weighs six spots, misjudges speed, reacts in 0.17–0.33 s, slips one cell 20% of the time.',
        burst: 'See tools/sim-catch-arcade.mjs: holds the pointer down, trails the nearest shard by 0.25 s, about 6° aim error.',
        random: 'A random legal-looking action (about once a second in real time).' },
    help: 'help1 = Great Charm; help2 = Great Charm and lure. Real-time help can never undo a win; puzzle help changes the player\'s path (hints), so helpUndidWin is counted, not forbidden.',
    limitations: 'Machine players. They do not establish classroom success, timing or enjoyment.', rows };
if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify(report, null, 2) + '\n');
console.table(rows);
