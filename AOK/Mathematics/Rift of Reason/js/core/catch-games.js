/* Five short skill games. Every admitted layout has a winning certificate.
 * Pure JSON boards: no clocks, DOM, bag changes or random catch roll here. The two
 * real-time games (net, burst) live in catch-arcade.js; their boards carry an input log. */
(function (root) {
    'use strict';
    const Rift = root.Rift, arcade = Rift.CatchArcade;
    const IDS = ['net', 'lure', 'tracks', 'picture', 'burst'];
    const NAMES = { net: 'Pocket Nets', lure: 'Lantern Lure', tracks: 'Trail Finder', picture: 'Picture Catch', burst: 'Shard Burst' };
    const RARITIES = ['common', 'uncommon', 'rare', 'legendary'];
    const clone = b => JSON.parse(JSON.stringify(b));
    const tier = r => Math.max(0, RARITIES.indexOf(r));

    // The classic eight-piece sliding puzzle. A small reverse breadth-first map
    // gives every generated layout an exact shortest distance, not a shuffle count.
    const PICTURE_GOAL = '123456780';
    let pictureMap, pictureLayers;
    function pictureMoves(b) {
        const gap = b.tiles.indexOf(0), x = gap % 3, y = Math.floor(gap / 3);
        return [y > 0 ? gap - 3 : -1, x < 2 ? gap + 1 : -1, y < 2 ? gap + 3 : -1, x > 0 ? gap - 1 : -1].filter(c => c >= 0);
    }
    function pictureIndex() {
        if (pictureMap) return;
        pictureMap = new Map([[PICTURE_GOAL, { distance: 0 }]]);
        pictureLayers = [[PICTURE_GOAL]];
        for (let distance = 1; distance <= 12; distance++) {
            const layer = [];
            for (const parent of pictureLayers[distance - 1]) {
                const tiles = Array.from(parent, Number), gap = tiles.indexOf(0);
                for (const cell of pictureMoves({ tiles })) {
                    const next = tiles.slice(); [next[gap], next[cell]] = [next[cell], next[gap]];
                    const key = next.join('');
                    if (pictureMap.has(key)) continue;
                    pictureMap.set(key, { distance, parent, cell: gap }); layer.push(key);
                }
            }
            pictureLayers.push(layer);
        }
    }
    function picturePlan(b) {
        if (b.done) return b.done === 'caught' ? [] : null;
        pictureIndex();
        const tiles = b.tiles.slice(), available = b.moves - b.turn;
        function known(key) {
            const plan = [];
            while (key !== PICTURE_GOAL) { const entry = pictureMap.get(key); plan.push({ cell: entry.cell }); key = entry.parent; }
            return plan;
        }
        const start = tiles.join(''), entry = pictureMap.get(start);
        if (entry) return entry.distance <= available ? known(start) : null;
        // Players may move beyond the generation map. Bounded IDA* finds a route
        // using only the visible tiles, and never suggests an over-budget win.
        function estimate() {
            return tiles.reduce((sum, tile, cell) => tile ? sum + Math.abs(cell % 3 - (tile - 1) % 3) + Math.abs(Math.floor(cell / 3) - Math.floor((tile - 1) / 3)) : sum, 0);
        }
        function search(gap, previous, left, seen) {
            const key = tiles.join(''), indexed = pictureMap.get(key);
            if (indexed) return indexed.distance <= left ? known(key) : null;
            if (estimate() > left || (seen.get(key) || -1) >= left) return null;
            seen.set(key, left);
            for (const cell of pictureMoves({ tiles })) {
                if (cell === previous) continue;
                [tiles[gap], tiles[cell]] = [tiles[cell], tiles[gap]];
                const tail = search(cell, gap, left - 1, seen);
                [tiles[gap], tiles[cell]] = [tiles[cell], tiles[gap]];
                if (tail) return [{ cell }].concat(tail);
            }
            return null;
        }
        for (let limit = estimate(); limit <= available; limit += 2) {
            const plan = search(tiles.indexOf(0), -1, limit, new Map());
            if (plan) return plan;
        }
        return null;
    }
    function picture(seed, rarity, help) {
        pictureIndex();
        const level = tier(rarity), distance = 6 + level * 2;
        const key = Rift.makeRng(seed + ':picture').pick(pictureLayers[distance]);
        return { kind: 'picture', size: 3, tiles: Array.from(key, Number), moves: distance + 8 - level + help * 2, turn: 0, done: null };
    }
    function slidePicture(board, cell) {
        if (!Number.isInteger(cell) || !pictureMoves(board).includes(cell)) return null;
        const b = clone(board), gap = b.tiles.indexOf(0);
        [b.tiles[cell], b.tiles[gap]] = [b.tiles[gap], b.tiles[cell]];
        b.turn++;
        b.done = b.tiles.join('') === PICTURE_GOAL ? 'caught' : b.turn >= b.moves ? 'escaped' : null;
        return { board: b, cell };
    }

    // A two-ended trail tile is straight (0) or a corner (1). Directions are
    // north/east/south/west. Every rotation and every connection stays visible.
    const DELTA = [-4, 1, 4, -1];
    function ports(tile) {
        return tile.shape ? [tile.rot, (tile.rot + 1) % 4] : [tile.rot % 2, tile.rot % 2 + 2];
    }
    function nextCell(cell, dir) {
        if (dir === 0 && cell < 4 || dir === 2 && cell >= 12 || dir === 1 && cell % 4 === 3 || dir === 3 && cell % 4 === 0) return -1;
        return cell + DELTA[dir];
    }
    function lightPath(b) {
        const path = []; let cell = 0, entry = 3;
        while (cell >= 0 && !path.includes(cell)) {
            const ends = ports(b.tiles[cell]);
            if (!ends.includes(entry)) break;
            path.push(cell);
            const exit = ends.find(d => d !== entry);
            if (cell === 15 && exit === 1) return { path, connected: true };
            cell = nextCell(cell, exit); entry = (exit + 2) % 4;
        }
        return { path, connected: false };
    }
    // Search simple routes, not the hidden generation recipe. For each route,
    // calculate the fewest clockwise quarter-turns using the visible tile shapes.
    function lurePlan(b) {
        if (b.done) return b.done === 'caught' ? [] : null;
        let best = null;
        function walk(cell, entry, visited, actions) {
            if (best && actions.length >= best.length || actions.length > b.moves - b.turn) return;
            const tile = b.tiles[cell], variants = tile.shape ? 4 : 2;
            for (let turns = 0; turns < variants; turns++) {
                const ends = ports({ shape: tile.shape, rot: (tile.rot + turns) % 4 });
                if (!ends.includes(entry)) continue;
                const exit = ends.find(d => d !== entry), plan = actions.concat(Array.from({ length: turns }, () => ({ cell })));
                if (plan.length > b.moves - b.turn || best && plan.length >= best.length) continue;
                if (cell === 15 && exit === 1) { best = plan; continue; }
                const next = nextCell(cell, exit);
                if (next >= 0 && !visited.includes(next)) walk(next, (exit + 2) % 4, visited.concat(next), plan);
            }
        }
        walk(0, 3, [0], []);
        return best;
    }
    function lantern(seed, rarity, help) {
        const level = tier(rarity), rng = Rift.makeRng(seed + ':lantern');
        // Choose a monotone route, then hide it among random, fully visible pieces.
        const steps = rng.shuffle([1, 1, 1, 2, 2, 2]), path = [0];
        steps.forEach(dir => path.push(path[path.length - 1] + DELTA[dir]));
        const tiles = Array.from({ length: 16 }, () => ({ shape: rng.int(0, 1), rot: rng.int(0, 3) }));
        path.forEach((cell, i) => {
            const entry = i ? (steps[i - 1] + 2) % 4 : 3, exit = i < steps.length ? steps[i] : 1;
            const shape = (entry + 2) % 4 === exit ? 0 : 1;
            const rot = Array.from({ length: shape ? 4 : 2 }, (_, n) => n).find(n => { const p = ports({ shape, rot: n }); return p.includes(entry) && p.includes(exit); });
            tiles[cell] = { shape, rot };
        });
        // One clockwise turn repairs each scrambled route tile. The solver still
        // checks every alternative route, so admission never relies on a recipe.
        rng.shuffle(path).slice(0, 3 + level).forEach(cell => { tiles[cell].rot = (tiles[cell].rot + 3) % 4; });
        const b = { kind: 'lure', size: 4, tiles, moves: 24, turn: 0, done: null };
        // A chance alternative can already be connected. Rotate the entry until
        // it is closed; then re-check instead of serving a pre-won board.
        while (lightPath(b).connected) b.tiles[0].rot = (b.tiles[0].rot + 1) % 4;
        const plan = lurePlan(b);
        if (!plan || !plan.length) throw new Error('No verified lantern route');
        b.moves = plan.length + 3 - level + help;
        return b;
    }
    function turnTrail(board, cell) {
        if (!Number.isInteger(cell) || cell < 0 || cell >= 16 || board.done) return null;
        const b = clone(board);
        b.tiles[cell].rot = (b.tiles[cell].rot + 1) % 4;
        b.turn++;
        const light = lightPath(b);
        b.done = light.connected ? 'caught' : b.turn >= b.moves ? 'escaped' : null;
        return { board: b, path: light.path };
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
        const help = (item === 'greatcharm' ? 1 : 0) + (lured ? 1 : 0) + (sly ? 1 : 0);
        if (kind === 'lure') return lantern(seed, rarity, help);
        if (kind === 'tracks') return tracks(seed, rarity, help);
        if (kind === 'picture') return picture(seed, rarity, help);
        if (arcade.KINDS.includes(kind)) return arcade.create(kind, seed, rarity, help);
        throw new Error('Unknown catch game');
    }
    function step(board, action) {
        if (!board || board.done || !action) return null;
        if (arcade.KINDS.includes(board.kind)) return arcade.step(board, action);
        if (board.kind === 'lure') return turnTrail(board, action.cell);
        if (board.kind === 'picture') return slidePicture(board, action.cell);
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
        if (arcade.KINDS.includes(b.kind)) return arcade.solve(b);
        if (b.kind === 'lure') return lurePlan(b);
        if (b.kind === 'picture') return picturePlan(b);
        return solveTracks(b);
    }
    const pick = seed => Rift.makeRng(String(seed) + ':game').pick(IDS);
    Rift.CatchGames = { IDS, NAMES, RARITIES, pick, create, step, solve, clue, neighbours, deductions, ports, lightPath, pictureMoves };
})(typeof window !== 'undefined' ? window : globalThis);
