// Feasibility experiment for issue #138 (Lean validation of open-ended logic puzzles).
//
// ISOLATED: nothing here is loaded by the game. It reads the game's classic
// scripts through the existing Node test harness (tools/test/harness.mjs) and
// never writes to the game folder.
//
// Question: how far does a plain synchronous JavaScript property checker at the
// existing check(data, answer) boundary already go for open-ended tasks?
//
//   Part A  Open-grid gate construction (a new Switchboard-style task).
//           Two structurally different valid circuits pass, near-misses fail
//           with a counterexample row, and behaviourally correct circuits that
//           break a placement or toolbox rule fail. Seeded generated tasks are
//           classified as impossible / unique / multiple by exhaustive search.
//   Part B  Knights and knaves (Liar's Gate model, plus the village).
//           The shipped generators are re-audited for uniqueness with an
//           independent enumerator; raw random statement sets show how often
//           tasks are contradictory or ambiguous; an open-verdict checker and a
//           "write your own gate" construction checker are exercised.
//
// Run from anywhere:  node research/lean-validation-2026-10-14/experiment.mjs
// Exit code 0 = every expectation held.

import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GAME = path.resolve(HERE, '..', '..', 'AOK', 'Mathematics', 'Rift of Reason');
const { loadRift } = await import(pathToFileURL(path.join(GAME, 'tools', 'test', 'harness.mjs')).href);

const Rift = loadRift(['js/core/rift.js', 'data/creatures.js', 'js/puzzles/registry.js',
    'js/puzzles/switchboard.js', 'js/puzzles/liars-gate.js', 'js/puzzles/village.js']);
const SB = Rift.Puzzles.get('switchboard');
const LG = Rift.Puzzles.get('liars-gate');
const VI = Rift.Puzzles.get('village');

let failures = 0;
function expect(label, cond, detail) {
    if (!cond) failures++;
    console.log((cond ? '  PASS ' : '  FAIL ') + label + (detail ? '\n         ' + detail : ''));
}
const ms = ns => (Number(ns) / 1e6).toFixed(3);
function timeIt(fn, reps) {
    for (let i = 0; i < Math.min(50, reps); i++) fn();               // warm-up
    const t0 = process.hrtime.bigint();
    for (let i = 0; i < reps; i++) fn();
    return (process.hrtime.bigint() - t0) / BigInt(reps);
}

// =====================================================================
// PART A. Open-grid gate construction
// =====================================================================
//
// Task data (JSON-safe, what generate() would return):
//   { inputs: ['A','B'], target: [bool × 2^n]   (row r: input i ON iff bit n-1-i of r)
//     board: { cols, rows, blocked: [[col,row], ...] },
//     toolbox: { AND, OR, NOT },               (how many of each plaque exist)
//     maxPieces }
// Rules shown to the player:
//   1. Put plaques on free board cells. Cracked cells cannot hold a plaque.
//   2. Use at most the plaques in the toolbox.
//   3. Wires flow left to right: a plaque may only take input from a switch or
//      from a plaque in a column further left.
//   4. Each plaque's output wire goes to one place only (switches may fan out).
//   5. The bulb must match the target in every row.
// Answer:
//   { pieces: [{ id, op, at: [col,row], in: [src, src?] }], bulb: src }
//   src = an input letter ('A') or a piece id.

const ARITY = { AND: 2, OR: 2, NOT: 1 };
const rowBits = (r, n) => Array.from({ length: n }, (_, i) => !!((r >> (n - 1 - i)) & 1));
const rowText = (task, r) => rowBits(r, task.inputs.length).map((v, i) => task.inputs[i] + (v ? ' ON' : ' off')).join(', ');

function checkGate(task, answer) {
    const fail = (code, feedback, extra) => Object.assign({ solved: false, partial: 0, code, feedback }, extra || {});
    if (!answer || !Array.isArray(answer.pieces)) return fail('format', 'Place some plaques first.');
    const n = task.inputs.length;
    const pieces = answer.pieces;
    const byId = {};
    const cellUsed = {};
    const used = { AND: 0, OR: 0, NOT: 0 };
    const isBlocked = (c, r) => task.board.blocked.some(([bc, br]) => bc === c && br === r);
    // ---- placement and toolbox (checked before behaviour, so a correct bulb
    //      cannot hide a broken rule) ----
    for (const p of pieces) {
        if (!p || !ARITY[p.op]) return fail('tool', 'That plaque is not in the toolbox.');
        if (byId[p.id]) return fail('format', 'Two plaques share a name.');
        byId[p.id] = p;
        const [c, r] = Array.isArray(p.at) ? p.at : [];
        if (!(Number.isInteger(c) && Number.isInteger(r) && c >= 0 && r >= 0 && c < task.board.cols && r < task.board.rows)) {
            return fail('placement', 'A plaque is off the board.');
        }
        if (isBlocked(c, r)) return fail('placement', 'The ' + p.op + ' plaque sits on a cracked cell (column ' + (c + 1) + ', row ' + (r + 1) + '). Cracked cells cannot hold a plaque.');
        if (cellUsed[c + ',' + r]) return fail('placement', 'Two plaques are on the same cell.');
        cellUsed[c + ',' + r] = true;
        used[p.op]++;
    }
    for (const op of Object.keys(used)) {
        if (used[op] > (task.toolbox[op] || 0)) {
            return fail('tool', 'You used ' + used[op] + ' ' + op + ' plaques, but the toolbox has ' + (task.toolbox[op] || 0) + '. Can you build the same behaviour with other plaques?');
        }
    }
    if (pieces.length > task.maxPieces) return fail('tool', 'Use at most ' + task.maxPieces + ' plaques.');
    // ---- wiring ----
    const colOf = src => (task.inputs.includes(src) ? -1 : byId[src] ? byId[src].at[0] : null);
    const fed = {};
    const takeOutput = (src, where) => {
        if (task.inputs.includes(src)) return null;
        if (!byId[src]) return fail('wiring', 'A wire ' + where + ' comes from nowhere.');
        if (fed[src]) return fail('wiring', 'The ' + byId[src].op + ' plaque in column ' + (byId[src].at[0] + 1) + ' sends its output to two places. Each plaque has one output wire.');
        fed[src] = true;
        return null;
    };
    for (const p of pieces) {
        const ins = Array.isArray(p.in) ? p.in : [];
        for (let j = 0; j < ARITY[p.op]; j++) {
            if (ins[j] == null) return fail('wiring', 'The ' + p.op + ' plaque in column ' + (p.at[0] + 1) + ' needs ' + (ARITY[p.op] === 1 ? 'a wire' : 'two wires') + ' coming in.');
            const col = colOf(ins[j]);
            if (col == null) return fail('wiring', 'A wire into the ' + p.op + ' plaque comes from nowhere.');
            if (col >= p.at[0]) return fail('placement', 'A wire into the ' + p.op + ' plaque in column ' + (p.at[0] + 1) + ' comes from column ' + (col + 1) + '. Wires flow left to right.');
            const e = takeOutput(ins[j], 'into the ' + p.op + ' plaque');
            if (e) return e;
        }
    }
    if (answer.bulb == null) return fail('wiring', 'Nothing is wired to the bulb yet.');
    const eb = takeOutput(answer.bulb, 'into the bulb');
    if (eb) return eb;
    // ---- behaviour: every row (exhaustive, 2^n rows) ----
    const val = (src, v) => {
        const i = task.inputs.indexOf(src);
        if (i >= 0) return v[i];
        const p = byId[src];
        const a = val(p.in[0], v);
        return p.op === 'NOT' ? !a : p.op === 'AND' ? a && val(p.in[1], v) : a || val(p.in[1], v);
    };
    const rows = 1 << n;
    const table = Array.from({ length: rows }, (_, r) => val(answer.bulb, rowBits(r, n)));
    const wrong = table.map((v, r) => (v !== task.target[r] ? r : -1)).filter(r => r >= 0);
    if (wrong.length) {
        const r = wrong[0];
        return fail('behaviour', 'Row ' + (r + 1) + ' (' + rowText(task, r) + '): your bulb is ' + (table[r] ? 'lit' : 'dark') + ', but the target says ' + (task.target[r] ? 'lit' : 'dark') + '. '
            + wrong.length + ' of ' + rows + ' rows differ.', { partial: (rows - wrong.length) / rows, counterexample: r });
    }
    const spare = pieces.length - Object.keys(fed).length;
    return {
        solved: true, partial: 1, code: 'ok',
        feedback: 'All ' + rows + ' rows match, with ' + pieces.length + ' plaques' + (spare ? ' (' + spare + ' not connected)' : '') + '. Every case checked.',
    };
}

// ---- A1: a hand-made task built to allow several constructions ----
// "The bridge is safe when exactly one of A and B is true" (exclusive or).
const XOR = {
    inputs: ['A', 'B'],
    target: [false, true, true, false],
    board: { cols: 3, rows: 3, blocked: [[1, 0]] },
    toolbox: { AND: 2, OR: 1, NOT: 2 },
    maxPieces: 5,
};
const sub = {
    // (A OR B) AND NOT (A AND B)  : 4 plaques, depth 3
    orAndNotBoth: { pieces: [
        { id: 'p1', op: 'OR', at: [0, 0], in: ['A', 'B'] },
        { id: 'p2', op: 'AND', at: [0, 1], in: ['A', 'B'] },
        { id: 'p3', op: 'NOT', at: [1, 1], in: ['p2'] },
        { id: 'p4', op: 'AND', at: [2, 0], in: ['p1', 'p3'] },
    ], bulb: 'p4' },
    // (A AND NOT B) OR (NOT A AND B)  : 5 plaques, a different shape
    sumOfProducts: { pieces: [
        { id: 'n1', op: 'NOT', at: [0, 0], in: ['A'] },
        { id: 'n2', op: 'NOT', at: [0, 2], in: ['B'] },
        { id: 'a1', op: 'AND', at: [1, 1], in: ['A', 'n2'] },
        { id: 'a2', op: 'AND', at: [1, 2], in: ['n1', 'B'] },
        { id: 'o1', op: 'OR', at: [2, 1], in: ['a1', 'a2'] },
    ], bulb: 'o1' },
    // near-miss 1: forgot "not both"
    justOr: { pieces: [{ id: 'p1', op: 'OR', at: [0, 0], in: ['A', 'B'] }], bulb: 'p1' },
    // near-miss 2: the NOT is wired to A instead of to (A AND B): (A OR B) AND NOT A
    wrongWire: { pieces: [
        { id: 'p1', op: 'OR', at: [0, 0], in: ['A', 'B'] },
        { id: 'p3', op: 'NOT', at: [1, 1], in: ['A'] },
        { id: 'p4', op: 'AND', at: [2, 0], in: ['p1', 'p3'] },
    ], bulb: 'p4' },
    // near-miss 3: last plaque OR instead of AND. This also breaks the toolbox
    // (two ORs); the checker reports rules before behaviour.
    wrongLast: { pieces: [
        { id: 'p1', op: 'OR', at: [0, 0], in: ['A', 'B'] },
        { id: 'p2', op: 'AND', at: [0, 1], in: ['A', 'B'] },
        { id: 'p3', op: 'NOT', at: [1, 1], in: ['p2'] },
        { id: 'p4', op: 'OR', at: [2, 0], in: ['p1', 'p3'] },
    ], bulb: 'p4' },
    // correct behaviour, but a plaque on the cracked cell (placement rule)
    onCrack: { pieces: [
        { id: 'p1', op: 'OR', at: [0, 0], in: ['A', 'B'] },
        { id: 'p2', op: 'AND', at: [0, 1], in: ['A', 'B'] },
        { id: 'p3', op: 'NOT', at: [1, 0], in: ['p2'] },
        { id: 'p4', op: 'AND', at: [2, 0], in: ['p1', 'p3'] },
    ], bulb: 'p4' },
    // correct behaviour, but two OR plaques (toolbox has one): (A OR B) AND (NOT A OR NOT B)
    deMorgan: { pieces: [
        { id: 'p1', op: 'OR', at: [0, 0], in: ['A', 'B'] },
        { id: 'n1', op: 'NOT', at: [0, 1], in: ['A'] },
        { id: 'n2', op: 'NOT', at: [0, 2], in: ['B'] },
        { id: 'p2', op: 'OR', at: [1, 1], in: ['n1', 'n2'] },
        { id: 'p3', op: 'AND', at: [2, 0], in: ['p1', 'p2'] },
    ], bulb: 'p3' },
    // correct behaviour, but a wire runs right to left (placement rule)
    backwards: { pieces: [
        { id: 'p1', op: 'OR', at: [2, 2], in: ['A', 'B'] },
        { id: 'p2', op: 'AND', at: [0, 1], in: ['A', 'B'] },
        { id: 'p3', op: 'NOT', at: [1, 1], in: ['p2'] },
        { id: 'p4', op: 'AND', at: [2, 0], in: ['p1', 'p3'] },
    ], bulb: 'p4' },
};

// An independent check that the "breaks a rule" submissions really behave correctly,
// using the Switchboard's own evaluator (js/puzzles/switchboard.js internals.truthTable).
function behaviourBySwitchboard(task, answer) {
    const map = {};
    task.inputs.forEach((x, i) => { map[x] = 'S' + i; });
    answer.pieces.forEach(p => { map[p.id] = p.id; });
    const gates = answer.pieces.map(p => ({ id: p.id, op: p.op, in: p.in.map(s => map[s]) }));
    const t = SB.internals.truthTable(gates, map[answer.bulb], task.inputs.length);
    return !t.error && t.table.every((v, r) => v === task.target[r]);
}

console.log('PART A. Open-grid gate construction (exclusive or, 3x3 board, cracked cell at column 2 row 1,');
console.log('        toolbox AND x2, OR x1, NOT x2, at most 5 plaques)\n');
const show = (name, res) => console.log('    ' + name.padEnd(14) + ' -> solved=' + res.solved + ' [' + res.code + '] ' + res.feedback);
const rA = {};
for (const k of Object.keys(sub)) { rA[k] = checkGate(XOR, sub[k]); show(k, rA[k]); }
console.log();
expect('two structurally different valid circuits both pass', rA.orAndNotBoth.solved && rA.sumOfProducts.solved);
expect('near-miss "just OR" fails on behaviour with a counterexample row (row 4: A ON, B ON)', !rA.justOr.solved && rA.justOr.code === 'behaviour' && rA.justOr.counterexample === 3);
expect('near-miss "wrong wire" fails on behaviour with partial credit 3/4 and counterexample row 3', !rA.wrongWire.solved && rA.wrongWire.code === 'behaviour' && rA.wrongWire.partial === 0.75 && rA.wrongWire.counterexample === 2);
expect('near-miss "wrong last plaque" (also two ORs) is reported as a toolbox break, not behaviour', !rA.wrongLast.solved && rA.wrongLast.code === 'tool');
const brokenButCorrect = ['onCrack', 'deMorgan', 'backwards'];
expect('the three rule-breaking circuits really do produce the target (Switchboard evaluator)', brokenButCorrect.every(k => behaviourBySwitchboard(XOR, sub[k])));
expect('cracked-cell circuit fails on placement', !rA.onCrack.solved && rA.onCrack.code === 'placement');
expect('two-OR circuit fails on the toolbox rule', !rA.deMorgan.solved && rA.deMorgan.code === 'tool');
expect('right-to-left wire fails on placement', !rA.backwards.solved && rA.backwards.code === 'placement');
expect('the checker is deterministic (same answer, same result)', JSON.stringify(checkGate(XOR, sub.sumOfProducts)) === JSON.stringify(rA.sumOfProducts));

// ---- A2: exhaustive search over constructions (generation-time analysis) ----
// Every canonical formula tree over n inputs with up to MAXP plaques. A tree is
// exactly what rule 4 allows (plaques never share an output). "Canonical" drops
// mirror images of AND/OR (B AND A = A AND B), NOT NOT x, and x AND x; other
// differences (grouping, De Morgan forms, different plaques) count as different
// constructions.
const MAXP = 5;
function enumerateTrees(n) {
    const T = { kind: [], a: [], b: [], tt: [], and: [], or: [], not: [], size: [] };
    const bySize = [];
    const rows = 1 << n, full = (1 << rows) - 1;
    const add = (kind, a, b, tt, cA, cO, cN, s) => {
        T.kind.push(kind); T.a.push(a); T.b.push(b); T.tt.push(tt); T.and.push(cA); T.or.push(cO); T.not.push(cN); T.size.push(s);
        bySize[s].push(T.kind.length - 1);
    };
    bySize[0] = [];
    for (let i = 0; i < n; i++) {
        let tt = 0;
        for (let r = 0; r < rows; r++) if ((r >> (n - 1 - i)) & 1) tt |= 1 << r;
        add(0, i, -1, tt, 0, 0, 0, 0);
    }
    for (let s = 1; s <= MAXP; s++) {
        bySize[s] = [];
        for (const x of bySize[s - 1]) {
            if (T.kind[x] === 1) continue;                                  // no NOT NOT x
            add(1, x, -1, ~T.tt[x] & full, T.and[x], T.or[x], T.not[x] + 1, s);
        }
        for (let i = 0; i <= (s - 1) / 2; i++) {
            const j = s - 1 - i;
            const L = bySize[i], R = bySize[j];
            for (let p = 0; p < L.length; p++) {
                for (let q = i === j ? p + 1 : 0; q < R.length; q++) {     // p < q when sizes tie: no mirrors, no x AND x
                    const x = L[p], y = R[q];
                    const cA = T.and[x] + T.and[y], cO = T.or[x] + T.or[y], cN = T.not[x] + T.not[y];
                    add(2, x, y, T.tt[x] & T.tt[y], cA + 1, cO, cN, s);
                    add(3, x, y, T.tt[x] | T.tt[y], cA, cO + 1, cN, s);
                }
            }
        }
    }
    return T;
}
// The search table is hash-consed (an identical subtree is stored once), so a
// formula such as (A AND B) OR NOT (A AND B) mentions one node twice. Expand it
// into one plaque per occurrence, in post-order: { op, ins: [{ leaf } | { gate }] }.
const OPS = [null, 'NOT', 'AND', 'OR'];
function expand(T, t) {
    const gates = [];
    (function post(x) {
        if (T.kind[x] === 0) return { leaf: T.a[x] };
        const ins = [post(T.a[x])];
        if (T.kind[x] > 1) ins.push(post(T.b[x]));
        gates.push({ op: OPS[T.kind[x]], ins });
        return { gate: gates.length - 1 };
    })(t);
    return gates;
}
// Can tree t be laid out on the board? Column of a plaque > columns of its plaque
// children; each column holds at most its free cells. Backtracking (<= 5 plaques).
function layout(T, t, board) {
    const gates = expand(T, t);
    const free = [];
    for (let c = 0; c < board.cols; c++) {
        free.push([]);
        for (let r = 0; r < board.rows; r++) if (!board.blocked.some(([bc, br]) => bc === c && br === r)) free[c].push(r);
    }
    const col = [], load = new Array(board.cols).fill(0);
    function go(k) {
        if (k === gates.length) return true;
        let lo = 0;
        for (const s of gates[k].ins) if (s.gate != null) lo = Math.max(lo, col[s.gate] + 1);
        for (let c = lo; c < board.cols; c++) {
            if (load[c] >= free[c].length) continue;
            col[k] = c; load[c]++;
            if (go(k + 1)) return true;
            load[c]--;
        }
        return false;
    }
    if (!go(0)) return null;
    const used = new Array(board.cols).fill(0);
    return gates.map((_, k) => [col[k], free[col[k]][used[col[k]]++]]);
}
function treeToAnswer(T, t, at, inputs) {
    const gates = expand(T, t);
    const src = s => (s.leaf != null ? inputs[s.leaf] : 'g' + s.gate);
    const pieces = gates.map((g, k) => ({ id: 'g' + k, op: g.op, at: at[k], in: g.ins.map(src) }));
    return { pieces, bulb: 'g' + (gates.length - 1) };
}
function formulaText(T, t, inputs, top = true) {
    if (T.kind[t] === 0) return inputs[T.a[t]];
    if (T.kind[t] === 1) return 'NOT ' + formulaText(T, T.a[t], inputs, false);
    const s = formulaText(T, T.a[t], inputs, false) + (T.kind[t] === 2 ? ' AND ' : ' OR ') + formulaText(T, T.b[t], inputs, false);
    return top ? s : '(' + s + ')';
}
// All valid constructions of a task: same truth table, within toolbox, placeable.
function analyseTask(T, task) {
    const rows = 1 << task.inputs.length;
    let ttTarget = 0;
    task.target.forEach((v, r) => { if (v) ttTarget |= 1 << r; });
    const sols = [];
    for (let t = 0; t < T.kind.length; t++) {
        if (T.tt[t] !== ttTarget || T.size[t] === 0 || T.size[t] > task.maxPieces) continue;
        if (T.and[t] > task.toolbox.AND || T.or[t] > task.toolbox.OR || T.not[t] > task.toolbox.NOT) continue;
        const at = layout(T, t, task.board);
        if (at) sols.push({ t, at });
    }
    const degenerate = ttTarget === 0 || ttTarget === (1 << rows) - 1
        || [...Array(task.inputs.length).keys()].some(i => T.tt[i] === ttTarget || (~T.tt[i] & ((1 << rows) - 1)) === ttTarget);
    return { sols, degenerate, verdict: degenerate ? 'degenerate' : sols.length === 0 ? 'impossible' : sols.length === 1 ? 'unique' : 'multiple' };
}

let t0 = process.hrtime.bigint();
const TREES = { 2: enumerateTrees(2), 3: enumerateTrees(3) };
const enumNs = process.hrtime.bigint() - t0;
console.log('\n    Exhaustive search space: ' + TREES[2].kind.length + ' canonical trees over 2 inputs, ' + TREES[3].kind.length
    + ' over 3 inputs (up to ' + MAXP + ' plaques); built once in ' + ms(enumNs) + ' ms.');

const xorA = analyseTask(TREES[2], XOR);
console.log('    Exclusive-or task: ' + xorA.verdict + ', ' + xorA.sols.length + ' valid constructions, e.g.');
xorA.sols.slice(0, 6).forEach(s => console.log('      ' + formulaText(TREES[2], s.t, XOR.inputs)));
expect('exhaustive search finds several constructions for the exclusive-or task', xorA.verdict === 'multiple' && xorA.sols.length >= 2);
expect('every construction the search finds is accepted by checkGate', xorA.sols.every(s => checkGate(XOR, treeToAnswer(TREES[2], s.t, s.at, XOR.inputs)).solved));
const noNot = Object.assign({}, XOR, { toolbox: { AND: 3, OR: 3, NOT: 0 } });
expect('removing every NOT makes the task impossible (exclusive or is not monotone) and the search says so', analyseTask(TREES[2], noNot).verdict === 'impossible');

// ---- A3: seeded generated tasks ----
// Target: a random Switchboard circuit (js/puzzles/switchboard.js internals.randomCircuit,
// which already rejects circuits that ignore a switch or waste a plaque).
// Toolbox: the reference circuit's plaques, plus a spare; in a third of tasks one
// needed plaque is removed instead, so some tasks may become impossible.
function genGateTask(seed) {
    const rng = Rift.makeRng('gate-task:' + seed);
    const n = rng.pick([2, 3]);
    const c = SB.internals.randomCircuit(rng, n, rng.int(2, 3), 1);
    if (!c) return null;
    const target = SB.internals.truthTable(c.gates, c.out, n).table;
    const toolbox = { AND: 0, OR: 0, NOT: 0 };
    c.gates.forEach(g => { toolbox[g.op]++; });
    const squeeze = rng.chance(1 / 3);
    if (squeeze) { const g = rng.pick(c.gates); toolbox[g.op]--; } else toolbox[rng.pick(['AND', 'OR', 'NOT'])]++;
    const blocked = [];
    const nb = rng.int(1, 2);
    while (blocked.length < nb) {
        const cell = [rng.int(0, 2), rng.int(0, 2)];
        if (!blocked.some(b => b[0] === cell[0] && b[1] === cell[1])) blocked.push(cell);
    }
    return { seed, squeeze, inputs: ['A', 'B', 'C'].slice(0, n), target, board: { cols: 3, rows: 3, blocked }, toolbox, maxPieces: 5, reference: c };
}
console.log('\n    Seeded generated gate tasks (seed "gate-task:<i>"):');
console.log('      seed  inputs  toolbox (A/O/N)  cracked  squeezed  verdict     constructions');
const tally = { impossible: 0, unique: 0, multiple: 0, degenerate: 0 };
const bySqueeze = { squeezed: {}, withSpare: {} };
let agree = true, nearMissOk = true, analyseNs = 0n, checked = 0;
const N_TASKS = 200;
for (let i = 0; i < N_TASKS; i++) {
    const task = genGateTask(i);
    if (!task) continue;
    const T = TREES[task.inputs.length];
    const s0 = process.hrtime.bigint();
    const an = analyseTask(T, task);
    analyseNs += process.hrtime.bigint() - s0;
    tally[an.verdict]++;
    const sk = task.squeeze ? 'squeezed' : 'withSpare';
    bySqueeze[sk][an.verdict] = (bySqueeze[sk][an.verdict] || 0) + 1;
    if (i < 12) {
        console.log('      ' + String(i).padStart(4) + '  ' + String(task.inputs.length).padStart(6) + '  '
            + (task.toolbox.AND + '/' + task.toolbox.OR + '/' + task.toolbox.NOT).padEnd(15) + '  ' + task.board.blocked.map(b => (b[0] + 1) + '.' + (b[1] + 1)).join(' ').padEnd(7)
            + '  ' + String(task.squeeze).padEnd(8) + '  ' + an.verdict.padEnd(10) + '  ' + an.sols.length);
    }
    // every found construction must pass the checker; a one-plaque mutation that changes behaviour must fail
    for (const s of an.sols.slice(0, 20)) {
        const ans = treeToAnswer(T, s.t, s.at, task.inputs);
        if (!checkGate(task, ans).solved) agree = false;
        const flip = JSON.parse(JSON.stringify(ans));
        const bin = flip.pieces.find(p => p.op !== 'NOT');
        if (bin) {
            bin.op = bin.op === 'AND' ? 'OR' : 'AND';
            if (task.toolbox[bin.op] >= flip.pieces.filter(p => p.op === bin.op).length) {
                const r = checkGate(task, flip);
                const same = behaviourBySwitchboard(task, flip);
                if (r.solved !== same) nearMissOk = false;
                if (!r.solved && r.code === 'behaviour' && r.counterexample == null) nearMissOk = false;
            }
        }
        checked++;
    }
}
console.log('      ... ' + N_TASKS + ' tasks: ' + JSON.stringify(tally));
console.log('      split: one plaque removed ' + JSON.stringify(bySqueeze.squeezed) + '; one spare added ' + JSON.stringify(bySqueeze.withSpare));
expect('generation-time search classifies every seeded task (impossible / unique / multiple)', tally.impossible + tally.unique + tally.multiple + tally.degenerate === N_TASKS);
expect('squeezed toolboxes produce some impossible tasks, which the search detects', tally.impossible > 0);
expect('checker accepts every construction the search found (' + checked + ' checked)', agree);
expect('AND<->OR mutations: checker verdict agrees with the Switchboard evaluator, failures carry a counterexample row', nearMissOk);
const again = genGateTask(7), again2 = genGateTask(7);
expect('generated tasks repeat exactly for the same seed', JSON.stringify(again) === JSON.stringify(again2));
console.log('    Mean generation-time analysis per task: ' + ms(analyseNs / BigInt(N_TASKS)) + ' ms (after the one-off tree build).');

// =====================================================================
// PART B. Knights and knaves
// =====================================================================
// An independent evaluator for the Liar's Gate statement AST (not the game's own).
function ev(node, honest, door) {
    switch (node.t) {
        case 'honest': return honest[node.g];
        case 'liar': return !honest[node.g];
        case 'safe': return door === node.d;
        case 'trap': return door !== node.d;
        case 'and': return ev(node.a, honest, door) && ev(node.b, honest, door);
        case 'or': return ev(node.a, honest, door) || ev(node.b, honest, door);
        case 'if': return !ev(node.a, honest, door) || ev(node.b, honest, door);
        case 'same': return honest[node.g] === honest[node.h];
        case 'diff': return honest[node.g] !== honest[node.h];
        case 'count': {
            const c = honest.filter(h => (node.kind === 'honest' ? h : !h)).length;
            return node.op === 'exactly' ? c === node.n : node.op === 'atLeast' ? c >= node.n : c <= node.n;
        }
    }
    throw new Error('node ' + node.t);
}
function worldsOf(says, k) {
    const n = says.length, out = [];
    for (let m = 0; m < (1 << n); m++) {
        const honest = Array.from({ length: n }, (_, i) => !!(m & (1 << i)));
        for (let d = 0; d < k; d++) if (says.every((s, i) => ev(s, honest, d) === honest[i])) out.push({ honest, door: d });
    }
    return out;
}
const DOORS = ['left', 'right', 'middle'];
const worldText = (w, names) => names.map((nm, i) => nm + (w.honest[i] ? ' honest' : ' liar')).join(', ') + '; ' + DOORS[w.door] + ' door safe';

console.log('\nPART B. Knights and knaves\n');

// ---- B1: re-audit the shipped generators ----
let lgAgree = true, lgUnique = true;
const lgNs = [];
for (const d of [1, 2, 3]) {
    const s0 = process.hrtime.bigint();
    for (let i = 0; i < 300; i++) {
        const data = LG.generate(Rift.makeRng('exp-lg-' + d + '-' + i), d);
        const says = data.guards.map(g => g.says);
        const mine = worldsOf(says, data.doors.length);
        const theirs = LG._internal.solutions(says, data.doors.length);
        if (mine.length !== theirs.length) lgAgree = false;
        if (mine.length !== 1) lgUnique = false;
    }
    lgNs.push(ms((process.hrtime.bigint() - s0) / 300n));
}
expect("Liar's Gate: 900 seeded puzzles (300 per difficulty) each have exactly one consistent world", lgUnique);
expect("Liar's Gate: the independent enumerator agrees with the game's solver on every one", lgAgree);
console.log("    Mean generate + double enumeration per Liar's Gate puzzle (ms, d1/d2/d3): " + lgNs.join(' / '));
let viUnique = true;
for (const d of [1, 2, 3]) for (let i = 0; i < 100; i++) {
    const data = VI.generate(Rift.makeRng('exp-vi-' + d + '-' + i), d);
    const k = data.hiddenCount ? null : data.imps;
    if (VI._internal.solutions(data.villagers.map(v => v.says), k).length !== 1) viUnique = false;
}
expect('Village: 300 seeded squares (100 per difficulty) each have exactly one consistent world', viUnique);

// ---- B2: raw random statement sets, without the generator's filtering ----
function randomStatement(rng, s, n, k) {
    const other = () => { let g; do { g = rng.int(0, n - 1); } while (g === s && n > 1); return g; };
    const role = () => ({ t: rng.chance(0.5) ? 'honest' : 'liar', g: other() });
    const door = () => ({ t: rng.chance(0.5) ? 'safe' : 'trap', d: rng.int(0, k - 1) });
    const atom = () => (rng.chance(0.55) ? role() : door());
    const r = rng.next();
    if (r < 0.3) return atom();
    if (r < 0.45) return { t: 'and', a: atom(), b: atom() };
    if (r < 0.6) return { t: 'or', a: atom(), b: atom() };
    if (r < 0.75) return { t: 'if', a: rng.chance(0.4) ? { t: 'honest', g: s } : atom(), b: atom() };
    if (r < 0.88) return { t: 'same', g: s, h: other() };
    return { t: 'diff', g: other(), h: other() };
}
console.log('\n    Raw random statement sets (1,000 per size, seed "raw-kk:<n>:<k>:<i>"), classified by enumeration:');
console.log('      guards doors  contradictory  unique  ambiguous(door fixed)  ambiguous(door open)');
for (const [n, k] of [[2, 2], [3, 2], [4, 3], [5, 3]]) {
    const c = { zero: 0, one: 0, fixed: 0, open: 0 };
    for (let i = 0; i < 1000; i++) {
        const rng = Rift.makeRng('raw-kk:' + n + ':' + k + ':' + i);
        const says = Array.from({ length: n }, (_, s) => randomStatement(rng, s, n, k));
        const w = worldsOf(says, k);
        if (!w.length) c.zero++;
        else if (w.length === 1) c.one++;
        else if (new Set(w.map(x => x.door)).size === 1) c.fixed++;
        else c.open++;
    }
    console.log('      ' + String(n).padStart(6) + ' ' + String(k).padStart(5) + '  ' + String(c.zero).padStart(13) + '  ' + String(c.one).padStart(6) + '  '
        + String(c.fixed).padStart(21) + '  ' + String(c.open).padStart(20));
}
const repeatA = JSON.stringify(Array.from({ length: 3 }, (_, s) => randomStatement(Rift.makeRng('raw-kk:3:2:5'), s, 3, 2)));
const repeatB = JSON.stringify(Array.from({ length: 3 }, (_, s) => randomStatement(Rift.makeRng('raw-kk:3:2:5'), s, 3, 2)));
expect('raw statement sets repeat exactly for the same seed', repeatA === repeatB);

// ---- B3: an open-verdict checker ----
// The player may answer that the gate is settled (give the world), contradictory
// (no world fits), or open (two worlds fit with different safe doors).
// Answer: { world: { honest: [bool], door } } | { verdict: 'contradictory' } | { verdict: 'open', worlds: [w, w] }
function checkKK(task, answer) {
    const all = worldsOf(task.says, task.doors);
    const fits = w => task.says.every((s, i) => ev(s, w.honest, w.door) === w.honest[i]);
    const clash = w => {
        const i = task.says.findIndex((s, j) => ev(s, w.honest, w.door) !== w.honest[j]);
        return task.names[i] + (w.honest[i] ? ' is honest in your world, but says something false there.' : ' is a liar in your world, but says something true there.');
    };
    const doorsOpen = new Set(all.map(w => w.door)).size > 1;
    if (answer.verdict === 'contradictory') {
        return all.length === 0
            ? { solved: true, feedback: 'Right: every one of the ' + (1 << task.says.length) * task.doors + ' worlds breaks a statement. These premises cannot all hold.' }
            : { solved: false, feedback: 'At least one world fits all the statements. Look for it before calling the gate impossible.' };
    }
    if (answer.verdict === 'open') {
        const [a, b] = answer.worlds || [];
        if (!a || !b) return { solved: false, feedback: 'Show two worlds.' };
        if (!fits(a)) return { solved: false, feedback: 'Your first world does not fit: ' + clash(a) };
        if (!fits(b)) return { solved: false, feedback: 'Your second world does not fit: ' + clash(b) };
        if (a.door === b.door) return { solved: false, feedback: 'Both your worlds fit, but they agree on the safe door. To show the door is not settled, find two worlds with different safe doors.' };
        return { solved: true, feedback: 'Both worlds fit every statement and disagree about the door. The guards do not settle it.' };
    }
    const w = answer.world;
    if (!w) return { solved: false, feedback: 'Mark the guards and pick a door.' };
    if (!fits(w)) return { solved: false, feedback: clash(w) };
    if (all.length > 1) {
        const other = all.find(x => x.door !== w.door) || all.find(x => x.honest.some((h, i) => h !== w.honest[i]));
        return { solved: false, feedback: 'Your world fits, but so does another: ' + worldText(other, task.names) + '. ' + (doorsOpen ? 'The door is not settled.' : 'The door is settled, but the guards are not.') };
    }
    return { solved: true, feedback: 'Your world fits, and it is the only one that does.' };
}
const NAMES3 = ['Amber', 'Basalt', 'Cobalt'];
// open: Amber "the right door is safe"; Basalt "Amber is honest"; Cobalt "Basalt is a liar"
const openGate = { names: NAMES3, doors: 2, says: [{ t: 'safe', d: 1 }, { t: 'honest', g: 0 }, { t: 'liar', g: 1 }] };
// contradictory: Amber "I am a liar" (the liar paradox)
const badGate = { names: ['Amber', 'Basalt'], doors: 2, says: [{ t: 'liar', g: 0 }, { t: 'safe', d: 0 }] };
const wOpenR = { honest: [true, true, false], door: 1 }, wOpenL = { honest: [false, false, true], door: 0 };
const b3 = {
    openOneWorld: checkKK(openGate, { world: wOpenR }),
    openTwoWorlds: checkKK(openGate, { verdict: 'open', worlds: [wOpenR, wOpenL] }),
    openTwoWorldsSwapped: checkKK(openGate, { verdict: 'open', worlds: [wOpenL, wOpenR] }),
    openSameDoor: checkKK(openGate, { verdict: 'open', worlds: [wOpenR, wOpenR] }),
    badWorld: checkKK(badGate, { world: { honest: [true, true], door: 0 } }),
    badDeclared: checkKK(badGate, { verdict: 'contradictory' }),
    openDeclaredBad: checkKK(openGate, { verdict: 'contradictory' }),
};
console.log('\n    Open-verdict checker:');
for (const k of Object.keys(b3)) console.log('      ' + k.padEnd(20) + ' -> solved=' + b3[k].solved + '  ' + b3[k].feedback);
expect('an ambiguous gate rejects a single consistent world and names a rival world', !b3.openOneWorld.solved && /another/.test(b3.openOneWorld.feedback));
expect('two consistent worlds with different doors prove the gate is open (either order)', b3.openTwoWorlds.solved && b3.openTwoWorldsSwapped.solved);
expect('two worlds with the same door do not prove openness', !b3.openSameDoor.solved);
expect('a contradictory gate is recognised by exhaustion; a world answer gets a named clash', b3.badDeclared.solved && !b3.badWorld.solved);
expect('calling a satisfiable gate contradictory fails', !b3.openDeclaredBad.solved);

// ---- B4: "write your own gate" construction ----
// Goal: give each of three guards one statement so that exactly one world fits,
// and in it the RIGHT door is safe.
// Toolbox: statement tiles honest / liar / safe / trap / same / diff / if / and;
// no 'or' or counting tiles; at most one 'and'; at most ONE statement may mention a door.
const BUILD = { names: NAMES3, doors: 2, goalDoor: 1, tiles: ['honest', 'liar', 'safe', 'trap', 'same', 'diff', 'if', 'and'], maxAnd: 1, maxDoorStatements: 1 };
function tilesOf(node, acc = []) { acc.push(node.t); if (node.a) tilesOf(node.a, acc); if (node.b) tilesOf(node.b, acc); return acc; }
function checkBuild(task, answer) {
    const says = answer && answer.says;
    if (!Array.isArray(says) || says.length !== task.names.length) return { solved: false, code: 'format', feedback: 'Give every guard one statement.' };
    const tiles = says.map(s => tilesOf(s));
    const bad = tiles.flat().find(t => !task.tiles.includes(t));
    if (bad) return { solved: false, code: 'tool', feedback: 'The "' + bad + '" tile is not in your toolbox.' };
    if (tiles.flat().filter(t => t === 'and').length > task.maxAnd) return { solved: false, code: 'tool', feedback: 'You may use the AND tile only ' + task.maxAnd + ' time.' };
    const doorTalk = tiles.map((ts, i) => (ts.some(t => t === 'safe' || t === 'trap') ? task.names[i] : null)).filter(Boolean);
    if (doorTalk.length > task.maxDoorStatements) return { solved: false, code: 'tool', feedback: doorTalk.join(' and ') + ' all talk about doors. Only one guard may mention a door.' };
    const w = worldsOf(says, task.doors);
    if (!w.length) return { solved: false, code: 'behaviour', feedback: 'No world fits your statements: the gate is a paradox. Travellers could not use it.' };
    if (w.length > 1) return { solved: false, code: 'behaviour', feedback: w.length + ' worlds fit, for example: (1) ' + worldText(w[0], task.names) + ' and (2) ' + worldText(w[1], task.names) + '. Add or change a statement to rule one out.' };
    if (w[0].door !== task.goalDoor) return { solved: false, code: 'behaviour', feedback: 'Exactly one world fits, but in it the ' + DOORS[w[0].door] + ' door is safe, not the ' + DOORS[task.goalDoor] + '.' };
    return { solved: true, code: 'ok', feedback: 'Exactly one world fits: ' + worldText(w[0], task.names) + '. A careful traveller can deduce the right door.' };
}
const b4subs = {
    // Amber: "If I am honest, the right door is safe." Basalt: "Amber is honest." Cobalt: "Basalt is a liar."
    selfIf: { says: [{ t: 'if', a: { t: 'honest', g: 0 }, b: { t: 'safe', d: 1 } }, { t: 'honest', g: 0 }, { t: 'liar', g: 1 }] },
    // Amber: "Basalt and I are the same kind." Basalt: "Amber is a liar and the right door is safe." Cobalt: "Basalt is a liar."
    sameAnd: { says: [{ t: 'same', g: 0, h: 1 }, { t: 'and', a: { t: 'liar', g: 0 }, b: { t: 'safe', d: 1 } }, { t: 'liar', g: 1 }] },
    nearMiss: { says: [{ t: 'safe', d: 1 }, { t: 'honest', g: 0 }, { t: 'liar', g: 1 }] },
    tooManyDoors: { says: [{ t: 'if', a: { t: 'honest', g: 0 }, b: { t: 'safe', d: 1 } }, { t: 'if', a: { t: 'honest', g: 1 }, b: { t: 'safe', d: 1 } }, { t: 'trap', d: 0 }] },
    orTile: { says: [{ t: 'if', a: { t: 'honest', g: 0 }, b: { t: 'safe', d: 1 } }, { t: 'or', a: { t: 'honest', g: 0 }, b: { t: 'liar', g: 2 } }, { t: 'liar', g: 1 }] },
};
console.log('\n    "Write your own gate" construction (3 guards, right door must be the only safe answer):');
const b4 = {};
for (const k of Object.keys(b4subs)) { b4[k] = checkBuild(BUILD, b4subs[k]); console.log('      ' + k.padEnd(13) + ' -> solved=' + b4[k].solved + ' [' + b4[k].code + '] ' + b4[k].feedback); }
expect('two structurally different gates both pass', b4.selfIf.solved && b4.sameAnd.solved);
expect('the near-miss (two worlds fit) fails and names both worlds', !b4.nearMiss.solved && b4.nearMiss.code === 'behaviour' && /\(2\)/.test(b4.nearMiss.feedback));
const tmd = worldsOf(b4subs.tooManyDoors.says, 2);
expect('a gate with a unique right-door world, but three door statements, fails on the toolbox rule', tmd.length === 1 && tmd[0].door === 1 && !b4.tooManyDoors.solved && b4.tooManyDoors.code === 'tool');
expect('a gate that uses a tile outside the toolbox fails on the toolbox rule', !b4.orTile.solved && b4.orTile.code === 'tool');

// ---- latency at the check() boundary (measured on this machine) ----
const big = { names: ['A', 'B', 'C', 'D', 'E'], doors: 3, says: LG.generate(Rift.makeRng('exp-lg-3-0'), 3).guards.map(g => g.says) };
const bigWorld = worldsOf(big.says, 3)[0];
console.log('\n    Latency per call (mean, Node ' + process.version + '):');
console.log('      checkGate, 5-plaque circuit, 2 inputs       ' + ms(timeIt(() => checkGate(XOR, sub.sumOfProducts), 20000)) + ' ms');
console.log('      checkKK, 5 guards x 3 doors (96 worlds)     ' + ms(timeIt(() => checkKK(big, { world: bigWorld }), 5000)) + ' ms');
console.log('      checkBuild, 3 guards x 2 doors              ' + ms(timeIt(() => checkBuild(BUILD, b4subs.sameAnd), 20000)) + ' ms');
console.log("      Liar's Gate check() (game code), d3         " + ms(timeIt(() => { const d = LG.generate(Rift.makeRng('exp-lg-3-1'), 3); return LG.check(d, LG.solve(d)); }, 500)) + ' ms (includes generate)');

console.log('\n' + (failures ? failures + ' EXPECTATION(S) FAILED' : 'ALL EXPECTATIONS HELD'));
process.exit(failures ? 1 : 0);
