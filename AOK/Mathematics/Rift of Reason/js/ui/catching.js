/* Adventure and practice share these games: finite-move native-button puzzles, and the two
 * real-time games drawn by Rift.CatchArcadeView (js/ui/catch-arcade.js). */
(function (root) {
    'use strict';
    const Rift = root.Rift, games = Rift.CatchGames, arcadeKinds = Rift.CatchArcade ? Rift.CatchArcade.KINDS : [];
    const el = (...a) => Rift.el(...a);
    const amount = (n, word) => n + ' ' + word + (n === 1 ? '' : 's');
    const RULES = {
        net: 'Drag or tap to grow a net. Close off the field.',
        burst: 'Tap or hold to throw. Break every shard.',
        lure: 'Turn pieces to lead the light from IN to OUT.',
        tracks: 'Numbers count snares nearby. Open the rest.',
        picture: 'Slide pieces into the gap to rebuild the picture.',
    };
    function mount(container, o) {
        let board = o.board, phase = o.board.done ? 'ended' : o.started ? 'paused' : 'ready', destroyed = false;
        let flagMode = false, view = null, hintRefused = -1;
        const arcade = arcadeKinds.includes(board.kind);
        const game = el('div.catch-game.stack'), status = el('p.catch-status', { role: 'status', 'aria-live': 'polite' });
        const budget = el('p.catch-budget');
        const play = el('button.btn.catch-play', { type: 'button', onclick: toggle });
        const field = el('div.catch-field'), controls = el('div.catch-controls');
        const result = el('div.catch-result');
        // Every game teaches through the board itself: one line, then a highlight, ghost net or aim line.
        const rules = el('p.catch-rule', { text: RULES[board.kind] });
        if (arcade) game.classList.add('catch-game-arcade');
        game.append(el('h3', { text: games.NAMES[board.kind] }), result, rules, el('div.catch-toolbar.row.wrap', null, [budget, play]), field, controls, status);
        container.append(game);
        if (arcade) view = Rift.CatchArcadeView.mount(field, controls, {
            board, species: o.species, calm: o.calm,
            active,
            say(text) { status.textContent = text; },
            onAction(action) {
                if (destroyed) return { ok: false };
                const result = o.onAction(action);
                if (!result.ok) { status.textContent = result.error; if (phase === 'running') phase = 'paused'; refresh(); return result; }
                board = result.board;
                return result;
            },
            onEnd() { finish(); },
            onPause() { if (phase === 'running') toggle(); },
        });
        function beast() {
            const node = el('span.catch-beast');
            if (Rift.Assets) node.append(Rift.Assets.img('creature/' + (o.species || 'astrophysicat') + '/idle', { label: 'The visiting beast' }));
            return node;
        }
        // Before Start, one thing on the board is outlined to show the rule (static, no motion).
        function demo() { return phase === 'ready' && !board.done; }
        function active() { return !destroyed && phase === 'running' && !board.done; }
        function finish() {
            phase = 'ended';
            status.textContent = board.done === 'caught' ? 'You did it! The creature is caught.' : board.kind === 'tracks' ? 'No hearts left. The creature escaped.'
                : board.kind === 'net' ? (board.lives > 0 ? 'Time ran out. The creature escaped.' : 'No spare nets left. The creature escaped.')
                    : board.kind === 'burst' ? (board.lives > 0 ? 'Time ran out. The creature escaped.' : 'No shields left. The creature escaped.') : 'No moves left. The creature escaped.';
            refresh();
            if (o.onFinish) o.onFinish(board.done);
        }
        function toggle() {
            if (destroyed || board.done) return;
            if (phase === 'ready') {
                const result = o.onStart();
                if (!result.ok) { status.textContent = result.error; return; }
                board = result.board;
                if (view) view.load(board);
            }
            phase = phase === 'running' ? 'paused' : 'running';
            refresh();
            if (view) { if (phase === 'running') view.resume(); else view.pause(); }
        }
        function act(action) {
            if (!active()) return;
            const result = o.onAction(action);
            if (!result.ok) {
                // A hint is refused only when no win fits the moves left.
                if (action.hint) { hintRefused = board.turn; status.textContent = 'No hint: no win fits the moves left.'; refresh(); return; }
                status.textContent = result.error; return;
            }
            board = result.board;
            if (board.kind === 'lure') status.textContent = 'Gold shows the lit trail. ' + amount(board.moves - board.turn, 'turn') + ' left.';
            else if (board.kind === 'picture') status.textContent = result.hint != null ? 'Slide the piece marked Next.' : amount(board.moves - board.turn, 'move') + ' left.';
            else status.textContent = result.hit ? 'A snare! One trap heart used.' : action.flag ? (board.flags.includes(action.cell) ? 'Flagged.' : 'Flag removed.') : 'Safe.';
            if (board.done) { finish(); return; }
            refresh();
            // Keep keyboard focus on the board: after a hint, on the piece it marks.
            if (result.hint != null) { const marked = game.querySelector('[data-catch-key="picture-' + board.hint + '"]'); if (marked) marked.focus(); }
        }
        function refresh() {
            result.replaceChildren(...(board.done ? [Rift.resultBanner(board.done === 'caught' ? 'won' : 'lost', board.done === 'caught' ? 'You won!' : 'It escaped this time.', board.done === 'caught' ? 'You caught the creature.' : 'Try a different plan.')] : []));
            const focus = root.document.activeElement;
            const key = focus && focus.getAttribute && focus.getAttribute('data-catch-key');
            play.textContent = phase === 'ready' ? o.startLabel || 'Start · 1 charm' : phase === 'running' ? 'Pause' : phase === 'paused' ? 'Resume' : 'Finished';
            play.disabled = !!board.done;
            if (view) { budget.hidden = true; return; }
            budget.textContent = board.kind === 'lure' ? amount(board.moves - board.turn, 'turn') + ' left'
                    : board.kind === 'picture' ? amount(board.moves - board.turn, 'move') + ' left'
                    : amount(board.lives - board.mistakes, 'trap heart') + ' · ' + amount(board.traps.length, 'snare') + ' · safe ' + board.open.length + '/' + (board.size ** 2 - board.traps.length);
            field.innerHTML = ''; controls.innerHTML = '';
            if (board.kind === 'lure') drawLure();
            else if (board.kind === 'picture') drawPicture();
            else drawTracks();
            if (key) {
                const same = game.querySelector('[data-catch-key="' + key + '"]');
                if (same && !same.disabled) same.focus();
            }
        }
        function drawLure() {
            const light = games.lightPath(board), names = ['north', 'east', 'south', 'west'];
            const first = demo() && (games.solve(board) || [])[0];
            field.append(el('p.catch-endpoint', { text: '✦ IN → lantern light' }));
            const grid = el('div.catch-lure-board', { 'aria-label': 'Four by four lantern trail. Light enters the top left from the west; reach the bottom right east exit. Arrow keys move. Enter or Space turns a piece clockwise.' });
            for (let cell = 0; cell < 16; cell++) {
                const ends = games.ports(board.tiles[cell]), xy = [[50, 0], [100, 50], [50, 100], [0, 50]];
                const lit = light.path.includes(cell), points = ends.map(d => xy[d]);
                const d = 'M' + points[0].join(' ') + ' L50 50 L' + points[1].join(' ');
                const button = el('button.catch-trail' + (lit ? '.lit' : '') + (first && first.cell === cell ? '.demo' : ''), {
                    type: 'button', disabled: !active(), 'data-catch-key': 'trail-' + cell,
                    'aria-label': 'Row ' + (Math.floor(cell / 4) + 1) + ', column ' + (cell % 4 + 1) + ': ' + ends.map(d => names[d]).join(' to ') + (lit ? ', lit' : '') + (first && first.cell === cell ? ', example: turn this one first' : '') + '. Turn clockwise',
                    html: '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="' + d + '" fill="none" stroke="#17251f" stroke-width="28"/><path d="' + d + '" fill="none" stroke="' + (lit ? '#ffe39c' : '#a9bdb0') + '" stroke-width="14" stroke-linejoin="round"/><circle cx="50" cy="50" r="7" fill="#443623"/></svg>',
                    onclick() { act({ cell }); },
                    onkeydown(ev) {
                        const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -4, ArrowDown: 4 }[ev.key];
                        if (delta != null) { ev.preventDefault(); grid.children[Math.max(0, Math.min(15, cell + delta))].focus(); }
                    },
                });
                grid.append(button);
            }
            field.append(grid, el('p.catch-endpoint.exit', null, ['beast → OUT ✦ ', beast()]));
        }
        function drawPicture() {
            const legal = games.pictureMoves(board), gap = board.tiles.indexOf(0);
            function scene() {
                const node = el('span.catch-picture-scene');
                if (Rift.Assets) node.append(Rift.Assets.img('creature/' + (o.species || 'astrophysicat') + '/idle', { label: 'Creature picture' }));
                return node;
            }
            function slide(cell) {
                if (!active()) return;
                if (!legal.includes(cell)) { status.textContent = 'Choose a piece beside the empty space.'; return; }
                act({ cell });
            }
            const grid = el('div.catch-picture-board', {
                role: 'group', tabindex: 0, 'data-catch-key': 'picture-board',
                'aria-label': 'Three by three creature picture. Empty space at row ' + (Math.floor(gap / 3) + 1) + ', column ' + (gap % 3 + 1) + '. Arrow keys move the empty space.',
                onkeydown(ev) {
                    if (!active()) return;
                    const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 }[ev.key];
                    if (delta != null) { ev.preventDefault(); if (legal.includes(gap + delta)) slide(gap + delta); }
                },
            });
            for (let cell = 0; cell < 9; cell++) {
                const value = board.tiles[cell], movable = !board.done && legal.includes(cell), complete = board.done === 'caught';
                const button = el('button.catch-picture-tile' + (!value ? '.gap' : '') + (movable ? '.movable' : '') + (board.hint === cell && !board.done ? '.hinted' : ''), {
                    type: 'button', disabled: !active(), 'aria-disabled': String(!active() || !movable), 'data-catch-key': 'picture-' + cell,
                    'aria-label': 'Row ' + (Math.floor(cell / 3) + 1) + ', column ' + (cell % 3 + 1) + ': ' + (value ? 'piece ' + value + (board.hint === cell ? ', the hinted next slide' : '') + (movable ? ', slide into the empty space' : ', not beside the empty space') : 'empty space'),
                    onclick() { slide(cell); },
                });
                if (value || complete) {
                    const fragment = scene(), index = value ? value - 1 : 8;
                    fragment.style.left = -(index % 3) * 100 + '%';
                    fragment.style.top = -Math.floor(index / 3) * 100 + '%';
                    button.append(fragment);
                    if (!complete) button.append(el('span.catch-piece-number', { text: String(value) }));
                    if (board.hint === cell && !complete) button.append(el('span.catch-hint-mark', { text: 'Next' }));
                } else button.append(el('span.catch-empty-mark', { text: 'Empty' }));
                grid.append(button);
            }
            field.append(grid);
            const reference = el('div.catch-picture-reference', { role: 'img', 'aria-label': 'Finished picture to match. Pieces 1 to 8 run left to right, top to bottom; the gap finishes bottom right.' }, [scene()]);
            controls.append(reference);
            if (board.hints > 0 || board.hint != null) controls.append(el('button.btn.small.catch-hint', {
                type: 'button', text: 'Hint (' + (board.hints || 0) + ')', 'data-catch-key': 'hint', disabled: !active() || board.hint != null || !(board.hints > 0) || hintRefused === board.turn,
                'aria-label': 'Hint: show the next slide. ' + (board.hints || 0) + ' left. Hints use no moves.',
                onclick() { if (active()) act({ hint: true }); },
            }));
        }
        function drawTracks() {
            controls.append(el('button.btn.small', { type: 'button', text: 'Flag mode: ' + (flagMode ? 'on' : 'off'), 'aria-pressed': String(flagMode), 'data-catch-key': 'flags', disabled: !active(),
                onclick() { if (!active()) return; flagMode = !flagMode; refresh(); } }));
            const grid = el('div.catch-tracks-board', { 'aria-label': board.size + ' by ' + board.size + ' trail board. Numbers count snares in the 8 touching patches. Arrow keys move, Enter opens, F flags.' });
            // Before Start: ring one number and the hidden patches it counts.
            const shown = demo() ? board.open.find(c => games.clue(board, c) > 0) : null;
            const ring = shown == null ? [] : games.neighbours(board, shown).filter(c => !board.open.includes(c)).concat(shown);
            grid.style.gridTemplateColumns = 'repeat(' + board.size + ', 1fr)';
            for (let cell = 0; cell < board.size ** 2; cell++) {
                const open = board.open.includes(cell), flagged = board.flags.includes(cell), hit = (board.hits || []).includes(cell), value = open ? games.clue(board, cell) : null;
                const button = el('button.catch-track' + (open ? '.open' : '') + (flagged ? '.flagged' : '') + (hit ? '.hit' : '') + (ring.includes(cell) ? (cell === shown ? '.demo-number' : '.demo') : ''), {
                    type: 'button', text: open ? value || '♧' : hit ? '✕' : flagged ? '⚑' : '', 'data-catch-key': 'tile-' + cell,
                    'aria-label': 'Row ' + (Math.floor(cell / board.size) + 1) + ', column ' + (cell % board.size + 1) + ': ' + (open ? value + ' touching snares' : hit ? 'opened snare' : flagged ? 'flagged' : 'unopened') + (cell === shown ? ', example number' : ring.includes(cell) ? ', counted by the example number' : ''),
                    'aria-disabled': String(!active() || open || hit), disabled: !active(),
                    onclick() { if (!open && !hit) act({ cell, flag: flagMode }); },
                    onkeydown(ev) {
                        if (!active()) return;
                        if (ev.key.toLowerCase() === 'f' && !open && !hit) { ev.preventDefault(); act({ cell, flag: true }); return; }
                        const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -board.size, ArrowDown: board.size }[ev.key];
                        if (delta != null) {
                            ev.preventDefault();
                            const target = Math.max(0, Math.min(board.size ** 2 - 1, cell + delta));
                            const next = grid.children[target]; if (next) next.focus();
                        }
                    },
                });
                grid.append(button);
            }
            field.append(grid);
        }
        refresh();
        return { destroy() { destroyed = true; phase = 'ended'; if (view) view.destroy(); }, board() { return board; }, view: () => view };
    }
    Rift.CatchGame = { mount, RULES };
})(typeof window !== 'undefined' ? window : globalThis);
