/* #158 real-time catch games on a fixed 60-tick clock.
 *   net   – Pocket Nets: creature portraits bounce; growing walls fence off the field.
 *   burst – Shard Burst: a big rift shard splits into smaller creature shards; clear them all.
 * A board is JSON plus an input log. Replaying the log is the only authority, so the
 * screen, the test players and the save always agree. No DOM, clocks or bag changes here. */
(function (root) {
    'use strict';
    const Rift = root.Rift, HZ = 60, COLS = 12, ROWS = 9, W = 12, H = 9;
    const TIERS = ['common', 'uncommon', 'rare', 'legendary'];
    const tier = r => Math.max(0, TIERS.indexOf(r));
    const clone = v => JSON.parse(JSON.stringify(v));

    // Tuning by rarity (common → legendary). See design/reviews/catch-arcade-158-*.md.
    const NET = {
        balls: [2, 3, 4, 5], speed: [2.95, 2.55, 2.4, 2.3], goal: [0.8, 0.8, 0.8, 0.8],
        lives: 3, seconds: 60, grow: 4.5, terrain: [3, 4, 4, 5],
        pen: 6, // a pocket this small holds its creature: it counts as closed
    };
    const BURST = {
        big: [1, 2, 2, 3], medium: [1, 0, 1, 0], pace: [2.8, 2.42, 2.18, 2.02],
        shields: 4, seconds: 35, radius: [0, 0.42, 0.72, 1.1], speed: [0, 2.0, 1.5, 1.0],
        dart: 9, dartLife: 50, darts: 1, cool: 12, turret: 0.6, // one net in the air: aim beats spraying
    };
    const HELP = { lives: 1, seconds: 10 };

    // ---------------------------------------------------------------- Pocket Nets
    const at = (x, y) => y * COLS + x;
    const R = 0.42;
    function solidCell(s, x, y) {
        if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return true;
        const v = s.grid[at(x, y)];
        return v === 1 || v === 2;
    }
    function armRect(w, arm) {
        const lo = arm.d < 0 ? 0.5 - arm.len : 0, hi = arm.d < 0 ? 1 : 0.5 + arm.len;
        return w.o === 0 ? [w.x + lo, w.y, w.x + hi, w.y + 1] : [w.x, w.y + lo, w.x + 1, w.y + hi];
    }
    const overlaps = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
    function breakArm(s, arm) {
        arm.st = 'broken';
        if (s.brokeAt !== s.t) { s.lives--; s.breaks++; s.brokeAt = s.t; }
    }
    // A growing wall is solid to bounce off, and breaks where a creature touches it.
    function blocked(s, x, y) {
        const x0 = x - R, y0 = y - R, x1 = x + R, y1 = y + R;
        for (let cy = Math.floor(y0); cy < y1; cy++)
            for (let cx = Math.floor(x0); cx < x1; cx++) if (solidCell(s, cx, cy)) return true;
        let hit = false;
        const w = s.wall;
        if (w) for (const arm of w.arms) {
            if (arm.st !== 'grow') continue;
            const lo = arm.d < 0 ? 0.5 - arm.len : 0, hi = arm.d < 0 ? 1 : 0.5 + arm.len;
            const touch = w.o === 0 ? x0 < w.x + hi && x1 > w.x + lo && y0 < w.y + 1 && y1 > w.y
                : x0 < w.x + 1 && x1 > w.x && y0 < w.y + hi && y1 > w.y + lo;
            if (touch) { breakArm(s, arm); hit = true; }
        }
        return hit;
    }
    // In a one-square lane there is no room to move sideways. Hold the lane's centre line
    // instead of bouncing between its walls several times a second, which reads as jitter.
    function lane(s, b, axis) {
        const along = axis ? b.x : b.y, across = Math.floor(axis ? b.y : b.x);
        for (let k = Math.floor(along - R); k < along + R; k++) {
            if (axis ? !solidCell(s, k, across - 1) || !solidCell(s, k, across + 1) : !solidCell(s, across - 1, k) || !solidCell(s, across + 1, k)) return false;
        }
        return true;
    }
    function moveBall(s, b) {
        if (lane(s, b, 0)) b.x = Math.floor(b.x) + 0.5;
        else { const nx = b.x + b.vx; if (blocked(s, nx, b.y)) b.vx = -b.vx; else b.x = nx; }
        if (lane(s, b, 1)) b.y = Math.floor(b.y) + 0.5;
        else { const ny = b.y + b.vy; if (blocked(s, b.x, ny)) b.vy = -b.vy; else b.y = ny; }
    }
    function reach(s, w, d) {
        let k = 1;
        while (!solidCell(s, w.o === 0 ? w.x + d * k : w.x, w.o === 0 ? w.y : w.y + d * k)) k++;
        return k - 0.5;
    }
    // Closed regions: no creature → netted (2); a creature in a tiny pocket → penned (3).
    function settle(s) {
        const region = new Array(COLS * ROWS).fill(-1), sizes = [], holders = [];
        for (let c = 0; c < COLS * ROWS; c++) {
            if (s.grid[c] !== 0 || region[c] >= 0) continue;
            const id = sizes.length, queue = [c];
            region[c] = id; let n = 0;
            while (queue.length) {
                const cell = queue.pop(), x = cell % COLS, y = Math.floor(cell / COLS); n++;
                [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
                    const nx = x + dx, ny = y + dy, nc = at(nx, ny);
                    if (nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS && s.grid[nc] === 0 && region[nc] < 0) { region[nc] = id; queue.push(nc); }
                });
            }
            sizes.push(n); holders.push(0);
        }
        s.balls.forEach(b => { const id = region[at(Math.floor(b.x), Math.floor(b.y))]; if (id >= 0) holders[id]++; });
        let closed = 0;
        for (let c = 0; c < COLS * ROWS; c++) {
            const id = region[c];
            if (id >= 0 && !holders[id]) s.grid[c] = 2;
            // Each extra creature in a pocket gets three more squares, so crowded pockets still pen.
            else if (id >= 0 && sizes[id] <= NET.pen + 3 * (holders[id] - 1)) s.grid[c] = 3;
            if (s.grid[c] === 2 || s.grid[c] === 3) closed++;
        }
        s.fill = closed / s.open;
        if (s.fill >= s.goal - 1e-9) s.done = 'caught';
    }
    function growWall(s) {
        const w = s.wall;
        w.arms.forEach(arm => { if (arm.st === 'grow') arm.len = Math.min(arm.len + NET.grow / HZ, reach(s, w, arm.d)); });
        s.balls.forEach(b => {
            const box = [b.x - R, b.y - R, b.x + R, b.y + R];
            w.arms.forEach(arm => { if (arm.st === 'grow' && overlaps(box, armRect(w, arm))) breakArm(s, arm); });
        });
        let closed = false;
        w.arms.forEach(arm => {
            if (arm.st !== 'grow' || arm.len < reach(s, w, arm.d)) return;
            arm.st = 'done'; closed = true;
            for (let k = 0; k <= arm.len; k++) s.grid[w.o === 0 ? at(w.x + arm.d * k, w.y) : at(w.x, w.y + arm.d * k)] = 2;
        });
        if (closed) { s.walls++; settle(s); }
        if (w.arms.every(arm => arm.st !== 'grow')) s.wall = null;
    }
    function netStart(board) {
        const grid = new Array(COLS * ROWS).fill(0);
        board.terrain.forEach(c => { grid[c] = 1; });
        return { kind: 'net', t: 0, grid, balls: clone(board.balls), wall: null, lives: board.cfg.lives,
            limit: board.cfg.seconds * HZ, open: COLS * ROWS - board.terrain.length, goal: board.cfg.goal,
            fill: 0, done: null, breaks: 0, walls: 0, brokeAt: -1 };
    }
    function netTick(s) {
        s.t++;
        s.balls.forEach(b => moveBall(s, b));
        if (s.wall) growWall(s);
        if (s.done) return;
        if (s.lives <= 0) s.done = 'escaped';
        else if (s.t >= s.limit) s.done = 'escaped';
    }
    function canWall(s, x, y, o) {
        if (s.done || s.wall || ![0, 1].includes(o) || !Number.isInteger(x) || !Number.isInteger(y)) return false;
        if (x < 0 || y < 0 || x >= COLS || y >= ROWS || s.grid[at(x, y)] !== 0) return false;
        // Never start a net on top of a creature; the screen shows the cell as blocked.
        return !s.balls.some(b => overlaps([b.x - R, b.y - R, b.x + R, b.y + R], [x, y, x + 1, y + 1]));
    }
    function netInput(s, a) {
        if (!Array.isArray(a.wall) || !canWall(s, a.wall[0], a.wall[1], a.wall[2])) return false;
        s.wall = { x: a.wall[0], y: a.wall[1], o: a.wall[2], arms: [{ d: -1, len: 0.5, st: 'grow' }, { d: 1, len: 0.5, st: 'grow' }] };
        return true;
    }
    // What a net here would do if it finished: its cells, the ground it closes and any pens.
    function preview(s, x, y, o) {
        if (!canWall(s, x, y, o)) return null;
        const w = { x, y, o }, left = reach(s, w, -1), right = reach(s, w, 1), span = [];
        for (let k = -Math.round(left - 0.5); k <= Math.round(right - 0.5); k++) span.push(o === 0 ? at(x + k, y) : at(x, y + k));
        const trial = { grid: s.grid.slice(), balls: s.balls, open: s.open, goal: s.goal, fill: s.fill, done: null };
        span.forEach(c => { trial.grid[c] = 2; });
        settle(trial);
        const closes = [], pens = [];
        trial.grid.forEach((v, c) => {
            if (s.grid[c] !== 0 || span.includes(c)) return;
            if (v === 2) closes.push(c); else if (v === 3) pens.push(c);
        });
        return { span, closes, pens, fill: trial.fill, wins: trial.done === 'caught', grow: Math.max(left, right) / NET.grow };
    }
    function netBoard(seed, level) {
        const rng = Rift.makeRng(seed);
        const grid = new Array(COLS * ROWS).fill(0), terrain = [];
        const shapes = [[[0, 0]], [[0, 0], [1, 0]], [[0, 0], [0, 1]], [[0, 0], [1, 0], [0, 1]], [[0, 0], [1, 0], [1, 1]]];
        for (let i = 0, tries = 0; i < NET.terrain[level] && tries < 60; tries++) {
            const shape = rng.pick(shapes), x = rng.int(1, COLS - 3), y = rng.int(1, ROWS - 3);
            const cells = shape.map(([dx, dy]) => at(x + dx, y + dy));
            if (cells.some(c => grid[c])) continue;
            cells.forEach(c => { grid[c] = 1; terrain.push(c); });
            i++;
        }
        const open = grid.map((v, c) => v ? -1 : c).filter(c => c >= 0);
        // All open ground must be one connected field.
        const seen = new Set([open[0]]), queue = [open[0]];
        while (queue.length) {
            const c = queue.pop(), x = c % COLS, y = Math.floor(c / COLS);
            [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
                const nx = x + dx, ny = y + dy, nc = at(nx, ny);
                if (nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS && !grid[nc] && !seen.has(nc)) { seen.add(nc); queue.push(nc); }
            });
        }
        if (seen.size !== open.length) return null;
        const balls = [], speed = NET.speed[level] / HZ;
        for (const c of rng.shuffle(open)) {
            if (balls.length >= NET.balls[level]) break;
            const x = c % COLS + 0.5, y = Math.floor(c / COLS) + 0.5;
            if (balls.some(b => Math.abs(b.x - x) + Math.abs(b.y - y) < 3)) continue;
            balls.push({ x, y, vx: rng.chance(0.5) ? speed : -speed, vy: rng.chance(0.5) ? speed : -speed });
        }
        if (balls.length < NET.balls[level]) return null;
        return { kind: 'net', cols: COLS, rows: ROWS, terrain: terrain.sort((a, b) => a - b), balls,
            cfg: { lives: NET.lives, seconds: NET.seconds, goal: NET.goal[level] } };
    }

    // ---------------------------------------------------------------- Shard Burst
    const CX = W / 2, CY = H / 2;
    function wrapDelta(d, size) { return d - size * Math.round(d / size); }
    function wrapDist(ax, ay, bx, by) { return Math.hypot(wrapDelta(ax - bx, W), wrapDelta(ay - by, H)); }
    const wrapPos = (v, size) => ((v % size) + size) % size;
    function burstStart(board) {
        return { kind: 'burst', t: 0, seed: board.seed, shards: clone(board.shards), darts: [], shields: board.cfg.shields,
            inv: 0, cool: 0, limit: board.cfg.seconds * HZ, pace: board.cfg.pace, done: null, popped: 0,
            total: board.shards.reduce((n, sh) => n + (2 ** sh.s - 1), 0), splits: 0, hits: 0, shots: 0, nextId: board.shards.length };
    }
    function burstTick(s) {
        s.t++;
        if (s.cool > 0) s.cool--;
        if (s.inv > 0) s.inv--;
        s.shards.forEach(sh => { sh.x = wrapPos(sh.x + sh.vx, W); sh.y = wrapPos(sh.y + sh.vy, H); });
        s.darts.forEach(d => { d.x = wrapPos(d.x + d.vx, W); d.y = wrapPos(d.y + d.vy, H); d.ttl--; });
        s.darts = s.darts.filter(d => {
            if (d.ttl <= 0) return false;
            const i = s.shards.findIndex(sh => wrapDist(d.x, d.y, sh.x, sh.y) < BURST.radius[sh.s] + 0.1);
            if (i < 0) return true;
            const sh = s.shards[i];
            s.shards.splice(i, 1); s.hits++;
            if (sh.s > 1) {
                const rng = Rift.makeRng(s.seed + ':split:' + s.splits++), base = Math.atan2(sh.vy, sh.vx), spread = 0.5 + rng.next() * 0.5;
                const speed = BURST.speed[sh.s - 1] * s.pace / HZ;
                [-1, 1].forEach(side => s.shards.push({ id: s.nextId++, s: sh.s - 1, x: sh.x, y: sh.y,
                    vx: Math.cos(base + side * spread) * speed, vy: Math.sin(base + side * spread) * speed }));
            } else s.popped++;
            return false;
        });
        if (!s.inv) {
            const sh = s.shards.find(sh => wrapDist(sh.x, sh.y, CX, CY) < BURST.radius[sh.s] + BURST.turret);
            if (sh) {
                s.shields--; s.inv = HZ;
                const dx = wrapDelta(sh.x - CX, W), dy = wrapDelta(sh.y - CY, H), d = Math.hypot(dx, dy) || 1, v = Math.hypot(sh.vx, sh.vy);
                sh.vx = dx / d * v; sh.vy = dy / d * v;
            }
        }
        if (!s.shards.length) s.done = 'caught';
        else if (s.shields <= 0 || s.t >= s.limit) s.done = 'escaped';
    }
    function canFire(s) { return !s.done && !s.cool && s.darts.length < BURST.darts; }
    function burstInput(s, a) {
        if (typeof a.fire !== 'number' || !Number.isFinite(a.fire) || !canFire(s)) return false;
        const cos = Math.cos(a.fire), sin = Math.sin(a.fire), v = BURST.dart / HZ;
        s.darts.push({ x: CX + cos * BURST.turret, y: CY + sin * BURST.turret, vx: cos * v, vy: sin * v, ttl: BURST.dartLife });
        s.cool = BURST.cool; s.shots++;
        return true;
    }
    function burstBoard(seed, level) {
        const rng = Rift.makeRng(seed), shards = [];
        const sizes = Array(BURST.big[level]).fill(3).concat(Array(BURST.medium[level]).fill(2));
        sizes.forEach((size, i) => {
            const ring = (i / sizes.length + rng.next() * 0.2) * Math.PI * 2, far = 3.6 + rng.next() * 0.6;
            const x = wrapPos(CX + Math.cos(ring) * far * 1.25, W), y = wrapPos(CY + Math.sin(ring) * far * 0.85, H);
            // Drift across the field, never straight at the lantern.
            const toward = Math.atan2(CY - y, CX - x), heading = toward + (rng.chance(0.5) ? 1 : -1) * (0.7 + rng.next() * 1.6);
            const v = BURST.speed[size] * BURST.pace[level] / HZ;
            shards.push({ id: i, s: size, x, y, vx: Math.cos(heading) * v, vy: Math.sin(heading) * v });
        });
        return { kind: 'burst', w: W, h: H, seed: String(seed), shards,
            cfg: { shields: BURST.shields, seconds: BURST.seconds, pace: BURST.pace[level] } };
    }

    // ---------------------------------------------------------------- shared clock
    function start(board) { return board.kind === 'net' ? netStart(board) : burstStart(board); }
    function tick(s) { if (!s.done) (s.kind === 'net' ? netTick : burstTick)(s); }
    function input(s, a) { return !!a && !s.done && (s.kind === 'net' ? netInput(s, a) : burstInput(s, a)); }
    // State after `until` ticks, with every logged input applied at its own tick.
    function replay(board, until) {
        const s = start(board), log = board.log || [], end = until == null ? board.tick : until;
        let i = 0;
        for (;;) {
            while (i < log.length && log[i].t === s.t) input(s, log[i++]);
            if (s.t >= end || s.done) return s;
            tick(s);
        }
    }
    // One saved action: an input at tick t, or a plain checkpoint { t } that records time
    // passing (a broken net, a lost shield, the end). Inputs after the end are refused.
    function step(board, action) {
        if (!board || board.done || !action || !Number.isInteger(action.t) || action.t < board.tick) return null;
        const limit = board.cfg.seconds * HZ;
        if (action.t > limit) return null;
        const s = replay(board, action.t), entry = { t: action.t };
        if (action.wall) entry.wall = action.wall.slice(0, 3);
        else if (action.fire != null) entry.fire = action.fire;
        const isInput = entry.wall || entry.fire != null;
        if (isInput) {
            if (s.done || s.t !== action.t || !input(s, entry)) return null;
        }
        const b = clone(board);
        b.tick = s.done ? s.t : action.t;
        if (isInput) b.log.push(entry);
        b.done = s.done || null;
        b.lives = s.kind === 'net' ? s.lives : s.shields;
        return { board: b, state: s };
    }

    // ---------------------------------------------------------------- players
    // Skilled player: tests every visible option against the exact clock. Used to admit
    // boards (a certificate that the layout can be won) and as the upper reference.
    function netSkilled(s) {
        if (s.wall || s.t % 10) return null;
        // Biggest promised gain first; the first one the exact clock says is safe wins.
        const options = [];
        for (let c = 0; c < COLS * ROWS; c++) for (const o of [0, 1]) {
            const view = s.grid[c] === 0 && preview(s, c % COLS, Math.floor(c / COLS), o);
            if (view && view.fill > s.fill) options.push({ gain: view.fill, wall: [c % COLS, Math.floor(c / COLS), o] });
        }
        options.sort((a, b) => b.gain - a.gain);
        for (const option of options.slice(0, 12)) {
            const trial = clone(s);
            netInput(trial, { wall: option.wall });
            while (trial.wall && !trial.done) tick(trial);
            if (trial.breaks === s.breaks && trial.fill > s.fill) return { wall: option.wall };
        }
        return null;
    }
    function burstLead(s, sh) {
        const v = BURST.dart / HZ;
        let dx = wrapDelta(sh.x - CX, W), dy = wrapDelta(sh.y - CY, H), t = 0;
        for (let i = 0; i < 4; i++) {
            t = Math.max(0, Math.hypot(dx + sh.vx * t, dy + sh.vy * t) - BURST.turret) / v;
            dx = wrapDelta(sh.x + sh.vx * t - CX, W); dy = wrapDelta(sh.y + sh.vy * t - CY, H);
        }
        return Math.atan2(dy, dx);
    }
    function burstSkilled(s) {
        if (!canFire(s) || !s.shards.length) return null;
        const target = s.shards.slice().sort((a, b) => wrapDist(a.x, a.y, CX, CY) - BURST.radius[a.s] - (wrapDist(b.x, b.y, CX, CY) - BURST.radius[b.s]))[0];
        return { fire: Math.round(burstLead(s, target) * 1000) / 1000 };
    }
    // Average sensible player (#158 tuning). Sees what the screen shows, judges motion
    // roughly, reacts late, and sometimes misses its cell or aim. Seeded per run.
    function netAverage(rng, p) {
        p = Object.assign({ look: [36, 90], react: [10, 20], slip: 0.2, misjudge: 0.25, margin: 0.3, spots: 6 }, p || {});
        let plan = null, wait = rng.int(p.look[0], p.look[1]);
        return function (s) {
            if (s.wall) { plan = null; wait = rng.int(p.look[0], p.look[1]); return null; }
            if (plan) {
                if (s.t < plan.at) return null;
                const a = plan; plan = null; wait = rng.int(p.look[0], p.look[1]);
                return canWall(s, a.wall[0], a.wall[1], a.wall[2]) ? { wall: a.wall } : null;
            }
            if (wait-- > 0) return null;
            // Look for a cut that closes off empty ground and that no creature seems to be heading for.
            // A person weighs a handful of spots, not every cell.
            let best = null;
            const open = [];
            for (let c = 0; c < COLS * ROWS; c++) if (s.grid[c] === 0) open.push(c);
            for (let n = 0; n < p.spots; n++) {
                const c = rng.pick(open), o = rng.int(0, 1), x = c % COLS, y = Math.floor(c / COLS);
                const view = preview(s, x, y, o);
                if (!view) continue;
                const w = { x, y, o }, left = reach(s, w, -1), right = reach(s, w, 1), grow = view.grow;
                const band = o === 0 ? [x + 0.5 - left - R, y - R, x + 0.5 + right + R, y + 1 + R] : [x - R, y + 0.5 - left - R, x + 1 + R, y + 0.5 + right + R];
                const risky = s.balls.some(b => {
                    const seen = (1 + (rng.next() * 2 - 1) * p.misjudge) * HZ * (grow + p.margin);
                    for (let k = 0; k <= 8; k++) {
                        const px = b.x + b.vx * seen * k / 8, py = b.y + b.vy * seen * k / 8;
                        if (px > band[0] && px < band[2] && py > band[1] && py < band[3]) return true;
                    }
                    return false;
                });
                if (risky) continue;
                const gain = view.fill - s.fill + rng.next() * 0.04;
                if (gain > 0.03 && (!best || gain > best.gain)) best = { gain, wall: [x, y, o] };
            }
            if (!best) { wait = rng.int(6, 14); return null; }
            const wall = best.wall.slice();
            if (rng.chance(p.slip)) { const d = rng.chance(0.5) ? 1 : -1; if (wall[2] === 0) wall[1] += d; else wall[0] += d; }
            plan = { wall, at: s.t + rng.int(p.react[0], p.react[1]) };
            return null;
        };
    }
    // Shard Burst is played by holding the pointer down: throws leave as fast as the
    // reload allows, toward a pointer that trails the chosen shard by a quarter second.
    function burstAverage(rng, p) {
        p = Object.assign({ retarget: [24, 54], settle: [6, 14], lag: 15, noise: 0.1, lead: 0.4, focus: 0.75 }, p || {});
        let target = null, until = 0, ready = 0, offset = 0, lead = 0;
        const gauss = () => (rng.next() + rng.next() + rng.next() - 1.5) / 0.5;
        return function (s) {
            if (!s.shards.length) return null;
            let sh = s.shards.find(x => x.id === target);
            if (!sh || s.t >= until) {
                const near = s.shards.slice().sort((a, b) => wrapDist(a.x, a.y, CX, CY) - wrapDist(b.x, b.y, CX, CY));
                sh = rng.chance(p.focus) ? near[0] : rng.pick(near);
                target = sh.id; until = s.t + rng.int(p.retarget[0], p.retarget[1]);
                ready = s.t + rng.int(p.settle[0], p.settle[1]);
                offset = gauss() * p.noise; lead = p.lead * rng.next() * 2;
            }
            if (s.t < ready || !canFire(s)) return null;
            const px = sh.x - sh.vx * p.lag, py = sh.y - sh.vy * p.lag;
            const direct = Math.atan2(wrapDelta(py - CY, H), wrapDelta(px - CX, W));
            const led = wrapDelta(burstLead(s, sh) - direct, Math.PI * 2) * lead;
            return { fire: Math.round((direct + led + offset + gauss() * 0.03) * 1000) / 1000 };
        };
    }
    // Drives a board with a player function to the end; returns the saved actions.
    function play(board, player, maxTicks) {
        const s = start(board), log = [];
        const end = maxTicks || board.cfg.seconds * HZ;
        while (!s.done && s.t < end) {
            const a = player(s);
            if (a && input(s, a)) log.push(Object.assign({ t: s.t }, a));
            tick(s);
        }
        return { done: s.done, t: s.t, log, state: s };
    }
    const skilled = kind => kind === 'net' ? netSkilled : burstSkilled;
    const average = (kind, seed, p) => (kind === 'net' ? netAverage : burstAverage)(Rift.makeRng('average:' + seed), p);

    // ---------------------------------------------------------------- boards
    const admitted = new Map();
    // Every served board is won by the skilled player without help; assistance then adds
    // net lives/shields and time to the same layout, which can never undo a win.
    function create(kind, seed, rarity, help) {
        const level = tier(rarity), key = kind + '|' + seed + '|' + level;
        let base = admitted.get(key);
        for (let attempt = 0; !base && attempt < 24; attempt++) {
            const b = (kind === 'net' ? netBoard : burstBoard)(seed + ':' + kind + ':' + attempt, level);
            if (!b) continue;
            Object.assign(b, { log: [], tick: 0, done: null, level });
            const run = play(b, skilled(kind));
            if (run.done === 'caught') { base = b; base.proof = run.log.length; }
        }
        if (!base) throw new Error('No verified ' + kind + ' layout');
        if (admitted.size > 400) admitted.clear();
        admitted.set(key, base);
        const b = clone(base), h = Math.max(0, help | 0);
        if (kind === 'net') b.cfg.lives += HELP.lives * h; else b.cfg.shields += HELP.lives * h;
        b.cfg.seconds += HELP.seconds * h;
        b.help = h;
        b.lives = kind === 'net' ? b.cfg.lives : b.cfg.shields;
        return b;
    }
    // A replayable win: the skilled player's inputs, then the closing checkpoint.
    function solve(board) {
        if (board.done) return board.done === 'caught' ? [] : null;
        const s = replay(board), skill = skilled(board.kind), log = [];
        while (!s.done && s.t < board.cfg.seconds * HZ) {
            const a = skill(s);
            if (a && input(s, a)) log.push(Object.assign({ t: s.t }, a));
            tick(s);
        }
        return s.done === 'caught' ? log.concat({ t: s.t }) : null;
    }
    Rift.CatchArcade = { HZ, COLS, ROWS, W, H, CX, CY, NET, BURST, HELP, KINDS: ['net', 'burst'], RARITIES: TIERS,
        create, start, tick, input, replay, step, solve, play, skilled, average, canWall, canFire, preview, wrapDist };
})(typeof window !== 'undefined' ? window : globalThis);
