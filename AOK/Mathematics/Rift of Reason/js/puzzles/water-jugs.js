/*
 * Water jugs (Granny's ladles): fill, empty and pour two unmarked ladles to
 * measure an exact amount. Borrows the classic jug-measuring mechanic only.
 * Difficulty 1–2: the goal can be reached (BFS checks every generated puzzle).
 * Difficulty 3: the goal is impossible. Every amount you can make is a multiple
 * of gcd(a, b); the player declares it impossible and picks the reason that
 * proves it (TOK: proving something can't be done, not just failing to do it).
 * Answer: { moves: [['fill', i] | ['empty', i] | ['pour', i, j], ...] }
 *      or { impossible: true, reason: index into data.reasons }.
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;

    function gcd(a, b) { while (b) { const t = a % b; a = b; b = t; } return a; }

    // One move on the levels; null when the move is malformed or changes nothing.
    function apply(caps, levels, m) {
        if (!Array.isArray(m)) return null;
        const ok = k => Number.isInteger(k) && k >= 0 && k < caps.length;
        const out = levels.slice();
        const [op, i, j] = m;
        if (!ok(i)) return null;
        if (op === 'fill') out[i] = caps[i];
        else if (op === 'empty') out[i] = 0;
        else if (op === 'pour') {
            if (!ok(j) || i === j) return null;
            const amount = Math.min(out[i], caps[j] - out[j]);
            out[i] -= amount;
            out[j] += amount;
        } else return null;
        return out.every((v, k) => v === levels[k]) ? null : out;
    }

    function allMoves(caps) {
        const moves = [];
        caps.forEach((_, i) => {
            moves.push(['fill', i], ['empty', i]);
            caps.forEach((__, j) => { if (i !== j) moves.push(['pour', i, j]); });
        });
        return moves;
    }

    // Breadth-first search from empty ladles: the shortest plan to the target (or null),
    // and every amount that can ever appear in a ladle.
    function search(caps, target) {
        const start = caps.map(() => 0);
        const key = l => l.join(',');
        const prev = new Map([[key(start), null]]);
        const queue = [start];
        const amounts = new Set([0]);
        let path = null;
        const moves = allMoves(caps);
        while (queue.length) {
            const s = queue.shift();
            s.forEach(v => amounts.add(v));
            if (!path && s.includes(target)) {
                path = [];
                for (let k = key(s); prev.get(k); k = prev.get(k).from) path.unshift(prev.get(k).m);
            }
            for (const m of moves) {
                const n = apply(caps, s, m);
                if (n && !prev.has(key(n))) { prev.set(key(n), { from: key(s), m }); queue.push(n); }
            }
        }
        return { path, amounts: [...amounts].sort((x, y) => x - y) };
    }

    function describe(m, caps) {
        if (m[0] === 'fill') return 'fill the ' + caps[m[1]] + '-cup ladle';
        if (m[0] === 'empty') return 'empty the ' + caps[m[1]] + '-cup ladle';
        return 'pour the ' + caps[m[1]] + ' into the ' + caps[m[2]];
    }

    function generate(rng, difficulty) {
        const d = Rift.clamp ? Rift.clamp(difficulty || 1, 1, 3) : (difficulty || 1);
        for (let tries = 0; tries < 2000; tries++) {
            let a, b, g = 1;
            if (d === 1) { a = rng.int(2, 5); b = rng.int(a + 1, 7); }
            else if (d === 2) { a = rng.int(4, 8); b = rng.int(a + 2, 13); }
            else { g = rng.pick([2, 3]); a = g * rng.int(2, 3); b = g * rng.int(3, 5); }
            if (a >= b || gcd(a, b) !== g || (d === 3 && b > 15)) continue;
            const caps = rng.chance(0.5) ? [a, b] : [b, a];
            const target = rng.int(1, b - 1);
            if (target === a) continue;
            const found = search(caps, target);
            if (d < 3) {
                const len = found.path ? found.path.length : 0;
                if (!found.path || (d === 1 && (len < 3 || len > 6)) || (d === 2 && (len < 7 || len > 14))) continue;
            } else if (found.path || target % g === 0) continue;
            const possible = !!found.path;
            const small = Math.min(a, b);
            // A false "multiple" reason for a reachable goal: a factor that does not divide it.
            const fakeG = possible ? (target % 2 ? 2 : 3) : g;
            const proof = 'Every amount I can make is a multiple of ' + fakeG + '. ' + target + ' is not.';
            const reasons = rng.shuffle([
                proof,
                'I tried lots of pours, and none of them worked.',
                target > small ? target + ' is bigger than the ' + small + '-cup ladle.' : target + ' is smaller than the ' + Math.max(a, b) + '-cup ladle.',
                'The two ladles together hold less than ' + target + '.',
            ]);
            return {
                caps, target, possible, g: gcd(a, b),
                shortest: possible ? found.path.length : null,
                plan: found.path,
                reasons,
                reasonCorrect: possible ? -1 : reasons.indexOf(proof),
            };
        }
        throw new Error('water-jugs: no puzzle found');
    }

    function check(data, answer) {
        const a = answer || {};
        if (a.impossible) {
            if (data.possible) return { solved: false, partial: 0, feedback: 'It can be done. Keep pouring, and watch what is left behind.' };
            if (a.reason !== data.reasonCorrect) return { solved: false, partial: 0.5, feedback: 'Yes, it is impossible. But that reason does not prove it. Pick the reason that covers every possible pour.' };
            return { solved: true, feedback: 'Proved, not just tried. Every pour keeps the amounts multiples of ' + data.g + ', so ' + data.target + ' can never appear.' };
        }
        let levels = data.caps.map(() => 0);
        for (const m of (Array.isArray(a.moves) ? a.moves : [])) {
            const n = apply(data.caps, levels, m);
            if (!n) return { solved: false, partial: 0, feedback: 'One of those moves is not allowed. Fill, empty, or pour into a ladle with room.' };
            levels = n;
        }
        if (levels.includes(data.target)) {
            const n = a.moves.length;
            return { solved: true, feedback: 'Exactly ' + data.target + ' cups, in ' + n + ' moves.' + (n > data.shortest ? ' It can be done in ' + data.shortest + '.' : ' The shortest plan!') };
        }
        if (!data.possible) return { solved: false, partial: 0, feedback: 'Still no ' + data.target + ' cups. Look at the amounts you have made. What do they share?' };
        return { solved: false, partial: 0, feedback: 'Neither ladle holds exactly ' + data.target + ' cups yet.' };
    }

    function hints(data) {
        if (!data.possible) {
            return [
                'Make a few amounts and look at the list. What do they all have in common?',
                'Every amount so far is a multiple of ' + data.g + '. Can a fill, an empty or a pour ever break that?',
                'No. Each move adds or takes away amounts that are multiples of ' + data.g + '. ' + data.target + ' is not one, so it can never appear. Declare it impossible.',
            ];
        }
        const p = data.plan;
        const half = p.slice(0, Math.max(2, Math.ceil(p.length / 2)));
        return [
            'Fill one ladle, pour it into the other, and watch what is left behind.',
            'Start like this: ' + describe(p[0], data.caps) + '.',
            'The first ' + half.length + ' moves of a plan that works: ' + half.map(m => describe(m, data.caps)).join(', then ') + '.',
        ];
    }

    function why(data) {
        if (!data.possible) {
            return {
                question: 'Why can no plan ever make ' + data.target + ' cups?',
                options: data.reasons.slice(),
                correct: data.reasonCorrect,
                explain: 'One rule covers every possible pour. That is a proof. Lots of failed tries is not.',
            };
        }
        return {
            question: 'You found a plan. What does it prove?',
            options: ['That ' + data.target + ' cups can be made with these two ladles.', 'That ' + data.target + ' cups can be made with any two ladles.', 'That no shorter plan exists.', 'That every amount can be made.'],
            correct: 0,
            explain: 'One working example proves "it can be done" here. It says nothing about other ladles.',
        };
    }

    function solve(data) {
        return data.possible ? { moves: data.plan.map(m => m.slice()) } : { impossible: true, reason: data.reasonCorrect };
    }

    function mount(container, data, api) {
        const el = api.el;
        const caps = data.caps;
        const maxCap = Math.max(...caps);
        let levels = caps.map(() => 0);
        let moves = [];
        let done = false;
        const made = new Set([0]);
        let reason = null;

        const goal = el('div.wj-goal.panel', null, [
            el('strong', { text: 'Goal: exactly ' + data.target + ' cups in one ladle.' }),
            el('div.small', { text: 'Ladles: ' + caps.join(' cups and ') + ' cups. No markings. The pot is endless.' }),
        ]);
        const jugs = el('div.wj-jugs');
        const cards = caps.map((cap, i) => {
            const water = el('div.wj-water');
            const level = el('div.wj-level');
            const glass = el('div.wj-glass', { style: { height: Math.round(60 + 140 * cap / maxCap) + 'px' } }, [water]);
            const btns = el('div.wj-btns', null, [
                el('button.btn.small', { text: 'Fill', onclick: () => act(['fill', i]) }),
                el('button.btn.small', { text: 'Empty', onclick: () => act(['empty', i]) }),
            ].concat(caps.map((c, j) => j === i ? null : el('button.btn.small', { text: 'Pour into ' + c, onclick: () => act(['pour', i, j]) }))));
            const card = el('div.wj-jug', null, [el('div.wj-cap', { text: cap + '-cup ladle' }), glass, level, btns]);
            jugs.append(card);
            return { water, level, card };
        });
        const count = el('span.small.wj-count');
        const madeBox = el('div.wj-made.small');
        const tools = el('div.row.wj-tools', null, [
            el('button.btn.small', { text: 'Undo', onclick: undo }),
            el('button.btn.small', { text: 'Reset', onclick: reset }),
            count,
        ]);
        const reasonList = el('div.wj-reasons.stack');
        data.reasons.forEach((t, k) => reasonList.append(el('button.btn.small.wj-reason', { text: t, dataset: { k: String(k) }, onclick() {
            reason = k;
            reasonList.querySelectorAll('.wj-reason').forEach(b => b.classList.toggle('picked', b.dataset.k === String(k)));
            declare.disabled = false;
            api.sfx('click');
        } })));
        const declare = el('button.btn.primary', { text: 'Declare it impossible', disabled: true, onclick() {
            if (done || reason === null) return;
            const r = api.submit({ impossible: true, reason });
            if (r && r.solved) finish();
        } });
        const proof = el('div.wj-proof.stack', { hidden: true }, [el('div.small', { text: 'Which reason proves it, for every possible pour?' }), reasonList, declare]);
        const impossible = el('div.wj-impossible.panel.stack', null, [
            el('button.btn.small', { text: "It can't be done…", onclick() { proof.hidden = !proof.hidden; api.sfx('click'); } }),
            proof,
        ]);

        function render() {
            cards.forEach((c, i) => {
                c.water.style.height = (100 * levels[i] / caps[i]) + '%';
                c.level.textContent = levels[i] + ' of ' + caps[i] + ' cups';
                c.card.classList.toggle('wj-hit', levels[i] === data.target);
            });
            count.textContent = moves.length + (moves.length === 1 ? ' move' : ' moves');
            madeBox.textContent = 'Amounts made so far: ' + [...made].sort((x, y) => x - y).join(', ');
        }
        function act(m) {
            if (done) return;
            const n = apply(caps, levels, m);
            if (!n) { api.sfx('error'); return; }
            levels = n;
            moves.push(m);
            levels.forEach(v => made.add(v));
            api.sfx('place');
            render();
            if (levels.includes(data.target)) {
                const r = api.submit({ moves: moves.map(x => x.slice()) });
                if (r && r.solved) finish();
            }
        }
        function undo() {
            if (done || !moves.length) return;
            moves.pop();
            levels = caps.map(() => 0);
            moves.forEach(m => { levels = apply(caps, levels, m) || levels; });
            render();
        }
        function reset() {
            if (done) return;
            moves = [];
            levels = caps.map(() => 0);
            render();
        }
        function finish() {
            done = true;
            container.querySelectorAll('.wj button').forEach(b => { b.disabled = true; });
        }

        container.append(el('div.wj', null, [goal, jugs, tools, madeBox, impossible]));
        render();
        return { destroy() { done = true; } };
    }

    Rift.Puzzles.register({
        id: 'water-jugs',
        name: "Granny's Ladles",
        colour: 'reason',
        family: 'Proof',
        blurb: 'Measure an exact amount with two unmarked ladles. Or prove it cannot be done.',
        tok: 'Failing many times does not show something is impossible. A rule that covers every case does.',
        rules: [
            'Get exactly the goal amount into one ladle.',
            'Fill a ladle to the top, empty it, or pour one ladle into the other until one is full or empty.',
            'The list shows every amount you have made. Undo and Reset are free.',
            "If the goal can never appear, press It can't be done and pick the reason that proves it.",
            'How to play is free. The Hint button shows its heart cost. Think first, then check your answer.',
        ],
        tutorial: [
            { text: 'Goal: exactly this many cups in one ladle. The ladles have no markings.', highlight: '.wj-goal' },
            { text: 'Fill a ladle, empty it, or pour it into the other. A pour stops when one ladle is full or empty.', highlight: '.wj-jugs' },
            { text: 'Example, not this puzzle: ladles of 3 and 5. Fill the 5, pour into the 3. Now 2 cups are left in the 5.', highlight: '.wj-jugs' },
            { text: "Watch the amounts you make. If the goal can never appear, say so here, and pick the reason that proves it.", highlight: '.wj-impossible' },
            { text: 'Undo and Reset are free. How to play is free. The Hint button shows its heart cost. Think first, then check your answer.', highlight: '.wj-tools' },
        ],
        generate, check, hints, why, solve, mount,
        _search: search, _apply: apply, _gcd: gcd,
    });
})(typeof window !== 'undefined' ? window : globalThis);
