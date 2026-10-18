/* #158 prototype only. Finite, deterministic net cuts; no saves, items or catch rolls. */
(function (root) {
    'use strict';
    const Rift = root.Rift, N = 6, DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
    const BEHAVIOURS = ['steady', 'turner', 'hunter'];
    function config(behaviour, great, lure) {
        return { behaviour, casts: 3 + (great ? 1 : 0) + (lure ? 1 : 0), target: behaviour === 'hunter' ? 4 : 3, ticks: 3 };
    }
    function neighbour(cell, dir) {
        const x = cell % N + DX[dir], y = Math.floor(cell / N) + DY[dir];
        return x < 0 || y < 0 || x >= N || y >= N ? -1 : y * N + x;
    }
    function crossing(a, b) {
        if (Math.floor(a / N) === Math.floor(b / N)) return Math.min(a % N, b % N);
        return 5 + Math.min(Math.floor(a / N), Math.floor(b / N));
    }
    function moves(board, cell) {
        return [0, 1, 2, 3].map(dir => ({ dir, cell: neighbour(cell, dir) }))
            .filter(m => m.cell >= 0 && !board.rocks.includes(m.cell) && !(board.mask & (1 << crossing(cell, m.cell))));
    }
    function room(board) {
        const seen = new Set([board.cell]), queue = [board.cell];
        while (queue.length) {
            const cell = queue.shift();
            moves(board, cell).forEach(m => { if (!seen.has(m.cell)) { seen.add(m.cell); queue.push(m.cell); } });
        }
        return Array.from(seen);
    }
    function available(board) {
        const region = room(board), cuts = new Set();
        region.forEach(cell => moves(board, cell).forEach(m => cuts.add(crossing(cell, m.cell))));
        return board.order.filter(cut => cuts.has(cut));
    }
    function preview(board, cut) {
        if (board.done || !available(board).includes(cut)) return null;
        return resolve(board, cut);
    }
    function resolve(board, cut) {
        const next = Object.assign({}, board, { turn: board.turn + 1 });
        const path = [board.cell];
        let hit = false;
        for (let tick = 0; tick < board.cfg.ticks; tick++) {
            const legal = moves(next, next.cell);
            if (!legal.length) break;
            let dir = next.dir;
            if (board.cfg.behaviour === 'turner' && next.phase % 3 === 2) dir = (dir + 1) % 4;
            // The hunter lunges at an adjacent unfinished net at the start of a cast.
            const attack = board.cfg.behaviour === 'hunter' && tick === 0 && legal.find(m => crossing(next.cell, m.cell) === cut);
            const chosen = attack || [dir, (dir + 1) % 4, (dir + 3) % 4, (dir + 2) % 4]
                .map(d => legal.find(m => m.dir === d)).find(Boolean);
            const previous = next.cell;
            next.cell = chosen.cell; next.dir = chosen.dir; next.phase++;
            path.push(next.cell);
            if (crossing(previous, next.cell) === cut) { hit = true; break; }
        }
        if (!hit) next.mask |= 1 << cut;
        const area = room(next).length;
        next.done = area <= next.cfg.target ? 'caught' : next.turn >= next.cfg.casts ? 'escaped' : null;
        return { board: next, path, hit, area, cut };
    }
    // The baseline sees exactly the selected-cut previews shown by the UI, not future moves.
    function sensible(board) {
        const options = available(board).map(cut => resolve(board, cut));
        options.sort((a, b) => Number(a.hit) - Number(b.hit) || a.area - b.area);
        return options.length ? options[0].cut : null;
    }
    function solve(board) {
        const seen = new Set();
        function visit(s) {
            if (s.done === 'caught') return [];
            if (s.done || s.turn >= s.cfg.casts) return null;
            const key = [s.mask, s.cell, s.dir, s.phase % 3, s.turn].join(':');
            if (seen.has(key)) return null;
            seen.add(key);
            const choices = available(s).map(cut => resolve(s, cut));
            choices.sort((a, b) => Number(a.hit) - Number(b.hit) || a.area - b.area);
            for (const result of choices) {
                const tail = visit(result.board);
                if (tail) return [result.cut].concat(tail);
            }
            return null;
        }
        return visit(board);
    }
    function candidate(seed, behaviour, attempt) {
        const rng = Rift.makeRng(seed + ':' + behaviour + ':' + attempt);
        const cells = rng.shuffle(Array.from({ length: N * N }, (_, i) => i));
        return { seed, attempt, cfg: config(behaviour), rocks: cells.slice(0, 7), cell: cells[7],
            dir: rng.int(0, 3), phase: rng.int(0, 2), mask: 0, turn: 0, done: null,
            order: rng.shuffle(Array.from({ length: 10 }, (_, i) => i)) };
    }
    const fallbacks = {};
    function generate(seed, behaviour, great, lure) {
        if (!BEHAVIOURS.includes(behaviour)) throw new Error('Unknown catch behaviour');
        let board = null;
        // Admission uses the unassisted budget, so assistance changes the same layout only.
        for (let attempt = 0; attempt < 32; attempt++) {
            const s = candidate(String(seed), behaviour, attempt);
            if (room(s).length >= 20 && solve(s)) { board = s; break; }
        }
        if (!board) {
            if (!fallbacks[behaviour]) {
                for (let attempt = 0; attempt < 256; attempt++) {
                    const s = candidate('verified-fallback', behaviour, attempt);
                    if (room(s).length >= 20 && solve(s)) { fallbacks[behaviour] = s; break; }
                }
            }
            board = fallbacks[behaviour];
        }
        if (!board) throw new Error('No verified catch layout available');
        return Object.assign({}, board, { cfg: config(behaviour, great, lure), rocks: board.rocks.slice(), order: board.order.slice() });
    }
    function playSensible(board) {
        let next = board;
        while (!next.done) {
            const cut = sensible(next);
            if (cut == null) return false;
            next = preview(next, cut).board;
        }
        return next.done === 'caught';
    }
    Rift.CatchNetPrototype = { N, BEHAVIOURS, config, room, available, preview, sensible, solve, generate, playSensible };
})(typeof window !== 'undefined' ? window : globalThis);
