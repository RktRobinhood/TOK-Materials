import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRift } from './harness.mjs';

const Rift = loadRift(['js/core/rift.js', 'js/puzzles/registry.js', 'js/puzzles/line-drawer.js']);
const P = Rift.Puzzles.get('line-drawer');
const I = P.internals;

// Independent geometry (not the puzzle's own) for judging polylines.
function segDist(p, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy;
    let t = l2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}
const allCovered = (dots, pts) => dots.every(d => pts.some((p, i) => i + 1 < pts.length && segDist(d, p, pts[i + 1]) <= I.TOL));

const many = (d, count, fn) => {
    for (let s = 0; s < count; s++) fn(P.generate(Rift.makeRng('ld-' + d + '-' + s), d), s);
};

test('every offered (layout, N) has its stored solution accepted, in every rotation/reflection/offset', () => {
    for (const layout of I.LAYOUTS) {
        assert.ok(layout.sol.length - 1 <= layout.n, layout.id + ' solution too long');
        for (let sym = 0; sym < I.symCount(layout.kind); sym++) {
            for (const off of [[0, 0], [2, -1], [-2, 2]]) {
                const data = I.buildDotPuzzle(layout, sym, off);
                assert.equal(data.maxLines, layout.n);
                assert.ok(allCovered(data.dots, data.known), layout.id + ' sym ' + sym + ' known solution misses a dot (independent check)');
                const r = P.check(data, P.solve(data));
                assert.equal(r.solved, true, layout.id + ' sym ' + sym + ': ' + r.feedback);
                // the reverse path is just as good
                assert.equal(P.check(data, { type: 'polyline', points: data.known.slice().reverse() }).solved, true);
            }
        }
    }
});

test('stored N values match the lattice search (no (layout, N) pair is unsolvable)', () => {
    for (const layout of I.LAYOUTS.filter(l => l.dots.length <= 16)) {
        const found = I.latticeSolve(layout.dots, layout.n, 2, 2e6);
        assert.ok(found, layout.id + ' should be solvable in ' + layout.n);
        assert.ok(found.length - 1 <= layout.n);
    }
});

test('generated dot puzzles are solvable by their known solution at every difficulty', () => {
    for (const d of [1, 2, 3]) many(d, 250, data => {
        if (data.mode !== 'dots') return;
        assert.ok(data.known.length - 1 <= data.maxLines);
        assert.ok(allCovered(data.dots, data.known), data.layout);
        assert.equal(P.check(data, P.solve(data)).solved, true, data.layout);
    });
});

test('random-but-wrong polylines are rejected', () => {
    const rng = Rift.makeRng('wrong');
    for (const layout of I.LAYOUTS) {
        const data = I.buildDotPuzzle(layout, rng.int(0, I.symCount(layout.kind) - 1), [0, 0]);
        const [x0, y0, w, h] = data.view;
        for (let k = 0; k < 200; k++) {
            const pts = [];
            for (let i = 0; i <= data.maxLines; i++) pts.push([x0 + rng.next() * w, y0 + rng.next() * h]);
            if (allCovered(data.dots, pts)) continue; // vanishingly rare
            assert.equal(P.check(data, { type: 'polyline', points: pts }).solved, false);
        }
        // drop the last turn: one line fewer must miss something
        const shorter = data.known.slice(0, -1);
        if (!allCovered(data.dots, shorter)) assert.equal(P.check(data, { type: 'polyline', points: shorter }).solved, false);
        // nudge a turning point off the lattice by half a unit
        const nudged = data.known.map((p, i) => (i === 1 ? [p[0] + 0.5, p[1] + 0.37] : p));
        if (!allCovered(data.dots, nudged)) assert.equal(P.check(data, { type: 'polyline', points: nudged }).solved, false);
        // too many lines: a valid cover plus a zig-zag detour
        const last = data.known[data.known.length - 1];
        const extra = data.known.concat([[last[0] + 0.5, last[1] + 3], [last[0] + 3, last[1] - 0.5]]);
        assert.ok(I.normalisePolyline(extra).length - 1 > data.maxLines);
        const r = P.check(data, { type: 'polyline', points: extra });
        assert.equal(r.solved, false);
        assert.match(r.feedback, /limit/);
    }
    // malformed answers
    const data = I.buildDotPuzzle(I.LAYOUTS[0], 0, [0, 0]);
    for (const bad of [null, {}, { points: 'x' }, { points: [[0, 0]] }, { points: [[0, 0], ['a', 1]] }]) {
        assert.equal(P.check(data, bad).solved, false);
    }
});

test('straight-on continuation counts as one line', () => {
    const data = I.buildDotPuzzle(I.LAYOUTS.find(l => l.id === 'grid2x5'), 0, [0, 0]);
    // walk each row dot by dot: still only 3 lines
    const pts = [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1]];
    assert.equal(P.check(data, { type: 'polyline', points: pts }).solved, true);
});

test('Euler path checker accepts valid paths and rejects retracing, jumps and gaps', () => {
    const graphs = Object.keys(I.FIGURES).map(id => I.buildFigure(Rift.makeRng(id), id));
    for (const d of [1, 2, 3]) many(d, 120, data => { if (data.mode === 'graph') graphs.push(data); });
    let possibleSeen = 0;
    for (const g of graphs) {
        const path = I.eulerPath(g);
        if (!path) continue;
        possibleSeen++;
        assert.equal(P.check(g, { type: 'path', vertices: path }).solved, true, g.name);
        assert.equal(P.check(g, { type: 'path', vertices: path.slice().reverse() }).solved, true);
        // incomplete
        assert.equal(P.check(g, { type: 'path', vertices: path.slice(0, -1) }).solved, false);
        // retrace the first edge, then carry on
        const retrace = [path[0], path[1], path[0]].concat(path.slice(1));
        const r = P.check(g, { type: 'path', vertices: retrace });
        assert.equal(r.solved, false);
        assert.match(r.feedback, /twice/);
        // a jump between two dots with no line
        const n = g.vertices.length;
        const keys = new Set(g.edges.map(([a, b]) => Math.min(a, b) + '-' + Math.max(a, b)));
        let jump = null;
        for (let a = 0; a < n && !jump; a++) for (let b = a + 1; b < n && !jump; b++) if (!keys.has(a + '-' + b)) jump = [a, b];
        if (jump) assert.match(P.check(g, { type: 'path', vertices: jump }).feedback, /no line/);
    }
    assert.ok(possibleSeen > 50);
});

test('impossible figures are exactly the connected ones with more than two odd vertices', () => {
    const graphs = Object.keys(I.FIGURES).map(id => I.buildFigure(Rift.makeRng(id), id));
    for (const d of [1, 2, 3]) many(d, 200, data => { if (data.mode === 'graph') graphs.push(data); });
    let imp = 0, pos = 0;
    for (const g of graphs) {
        assert.ok(I.isConnected(g), 'figure must be connected');
        const odd = I.oddVertices(g);
        const sol = P.solve(g);
        if (odd.length > 2) {
            imp++;
            assert.equal(sol.type, 'impossible');
            assert.equal(I.eulerPath(g), null);
            assert.equal(P.check(g, sol).solved, true);
            // a proof missing one odd vertex, or with an extra even one, fails
            assert.equal(P.check(g, { type: 'impossible', odd: odd.slice(1) }).solved, false);
            const even = g.vertices.map((_, i) => i).find(i => !odd.includes(i));
            if (even !== undefined) assert.equal(P.check(g, { type: 'impossible', odd: odd.concat([even]) }).solved, false);
        } else {
            pos++;
            assert.equal(sol.type, 'path');
            assert.equal(P.check(g, sol).solved, true);
            // claiming impossibility on a possible figure is wrong, whatever is picked
            assert.equal(P.check(g, { type: 'impossible', odd }).solved, false);
            assert.equal(P.check(g, { type: 'impossible', odd: g.vertices.map((_, i) => i) }).solved, false);
        }
    }
    assert.ok(imp > 20 && pos > 20, imp + ' impossible, ' + pos + ' possible');
    // the named classics are what we think they are
    const fig = id => I.buildFigure(Rift.makeRng(1), id);
    assert.equal(I.oddVertices(fig('bridges')).length, 4);
    assert.equal(I.oddVertices(fig('envelope')).length, 4);
    assert.equal(I.oddVertices(fig('twoHouses')).length, 4);
    assert.equal(I.oddVertices(fig('nikolaus')).length, 2);
});

test('difficulty mix: level 1 never impossible, levels 2-3 sometimes; 4×4 in 6 appears at level 3', () => {
    const imp = { 1: 0, 2: 0, 3: 0 }, dots = { 1: 0, 2: 0, 3: 0 }, graph = { 1: 0, 2: 0, 3: 0 };
    let grid44 = 0;
    for (const d of [1, 2, 3]) many(d, 300, data => {
        assert.equal(data.difficulty, d);
        if (data.mode === 'dots') {
            dots[d]++;
            if (data.layout === 'grid4x4') { grid44++; assert.equal(data.maxLines, 6); }
        } else {
            graph[d]++;
            assert.ok(data.vertices.length >= 4 && data.vertices.length <= 11);
            if (I.oddVertices(data).length > 2) imp[d]++;
        }
    });
    assert.equal(imp[1], 0);
    assert.ok(imp[2] > 10 && imp[3] > 10, JSON.stringify(imp));
    for (const d of [1, 2, 3]) assert.ok(dots[d] > 50 && graph[d] > 50);
    assert.ok(grid44 > 0);
});

test('the classic 3×3 nine-dot layout never appears', () => {
    // sanity: the detector recognises it, even rotated and shifted
    const nine = [];
    for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) nine.push([x + 5, y - 2]);
    assert.equal(I.isNineDot(nine), true);
    assert.equal(I.isNineDot(nine.map(([x, y]) => [x + y, y - x])), true);
    assert.equal(I.isNineDot(nine.slice(0, 8).concat([[9, 9]])), false);
    for (const l of I.LAYOUTS) assert.equal(I.isNineDot(l.dots), false, l.id);
    for (const d of [1, 2, 3]) many(d, 500, data => {
        if (data.mode === 'dots') assert.equal(I.isNineDot(data.dots), false, data.layout);
    });
    for (let s = 0; s < 200; s++) {
        const sc = I.buildScattered(Rift.makeRng('sc' + s), 3 + (s % 2));
        if (sc) assert.equal(I.isNineDot(sc.dots), false);
    }
});

test('generation is deterministic per seed', () => {
    for (const d of [1, 2, 3]) for (let s = 0; s < 40; s++) {
        const a = P.generate(Rift.makeRng('det' + s), d), b = P.generate(Rift.makeRng('det' + s), d);
        assert.deepEqual(a, b);
        assert.equal(JSON.stringify(JSON.parse(JSON.stringify(a))), JSON.stringify(a), "data must be JSON-safe");
    }
    const shapes = new Set();
    for (let s = 0; s < 40; s++) shapes.add(JSON.stringify(P.generate(Rift.makeRng('var' + s), 2)));
    assert.ok(shapes.size > 30);
});

test('hints and why are well-formed', () => {
    for (const d of [1, 2, 3]) many(d, 60, data => {
        const h = P.hints(data);
        assert.ok(h.length >= 3 && h.every(x => typeof x === 'string' && x.length > 10));
        const w = P.why(data);
        assert.equal(w.options.length, 4);
        assert.ok(w.correct >= 0 && w.correct < 4);
        assert.ok(/odd|assum|box/i.test(w.options[w.correct]));
    });
    const imp = I.buildFigure(Rift.makeRng(3), 'bridges');
    assert.match(P.hints(imp)[0], /odd/);
    const g44 = I.buildDotPuzzle(I.LAYOUTS.find(l => l.id === 'grid4x4'), 0, [0, 0]);
    assert.ok(P.hints(g44).some(h => /leave the box/.test(h)));
});
