/*
 * The Prediction Machine: Memory / pattern breakers (chapter 4, lesson 4).
 *
 * "AI is just probability", from the inside. The Algorithm plays a guessing
 * game. Each round it LOCKS IN a guess before you choose; you win the rounds
 * it gets wrong. Its whole "mind" is a frequency table of your past choices:
 *
 *   order 1 (difficulty 1): how often you chose each option so far
 *   order 2 (difficulty 2): what you chose after your last choice (bigram)
 *   order 3 (difficulty 3): what you chose after your last two choices
 *                           (trigram), with add-one smoothing on its "confidence"
 *
 * It bets on the biggest count. Ties back off to the next shorter context
 * (trigram → bigram → overall counts) and finally to its seeded favourite
 * order (data.tieOrder). Nothing else: it cannot see you, only count you.
 *
 *   Phase 1: rounds 1–10, its brain is hidden (it usually wins: people are bad
 *            at being random).
 *   Phase 2: its brain is revealed, with the table and a log of every guess.
 *   Phase 3: blocks of 10 rounds, the brain stays visible. Win data.target of
 *            a block (by reading the table or rolling a fair die) to solve it.
 *   Debrief: "What did the machine actually know about you?" (why()).
 *
 * Answer: { choices: [optionIndex, ...], debrief: index into why(data).options }.
 * check() replays the model itself from the choices; reported wins or guesses
 * are never trusted (if they are sent and do not match the replay, it fails).
 */
(function (root) {
    'use strict';

    const Rift = root.Rift;
    const WARMUP = 10;
    const BLOCK = 10;
    const MAX_BLOCKS = 8;

    const SETTINGS = {
        1: { n: 2, order: 1, target: 6, smoothing: false },
        2: { n: 3, order: 2, target: 7, smoothing: false },
        3: { n: 3, order: 3, target: 8, smoothing: true },
    };

    const THEMES2 = [
        { id: 'doors', prompt: 'Which door will you walk through?', options: [
            { label: 'Left door', glyph: '◀', hue: '#3FE0D0' },
            { label: 'Right door', glyph: '▶', hue: '#E85BC8' }] },
        { id: 'lanterns', prompt: 'Which lantern will you light?', options: [
            { label: 'Sun lantern', glyph: '☀', hue: '#F2B632' },
            { label: 'Moon lantern', glyph: '☾', hue: '#A05CF0' }] },
        { id: 'cups', prompt: 'Which cup hides your marble?', options: [
            { label: 'Red cup', glyph: '🔴', hue: '#E8384F' },
            { label: 'Blue cup', glyph: '🔵', hue: '#3D7BFF' }] },
    ];
    const THEMES3 = [
        { id: 'trio', prompt: 'Stone, scroll or shears?', options: [
            { label: 'Stone', glyph: '🪨', hue: '#C9C9D6' },
            { label: 'Scroll', glyph: '📜', hue: '#F2B632' },
            { label: 'Shears', glyph: '✂️', hue: '#3FE0D0' }] },
        { id: 'doors3', prompt: 'Which door will you walk through?', options: [
            { label: 'Left door', glyph: '◀', hue: '#3FE0D0' },
            { label: 'Middle door', glyph: '▲', hue: '#F2B632' },
            { label: 'Right door', glyph: '▶', hue: '#E85BC8' }] },
        { id: 'colours', prompt: 'Which colour will you press?', options: [
            { label: 'Red', glyph: '🔴', hue: '#E8384F' },
            { label: 'Gold', glyph: '🟡', hue: '#F2B632' },
            { label: 'Blue', glyph: '🔵', hue: '#3D7BFF' }] },
    ];

    // ------------------------------------------------------------------
    // The model (pure)
    // ------------------------------------------------------------------

    // Count what came next every time `ctx` (a list of option indices) occurred.
    function countsAfter(history, ctx, n) {
        const counts = new Array(n).fill(0);
        let total = 0;
        const L = ctx.length;
        for (let j = L; j < history.length; j++) {
            let match = true;
            for (let i = 0; i < L; i++) if (history[j - L + i] !== ctx[i]) { match = false; break; }
            if (match) { counts[history[j]]++; total++; }
        }
        return { counts, total };
    }

    // The machine's guess for the next choice, given everything chosen so far.
    // → { guess, levels: [{ k, ctx, counts, total }] (longest context first),
    //     decidedBy: k of the level that settled it, or 0 for its favourite,
    //     probs (its displayed "confidence" per option), confidence }
    function predict(data, history) {
        const n = data.options.length;
        const t = history.length;
        const levels = [];
        for (let k = data.order; k >= 1; k--) {
            if (t < k - 1) { levels.push({ k, ctx: null, counts: new Array(n).fill(0), total: 0 }); continue; }
            const ctx = history.slice(t - (k - 1));
            const r = countsAfter(history, ctx, n);
            levels.push({ k, ctx, counts: r.counts, total: r.total });
        }
        let cand = data.options.map((_, i) => i);
        let decidedBy = 0;
        for (const L of levels) {
            const max = Math.max(...cand.map(i => L.counts[i]));
            cand = cand.filter(i => L.counts[i] === max);
            if (cand.length === 1) { decidedBy = L.k; break; }
        }
        const guess = cand.length === 1 ? cand[0] : data.tieOrder.find(i => cand.indexOf(i) >= 0);
        const top = levels[0];
        const probs = top.counts.map(c => (data.smoothing ? (c + 1) / (top.total + n) : top.total ? c / top.total : 1 / n));
        return { guess, levels, decidedBy, probs, confidence: probs[guess] };
    }

    function replay(data, choices) {
        const rounds = [];
        for (let t = 0; t < choices.length; t++) {
            const p = predict(data, choices.slice(0, t));
            rounds.push({ choice: choices[t], guess: p.guess, win: choices[t] !== p.guess, confidence: p.confidence, decidedBy: p.decidedBy });
        }
        return rounds;
    }

    // Split rounds after the warm-up into blocks of data.block.
    function score(data, choices) {
        const rounds = replay(data, choices);
        const warm = rounds.slice(0, data.warmup);
        const blocks = [];
        for (let s = data.warmup; s < rounds.length; s += data.block) {
            const part = rounds.slice(s, s + data.block);
            blocks.push({ played: part.length, wins: part.filter(r => r.win).length });
        }
        const best = blocks.reduce((m, b) => Math.max(m, b.wins), 0);
        return {
            rounds,
            warmupWins: warm.filter(r => r.win).length,
            blocks,
            best,
            reached: blocks.some(b => b.wins >= data.target),
        };
    }

    // The least-predicted move: not its guess, and the one it rates lowest.
    function beat(data, history) {
        const p = predict(data, history);
        let best = -1;
        p.levels[0].counts.forEach((c, i) => {
            if (i === p.guess) return;
            if (best < 0 || c < p.levels[0].counts[best]) best = i;
        });
        return best;
    }

    // ------------------------------------------------------------------
    // Hints, why, solve
    // ------------------------------------------------------------------

    function contextWords(order) {
        return order === 1 ? 'how often you chose each one'
            : order === 2 ? 'what you chose after your last choice'
                : 'what you chose after your last two choices';
    }

    function shuffleOptions(seed, options, correctIndex) {
        const order = Rift.makeRng(seed || 1).shuffle(options.map((_, i) => i));
        return { options: order.map(i => options[i]), correct: order.indexOf(correctIndex) };
    }

    function whyFor(data) {
        const s = shuffleOptions(data.whyShuffle, [
            data.order === 1 ? 'Only how often you made each choice before.'
                : 'Only how often you made each choice before, and ' + (data.order === 2 ? 'what usually came after your last choice.' : 'what usually came after your last two choices.'),
            'What you were thinking when you chose.',
            'Your personality: what kind of person you are.',
            'The future: which choice you were going to make.',
        ], 0);
        return {
            question: 'What did the machine actually know about you?',
            options: s.options,
            correct: s.correct,
            explain: 'It never saw inside your head. It counted ' + contextWords(data.order) + ', and bet on the biggest count. Its "confidence" was just a ratio of counts. Once you stopped repeating yourself, it had nothing else.',
        };
    }

    function hintsFor(data) {
        const names = data.tieOrder.map(i => data.options[i].label).join(', then ');
        const back = data.order === 3 ? 'what you chose after your last choice alone, then your overall counts'
            : data.order === 2 ? 'your overall counts' : null;
        return [
            'Look at its table before you choose. Which choice does it think is most likely right now?',
            'It always bets on the biggest number in the highlighted row (' + contextWords(data.order) + '). Pick something else, ideally the smallest number.',
            'When numbers are tied, it checks ' + (back ? back + ', and then ' : '') + 'its favourite order: ' + names + '. Or roll the fair ' + (data.options.length === 2 ? 'coin' : 'die') + ': then it can only guess.',
        ];
    }

    function solveFor(data) {
        const choices = [];
        const total = data.warmup + data.target;
        while (choices.length < total) choices.push(beat(data, choices));
        return { choices, debrief: whyFor(data).correct };
    }

    // ------------------------------------------------------------------
    // check
    // ------------------------------------------------------------------

    function checkAnswer(data, answer) {
        if (!data || !answer || typeof answer !== 'object' || !Array.isArray(answer.choices)) {
            return { solved: false, partial: 0, feedback: 'Nothing to check yet.' };
        }
        const n = data.options.length;
        const choices = answer.choices;
        if (!choices.every(c => Number.isInteger(c) && c >= 0 && c < n)) {
            return { solved: false, partial: 0, feedback: 'Some of those choices are not on the board.' };
        }
        if (choices.length > data.warmup + data.block * data.maxBlocks) {
            return { solved: false, partial: 0, feedback: 'That is more rounds than the machine allows.' };
        }
        if (choices.length < data.warmup) {
            return { solved: false, partial: 0, feedback: 'Play the first ' + data.warmup + ' rounds against the machine first.' };
        }
        const sc = score(data, choices);
        // Never trust reported results: the machine replays every round itself.
        const forged = (answer.wins != null && answer.wins !== sc.rounds.filter((r, i) => i >= data.warmup && r.win).length)
            || (Array.isArray(answer.predictions) && (answer.predictions.length !== sc.rounds.length || answer.predictions.some((g, i) => g !== sc.rounds[i].guess)));
        if (forged) {
            return { solved: false, partial: 0, feedback: 'That record does not match the replay. The machine re-checks every guess it made.' };
        }
        if (!sc.reached) {
            const tried = sc.blocks.length ? 'Your best was ' + sc.best + ' of ' + data.block + '; you need ' + data.target + '.' : 'You have not played a round with its brain open yet.';
            return {
                solved: false,
                partial: Math.min(0.6, (sc.best / data.target) * 0.6),
                feedback: tried + ' Look at its table before you choose.',
            };
        }
        const w = whyFor(data);
        if (answer.debrief !== w.correct) {
            return { solved: false, partial: 0.7, feedback: 'You beat the machine! But think again: what did it really know about you?' };
        }
        return { solved: true, partial: 1, feedback: 'You beat it. It only ever knew ' + contextWords(data.order) + '.' };
    }

    // ------------------------------------------------------------------
    // DOM
    // ------------------------------------------------------------------

    const pct = x => Math.round(x * 100) + '%';

    // Drawn stand-in for ui/dice.
    function dieSvg(face) {
        const pips = { 1: [[30, 30]], 2: [[18, 18], [42, 42]], 3: [[18, 18], [30, 30], [42, 42]], 4: [[18, 18], [42, 18], [18, 42], [42, 42]],
            5: [[18, 18], [42, 18], [30, 30], [18, 42], [42, 42]], 6: [[18, 16], [42, 16], [18, 30], [42, 30], [18, 44], [42, 44]] }[face] || [];
        return '<svg viewBox="0 0 60 60" aria-hidden="true"><rect x="4" y="4" width="52" height="52" rx="12" fill="#EFE3C8" stroke="#1A1020" stroke-width="3"/>'
            + pips.map(p => '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="5.2" fill="#1A1020"/>').join('') + '</svg>';
    }
    function coinSvg(side) {
        return '<svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="25" fill="#F2B632" stroke="#1A1020" stroke-width="3"/>'
            + '<circle cx="30" cy="30" r="18" fill="none" stroke="#9a6a10" stroke-width="2"/>'
            + '<text x="30" y="37" font-size="20" font-family="Georgia,serif" font-weight="700" text-anchor="middle" fill="#1A1020">' + (side === 0 ? 'H' : 'T') + '</text></svg>';
    }

    function mount(container, data, api) {
        const el = Rift.el;
        const A = Rift.Assets;
        const sfx = name => { try { if (api && api.sfx) api.sfx(name); } catch (e) { /* sound is optional */ } };
        const say = text => { try { if (api && api.say) api.say(text, 'algorithm'); } catch (e) { /* speech is optional */ } };
        const rnd = () => (api && api.rng ? api.rng.next() : Math.random());
        const n = data.options.length;
        const coin = n === 2;
        const timers = [];
        const later = (fn, ms) => { timers.push(root.setTimeout(fn, ms)); };
        let reduced = false;
        try { reduced = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* ignore */ }
        const T = ms => (reduced ? Math.min(ms, 150) : ms);

        const st = {
            phase: 'play1',      // play1 → reveal → play2 → debrief → done   (+ 'blockover')
            history: [],
            rounds: [],          // replayed info for the UI (the check replays on its own)
            pred: null,
            busy: false,
            blockStart: WARMUP,
            debriefPick: null,
        };

        const g = i => data.options[i].glyph;
        // Rift.el assigns style objects with Object.assign, which skips custom properties.
        const hue = (node, colour) => { node.style.setProperty('--hue', colour); node.classList.add('pm-hued'); return node; };
        const ctxText = ctx => (ctx == null ? 'not enough data yet' : ctx.length ? 'after ' + ctx.map(g).join(' then ') : 'overall');

        // ---- frame ----
        const scoreEl = el('div.pm-score');
        const piecesEl = el('span.pm-pieces');
        const top = el('div.pm-top', null, [
            el('span.chip', { dataset: { colour: 'memory' }, text: Rift.COLOURS.memory.icon + ' The Prediction Machine' }),
            piecesEl,
            el('span.pm-spacer'),
            scoreEl,
        ]);

        const machineImg = A && A.img ? A.img('npc/algorithm/core', { className: 'pm-algo' }) : el('span.pm-algo');
        const bubble = el('div.pm-bubble');
        const machine = el('div.pm-machine', null, [machineImg, bubble]);

        const guessCard = el('div.pm-card.pm-guess', null, [
            el('div.pm-card-inner', null, [
                el('div.pm-face.pm-front', null, [el('div.pm-lock', { text: '🔒' }), el('div.pm-facecap', { text: 'Guess locked' })]),
                el('div.pm-face.pm-back'),
            ]),
        ]);
        const yourCard = el('div.pm-card.pm-yours', null, [el('div.pm-face.pm-plain', null, [el('div.pm-facecap', { text: 'Your move' })])]);
        const resultEl = el('div.pm-result');
        const duel = el('div.pm-duel', null, [
            el('div.pm-slot', null, [el('div.pm-slotcap', { text: 'Its guess' }), guessCard]),
            el('div.pm-vs', { text: 'vs' }),
            el('div.pm-slot', null, [el('div.pm-slotcap', { text: 'You' }), yourCard]),
        ]);

        const promptEl = el('div.pm-prompt', { text: data.prompt });
        const optionBtns = data.options.map((o, i) => hue(el('button.pm-opt', {
            onclick: () => choose(i),
            disabled: true,
        }, [el('span.pm-optglyph', { text: o.glyph }), el('span.pm-optlabel', { text: o.label })]), o.hue));
        const optionsEl = el('div.pm-options', null, optionBtns);

        const dieFace = el('span.pm-die', { html: coin ? coinSvg(0) : dieSvg(5) });
        if (A && A.has && A.has('ui/dice')) { dieFace.innerHTML = ''; dieFace.appendChild(A.img('ui/dice', { className: 'pm-dieart' })); }
        const dieMap = coin ? 'H = ' + g(0) + ' · T = ' + g(1) : '1–2 ' + g(0) + ' · 3–4 ' + g(1) + ' · 5–6 ' + g(2);
        const dieBtn = el('button.btn.small.pm-diebtn', { onclick: () => roll() }, [dieFace, el('span', { text: coin ? 'Flip a fair coin' : 'Roll a fair die' })]);
        const dieNote = el('span.pm-dienote', { text: dieMap });
        const toolsEl = el('div.pm-tools', null, [dieBtn, dieNote]);
        const historyEl = el('div.pm-history');
        const statusEl = el('div.pm-status');

        const panel = el('div.pm-panel'); // reveal / block over / debrief
        const arena = el('div.pm-arena', null, [machine, duel]);
        const body = el('div.pm-stagebody', null, [arena, resultEl, promptEl, optionsEl, toolsEl, historyEl, statusEl]);
        const stage = el('div.pm-stage', null, [body, panel]);

        const brain = el('div.pm-brain');
        const main = el('div.pm-main', null, [stage, brain]);
        const rootEl = el('div.pm-root', null, [top, main]);
        try { if (root.getComputedStyle(container).position === 'static') container.style.position = 'relative'; } catch (e) { /* ignore */ }
        container.appendChild(rootEl);

        function setStatus(text, tone) {
            statusEl.textContent = text || '';
            statusEl.className = 'pm-status' + (tone ? ' ' + tone : '');
        }
        function speak(text) {
            bubble.textContent = text;
            bubble.classList.remove('pop');
            void bubble.offsetWidth;
            bubble.classList.add('pop');
        }

        // ---- scoreboard and pieces ----
        function phaseRounds() {
            return st.phase === 'play1' || st.phase === 'reveal' ? st.rounds.slice(0, WARMUP) : st.rounds.slice(st.blockStart);
        }
        function renderTop() {
            const inPlay3 = st.history.length >= WARMUP && st.phase !== 'reveal';
            const pieces = !inPlay3
                ? ['it guesses first', 'its guess is locked before you pick', 'you win when it is wrong']
                : ['read its brain', 'or use a fair ' + (coin ? 'coin' : 'die'), 'win ' + data.target + ' of ' + BLOCK];
            piecesEl.innerHTML = '';
            pieces.forEach(t => piecesEl.appendChild(el('span.pm-piece', { text: t })));
            const rs = phaseRounds();
            const you = rs.filter(r => r.win).length;
            const it = rs.length - you;
            scoreEl.innerHTML = '';
            const roundNo = Math.min(rs.length + (st.awaiting ? 1 : 0), inPlay3 ? BLOCK : WARMUP);
            scoreEl.appendChild(el('span.pm-round', { text: 'Round ' + Math.max(1, roundNo) + ' / ' + (inPlay3 ? BLOCK : WARMUP) }));
            scoreEl.appendChild(el('span.pm-tally.it', { text: 'Machine ' + it }));
            scoreEl.appendChild(el('span.pm-tally.you', { text: 'You ' + you }));
            if (inPlay3) {
                const pips = el('span.pm-pips', { title: 'Wins needed: ' + data.target });
                for (let i = 0; i < data.target; i++) pips.appendChild(el('span.pm-pip' + (i < you ? '.on' : '')));
                scoreEl.appendChild(pips);
            }
            historyEl.innerHTML = '';
            rs.forEach(r => historyEl.appendChild(hue(el('span.pm-hchip' + (r.win ? '.won' : '.lost'), {
                text: g(r.choice), title: r.win ? 'It guessed ' + data.options[r.guess].label + ': you won' : 'It guessed right',
            }), data.options[r.choice].hue)));
        }

        // ---- the brain ----
        function allContexts(len) {
            let out = [[]];
            for (let i = 0; i < len; i++) {
                const next = [];
                out.forEach(c => data.options.forEach((_, j) => next.push(c.concat(j))));
                out = next;
            }
            return out;
        }
        function cellProb(c, total) {
            return data.smoothing ? (c + 1) / (total + n) : total ? c / total : null;
        }

        function explain(p) {
            const name = g(p.guess);
            const L = p.levels.find(l => l.k === p.decidedBy);
            if (L) {
                const top = p.levels[0];
                const stat = 'you chose ' + name + ' ' + L.counts[p.guess] + ' of ' + L.total + ' times';
                if (L === top) {
                    const text = (L.ctx.length ? ctxText(L.ctx) + ', ' : '') + stat + (L.ctx.length ? '' : ' so far') + ', more than anything else.';
                    return text.charAt(0).toUpperCase() + text.slice(1);
                }
                const why = top.ctx == null ? 'Not enough data yet for its main table' : 'Tied ' + ctxText(top.ctx);
                return why + ', so it looked ' + ctxText(L.ctx) + ': ' + stat + '.';
            }
            const any = p.levels.some(l => l.total > 0);
            return (any ? 'Still tied, so it used its favourite: ' : 'No data yet, so it used its favourite: ') + name + '.';
        }
        function confText(p) {
            const top = p.levels[0];
            const c = top.counts[p.guess];
            if (data.smoothing) return pct(p.confidence) + ' sure = (' + c + ' + 1) ÷ (' + top.total + ' + ' + n + ')';
            if (!top.total) return pct(p.confidence) + ' sure = a blind guess between ' + n;
            return pct(p.confidence) + ' sure = ' + c + ' ÷ ' + top.total;
        }

        function renderBrain() {
            brain.innerHTML = '';
            if (st.phase === 'play1') {
                brain.className = 'pm-brain locked';
                brain.appendChild(el('div.pm-brainhead', { text: "The machine's brain" }));
                brain.appendChild(el('div.pm-sealed', null, [
                    el('div.pm-sealicon', { text: '🔒' }),
                    el('div', { text: 'Sealed until round ' + WARMUP + '.' }),
                    el('div.muted.small', { text: 'It claims it can read your mind.' }),
                ]));
                return;
            }
            brain.className = 'pm-brain' + (st.phase === 'reveal' ? ' opening' : '');
            brain.appendChild(el('div.pm-brainhead', { text: "The machine's brain" }));
            const rules = el('div.pm-rules', null, [
                el('span.pm-piece', { text: '1. count ' + contextWords(data.order) }),
                el('span.pm-piece', { text: '2. bet on the biggest count' }),
                el('span.pm-piece', { text: '3. "confidence" = ' + (data.smoothing ? '(count + 1) ÷ (total + ' + n + ')' : 'count ÷ total') }),
            ]);
            brain.appendChild(rules);

            // the table for the model's own order; the row it is using now glows
            const k = data.order;
            const h = st.history;
            const curCtx = h.length >= k - 1 ? h.slice(h.length - (k - 1)) : null;
            const table = el('table.pm-table');
            const head = el('tr', null, [el('th', { text: k === 1 ? '' : 'After' })]
                .concat(data.options.map(o => hue(el('th', null, [el('span.pm-thglyph', { text: o.glyph })]), o.hue))));
            table.appendChild(el('thead', null, [head]));
            const tbody = el('tbody');
            let unseen = 0;
            allContexts(k - 1).forEach(ctx => {
                const r = countsAfter(h, ctx, n);
                const isCur = curCtx && ctx.length === curCtx.length && ctx.every((v, i) => v === curCtx[i]);
                // the trigram table only lists pairs it has seen, so it stays short
                if (k >= 3 && !r.total && !isCur) { unseen++; return; }
                const max = Math.max(...r.counts);
                // a unique biggest count glows (not at difficulty 3: read the numbers)
                const glow = isCur && r.total && data.difficulty < 3 && r.counts.filter(c => c === max).length === 1;
                const tr = el('tr' + (isCur ? '.cur' : ''), null, [el('th', { text: k === 1 ? 'All your choices' : ctx.map(g).join(' ') })]);
                r.counts.forEach(c => {
                    const p = cellProb(c, r.total);
                    tr.appendChild(el('td' + (glow && c === max ? '.max' : ''), null, [
                        el('span.pm-count', { text: String(c) }),
                        el('span.pm-prob', { text: p == null ? '–' : pct(p) }),
                    ]));
                });
                tbody.appendChild(tr);
            });
            if (unseen) {
                tbody.appendChild(el('tr.pm-unseen', null, [el('td', { colSpan: n + 1, text: unseen + ' other pair' + (unseen > 1 ? 's' : '') + ': not seen yet (all 0)' })]));
            }
            table.appendChild(tbody);
            brain.appendChild(el('div.pm-tablewrap', null, [table]));

            // fallback lines for ties
            const p = predict(data, h);
            const fall = el('div.pm-fallback');
            p.levels.slice(1).forEach(L => {
                fall.appendChild(el('div', { text: 'If tied, ' + ctxText(L.ctx) + ': ' + L.counts.map((c, i) => g(i) + ' ' + c).join(' · ') }));
            });
            fall.appendChild(el('div', { text: 'Still tied? Its favourite: ' + data.tieOrder.map(g).join(' > ') }));
            brain.appendChild(fall);

            if (st.phase === 'reveal') {
                const log = el('div.pm-log');
                log.appendChild(el('div.pm-loghead', { text: 'What it did in rounds 1–' + WARMUP }));
                st.rounds.slice(0, WARMUP).forEach((r, i) => {
                    const row = el('div.pm-logrow' + (r.win ? '.won' : '.lost'), { style: { animationDelay: (reduced ? 0 : i * 0.18) + 's' } }, [
                        el('span.pm-logn', { text: 'R' + (i + 1) }),
                        el('span.pm-logwhy', { text: r.explain }),
                        el('span.pm-logres', { text: 'guessed ' + g(r.guess) + ' (' + pct(r.confidence) + '), you ' + g(r.choice) + (r.win ? ' ✓' : ' ✗') }),
                    ]);
                    log.appendChild(row);
                });
                brain.appendChild(log);
            } else if (st.lastShown) {
                brain.appendChild(el('div.pm-last', null, [
                    el('div.pm-loghead', { text: 'Last round' }),
                    el('div', { text: st.lastShown.explain }),
                    el('div.pm-conf', { text: 'It was ' + st.lastShown.conf }),
                ]));
            }
        }

        // ---- rounds ----
        function resetCards() {
            const inner = guessCard.querySelector('.pm-card-inner');
            inner.style.transition = 'none';
            guessCard.classList.remove('flipped', 'right', 'wrong');
            void inner.offsetWidth;
            inner.style.transition = '';
            guessCard.classList.add('locking');
            guessCard.querySelector('.pm-back').innerHTML = '';
            yourCard.innerHTML = '';
            yourCard.className = 'pm-card pm-yours';
            yourCard.appendChild(el('div.pm-face.pm-plain', null, [el('div.pm-facecap', { text: 'Your move' })]));
            resultEl.textContent = '';
            resultEl.className = 'pm-result';
        }

        function startRound() {
            st.busy = true;
            st.awaiting = true;
            st.pred = predict(data, st.history);
            resetCards();
            optionBtns.forEach(b => { b.disabled = true; });
            dieBtn.disabled = true;
            toolsEl.classList.toggle('show', st.phase === 'play2');
            renderTop();
            renderBrain();
            later(() => {
                guessCard.classList.remove('locking');
                st.busy = false;
                optionBtns.forEach(b => { b.disabled = false; });
                dieBtn.disabled = false;
                setStatus('Its guess is locked in. Your move.');
                renderTop();
            }, T(550));
        }

        const TAUNT_WIN = ['Predictable.', 'I knew it.', 'You are so easy to read.', 'As expected.', 'My numbers never lie.'];
        const TAUNT_LOSE = ['Unexpected…', 'Recalculating.', 'That was… improbable.', 'Hm. Noise.', 'My data did not say that.'];

        function choose(i) {
            if (st.busy || !(st.phase === 'play1' || st.phase === 'play2')) return;
            st.busy = true;
            st.awaiting = false;
            sfx('place');
            optionBtns.forEach((b, j) => { b.disabled = true; b.classList.toggle('picked', j === i); });
            dieBtn.disabled = true;
            const p = st.pred;
            const win = i !== p.guess;
            st.rounds.push({ choice: i, guess: p.guess, win, confidence: p.confidence, explain: explain(p) });
            st.history.push(i);

            yourCard.innerHTML = '';
            yourCard.appendChild(hue(el('div.pm-face.pm-plain', null, [
                el('div.pm-bigglyph', { text: g(i) }), el('div.pm-facecap', { text: data.options[i].label })]), data.options[i].hue));
            const back = guessCard.querySelector('.pm-back');
            hue(back, data.options[p.guess].hue);
            back.appendChild(el('div.pm-bigglyph', { text: g(p.guess) }));
            back.appendChild(el('div.pm-facecap', { text: pct(p.confidence) + ' sure' }));

            later(() => {
                guessCard.classList.add('flipped', win ? 'wrong' : 'right');
                yourCard.classList.add(win ? 'won' : 'lost');
                resultEl.textContent = win ? 'It guessed wrong. Point to you!' : 'It predicted you. Point to the machine.';
                resultEl.className = 'pm-result ' + (win ? 'good' : 'bad');
                speak(win ? TAUNT_LOSE[Math.floor(rnd() * TAUNT_LOSE.length)] : TAUNT_WIN[Math.floor(rnd() * TAUNT_WIN.length)]);
                sfx(win ? 'success' : 'error');
                if (st.phase === 'play2') st.lastShown = { explain: explain(p), conf: confText(p) };
                renderTop();
                if (st.phase === 'play2') renderBrain();
            }, T(380));
            later(afterRound, T(1500));
        }

        function afterRound() {
            optionBtns.forEach(b => b.classList.remove('picked'));
            if (st.phase === 'play1') {
                if (st.history.length >= WARMUP) return openReveal();
                return startRound();
            }
            const block = st.rounds.slice(st.blockStart);
            const wins = block.filter(r => r.win).length;
            if (wins >= data.target) return openDebrief();
            const left = BLOCK - block.length;
            if (left <= 0 || wins + left < data.target) return blockOver(wins);
            startRound();
        }

        function roll() {
            if (st.busy || st.phase !== 'play2') return;
            st.busy = true;
            dieBtn.disabled = true;
            optionBtns.forEach(b => { b.disabled = true; });
            sfx('click');
            const face = coin ? (rnd() < 0.5 ? 0 : 1) : 1 + Math.floor(rnd() * 6);
            const pick = coin ? face : Math.floor((face - 1) / 2);
            dieFace.classList.add('rolling');
            later(() => {
                dieFace.classList.remove('rolling');
                if (!dieFace.querySelector('.pm-dieart')) dieFace.innerHTML = coin ? coinSvg(face) : dieSvg(face);
                setStatus((coin ? 'The coin says ' : 'The die shows ' + face + ': ') + data.options[pick].label + '.');
                st.busy = false;
                choose(pick);
            }, T(650));
        }

        // ---- panels ----
        function showPanel(children, cls) {
            panel.innerHTML = '';
            panel.className = 'pm-panel show' + (cls ? ' ' + cls : '');
            children.forEach(c => panel.appendChild(c));
        }
        function hidePanel() { panel.className = 'pm-panel'; panel.innerHTML = ''; }

        function openReveal() {
            st.phase = 'reveal';
            const it = st.rounds.slice(0, WARMUP).filter(r => !r.win).length;
            sfx('click');
            renderTop();
            renderBrain();
            const line = 'It predicted you ' + it + ' times out of ' + WARMUP + '.';
            speak(it >= WARMUP / 2 ? 'I know you better than you know yourself.' : 'A lucky streak. Nothing more.');
            say('Behold my mind. ' + line);
            showPanel([
                el('div.pm-panelhead', { text: 'Its brain is open' }),
                el('div', { text: line }),
                el('div.pm-panelpieces', null, [
                    el('span.pm-piece', { text: 'it never saw you' }),
                    el('span.pm-piece', { text: 'it counted ' + contextWords(data.order) }),
                    el('span.pm-piece', { text: 'then bet on the biggest number' }),
                ]),
                el('div.muted.small', { text: 'Read the log on the right. Now play ' + BLOCK + ' more rounds with its brain open: win ' + data.target + ' of them.' }),
                el('button.btn.gold', { text: 'Now beat it →', onclick: () => { hidePanel(); startPlay2(); } }),
            ], 'reveal');
            setStatus('');
        }

        function startPlay2() {
            st.phase = 'play2';
            st.blockStart = st.history.length;
            st.lastShown = null;
            sfx('click');
            say('Very well. Try to surprise me. I am still counting.');
            speak('I am still counting.');
            startRound();
        }

        function blockOver(wins) {
            st.phase = 'blockover';
            renderTop();
            const used = st.history.length - WARMUP;
            const canGoOn = used + BLOCK <= BLOCK * MAX_BLOCKS;
            speak('Predictable after all.');
            showPanel([
                el('div.pm-panelhead', { text: 'The machine takes this one' }),
                el('div', { text: 'You won ' + wins + '; you need ' + data.target + ' of ' + BLOCK + '.' }),
                el('div.muted.small', { text: 'Look at the glowing row before you choose: it bets on the biggest number there. Or let the ' + (coin ? 'coin' : 'die') + ' choose.' }),
                canGoOn
                    ? el('button.btn.gold', { text: 'Play another ' + BLOCK, onclick: () => { hidePanel(); startPlay2(); } })
                    : el('button.btn', { text: 'Hand in the record', onclick: () => send(null) }),
            ], 'over');
        }

        function openDebrief() {
            st.phase = 'debrief';
            renderTop();
            const w = whyFor(data);
            speak('Impossible. How did you…');
            say('Impossible. My numbers were perfect.');
            const opts = w.options.map((text, i) => el('button.pm-why', { text, onclick: () => send(i) }));
            showPanel([
                el('div.pm-panelhead', { text: 'You beat it!' }),
                el('div.pm-question', { text: w.question }),
                el('div.pm-whys', null, opts),
            ], 'debrief');
            setStatus('');
        }

        function send(debrief) {
            if (st.phase === 'done') return;
            sfx('click');
            const answer = { choices: st.history.slice(), debrief };
            let r = null;
            try { r = api && api.submit ? api.submit(answer) : null; } catch (e) { console.error('[prediction]', e); }
            const show = res => {
                if (!res) return;
                if (res.solved) {
                    st.phase = 'done';
                    sfx('success');
                    const w = whyFor(data);
                    speak('I only… counted.');
                    showPanel([
                        el('div.pm-panelhead', { text: 'It only counted' }),
                        el('div', { text: w.explain }),
                    ], 'done');
                    setStatus(res.feedback, 'good');
                } else {
                    sfx('error');
                    setStatus(res.feedback, 'bad');
                    panel.querySelectorAll('.pm-why').forEach((b, i) => { if (i === debrief) b.classList.add('wrong'); });
                }
            };
            if (r && typeof r.then === 'function') r.then(show, () => {}); else show(r);
        }

        // ---- go ----
        speak('I will guess your choice before you make it.');
        say('I know you. I will guess your choice before you make it. Go on: try to surprise me.');
        startRound();

        return {
            destroy() {
                timers.forEach(id => root.clearTimeout(id));
                if (rootEl.parentNode) rootEl.parentNode.removeChild(rootEl);
            },
        };
    }

    // ------------------------------------------------------------------

    const def = {
        id: 'prediction',
        name: 'The Prediction Machine',
        colour: 'memory',
        family: 'Pattern breakers',
        blurb: 'The Algorithm says it can read your mind. Each round it locks in a guess before you choose. Can you surprise it?',
        tok: 'A prediction machine does not know you: it counts what you did before and bets on the most frequent pattern. Its "confidence" is just a ratio, and once you understand the counting, you can beat it.',

        generate(rng, difficulty) {
            const d = Math.max(1, Math.min(3, Math.round(Number(difficulty) || 1)));
            const s = SETTINGS[d];
            const theme = rng.pick(s.n === 2 ? THEMES2 : THEMES3);
            const options = theme.options.map(o => ({ label: o.label, glyph: o.glyph, hue: o.hue }));
            return {
                difficulty: d,
                theme: theme.id,
                prompt: theme.prompt,
                options,
                order: s.order,
                smoothing: s.smoothing,
                warmup: WARMUP,
                block: BLOCK,
                maxBlocks: MAX_BLOCKS,
                target: s.target,
                tieOrder: rng.shuffle(options.map((_, i) => i)),
                whyShuffle: rng.int(1, 1e6),
            };
        },

        check: checkAnswer,
        hints: hintsFor,
        why: whyFor,
        solve: solveFor,
        mount,

        // exposed for tests and tools
        internals: { SETTINGS, THEMES2, THEMES3, countsAfter, predict, replay, score, beat },
    };

    Rift.Puzzles.register(def);
})(typeof window !== 'undefined' ? window : globalThis);
