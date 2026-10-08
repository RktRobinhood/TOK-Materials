/*
 * Logic grid (the Reading Room): who wrote which headline, on which day?
 * Cross out impossible pairings until one arrangement is left. Borrows the
 * classic logic-grid mechanic only. The generator adds true clues until a
 * brute-force solver finds exactly one solution, then drops every clue that
 * is not needed (so each clue matters).
 *   d1: 3 writers, 3 headlines, 3 days; direct clues allowed.
 *   d2: 4 of each; at most one direct clue.
 *   d3: 5 of each; no direct clues, more order clues.
 * Answer: { a: [headline index per writer], b: [day index per writer] }.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const WRITERS = ['Ada', 'Ben', 'Cleo', 'Dev', 'Eli', 'Fen'];
    const HEADLINES = ['Moon for sale', 'Bridge glows blue', 'Robot bakes bread', 'Rain of frogs', 'Cat runs for mayor', 'Clock stops at noon', 'Library goes silent'];
    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const TYPES = {
        1: ['is', 'not', 'link', 'unlink', 'before', 'nextday'],
        2: ['is', 'not', 'link', 'unlink', 'before', 'nextday', 'beforeA'],
        3: ['not', 'link', 'unlink', 'before', 'nextday', 'beforeA'],
    };

    function perms(n) {
        if (n === 1) return [[0]];
        const out = [];
        perms(n - 1).forEach(p => { for (let k = 0; k <= p.length; k++) out.push(p.slice(0, k).concat([n - 1], p.slice(k))); });
        return out;
    }

    // Is clue c true for writers' headlines pa and days pb?
    function holds(c, pa, pb) {
        switch (c.t) {
            case 'is': return (c.cat === 'a' ? pa : pb)[c.p] === c.v;
            case 'not': return (c.cat === 'a' ? pa : pb)[c.p] !== c.v;
            case 'link': return pb[pa.indexOf(c.a)] === c.b;
            case 'unlink': return pb[pa.indexOf(c.a)] !== c.b;
            case 'before': return pb[c.p] < pb[c.q];
            case 'nextday': return pb[c.q] === pb[c.p] + 1;
            case 'beforeA': return pb[c.p] < pb[pa.indexOf(c.a)];
            default: return false;
        }
    }

    function text(c, data) {
        const w = i => data.writers[i];
        const h = i => '“' + data.headlines[i] + '”';
        const day = i => data.days[i];
        switch (c.t) {
            case 'is': return c.cat === 'a' ? w(c.p) + ' wrote ' + h(c.v) + '.' : w(c.p) + '\'s story ran on ' + day(c.v) + '.';
            case 'not': return c.cat === 'a' ? w(c.p) + ' did not write ' + h(c.v) + '.' : w(c.p) + '\'s story did not run on ' + day(c.v) + '.';
            case 'link': return h(c.a) + ' ran on ' + day(c.b) + '.';
            case 'unlink': return h(c.a) + ' did not run on ' + day(c.b) + '.';
            case 'before': return w(c.p) + '\'s story ran earlier in the week than ' + w(c.q) + '\'s.';
            case 'nextday': return w(c.q) + '\'s story ran the day after ' + w(c.p) + '\'s.';
            case 'beforeA': return w(c.p) + '\'s story ran earlier in the week than ' + h(c.a) + '.';
            default: return '';
        }
    }

    // Every arrangement (pa, pb) that keeps all the clues.
    function solutions(n, clues, limit) {
        const ps = perms(n);
        const out = [];
        for (const pa of ps) {
            for (const pb of ps) {
                if (clues.every(c => holds(c, pa, pb))) {
                    out.push({ a: pa, b: pb });
                    if (limit && out.length >= limit) return out;
                }
            }
        }
        return out;
    }

    // All true clues of the allowed types for this solution, grouped by type.
    function pool(n, sol, types) {
        const g = {};
        const add = c => { if (types.includes(c.t) && holds(c, sol.a, sol.b)) (g[c.t] = g[c.t] || []).push(c); };
        for (let p = 0; p < n; p++) {
            for (let v = 0; v < n; v++) {
                ['a', 'b'].forEach(cat => { add({ t: 'is', p, cat, v }); add({ t: 'not', p, cat, v }); });
                add({ t: 'beforeA', p, a: v });
            }
            for (let q = 0; q < n; q++) if (p !== q) { add({ t: 'before', p, q }); add({ t: 'nextday', p, q }); }
        }
        for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) { add({ t: 'link', a, b }); add({ t: 'unlink', a, b }); }
        return g;
    }

    function generate(rng, difficulty) {
        const d = Math.max(1, Math.min(3, difficulty || 1));
        const n = d + 2;
        const data = {
            writers: rng.shuffle(WRITERS).slice(0, n),
            headlines: rng.shuffle(HEADLINES).slice(0, n),
            days: DAYS.slice(0, n),
        };
        const sol = { a: rng.shuffle([...Array(n).keys()]), b: rng.shuffle([...Array(n).keys()]) };
        const groups = pool(n, sol, TYPES[d]);
        const clues = [];
        let isUsed = 0;
        let left = solutions(n, []);
        while (left.length > 1) {
            const types = Object.keys(groups).filter(t => groups[t].length && !(t === 'is' && d === 2 && isUsed >= 1));
            const t = rng.pick(types);
            const c = groups[t].splice(rng.int(0, groups[t].length - 1), 1)[0];
            const next = left.filter(s => holds(c, s.a, s.b));
            if (next.length === left.length) continue; // tells us nothing new
            clues.push(c);
            if (t === 'is') isUsed++;
            left = next;
        }
        // Drop clues the others make unnecessary, oldest first.
        for (let k = 0; k < clues.length;) {
            const rest = clues.slice(0, k).concat(clues.slice(k + 1));
            if (solutions(n, rest, 2).length === 1) clues.splice(k, 1); else k++;
        }
        data.clues = rng.shuffle(clues).map(c => Object.assign({}, c, { text: text(c, data) }));
        data.solution = sol;
        return data;
    }

    function check(data, answer) {
        const n = data.writers.length;
        const a = answer && answer.a;
        const b = answer && answer.b;
        const isPerm = x => Array.isArray(x) && x.length === n && new Set(x).size === n && x.every(v => Number.isInteger(v) && v >= 0 && v < n);
        if (!isPerm(a) || !isPerm(b)) return { solved: false, partial: 0, feedback: 'Each row and each column needs exactly one ✓ in both grids.' };
        const right = data.writers.filter((_, i) => a[i] === data.solution.a[i] && b[i] === data.solution.b[i]).length;
        if (right === n) return { solved: true, feedback: 'Every writer found. Only one arrangement keeps all the clues.' };
        const broken = data.clues.find(c => !holds(c, a, b));
        return {
            solved: false,
            partial: right / n,
            broken: broken ? broken.text : null,
            feedback: broken ? 'Your grid breaks a clue: ' + broken.text : 'Some ✓ are in the wrong place. Find the clue that rules them out.',
        };
    }

    function hints(data) {
        const s = data.solution;
        const i = data.writers.length - 1;
        return [
            'Start with clues that rule things out. Put ✕ in those cells first.',
            'Each row and each column has exactly one ✓. If a row has only one empty cell left, that cell is ✓.',
            'One sure fact: ' + data.writers[i] + ' wrote “' + data.headlines[s.a[i]] + '”, and it ran on ' + data.days[s.b[i]] + '.',
        ];
    }

    function why() {
        return {
            question: 'How do you know your grid is the only answer?',
            options: ['Every other arrangement breaks at least one clue.', 'It was the first one I tried.', 'It looks fair to everyone.', 'Most of the clues mention it.'],
            correct: 0,
            explain: 'The clues settle it: every other arrangement breaks one. Fitting the clues is not enough on its own.',
        };
    }

    function solve(data) { return { a: data.solution.a.slice(), b: data.solution.b.slice() }; }

    function mount(container, data, api) {
        const el = api.el;
        const n = data.writers.length;
        let done = false;
        // marks[grid][row][col]: '' | 'x' | 'v'. Grids: a = writer × headline, b = writer × day, c = headline × day (scratch).
        const marks = { a: [], b: [], c: [] };
        const cells = { a: [], b: [], c: [] };
        const note = el('div.small.lg-note', { 'aria-live': 'polite' });

        const clueList = el('ol.lg-clues.panel', null, data.clues.map(c => {
            const b = el('button.lg-clue', { text: c.text, title: 'Click to mark this clue as used', onclick() { b.classList.toggle('used'); } });
            return el('li', null, [b]);
        }));

        function grid(key, rowLabels, colLabels, title) {
            const table = el('table.lg-grid');
            table.append(el('caption.small', { text: title }));
            table.append(el('tr', null, [el('th')].concat(colLabels.map(t => el('th.lg-col', { text: t })))));
            for (let r = 0; r < n; r++) {
                marks[key].push(Array(n).fill(''));
                cells[key].push([]);
                const tr = el('tr', null, [el('th.lg-row', { text: rowLabels[r] })]);
                for (let c = 0; c < n; c++) {
                    const btn = el('button.lg-cell', { 'aria-label': rowLabels[r] + ' / ' + colLabels[c], onclick() { cycle(key, r, c); } });
                    cells[key][r].push(btn);
                    tr.append(el('td', null, [btn]));
                }
                table.append(tr);
            }
            return table;
        }
        function paint(key, r, c) {
            const m = marks[key][r][c];
            const b = cells[key][r][c];
            b.textContent = m === 'x' ? '✕' : m === 'v' ? '✓' : '';
            b.classList.toggle('lg-x', m === 'x');
            b.classList.toggle('lg-v', m === 'v');
        }
        function cycle(key, r, c) {
            if (done) return;
            const m = marks[key][r][c];
            marks[key][r][c] = m === '' ? 'x' : m === 'x' ? 'v' : '';
            if (marks[key][r][c] === 'v') {
                // A ✓ rules out the rest of its row and column.
                for (let k = 0; k < n; k++) {
                    if (k !== c && marks[key][r][k] === '') { marks[key][r][k] = 'x'; paint(key, r, k); }
                    if (k !== r && marks[key][k][c] === '') { marks[key][k][c] = 'x'; paint(key, k, c); }
                }
            }
            paint(key, r, c);
            note.textContent = '';
            api.sfx('click');
        }
        function read(key) {
            const out = [];
            for (let r = 0; r < n; r++) {
                const ticks = marks[key][r].map((m, c) => m === 'v' ? c : -1).filter(c => c >= 0);
                if (ticks.length !== 1) return null;
                out.push(ticks[0]);
            }
            return new Set(out).size === n ? out : null;
        }
        const submit = el('button.btn.primary.lg-submit', { text: 'Check my grid', onclick() {
            if (done) return;
            const a = read('a');
            const b = read('b');
            if (!a || !b) { note.textContent = 'Put exactly one ✓ in every row and column of the two writer grids first.'; api.sfx('error'); return; }
            const r = api.submit({ a, b });
            if (r && r.solved) { done = true; container.querySelectorAll('.lg button').forEach(x => { x.disabled = true; }); }
        } });
        const clear = el('button.btn.small', { text: 'Clear grids', onclick() {
            if (done) return;
            ['a', 'b', 'c'].forEach(k => marks[k].forEach((row, r) => row.forEach((_, c) => { row[c] = ''; paint(k, r, c); })));
        } });

        const grids = el('div.lg-grids', null, [
            grid('a', data.writers, data.headlines, 'Writer × headline'),
            grid('b', data.writers, data.days.map(x => x.slice(0, 3)), 'Writer × day'),
            grid('c', data.headlines, data.days.map(x => x.slice(0, 3)), 'Headline × day (notes only)'),
        ]);
        const tools = el('div.row.lg-tools', null, [submit, clear]);
        container.append(el('div.lg', null, [el('div.lg-side', null, [el('strong', { text: 'Clues' }), clueList]), el('div.lg-main', null, [grids, note, tools])]));
        return { destroy() { done = true; } };
    }

    Rift.Puzzles.register({
        id: 'logic-grid',
        name: 'The Byline Grid',
        colour: 'reason',
        family: 'Claims and evidence',
        blurb: 'Who wrote which headline, and on which day? Cross out what the clues rule out.',
        tok: 'A claim is proved when the evidence rules out every other possibility, not just when it fits. Real evidence rarely gets that far.',
        rules: [
            'Each writer wrote one headline, on one day. No two share.',
            'Click a cell once for ✕ (ruled out), twice for ✓ (confirmed), three times to clear.',
            'A ✓ crosses out the rest of its row and column. The third grid is for notes.',
            'Fill both writer grids, then Check my grid. Clear is free.',
            'How to play is free. The Hint button shows its heart cost. Think first, then check your answer.',
        ],
        tutorial: [
            { text: 'Each clue is evidence. Read them all first. Click a clue to mark it as used.', highlight: '.lg-clues' },
            { text: 'Click a cell once for ✕ (ruled out), twice for ✓ (confirmed). A ✓ crosses out its row and column.', highlight: '.lg-grids' },
            { text: 'Example, not this puzzle: "Ada did not write the frog story." Put ✕ where Ada meets that headline.', highlight: '.lg-grids' },
            { text: 'When a row has only one empty cell left, that cell must be ✓. Keep going until every row has one ✓.', highlight: '.lg-grids' },
            { text: 'Then Check my grid. How to play is free. The Hint button shows its heart cost. Think first, then check your answer.', highlight: '.lg-tools' },
        ],
        generate, check, hints, why, solve, mount,
        _solutions: solutions, _holds: holds,
    });
})(typeof window !== 'undefined' ? window : globalThis);
