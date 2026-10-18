// #158 prototype evidence. A deterministic one-action policy is not a student measurement.
import fs from 'node:fs';
import { loadRift } from './test/harness.mjs';
const C = loadRift(['js/core/rift.js', 'js/core/catch-net.js']).CatchNetPrototype;
const runs = Number(process.argv.find(a => a.startsWith('--runs='))?.split('=')[1] || 1000);
if (!Number.isInteger(runs) || runs < 1 || runs > 10000) throw new Error('Use --runs=1..10000');
const interval = (wins, n) => {
    const p = wins / n, z = 1.96, den = 1 + z * z / n;
    const center = (p + z * z / (2 * n)) / den;
    const half = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / den;
    return [center - half, center + half];
};
const result = { date: '2026-10-18', rules: 1, runsPerBehaviour: runs, seedPattern: 'held-out-catch-158:0..' + (runs - 1),
    policy: 'one-action-v1: reject illegal cuts, prefer a safe cast, then smallest resulting room; seed-fixed candidate order breaks ties; no future search',
    limitation: 'Bot success is not student success, timing or fun. Layout admission uses a perfect solver; the baseline does not.', behaviours: {} };
for (const behaviour of C.BEHAVIOURS) {
    let wins = 0, great = 0, lure = 0, both = 0, fallback = 0, solverWins = 0;
    for (let seed = 0; seed < runs; seed++) {
        const board = C.generate('held-out-catch-158:' + seed, behaviour);
        if (board.seed === 'verified-fallback') fallback++;
        let replay = board;
        for (const cut of C.solve(board)) replay = C.preview(replay, cut).board;
        if (replay.done !== 'caught') throw new Error('Invalid admission certificate');
        solverWins++;
        const won = C.playSensible(board);
        wins += won;
        // Admission is identical for assistance: reuse the certified terrain rather
        // than repeating its search three times. Only the visible cast budget changes.
        const helped = [[true, false], [false, true], [true, true]].map(([great, lure]) =>
            C.playSensible(Object.assign({}, board, { cfg: C.config(behaviour, great, lure) })));
        if (won && helped.some(v => !v)) throw new Error('An assisted paired seed lost a baseline win');
        great += helped[0]; lure += helped[1]; both += helped[2];
    }
    result.behaviours[behaviour] = { target: C.config(behaviour).target, casts: 3, wins, rate: wins / runs, wilson95: interval(wins, runs),
        greatCharmWins: great, lureWins: lure, bothWins: both, pairedAssistanceWorsened: 0, solverWins, fallback };
    console.log(behaviour, JSON.stringify(result.behaviours[behaviour]));
}
const total = Object.values(result.behaviours).reduce((sum, b) => sum + b.wins, 0);
result.equalMixRate = total / (runs * C.BEHAVIOURS.length);
const output = process.argv.find(a => a.startsWith('--output='))?.slice(9);
if (output) fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
console.log('Equal-behaviour mix:', result.equalMixRate);
