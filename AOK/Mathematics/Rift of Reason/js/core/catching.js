/* Short catch challenges. Pure rules shared by the mouse UI and Node tests. */
(function (root) {
    'use strict';
    const Rift = root.Rift;
    function config(item, rarity, lured) {
        const great = item === 'greatcharm';
        const hard = rarity === 'rare' || rarity === 'legendary';
        return {
            seconds: (great ? 24 : 20) + (lured ? 2 : 0),
            placements: (great ? 8 : 6) - (hard ? 1 : 0),
            ring: great ? 1.25 : 1,
            cycle: (hard ? 3.5 : 5) + (lured ? 2 : 0),
        };
    }
    function ringScale(seconds, cfg) { return 1 - (seconds % cfg.cycle) / cfg.cycle * 0.8; }
    function throwBonus(scale, hit) { return !hit ? 0 : scale < 0.4 ? 0.15 : scale < 0.65 ? 0.1 : 0.05; }
    function boxStart(seed) {
        return { creature: 14, charms: [], turn: 0, order: Rift.makeRng(seed).shuffle([0, 1, 2, 3]) };
    }
    function neighbours(cell) {
        const x = cell % 6, y = Math.floor(cell / 6);
        return [y > 0 ? cell - 6 : -1, x < 5 ? cell + 1 : -1, y < 5 ? cell + 6 : -1, x > 0 ? cell - 1 : -1];
    }
    function distance(a, b) { return Math.abs(a % 6 - b % 6) + Math.abs(Math.floor(a / 6) - Math.floor(b / 6)); }
    function boxStep(board, cell, lured) {
        if (!Number.isInteger(cell) || cell < 0 || cell >= 36 || cell === board.creature || board.charms.includes(cell)) return { valid: false };
        const next = { creature: board.creature, charms: board.charms.concat(cell), turn: board.turn + 1, order: board.order.slice() };
        const near = neighbours(next.creature);
        const moves = next.order.map(i => near[i]).filter(x => x >= 0 && !next.charms.includes(x));
        if (!moves.length) return { valid: true, board: next, trapped: true };
        if (!lured || next.turn % 2 === 0) {
            const score = x => Math.min(...next.charms.map(c => distance(x, c)));
            next.creature = moves.reduce((best, x) => score(x) > score(best) ? x : best);
        }
        return { valid: true, board: next, trapped: false };
    }
    Rift.Catching = { config, ringScale, throwBonus, boxStart, boxStep };
})(typeof window !== 'undefined' ? window : globalThis);
