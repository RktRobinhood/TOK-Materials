/*
 * Line Drawer — Imagination / lateral thinking.
 *
 * Two kinds of board, chosen by generate():
 *   mode 'dots'  : cover every dot with at most N straight connected lines,
 *                  never lifting the chalk. Lines may leave the "box".
 *                  (The classic 3×3 nine-dot puzzle is deliberately NOT here:
 *                  the teacher runs that one live in class.)
 *   mode 'graph' : draw a figure in one stroke without retracing a line
 *                  (an Euler path) — or, if the figure has more than two
 *                  odd-degree vertices, prove it is impossible by picking
 *                  exactly the odd vertices.
 *
 * Answers:
 *   { type: 'polyline', points: [[x, y], ...] }   (dots)
 *   { type: 'path', vertices: [i, j, ...] }       (graph)
 *   { type: 'impossible', odd: [i, ...] }         (graph proof)
 *
 * Every dot layout carries a known solution (found with the lattice search
 * below, see tools/test/line-drawer.test.mjs), so only solvable (layout, N)
 * pairs are ever offered.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const SQ3 = Math.sqrt(3);
    const TOL = 0.1;              // a dot counts as covered if a line passes this close (dot spacing = 1)
    const r4 = v => Math.round(v * 1e4) / 1e4;
    const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

    // ------------------------------------------------------------------
    // Dot layouts, in lattice coordinates. 'square' = integer grid;
    // 'tri' = triangular lattice in axial coordinates (a, b), drawn at
    // (a + b/2, -b·√3/2). Collinearity is the same in both, so one search
    // works for both. n = lines allowed; sol = a verified polyline.
    // ------------------------------------------------------------------

    function grid(w, h) { const o = []; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) o.push([x, y]); return o; }
    function tri(s) { const o = []; for (let b = 0; b < s; b++) for (let a = 0; a < s - b; a++) o.push([a, b]); return o; }
    function hex(r) { const o = []; for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) if (Math.abs(a + b) <= r) o.push([a, b]); return o; }
    function diamond(r) { const o = []; for (let x = -r; x <= r; x++) for (let y = -r; y <= r; y++) if (Math.abs(x) + Math.abs(y) <= r) o.push([x, y]); return o; }
    const star = () => hex(1).concat([[1, 1], [-1, 2], [-2, 1], [-1, -1], [1, -2], [2, -1]]);

    const LAYOUTS = [
        { id: 'grid2x4', name: 'Two rows of four', kind: 'square', dots: grid(4, 2), n: 3, sol: [[0, 0], [3, 0], [0, 1], [3, 1]], tiers: [1] },
        { id: 'grid2x5', name: 'Two rows of five', kind: 'square', dots: grid(5, 2), n: 3, sol: [[0, 0], [4, 0], [0, 1], [4, 1]], tiers: [1] },
        { id: 'tri3', name: 'Small triangle', kind: 'tri', dots: tri(3), n: 3, sol: [[0, 0], [2, 0], [0, 2], [0, 1]], tiers: [1] },
        { id: 'hex7', name: 'Small hexagon', kind: 'tri', dots: hex(1), n: 4, sol: [[-1, 0], [-1, 1], [2, -2], [0, 2], [0, -1]], tiers: [1, 2] },
        { id: 'tri4', name: 'Triangle of ten', kind: 'tri', dots: tri(4), n: 4, sol: [[0, 0], [3, 0], [0, 3], [0, 1], [1, 1]], tiers: [2] },
        { id: 'grid3x4', name: 'Three rows of four', kind: 'square', dots: grid(4, 3), n: 5, sol: [[0, 0], [3, 0], [0, 1], [3, 1], [0, 2], [3, 2]], tiers: [2] },
        { id: 'star13', name: 'Six-pointed star', kind: 'tri', dots: star(), n: 5, sol: [[1, 1], [-2, 1], [1, -2], [-1, 2], [2, -1], [-1, -1]], tiers: [2] },
        { id: 'tri5', name: 'Triangle of fifteen', kind: 'tri', dots: tri(5), n: 5, sol: [[0, 0], [4, 0], [0, 4], [0, 1], [2, 1], [1, 2]], tiers: [2, 3] },
        { id: 'diamond13', name: 'Diamond', kind: 'square', dots: diamond(2), n: 5, sol: [[-2, 0], [2, 0], [0, -2], [0, 3], [-3, -3], [1, 1]], tiers: [3] },
        { id: 'grid4x4', name: '4 × 4 grid', kind: 'square', dots: grid(4, 4), n: 6, sol: [[0, 0], [2, 0], [2, 3], [-1, 3], [3, -1], [3, 4], [0, 1]], tiers: [3] },
        { id: 'hex19', name: 'Big hexagon', kind: 'tri', dots: hex(2), n: 7, sol: [[-2, 0], [-2, 2], [3, -3], [0, 3], [0, -4], [3, 2], [-1, -2], [-1, 2]], tiers: [3] },
        { id: 'grid4x5', name: '4 × 5 grid', kind: 'square', dots: grid(5, 4), n: 7, sol: [[0, 0], [3, 0], [3, 3], [0, 0], [0, 3], [4, -1], [4, 3], [1, 3]], tiers: [3] },
    ];

    // Symmetries of each lattice: rotations (+ a mirror).
    const ROT = {
        square: ([x, y]) => [-y, x],
        tri: ([a, b]) => [-b, a + b],
    };
    const MIRROR = {
        square: ([x, y]) => [-x, y],
        tri: ([a, b]) => [b, a],
    };
    const ROT_COUNT = { square: 4, tri: 6 };
    const BASIS = { square: { u: [1, 0], v: [0, 1] }, tri: { u: [1, 0], v: [0.5, -SQ3 / 2] } };

    function symCount(kind) { return ROT_COUNT[kind] * 2; }

    function applySym(kind, sym, p) {
        let q = p.slice();
        if (sym >= ROT_COUNT[kind]) q = MIRROR[kind](q);
        for (let i = 0; i < sym % ROT_COUNT[kind]; i++) q = ROT[kind](q);
        return q;
    }

    function toDisplay(kind, [a, b]) {
        return kind === 'tri' ? [r4(a + b / 2), r4(-b * SQ3 / 2)] : [a, b];
    }

    // Build puzzle data for one layout under one symmetry and lattice offset.
    function buildDotPuzzle(layout, sym, offset) {
        const off = offset || [0, 0];
        const map = p => {
            const q = applySym(layout.kind, sym || 0, p);
            return toDisplay(layout.kind, [q[0] + off[0], q[1] + off[1]]);
        };
        const dots = layout.dots.map(map);
        const known = layout.sol.map(map);
        const xs = dots.map(d => d[0]), ys = dots.map(d => d[1]);
        const box = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
        let excess = 0;
        known.forEach(([x, y]) => {
            excess = Math.max(excess, box[0] - x, x - box[2], box[1] - y, y - box[3]);
        });
        const m = Math.max(1.6, excess + 0.7);
        return {
            mode: 'dots',
            layout: layout.id,
            name: layout.name,
            kind: layout.kind,
            unit: 1,
            dots,
            maxLines: layout.n,
            known,
            lattice: BASIS[layout.kind],
            view: [r4(box[0] - m), r4(box[1] - m), r4(box[2] - box[0] + 2 * m), r4(box[3] - box[1] + 2 * m)],
        };
    }

    // ------------------------------------------------------------------
    // Geometry for checking polylines.
    // ------------------------------------------------------------------

    function pointSegDist(p, a, b) {
        const dx = b[0] - a[0], dy = b[1] - a[1];
        const len2 = dx * dx + dy * dy;
        if (len2 < 1e-12) return dist(p, a);
        let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
    }

    // Remove repeated points and merge consecutive segments that continue
    // straight on in the same direction (they are one line).
    function normalisePolyline(points) {
        const out = [];
        for (const p of points) {
            if (out.length && dist(out[out.length - 1], p) < 1e-6) continue;
            if (out.length >= 2) {
                const a = out[out.length - 2], b = out[out.length - 1];
                const u = [b[0] - a[0], b[1] - a[1]], v = [p[0] - b[0], p[1] - b[1]];
                const cross = (u[0] * v[1] - u[1] * v[0]) / (Math.hypot(...u) * Math.hypot(...v));
                const dot = u[0] * v[0] + u[1] * v[1];
                if (Math.abs(cross) < 1e-4 && dot > 0) { out[out.length - 1] = p; continue; }
            }
            out.push(p);
        }
        return out;
    }

    function coveredMask(dots, points) {
        return dots.map(d => {
            if (points.length === 1) return dist(d, points[0]) <= TOL;
            for (let i = 0; i + 1 < points.length; i++) if (pointSegDist(d, points[i], points[i + 1]) <= TOL) return true;
            return false;
        });
    }

    function readPoints(answer) {
        const raw = Array.isArray(answer) ? answer : answer && answer.points;
        if (!Array.isArray(raw)) return null;
        const pts = [];
        for (const p of raw) {
            if (!Array.isArray(p) || p.length < 2) return null;
            const x = Number(p[0]), y = Number(p[1]);
            if (!isFinite(x) || !isFinite(y)) return null;
            pts.push([x, y]);
        }
        return pts;
    }

    function checkDots(data, answer) {
        const raw = readPoints(answer);
        if (!raw || raw.length < 2) return { solved: false, feedback: 'Draw at least one line first.', partial: 0 };
        const pts = normalisePolyline(raw);
        const segs = pts.length - 1;
        const cov = coveredMask(data.dots, pts);
        const hit = cov.filter(Boolean).length;
        const total = data.dots.length;
        const partial = hit / total;
        if (segs < 1) return { solved: false, feedback: 'Draw at least one line first.', partial: 0 };
        if (segs > data.maxLines) {
            return { solved: false, partial, feedback: 'That uses ' + segs + ' lines, but the limit is ' + data.maxLines + '.' };
        }
        if (hit < total) {
            const miss = total - hit;
            return { solved: false, partial, feedback: miss + (miss === 1 ? ' dot is' : ' dots are') + ' still not on a line.' };
        }
        return { solved: true, partial: 1, feedback: 'All ' + total + ' dots with ' + segs + (segs === 1 ? ' line' : ' lines') + '. The box was never really there!' };
    }

    // ------------------------------------------------------------------
    // The forbidden layout check: is this set of dots an (affine) 3×3 grid?
    // ------------------------------------------------------------------

    function isNineDot(dots) {
        if (!dots || dots.length !== 9) return false;
        const c = [dots.reduce((s, d) => s + d[0], 0) / 9, dots.reduce((s, d) => s + d[1], 0) / 9];
        const has = p => dots.some(d => dist(d, p) < 1e-3);
        if (!has(c)) return false;
        for (const p of dots) for (const q of dots) {
            const u = [p[0] - c[0], p[1] - c[1]], v = [q[0] - c[0], q[1] - c[1]];
            if (Math.abs(u[0] * v[1] - u[1] * v[0]) < 1e-6) continue;
            let all = true;
            for (let i = -1; i <= 1 && all; i++) for (let j = -1; j <= 1 && all; j++) {
                if (!has([c[0] + i * u[0] + j * v[0], c[1] + i * u[1] + j * v[1]])) all = false;
            }
            if (all) return true;
        }
        return false;
    }

    // ------------------------------------------------------------------
    // Lattice search: a polyline with at most N segments covering all dots,
    // turning only at lattice points within `margin` of the dots. Used to
    // tighten N for scattered layouts (and how the stored solutions above
    // were found). Deterministic, bounded by a node budget.
    // ------------------------------------------------------------------

    function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a; }

    function latticeSolve(dots, N, margin, budget) {
        const key = (x, y) => x + ',' + y;
        const idx = new Map(dots.map((d, i) => [key(d[0], d[1]), i]));
        const xs = dots.map(d => d[0]), ys = dots.map(d => d[1]);
        const lo = [Math.min(...xs) - margin, Math.min(...ys) - margin];
        const hi = [Math.max(...xs) + margin, Math.max(...ys) + margin];
        const n = dots.length;
        if (n > 30) return null;
        const FULL = n === 30 ? 0x3fffffff : (1 << n) - 1;
        let maxLine = 1;
        for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
            let c = 0;
            const [ax, ay] = dots[i], [bx, by] = dots[j];
            for (const d of dots) if ((bx - ax) * (d[1] - ay) - (by - ay) * (d[0] - ax) === 0) c++;
            maxLine = Math.max(maxLine, c);
        }
        const pop = m => { let c = 0; while (m) { m &= m - 1; c++; } return c; };
        const seen = new Set();
        let nodes = 0;
        function dfs(px, py, mask, left, path) {
            if (mask === FULL) return path.slice();
            if (left === 0 || ++nodes > budget) return null;
            const unc = n - pop(mask);
            if (unc > left * maxLine) return null;
            const sk = px + ',' + py + ',' + mask + ',' + left;
            if (seen.has(sk)) return null;
            seen.add(sk);
            const need = unc - (left - 1) * maxLine;
            const dirs = [];
            const dirSeen = new Set();
            for (let i = 0; i < n; i++) {
                if (mask >> i & 1) continue;
                const dx = dots[i][0] - px, dy = dots[i][1] - py;
                if (!dx && !dy) continue;
                const g = gcd(dx, dy), k = key(dx / g, dy / g);
                if (!dirSeen.has(k)) { dirSeen.add(k); dirs.push([dx / g, dy / g]); }
            }
            for (const [dx, dy] of dirs) {
                let m = mask, x = px, y = py;
                for (;;) {
                    x += dx; y += dy;
                    if (x < lo[0] || x > hi[0] || y < lo[1] || y > hi[1]) break;
                    const i = idx.get(key(x, y));
                    if (i !== undefined) m |= 1 << i;
                    if (m === mask || pop(m) - pop(mask) < need) continue;
                    path.push([x, y]);
                    const r = dfs(x, y, m, left - 1, path);
                    path.pop();
                    if (r) return r;
                }
            }
            return null;
        }
        for (let s = 0; s < n; s++) {
            const r = dfs(dots[s][0], dots[s][1], 1 << s, N, [dots[s].slice()]);
            if (r) return r;
            if (nodes > budget) return null;
        }
        return null;
    }

    // Scattered layout: build a random lattice polyline of k segments
    // (turning points may lie outside the dots' box), sprinkle dots along it,
    // then search for a tighter N.
    const SCATTER_DIRS = [[1, 0], [0, 1], [1, 1], [1, -1], [-1, 0], [0, -1], [-1, -1], [-1, 1], [2, 1], [1, 2], [-2, 1], [1, -2]];

    function buildScattered(rng, k) {
        const inRegion = p => p[0] >= 0 && p[0] <= 4 && p[1] >= 0 && p[1] <= 4;
        for (let attempt = 0; attempt < 60; attempt++) {
            const dotKeys = new Set();
            const dots = [];
            let P = [rng.int(0, 4), rng.int(0, 4)];
            const pts = [P];
            let prev = null, ok = true;
            for (let s = 0; s < k && ok; s++) {
                let placed = false;
                for (let t = 0; t < 40 && !placed; t++) {
                    const dir = rng.pick(SCATTER_DIRS);
                    if (prev && dir[0] * prev[1] - dir[1] * prev[0] === 0) continue;
                    const len = dir[0] && dir[1] && (Math.abs(dir[0]) > 1 || Math.abs(dir[1]) > 1) ? rng.int(1, 2) : rng.int(2, 4);
                    const Q = [P[0] + len * dir[0], P[1] + len * dir[1]];
                    if (Q[0] < -2 || Q[0] > 6 || Q[1] < -2 || Q[1] > 6) continue;
                    const cand = [];
                    for (let j = s === 0 ? 0 : 1; j <= len; j++) {
                        const p = [P[0] + j * dir[0], P[1] + j * dir[1]];
                        if (inRegion(p) && !dotKeys.has(p.join(','))) cand.push(p);
                    }
                    if (cand.length < 2) continue;
                    rng.shuffle(cand).slice(0, Math.min(cand.length, rng.int(2, 3))).forEach(p => {
                        dotKeys.add(p.join(','));
                        dots.push(p);
                    });
                    P = Q; prev = dir; pts.push(Q); placed = true;
                }
                if (!placed) ok = false;
            }
            if (!ok || dots.length < 6 || dots.length > 11 || isNineDot(dots)) continue;
            let n = k, sol = pts;
            for (let N = 2; N < k; N++) {
                const r = latticeSolve(dots, N, 2, 30000);
                if (r) { n = N; sol = r; break; }
            }
            if (n < 3) continue;
            return { id: 'scattered', name: 'Scattered dots', kind: 'square', dots, n, sol, tiers: [] };
        }
        return null;
    }

    function genDots(rng, d) {
        const pool = LAYOUTS.filter(l => l.tiers.includes(d));
        let layout = null;
        const scatterChance = d === 3 ? 0 : 0.3;
        if (rng.chance(scatterChance)) layout = buildScattered(rng, d === 1 ? 3 : 4);
        if (!layout) layout = rng.pick(pool);
        const sym = rng.int(0, symCount(layout.kind) - 1);
        const data = buildDotPuzzle(layout, sym, [rng.int(-2, 2), rng.int(-2, 2)]);
        return data;
    }

    // ------------------------------------------------------------------
    // Graphs (one-stroke figures).
    // ------------------------------------------------------------------

    function polygon(n, cx, cy, r) {
        const o = [];
        for (let i = 0; i < n; i++) {
            const a = (-90 + 360 * i / n) * Math.PI / 180;
            o.push([r4(cx + r * Math.cos(a)), r4(cy + r * Math.sin(a))]);
        }
        return o;
    }

    const HOUSE_V = [[1, 0], [0, 1.4], [2, 1.4], [2, 3.4], [0, 3.4]];
    const ENV_V = [[0, 0], [3.2, 0], [3.2, 2.2], [0, 2.2], [1.6, 1.1]];
    const ENV_E = [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [1, 4], [2, 4], [3, 4]];

    const FIGURES = {
        house: { name: 'House', v: HOUSE_V, e: [[1, 2], [2, 3], [3, 4], [4, 1], [0, 1], [0, 2]] },
        nikolaus: { name: 'House with a cross', v: HOUSE_V, e: [[1, 2], [2, 3], [3, 4], [4, 1], [0, 1], [0, 2], [1, 3], [2, 4]] },
        bowtie: { name: 'Bow tie', v: [[0, 0], [0, 2.4], [1.6, 1.2], [3.2, 0], [3.2, 2.4]], e: [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4], [4, 2]] },
        pentagram: { name: 'Star', v: polygon(5, 1.7, 1.8, 1.8), e: [[0, 2], [2, 4], [4, 1], [1, 3], [3, 0]] },
        pentagonStar: { name: 'Star in a pentagon', v: polygon(5, 1.7, 1.8, 1.8), e: [[0, 2], [2, 4], [4, 1], [1, 3], [3, 0], [0, 1], [1, 2], [2, 3], [3, 4], [4, 0]] },
        envelope: { name: 'Sealed envelope', v: ENV_V, e: ENV_E },
        openEnvelope: { name: 'Open envelope', v: ENV_V.concat([[1.6, -1.4]]), e: ENV_E.concat([[5, 0], [5, 1]]) },
        twoHouses: {
            name: 'Two houses',
            v: [[0, 3.4], [2, 3.4], [4, 3.4], [0, 1.4], [2, 1.4], [4, 1.4], [1, 0], [3, 0]],
            e: [[0, 1], [1, 2], [3, 4], [4, 5], [0, 3], [1, 4], [2, 5], [3, 6], [6, 4], [4, 7], [7, 5]],
        },
        bridges: {
            // Königsberg: N bank, S bank, island A, east land D, seven bridge points.
            name: 'Seven bridges',
            v: [[2, 0], [2, 4], [1.2, 2], [3.8, 2], [0.6, 1], [1.7, 1], [0.6, 3], [1.7, 3], [2.5, 2], [3.3, 0.8], [3.3, 3.2]],
            e: [[2, 4], [4, 0], [2, 5], [5, 0], [2, 6], [6, 1], [2, 7], [7, 1], [2, 8], [8, 3], [0, 9], [9, 3], [1, 10], [10, 3]],
        },
    };

    const FIGURE_POOLS = {
        possible: { 1: ['house', 'nikolaus', 'bowtie', 'pentagram'], 2: ['nikolaus', 'openEnvelope', 'pentagonStar'], 3: ['pentagonStar', 'openEnvelope', 'nikolaus'] },
        impossible: { 2: ['envelope'], 3: ['bridges', 'twoHouses', 'envelope'] },
    };

    function degrees(data) {
        const deg = new Array(data.vertices.length).fill(0);
        data.edges.forEach(([a, b]) => { deg[a]++; deg[b]++; });
        return deg;
    }

    function oddVertices(data) {
        return degrees(data).map((d, i) => d % 2 ? i : -1).filter(i => i >= 0);
    }

    function isConnected(data) {
        const n = data.vertices.length;
        if (!n) return false;
        const adj = Array.from({ length: n }, () => []);
        data.edges.forEach(([a, b]) => { adj[a].push(b); adj[b].push(a); });
        const seen = new Set([0]), stack = [0];
        while (stack.length) for (const w of adj[stack.pop()]) if (!seen.has(w)) { seen.add(w); stack.push(w); }
        return seen.size === n;
    }

    function eulerPath(data) {
        const n = data.vertices.length, edges = data.edges;
        if (!edges.length || !isConnected(data)) return null;
        const odd = oddVertices(data);
        if (odd.length > 2) return null;
        const adj = Array.from({ length: n }, () => []);
        edges.forEach(([a, b], i) => { adj[a].push([b, i]); adj[b].push([a, i]); });
        const used = new Array(edges.length).fill(false);
        const ptr = new Array(n).fill(0);
        const stack = [odd.length ? odd[0] : edges[0][0]], out = [];
        while (stack.length) {
            const v = stack[stack.length - 1];
            while (ptr[v] < adj[v].length && used[adj[v][ptr[v]][1]]) ptr[v]++;
            if (ptr[v] === adj[v].length) out.push(stack.pop());
            else { const [w, i] = adj[v][ptr[v]]; used[i] = true; stack.push(w); }
        }
        out.reverse();
        return out.length === edges.length + 1 ? out : null;
    }

    function edgeKey(a, b) { return a < b ? a + '-' + b : b + '-' + a; }

    function graphView(vertices, unit) {
        const xs = vertices.map(v => v[0]), ys = vertices.map(v => v[1]);
        const m = 0.8 * unit;
        const x0 = Math.min(...xs), y0 = Math.min(...ys);
        return [r4(x0 - m), r4(y0 - m), r4(Math.max(...xs) - x0 + 2 * m), r4(Math.max(...ys) - y0 + 2 * m)];
    }

    function buildFigure(rng, id) {
        const f = FIGURES[id];
        const mirror = rng.chance(0.5);
        const maxX = Math.max(...f.v.map(v => v[0]));
        const order = rng.shuffle(f.v.map((_, i) => i));       // order[newIndex] = oldIndex
        const newOf = [];
        order.forEach((old, i) => { newOf[old] = i; });
        const vertices = order.map(old => {
            const [x, y] = f.v[old];
            return [r4(mirror ? maxX - x : x), y];
        });
        const edges = rng.shuffle(f.e.map(([a, b]) => [newOf[a], newOf[b]]));
        return { mode: 'graph', figure: id, name: f.name, unit: 2, vertices, edges, view: graphView(vertices, 2) };
    }

    // Planar graph on a jittered grid: grid edges plus one diagonal per cell.
    // target: 'possible' (≤2 odd), 'impossible' (≥4 odd) or 'four' (exactly 4 odd).
    function buildGridGraph(rng, rows, cols, dropCorner, target) {
        const cells = [];
        const at = {};
        const corner = dropCorner ? rng.pick([[0, 0], [0, cols - 1], [rows - 1, 0], [rows - 1, cols - 1]]) : null;
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
            if (corner && corner[0] === r && corner[1] === c) continue;
            at[r + ',' + c] = cells.length;
            cells.push([r, c]);
        }
        const id = (r, c) => at[r + ',' + c];
        for (let attempt = 0; attempt < 400; attempt++) {
            const vertices = cells.map(([r, c]) => [r4(c * 2 + (rng.next() - 0.5) * 0.7), r4(r * 2 + (rng.next() - 0.5) * 0.7)]);
            const cand = [];
            for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
                const a = id(r, c);
                if (a === undefined) continue;
                if (id(r, c + 1) !== undefined) cand.push([a, id(r, c + 1)]);
                if (id(r + 1, c) !== undefined) cand.push([a, id(r + 1, c)]);
                const b = id(r, c + 1), cc = id(r + 1, c), dd = id(r + 1, c + 1);
                const diag = rng.chance(0.5) ? [a, dd] : [b, cc];
                if (diag[0] !== undefined && diag[1] !== undefined) cand.push(diag);
                else if (a !== undefined && dd !== undefined) cand.push([a, dd]);
                else if (b !== undefined && cc !== undefined) cand.push([b, cc]);
            }
            const parent = cells.map((_, i) => i);
            const find = x => (parent[x] === x ? x : (parent[x] = find(parent[x])));
            const edges = [];
            const extraP = 0.35 + rng.next() * 0.35;
            for (const e of rng.shuffle(cand)) {
                const ra = find(e[0]), rb = find(e[1]);
                if (ra !== rb) { parent[ra] = rb; edges.push(e); }
                else if (rng.chance(extraP)) edges.push(e);
            }
            const data = { mode: 'graph', figure: 'generated', name: 'Chalk figure', unit: 2, vertices, edges };
            if (edges.length < vertices.length || !isConnected(data)) continue;
            const odd = oddVertices(data).length;
            const ok = target === 'possible' ? odd <= 2 : target === 'four' ? odd === 4 : odd >= 4;
            if (!ok) continue;
            data.edges = rng.shuffle(edges);
            data.view = graphView(vertices, 2);
            return data;
        }
        return null;
    }

    const GRID_SIZES = {
        1: [[2, 2, false], [2, 3, false], [3, 2, false], [2, 3, true]],
        2: [[2, 3, false], [3, 2, false], [2, 4, false], [3, 3, true], [2, 4, true]],
        3: [[3, 3, false], [3, 3, true], [2, 4, false], [3, 3, false]],
    };

    function genGraph(rng, d) {
        const impossible = d === 1 ? false : rng.chance(d === 2 ? 0.4 : 0.55);
        const kind = impossible ? 'impossible' : 'possible';
        let data = null;
        if (rng.chance(0.55)) {
            const [rows, cols, drop] = rng.pick(GRID_SIZES[d]);
            const target = !impossible ? 'possible' : d === 3 ? 'four' : 'impossible';
            data = buildGridGraph(rng, rows, cols, drop, target);
        }
        if (!data) data = buildFigure(rng, rng.pick(FIGURE_POOLS[kind][d]));
        return data;
    }

    function readIndices(list, n) {
        if (!Array.isArray(list)) return null;
        const out = [];
        for (const v of list) {
            const i = Number(v);
            if (!Number.isInteger(i) || i < 0 || i >= n) return null;
            out.push(i);
        }
        return out;
    }

    function checkGraph(data, answer) {
        const n = data.vertices.length, E = data.edges.length;
        const odd = oddVertices(data);
        const impossible = odd.length > 2;
        if (answer && answer.type === 'impossible') {
            if (!impossible) {
                return { solved: false, partial: 0, feedback: 'Not impossible: this figure CAN be drawn in one stroke. Keep looking for the route.' };
            }
            const picked = readIndices(answer.odd || answer.vertices, n);
            if (!picked) return { solved: false, partial: 0, feedback: 'Pick the dots that prove it.' };
            const sel = new Set(picked);
            const right = odd.filter(i => sel.has(i)).length;
            const wrong = sel.size - right;
            if (right === odd.length && wrong === 0) {
                return { solved: true, partial: 1, feedback: 'Proof accepted: ' + odd.length + ' dots have an odd number of lines, but one stroke has only two ends. Nobody will ever draw this.' };
            }
            return {
                solved: false,
                partial: Math.max(0, (right - wrong) / odd.length),
                feedback: 'Yes, it is impossible, but your proof picks the wrong dots. Which dots break the rule?',
            };
        }
        const path = readIndices(answer && (answer.vertices || answer.path || (Array.isArray(answer) ? answer : null)), n);
        if (!path || path.length < 2) return { solved: false, partial: 0, feedback: 'Draw along the lines, from dot to dot.' };
        const index = new Map(data.edges.map(([a, b], i) => [edgeKey(a, b), i]));
        const used = new Set();
        for (let i = 0; i + 1 < path.length; i++) {
            const k = index.get(edgeKey(path[i], path[i + 1]));
            if (k === undefined) return { solved: false, partial: used.size / E, feedback: 'You jumped between two dots with no line between them.' };
            if (used.has(k)) return { solved: false, partial: used.size / E, feedback: 'You went over a line twice. No retracing!' };
            used.add(k);
        }
        if (used.size < E) {
            const left = E - used.size;
            return { solved: false, partial: used.size / E, feedback: left + (left === 1 ? ' line is' : ' lines are') + ' still not drawn.' };
        }
        return { solved: true, partial: 1, feedback: 'Every line drawn exactly once, in one stroke!' };
    }

    // ------------------------------------------------------------------
    // Hints and the "why?" question.
    // ------------------------------------------------------------------

    function hintsFor(data) {
        if (data.mode === 'dots') {
            const xs = data.dots.map(d => d[0]), ys = data.dots.map(d => d[1]);
            const box = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
            const outside = data.known.filter(([x, y]) => x < box[0] - 0.05 || x > box[2] + 0.05 || y < box[1] - 0.05 || y > box[3] + 0.05).length;
            const offDot = data.known.slice(1, -1).filter(p => !data.dots.some(d => dist(d, p) < 1e-3)).length;
            const first = coveredMask(data.dots, data.known.slice(0, 2)).filter(Boolean).length;
            const hs = ['You have ' + data.maxLines + ' straight lines. Each new line must start where the last one ended.'];
            if (outside) {
                hs.push('Your lines are allowed to leave the box. Nobody said a line must stop at the last dot.');
                hs.push('In one answer, ' + outside + (outside === 1 ? ' turn happens' : ' turns happen') + ' outside the dots, in empty space.');
            } else {
                hs.push('Make every line pass through as many dots as it can.');
                if (offDot) hs.push('Lines can turn at an empty spot, not only on a dot.');
            }
            hs.push('In one answer, the very first line passes through ' + first + ' dots.');
            return hs;
        }
        const odd = oddVertices(data);
        const hs = [
            'Count the lines meeting at each dot. What is special about the odd ones?',
            'Every time your chalk passes through a dot, it uses one line going in and one line going out.',
        ];
        if (odd.length > 2) hs.push('Only the start and the end of a stroke can have an odd number of lines. How many odd dots are there here?');
        else if (odd.length === 2) hs.push('Start on a dot with an odd number of lines. You will finish on the other odd one.');
        else hs.push('Every dot here has an even number of lines: start anywhere, and you will finish where you began.');
        return hs;
    }

    function shuffleOptions(seed, options, correctIndex) {
        const order = Rift.makeRng(seed || 1).shuffle(options.map((_, i) => i));
        return { options: order.map(i => options[i]), correct: order.indexOf(correctIndex) };
    }

    function whyFor(data) {
        if (data.mode === 'dots') {
            const s = shuffleOptions(data.whyShuffle, [
                'Nothing in the rules said the lines must stay inside. The "box" was an assumption we added ourselves.',
                'The rules changed halfway through the puzzle.',
                'Straight lines bend slightly when they are long enough.',
                'It is a trick: puzzles like this have no real answer.',
            ], 0);
            return {
                question: 'Why do many people get stuck on puzzles like this one?',
                options: s.options,
                correct: s.correct,
                explain: 'The rules never mention a box. Our mind adds that limit on its own. A lot of maths discovery is noticing a rule that was never really there.',
            };
        }
        const s = shuffleOptions(data.whyShuffle, [
            'Each time the chalk passes through a dot it uses two lines (one in, one out). Only the start and the end can have an odd number, so at most two dots can be odd.',
            'Nobody has found the route yet, but someone clever might find it one day.',
            'Four is an even number, so the lines cancel each other out.',
            'Figures with crossing lines can never be drawn in one stroke.',
        ], 0);
        return {
            question: 'Why can a figure with four odd dots (dots where an odd number of lines meet) never be drawn in one stroke?',
            options: s.options,
            correct: s.correct,
            explain: "Euler's argument (1736): passing through a dot always uses lines in pairs. Odd dots must be where you start or stop, and a stroke has only two ends. This is a proof, so it holds for every attempt, forever, not just the ones we tried.",
        };
    }

    // ------------------------------------------------------------------
    // DOM
    // ------------------------------------------------------------------

    const NS = 'http://www.w3.org/2000/svg';

    function svgEl(tag, attrs, parent) {
        const node = root.document.createElementNS(NS, tag);
        if (attrs) for (const k of Object.keys(attrs)) if (attrs[k] != null) node.setAttribute(k, attrs[k]);
        if (parent) parent.appendChild(node);
        return node;
    }

    function mount(container, data, api) {
        const el = Rift.el;
        const sfx = name => { try { if (api && api.sfx) api.sfx(name); } catch (e) { /* sound is optional */ } };
        const isDots = data.mode === 'dots';
        const unit = data.unit || 1;
        const st = { pts: [], path: [], proof: false, picked: new Set(), done: false, down: false, cursor: null };
        const edgeIndex = new Map((data.edges || []).map(([a, b], i) => [edgeKey(a, b), i]));

        // ---- layout ----
        const counter = el('span.ld-count');
        const statusEl = el('div.ld-status');
        const chips = isDots
            ? [data.dots.length + ' dots', 'at most ' + data.maxLines + ' straight lines', 'never lift the chalk']
            : ['one stroke', 'no line twice', '…or prove it impossible'];
        const top = el('div.ld-top', null, [
            el('span.chip', { dataset: { colour: 'imagination' }, text: '🌀 ' + (isDots ? 'Cover every dot' : 'Draw it in one stroke') }),
            ...chips.map(t => el('span.ld-piece', { text: t })),
            el('span.ld-spacer'),
            counter,
        ]);

        const board = el('div.ld-board');
        const svg = svgEl('svg', { class: 'ld-svg', viewBox: data.view.join(' '), preserveAspectRatio: 'xMidYMid meet' }, board);
        const gGuide = svgEl('g', { class: 'ld-guide' }, svg);
        const gFigure = svgEl('g', { class: 'ld-figure' }, svg);
        const gInk = svgEl('g', { class: 'ld-inkl' }, svg);
        const gPreview = svgEl('g', { class: 'ld-preview' }, svg);
        const gDots = svgEl('g', { class: 'ld-dots' }, svg);
        const gSnap = svgEl('g', { class: 'ld-snapl' }, svg);

        const undoBtn = el('button.btn.small', { text: '↶ Undo', onclick: () => undo() });
        const clearBtn = el('button.btn.small', { text: 'Clear', onclick: () => clear() });
        const impBtn = el('button.btn.small.ld-imp', { text: 'This is impossible!', onclick: () => toggleProof() });
        const proofBtn = el('button.btn.small.gold.ld-proofbtn', { text: 'Submit proof', onclick: () => submitProof() });
        const controls = el('div.ld-controls', null, isDots ? [undoBtn, clearBtn, statusEl] : [undoBtn, clearBtn, impBtn, proofBtn, statusEl]);

        const rootEl = el('div.ld-root' + (isDots ? '.ld-mode-dots' : '.ld-mode-graph'), null, [top, board, controls]);
        try { if (root.getComputedStyle(container).position !== 'static') rootEl.classList.add('ld-fill'); } catch (e) { /* keep flow layout */ }
        container.appendChild(rootEl);

        function setStatus(text, tone) {
            statusEl.textContent = text || '';
            statusEl.className = 'ld-status' + (tone ? ' ' + tone : '');
        }

        // ---- coordinates ----
        function toData(ev) {
            const ctm = svg.getScreenCTM();
            if (!ctm) return null;
            const p = svg.createSVGPoint();
            p.x = ev.clientX; p.y = ev.clientY;
            const q = p.matrixTransform(ctm.inverse());
            return [q.x, q.y];
        }
        function pxPerUnit() { const c = svg.getScreenCTM(); return c ? Math.abs(c.a) || 50 : 50; }

        function nearestLattice(p) {
            const { u, v } = data.lattice;
            const det = u[0] * v[1] - u[1] * v[0];
            const a = (p[0] * v[1] - p[1] * v[0]) / det, b = (u[0] * p[1] - u[1] * p[0]) / det;
            let best = null, bd = Infinity;
            for (const ia of [Math.floor(a), Math.ceil(a)]) for (const ib of [Math.floor(b), Math.ceil(b)]) {
                const q = [ia * u[0] + ib * v[0], ia * u[1] + ib * v[1]];
                const dd = dist(q, p);
                if (dd < bd) { bd = dd; best = q; }
            }
            return [r4(best[0]), r4(best[1])];
        }

        function snap(p) {
            const r = Math.min(0.38, 18 / pxPerUnit());
            let best = null, bd = r;
            data.dots.forEach(d => { const dd = dist(d, p); if (dd < bd) { bd = dd; best = d; } });
            if (best) return { p: best.slice(), kind: 'dot' };
            const L = nearestLattice(p);
            if (dist(L, p) < r) return { p: L, kind: 'ghost' };
            return { p: [r4(p[0]), r4(p[1])], kind: 'free' };
        }

        function vertexAt(p) {
            const r = Math.max(0.3 * unit, Math.min(0.48 * unit, 22 / pxPerUnit()));
            let best = -1, bd = r;
            data.vertices.forEach((v, i) => { const dd = dist(v, p); if (dd < bd) { bd = dd; best = i; } });
            return best;
        }

        // ---- drawing ----
        const dotR = isDots ? 0.13 : 0.11 * unit;

        function drawFigure() {
            gFigure.innerHTML = '';
            if (isDots) return;
            const used = usedEdges();
            data.edges.forEach(([a, b], i) => {
                const A = data.vertices[a], B = data.vertices[b];
                svgEl('line', { x1: A[0], y1: A[1], x2: B[0], y2: B[1], class: 'ld-edge' + (used.has(i) ? ' used' : '') }, gFigure);
            });
        }

        function usedEdges() {
            const used = new Set();
            for (let i = 0; i + 1 < st.path.length; i++) used.add(edgeIndex.get(edgeKey(st.path[i], st.path[i + 1])));
            return used;
        }

        function render() {
            gInk.innerHTML = '';
            gDots.innerHTML = '';
            if (isDots) {
                const pts = st.pts;
                if (pts.length >= 2) svgEl('polyline', { points: pts.map(p => p.join(',')).join(' '), class: 'ld-ink' }, gInk);
                if (pts.length) svgEl('circle', { cx: pts[0][0], cy: pts[0][1], r: 0.2, class: 'ld-start' }, gInk);
                if (pts.length) svgEl('circle', { cx: pts[pts.length - 1][0], cy: pts[pts.length - 1][1], r: 0.09, class: 'ld-head' }, gInk);
                const cov = pts.length >= 2 ? coveredMask(data.dots, pts) : data.dots.map(() => false);
                data.dots.forEach((d, i) => svgEl('circle', { cx: d[0], cy: d[1], r: dotR, class: 'ld-dot' + (cov[i] ? ' hit' : '') }, gDots));
                const segs = Math.max(0, pts.length - 1);
                counter.textContent = 'Lines ' + segs + ' / ' + data.maxLines;
                counter.classList.toggle('full', segs >= data.maxLines);
            } else {
                drawFigure();
                const used = usedEdges();
                const last = st.path[st.path.length - 1];
                data.vertices.forEach((v, i) => {
                    let cls = 'ld-vertex';
                    if (i === last && !st.proof) cls += ' current';
                    if (i === st.path[0] && !st.proof) cls += ' start';
                    if (st.picked.has(i)) cls += ' picked';
                    if (st.proof) cls += ' pickable';
                    svgEl('circle', { cx: v[0], cy: v[1], r: dotR, class: cls }, gDots);
                });
                counter.textContent = 'Lines drawn ' + used.size + ' / ' + data.edges.length;
                proofBtn.disabled = !st.picked.size;
            }
            undoBtn.disabled = st.done || (isDots ? !st.pts.length : !st.path.length);
            clearBtn.disabled = undoBtn.disabled;
            rootEl.classList.toggle('proofing', st.proof);
            impBtn.classList.toggle('on', st.proof);
            impBtn.textContent = st.proof ? 'Back to drawing' : 'This is impossible!';
        }

        function drawPreview() {
            gPreview.innerHTML = '';
            gSnap.innerHTML = '';
            gGuide.innerHTML = '';
            if (st.done || !st.cursor) return;
            if (isDots) {
                const s = snap(st.cursor);
                svgEl('circle', { cx: s.p[0], cy: s.p[1], r: s.kind === 'free' ? 0.06 : 0.22, class: 'ld-snap ' + s.kind }, gSnap);
                const last = st.pts[st.pts.length - 1];
                if (!last || dist(last, s.p) < 1e-6) return;
                // a faint guide along the whole line, to help aim
                const dx = s.p[0] - last[0], dy = s.p[1] - last[1], len = Math.hypot(dx, dy), far = 60;
                svgEl('line', { x1: last[0] - dx / len * far, y1: last[1] - dy / len * far, x2: last[0] + dx / len * far, y2: last[1] + dy / len * far, class: 'ld-guideline' }, gGuide);
                const out = st.pts.length - 1 >= data.maxLines && !continuesStraight(s.p);
                svgEl('line', { x1: last[0], y1: last[1], x2: s.p[0], y2: s.p[1], class: 'ld-aim' + (out ? ' blocked' : '') }, gPreview);
                const cov = coveredMask(data.dots, [last, s.p]);
                data.dots.forEach((d, i) => { if (cov[i]) svgEl('circle', { cx: d[0], cy: d[1], r: dotR * 1.9, class: 'ld-aimdot' }, gPreview); });
            } else if (!st.proof && st.path.length) {
                const A = data.vertices[st.path[st.path.length - 1]];
                svgEl('line', { x1: A[0], y1: A[1], x2: st.cursor[0], y2: st.cursor[1], class: 'ld-aim' }, gPreview);
            }
        }

        function continuesStraight(q) {
            const n = st.pts.length;
            if (n < 2) return false;
            const a = st.pts[n - 2], b = st.pts[n - 1];
            const u = [b[0] - a[0], b[1] - a[1]], v = [q[0] - b[0], q[1] - b[1]];
            const lu = Math.hypot(...u), lv = Math.hypot(...v);
            if (lu < 1e-9 || lv < 1e-9) return false;
            return Math.abs((u[0] * v[1] - u[1] * v[0]) / (lu * lv)) < 1e-4 && u[0] * v[0] + u[1] * v[1] > 0;
        }

        // ---- actions ----
        function submitAnswer(answer) {
            let r = null;
            try { r = api && api.submit ? api.submit(answer) : null; } catch (e) { console.error('[line-drawer]', e); }
            const show = res => {
                if (!res) return;
                if (res.solved) {
                    st.done = true;
                    st.proof = false;
                    rootEl.classList.add('solved');
                    sfx('success');
                    setStatus(res.feedback, 'good');
                    gPreview.innerHTML = ''; gSnap.innerHTML = ''; gGuide.innerHTML = '';
                    render();
                } else {
                    sfx('error');
                    setStatus(res.feedback, 'bad');
                }
            };
            if (r && typeof r.then === 'function') r.then(show, () => {}); else show(r);
        }

        function addPoint(q) {
            const pts = st.pts;
            if (!pts.length) {
                pts.push(q);
                sfx('click');
                setStatus('Now click where your line should end or turn.');
                return render();
            }
            const last = pts[pts.length - 1];
            if (dist(q, last) < 1e-6) return;
            if (continuesStraight(q)) {
                pts[pts.length - 1] = q;            // same straight line, just longer
            } else if (pts.length - 1 >= data.maxLines) {
                sfx('error');
                setStatus('Out of lines! Undo, or clear and try a new idea.', 'bad');
                return;
            } else {
                pts.push(q);
            }
            sfx('place');
            render();
            const cov = coveredMask(data.dots, pts);
            const left = cov.filter(c => !c).length;
            if (!left) submitAnswer({ type: 'polyline', points: pts.map(p => p.slice()) });
            else if (pts.length - 1 >= data.maxLines) setStatus('All lines used, ' + left + (left === 1 ? ' dot' : ' dots') + ' missed. Undo or clear.', 'bad');
            else setStatus(left + (left === 1 ? ' dot' : ' dots') + ' to go.');
        }

        function step(v, loud) {
            if (v < 0) return;
            if (!st.path.length) {
                st.path.push(v);
                sfx('click');
                setStatus('Follow the lines from dot to dot.');
                return render();
            }
            const last = st.path[st.path.length - 1];
            if (v === last) return;
            const k = edgeIndex.get(edgeKey(last, v));
            if (k === undefined) {
                if (loud) { sfx('error'); setStatus('There is no line between those two dots.', 'bad'); }
                return;
            }
            if (usedEdges().has(k)) {
                if (loud) { sfx('error'); setStatus('You already drew that line. No retracing!', 'bad'); }
                return;
            }
            st.path.push(v);
            sfx('place');
            render();
            const used = usedEdges().size;
            if (used === data.edges.length) submitAnswer({ type: 'path', vertices: st.path.slice() });
            else {
                const last2 = st.path[st.path.length - 1];
                const stuck = data.edges.every(([a, b], i) => usedEdges().has(i) || (a !== last2 && b !== last2));
                setStatus(stuck ? 'Stuck! Undo, clear, or decide it cannot be done.' : (data.edges.length - used) + ' lines to go.', stuck ? 'bad' : '');
            }
        }

        function undo() {
            if (st.done) return;
            if (isDots) st.pts.pop(); else st.path.pop();
            sfx('click');
            setStatus('');
            render(); drawPreview();
        }

        function clear() {
            if (st.done) return;
            st.pts = []; st.path = [];
            sfx('click');
            setStatus('');
            render(); drawPreview();
        }

        function toggleProof() {
            if (st.done) return;
            st.proof = !st.proof;
            sfx('click');
            setStatus(st.proof ? 'Your proof: pick the dots that make one stroke impossible, then submit.' : 'Back to drawing.');
            render(); drawPreview();
        }

        function submitProof() {
            if (st.done || !st.picked.size) return;
            submitAnswer({ type: 'impossible', odd: Array.from(st.picked).sort((a, b) => a - b) });
        }

        // ---- input ----
        function onDown(ev) {
            if (st.done || ev.button > 0) return;
            const p = toData(ev);
            if (!p) return;
            st.cursor = p;
            if (isDots) {
                addPoint(snap(p).p);
            } else if (st.proof) {
                const v = vertexAt(p);
                if (v < 0) return;
                if (st.picked.has(v)) st.picked.delete(v); else st.picked.add(v);
                sfx('click');
                render();
            } else {
                st.down = true;
                try { svg.setPointerCapture(ev.pointerId); } catch (e) { /* ok */ }
                step(vertexAt(p), true);
            }
            drawPreview();
            ev.preventDefault();
        }
        function onMove(ev) {
            const p = toData(ev);
            if (!p) return;
            st.cursor = p;
            if (!isDots && st.down && !st.proof && !st.done) {
                const v = vertexAt(p);
                if (v >= 0 && v !== st.path[st.path.length - 1]) step(v, false);
            }
            drawPreview();
        }
        function onUp() { st.down = false; }
        function onLeave() { st.cursor = null; drawPreview(); }
        function onKey(ev) {
            const t = ev.target && ev.target.tagName;
            if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
            if ((ev.key === 'z' && (ev.ctrlKey || ev.metaKey)) || ev.key === 'Backspace') { undo(); ev.preventDefault(); }
            else if (ev.key === 'Escape' && st.proof) toggleProof();
        }

        svg.addEventListener('pointerdown', onDown);
        svg.addEventListener('pointermove', onMove);
        svg.addEventListener('pointerup', onUp);
        svg.addEventListener('pointercancel', onUp);
        svg.addEventListener('pointerleave', onLeave);
        root.addEventListener('keydown', onKey);

        render();
        setStatus(isDots ? 'Click a dot, or anywhere, to put your chalk down.' : 'Click a dot to start, then click or drag along the lines.');
        try {
            if (api && api.say) {
                api.say(isDots
                    ? 'Cover all ' + data.dots.length + ' dots with ' + data.maxLines + ' straight lines or fewer, without lifting your chalk.'
                    : 'Draw this in one stroke: no lifting, no line twice. Or prove that nobody ever could.');
            }
        } catch (e) { /* speech is optional */ }

        return {
            destroy() {
                root.removeEventListener('keydown', onKey);
                if (rootEl.parentNode) rootEl.parentNode.removeChild(rootEl);
            },
        };
    }

    // ------------------------------------------------------------------

    const def = {
        id: 'line-drawer',
        rules: [
            "Read the slate: the drawing rule changes between tasks.",
            "Dots: draw connected straight lines through every dot, within the stated line limit. Lines may go outside the dots.",
            "One stroke: trace every edge exactly once without lifting. An odd vertex has an odd number of edges meeting there.",
            "Impossible route: mark the odd vertices and submit the impossibility claim. A connected graph needs zero or two odd vertices for one stroke.",
            "How to play is free. The Hint button shows its heart cost. Think first, then check your answer."
        ],
        tutorial: [
            {
                "text": "Check the slate first. We may need a drawing, a one-stroke route, or a proof that no route works.",
                "highlight": ".ld-top"
            },
            {
                "text": "Dots mode: click the turning points of connected straight lines. Go outside the dots if it helps; stay within the line limit.",
                "highlight": ".ld-board"
            },
            {
                "text": "One-stroke mode: click connected points along edges. Use every edge once. A point with 1, 3 or 5 edges is called odd.",
                "highlight": ".ld-board"
            },
            {
                "text": "Example: a T shape has four odd points. A single stroke can have only two ends, so that shape cannot be drawn in one stroke.",
                "highlight": ".ld-controls"
            },
            {
                "text": "For an impossible graph, choose This is impossible!, mark the odd points, then Submit proof. A complete drawing is checked automatically. Undo or Clear fixes a move.",
                "highlight": ".ld-controls"
            },
            {
                "text": "How to play is free. The Hint button shows its heart cost. Think first, then check your answer.",
                "highlight": ".ld-top"
            }
        ],
        name: 'Line Drawer',
        colour: 'imagination',
        family: 'Lateral thinking',
        blurb: 'Draw it without lifting your chalk, or prove that nobody ever could.',
        tok: 'Sometimes the best answer in maths is a proof that something cannot be done, and sometimes the rule that stops you was only an assumption.',

        generate(rng, difficulty) {
            const d = Math.max(1, Math.min(3, Math.round(Number(difficulty) || 1)));
            const data = rng.chance([0.4, 0.45, 0.5][d - 1]) ? genDots(rng, d) : genGraph(rng, d);
            data.difficulty = d;
            data.whyShuffle = rng.int(1, 1e6);
            return data;
        },

        check(data, answer) {
            if (!data || !answer || typeof answer !== 'object') return { solved: false, partial: 0, feedback: 'Nothing drawn yet.' };
            return data.mode === 'dots' ? checkDots(data, answer) : checkGraph(data, answer);
        },

        hints: hintsFor,
        why: whyFor,

        solve(data) {
            if (data.mode === 'dots') return { type: 'polyline', points: data.known.map(p => p.slice()) };
            const odd = oddVertices(data);
            if (odd.length > 2) return { type: 'impossible', odd };
            return { type: 'path', vertices: eulerPath(data) };
        },

        mount,

        // exposed for tests and tools
        internals: {
            LAYOUTS, FIGURES, symCount, buildDotPuzzle, buildFigure, buildGridGraph, buildScattered,
            isNineDot, oddVertices, isConnected, eulerPath, latticeSolve, normalisePolyline, TOL,
        },
    };

    Rift.Puzzles.register(def);
})(typeof window !== 'undefined' ? window : globalThis);
