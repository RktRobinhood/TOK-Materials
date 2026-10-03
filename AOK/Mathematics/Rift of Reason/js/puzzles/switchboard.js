/*
 * The Switchboard: Emotion / hidden premise (chapter 2, lesson 2).
 *
 * Brass lever switches are ASSUMPTIONS (short claims), AND / OR / NOT plaques
 * are the logic, and the bulb is the CONCLUSION. Truth tables in disguise.
 *
 * Three modes, chosen by generate():
 *   'light'  : a fixed circuit. Turn on switches so the bulb lights, using the
 *              fewest switches possible ("what is the least you must assume?").
 *              data.maxOn is the smallest number that works.
 *   'wire'   : a target truth table ("the bulb must light when…") and a small
 *              palette of plaques. Wire switches through plaques to the bulb.
 *              Any wiring with the same truth table is accepted.
 *   'hidden' : (difficulty 3) one switch (or one plaque) hides behind a curtain.
 *              Witness reports give the bulb's state for some settings; deduce
 *              what is behind the curtain (the unstated premise).
 *
 * A circuit is { gates: [{ id, op: 'AND'|'OR'|'NOT', in: [src, ...] }], out: src }
 * where src is 'S<i>' (switch i) or a gate id. Truth-table rows are numbered
 * with switch A as the highest bit: row r sets switch i ON iff bit (n-1-i) of r.
 *
 * Answers:
 *   { type: 'switches', on: [bool, ...] }                           (light)
 *   { type: 'wiring', inputs: { P0: [src, src], ... }, bulb: src }  (wire)
 *   { type: 'hidden', value: bool }  or  { type: 'hidden', gate: 'AND'|'OR' }  (hidden)
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const LETTERS = ['A', 'B', 'C', 'D', 'E'];
    const ARITY = { AND: 2, OR: 2, NOT: 1 };

    // Boolesbury flavour. The logic is generated; the claims only dress it.
    const SCENARIOS = [
        { conclusion: 'The baker is an imp', premises: ['There is flour on the footprints', 'The baker was out at midnight', 'The cat is inside', 'The oven was warm', 'The Mayor tells the truth', 'The bread is purple'] },
        { conclusion: 'The clock tower is right', premises: ['The clockmaker wound it', 'The sun is up', 'The bells rang twelve', 'The cuckoo is asleep', 'It is Tuesday', 'The pigeons have left'] },
        { conclusion: 'Tea is served', premises: ['The kettle is hot', 'It is four o\'clock', 'The Queen is visiting', 'The milk is fresh', 'The cat is inside', 'It is raining'] },
        { conclusion: 'The bridge is safe', premises: ['The troll is asleep', 'The river is low', 'The planks are new', 'It is raining', 'A goat crossed it', 'The sign says SAFE'] },
        { conclusion: 'The constable arrests someone', premises: ['A window is broken', 'The constable is awake', 'The suspect ran away', 'It is raining', 'The Mayor gave the order', 'There is pie at the station'] },
        { conclusion: 'The street lamps are lit', premises: ['The lamplighter came', 'It is dark', 'There is gas in the pipes', 'The matches are dry', 'It is raining', 'The Mayor paid the bill'] },
        { conclusion: 'The post arrives today', premises: ['The postmistress is well', 'The road is open', 'It is Sunday', 'The horse has eaten', 'The letters are sorted', 'The Mayor tells the truth'] },
    ];

    // ------------------------------------------------------------------
    // Logic
    // ------------------------------------------------------------------

    function rowValues(r, n) {
        const v = [];
        for (let i = 0; i < n; i++) v.push(!!((r >> (n - 1 - i)) & 1));
        return v;
    }
    function rowIndex(values) { return values.reduce((r, v) => (r << 1) | (v ? 1 : 0), 0); }
    const countOn = values => values.filter(Boolean).length;
    const isSwitch = src => typeof src === 'string' && /^S\d+$/.test(src);

    function apply(op, xs) {
        if (op === 'AND') return xs[0] && xs[1];
        if (op === 'OR') return xs[0] || xs[1];
        return !xs[0];
    }

    // Check that everything the output depends on is wired, known, and loop-free.
    // → null if fine, else { error: 'nobulb'|'badsrc'|'incomplete'|'cycle', gate? }
    function validate(gates, out, n) {
        if (out == null || out === '') return { error: 'nobulb' };
        const byId = {};
        gates.forEach(g => { byId[g.id] = g; });
        const colour = {};
        let found = null;
        function visit(src) {
            if (found) return;
            if (isSwitch(src)) {
                if (+src.slice(1) >= n) found = { error: 'badsrc' };
                return;
            }
            const g = byId[src];
            if (!g || !ARITY[g.op]) { found = { error: 'badsrc' }; return; }
            if (colour[src] === 2) return;
            if (colour[src] === 1) { found = { error: 'cycle', gate: src }; return; }
            colour[src] = 1;
            const ins = g.in || [];
            for (let j = 0; j < ARITY[g.op]; j++) {
                if (ins[j] == null || ins[j] === '') { found = { error: 'incomplete', gate: src }; return; }
                visit(ins[j]);
                if (found) return;
            }
            colour[src] = 2;
        }
        visit(out);
        return found;
    }

    // Plain boolean evaluation; assumes validate() passed.
    function evaluate(gates, out, values) {
        const byId = {};
        gates.forEach(g => { byId[g.id] = g; });
        const memo = {};
        const val = src => {
            if (isSwitch(src)) return !!values[+src.slice(1)];
            if (src in memo) return memo[src];
            const g = byId[src];
            return (memo[src] = apply(g.op, g.in.slice(0, ARITY[g.op]).map(val)));
        };
        return val(out);
    }

    // → { table: [bool × 2^n] } or { error, gate }
    function truthTable(gates, out, n) {
        const err = validate(gates, out, n);
        if (err) return err;
        const table = [];
        for (let r = 0; r < (1 << n); r++) table.push(evaluate(gates, out, rowValues(r, n)));
        return { table };
    }

    // Three-valued signals for display: true / false / null (unknown or unwired).
    function signals(gates, values) {
        const byId = {};
        gates.forEach(g => { byId[g.id] = g; });
        const memo = {}, visiting = {};
        function val(src) {
            if (src == null) return null;
            if (isSwitch(src)) { const v = values[+src.slice(1)]; return v == null ? null : !!v; }
            if (src in memo) return memo[src];
            const g = byId[src];
            if (!g || visiting[src]) return null;
            visiting[src] = true;
            const ins = g.in || [];
            let out = null;
            if (g.op === 'NOT') { const a = val(ins[0]); out = a == null ? null : !a; }
            else if (g.op === 'AND' || g.op === 'OR') {
                const a = val(ins[0]), b = val(ins[1]);
                if (g.op === 'AND') out = a === false || b === false ? false : (a === true && b === true ? true : null);
                else out = a === true || b === true ? true : (a === false && b === false ? false : null);
            }
            visiting[src] = false;
            memo[src] = out;
            return out;
        }
        return val;
    }

    function dependsOnAll(table, n) {
        for (let i = 0; i < n; i++) {
            const bit = 1 << (n - 1 - i);
            if (!table.some((v, r) => v !== table[r ^ bit])) return false;
        }
        return true;
    }

    // Smallest number of switches ON that lights the bulb, and every such setting.
    function minimalInfo(table, n) {
        let min = Infinity;
        table.forEach((lit, r) => { if (lit) min = Math.min(min, countOn(rowValues(r, n))); });
        if (min === Infinity) return { min: null, rows: [] };
        const rows = [];
        table.forEach((lit, r) => { if (lit && countOn(rowValues(r, n)) === min) rows.push(r); });
        return { min, rows };
    }

    // Formula in words, e.g. "(A AND NOT B) OR C".
    function describe(gates, out, names) {
        const byId = {};
        gates.forEach(g => { byId[g.id] = g; });
        const nm = names || LETTERS;
        function f(src, top) {
            if (isSwitch(src)) return nm[+src.slice(1)];
            const g = byId[src];
            if (g.op === 'NOT') return 'NOT ' + f(g.in[0], false);
            const s = f(g.in[0], false) + ' ' + g.op + ' ' + f(g.in[1], false);
            return top ? s : '(' + s + ')';
        }
        return f(out, true);
    }

    // A random circuit over n switches with exactly g gates (at most maxNot NOTs),
    // every gate feeding the output, depending on every switch.
    function randomCircuit(rng, n, g, maxNot) {
        for (let attempt = 0; attempt < 80; attempt++) {
            const kMax = Math.min(maxNot || 0, g - Math.max(1, n - 1));
            if (kMax < 0) return null;
            const k = rng.int(0, kMax);
            const b = g - k;
            const pool = rng.shuffle(Array.from({ length: n }, (_, i) => 'S' + i));
            for (let e = 0; e < b - (n - 1); e++) pool.push('S' + rng.int(0, n - 1));   // fan-out
            const ops = rng.shuffle(new Array(b).fill('BIN').concat(new Array(k).fill('NOT')));
            const gates = [];
            const isNot = src => !isSwitch(src) && gates[+src.slice(1)].op === 'NOT';
            let ok = true;
            for (const op of ops) {
                const id = 'G' + gates.length;
                if (op === 'NOT') {
                    const cand = pool.map((_, i) => i).filter(i => !isNot(pool[i]));
                    if (!cand.length) { ok = false; break; }
                    const src = pool.splice(rng.pick(cand), 1)[0];
                    gates.push({ id, op: 'NOT', in: [src] });
                } else {
                    let i = 0, j = 0, tries = 0;
                    do { i = rng.int(0, pool.length - 1); j = rng.int(0, pool.length - 1); } while ((i === j || pool[i] === pool[j]) && ++tries < 40);
                    if (i === j || pool[i] === pool[j]) { ok = false; break; }
                    const a = pool[i], c = pool[j];
                    pool.splice(Math.max(i, j), 1);
                    pool.splice(Math.min(i, j), 1);
                    gates.push({ id, op: rng.chance(0.5) ? 'AND' : 'OR', in: [a, c] });
                }
                pool.splice(rng.int(0, pool.length), 0, id);
            }
            if (!ok || pool.length !== 1) continue;
            const t = truthTable(gates, pool[0], n);
            if (t.error || !dependsOnAll(t.table, n)) continue;
            // no wasted plaques: a gate must not just copy one of its inputs (X OR (X AND Y) = X)
            const fn = src => truthTable(gates, src, n).table.join('');
            if (gates.some(gt => gt.op !== 'NOT' && (fn(gt.id) === fn(gt.in[0]) || fn(gt.id) === fn(gt.in[1])))) continue;
            return { gates, out: pool[0] };
        }
        return null;
    }

    function dress(rng, n) {
        const scen = rng.pick(SCENARIOS);
        const claims = rng.shuffle(scen.premises).slice(0, n);
        return {
            switches: claims.map((claim, i) => ({ label: LETTERS[i], claim })),
            bulb: { claim: scen.conclusion },
        };
    }

    // ---- mode A: light the bulb with the fewest assumptions ----
    const FALLBACK_LIGHT = { gates: [{ id: 'G0', op: 'AND', in: ['S0', 'S1'] }, { id: 'G1', op: 'OR', in: ['G0', 'S2'] }], out: 'G1' };

    function genLight(rng, d) {
        let circuit = null, n = 3;
        for (let attempt = 0; attempt < 300 && !circuit; attempt++) {
            const spec = d === 1 ? { n: 3, g: rng.int(2, 3), not: 0 }
                : d === 2 ? { n: rng.pick([3, 4]), g: 3, not: 1 }
                    : { n: 4, g: rng.int(3, 4), not: rng.int(1, 2) };
            const c = randomCircuit(rng, spec.n, spec.g, spec.not);
            if (!c) continue;
            const t = truthTable(c.gates, c.out, spec.n).table;
            const info = minimalInfo(t, spec.n);
            if (info.min == null || info.min < 1 || info.min >= spec.n) continue;
            if (t.filter(Boolean).length < 2) continue;
            if (d >= 2 && info.min < 2 && attempt < 200) continue;
            circuit = c; n = spec.n;
        }
        if (!circuit) { circuit = JSON.parse(JSON.stringify(FALLBACK_LIGHT)); n = 3; }
        const t = truthTable(circuit.gates, circuit.out, n).table;
        return Object.assign({ mode: 'light' }, dress(rng, n), { circuit, maxOn: minimalInfo(t, n).min });
    }

    // ---- mode B: wire it to match a truth table ----
    function genWire(rng, d) {
        let circuit = null, n = 2;
        for (let attempt = 0; attempt < 300 && !circuit; attempt++) {
            const spec = d === 1 ? { n: 2, g: 2, not: 1 }
                : d === 2 ? { n: 3, g: rng.int(2, 3), not: 1 }
                    : { n: 3, g: rng.int(3, 4), not: 2 };
            const c = randomCircuit(rng, spec.n, spec.g, spec.not);
            if (c) { circuit = c; n = spec.n; }
        }
        if (!circuit) { circuit = { gates: [{ id: 'G0', op: 'NOT', in: ['S1'] }, { id: 'G1', op: 'AND', in: ['S0', 'G0'] }], out: 'G1' }; n = 2; }
        const target = truthTable(circuit.gates, circuit.out, n).table;
        const ops = circuit.gates.map(g => g.op);
        if (d >= 2) ops.push(rng.pick(['AND', 'OR', 'NOT']));        // a spare plaque
        const order = rng.shuffle(ops.map((_, i) => i));             // order[paletteIx] = opIx
        const palette = order.map((opIx, k) => ({ id: 'P' + k, op: ops[opIx] }));
        const pid = {};
        order.forEach((opIx, k) => { if (opIx < circuit.gates.length) pid[circuit.gates[opIx].id] = 'P' + k; });
        const mapSrc = s => (isSwitch(s) ? s : pid[s]);
        const inputs = {};
        circuit.gates.forEach(g => { inputs[pid[g.id]] = g.in.map(mapSrc); });
        return Object.assign({ mode: 'wire' }, dress(rng, n), {
            palette,
            target,
            known: { inputs, bulb: mapSrc(circuit.out) },
            formula: describe(circuit.gates, circuit.out),
        });
    }

    // ---- mode C: what is behind the curtain? ----
    function circuitWithGuess(data, guess) {
        if (data.hidden.kind !== 'gate') return data.circuit.gates;
        return data.circuit.gates.map(g => (g.id === data.hidden.gate ? { id: g.id, op: guess, in: g.in } : g));
    }
    function fullValues(data, visible, guess) {
        const v = visible.slice();
        if (data.hidden.kind === 'switch') v[data.hidden.index] = guess;
        return v;
    }
    // Outcome of the circuit for one witnessed setting under a guess.
    function outcome(data, visible, guess) {
        return evaluate(circuitWithGuess(data, guess), data.circuit.out, fullValues(data, visible, guess));
    }
    function choicesFor(data) { return data.hidden.kind === 'switch' ? [true, false] : ['AND', 'OR']; }
    // Index of the first report that contradicts the guess, or -1.
    function contradiction(data, guess) {
        return data.observations.findIndex(o => outcome(data, o.on, guess) !== o.lit);
    }
    function visibleCount(data) { return data.switches.length - (data.hidden.kind === 'switch' ? 1 : 0); }
    // All visible settings, each with the hidden slot set to null.
    function visibleSettings(data) {
        const n = data.switches.length;
        const h = data.hidden.kind === 'switch' ? data.hidden.index : -1;
        const out = [];
        const m = visibleCount(data);
        for (let r = 0; r < (1 << m); r++) {
            const vis = rowValues(r, m);
            const v = [];
            let k = 0;
            for (let i = 0; i < n; i++) v.push(i === h ? null : vis[k++]);
            out.push(v);
        }
        return out;
    }

    function genHidden(rng, d) {
        for (let attempt = 0; attempt < 300; attempt++) {
            const variant = rng.chance(0.6) ? 'switch' : 'gate';
            const n = variant === 'switch' ? rng.pick([3, 4]) : rng.pick([2, 3]);
            const g = rng.int(2, 3);
            const circuit = randomCircuit(rng, n, g, 1);
            if (!circuit) continue;
            const base = Object.assign({ mode: 'hidden', variant }, dress(rng, n), { circuit });
            if (variant === 'switch') {
                base.hidden = { kind: 'switch', index: rng.int(0, n - 1) };
                base.secret = rng.chance(0.5);
            } else {
                const bins = circuit.gates.filter(x => x.op !== 'NOT');
                if (!bins.length) continue;
                const gate = rng.pick(bins);
                base.hidden = { kind: 'gate', gate: gate.id };
                base.secret = gate.op;
            }
            const other = choicesFor(base).find(c => c !== base.secret);
            const settings = visibleSettings(base);
            const telling = settings.filter(v => outcome(base, v, base.secret) !== outcome(base, v, other));
            if (!telling.length) continue;
            const k = settings.length <= 4 ? 3 : 4;
            const first = rng.pick(telling);
            const rest = rng.shuffle(settings.filter(v => v !== first)).slice(0, k - 1);
            base.observations = rng.shuffle([first].concat(rest)).map(on => ({ on, lit: outcome(base, on, base.secret) }));
            // the reports must leave exactly one possibility
            if (choicesFor(base).filter(c => contradiction(base, c) < 0).length !== 1) continue;
            return base;
        }
        return null;
    }

    // ------------------------------------------------------------------
    // Checking
    // ------------------------------------------------------------------

    function readBools(list, n) {
        if (!Array.isArray(list) || list.length !== n) return null;
        return list.map(v => v === true || v === 1 || v === 'on' || v === 'true');
    }

    function checkLight(data, answer) {
        const n = data.switches.length;
        const on = readBools(answer && (answer.on || (Array.isArray(answer) ? answer : null)), n);
        if (!on) return { solved: false, partial: 0, feedback: 'Set the switches first.' };
        const lit = evaluate(data.circuit.gates, data.circuit.out, on);
        const used = countOn(on);
        const table = truthTable(data.circuit.gates, data.circuit.out, n).table;
        const min = minimalInfo(table, n).min;
        if (!lit) return { solved: false, partial: 0, feedback: 'The bulb stays dark. These assumptions are not enough for the conclusion.' };
        if (used > min) {
            return {
                solved: false, partial: min / used, minimal: false,
                feedback: 'It lights! But you assumed ' + used + ' things, and it can be done with only ' + min + '. Which assumption can you drop?',
            };
        }
        return {
            solved: true, partial: 1, minimal: true,
            feedback: 'Lit with only ' + min + (min === 1 ? ' assumption' : ' assumptions') + ': the least anyone needs. Everything else was extra baggage.',
        };
    }

    function checkWire(data, answer) {
        const n = data.switches.length;
        const rows = 1 << n;
        if (!answer || typeof answer !== 'object') return { solved: false, partial: 0, feedback: 'Wire something to the bulb first.' };
        const inputs = answer.inputs && typeof answer.inputs === 'object' ? answer.inputs : {};
        const gates = data.palette.map(p => ({ id: p.id, op: p.op, in: Array.isArray(inputs[p.id]) ? inputs[p.id].slice(0, ARITY[p.op]) : [] }));
        const t = truthTable(gates, answer.bulb, n);
        const name = id => { const p = data.palette.find(x => x.id === id); return p ? p.op : 'a'; };
        if (t.error === 'nobulb') return { solved: false, partial: 0, feedback: 'Nothing is wired to the bulb yet.' };
        if (t.error === 'badsrc') return { solved: false, partial: 0, feedback: 'One of those wires goes nowhere.' };
        if (t.error === 'cycle') return { solved: false, partial: 0, feedback: 'Your wires go round in a loop. A conclusion cannot depend on itself!' };
        if (t.error === 'incomplete') {
            const op = name(t.gate);
            return { solved: false, partial: 0, feedback: 'The ' + op + ' plaque needs ' + (ARITY[op] === 1 ? 'a wire' : 'two wires') + ' coming in.' };
        }
        const wrong = t.table.filter((v, r) => v !== data.target[r]).length;
        if (wrong) {
            return {
                solved: false, partial: (rows - wrong) / rows,
                feedback: 'Your bulb differs in ' + wrong + ' rows. In row ' + (t.table.findIndex((v, r) => v !== data.target[r]) + 1) + ', follow each input through the gates and compare the target bulb.',
            };
        }
        return { solved: true, partial: 1, feedback: 'All ' + rows + ' rows match. Every possible case checked: that is a proof.' };
    }

    function guessName(data, g) {
        return data.hidden.kind === 'switch' ? (g ? 'ON' : 'OFF') : g;
    }

    function checkHidden(data, answer) {
        if (!answer || typeof answer !== 'object') return { solved: false, partial: 0, feedback: 'Make a guess about the curtain first.' };
        let guess;
        if (data.hidden.kind === 'switch') {
            if (typeof answer.value !== 'boolean') return { solved: false, partial: 0, feedback: 'Is the hidden switch ON or OFF?' };
            guess = answer.value;
        } else {
            guess = String(answer.gate || '').toUpperCase();
            if (guess !== 'AND' && guess !== 'OR') return { solved: false, partial: 0, feedback: 'Is the hidden plaque AND or OR?' };
        }
        const j = contradiction(data, guess);
        if (j >= 0) {
            const o = data.observations[j];
            return {
                solved: false, partial: 0,
                feedback: 'If it were ' + guessName(data, guess) + ', report ' + (j + 1) + ' would show the bulb ' + (o.lit ? 'dark' : 'lit') + '. But the witness saw it ' + (o.lit ? 'lit' : 'dark') + '.',
            };
        }
        return {
            solved: true, partial: 1,
            feedback: 'Behind the curtain: ' + guessName(data, guess) + '. It is the only possibility that fits every report. The other one leads to a contradiction.',
        };
    }

    // ------------------------------------------------------------------
    // Hints, why, solve
    // ------------------------------------------------------------------

    function lastOp(gates, out) {
        const g = gates.find(x => x.id === out);
        return g ? g.op : null;
    }

    function hintsFor(data) {
        const sw = data.switches;
        if (data.mode === 'light') {
            const n = sw.length;
            const t = truthTable(data.circuit.gates, data.circuit.out, n).table;
            const info = minimalInfo(t, n);
            const best = rowValues(info.rows[0], n);
            const one = best.findIndex(Boolean);
            const op = lastOp(data.circuit.gates, data.circuit.out);
            const last = op === 'AND' ? 'The last plaque before the bulb is AND: BOTH wires going into it must glow.'
                : op === 'OR' ? 'The last plaque before the bulb is OR: just ONE glowing wire is enough. Pick the cheaper side.'
                    : 'The last plaque before the bulb is NOT: the wire going into it must stay dark.';
            return [
                'Open the truth table. Look at the rows where the bulb is lit, and count the T\'s in each row.',
                last,
                'You need exactly ' + info.min + (info.min === 1 ? ' assumption' : ' assumptions') + '. One of them is ' + sw[one].label + ': "' + sw[one].claim + '".',
            ];
        }
        if (data.mode === 'wire') {
            const lit = data.target.filter(Boolean).length;
            const op = data.palette.find(p => p.id === data.known.bulb);
            return [
                'Read the table: the bulb must light in ' + lit + ' of the ' + data.target.length + ' rows. What do those rows have in common?',
                'In one answer, the wire into the bulb comes from ' + (op ? (op.op === 'AND' ? 'an AND' : op.op === 'OR' ? 'an OR' : 'a NOT') + ' plaque' : 'a switch') + '.',
                'One answer is: ' + data.formula + '.',
            ];
        }
        const other = choicesFor(data).find(c => c !== data.secret);
        const j = data.observations.findIndex(o => outcome(data, o.on, data.secret) !== outcome(data, o.on, other));
        const o = data.observations[j];
        const a = choicesFor(data)[0], b = choicesFor(data)[1];
        const what = data.hidden.kind === 'switch' ? 'switch' : 'plaque';
        return [
            'Suppose the hidden ' + what + ' is ' + guessName(data, a) + '. Check every report: would the bulb do what the witness saw? Then suppose ' + guessName(data, b) + '.',
            'Only some reports can tell the two stories apart. Look closely at report ' + (j + 1) + '.',
            'In report ' + (j + 1) + ': if it were ' + guessName(data, a) + ', the bulb would be ' + (outcome(data, o.on, a) ? 'lit' : 'dark')
                + '; if it were ' + guessName(data, b) + ', it would be ' + (outcome(data, o.on, b) ? 'lit' : 'dark') + '. The witness saw it ' + (o.lit ? 'lit' : 'dark') + '.',
        ];
    }

    function shuffleOptions(seed, options, correctIndex) {
        const order = Rift.makeRng(seed || 1).shuffle(options.map((_, i) => i));
        return { options: order.map(i => options[i]), correct: order.indexOf(correctIndex) };
    }

    function whyFor(data) {
        if (data.mode === 'light') {
            const s = shuffleOptions(data.whyShuffle, [
                'Every switch is an assumption we accept without proof. The fewer we need, the less can go wrong with the conclusion.',
                'Switches that are ON use up the village\'s gas.',
                'More assumptions always make a conclusion more certain.',
                'A conclusion that needs no assumptions at all is always false.',
            ], 0);
            return {
                question: 'Why does the Switchboard want the FEWEST switches turned on?',
                options: s.options, correct: s.correct,
                explain: 'Mathematicians try to prove things from as few axioms as possible. If you can drop an assumption and the conclusion still holds, it never depended on that assumption.',
            };
        }
        if (data.mode === 'wire') {
            const n = data.switches.length, rows = 1 << n;
            const s = shuffleOptions(data.whyShuffle, [
                'The truth table lists all ' + rows + ' possible settings, and every one was checked. Checking every case is a proof.',
                'Because it worked for the first two settings we tried.',
                'Because the bulb lit up at least once.',
                'We cannot be sure: there may be settings nobody has tried yet.',
            ], 0);
            return {
                question: 'Your wiring matched the table. Why can you be sure it works for EVERY setting of the switches?',
                options: s.options, correct: s.correct,
                explain: 'With ' + n + ' switches there are only 2 × '.repeat(n - 1) + '2 = ' + rows + ' cases, so we can check them all (proof by exhaustion). Two different wirings with the same truth table are the same argument in different clothes.',
            };
        }
        const s = shuffleOptions(data.whyShuffle, [
            'Try each possibility and keep the only one that fits ALL the reports. The other one leads to a contradiction.',
            'Guess: hidden things can never be known.',
            'Trust the report you like best and ignore the rest.',
            'If the bulb was ever lit, every switch must be ON.',
        ], 0);
        return {
            question: 'Something hid behind the curtain. How can you find it without looking?',
            options: s.options, correct: s.correct,
            explain: 'Arguments often rest on a premise nobody says out loud. Assume each possibility in turn and test it against every piece of evidence: a contradiction rules it out.',
        };
    }

    function solveFor(data) {
        if (data.mode === 'light') {
            const n = data.switches.length;
            const t = truthTable(data.circuit.gates, data.circuit.out, n).table;
            return { type: 'switches', on: rowValues(minimalInfo(t, n).rows[0], n) };
        }
        if (data.mode === 'wire') return { type: 'wiring', inputs: JSON.parse(JSON.stringify(data.known.inputs)), bulb: data.known.bulb };
        return data.hidden.kind === 'switch' ? { type: 'hidden', value: data.secret } : { type: 'hidden', gate: data.secret };
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

    // Drawn stand-ins until the painted props land (ui/switch-*, ui/bulb-*).
    function leverSvg(on) {
        const tip = on ? [44, 12] : [16, 12];
        return '<svg viewBox="0 0 60 70" aria-hidden="true">'
            + '<rect x="6" y="38" width="48" height="28" rx="7" fill="#5b3d1a" stroke="#1A1020" stroke-width="2.5"/>'
            + '<rect x="10" y="42" width="40" height="20" rx="5" fill="#c99a3c"/>'
            + '<circle cx="14" cy="46" r="1.8" fill="#6b4a1c"/><circle cx="46" cy="46" r="1.8" fill="#6b4a1c"/><circle cx="14" cy="58" r="1.8" fill="#6b4a1c"/><circle cx="46" cy="58" r="1.8" fill="#6b4a1c"/>'
            + '<line x1="30" y1="52" x2="' + tip[0] + '" y2="' + tip[1] + '" stroke="#1A1020" stroke-width="8" stroke-linecap="round"/>'
            + '<line x1="30" y1="52" x2="' + tip[0] + '" y2="' + tip[1] + '" stroke="#e6d3a6" stroke-width="4.5" stroke-linecap="round"/>'
            + '<circle cx="30" cy="52" r="6" fill="#3a2410" stroke="#1A1020" stroke-width="2"/>'
            + '<circle cx="' + tip[0] + '" cy="' + tip[1] + '" r="8" fill="' + (on ? '#E8384F' : '#6b2a33') + '" stroke="#1A1020" stroke-width="2.5"/>'
            + '<circle cx="' + (tip[0] - 2.5) + '" cy="' + (tip[1] - 2.5) + '" r="2.4" fill="#fff" fill-opacity="' + (on ? 0.6 : 0.2) + '"/>'
            + '</svg>';
    }
    function bulbSvg(lit) {
        return '<svg viewBox="0 0 80 112" aria-hidden="true">'
            + '<circle cx="40" cy="40" r="31" fill="' + (lit ? '#ffd77a' : '#2a2633') + '" fill-opacity="' + (lit ? 0.97 : 0.7) + '" stroke="#e6d3a6" stroke-opacity=".75" stroke-width="2.5"/>'
            + (lit ? '<circle cx="40" cy="40" r="20" fill="#fff6d0" fill-opacity=".7"/>' : '')
            + '<path d="M24 31 q4 -13 17 -15" stroke="#fff" stroke-opacity=".4" stroke-width="3.5" fill="none" stroke-linecap="round"/>'
            + '<path d="M33 70 L33 48 q3.5 -11 7 0 q3.5 -11 7 0 L47 70" stroke="' + (lit ? '#fffbe8' : '#8a7a5a') + '" stroke-width="2.2" fill="none"/>'
            + '<rect x="27" y="68" width="26" height="9" rx="2" fill="#b8892e" stroke="#1A1020" stroke-width="2"/>'
            + '<rect x="29" y="77" width="22" height="6" fill="#8d6a24" stroke="#1A1020" stroke-width="2"/>'
            + '<rect x="29" y="83" width="22" height="6" fill="#b8892e" stroke="#1A1020" stroke-width="2"/>'
            + '<rect x="29" y="89" width="22" height="6" fill="#8d6a24" stroke="#1A1020" stroke-width="2"/>'
            + '<path d="M33 95 h14 l-3 8 h-8 z" fill="#3a2410" stroke="#1A1020" stroke-width="2"/>'
            + '</svg>';
    }

    function artOr(id, fallbackHtml, className) {
        const A = Rift.Assets;
        if (A && A.has && A.has(id)) return A.img(id, { className });
        return Rift.el('span', { className: className + ' sb-drawn', html: fallbackHtml, dataset: { placeholder: id } });
    }

    // Board positions in % (switches anchored left, bulb right, gates centred).
    function layoutFor(data) {
        const pos = {};
        const n = data.switches.length;
        data.switches.forEach((_, i) => { pos['S' + i] = { y: (i + 0.5) / n * 100 }; });
        if (data.mode === 'wire') {
            const p = data.palette.length;
            data.palette.forEach((g, i) => {
                pos[g.id] = { x: p === 1 ? 52 : (i % 2 ? 64 : 42), y: 50 + ((i + 0.5) / p * 100 - 50) * 0.86 };
            });
        } else {
            const gates = data.circuit.gates;
            const depth = {};
            const dep = src => (isSwitch(src) ? 0 : depth[src]);
            gates.forEach(g => { depth[g.id] = 1 + Math.max(...g.in.map(dep)); });
            const maxD = Math.max(...gates.map(g => depth[g.id]));
            for (let d = 1; d <= maxD; d++) {
                const col = gates.filter(g => depth[g.id] === d);
                const bary = g => g.in.reduce((s, src) => s + pos[src].y, 0) / g.in.length;
                col.sort((a, b) => bary(a) - bary(b));
                const x = maxD === 1 ? 54 : 37 + (d - 1) * (37 / (maxD - 1));
                col.forEach((g, k) => {
                    let y = col.length === 1 ? bary(g) : (k + 0.5) / col.length * 100;
                    if (col.length > 1) y = (y + bary(g)) / 2;
                    pos[g.id] = { x, y: Math.max(14, Math.min(86, y)) };
                });
            }
        }
        return pos;
    }

    function mount(container, data, api) {
        const el = Rift.el;
        const sfx = name => { try { if (api && api.sfx) api.sfx(name); } catch (e) { /* sound is optional */ } };
        const mode = data.mode;
        const n = data.switches.length;
        const hiddenIx = mode === 'hidden' && data.hidden.kind === 'switch' ? data.hidden.index : -1;
        const hiddenGate = mode === 'hidden' && data.hidden.kind === 'gate' ? data.hidden.gate : null;
        const st = {
            on: mode === 'hidden' ? data.observations[0].on.slice() : new Array(n).fill(false),
            inputs: {},
            bulb: null,
            guess: null,
            done: false,
            drag: null,
            pending: null,
            showTable: mode !== 'light' || data.difficulty === 1,
        };
        if (mode === 'wire') data.palette.forEach(p => { st.inputs[p.id] = new Array(ARITY[p.op]).fill(null); });

        // ---- frame ----
        const counter = el('span.sb-count');
        const statusEl = el('div.sb-status');
        const title = mode === 'light' ? 'Light the bulb' : mode === 'wire' ? 'Wire it' : 'Hidden premise';
        const pieces = mode === 'light' ? ['switch ON = an assumption', 'light the conclusion', 'assume as little as you can']
            : mode === 'wire' ? ['match the table', 'any wiring that works is fine']
                : ['one thing is hidden', 'read the witness reports', 'what must be behind the curtain?'];
        const top = el('div.sb-top', null, [
            el('span.chip', { dataset: { colour: 'emotion' }, text: Rift.COLOURS.emotion.icon + ' ' + title }),
            ...pieces.map(t => el('span.sb-piece', { text: t })),
            el('span.sb-spacer'),
            counter,
        ]);

        const board = el('div.sb-board');
        const svg = svgEl('svg', { class: 'sb-wires' }, board);
        const gWires = svgEl('g', null, svg);
        const gTemp = svgEl('g', null, svg);
        const layer = el('div.sb-layer');
        board.appendChild(layer);

        const side = el('div.sb-side');
        const tableBox = el('div.sb-tablebox');
        const obsBox = mode === 'hidden' ? el('div.sb-obsbox') : null;
        if (obsBox) side.appendChild(obsBox);
        side.appendChild(tableBox);

        const main = el('div.sb-main', null, [board, side]);

        const tableBtn = el('button.btn.small.sb-tablebtn', { text: '▦ Truth table', onclick: () => { st.showTable = !st.showTable; sfx('click'); render(); } });
        const resetBtn = el('button.btn.small', {
            text: mode === 'wire' ? 'Clear wires' : 'All off',
            onclick: () => {
                if (st.done) return;
                if (mode === 'wire') { Object.keys(st.inputs).forEach(k => st.inputs[k].fill(null)); st.bulb = null; st.pending = null; }
                else st.on = st.on.map((v, i) => (i === hiddenIx ? null : false));
                sfx('click'); setStatus(''); render();
            },
        });
        const submitBtn = el('button.btn.small.gold', {
            text: mode === 'light' ? '✓ These are enough' : mode === 'wire' ? '✓ Check my wiring' : 'Lift the curtain',
            onclick: () => submit(),
        });
        const controls = el('div.sb-controls', null, mode === 'wire' ? [resetBtn, submitBtn, statusEl] : [tableBtn, resetBtn, submitBtn, statusEl]);

        const rootEl = el('div.sb-root.sb-mode-' + mode, null, [top, main, controls]);
        try { if (root.getComputedStyle(container).position === 'static') container.style.position = 'relative'; } catch (e) { /* ignore */ }
        container.appendChild(rootEl);

        function setStatus(text, tone) {
            statusEl.textContent = text || '';
            statusEl.className = 'sb-status' + (tone ? ' ' + tone : '');
        }

        // ---- board pieces ----
        const pos = layoutFor(data);
        const socks = {};
        const nodes = {};

        function sock(key, cls) {
            const s = el('span.sb-sock.' + cls, { dataset: { key } });
            socks[key] = s;
            return s;
        }

        data.switches.forEach((s, i) => {
            const isHidden = i === hiddenIx;
            const lever = el('span.sb-leverbox');
            const claim = el('div.sb-claim', null, [el('b.sb-letter', { text: s.label }), ' ' + s.claim]);
            const kids = [lever, el('div.sb-claimcol', null, [claim])];
            const node = el('div.sb-switch' + (isHidden ? '.sb-hidden' : ''), { style: { top: pos['S' + i].y + '%' } }, kids);
            if (isHidden) {
                const guessRow = el('div.sb-guess', null, [
                    el('button.sb-gbtn', { text: 'ON?', dataset: { g: 'on' }, onclick: e => { e.stopPropagation(); setGuess(true); } }),
                    el('button.sb-gbtn', { text: 'OFF?', dataset: { g: 'off' }, onclick: e => { e.stopPropagation(); setGuess(false); } }),
                ]);
                kids[1].appendChild(guessRow);
                lever.appendChild(el('span.sb-curtain', { text: '?' }));
            } else {
                node.addEventListener('click', () => toggleSwitch(i));
            }
            node.appendChild(sock('S' + i + ':out', 'out'));
            nodes['S' + i] = { node, lever };
            layer.appendChild(node);
        });

        const gateList = mode === 'wire' ? data.palette.map(p => ({ id: p.id, op: p.op })) : data.circuit.gates;
        gateList.forEach(g => {
            const hidden = g.id === hiddenGate;
            const plaque = el('div.sb-plaque', null, [
                artOr('ui/gate-plaque', '', 'sb-plaque-img'),
                el('span.sb-op', { text: hidden ? '?' : g.op }),
            ]);
            if (hidden) plaque.appendChild(el('span.sb-curtain.sb-curtain-plaque'));
            const node = el('div.sb-gate.sb-op-' + g.op.toLowerCase() + (hidden ? '.sb-hidden' : ''), { style: { left: pos[g.id].x + '%', top: pos[g.id].y + '%' } }, [plaque]);
            for (let j = 0; j < ARITY[g.op]; j++) node.appendChild(sock(g.id + ':in' + j, 'in.in' + j + (ARITY[g.op] === 1 ? '.solo' : '')));
            node.appendChild(sock(g.id + ':out', 'out'));
            if (hidden) {
                node.appendChild(el('div.sb-guess.sb-guess-gate', null, [
                    el('button.sb-gbtn', { text: 'AND?', dataset: { g: 'AND' }, onclick: () => setGuess('AND') }),
                    el('button.sb-gbtn', { text: 'OR?', dataset: { g: 'OR' }, onclick: () => setGuess('OR') }),
                ]));
            }
            nodes[g.id] = { node, plaque };
            layer.appendChild(node);
        });

        const bulbBox = el('span.sb-bulbbox');
        const bulbNote = el('div.sb-bulbnote');
        const bulbNode = el('div.sb-bulb', null, [
            sock('BULB:in', 'in.solo'),
            bulbBox,
            el('div.sb-claim.sb-conclusion', { text: data.bulb.claim }),
            bulbNote,
        ]);
        layer.appendChild(bulbNode);

        // ---- state helpers ----
        function currentGates() {
            if (mode === 'wire') return data.palette.map(p => ({ id: p.id, op: p.op, in: st.inputs[p.id] }));
            if (hiddenGate) return data.circuit.gates.map(g => (g.id === hiddenGate ? { id: g.id, op: st.guess || '?', in: g.in } : g));
            return data.circuit.gates;
        }
        function currentOut() { return mode === 'wire' ? st.bulb : data.circuit.out; }
        function values() { return st.on.map((v, i) => (i === hiddenIx ? st.guess : v)); }

        function witnessed() {
            if (mode !== 'hidden') return -1;
            return data.observations.findIndex(o => o.on.every((v, i) => i === hiddenIx || v === st.on[i]));
        }

        function wires() {
            const out = [];
            if (mode === 'wire') {
                Object.keys(st.inputs).forEach(id => st.inputs[id].forEach((src, j) => { if (src) out.push({ from: src, to: id + ':in' + j, gate: id, j }); }));
                if (st.bulb) out.push({ from: st.bulb, to: 'BULB:in', gate: 'BULB' });
            } else {
                data.circuit.gates.forEach(g => g.in.forEach((src, j) => out.push({ from: src, to: g.id + ':in' + j })));
                out.push({ from: data.circuit.out, to: 'BULB:in' });
            }
            return out;
        }

        // ---- rendering ----
        function render() {
            const val = signals(currentGates(), values());
            // switches
            data.switches.forEach((_, i) => {
                const { node, lever } = nodes['S' + i];
                if (i === hiddenIx) {
                    const shown = st.done ? data.secret : st.guess;
                    node.classList.toggle('open', st.done);
                    node.classList.toggle('guess-on', !st.done && st.guess === true);
                    node.classList.toggle('guess-off', !st.done && st.guess === false);
                    const curtain = lever.querySelector('.sb-curtain');
                    lever.innerHTML = '';
                    lever.appendChild(artOr(shown ? 'ui/switch-on' : 'ui/switch-off', leverSvg(!!shown), 'sb-lever'));
                    if (curtain && !st.done) lever.appendChild(curtain);
                    node.querySelectorAll('.sb-gbtn').forEach(b => {
                        b.classList.toggle('on', (b.dataset.g === 'on' && st.guess === true) || (b.dataset.g === 'off' && st.guess === false));
                        b.disabled = st.done;
                    });
                    return;
                }
                node.classList.toggle('on', !!st.on[i]);
                lever.innerHTML = '';
                lever.appendChild(artOr(st.on[i] ? 'ui/switch-on' : 'ui/switch-off', leverSvg(!!st.on[i]), 'sb-lever'));
            });
            // gates
            gateList.forEach(g => {
                const { node, plaque } = nodes[g.id];
                const v = val(g.id);
                node.classList.toggle('live', v === true);
                node.classList.toggle('unknown', v === null);
                if (g.id === hiddenGate) {
                    const opText = plaque.querySelector('.sb-op');
                    opText.textContent = st.done ? data.secret : (st.guess || '?');
                    node.classList.toggle('open', st.done);
                    node.classList.toggle('guessed', !!st.guess && !st.done);
                    node.querySelectorAll('.sb-gbtn').forEach(b => { b.classList.toggle('on', b.dataset.g === st.guess); b.disabled = st.done; });
                }
            });
            // bulb
            let lit;
            const w = witnessed();
            if (mode === 'hidden') {
                lit = w >= 0 ? data.observations[w].lit : null;
                bulbNote.textContent = w >= 0 ? 'Report ' + (w + 1) + ': the witness saw it ' + (lit ? 'LIT' : 'DARK') : 'Nobody saw this setting.';
            } else {
                lit = currentOut() ? val(currentOut()) === true : false;
                bulbNote.textContent = '';
            }
            bulbNode.classList.toggle('lit', lit === true);
            bulbNode.classList.toggle('unknown', lit === null);
            bulbBox.innerHTML = '';
            bulbBox.appendChild(artOr(lit ? 'ui/bulb-on' : 'ui/bulb-off', bulbSvg(lit === true), 'sb-bulbimg'));
            if (lit === null) bulbBox.appendChild(el('span.sb-bulbq', { text: '?' }));
            // sockets in wire mode
            if (mode === 'wire') {
                Object.keys(socks).forEach(k => {
                    const s = socks[k];
                    const [id, part] = k.split(':');
                    let filled = false;
                    if (k === 'BULB:in') filled = !!st.bulb;
                    else if (part.startsWith('in')) filled = !!st.inputs[id][+part.slice(2)];
                    s.classList.toggle('filled', filled);
                    s.classList.toggle('pending', st.pending === k);
                });
            }
            // counter
            if (mode === 'light') {
                const k = countOn(st.on);
                counter.textContent = 'Assumed ' + k + '  ·  goal: ' + data.maxOn + ' or fewer';
                counter.classList.toggle('good', lit && k <= data.maxOn);
            } else if (mode === 'wire') {
                const t = truthTable(currentGates(), st.bulb, n);
                const ok = t.table ? t.table.filter((v, r) => v === data.target[r]).length : 0;
                counter.textContent = 'Rows matching ' + ok + ' / ' + data.target.length;
                counter.classList.toggle('good', ok === data.target.length);
            } else {
                counter.textContent = data.observations.length + ' witness reports';
            }
            renderSide(val);
            tableBtn.classList.toggle('on', st.showTable);
            submitBtn.disabled = st.done || (mode === 'hidden' && st.guess == null);
            resetBtn.disabled = st.done;
            rootEl.classList.toggle('solved', st.done);
            drawWires(val);
        }

        function cellTF(v) { return el('td.sb-tf' + (v ? '.t' : '.f'), { text: v ? 'T' : 'F' }); }
        function cellBulb(v, extra) {
            const cls = v === true ? '.lit' : v === false ? '.dark' : '.unk';
            return el('td.sb-bc' + cls + (extra || ''), { text: v === true ? '●' : v === false ? '○' : '?' });
        }

        function renderSide(val) {
            // witness reports
            if (obsBox) {
                obsBox.innerHTML = '';
                obsBox.appendChild(el('div.sb-sidehead', { text: 'Witness reports' }));
                const w = witnessed();
                data.observations.forEach((o, j) => {
                    const bits = [];
                    o.on.forEach((v, i) => { if (i !== hiddenIx) bits.push(el('span.sb-obsbit' + (v ? '.t' : '.f'), { text: data.switches[i].label + (v ? ' ON' : ' OFF') })); });
                    obsBox.appendChild(el('button.sb-obs' + (j === w ? '.cur' : ''), {
                        onclick: () => { if (st.done) return; st.on = o.on.slice(); sfx('click'); render(); },
                    }, [el('b', { text: (j + 1) + '.' }), ...bits, el('span.sb-obsarrow', { text: '→' }), el('span.sb-obsres' + (o.lit ? '.lit' : '.dark'), { text: o.lit ? 'lit' : 'dark' })]));
                });
            }
            tableBox.innerHTML = '';
            const show = st.showTable;
            side.classList.toggle('collapsed', !show && mode === 'light');
            if (!show) {
                tableBox.appendChild(el('div.sb-tablehint.small.muted', { text: mode === 'hidden' ? 'Open the truth table to test a guess in every case.' : 'The truth table shows every possible setting.' }));
                return;
            }
            const visIx = data.switches.map((_, i) => i).filter(i => i !== hiddenIx);
            let headCells, rows = [];
            if (mode === 'light') {
                headCells = visIx.map(i => el('th', { text: data.switches[i].label })).concat([el('th', { text: 'Bulb' }), el('th', { text: '#', title: 'switches ON' })]);
                const t = truthTable(data.circuit.gates, data.circuit.out, n).table;
                const cur = rowIndex(st.on);
                t.forEach((lit, r) => {
                    const v = rowValues(r, n);
                    rows.push({ v, cur: r === cur, cells: v.map(cellTF).concat([cellBulb(lit), el('td.sb-num', { text: String(countOn(v)) })]) });
                });
            } else if (mode === 'wire') {
                headCells = visIx.map(i => el('th', { text: data.switches[i].label })).concat([el('th', { text: 'Must' }), el('th', { text: 'Yours' })]);
                const gates = currentGates();
                const cur = rowIndex(st.on);
                data.target.forEach((must, r) => {
                    const v = rowValues(r, n);
                    const yours = st.bulb ? signals(gates, v)(st.bulb) : null;
                    const bad = yours !== null && yours !== must;
                    rows.push({ v, cur: r === cur, bad, cells: v.map(cellTF).concat([cellBulb(must), cellBulb(yours, bad ? '.bad' : yours === must ? '.ok' : '')]) });
                });
            } else {
                const guessLabel = st.guess == null ? 'If ?' : 'If ' + guessName(data, st.guess);
                headCells = visIx.map(i => el('th', { text: data.switches[i].label })).concat([el('th', { text: guessLabel }), el('th', { text: 'Seen' })]);
                visibleSettings(data).forEach(v => {
                    const guessVal = st.guess == null ? null : outcome(data, v, st.guess);
                    const oi = data.observations.findIndex(o => o.on.every((x, i) => i === hiddenIx || x === v[i]));
                    const seen = oi >= 0 ? data.observations[oi].lit : undefined;
                    rows.push({
                        v, cur: v.every((x, i) => i === hiddenIx || x === st.on[i]),
                        cells: visIx.map(i => cellTF(v[i])).concat([cellBulb(guessVal), seen === undefined ? el('td.sb-bc.none', { text: '' }) : cellBulb(seen, '.seen')]),
                    });
                });
            }
            const head = mode === 'wire' ? 'The bulb must light when…' : mode === 'light' ? 'Truth table' : 'Truth table (with your guess)';
            const tbody = el('tbody', null, rows.map(row => el('tr' + (row.cur ? '.cur' : '') + (row.bad ? '.bad' : ''), {
                onclick: () => {
                    if (st.done) return;
                    st.on = row.v.map((x, i) => (i === hiddenIx ? null : x));
                    sfx('click'); render();
                },
            }, row.cells)));
            tableBox.appendChild(el('div.sb-sidehead', { text: head }));
            tableBox.appendChild(el('table.sb-tt', null, [el('thead', null, [el('tr', null, headCells)]), tbody]));
            tableBox.appendChild(el('div.sb-legend.small.muted', { text: 'T = switch ON (assumed true) · ● lit · ○ dark' }));
        }

        function sockCentre(key, br) {
            const s = socks[key];
            if (!s) return null;
            const r = s.getBoundingClientRect();
            return [r.left + r.width / 2 - br.left, r.top + r.height / 2 - br.top];
        }

        function wirePath(a, b) {
            const dx = Math.max(28, Math.abs(b[0] - a[0]) * 0.5);
            return 'M' + a[0] + ' ' + a[1] + ' C' + (a[0] + dx) + ' ' + a[1] + ' ' + (b[0] - dx) + ' ' + b[1] + ' ' + b[0] + ' ' + b[1];
        }

        function drawWires(val) {
            const v = val || signals(currentGates(), values());
            const br = board.getBoundingClientRect();
            if (!br.width) return;
            svg.setAttribute('viewBox', '0 0 ' + br.width + ' ' + br.height);
            gWires.innerHTML = '';
            wires().forEach(wire => {
                const a = sockCentre(wire.from + ':out', br), b = sockCentre(wire.to, br);
                if (!a || !b) return;
                const sig = v(wire.from);
                const d = wirePath(a, b);
                const cls = 'sb-wire' + (sig === true ? ' live' : sig === false ? ' dead' : ' unknown');
                svgEl('path', { d, class: 'sb-wire-under' }, gWires);
                svgEl('path', { d, class: cls }, gWires);
                if (mode === 'wire' && !st.done) {
                    const hit = svgEl('path', { d, class: 'sb-wire-hit' }, gWires);
                    hit.addEventListener('click', () => removeWire(wire));
                }
            });
        }

        // ---- actions ----
        function toggleSwitch(i) {
            if (st.done) return;
            st.on[i] = !st.on[i];
            sfx('click');
            if (mode === 'light') {
                const lit = evaluate(data.circuit.gates, data.circuit.out, st.on);
                const k = countOn(st.on);
                if (lit) setStatus('The bulb is lit with ' + k + (k === 1 ? ' assumption.' : ' assumptions.') + (k > data.maxOn ? ' Can you drop one?' : ' Submit when you are sure.'), k <= data.maxOn ? 'good' : '');
                else setStatus('');
            }
            render();
        }

        function setGuess(g) {
            if (st.done) return;
            st.guess = st.guess === g ? null : g;
            sfx('place');
            setStatus(st.guess == null ? '' : 'Suppose it is ' + guessName(data, st.guess) + '. Does that fit every report?');
            render();
        }

        function removeWire(wire) {
            if (st.done) return;
            if (wire.gate === 'BULB') st.bulb = null; else st.inputs[wire.gate][wire.j] = null;
            sfx('click');
            setStatus('Wire removed.');
            render();
        }

        // Does src depend (through wires) on gate id?
        function dependsOn(src, id, seen) {
            if (!src || isSwitch(src)) return false;
            if (src === id) return true;
            const s = seen || {};
            if (s[src]) return false;
            s[src] = true;
            return (st.inputs[src] || []).some(x => dependsOn(x, id, s));
        }

        function connect(outKey, inKey) {
            const src = outKey.split(':')[0];
            const [id, part] = inKey.split(':');
            if (id !== 'BULB' && dependsOn(src, id)) {
                sfx('error');
                setStatus('That would make a loop: a plaque cannot feed itself.', 'bad');
                return;
            }
            if (id === 'BULB') st.bulb = src; else st.inputs[id][+part.slice(2)] = src;
            sfx('place');
            setStatus('');
            render();
        }

        function compatible(a, b) {
            const out = k => /:out$/.test(k);
            if (!a || !b || out(a) === out(b)) return null;
            const o = out(a) ? a : b, i = out(a) ? b : a;
            if (o.split(':')[0] === i.split(':')[0]) return null;      // own output to own input
            return [o, i];
        }

        function submit() {
            if (st.done) return;
            let answer;
            if (mode === 'light') answer = { type: 'switches', on: st.on.slice() };
            else if (mode === 'wire') {
                const inputs = {};
                Object.keys(st.inputs).forEach(k => { inputs[k] = st.inputs[k].slice(); });
                answer = { type: 'wiring', inputs, bulb: st.bulb };
            } else {
                if (st.guess == null) return;
                answer = hiddenGate ? { type: 'hidden', gate: st.guess } : { type: 'hidden', value: st.guess };
            }
            let r = null;
            try { r = api && api.submit ? api.submit(answer) : null; } catch (e) { console.error('[switchboard]', e); }
            const show = res => {
                if (!res) return;
                if (res.solved) {
                    st.done = true;
                    sfx('success');
                    setStatus(res.feedback, 'good');
                    render();
                } else {
                    sfx('error');
                    setStatus(res.feedback, 'bad');
                }
            };
            if (r && typeof r.then === 'function') r.then(show, () => {}); else show(r);
        }

        // ---- wire dragging (mode B) ----
        function pointIn(ev) {
            const br = board.getBoundingClientRect();
            return [ev.clientX - br.left, ev.clientY - br.top];
        }
        function sockAt(ev) {
            const hit = root.document.elementFromPoint(ev.clientX, ev.clientY);
            const s = hit && hit.closest ? hit.closest('.sb-sock') : null;
            return s && board.contains(s) ? s.dataset.key : null;
        }
        function onDown(ev) {
            if (mode !== 'wire' || st.done || ev.button > 0) return;
            const t = ev.target && ev.target.closest ? ev.target.closest('.sb-sock') : null;
            if (!t) return;
            st.drag = { key: t.dataset.key, start: pointIn(ev), moved: false };
            try { board.setPointerCapture(ev.pointerId); } catch (e) { /* ok */ }
            ev.preventDefault();
        }
        function onMove(ev) {
            if (!st.drag) return;
            const p = pointIn(ev);
            if (Math.hypot(p[0] - st.drag.start[0], p[1] - st.drag.start[1]) > 6) st.drag.moved = true;
            gTemp.innerHTML = '';
            if (!st.drag.moved) return;
            const br = board.getBoundingClientRect();
            const a = sockCentre(st.drag.key, br);
            const isOut = /:out$/.test(st.drag.key);
            svgEl('path', { d: isOut ? wirePath(a, p) : wirePath(p, a), class: 'sb-wire temp' }, gTemp);
            const over = sockAt(ev);
            Object.values(socks).forEach(s => s.classList.toggle('target', !!over && s.dataset.key === over && !!compatible(st.drag.key, over)));
        }
        function onUp(ev) {
            if (!st.drag) return;
            const drag = st.drag;
            st.drag = null;
            gTemp.innerHTML = '';
            Object.values(socks).forEach(s => s.classList.remove('target'));
            const over = sockAt(ev);
            if (drag.moved) {
                const pair = compatible(drag.key, over);
                if (pair) connect(pair[0], pair[1]);
                else if (over) { sfx('error'); setStatus('Wires run from a right-hand socket (out) to a left-hand socket (in).', 'bad'); }
                return;
            }
            // a click: finish a pending click-click wire, unplug an input, or start one
            const key = drag.key;
            if (st.pending) {
                const pair = compatible(st.pending, key);
                st.pending = null;
                if (pair) { connect(pair[0], pair[1]); return; }
            }
            const [id, part] = key.split(':');
            const filled = key === 'BULB:in' ? st.bulb : part.startsWith('in') ? st.inputs[id][+part.slice(2)] : null;
            if (filled) { removeWire(key === 'BULB:in' ? { gate: 'BULB' } : { gate: id, j: +part.slice(2) }); return; }
            st.pending = key;
            sfx('click');
            setStatus('Now click where the wire should go.');
            render();
        }

        board.addEventListener('pointerdown', onDown);
        board.addEventListener('pointermove', onMove);
        board.addEventListener('pointerup', onUp);
        board.addEventListener('pointercancel', () => { st.drag = null; gTemp.innerHTML = ''; });

        let ro = null;
        const redraw = () => drawWires();
        if (root.ResizeObserver) { ro = new root.ResizeObserver(redraw); ro.observe(board); }
        else root.addEventListener('resize', redraw);

        render();
        if (root.requestAnimationFrame) root.requestAnimationFrame(redraw);
        setStatus(mode === 'light' ? 'Click the switches. Each one you turn ON is something you assume is true.'
            : mode === 'wire' ? 'Drag a wire from a right-hand socket (a switch or a plaque) to a left-hand socket (a plaque or the bulb).'
                : 'Click a witness report to set the switches. What must be behind the curtain?');
        try {
            if (api && api.say) {
                api.say(mode === 'light' ? 'Light the bulb: "' + data.bulb.claim + '". What is the least you must assume?'
                    : mode === 'wire' ? 'Wire the board so the bulb lights exactly when the table says.'
                        : 'Someone hid a ' + (hiddenGate ? 'plaque' : 'switch') + ' behind the curtain. The witnesses saw the bulb. What is hidden?');
            }
        } catch (e) { /* speech is optional */ }

        return {
            destroy() {
                if (ro) ro.disconnect(); else root.removeEventListener('resize', redraw);
                if (rootEl.parentNode) rootEl.parentNode.removeChild(rootEl);
            },
        };
    }

    // ------------------------------------------------------------------

    const def = {
        id: 'switchboard',
        rules: [
            "Switches are inputs: ON = true; OFF = false. Watch the output bulbs.",
            "AND is true only if both inputs are true. OR needs at least one. NOT turns true into false and false into true.",
            "Light mode: reach the requested output with as few ON switches as possible.",
            "Wire mode: connect the sockets to match the table. Hidden mode: infer the hidden switch or gate from the reports.",
            "How to play is free. The Hint button shows its heart cost. Think first, then check your answer."
        ],
        tutorial: [
            {
                "text": "Read which task this switchboard asks. We are checking what follows from chosen inputs.",
                "highlight": ".sb-top"
            },
            {
                "text": "Click a switch to change true/false. Example: true AND false gives false; true OR false gives true; NOT true gives false.",
                "highlight": ".sb-board"
            },
            {
                "text": "Light mode: make the requested bulbs light with the fewest ON switches. Try a switch and watch its path through the gates.",
                "highlight": ".sb-board"
            },
            {
                "text": "Wire mode: click an output socket on the right, then an input socket on the left, or drag between them. Connect the last output to the bulb. Match every table row.",
                "highlight": ".sb-side"
            },
            {
                "text": "Hidden mode: click the reports. Choose ON/OFF for a hidden switch, or AND/OR for a hidden gate. Your guess must fit every report.",
                "highlight": ".sb-side"
            },
            {
                "text": "Use These are enough for light mode, Check my wiring for wire mode, or Lift the curtain for hidden mode. The rule gives certainty only for these inputs. How to play is free. The Hint button shows its heart cost. Think first, then check your answer.",
                "highlight": ".sb-controls"
            }
        ],
        name: 'The Switchboard',
        colour: 'emotion',
        family: 'Hidden premise',
        blurb: 'Every switch is an assumption. Light the conclusion, and find out how little you really need to assume.',
        tok: 'Every proof rests on assumptions. A truth table checks every case, and the strongest arguments assume as little as possible.',

        generate(rng, difficulty) {
            const d = Math.max(1, Math.min(3, Math.round(Number(difficulty) || 1)));
            const roll = rng.next();
            let data = null;
            if (d === 3 && roll < 0.45) data = genHidden(rng, d);
            if (!data) {
                const lightChance = d === 1 ? 0.6 : d === 2 ? 0.45 : 0.45;
                data = rng.chance(lightChance) ? genLight(rng, d) : genWire(rng, d);
            }
            data.difficulty = d;
            data.whyShuffle = rng.int(1, 1e6);
            return data;
        },

        check(data, answer) {
            if (!data || !answer || typeof answer !== 'object') return { solved: false, partial: 0, feedback: 'Nothing to check yet.' };
            if (data.mode === 'light') return checkLight(data, answer);
            if (data.mode === 'wire') return checkWire(data, answer);
            return checkHidden(data, answer);
        },

        hints: hintsFor,
        why: whyFor,
        solve: solveFor,
        mount,

        // exposed for tests and tools
        internals: {
            ARITY, SCENARIOS, rowValues, rowIndex, validate, evaluate, truthTable, signals, dependsOnAll,
            minimalInfo, describe, randomCircuit, genLight, genWire, genHidden, contradiction, outcome, visibleSettings, layoutFor,
        },
    };

    Rift.Puzzles.register(def);
})(typeof window !== 'undefined' ? window : globalThis);
