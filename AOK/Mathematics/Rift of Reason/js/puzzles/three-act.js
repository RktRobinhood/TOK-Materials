/*
 * The Three Acts: Imagination / maths as thinking (chapter 4 finale, lesson 4).
 *
 * A three-act task in the style Dan Meyer made popular (the FORMAT only; the
 * tasks, numbers and drawings here are all original):
 *
 *   Act 1: a short animation stops at a hook. "What do you wonder?" (pick or
 *          type a question; we steer to the main one), then a guess: too low,
 *          too high, best guess. Guessing first is part of the thinking.
 *   Act 2: choose which information you need from a list (some useful, some
 *          red herrings, one missing until you ask for it), then model it with
 *          a small calculator and a table/graph helper.
 *   Act 3: the rest of the animation reveals the answer. Compare it with your
 *          model and say why it was off (or why it matched).
 *
 * Six tasks, each with seeded numbers. Every task is a pure simulation
 * (sim(p)): the animation only draws its states, and its last state IS the
 * answer, so the test can check answer(p) against the animation's end.
 *
 * Answer: { wonder, guess: { low, high, best }, requested: [infoId, ...],
 *           model: number, reflection: index into data.reflections }.
 * Solved when the model is within data.tolerance of the true answer AND every
 * necessary piece of information was requested (and a reflection was chosen).
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;

    const TOL = { 1: { pct: 0.15, min: 1 }, 2: { pct: 0.08, min: 0.5 }, 3: { pct: 0.03, min: 0.5 } };

    const REFLECTIONS = [
        'Rounding: I rounded at the wrong moment, or the answer had to be a whole number.',
        'A wrong assumption: I assumed something that was not true (like a constant rate, or starting from zero).',
        'Missing information: I did not ask for something that mattered.',
        'A slip: my idea was right but I made a mistake in the calculation.',
        'It matched: I picked what mattered and my model worked.',
    ];
    const MATCHED = 4;

    const fmt = x => {
        if (x == null || !isFinite(x)) return '?';
        const r = Math.round(x * 100) / 100;
        return String(r);
    };
    const round2 = x => Math.round(x * 1000) / 1000;

    // ------------------------------------------------------------------
    // The six tasks (pure). Each: params, answer, naive (a common model that
    // ignores something that matters), sim → { pre, post } states,
    // done(p, state), info, givens, wonders, hint, unit.
    // ------------------------------------------------------------------

    const TASKS = {};

    // 1. The rift pours sand into a giant hourglass.
    TASKS.hourglass = {
        title: 'The Rift Hourglass',
        unit: 'minutes',
        params(rng, d) {
            let rate, q = null, dt = 1, T;
            if (d === 1) { rate = rng.pick([5, 10]); T = rng.int(6, 14); }
            else if (d === 2) { rate = rng.int(3, 9); T = rng.int(8, 20); }
            else { q = rng.int(2, 6); rate = 2 * q; dt = 0.5; T = rng.int(17, 41) / 2; }
            const left = rate * T;
            const start = Math.ceil((left * 0.5) / 10) * 10 + 10 * rng.int(0, 3);
            return { rate, q, dt, T, start, cap: start + left, height: rng.int(3, 6), top: (start + left) * rng.int(4, 6), year: rng.int(1210, 1690) };
        },
        answer: p => (p.cap - p.start) / p.rate,
        naive: p => p.cap / p.rate,
        sim(p) {
            const pre = [];
            for (let i = 0; i <= 8; i++) pre.push({ level: (p.start * i) / 8, clock: null });
            const post = [{ level: p.start, clock: 0 }];
            let level = p.start, t = 0;
            const per = p.rate * p.dt;
            while (level < p.cap - 1e-9) {
                level += per;
                t = round2(t + p.dt);
                post.push({ level: Math.min(level, p.cap), clock: t });
            }
            return { pre, post };
        },
        done: (p, s) => s.level >= p.cap - 1e-9,
        givens: () => ['The rift is pouring sand into a giant hourglass.', 'The bottom bulb is filling up.'],
        wonders: () => [
            'How long until the bottom bulb is full?',
            'Where does the rift sand come from?',
            'How heavy is all that sand?',
            'What happens when the hourglass is full?',
        ],
        info: p => [
            { id: 'cap', ask: 'How much sand does the bottom bulb hold?', value: p.cap + ' scoops when it is full.', need: true },
            { id: 'start', ask: 'How much sand is in the bottom bulb right now?', value: p.start + ' scoops already.', need: true, hidden: true },
            { id: 'rate', ask: 'How fast does the sand fall?', value: p.q ? p.q + ' scoops every 30 seconds, steadily.' : p.rate + ' scoops every minute, steadily.', need: true },
            { id: 'height', ask: 'How tall is the hourglass?', value: p.height + ' metres tall.' },
            { id: 'colour', ask: 'What colour is the sand?', value: 'Rift violet. It glows a little.' },
            { id: 'top', ask: 'How much sand is in the top bulb?', value: 'Plenty: about ' + p.top + ' scoops. It will not run out.' },
            { id: 'maker', ask: 'Who built the hourglass?', value: 'Clockmaker Tock, in the year ' + p.year + '.', hidden: true },
        ],
        hint: p => 'You need three numbers: how much the bulb holds, how much is in it already, and how fast the sand falls' + (p.q ? ' (careful: per 30 seconds, not per minute)' : '') + '.',
        model: () => 'space left ÷ sand per minute = minutes',
        label: (p, s) => (s.clock == null ? '' : '⏱ +' + fmt(s.clock) + ' min'),
    };

    // 2. The lamplighter lights the lanterns along a foggy street.
    TASKS.lanterns = {
        title: 'Lanterns on Fog Street',
        unit: 'seconds',
        params(rng, d) {
            const N = d === 1 ? rng.int(10, 16) : d === 2 ? rng.int(14, 24) : rng.int(20, 32);
            const s = d === 1 ? rng.pick([5, 10]) : d === 2 ? rng.int(4, 9) : rng.int(6, 13);
            const k = Math.ceil(N / 4) + rng.int(0, 1);
            return { N, s, k, length: N * rng.int(18, 30), burn: rng.int(5, 9), age: rng.int(70, 97) };
        },
        answer: p => (p.N - p.k) * p.s,
        naive: p => p.N * p.s,
        sim(p) {
            const pre = [];
            for (let i = 0; i <= p.k; i++) pre.push({ lit: i, clock: null });
            const post = [{ lit: p.k, clock: 0 }];
            let lit = p.k, t = 0;
            while (lit < p.N) { lit += 1; t += p.s; post.push({ lit, clock: t }); }
            return { pre, post };
        },
        done: (p, s) => s.lit >= p.N,
        givens: p => [p.k + ' lanterns are lit so far.', 'She walks from lantern to lantern at a steady pace.', 'The far end of the street is lost in the fog.'],
        wonders: () => [
            'When will the last lantern be lit?',
            'Why is the street so foggy?',
            'How long do the lanterns burn?',
            'Does the lamplighter get tired?',
        ],
        info: p => [
            { id: 'count', ask: 'How many lanterns are on the street?', value: p.N + ' lanterns, all the way to the bridge.', need: true, hidden: true },
            { id: 'gap', ask: 'How long between one lantern and the next?', value: 'She lights one every ' + p.s + ' seconds.', need: true },
            { id: 'length', ask: 'How long is the street?', value: p.length + ' metres.' },
            { id: 'burn', ask: 'How long does a lantern burn?', value: 'About ' + p.burn + ' hours.' },
            { id: 'age', ask: 'How old is the lamplighter?', value: p.age + '. She has done this for a long time.' },
            { id: 'oil', ask: 'What oil do the lanterns use?', value: 'Glow-beetle oil. It smells of toffee.', hidden: true },
        ],
        hint: () => 'You need how many lanterns there are in total (ask: it is hidden in the fog) and how long each one takes. Some are lit already.',
        model: () => 'lanterns still dark × seconds each = seconds',
        label: (p, s) => (s.clock == null ? '' : '⏱ +' + s.clock + ' s'),
    };

    // 3. Imps stack blocks up towards the clock face.
    TASKS.tower = {
        title: 'The Clock Tower Stack',
        unit: 'blocks',
        params(rng, d) {
            const h = d === 1 ? rng.pick([20, 25, 50]) : rng.pick([15, 20, 25, 30, 40]);
            const M = d === 1 ? rng.int(12, 24) : rng.int(16, 30);
            let extra = 0;
            if (d >= 2) extra = 5 * rng.int(1, Math.max(1, h / 5 - 1));
            let H = h * M + extra;
            if (d === 3) H = Math.ceil(H / 10) * 10; // a clean 1-decimal metre value
            const n0 = Math.round(M * (0.35 + 0.1 * rng.next()));
            return { h, H, n0, metres: d === 3, weight: rng.int(6, 30), builders: rng.int(3, 9), clockW: 10 * rng.int(8, 20) };
        },
        answer: p => Math.ceil(p.H / p.h) - p.n0,
        naive: p => Math.ceil(p.H / p.h),
        sim(p) {
            const pre = [];
            for (let i = 0; i <= p.n0; i++) pre.push({ blocks: i, clock: null });
            const post = [{ blocks: p.n0, clock: 0 }];
            let height = p.n0 * p.h, added = 0;
            while (height < p.H) { height += p.h; added += 1; post.push({ blocks: p.n0 + added, clock: added }); }
            return { pre, post };
        },
        done: (p, s) => s.blocks * p.h >= p.H,
        givens: p => [p.n0 + ' blocks are stacked so far.', 'All the blocks are the same size.', 'The imps want the stack to reach the clock face.'],
        wonders: () => [
            'How many more blocks until the stack reaches the clock face?',
            'Why do the imps want to reach the clock?',
            'Will the tower fall over?',
            'How heavy is the whole stack?',
        ],
        info: p => [
            { id: 'clockh', ask: 'How high up is the clock face?', value: 'The bottom of the clock face is ' + (p.metres ? (p.H / 100).toFixed(1) + ' m' : p.H + ' cm') + ' above the ground.', need: true },
            { id: 'blockh', ask: 'How tall is one block?', value: p.h + ' cm.', need: true, hidden: true },
            { id: 'weight', ask: 'How heavy is one block?', value: p.weight + ' kg.' },
            { id: 'builders', ask: 'How many imps are building?', value: p.builders + ' imps, all shouting.' },
            { id: 'clockw', ask: 'How wide is the clock face?', value: p.clockW + ' cm across.' },
            { id: 'stone', ask: 'What are the blocks made of?', value: 'Rift-stone. Very grumpy rift-stone.', hidden: true },
        ],
        hint: p => 'You need the height of the clock face and the height of one block (ask for it).' + (p.metres ? ' Watch the units: metres and centimetres.' : '') + ' Then remember the blocks already there, and that you cannot stack part of a block.',
        model: () => 'blocks needed to reach the clock − blocks already there (round up!)',
        label: (p, s) => (s.clock == null ? '🧱 ' + s.blocks : '🧱 +' + s.clock + ' blocks'),
    };

    // 4. A dripping tap fills the witch's cauldron.
    TASKS.cauldron = {
        title: 'The Dripping Cauldron',
        unit: 'minutes',
        params(rng, d) {
            for (let tries = 0; tries < 200; tries++) {
                const C = d === 1 ? rng.int(6, 12) : rng.int(8, 16);
                const D = rng.pick([20, 25, 30, 40, 50]);
                const S = d === 1 ? 0 : rng.int(Math.ceil(C / 4), Math.floor(C / 2));
                const drops = (C - S) * D;
                const per10 = d === 3;
                const cands = [];
                for (let R = 10; R <= 60; R++) {
                    if (per10 && R % 6) continue;
                    if (drops % R) continue;
                    const T = drops / R;
                    if (T >= 6 && T <= 40) cands.push(R);
                }
                if (!cands.length) continue;
                const R = rng.pick(cands);
                return { C, D, S, R, per10, temp: rng.int(9, 15), weight: rng.int(30, 80) };
            }
            return { C: 8, D: 25, S: d === 1 ? 0 : 2, R: 10, per10: false, temp: 12, weight: 40 };
        },
        answer: p => ((p.C - p.S) * p.D) / p.R,
        naive: p => (p.C - p.S) / p.R,
        sim(p) {
            const pre = [];
            const steps = Math.max(4, p.S * 2);
            for (let i = 0; i <= steps; i++) pre.push({ cups: (p.S * i) / steps, clock: null });
            const target = p.C * p.D;
            let drops = p.S * p.D, t = 0;
            const post = [{ cups: p.S, clock: 0 }];
            while (drops < target) { drops += p.R; t += 1; post.push({ cups: Math.min(drops, target) / p.D, clock: t }); }
            return { pre, post };
        },
        done: (p, s) => s.cups >= p.C - 1e-9,
        givens: p => [p.S ? 'There is already some water in the cauldron.' : 'The cauldron is empty.', 'The tap drips at a steady rate.', 'The witch measures her water in cups.'],
        wonders: () => [
            'How long until the cauldron is full?',
            'Why doesn\'t the witch fix the tap?',
            'What is she going to cook?',
            'How many drops fit in the cauldron?',
        ],
        info: p => {
            const list = [
                { id: 'size', ask: 'How much does the cauldron hold?', value: p.C + ' cups when it is full.', need: true },
                { id: 'drops', ask: 'How many drops make one cup?', value: p.D + ' drops.', need: true, hidden: true },
                { id: 'rate', ask: 'How fast does the tap drip?', value: p.per10 ? (p.R / 6) + ' drops every 10 seconds.' : p.R + ' drops every minute.', need: true },
            ];
            if (p.S) list.push({ id: 'now', ask: 'How much water is in it now?', value: p.S + ' cups already.', need: true });
            return list.concat([
                { id: 'temp', ask: 'How cold is the water?', value: p.temp + ' °C.' },
                { id: 'weight', ask: 'How heavy is the cauldron?', value: p.weight + ' kg, empty.' },
                { id: 'dinner', ask: 'What is for dinner?', value: 'Turnip soup. Again.' },
                { id: 'tapage', ask: 'How old is the tap?', value: 'Older than the witch, and she is very old.', hidden: true },
            ]);
        },
        hint: p => 'You need the size of the cauldron in cups, how many drops make a cup (ask for it), and how fast it drips' + (p.S ? ', and how much is in it already' : '') + (p.per10 ? '. The drip rate is per 10 seconds: how many per minute?' : '.'),
        model: () => 'drops still needed ÷ drops per minute = minutes',
        label: (p, s) => (s.clock == null ? '' : '⏱ +' + s.clock + ' min'),
    };

    // 5. The queue at the toffee-apple stall.
    TASKS.queue = {
        title: 'The Toffee-Apple Queue',
        unit: 'minutes',
        params(rng, d) {
            const Q = d === 1 ? rng.int(6, 12) : d === 2 ? rng.int(9, 18) : rng.int(15, 26);
            const w = d === 1 ? 2 : d === 2 ? rng.pick([2, 3]) : rng.pick([3, 4]);
            const m = d === 1 ? rng.pick([2, 3, 4]) : rng.int(2, 6);
            return { Q, w, m, behind: rng.int(6, 14), price: rng.int(2, 5) };
        },
        answer: p => (Math.ceil((p.Q + 1) / p.w) - 1) * p.m,
        naive: p => p.Q * p.m,
        sim(p) {
            const pre = [];
            for (let r = 2; r >= 0; r--) pre.push({ pos: p.Q + 1 + r * p.w, clock: null });
            const post = [{ pos: p.Q + 1, clock: 0 }];
            let pos = p.Q + 1, t = 0;
            while (pos > p.w) { pos -= p.w; t += p.m; post.push({ pos, clock: t }); }
            return { pre, post };
        },
        done: (p, s) => s.pos <= p.w,
        givens: p => [p.Q + ' people are ahead of you (you wear the gold hat).', 'The stall\'s hatches are round the side: you cannot see them from here.'],
        wonders: () => [
            'How long until it is my turn?',
            'Are the toffee apples worth the wait?',
            'Why is everyone queueing?',
            'Will they run out before I get there?',
        ],
        info: p => [
            { id: 'hatches', ask: 'How many serving hatches are open?', value: p.w + ' hatches. Everyone at the hatches is served at the same time.', need: true, hidden: true },
            { id: 'time', ask: 'How long does each customer take?', value: p.m + ' minutes each.', need: true },
            { id: 'behind', ask: 'How many people are behind you?', value: p.behind + ' people.' },
            { id: 'sells', ask: 'What does the stall sell?', value: 'Toffee apples and wonder-floss.' },
            { id: 'price', ask: 'How much is a toffee apple?', value: p.price + ' coins.' },
            { id: 'opened', ask: 'When did the stall open?', value: 'At noon, with a trumpet.', hidden: true },
        ],
        hint: p => 'You need how many hatches are open (ask: you cannot see them) and how long each customer takes. People behind you do not matter.',
        model: () => 'rounds of serving before your turn × minutes per round',
        label: (p, s) => (s.clock == null ? '' : '⏱ +' + s.clock + ' min'),
    };

    // 6. A growing pattern of floor tiles for the dance floor.
    function tileCoords(p, n) {
        const out = [];
        if (p.kind === 'linear') {
            const dirs = [[1, 0], [0, -1], [-1, 0], [0, 1]].slice(0, p.a);
            out.push([0, 0]);
            dirs.forEach(([dx, dy]) => { for (let k = 1; k <= n; k++) out.push([k * dx, k * dy]); });
        } else {
            for (let r = 0; r < n; r++) for (let c = 0; c < n + p.b; c++) out.push([c, r]);
            for (let j = 0; j < p.c; j++) out.push([j, n]);
        }
        return out;
    }
    const tileFormula = (p, n) => (p.kind === 'linear' ? p.a * n + 1 : n * (n + p.b) + p.c);

    TASKS.tiles = {
        title: 'The Growing Dance Floor',
        unit: 'tiles',
        params(rng, d) {
            if (d === 1) return { kind: 'linear', a: rng.int(2, 4), b: 0, c: 0, N: rng.int(10, 20), size: rng.pick([15, 20, 25]), speed: rng.int(3, 8) };
            if (d === 2) return { kind: 'quad', a: 0, b: rng.int(0, 1), c: 0, N: rng.int(8, 14), size: rng.pick([15, 20, 25]), speed: rng.int(3, 8) };
            return { kind: 'quad', a: 0, b: rng.int(1, 2), c: rng.int(1, 3), N: rng.int(10, 18), size: rng.pick([15, 20, 25]), speed: rng.int(3, 8) };
        },
        answer: p => tileFormula(p, p.N),
        // linear: "step N is N times step 1"; quadratic: "it grows by the same amount every step"
        naive: p => (p.kind === 'linear' ? p.N * tileFormula(p, 1) : tileFormula(p, 1) + (p.N - 1) * (tileFormula(p, 2) - tileFormula(p, 1))),
        sim(p) {
            const pre = [{ show: [1], clock: null }, { show: [1, 2], clock: null }, { show: [1, 2, 3], clock: null }];
            const post = [{ show: [1, 2, 3], clock: null }];
            for (let n = 4; n <= p.N; n++) post.push({ big: n, clock: tileCoords(p, n).length });
            return { pre, post };
        },
        done: (p, s) => s.big === p.N,
        givens: () => ['Each step of the pattern is bigger than the one before.', 'The finished dance floor will be one of the later steps.'],
        wonders: () => [
            'How many tiles will the finished dance floor need?',
            'Who is going to dance on it?',
            'What does step 0 look like?',
            'How long will the tiling take?',
        ],
        info: p => {
            const counts = [1, 2, 3, 4].map(n => tileFormula(p, n));
            return [
                { id: 'counts', ask: 'How many tiles are in steps 1 to 4?', value: 'Step 1: ' + counts[0] + ', step 2: ' + counts[1] + ', step 3: ' + counts[2] + ', step 4: ' + counts[3] + '.', need: true },
                { id: 'step', ask: 'Which step will the finished dance floor be?', value: 'Step ' + p.N + '.', need: true, hidden: true },
                { id: 'size', ask: 'How big is each tile?', value: p.size + ' cm on each side.' },
                { id: 'speed', ask: 'How fast does the tiler work?', value: 'One tile every ' + p.speed + ' seconds.' },
                { id: 'colours', ask: 'What colours are the tiles?', value: 'Gold and violet, like a chessboard.' },
                { id: 'tiler', ask: 'Who is laying the tiles?', value: 'A very patient beetle.', hidden: true },
            ];
        },
        hint: p => 'You need the tile counts for the first steps and which step the dance floor is (ask for it). '
            + (p.kind === 'linear' ? 'Look at how much each step adds: is it always the same?' : 'Look at how much each step adds: does the jump itself grow? Try drawing step n as a rectangle.'),
        model: p => (p.kind === 'linear' ? 'step 1 + (steps after it) × (tiles added each step)' : 'look for n × (n + something): the jump grows every step'),
        label: (p, s) => (s.big ? 'Step ' + s.big + ': ' + s.clock + ' tiles' : ''),
    };

    const TASK_IDS = Object.keys(TASKS);

    // ------------------------------------------------------------------
    // Pure helpers: calculator, table extension
    // ------------------------------------------------------------------

    // Safe arithmetic: + − × ÷ ( ) and decimals. Returns a number or null.
    function evaluate(text) {
        const s = String(text || '').replace(/×|x/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/,/g, '.').replace(/\s+/g, '');
        if (!s) return null;
        let i = 0;
        function number() {
            const m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i));
            if (!m) throw new Error('number');
            i += m[0].length;
            return parseFloat(m[0]);
        }
        function factor() {
            if (s[i] === '-') { i++; return -factor(); }
            if (s[i] === '+') { i++; return factor(); }
            if (s[i] === '(') {
                i++;
                const v = expr();
                if (s[i] !== ')') throw new Error(')');
                i++;
                return v;
            }
            return number();
        }
        function term() {
            let v = factor();
            while (s[i] === '*' || s[i] === '/') {
                const op = s[i++];
                const r = factor();
                v = op === '*' ? v * r : v / r;
            }
            return v;
        }
        function expr() {
            let v = term();
            while (s[i] === '+' || s[i] === '-') {
                const op = s[i++];
                const r = term();
                v = op === '+' ? v + r : v - r;
            }
            return v;
        }
        try {
            const v = expr();
            if (i !== s.length || !isFinite(v)) return null;
            return Math.round(v * 1e9) / 1e9;
        } catch (e) { return null; }
    }

    // Continue a table to x: through the last three points (a parabola, which
    // is a straight line when the jumps are equal), or the last two.
    function extend(points, x) {
        const pts = points.filter(pt => isFinite(pt[0]) && isFinite(pt[1])).sort((a, b) => a[0] - b[0]);
        const uniq = pts.filter((pt, i) => i === 0 || pt[0] !== pts[i - 1][0]);
        if (uniq.length < 2 || !isFinite(x)) return null;
        const use = uniq.slice(-3);
        let y = 0;
        for (let i = 0; i < use.length; i++) {
            let term = use[i][1];
            for (let j = 0; j < use.length; j++) if (j !== i) term *= (x - use[j][0]) / (use[i][0] - use[j][0]);
            y += term;
        }
        return Math.round(y * 1e6) / 1e6;
    }

    // ------------------------------------------------------------------
    // generate / check / hints / why / solve
    // ------------------------------------------------------------------

    function toleranceFor(d, ans) {
        const t = TOL[d] || TOL[1];
        return Math.max(t.min, Math.round(Math.abs(ans) * t.pct * 10) / 10);
    }

    function generate(rng, difficulty, opts) {
        const d = Math.max(1, Math.min(3, Math.round(Number(difficulty) || 1)));
        const taskId = (opts && opts.task && TASKS[opts.task]) ? opts.task : rng.pick(TASK_IDS);
        const T = TASKS[taskId];
        const p = T.params(rng.fork('params'), d);
        const answer = T.answer(p);
        const info = T.info(p, d);
        const wonders = T.wonders(p);
        const spread = 2.2 + rng.next();
        const max = Math.max(10, Math.ceil((answer * spread) / 5) * 5);
        return {
            difficulty: d,
            task: taskId,
            title: T.title,
            unit: T.unit,
            question: wonders[0],
            wonders,
            givens: T.givens(p),
            info,
            p,
            answer,
            tolerance: toleranceFor(d, answer),
            range: { min: 0, max },
            reflections: REFLECTIONS.slice(),
            whyShuffle: rng.int(1, 1e6),
            uiSeed: rng.int(1, 1e6),
        };
    }

    function needIds(data) { return data.info.filter(i => i.need).map(i => i.id); }

    function checkAnswer(data, answer) {
        if (!data || !TASKS[data.task] || !answer || typeof answer !== 'object') {
            return { solved: false, partial: 0, feedback: 'Nothing to check yet.' };
        }
        const T = TASKS[data.task];
        const truth = T.answer(data.p);
        const tol = toleranceFor(data.difficulty, truth);
        const requested = Array.isArray(answer.requested) ? answer.requested.filter(id => data.info.some(i => i.id === id)) : [];
        const missing = data.info.filter(i => i.need && requested.indexOf(i.id) < 0);
        const herrings = data.info.filter(i => !i.need && requested.indexOf(i.id) >= 0);
        const model = typeof answer.model === 'string' ? evaluate(answer.model) : Number(answer.model);
        const hasModel = answer.model != null && answer.model !== '' && isFinite(model);
        const off = hasModel ? Math.abs(model - truth) : Infinity;
        const close = off <= tol + 1e-9;
        const reflected = Number.isInteger(answer.reflection) && answer.reflection >= 0 && answer.reflection < REFLECTIONS.length;
        const g = answer.guess || {};
        const inRange = isFinite(g.low) && isFinite(g.high) && truth >= g.low && truth <= g.high;
        const tidy = herrings.length === 0;
        const unit = data.unit;
        const result = { tidy, herrings: herrings.length, missing: missing.map(i => i.id), truth, tolerance: tol, inRange };

        if (!hasModel) return Object.assign(result, { solved: false, partial: 0.1, feedback: 'Your model needs a number: what does it predict?' });
        if (close && !missing.length) {
            if (!reflected) return Object.assign(result, { solved: false, partial: 0.8, feedback: 'Your model works! One last step: say why it matched (or was a little off).' });
            if(answer.reflection===2) return Object.assign(result,{solved:false,partial:0.8,feedback:'You asked for every needed fact. Missing information does not explain this result. Compare your prediction with the answer and choose a reflection that fits.'});
            if(off<=1e-9 && answer.reflection!==MATCHED) return Object.assign(result,{solved:false,partial:0.8,feedback:'Your prediction matched the answer exactly. Choose “It matched”, or change your model if you meant to show an error.'});
            const extras = [];
            if (tidy) extras.push('You asked only for what mattered.');
            else extras.push('You also asked about ' + herrings.length + ' thing' + (herrings.length > 1 ? 's' : '') + ' that did not matter: a tidy model leaves those out.');
            if (inRange) extras.push('And the answer was inside your guess range.');
            return Object.assign(result, {
                solved: true,
                partial: 1,
                feedback: 'Your model said ' + fmt(model) + ' ' + unit + '; the answer was ' + fmt(truth) + '. ' + extras.join(' '),
            });
        }
        if (close && missing.length) {
            return Object.assign(result, {
                solved: false,
                partial: 0.5,
                feedback: 'Close, but you never asked for something your model needs (' + missing.map(i => i.ask.replace(/\?$/, '').toLowerCase()).join('; ') + '). A good guess is not yet a model.',
            });
        }
        const dir = model < truth ? 'too low' : 'too high';
        const near = Math.max(0, 1 - off / Math.max(1, Math.abs(truth)));
        return Object.assign(result, {
            solved: false,
            partial: Math.round((missing.length ? 0.15 : 0.3) * near * 100) / 100 + (missing.length ? 0.05 : 0.1),
            feedback: 'Your model said ' + fmt(model) + ' ' + unit + ', ' + dir + ' (the answer was ' + fmt(truth) + ').' + (missing.length ? ' Your model was missing some information that matters.' : ' You had the right information: check your assumptions and your rounding.'),
        });
    }

    function hintsFor(data) {
        const T = TASKS[data.task];
        return [
            'Imagine working it out by hand. Which numbers would you need? Ask only for those, and use "Something missing?" if one is not on the list.',
            T.hint(data.p),
            'One way to model it: ' + T.model(data.p) + '.',
        ];
    }

    function whyFor(data) {
        const opts = [
            'Modelling is choosing what matters: maths starts with a good question and the information that answers it.',
            'Maths is mostly remembering the right formula for each kind of question.',
            'Guessing first is a waste of time: only the calculation counts.',
            'More information always gives a better answer, so ask for everything.',
        ];
        const order = Rift.makeRng(data.whyShuffle || 1).shuffle(opts.map((_, i) => i));
        return {
            question: 'What did the three acts show about mathematics?',
            options: order.map(i => opts[i]),
            correct: order.indexOf(0),
            explain: 'Modelling means asking a question, finding the needed information and checking a prediction against the result. Extra facts are not always useful. This is one way mathematics helps us think.',
        };
    }

    function solveFor(data) {
        const ans = TASKS[data.task].answer(data.p);
        return {
            wonder: 0,
            guess: { low: Math.floor(ans * 0.5), high: Math.ceil(ans * 1.5) + 1, best: ans },
            requested: needIds(data),
            model: ans,
            reflection: MATCHED,
        };
    }

    // ------------------------------------------------------------------
    // Drawing (SVG strings, viewBox 0 0 400 240)
    // ------------------------------------------------------------------

    const INK = '#1A1020';
    const VIOLET = '#A05CF0';
    const GOLD = '#F2B632';

    const DRAW = {};

    DRAW.hourglass = (p, s, phase, flowing) => {
        const frac = Math.max(0, Math.min(1, s.level / p.cap));
        const sandTop = 210 - frac * 88;
        const topFrac = 0.75;
        return '<defs>'
            + '<radialGradient id="ta-hg-rift" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#E3C8FF"/><stop offset=".5" stop-color="' + VIOLET + '" stop-opacity=".7"/><stop offset="1" stop-color="' + VIOLET + '" stop-opacity="0"/></radialGradient>'
            + '<clipPath id="ta-hg-bot"><path d="M196 122 C190 140 150 160 150 210 L250 210 C250 160 210 140 204 122 Z"/></clipPath>'
            + '<clipPath id="ta-hg-top"><path d="M150 36 C150 80 190 100 196 118 L204 118 C210 100 250 80 250 36 Z"/></clipPath>'
            + '</defs>'
            + '<rect width="400" height="240" fill="#120d22"/>'
            + '<g class="ta-twinkle">' + [[40, 40], [80, 120], [340, 60], [360, 170], [30, 200], [300, 20]].map(([x, y]) => '<circle cx="' + x + '" cy="' + y + '" r="1.6" fill="#EFE3C8"/>').join('') + '</g>'
            + '<ellipse class="ta-rift" cx="200" cy="12" rx="70" ry="14" fill="url(#ta-hg-rift)"/>'
            + (flowing ? '<line class="ta-pour" x1="200" y1="14" x2="200" y2="40" stroke="#D9B8FF" stroke-width="3"/>' : '')
            + '<rect x="118" y="26" width="164" height="10" rx="3" fill="#6b4a2a" stroke="' + INK + '" stroke-width="2.5"/>'
            + '<rect x="118" y="210" width="164" height="12" rx="3" fill="#6b4a2a" stroke="' + INK + '" stroke-width="2.5"/>'
            + '<rect x="124" y="36" width="7" height="174" fill="#84603a" stroke="' + INK + '" stroke-width="2"/>'
            + '<rect x="269" y="36" width="7" height="174" fill="#84603a" stroke="' + INK + '" stroke-width="2"/>'
            + '<g clip-path="url(#ta-hg-top)"><rect x="140" y="' + (118 - 82 * topFrac) + '" width="120" height="120" fill="' + VIOLET + '"/></g>'
            + '<g clip-path="url(#ta-hg-bot)"><rect x="140" y="' + sandTop.toFixed(1) + '" width="120" height="100" fill="' + VIOLET + '"/>'
            + '<rect x="140" y="' + sandTop.toFixed(1) + '" width="120" height="3" fill="#D9B8FF" opacity=".8"/></g>'
            + (flowing && frac < 1 ? '<line class="ta-stream" x1="200" y1="116" x2="200" y2="' + sandTop.toFixed(1) + '" stroke="#D9B8FF" stroke-width="2.5"/>' : '')
            + '<path d="M150 36 C150 80 190 100 196 118 L204 118 C210 100 250 80 250 36 Z" fill="rgba(200,220,255,.10)" stroke="#cfe3ff" stroke-width="2.5"/>'
            + '<path d="M196 122 C190 140 150 160 150 210 L250 210 C250 160 210 140 204 122 Z" fill="rgba(200,220,255,.10)" stroke="#cfe3ff" stroke-width="2.5"/>'
            + '<rect x="194" y="116" width="12" height="8" fill="#cfe3ff" stroke="' + INK + '" stroke-width="1.5"/>'
            + (frac >= 1 ? '<text x="200" y="238" text-anchor="middle" font-size="12" fill="' + GOLD + '" font-family="Georgia,serif">FULL</text>' : '');
    };

    function lanternPos(p, i) {
        const f = p.N > 1 ? i / (p.N - 1) : 0;
        const x = 34 + f * 340;
        const y = 214 - f * 118 - Math.sin(f * Math.PI) * 14;
        return { x, y, sc: 1 - 0.58 * f };
    }

    DRAW.lanterns = (p, s, phase) => {
        let out = '<defs><linearGradient id="ta-ln-fog" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#8e86a8" stop-opacity="0"/><stop offset=".2" stop-color="#8e86a8" stop-opacity=".96"/><stop offset="1" stop-color="#a59ebd" stop-opacity="1"/></linearGradient>'
            + '<radialGradient id="ta-ln-glow"><stop offset="0" stop-color="' + GOLD + '" stop-opacity=".75"/><stop offset="1" stop-color="' + GOLD + '" stop-opacity="0"/></radialGradient></defs>'
            + '<rect width="400" height="240" fill="#141a33"/>'
            + '<circle cx="330" cy="40" r="16" fill="#EFE3C8" opacity=".85"/>'
            + '<path d="M0 240 L0 222 C120 214 260 120 400 92 L400 104 C280 136 160 222 60 240 Z" fill="#2a2440" stroke="' + INK + '" stroke-width="2"/>'
            + '<path d="M0 160 L30 150 L30 120 L55 105 L80 120 L80 175 Z M90 150 L90 110 L115 92 L140 110 L140 140 Z" fill="#0d0b18" opacity=".8"/>';
        for (let i = 0; i < p.N; i++) {
            const { x, y, sc } = lanternPos(p, i);
            const lit = i < s.lit;
            const ph = 34 * sc;
            out += '<line x1="' + x.toFixed(1) + '" y1="' + y.toFixed(1) + '" x2="' + x.toFixed(1) + '" y2="' + (y - ph).toFixed(1) + '" stroke="' + INK + '" stroke-width="' + (3 * sc).toFixed(2) + '"/>';
            if (lit) out += '<circle cx="' + x.toFixed(1) + '" cy="' + (y - ph).toFixed(1) + '" r="' + (16 * sc).toFixed(1) + '" fill="url(#ta-ln-glow)"/>';
            out += '<rect x="' + (x - 5 * sc).toFixed(1) + '" y="' + (y - ph - 7 * sc).toFixed(1) + '" width="' + (10 * sc).toFixed(1) + '" height="' + (12 * sc).toFixed(1) + '" rx="' + (2 * sc).toFixed(1) + '" fill="' + (lit ? GOLD : '#3a3350') + '" stroke="' + INK + '" stroke-width="' + (1.6 * sc).toFixed(2) + '"/>';
        }
        // the lamplighter, beside the last lantern she lit
        const at = lanternPos(p, Math.max(0, Math.min(p.N - 1, s.lit - 1)));
        const ls = at.sc;
        out += '<g transform="translate(' + (at.x + 9 * ls).toFixed(1) + ',' + at.y.toFixed(1) + ') scale(' + ls.toFixed(2) + ')">'
            + '<path d="M-6 0 L0 -20 L6 0 Z" fill="' + VIOLET + '" stroke="' + INK + '" stroke-width="1.6"/><circle cx="0" cy="-24" r="5" fill="#EFE3C8" stroke="' + INK + '" stroke-width="1.6"/>'
            + '<line x1="3" y1="-14" x2="10" y2="-34" stroke="#84603a" stroke-width="2"/><circle cx="10" cy="-35" r="2" fill="' + GOLD + '"/></g>';
        if (phase !== 'act3') {
            const fogFrom = lanternPos(p, Math.min(p.N - 1, p.k + 2)).x - 30;
            out += '<rect class="ta-fog" x="' + fogFrom.toFixed(1) + '" y="0" width="' + (400 - fogFrom + 2).toFixed(1) + '" height="240" fill="url(#ta-ln-fog)"/>';
        }
        return out;
    };

    DRAW.tower = (p, s) => {
        const ground = 224;
        const scale = 136 / (p.H + p.h); // leaves headroom for the clock tower roof
        const clockY = ground - p.H * scale;
        let out = '<rect width="400" height="240" fill="#16132a"/>'
            + '<rect x="0" y="' + ground + '" width="400" height="16" fill="#2a2235"/>'
            // the clock tower
            + '<rect x="250" y="' + (clockY - 44).toFixed(1) + '" width="86" height="' + (ground - clockY + 44).toFixed(1) + '" fill="#2e2742" stroke="' + INK + '" stroke-width="2.5"/>'
            + '<path d="M244 ' + (clockY - 44).toFixed(1) + ' L293 ' + (clockY - 74).toFixed(1) + ' L342 ' + (clockY - 44).toFixed(1) + ' Z" fill="#4a2f5e" stroke="' + INK + '" stroke-width="2.5"/>'
            + '<circle cx="293" cy="' + (clockY - 20).toFixed(1) + '" r="19" fill="#EFE3C8" stroke="' + INK + '" stroke-width="2.5"/>'
            + '<line x1="293" y1="' + (clockY - 20).toFixed(1) + '" x2="293" y2="' + (clockY - 33).toFixed(1) + '" stroke="' + INK + '" stroke-width="2"/>'
            + '<line x1="293" y1="' + (clockY - 20).toFixed(1) + '" x2="302" y2="' + (clockY - 16).toFixed(1) + '" stroke="' + INK + '" stroke-width="2"/>'
            + '<line x1="110" y1="' + clockY.toFixed(1) + '" x2="276" y2="' + clockY.toFixed(1) + '" stroke="' + GOLD + '" stroke-width="2" stroke-dasharray="6 4"/>';
        const bh = p.h * scale;
        for (let i = 0; i < s.blocks; i++) {
            const y = ground - (i + 1) * bh;
            out += '<rect x="140" y="' + y.toFixed(2) + '" width="64" height="' + bh.toFixed(2) + '" fill="' + (i % 2 ? '#8f6fa3' : '#6f5486') + '" stroke="' + INK + '" stroke-width="' + Math.min(2, Math.max(0.6, bh / 6)).toFixed(2) + '"/>';
        }
        const top = ground - s.blocks * bh;
        // an imp on top of the stack
        out += '<g transform="translate(172,' + top.toFixed(1) + ')"><circle cx="0" cy="-9" r="8" fill="' + VIOLET + '" stroke="' + INK + '" stroke-width="2"/>'
            + '<path d="M-6 -15 L-9 -23 L-2 -16 M6 -15 L9 -23 L2 -16" stroke="' + INK + '" stroke-width="2" fill="none"/>'
            + '<circle cx="-3" cy="-10" r="1.6" fill="' + GOLD + '"/><circle cx="3" cy="-10" r="1.6" fill="' + GOLD + '"/></g>';
        return out;
    };

    DRAW.cauldron = (p, s, phase, flowing) => {
        const frac = Math.max(0, Math.min(1, s.cups / p.C));
        const top = 120, bottom = 212;
        const level = bottom - frac * (bottom - top - 4);
        return '<defs><clipPath id="ta-cd-bowl"><path d="M118 120 L282 120 C282 180 250 212 200 212 C150 212 118 180 118 120 Z"/></clipPath></defs>'
            + '<rect width="400" height="240" fill="#14201c"/>'
            + '<path d="M60 0 L60 40 L200 40 L200 58" fill="none" stroke="#9a7a3a" stroke-width="10" stroke-linejoin="round"/>'
            + '<path d="M60 0 L60 40 L200 40 L200 58" fill="none" stroke="' + INK + '" stroke-width="2" opacity=".5"/>'
            + '<rect x="190" y="56" width="20" height="8" rx="2" fill="#b8963f" stroke="' + INK + '" stroke-width="2"/>'
            + (flowing && frac < 1 ? '<path class="ta-drop" d="M200 66 C196 74 196 78 200 80 C204 78 204 74 200 66 Z" fill="#7fd6ff"/>' : '')
            + '<g clip-path="url(#ta-cd-bowl)"><rect x="110" y="' + level.toFixed(1) + '" width="180" height="120" fill="#3fa36b"/>'
            + '<rect x="110" y="' + level.toFixed(1) + '" width="180" height="3" fill="#9df2c2" opacity=".8"/></g>'
            + '<path d="M118 120 L282 120 C282 180 250 212 200 212 C150 212 118 180 118 120 Z" fill="none" stroke="' + INK + '" stroke-width="3"/>'
            + '<path d="M118 120 L282 120 C282 180 250 212 200 212 C150 212 118 180 118 120 Z" fill="rgba(30,25,40,.35)" stroke="#5a5070" stroke-width="2"/>'
            + '<rect x="110" y="114" width="180" height="10" rx="5" fill="#3a3350" stroke="' + INK + '" stroke-width="2.5"/>'
            + '<path class="ta-fire" d="M160 236 L172 214 L180 228 L192 206 L204 228 L214 212 L228 236 Z" fill="#E8384F" stroke="' + INK + '" stroke-width="2"/>'
            + '<path d="M176 236 L186 222 L196 232 L206 220 L214 236 Z" fill="' + GOLD + '"/>'
            + (frac >= 1 ? '<text x="200" y="108" text-anchor="middle" font-size="12" fill="' + GOLD + '" font-family="Georgia,serif">FULL</text>' : '');
    };

    DRAW.queue = (p, s) => {
        let out = '<rect width="400" height="240" fill="#1a1426"/>'
            + '<rect x="0" y="196" width="400" height="44" fill="#2a2235"/>'
            // the stall: hatches on the side facing the queue
            + '<rect x="318" y="70" width="80" height="130" fill="#7a2f4f" stroke="' + INK + '" stroke-width="2.5"/>'
            + '<path d="M312 72 L356 40 L404 72 Z" fill="' + GOLD + '" stroke="' + INK + '" stroke-width="2.5"/>'
            + '<circle cx="360" cy="94" r="10" fill="#E8384F" stroke="' + INK + '" stroke-width="2"/><line x1="360" y1="84" x2="362" y2="78" stroke="#4a8a3a" stroke-width="2.5"/>';
        const hatchY = i => 116 + i * (76 / Math.max(1, p.w));
        for (let i = 0; i < p.w; i++) out += '<rect x="318" y="' + hatchY(i).toFixed(1) + '" width="10" height="' + (60 / p.w).toFixed(1) + '" fill="#f6d78a" stroke="' + INK + '" stroke-width="1.5"/>';
        const total = s.pos + 5; // you plus five people behind you
        const lineCount = Math.max(1, total - p.w);
        const gap = Math.min(15, 282 / lineCount);
        const person = (x, y, me, n) => '<g transform="translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ')">'
            + '<path d="M-5 0 L0 -15 L5 0 Z" fill="' + (me ? GOLD : n > s.pos ? '#5a5070' : VIOLET) + '" stroke="' + INK + '" stroke-width="1.4"/>'
            + '<circle cx="0" cy="-19" r="4.5" fill="#EFE3C8" stroke="' + INK + '" stroke-width="1.4"/>'
            + (me ? '<path d="M-5 -22 L5 -22 L3 -28 L-3 -28 Z" fill="' + GOLD + '" stroke="' + INK + '" stroke-width="1.2"/>' : '') + '</g>';
        for (let n = total; n >= 1; n--) {
            if (n <= p.w) out += person(306 - ((n - 1) % 2) * 9, hatchY(n - 1) + 60 / p.w + 4, n === s.pos, n);
            else out += person(298 - (n - p.w) * gap, 206, n === s.pos, n);
        }
        return out;
    };

    DRAW.tiles = (p, s) => {
        let out = '<rect width="400" height="240" fill="#181226"/>';
        const draw = (n, x0, y0, w, h, label) => {
            const pts = tileCoords(p, n);
            const xs = pts.map(t => t[0]), ys = pts.map(t => t[1]);
            const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
            const cols = maxX - minX + 1, rows = maxY - minY + 1;
            const size = Math.min(w / cols, h / rows, 22);
            const ox = x0 + (w - cols * size) / 2, oy = y0 + (h - rows * size) / 2;
            pts.forEach(([x, y]) => {
                out += '<rect x="' + (ox + (x - minX) * size).toFixed(2) + '" y="' + (oy + (y - minY) * size).toFixed(2) + '" width="' + size.toFixed(2) + '" height="' + size.toFixed(2)
                    + '" fill="' + ((x + y) % 2 ? VIOLET : GOLD) + '" stroke="' + INK + '" stroke-width="' + Math.max(0.4, Math.min(1.6, size / 10)).toFixed(2) + '"/>';
            });
            if (label) out += '<text x="' + (x0 + w / 2) + '" y="' + (y0 + h + 16) + '" text-anchor="middle" font-size="13" fill="#EFE3C8" font-family="Georgia,serif">' + label + '</text>';
        };
        if (s.big) draw(s.big, 30, 12, 340, 196, 'Step ' + s.big);
        else s.show.forEach((n, i) => draw(n, 14 + i * 128, 30, 116, 160, 'Step ' + n));
        return out;
    };

    // ------------------------------------------------------------------
    // DOM
    // ------------------------------------------------------------------

    function mount(container, data, api) {
        const el = Rift.el;
        const A = Rift.Assets;
        const T = TASKS[data.task];
        const sfx = name => { try { if (api && api.sfx) api.sfx(name); } catch (e) { /* sound is optional */ } };
        const say = text => { try { if (api && api.say) api.say(text, 'sundial'); } catch (e) { /* speech is optional */ } };
        const uiRng = Rift.makeRng(data.uiSeed || 1);
        const timers = [];
        const later = (fn, ms) => { const id = root.setTimeout(fn, ms); timers.push(id); return id; };
        let reduced = false;
        try { reduced = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* ignore */ }

        const sim = T.sim(data.p);
        const unit = data.unit;
        const st = {
            act: 1,
            frame: sim.pre[0],
            playing: false,
            wonder: null,
            wonderText: '',
            guess: { low: Math.round(data.range.max * 0.1), high: Math.round(data.range.max * 0.8), best: Math.round(data.range.max * 0.4) },
            guessTouched: false,
            requested: [],
            askOpen: false,
            model: '',
            reflection: null,
            seenAct1: false,
            seenAct3: false,
            result: null,
        };

        // ---- frame ----
        const actTabs = [1, 2, 3].map(n => el('span.ta-act', { text: 'Act ' + n + (n === 1 ? ' · Wonder' : n === 2 ? ' · Model' : ' · Reveal') }));
        const top = el('div.ta-top', null, [
            el('span.chip', { dataset: { colour: 'imagination' }, text: Rift.COLOURS.imagination.icon + ' The Three Acts' }),
            el('span.ta-title', { text: data.title }),
            el('span.ta-spacer'),
            el('div.ta-acts', null, actTabs),
        ]);

        const svg = el('div.ta-svgwrap');
        const clock = el('div.ta-clock');
        const bubble = el('div.ta-bubble');
        const playBtn = el('button.btn.small.ta-play', { text: '▶ Play', onclick: () => replay() });
        const stage = el('div.ta-stage', null, [svg, clock, bubble, playBtn]);
        if (data.task === 'hourglass' && A && A.has && A.has('ui/hourglass')) stage.appendChild(A.img('ui/hourglass', { className: 'ta-prop' }));

        const side = el('div.ta-side.parchment');
        const main = el('div.ta-main', null, [stage, side]);
        const rootEl = el('div.ta-root', null, [top, main]);
        try { if (root.getComputedStyle(container).position === 'static') container.style.position = 'relative'; } catch (e) { /* ignore */ }
        container.appendChild(rootEl);

        function draw(state, flowing) {
            const phase = 'act' + st.act;
            svg.innerHTML = '<svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' + DRAW[data.task](data.p, state, phase, flowing) + '</svg>';
            clock.textContent = T.label(data.p, state);
            clock.classList.toggle('show', !!clock.textContent);
        }
        function speak(text) {
            bubble.textContent = text;
            bubble.classList.remove('pop');
            void bubble.offsetWidth;
            bubble.classList.add('pop');
        }
        function setActs() {
            actTabs.forEach((t, i) => { t.classList.toggle('on', i + 1 === st.act); t.classList.toggle('past', i + 1 < st.act); });
        }

        // ---- playback ----
        let playToken = 0;
        function play(states, totalMs, done) {
            const token = ++playToken;
            st.playing = true;
            playBtn.disabled = true;
            renderSide();
            const step = reduced ? 30 : Math.max(70, Math.min(600, totalMs / Math.max(1, states.length - 1)));
            let i = 0;
            const tick = () => {
                if (token !== playToken) return;
                st.frame = states[i];
                draw(st.frame, i < states.length - 1);
                if (i > 0 && (data.task === 'tower' || data.task === 'lanterns')) sfx('place');
                i += 1;
                if (i < states.length) later(tick, step);
                else later(() => {
                    if (token !== playToken) return;
                    st.playing = false;
                    playBtn.disabled = false;
                    draw(st.frame, false);
                    if (done) done();
                    renderSide();
                }, reduced ? 30 : 350);
            };
            tick();
        }

        function replay() {
            if (st.playing) return;
            sfx('click');
            if (st.act === 3 && st.seenAct3) play(sim.post, 5200, null);
            else play(sim.pre, 3200, () => { st.seenAct1 = true; });
        }

        // ---- side panel ----
        const section = (title, kids, cls) => el('div.ta-sec' + (cls ? '.' + cls : ''), null, [el('div.ta-sechead', { text: title })].concat(kids));

        function renderSide() {
            setActs();
            const keep = side.scrollTop;
            side.innerHTML = '';
            if (st.act === 1) renderAct1();
            else if (st.act === 2) renderAct2();
            else renderAct3();
            side.scrollTop = keep;
        }

        // Act 1 ------------------------------------------------------------
        const wonderOrder = uiRng.shuffle(data.wonders.map((_, i) => i));

        function renderAct1() {
            side.appendChild(el('div.ta-pieces', null, data.givens.map(g => el('span.ta-piece', { text: g }))));
            if (!st.seenAct1) {
                side.appendChild(el('div.ta-wait', { text: st.playing ? 'Watch closely…' : 'Press ▶ Play to watch.' }));
                return;
            }
            const chips = wonderOrder.map(i => el('button.ta-wonder' + (st.wonder === i ? '.on' : ''), {
                text: data.wonders[i],
                onclick: () => chooseWonder(i),
            }));
            const typed = el('input.ta-input', { type: 'text', placeholder: 'Or type your own question…', maxLength: 120, value: st.wonderText });
            const typedBtn = el('button.btn.small', { text: 'Ask it', onclick: () => { if (typed.value.trim()) { st.wonderText = typed.value.trim(); chooseWonder(typed.value.trim()); } } });
            typed.addEventListener('keydown', e => { if (e.key === 'Enter') typedBtn.click(); });
            side.appendChild(section('1. What do you wonder?', [
                el('div.ta-wonders', null, chips),
                el('div.ta-row', null, [typed, typedBtn]),
            ]));
            if (st.wonder == null) return;
            side.appendChild(el('div.ta-question', null, [el('span.ta-qlabel', { text: 'Our question' }), el('span', { text: data.question })]));
            side.appendChild(section('2. Make a guess (no maths yet!)', [guessUi(true)]));
            side.appendChild(el('button.btn.gold.ta-next', { text: 'On to Act 2 →', onclick: () => toAct2() }));
        }

        function chooseWonder(w) {
            st.wonder = w;
            sfx('click');
            const main = w === 0;
            const line = main ? 'Yes! That is the question everyone asks first. Let us chase it.'
                : 'A good wonder! Hold on to it. Most people first ask: "' + data.question + '" Let us chase that one.';
            speak(main ? 'That is the one!' : 'Good wonder! Now try this one…');
            say(line);
            renderSide();
        }

        function guessUi(editable) {
            const max = data.range.max;
            const g = st.guess;
            const wrap = el('div.ta-guess');
            const bar = el('div.ta-gbar');
            const fill = el('div.ta-gfill');
            const best = el('div.ta-gbest');
            bar.appendChild(fill);
            bar.appendChild(best);
            const place = () => {
                fill.style.left = (100 * g.low / max) + '%';
                fill.style.width = (100 * (g.high - g.low) / max) + '%';
                best.style.left = (100 * g.best / max) + '%';
            };
            const rows = [
                ['low', 'Too low', '#7CC7F2'],
                ['best', 'My best guess', GOLD],
                ['high', 'Too high', '#ff8a9a'],
            ].map(([key, label, colour]) => {
                const out = el('output.ta-gval', { text: g[key] + ' ' + unit });
                const range = el('input.ta-range', {
                    type: 'range', min: 0, max, step: max > 200 ? 5 : 1, value: g[key], disabled: !editable,
                    style: { '--track': colour },
                    oninput: e => {
                        const v = Number(e.target.value);
                        g[key] = v;
                        if (key === 'low') { if (g.best < v) g.best = v; if (g.high < v) g.high = v; }
                        if (key === 'high') { if (g.best > v) g.best = v; if (g.low > v) g.low = v; }
                        if (key === 'best') { if (g.low > v) g.low = v; if (g.high < v) g.high = v; }
                        st.guessTouched = true;
                        wrap.querySelectorAll('.ta-range').forEach(r => { r.value = g[r.dataset.key]; });
                        wrap.querySelectorAll('.ta-gval').forEach(o => { o.textContent = g[o.dataset.key] + ' ' + unit; });
                        place();
                    },
                    onchange: () => sfx('place'),
                });
                range.dataset.key = key;
                out.dataset.key = key;
                return el('label.ta-grow', null, [el('span.ta-glabel', { text: label }), range, out]);
            });
            rows.forEach(r => wrap.appendChild(r));
            wrap.appendChild(bar);
            wrap.appendChild(el('div.muted.small', { text: 'Too low: a number you are sure is too small. Too high: one you are sure is too big.' }));
            place();
            return wrap;
        }

        function toAct2() {
            if (st.wonder == null) return;
            sfx('click');
            st.act = 2;
            speak('What do you need to know?');
            say('Now: what information would help? Ask only for what you need.');
            renderSide();
        }

        // Act 2 ------------------------------------------------------------
        const infoOrder = uiRng.shuffle(data.info.map((_, i) => i));
        let calcText = '';
        let calcResult = null;
        let tool = 'calc';
        const tableRows = [['', ''], ['', ''], ['', ''], ['', ''], ['', '']];
        let extendX = '';
        let useBtn = null; // "Use my result": enabled once the calculator or the table gives a number

        function request(id) {
            if (st.requested.indexOf(id) >= 0) return;
            st.requested.push(id);
            sfx('place');
            renderSide();
        }

        function renderAct2() {
            side.appendChild(el('div.ta-question', null, [el('span.ta-qlabel', { text: 'Our question' }), el('span', { text: data.question })]));
            const cards = infoOrder.map(i => data.info[i]).filter(it => !it.hidden || st.requested.indexOf(it.id) >= 0).map(infoCard);
            const askKids = [];
            if (st.askOpen) {
                data.info.filter(it => it.hidden && st.requested.indexOf(it.id) < 0).forEach(it => {
                    askKids.push(el('button.ta-askq', { text: '“' + it.ask + '”', onclick: () => { request(it.id); speak('Good question!'); } }));
                });
                askKids.push(el('button.ta-askq.joke', { text: '“Can you just tell me the answer?”', onclick: () => { sfx('error'); speak('Nice try. That is Act 3!'); say('Nice try. The answer is what Act 3 is for.'); } }));
            }
            side.appendChild(section('Ask for what you need', [
                el('div.ta-cards', null, cards),
                st.askOpen ? el('div.ta-asks', null, askKids)
                    : el('button.btn.small.ta-missing', { text: 'Something missing? Ask your own question…', onclick: () => { st.askOpen = true; sfx('click'); renderSide(); } }),
                el('div.ta-count.muted.small', { text: 'Asked for ' + st.requested.length + ' of ' + data.info.length + '. A tidy model uses only what matters.' }),
            ]));
            side.appendChild(section('Scratch area', [scratch()]));
            const modelIn = el('input.ta-input.ta-model', { type: 'text', inputMode: 'decimal', placeholder: 'number', value: st.model, oninput: e => { st.model = e.target.value; lockBtn.disabled = evaluate(st.model) == null; } });
            const lockBtn = el('button.btn.gold.ta-next', { text: 'Lock in my model → Act 3', disabled: evaluate(st.model) == null, onclick: () => toAct3() });
            side.appendChild(section('My model says', [
                el('div.ta-row', null, [
                    modelIn,
                    el('span.ta-unit', { text: unit }),
                    (useBtn = el('button.btn.small', { text: 'Use my result', disabled: calcResult == null, onclick: () => { st.model = fmt(calcResult); sfx('click'); renderSide(); } })),
                ]),
                lockBtn,
            ]));
        }

        function infoCard(it) {
            const got = st.requested.indexOf(it.id) >= 0;
            return el('button.ta-info' + (got ? '.got' : ''), { onclick: () => request(it.id), disabled: got }, [
                el('span.ta-infoq', { text: it.ask }),
                got ? el('span.ta-infoa', { text: it.value }) : el('span.ta-infoa.muted', { text: 'Ask' }),
            ]);
        }

        function scratch() {
            const tabs = el('div.ta-tabs', null, [
                el('button.ta-tab' + (tool === 'calc' ? '.on' : ''), { text: '🧮 Calculator', onclick: () => { tool = 'calc'; sfx('click'); renderSide(); } }),
                el('button.ta-tab' + (tool === 'table' ? '.on' : ''), { text: '📈 Table & graph', onclick: () => { tool = 'table'; sfx('click'); renderSide(); } }),
            ]);
            return el('div.ta-scratch', null, [tabs, tool === 'calc' ? calculator() : tableTool()]);
        }

        function calculator() {
            const screen = el('div.ta-screen', null, [
                el('div.ta-expr', { text: calcText || ' ' }),
                el('div.ta-res', { text: calcResult == null ? '' : '= ' + fmt(calcResult) }),
            ]);
            const press = k => {
                sfx('click');
                if (k === 'C') { calcText = ''; calcResult = null; }
                else if (k === '⌫') calcText = calcText.slice(0, -1);
                else if (k === '=') { calcResult = evaluate(calcText); if (calcResult == null) sfx('error'); }
                else if (k === 'ans') { if (calcResult != null) calcText += fmt(calcResult); }
                else calcText += k;
                renderSide();
            };
            const keys = ['7', '8', '9', '÷', 'C', '4', '5', '6', '×', '⌫', '1', '2', '3', '−', '(', '0', '.', 'ans', '+', ')'];
            const pad = el('div.ta-pad', null, keys.map(k => el('button.ta-key' + ('÷×−+'.indexOf(k) >= 0 ? '.op' : ''), { text: k, onclick: () => press(k) })));
            return el('div.ta-calc', null, [screen, pad, el('button.btn.small.ta-eq', { text: '=', onclick: () => press('=') })]);
        }

        function tableTool() {
            const table = el('table.ta-table');
            table.appendChild(el('tr', null, [el('th', { text: 'x' }), el('th', { text: 'y' })]));
            tableRows.forEach((row, r) => {
                const tr = el('tr');
                row.forEach((v, c) => {
                    const input = el('input.ta-cell', { type: 'text', inputMode: 'decimal', value: v, oninput: e => { tableRows[r][c] = e.target.value; drawGraph(); } });
                    tr.appendChild(el('td', null, [input]));
                });
                table.appendChild(tr);
            });
            const graph = el('div.ta-graph');
            const out = el('div.ta-extout');
            const xIn = el('input.ta-input.ta-small', { type: 'text', inputMode: 'decimal', value: extendX, placeholder: 'x', oninput: e => { extendX = e.target.value; } });
            const points = () => tableRows.map(r => [evaluate(r[0]), evaluate(r[1])]).filter(pt => pt[0] != null && pt[1] != null);
            let ext = null;
            function drawGraph() {
                const pts = points();
                const all = ext ? pts.concat([ext]) : pts;
                if (!all.length) { graph.innerHTML = '<div class="muted small">Type some x and y values to see them.</div>'; return; }
                const xs = all.map(p => p[0]), ys = all.map(p => p[1]);
                const x0 = Math.min(0, ...xs), x1 = Math.max(...xs, x0 + 1), y0 = Math.min(0, ...ys), y1 = Math.max(...ys, y0 + 1);
                const X = x => 24 + ((x - x0) / (x1 - x0)) * 206, Y = y => 104 - ((y - y0) / (y1 - y0)) * 94;
                let g = '<svg viewBox="0 0 240 120"><line x1="24" y1="104" x2="234" y2="104" stroke="#1A1020"/><line x1="24" y1="6" x2="24" y2="104" stroke="#1A1020"/>'
                    + '<text x="20" y="12" font-size="9" text-anchor="end">' + fmt(y1) + '</text><text x="234" y="116" font-size="9" text-anchor="end">' + fmt(x1) + '</text>';
                pts.forEach(p => { g += '<circle cx="' + X(p[0]).toFixed(1) + '" cy="' + Y(p[1]).toFixed(1) + '" r="3.5" fill="' + VIOLET + '" stroke="#1A1020"/>'; });
                if (ext) g += '<circle cx="' + X(ext[0]).toFixed(1) + '" cy="' + Y(ext[1]).toFixed(1) + '" r="4.5" fill="' + GOLD + '" stroke="#1A1020"/>';
                graph.innerHTML = g + '</svg>';
            }
            const extBtn = el('button.btn.small', {
                text: 'Continue the pattern',
                onclick: () => {
                    const x = evaluate(extendX);
                    const y = extend(points(), x);
                    sfx(y == null ? 'error' : 'click');
                    ext = y == null ? null : [x, y];
                    out.textContent = y == null ? 'Fill at least two rows and choose an x.' : 'At x = ' + fmt(x) + ', the pattern gives y = ' + fmt(y) + '.';
                    if (y != null) { calcResult = y; if (useBtn) useBtn.disabled = false; }
                    drawGraph();
                },
            });
            drawGraph();
            return el('div.ta-tabletool', null, [
                el('div.ta-tablecol', null, [table]),
                el('div.ta-tablecol', null, [graph, el('div.ta-row', null, [el('span.small', { text: 'Continue to x =' }), xIn, extBtn]), out]),
                el('div.muted.small.ta-note', { text: 'It continues through your last rows: equal jumps give a straight line, growing jumps give a curve.' }),
            ]);
        }

        function toAct3() {
            if (evaluate(st.model) == null) return;
            sfx('click');
            st.act = 3;
            speak('Let us see what really happens…');
            say('Your model is locked in. Let us watch what really happens.');
            renderSide();
            play(sim.post, 5200, () => {
                st.seenAct3 = true;
                sfx('success');
                speak('There it is!');
            });
        }

        // Act 3 ------------------------------------------------------------
        function renderAct3() {
            const modelVal = evaluate(st.model);
            if (!st.seenAct3) {
                side.appendChild(el('div.ta-question', null, [el('span.ta-qlabel', { text: 'Our question' }), el('span', { text: data.question })]));
                side.appendChild(el('div.ta-compare', null, [
                    el('div.ta-cmp', null, [el('span.ta-cmpl', { text: 'Your guess' }), el('span', { text: st.guess.best + ' ' + unit })]),
                    el('div.ta-cmp', null, [el('span.ta-cmpl', { text: 'Your model' }), el('span', { text: fmt(modelVal) + ' ' + unit })]),
                    el('div.ta-cmp.truth', null, [el('span.ta-cmpl', { text: 'The answer' }), el('span', { text: '…' })]),
                ]));
                side.appendChild(el('div.ta-wait', { text: 'Watch the rest of the story…' }));
                return;
            }
            const truth = data.answer;
            const off = modelVal - truth;
            const within = Math.abs(off) <= data.tolerance + 1e-9;
            const inRange = truth >= st.guess.low && truth <= st.guess.high;
            side.appendChild(el('div.ta-question', null, [el('span.ta-qlabel', { text: 'Our question' }), el('span', { text: data.question })]));
            side.appendChild(el('div.ta-compare', null, [
                el('div.ta-cmp', null, [el('span.ta-cmpl', { text: 'Your guess' }), el('span', { text: st.guess.best + ' ' + unit + ' (' + st.guess.low + '–' + st.guess.high + ')' }), el('span.ta-tag' + (inRange ? '.good' : ''), { text: inRange ? 'in your range' : 'outside your range' })]),
                el('div.ta-cmp', null, [el('span.ta-cmpl', { text: 'Your model' }), el('span', { text: fmt(modelVal) + ' ' + unit }), el('span.ta-tag' + (within ? '.good' : '.bad'), { text: within ? (off === 0 ? 'spot on' : 'close enough') : (off < 0 ? 'too low' : 'too high') })]),
                el('div.ta-cmp.truth', null, [el('span.ta-cmpl', { text: 'The answer' }), el('span', { text: fmt(truth) + ' ' + unit })]),
            ]));
            const q = within ? 'Your model was close. Why?' : 'Why was your model off?';
            const opts = data.reflections.map((text, i) => el('button.ta-reflect' + (st.reflection === i ? '.on' : ''), { text, onclick: () => { st.reflection = i; sfx('click'); renderSide(); } }));
            side.appendChild(section(q, [el('div.ta-reflects', null, opts)]));
            if (st.result && st.result.solved) {
                side.appendChild(el('div.ta-debrief', null, [
                    el('div.ta-sechead', { text: 'Maths is a way of asking' }),
                    el('div', { text: 'You chose a question, guessed, picked the information that mattered, and tested your model against the world. Modelling is choosing what matters.' }),
                ]));
            } else {
                side.appendChild(el('div.ta-row.ta-end', null, [
                    el('button.btn.gold', { text: 'Hand it in', disabled: st.reflection == null, onclick: () => send() }),
                    st.result ? el('button.btn.small', { text: '← Revise my model', onclick: () => { st.act = 2; st.result = null; sfx('click'); renderSide(); draw(sim.pre[sim.pre.length - 1], false); } }) : null,
                ]));
            }
            if (st.result) side.appendChild(el('div.ta-status' + (st.result.solved ? '.good' : '.bad'), { text: st.result.feedback }));
        }

        function send() {
            const answer = {
                wonder: typeof st.wonder === 'number' ? st.wonder : String(st.wonder),
                guess: Object.assign({}, st.guess),
                requested: st.requested.slice(),
                model: evaluate(st.model),
                reflection: st.reflection,
            };
            sfx('click');
            let r = null;
            try { r = api && api.submit ? api.submit(answer) : null; } catch (e) { console.error('[three-act]', e); }
            const show = res => {
                if (!res) return;
                st.result = res;
                if (res.solved) { sfx('success'); speak('You thought it through!'); }
                else { sfx('error'); speak('Not quite yet.'); }
                renderSide();
            };
            if (r && typeof r.then === 'function') r.then(show, () => {}); else show(r);
        }

        // ---- go ----
        draw(sim.pre[0], false);
        renderSide();
        speak('Watch this…');
        say('Watch this. Then tell me: what do you wonder?');
        later(() => { if (!st.playing && !st.seenAct1) replay(); }, reduced ? 50 : 700);

        return {
            destroy() {
                playToken += 1;
                timers.forEach(id => root.clearTimeout(id));
                if (rootEl.parentNode) rootEl.parentNode.removeChild(rootEl);
            },
        };
    }

    // ------------------------------------------------------------------

    const def = {
        id: 'three-act',
        rules: [
            "Act 1: watch, ask a question, then make an estimate.",
            "Act 2: ask for useful information. Decide which facts your model needs.",
            "Use the calculator, table or graph to build a model. Enter your result as the task asks.",
            "Act 3: compare with what happened and explain any gap. The starting guess does not have to be right.",
            "How to play is free. The Hint button shows its heart cost. Think first, then check your answer."
        ],
        tutorial: [
            {
                "text": "Three acts: wonder, investigate, compare. We need a useful question before a calculation.",
                "highlight": ".ta-acts"
            },
            {
                "text": "Watch the scene, choose what you wonder, then make a rough guess. The guess is a starting point, not a test of your maths.",
                "highlight": ".ta-stage"
            },
            {
                "text": "Example: to fill an empty tank at a steady rate, we need its capacity and the amount entering each minute. Its colour probably will not help.",
                "highlight": ".ta-side"
            },
            {
                "text": "Choose information cards with facts your model needs. Choose a model and use the calculator, table or graph to find a result.",
                "highlight": ".ta-side"
            },
            {
                "text": "In the reveal, compare your model with what happened. Explain which assumption caused any gap and complete the reflection. How to play is free. The Hint button shows its heart cost. Think first, then check your answer.",
                "highlight": ".ta-acts"
            }
        ],
        name: 'The Three Acts',
        colour: 'imagination',
        family: 'Maths as thinking',
        blurb: 'Watch, wonder, guess. Then ask for only what you need, build a model, and see if the world agrees.',
        tok: 'Modelling the world is choosing what matters: maths is not a list of formulas but a way of asking a question and answering it, and the model is only as good as the information and assumptions you choose.',

        generate,
        check: checkAnswer,
        hints: hintsFor,
        why: whyFor,
        solve: solveFor,
        mount,

        // exposed for tests and tools
        internals: { TASKS, TASK_IDS, DRAW, REFLECTIONS, MATCHED, TOL, tileCoords, evaluate, extend, toleranceFor },
    };

    Rift.Puzzles.register(def);
})(typeof window !== 'undefined' ? window : globalThis);
