/* Three short, finite skill games. Every admitted layout has a winning certificate.
 * Pure JSON boards: no clocks, DOM, bag changes or random catch roll here. */
(function (root) {
    'use strict';
    const Rift = root.Rift, net = Rift.CatchNetPrototype;
    const IDS = ['net', 'ricochet', 'tracks'];
    const NAMES = { net: 'Pocket Nets', ricochet: 'Rebound', tracks: 'Trail Finder' };
    const RARITIES = ['common', 'uncommon', 'rare', 'legendary'];
    const clone = b => JSON.parse(JSON.stringify(b));
    const tier = r => Math.max(0, RARITIES.indexOf(r));
    const angles = [[-3, -4], [-2, -4], [-1, -4], [0, -4], [1, -4], [2, -4], [3, -4]];

    // A bank shot travels until it returns to the floor. Bricks disappear on contact;
    // the ball reflects from each brick and the side/top walls, like early paddle games.
    function shot(board, aim) {
        if (!Number.isInteger(aim) || !angles[aim] || board.done) return null;
        const b = clone(board), path = [[3.5, 6.7]];
        let x = 3.5, y = 6.7, dx = angles[aim][0] / 24, dy = angles[aim][1] / 24;
        for (let tick = 0; tick < 1400; tick++) {
            const oldY = y;
            x += dx; y += dy;
            if (x < 0.12 || x > 6.88) { dx = -dx; x = Math.max(0.12, Math.min(6.88, x)); }
            if (y < 0.12) { dy = Math.abs(dy); y = 0.12; }
            const cell = Math.floor(y) * 7 + Math.floor(x);
            const i = b.bricks.indexOf(cell);
            if (i >= 0) {
                b.bricks.splice(i, 1);
                if (Math.floor(oldY) !== Math.floor(y)) dy = -dy;
                else dx = -dx;
            }
            if (tick % 5 === 0) path.push([x, y]);
            if (y >= 6.8 && dy > 0) break;
        }
        b.turn++;
        b.done = !b.bricks.length ? 'caught' : b.turn >= b.shots ? 'escaped' : null;
        return { board: b, path };
    }
    function solveShots(board) {
        const seen = new Set();
        function search(b) {
            if (b.done === 'caught') return [];
            if (b.done) return null;
            const key = b.bricks.join(',') + ':' + b.turn;
            if (seen.has(key)) return null;
            seen.add(key);
            const options = angles.map((_, a) => ({ a, b: shot(b, a).board }))
                .filter(o => o.b.bricks.length < b.bricks.length).sort((a, c) => a.b.bricks.length - c.b.bricks.length);
            for (const o of options) { const tail = search(o.b); if (tail) return [o.a].concat(tail); }
            return null;
        }
        return search(board);
    }
    function rebound(seed, rarity, help) {
        const level = tier(rarity), shots = level < 2 ? 5 - level : 3;
        // Targets are drawn from cells actually reachable by a bank shot. Admission checks
        // the full board, because hitting one target changes the rest of the trajectory.
        const reachable = [7, 8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26];
        for (let attempt = 0; attempt < 128; attempt++) {
            const rng = Rift.makeRng(seed + ':bricks:' + attempt);
            const b = { kind: 'ricochet', bricks: rng.shuffle(reachable).slice(0, 3 + Math.min(3, level)), shots, turn: 0, done: null };
            if (solveShots(b)) { b.shots += help; return b; }
        }
        // An independently checked three-shot pattern; never serve an unchecked fallback.
        const b = { kind: 'ricochet', bricks: [10, 17, 24], shots, turn: 0, done: null };
        if (!solveShots(b)) throw new Error('No verified rebound layout');
        b.shots += help;
        return b;
    }

    function neighbours(b, cell) {
        const list = [], x = cell % b.size, y = Math.floor(cell / b.size);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if ((!dx && !dy) || x + dx < 0 || x + dx >= b.size || y + dy < 0 || y + dy >= b.size) continue;
            list.push((y + dy) * b.size + x + dx);
        }
        return list;
    }
    const clue = (b, cell) => neighbours(b, cell).filter(c => b.traps.includes(c)).length;
    function reveal(b, cell) {
        const queue = [cell];
        while (queue.length) {
            const c = queue.pop();
            if (b.open.includes(c) || b.traps.includes(c)) continue;
            b.open.push(c);
            if (!clue(b, c)) neighbours(b, c).forEach(n => { if (!b.open.includes(n)) queue.push(n); });
        }
    }
    // Only the clues already visible to a player are used. Global trap count and subset
    // differences are legitimate Mines deductions; the solver never peeks at hidden cells.
    function deductions(b, marked) {
        const flags = marked || b.flags, closed = Array.from({ length: b.size ** 2 }, (_, i) => i)
            .filter(c => !b.open.includes(c) && !flags.includes(c));
        const constraints = b.open.map(c => ({ cells: neighbours(b, c).filter(n => closed.includes(n)),
            count: clue(b, c) - neighbours(b, c).filter(n => flags.includes(n)).length }));
        constraints.push({ cells: closed, count: b.traps.length - flags.length });
        const safe = new Set(), traps = new Set();
        function read(cells, count) {
            if (count === 0) cells.forEach(c => safe.add(c));
            if (count === cells.length) cells.forEach(c => traps.add(c));
        }
        constraints.forEach(a => {
            read(a.cells, a.count);
            constraints.forEach(c => {
                if (a !== c && a.cells.length && a.cells.length < c.cells.length && a.cells.every(n => c.cells.includes(n)))
                    read(c.cells.filter(n => !a.cells.includes(n)), c.count - a.count);
            });
        });
        return { safe: Array.from(safe), traps: Array.from(traps) };
    }
    function solveTracks(board) {
        const b = clone(board), actions = [];
        for (let round = 0; round < b.size ** 2; round++) {
            if (b.open.length === b.size ** 2 - b.traps.length) return actions;
            const d = deductions(b);
            if (!d.safe.length && !d.traps.length) return null;
            d.traps.forEach(cell => { if (!b.flags.includes(cell)) { b.flags.push(cell); actions.push({ cell, flag: true }); } });
            d.safe.forEach(cell => { if (!b.open.includes(cell)) { reveal(b, cell); actions.push({ cell }); } });
        }
        return null;
    }
    function tracks(seed, rarity, help) {
        const level = tier(rarity), size = level < 2 ? 4 : 5, count = level === 3 ? 6 : 2 + level;
        for (let attempt = 0; attempt < 512; attempt++) {
            const rng = Rift.makeRng(seed + ':tracks:' + attempt), cells = rng.shuffle(Array.from({ length: size ** 2 }, (_, i) => i));
            const b = { kind: 'tracks', size, traps: cells.slice(0, count), open: [], flags: [], hits: [], mistakes: 0,
                lives: 1, turn: 0, done: null };
            const first = cells.slice(count).find(c => clue(b, c) === 0);
            if (first == null) continue;
            reveal(b, first);
            if (b.open.length < size ** 2 - count && solveTracks(b)) { b.lives += help; return b; }
        }
        throw new Error('No verified trail layout');
    }
    function create(kind, seed, rarity, item, lured, sly) {
        const help = (item === 'greatcharm' ? 1 : 0) + (lured ? 1 : 0) + (sly ? 1 : 0), level = tier(rarity);
        if (kind === 'ricochet') return rebound(seed, rarity, help);
        if (kind === 'tracks') return tracks(seed, rarity, help);
        if (kind !== 'net') throw new Error('Unknown catch game');
        const behaviour = Rift.makeRng(seed + ':net-behaviour').pick(net.BEHAVIOURS);
        // Admit against the same three-cast budget before adding the easier rarity's
        // spare casts. Otherwise easy tiers accidentally admit much harder terrain.
        const b = net.generate(seed, behaviour, item === 'greatcharm', lured,
            { casts: 3, target: behaviour === 'hunter' ? 4 : 3 });
        b.cfg.casts += 3 - level;
        if (sly) b.cfg.casts++;
        b.kind = kind;
        return b;
    }
    function step(board, action) {
        if (!board || board.done || !action) return null;
        if (board.kind === 'net') return net.preview(board, action.cut);
        if (board.kind === 'ricochet') return shot(board, action.aim);
        if (board.kind !== 'tracks' || !Number.isInteger(action.cell) || action.cell < 0 || action.cell >= board.size ** 2 || board.open.includes(action.cell) || (board.hits || []).includes(action.cell)) return null;
        const b = clone(board), cell = action.cell;
        if (action.flag) {
            b.flags = b.flags.includes(cell) ? b.flags.filter(c => c !== cell) : b.flags.concat(cell);
            return { board: b };
        }
        if (b.flags.includes(cell)) return null;
        b.turn++;
        if (b.traps.includes(cell)) {
            b.mistakes++;
            b.hits.push(cell);
            b.flags.push(cell);
            if (b.mistakes >= b.lives) b.done = 'escaped';
        } else reveal(b, cell);
        if (b.open.length === b.size ** 2 - b.traps.length) b.done = 'caught';
        return { board: b, hit: b.traps.includes(cell), cell };
    }
    function solve(b) {
        if (b.kind === 'net') { const plan = net.solve(b); return plan && plan.map(cut => ({ cut })); }
        if (b.kind === 'ricochet') { const plan = solveShots(b); return plan && plan.map(aim => ({ aim })); }
        return solveTracks(b);
    }
    const pick = seed => Rift.makeRng(String(seed) + ':game').pick(IDS);
    Rift.CatchGames = { IDS, NAMES, RARITIES, pick, create, step, solve, clue, neighbours, deductions, angles };
})(typeof window !== 'undefined' ? window : globalThis);
