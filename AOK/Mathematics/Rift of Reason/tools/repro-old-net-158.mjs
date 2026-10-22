// #158 receipt: the teacher's "trapped in 2×3 but can't win" report, on the old turn-based
// Pocket Nets (removed after commit c180d1c). Loads that engine from git history; changes nothing.
//   node tools/repro-old-net-158.mjs [seeds=300]
import vm from 'node:vm';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { GAME_DIR } from './test/harness.mjs';
const OLD = 'c180d1c', base = 'AOK/Mathematics/Rift of Reason/';
const ctx = { console, Math, JSON, Object, Array, Error, Set, Map };
ctx.window = ctx; ctx.globalThis = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(GAME_DIR + '/js/core/rift.js', 'utf8'), ctx);
for (const file of ['js/core/catch-net.js', 'js/core/catch-games.js'])
    vm.runInContext(execFileSync('git', ['show', OLD + ':' + base + file], { cwd: GAME_DIR, encoding: 'utf8' }), ctx);
const C = ctx.Rift.CatchGames, N = ctx.Rift.CatchNetPrototype, seeds = Number(process.argv[2] || 300);
const shape = cells => { const xs = cells.map(c => c % 6), ys = cells.map(c => Math.floor(c / 6)), w = Math.max(...xs) - Math.min(...xs) + 1, h = Math.max(...ys) - Math.min(...ys) + 1; return w * h === cells.length ? w + 'x' + h : null; };
let rooms = 0, stuck = 0, example = null;
for (let i = 0; i < seeds; i++) for (const rarity of ['common', 'rare']) {
    let frontier = [C.create('net', 'repro:' + i, rarity, 'charm', false)];
    for (let depth = 0; depth < 2; depth++) {
        const next = [];
        for (const s of frontier) for (const cut of N.available(s)) {
            const r = N.preview(s, cut);
            if (!r || r.hit || r.board.done) continue;
            next.push(r.board);
            if (!['2x3', '3x2'].includes(shape(N.room(r.board)))) continue;
            rooms++;
            if (!N.solve(r.board)) { stuck++; example = example || { seed: 'repro:' + i, rarity, castsLeft: r.board.cfg.casts - r.board.turn, target: r.board.cfg.target }; }
        }
        frontier = next.slice(0, 40);
    }
}
console.log(JSON.stringify({ engine: OLD, rooms2x3: rooms, unwinnable2x3: stuck, example }));
